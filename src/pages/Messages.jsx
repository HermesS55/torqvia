import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Send, MessageCircle, Search, ArrowLeft, Check, CheckCheck, X, Smile, Trash2, SearchIcon, Image as ImageIcon, ZoomIn, Play } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { uploadPostImage, uploadPostVideo } from '../lib/avatar'
import UserAvatar from '../components/ui/UserAvatar'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { sanitizeText, validateImageFile } from '../lib/security'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🔥', '🚗', '🏎️', '⚡']

function DateSeparator({ date, lang }) {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isYesterday = new Date(now - 86400000).toDateString() === d.toDateString()
  const locale = lang === 'tr' ? 'tr-TR' : 'en-US'
  const label = isToday ? (lang === 'tr' ? 'Bugün' : 'Today') : isYesterday ? (lang === 'tr' ? 'Dün' : 'Yesterday') : d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-zinc-800" />
      <span className="text-[10px] text-zinc-600 font-medium px-2">{label}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  )
}

function groupByDate(messages) {
  const groups = []
  let last = null
  for (const m of messages) {
    const day = new Date(m.created_at).toDateString()
    if (day !== last) { groups.push({ date: m.created_at, messages: [] }); last = day }
    groups[groups.length - 1].messages.push(m)
  }
  return groups
}

function MediaLightboxMsg({ src, isVideo, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
        <X size={18} />
      </button>
      {isVideo ? (
        <video src={src} controls autoPlay style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10 }} onClick={e => e.stopPropagation()} />
      ) : (
        <img src={src} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 10 }} onClick={e => e.stopPropagation()} />
      )}
    </div>
  )
}

export default function Messages() {
  const { user } = useAuth()
  const { lang } = useLang()
  const tr = lang === 'tr'
  const [searchParams] = useSearchParams()
  const toId = searchParams.get('to')

  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(toId || null)
  const [activeProfile, setActiveProfile] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showEmoji, setShowEmoji] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({})
  const [chatSearch, setChatSearch] = useState('')
  const [showChatSearch, setShowChatSearch] = useState(false)
  const [msgImageFile, setMsgImageFile] = useState(null)
  const [msgImagePreview, setMsgImagePreview] = useState(null)
  const [msgImageUploading, setMsgImageUploading] = useState(false)
  const [msgIsVideo, setMsgIsVideo] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [lightboxVideo, setLightboxVideo] = useState(false)
  const bottomRef = useRef()
  const messagesContainerRef = useRef()
  const channelRef = useRef()
  const inputRef = useRef()
  const msgImageRef = useRef()
  const activeIdRef = useRef(activeId)

  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  useEffect(() => { fetchConversations() }, [])

  useEffect(() => {
    if (!activeId) return
    markConversationRead(activeId)
    fetchMessages(activeId)
    fetchProfile(activeId)
    subscribeToMessages(activeId)
    setChatSearch('')
    setShowChatSearch(false)
    return () => channelRef.current?.unsubscribe()
  }, [activeId])

  useEffect(() => {
    if (!chatSearch && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, chatSearch])

  useEffect(() => {
    if (!searchUser.trim()) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .neq('id', user.id)
        .ilike('full_name', `%${searchUser}%`)
        .limit(6)
      setSearchResults(data || [])
    }, 300)
    return () => clearTimeout(t)
  }, [searchUser])

  async function markConversationRead(otherId) {
    await supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', user.id)
      .eq('sender_id', otherId)
      .is('read_at', null)
    setUnreadCounts(prev => ({ ...prev, [otherId]: 0 }))
    setMessages(prev => prev.map(m =>
      m.sender_id === otherId && m.receiver_id === user.id && !m.read_at
        ? { ...m, read_at: new Date().toISOString() }
        : m
    ))
  }

  async function fetchConversations() {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at, read_at')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!data) { setLoadingConvs(false); return }

    const seen = new Set()
    const unique = []
    const unread = {}

    for (const m of data) {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id
      if (!seen.has(otherId)) {
        seen.add(otherId)
        unique.push({ otherId, lastMessage: m })
      }
      if (m.receiver_id === user.id && !m.read_at) {
        unread[m.sender_id] = (unread[m.sender_id] || 0) + 1
      }
    }

    if (activeIdRef.current) unread[activeIdRef.current] = 0

    const profiles = await Promise.all(unique.map(({ otherId }) =>
      supabase.from('profiles').select('id, full_name, role, avatar_url').eq('id', otherId).single()
    ))

    setConversations(unique.map((c, i) => ({ ...c, profile: profiles[i].data })))
    setUnreadCounts(unread)
    setLoadingConvs(false)
  }

  async function fetchProfile(id) {
    const { data } = await supabase.from('profiles').select('id, full_name, role, avatar_url, last_seen').eq('id', id).single()
    setActiveProfile(data)
  }

  async function fetchMessages(otherId) {
    setLoadingMsgs(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoadingMsgs(false)
  }

  function subscribeToMessages(otherId) {
    channelRef.current?.unsubscribe()
    channelRef.current = supabase
      .channel(`messages-${user.id}-${otherId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, payload => {
        if (payload.new.sender_id === otherId) {
          setMessages(prev => [...prev, payload.new])
          markConversationRead(otherId)
        } else {
          setUnreadCounts(prev => ({
            ...prev,
            [payload.new.sender_id]: (prev[payload.new.sender_id] || 0) + 1,
          }))
          fetchConversations()
        }
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `sender_id=eq.${user.id}`,
      }, payload => {
        if (payload.new.receiver_id === otherId) {
          setMessages(prev =>
            prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]
          )
          fetchConversations()
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `sender_id=eq.${user.id}`,
      }, payload => {
        if (payload.new.read_at && !payload.old?.read_at) {
          setMessages(prev => prev.map(m =>
            m.id === payload.new.id ? { ...m, read_at: payload.new.read_at } : m
          ))
        }
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'messages',
      }, payload => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id))
      })
      .subscribe()
  }

  async function handleMsgImage(e) {
    const file = e.target.files[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    if (isVideo) {
      if (file.size > 50 * 1024 * 1024) { toast.error('Video boyutu çok büyük (maks. 50MB)'); e.target.value = ''; return }
    } else {
      try { await validateImageFile(file, 5 * 1024 * 1024) }
      catch (err) { toast.error(err.message); e.target.value = ''; return }
    }
    setMsgIsVideo(isVideo)
    setMsgImageFile(file)
    setMsgImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function clearMsgImage() {
    setMsgImageFile(null)
    setMsgImagePreview(null)
    setMsgIsVideo(false)
  }

  const lastSeenLabel = ts => {
    if (!ts) return null
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 2) return tr ? 'Şu an çevrimiçi' : 'Online now'
    if (m < 60) return tr ? `${m} dk önce görüldü` : `Last seen ${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return tr ? `${h} sa önce görüldü` : `Last seen ${h}h ago`
    return tr ? `${Math.floor(h / 24)}g önce görüldü` : `Last seen ${Math.floor(h / 24)}d ago`
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() && !msgImageFile) return
    if (!activeId) return
    setSending(true)
    let imageUrl = null
    if (msgImageFile) {
      setMsgImageUploading(true)
      try {
        imageUrl = msgIsVideo
          ? await uploadPostVideo(user.id, msgImageFile)
          : await uploadPostImage(user.id, msgImageFile)
      } catch (err) { toast.error(err?.message || 'Medya gönderilemedi'); setSending(false); setMsgImageUploading(false); return }
      setMsgImageUploading(false)
    }
    const msg = {
      sender_id: user.id,
      receiver_id: activeId,
      content: text.trim() ? sanitizeText(text, 2000) : '',
      image_url: imageUrl,
    }
    const { data, error } = await supabase.from('messages').insert(msg).select().single()
    if (!error) {
      setMessages(prev => [...prev, data])
      setText('')
      clearMsgImage()
      setShowEmoji(false)
      setConversations(prev => {
        const idx = prev.findIndex(c => c.otherId === activeId)
        if (idx === -1) return prev
        const updated = { ...prev[idx], lastMessage: data }
        return [updated, ...prev.filter((_, i) => i !== idx)]
      })
      supabase.from('notifications').insert({
        user_id: activeId,
        type: 'message',
        from_user_id: user.id,
        message: text.slice(0, 80),
      }).then(() => {})
    } else toast.error(error?.message || 'Gönderilemedi')
    setSending(false)
    inputRef.current?.focus()
  }

  async function handleDeleteMessage(id) {
    if (!confirm(tr ? 'Mesajı silmek istediğine emin misin?' : 'Delete this message?')) return
    const { error } = await supabase.from('messages').delete().eq('id', id)
    if (error) { toast.error('Silinemedi'); return }
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  function startConversation(profile) {
    setActiveId(profile.id)
    setSearchUser('')
    setSearchResults([])
    if (!conversations.find(c => c.otherId === profile.id)) {
      setConversations(prev => [{ otherId: profile.id, profile, lastMessage: null }, ...prev])
    }
  }

  function insertEmoji(emoji) {
    setText(t => t + emoji)
    setShowEmoji(false)
    inputRef.current?.focus()
  }

  const locale = tr ? 'tr-TR' : 'en-US'
  const timeLabel = ts => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  }

  const timeShort = ts => new Date(ts).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

  const filteredMessages = chatSearch.trim()
    ? messages.filter(m => m.content?.toLowerCase().includes(chatSearch.toLowerCase()))
    : messages

  const messageGroups = groupByDate(filteredMessages)

  return (
    <>
    {lightboxSrc && <MediaLightboxMsg src={lightboxSrc} isVideo={lightboxVideo} onClose={() => setLightboxSrc(null)} />}
    <div className="messages-panel" style={{ display: 'flex', borderRadius: 20, overflow: 'hidden', border: '1px solid #1a1a1a', background: '#080808', boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}>

      {/* Sidebar */}
      <div style={{ width: activeId ? 320 : '100%', flexShrink: 0, borderRight: '1px solid #141414', display: activeId ? undefined : 'flex', flexDirection: 'column', background: '#0a0a0a' }} className={`${activeId ? 'hidden sm:flex sm:!w-80' : 'flex'} flex-col`}>
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #141414', background: 'linear-gradient(135deg, #0d0d0d 0%, #0a0a0a 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #ff6b00, #ff8c00)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageCircle size={14} color="#fff" />
            </div>
            <h2 style={{ fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: '-0.3px' }}>{tr ? 'Mesajlar' : 'Messages'}</h2>
          </div>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#444' }} size={13} />
            <input value={searchUser} onChange={e => setSearchUser(e.target.value)}
              placeholder={tr ? 'Kullanıcı ara...' : 'Search users...'}
              style={{ width: '100%', background: '#131313', border: '1px solid #1e1e1e', borderRadius: 10, padding: '8px 32px 8px 32px', color: '#ccc', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            {searchUser && (
              <button onClick={() => setSearchUser('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <X size={13} />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div style={{ marginTop: 8, background: '#131313', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.7)' }}>
              {searchResults.map(u => (
                <button key={u.id} onClick={() => startConversation(u)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left', transition: 'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#1a1a1a'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}>
                  <UserAvatar profile={u} size="sm" />
                  <div>
                    <div style={{ fontSize: 13, color: '#e0e0e0', fontWeight: 500 }}>{u.full_name || (tr ? 'İsimsiz' : 'Unnamed')}</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>{u.role === 'pro' ? (tr ? 'Servis Uzmanı' : 'Service Expert') : (tr ? 'Araç Sahibi' : 'Car Owner')}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><Spinner /></div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <MessageCircle size={22} color="#2a2a2a" />
              </div>
              <p style={{ color: '#3a3a3a', fontSize: 13 }}>{tr ? 'Henüz mesaj yok' : 'No messages yet'}</p>
              <p style={{ color: '#2a2a2a', fontSize: 11, marginTop: 4 }}>{tr ? 'Kullanıcı arayarak başla' : 'Search a user to start'}</p>
            </div>
          ) : (
            conversations.map(c => {
              const unread = unreadCounts[c.otherId] || 0
              const isActive = activeId === c.otherId
              return (
                <button key={c.otherId} onClick={() => setActiveId(c.otherId)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', cursor: 'pointer', border: 'none', textAlign: 'left', transition: 'background 0.15s', background: isActive ? 'linear-gradient(90deg, rgba(255,107,0,0.08) 0%, transparent 100%)' : 'none', borderLeft: isActive ? '2px solid #ff6b00' : '2px solid transparent', borderBottom: '1px solid #111' }}
                  onMouseOver={e => { if (!isActive) e.currentTarget.style.background = '#0f0f0f' }}
                  onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'none' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <UserAvatar profile={c.profile} size="sm" />
                    {unread > 0 && (
                      <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, background: '#ff6b00', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid #0a0a0a' }}>
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: unread > 0 ? '#fff' : '#d0d0d0', fontWeight: unread > 0 ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                        {c.profile?.full_name || (tr ? 'İsimsiz' : 'Unnamed')}
                      </span>
                      <span style={{ fontSize: 10, color: '#3a3a3a', flexShrink: 0, marginLeft: 4 }}>{timeLabel(c.lastMessage?.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 11, color: unread > 0 ? '#888' : '#444', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.lastMessage?.sender_id === user.id ? (tr ? 'Sen: ' : 'You: ') : ''}{c.lastMessage?.content || (tr ? 'Yeni konuşma' : 'New conversation')}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat window */}
      {activeId ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#080808' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid #141414', background: 'rgba(12,12,12,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            <button onClick={() => setActiveId(null)} style={{ display: 'flex', background: 'none', border: 'none', padding: '6px', borderRadius: 8, cursor: 'pointer', color: '#555' }} className="sm:hidden">
              <ArrowLeft size={16} />
            </button>
            {activeProfile && (
              <>
                <Link to={activeProfile.role === 'pro' ? `/usta/${activeId}` : `/profile/${activeId}`} style={{ flexShrink: 0, position: 'relative' }}>
                  <UserAvatar profile={activeProfile} size="sm" />
                </Link>
                <div style={{ flex: 1 }}>
                  <Link to={activeProfile.role === 'pro' ? `/usta/${activeId}` : `/profile/${activeId}`} style={{ fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none', display: 'block', letterSpacing: '-0.2px' }}
                    onMouseOver={e => e.currentTarget.style.color = '#ff6b00'}
                    onMouseOut={e => e.currentTarget.style.color = '#fff'}>
                    {activeProfile.full_name || (tr ? 'İsimsiz' : 'Unnamed')}
                  </Link>
                  <p style={{ fontSize: 11, color: '#555', marginTop: 1 }}>
                    {lastSeenLabel(activeProfile.last_seen) || (activeProfile.role === 'pro' ? (tr ? 'Servis Uzmanı' : 'Service Expert') : (tr ? 'Araç Sahibi' : 'Car Owner'))}
                  </p>
                </div>
              </>
            )}
            <button
              onClick={() => { setShowChatSearch(v => !v); setChatSearch('') }}
              style={{ padding: '7px', borderRadius: 9, border: 'none', cursor: 'pointer', background: showChatSearch ? 'rgba(255,107,0,0.12)' : '#131313', color: showChatSearch ? '#ff6b00' : '#555', transition: 'all 0.15s' }}
              title={tr ? 'Konuşmada Ara' : 'Search in chat'}
            >
              <SearchIcon size={15} />
            </button>
          </div>

          {showChatSearch && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #141414', background: '#0a0a0a' }}>
              <div style={{ position: 'relative' }}>
                <SearchIcon style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#444' }} size={13} />
                <input
                  value={chatSearch}
                  onChange={e => setChatSearch(e.target.value)}
                  placeholder={tr ? 'Mesajlarda ara...' : 'Search messages...'}
                  autoFocus
                  style={{ width: '100%', background: '#131313', border: '1px solid #1e1e1e', borderRadius: 10, padding: '8px 32px 8px 32px', color: '#ccc', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
                {chatSearch && (
                  <button onClick={() => setChatSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                    <X size={13} />
                  </button>
                )}
              </div>
              {chatSearch && (
                <p style={{ fontSize: 11, color: '#3a3a3a', marginTop: 6, paddingLeft: 2 }}>
                  {filteredMessages.length} {tr ? 'sonuç bulundu' : 'results found'}
                </p>
              )}
            </div>
          )}

          <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', background: 'radial-gradient(ellipse at 50% 0%, rgba(255,107,0,0.03) 0%, transparent 60%), #080808' }}>
            {loadingMsgs ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><Spinner /></div>
            ) : filteredMessages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', minHeight: 240 }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: '#111', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <MessageCircle size={28} color="#222" />
                </div>
                <p style={{ color: '#444', fontSize: 14, fontWeight: 500 }}>
                  {chatSearch ? (tr ? 'Sonuç bulunamadı' : 'No results found') : (tr ? 'Henüz mesaj yok' : 'No messages yet')}
                </p>
                {!chatSearch && <p style={{ color: '#2a2a2a', fontSize: 12, marginTop: 6 }}>{tr ? 'Konuşmayı başlatmak için yaz' : 'Type to start the conversation'}</p>}
              </div>
            ) : (
              messageGroups.map((group, gi) => (
                <div key={gi}>
                  <DateSeparator date={group.date} lang={lang} />
                  {group.messages.map((m, mi) => {
                    const isMine = m.sender_id === user.id
                    const prevMsg = group.messages[mi - 1]
                    const showAvatar = !isMine && (!prevMsg || prevMsg.sender_id !== m.sender_id)
                    const isRead = isMine && !!m.read_at
                    const isHighlighted = chatSearch && m.content?.toLowerCase().includes(chatSearch.toLowerCase())
                    return (
                      <div key={m.id} style={{ display: 'flex', marginBottom: 6, justifyContent: isMine ? 'flex-end' : 'flex-start' }} className="group">
                        {!isMine && (
                          <div style={{ width: 30, flexShrink: 0, marginRight: 8, display: 'flex', alignItems: 'flex-end' }}>
                            {showAvatar && <UserAvatar profile={activeProfile} size="xs" />}
                          </div>
                        )}
                        <div style={{ maxWidth: '68%', display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isMine ? 'row-reverse' : 'row' }}>
                          {isMine && (
                            <button
                              onClick={() => handleDeleteMessage(m.id)}
                              style={{ opacity: 0, padding: '4px', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#555', flexShrink: 0, alignSelf: 'center', transition: 'opacity 0.15s' }}
                              className="group-hover:!opacity-100"
                              title={tr ? 'Mesajı Sil' : 'Delete'}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                          <div>
                            <div style={{
                              borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              fontSize: 13.5,
                              overflow: 'hidden',
                              background: isMine ? 'linear-gradient(135deg, #ff7a00, #ff5500)' : '#161616',
                              color: isMine ? '#fff' : '#d8d8d8',
                              border: isMine ? 'none' : '1px solid #1e1e1e',
                              boxShadow: isMine ? '0 2px 12px rgba(255,107,0,0.25)' : '0 1px 4px rgba(0,0,0,0.4)',
                            }}>
                              {m.image_url && (
                                m.image_url.includes('post-videos') ? (
                                  <div style={{ position: 'relative', cursor: 'pointer' }} className="group/media" onClick={() => { setLightboxSrc(m.image_url); setLightboxVideo(true) }}>
                                    <video src={m.image_url} style={{ width: '100%', maxHeight: 220, display: 'block', pointerEvents: 'none' }} muted playsInline />
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="opacity-0 group-hover/media:opacity-100 transition-opacity">
                                      <Play size={30} fill="white" color="white" />
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ position: 'relative', cursor: 'zoom-in' }} className="group/media" onClick={() => { setLightboxSrc(m.image_url); setLightboxVideo(false) }}>
                                    <img src={m.image_url} alt="" style={{ width: '100%', objectFit: 'cover', maxHeight: 220, display: 'block' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="opacity-0 group-hover/media:opacity-100 transition-opacity">
                                      <ZoomIn size={22} color="white" />
                                    </div>
                                  </div>
                                )
                              )}
                              {m.content && (
                                <p style={{ padding: '9px 14px', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: isHighlighted ? 'rgba(255,220,0,0.18)' : undefined }}>
                                  {m.content}
                                </p>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                              <span style={{ fontSize: 10, color: '#333' }}>{timeShort(m.created_at)}</span>
                              {isMine && (
                                isRead
                                  ? <CheckCheck size={11} color="#ff7a00" title={tr ? 'Okundu' : 'Read'} />
                                  : <Check size={11} color="#333" title={tr ? 'Gönderildi' : 'Sent'} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ borderTop: '1px solid #141414', background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            {showEmoji && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 4px', flexWrap: 'wrap' }}>
                {QUICK_EMOJIS.map(e => (
                  <button key={e} onClick={() => insertEmoji(e)}
                    style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 2, transition: 'transform 0.15s' }}
                    onMouseOver={el => el.currentTarget.style.transform = 'scale(1.3)'}
                    onMouseOut={el => el.currentTarget.style.transform = 'scale(1)'}>{e}</button>
                ))}
              </div>
            )}
            {msgImagePreview && (
              <div style={{ padding: '12px 16px 4px' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {msgIsVideo
                    ? <video src={msgImagePreview} style={{ maxHeight: 120, borderRadius: 10, border: '1px solid #1e1e1e', display: 'block' }} controls muted />
                    : <img src={msgImagePreview} alt="" style={{ maxHeight: 120, borderRadius: 10, border: '1px solid #1e1e1e', objectFit: 'cover', display: 'block' }} />
                  }
                  <button type="button" onClick={clearMsgImage}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.75)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                    <X size={11} color="#fff" />
                  </button>
                </div>
              </div>
            )}
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 6, padding: '10px 10px 12px', alignItems: 'center' }}>
              <input ref={msgImageRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleMsgImage} />
              <button
                type="button"
                onClick={() => msgImageRef.current?.click()}
                style={{ padding: 9, borderRadius: 10, background: '#111', border: '1px solid #1e1e1e', cursor: 'pointer', color: '#555', display: 'flex', transition: 'all 0.15s', flexShrink: 0 }}
                onMouseOver={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#aaa' }}
                onMouseOut={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#555' }}
                title={tr ? 'Fotoğraf/video gönder' : 'Send photo/video'}
              >
                <ImageIcon size={15} />
              </button>
              <button
                type="button"
                onClick={() => setShowEmoji(v => !v)}
                style={{ padding: 9, borderRadius: 10, border: '1px solid #1e1e1e', cursor: 'pointer', display: 'flex', transition: 'all 0.15s', flexShrink: 0, background: showEmoji ? 'rgba(255,107,0,0.12)' : '#111', color: showEmoji ? '#ff6b00' : '#555' }}
              >
                <Smile size={15} />
              </button>
              <input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={tr ? 'Mesaj yaz...' : 'Type a message...'}
                maxLength={2000}
                style={{ flex: 1, background: '#131313', border: '1px solid #1e1e1e', borderRadius: 12, padding: '10px 14px', color: '#e0e0e0', fontSize: 16, outline: 'none', lineHeight: 1.4 }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
              />
              <button type="submit" disabled={(!text.trim() && !msgImageFile) || sending || msgImageUploading}
                style={{ padding: '10px 12px', borderRadius: 12, background: 'linear-gradient(135deg, #ff7a00, #ff5500)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, opacity: ((!text.trim() && !msgImageFile) || sending || msgImageUploading) ? 0.4 : 1, transition: 'opacity 0.15s' }}>
                {sending || msgImageUploading ? <Spinner size="sm" /> : <Send size={15} />}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden sm:flex" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'radial-gradient(ellipse at center, rgba(255,107,0,0.03) 0%, transparent 70%), #080808' }}>
          <div>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #111, #0d0d0d)', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
              <MessageCircle size={32} color="#222" />
            </div>
            <p style={{ color: '#444', fontWeight: 600, fontSize: 15 }}>{tr ? 'Mesajların burada görünür' : 'Your messages appear here'}</p>
            <p style={{ color: '#2a2a2a', fontSize: 12, marginTop: 6 }}>{tr ? 'Sol taraftan bir konuşma seç' : 'Select a conversation on the left'}</p>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
