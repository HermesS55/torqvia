import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Send, MessageCircle, Search, ArrowLeft, Check, CheckCheck, X, Smile, Trash2, SearchIcon, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { uploadPostImage } from '../lib/avatar'
import UserAvatar from '../components/ui/UserAvatar'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { sanitizeText, validateImageFile } from '../lib/security'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🔥', '🚗', '🏎️', '⚡']

function DateSeparator({ date }) {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isYesterday = new Date(now - 86400000).toDateString() === d.toDateString()
  const label = isToday ? 'Bugün' : isYesterday ? 'Dün' : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
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

export default function Messages() {
  const { user } = useAuth()
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
  const bottomRef = useRef()
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
    if (!chatSearch) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    try { await validateImageFile(file, 5 * 1024 * 1024) }
    catch (err) { toast.error(err.message); e.target.value = ''; return }
    setMsgImageFile(file)
    setMsgImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function clearMsgImage() {
    setMsgImageFile(null)
    setMsgImagePreview(null)
  }

  const lastSeenLabel = ts => {
    if (!ts) return null
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 2) return 'Şu an çevrimiçi'
    if (m < 60) return `${m} dk önce görüldü`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} sa önce görüldü`
    return `${Math.floor(h / 24)}g önce görüldü`
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() && !msgImageFile) return
    if (!activeId) return
    setSending(true)
    let imageUrl = null
    if (msgImageFile) {
      setMsgImageUploading(true)
      try { imageUrl = await uploadPostImage(user.id, msgImageFile) }
      catch { toast.error('Resim gönderilemedi'); setSending(false); setMsgImageUploading(false); return }
      setMsgImageUploading(false)
    }
    const msg = {
      sender_id: user.id,
      receiver_id: activeId,
      content: text.trim() ? sanitizeText(text, 2000) : null,
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
    } else toast.error('Gönderilemedi')
    setSending(false)
    inputRef.current?.focus()
  }

  async function handleDeleteMessage(id) {
    if (!confirm('Mesajı silmek istediğine emin misin?')) return
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

  const timeLabel = ts => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }

  const timeShort = ts => new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

  const filteredMessages = chatSearch.trim()
    ? messages.filter(m => m.content?.toLowerCase().includes(chatSearch.toLowerCase()))
    : messages

  const messageGroups = groupByDate(filteredMessages)

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0 rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">

      {/* Sidebar */}
      <div className={`w-full sm:w-80 flex-shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-950 ${activeId ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-brand-400" />
            <h2 className="font-bold text-white">Mesajlar</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input value={searchUser} onChange={e => setSearchUser(e.target.value)}
              placeholder="Kullanıcı ara..."
              className="input-base pl-9 py-2 text-sm" />
            {searchUser && (
              <button onClick={() => setSearchUser('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl">
              {searchResults.map(u => (
                <button key={u.id} onClick={() => startConversation(u)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-700 transition-colors text-left">
                  <UserAvatar profile={u} size="sm" />
                  <div>
                    <div className="text-sm text-zinc-200 font-medium">{u.full_name || 'İsimsiz'}</div>
                    <div className="text-xs text-zinc-500">{u.role === 'pro' ? 'Servis Uzmanı' : 'Araç Sahibi'}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="h-10 w-10 text-zinc-800 mx-auto mb-3" />
              <p className="text-zinc-600 text-sm">Henüz mesaj yok</p>
            </div>
          ) : (
            conversations.map(c => {
              const unread = unreadCounts[c.otherId] || 0
              return (
                <button key={c.otherId} onClick={() => setActiveId(c.otherId)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/60 transition-colors text-left border-b border-zinc-800/40 ${activeId === c.otherId ? 'bg-zinc-800/80 border-l-2 border-l-brand-500' : ''}`}>
                  <div className="relative shrink-0">
                    <UserAvatar profile={c.profile} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${unread > 0 ? 'font-bold text-white' : 'font-medium text-zinc-200'}`}>
                        {c.profile?.full_name || 'İsimsiz'}
                      </span>
                      <span className="text-[10px] text-zinc-600 shrink-0 ml-1">{timeLabel(c.lastMessage?.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {c.lastMessage?.sender_id === user.id ? 'Sen: ' : ''}{c.lastMessage?.content || 'Yeni konuşma'}
                      </p>
                      {unread > 0 && (
                        <span className="shrink-0 h-4 w-4 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat window */}
      {activeId ? (
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
            <button onClick={() => setActiveId(null)} className="sm:hidden p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500">
              <ArrowLeft className="h-4 w-4" />
            </button>
            {activeProfile && (
              <>
                <Link to={`/profile/${activeId}`} className="relative shrink-0">
                  <UserAvatar profile={activeProfile} size="sm" />
                </Link>
                <div className="flex-1">
                  <Link to={`/profile/${activeId}`} className="text-sm font-semibold text-white hover:text-brand-400 transition-colors">
                    {activeProfile.full_name || 'İsimsiz'}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {lastSeenLabel(activeProfile.last_seen) || (activeProfile.role === 'pro' ? 'Servis Uzmanı' : 'Araç Sahibi')}
                  </p>
                </div>
              </>
            )}
            <button
              onClick={() => { setShowChatSearch(v => !v); setChatSearch('') }}
              className={`p-1.5 rounded-lg transition-colors ${showChatSearch ? 'text-brand-400 bg-brand-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
              title="Konuşmada Ara"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </div>

          {showChatSearch && (
            <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/60">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  value={chatSearch}
                  onChange={e => setChatSearch(e.target.value)}
                  placeholder="Mesajlarda ara..."
                  autoFocus
                  className="input-base pl-9 py-2 text-sm"
                />
                {chatSearch && (
                  <button onClick={() => setChatSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {chatSearch && (
                <p className="text-xs text-zinc-600 mt-1.5 px-1">
                  {filteredMessages.length} sonuç bulundu
                </p>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {loadingMsgs ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="h-16 w-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-zinc-700" />
                </div>
                <p className="text-zinc-500 text-sm font-medium">
                  {chatSearch ? 'Sonuç bulunamadı' : 'Henüz mesaj yok'}
                </p>
                {!chatSearch && <p className="text-zinc-700 text-xs mt-1">Konuşmayı başlatmak için yaz</p>}
              </div>
            ) : (
              messageGroups.map((group, gi) => (
                <div key={gi}>
                  <DateSeparator date={group.date} />
                  {group.messages.map((m, mi) => {
                    const isMine = m.sender_id === user.id
                    const prevMsg = group.messages[mi - 1]
                    const showAvatar = !isMine && (!prevMsg || prevMsg.sender_id !== m.sender_id)
                    const isRead = isMine && !!m.read_at
                    return (
                      <div key={m.id} className={`flex mb-1.5 group ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isMine && (
                          <div className="w-8 shrink-0 mr-2 self-end">
                            {showAvatar && <UserAvatar profile={activeProfile} size="xs" />}
                          </div>
                        )}
                        <div className={`max-w-[72%] lg:max-w-[60%] flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          {isMine && (
                            <button
                              onClick={() => handleDeleteMessage(m.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 shrink-0 self-center"
                              title="Mesajı Sil"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                          <div>
                            <div className={`rounded-2xl text-sm overflow-hidden ${
                              isMine
                                ? 'bg-brand-500 text-white rounded-br-sm'
                                : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                            }`}>
                              {m.image_url && (
                                <img src={m.image_url} alt="" className="w-full object-cover max-h-60" />
                              )}
                              {m.content && (
                                <p className={`px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${chatSearch && m.content.toLowerCase().includes(chatSearch.toLowerCase()) ? 'bg-yellow-500/20' : ''}`}>
                                  {m.content}
                                </p>
                              )}
                            </div>
                            <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px] text-zinc-600">{timeShort(m.created_at)}</span>
                              {isMine && (
                                isRead
                                  ? <CheckCheck className="h-3 w-3 text-brand-400" title="Okundu" />
                                  : <Check className="h-3 w-3 text-zinc-600" title="Gönderildi" />
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

          <div className="border-t border-zinc-800 bg-zinc-900/60">
            {showEmoji && (
              <div className="flex items-center gap-2 px-4 pt-3 pb-1 flex-wrap">
                {QUICK_EMOJIS.map(e => (
                  <button key={e} onClick={() => insertEmoji(e)}
                    className="text-xl hover:scale-125 transition-transform">{e}</button>
                ))}
              </div>
            )}
            {msgImagePreview && (
              <div className="px-4 pt-3 pb-1">
                <div className="relative inline-block">
                  <img src={msgImagePreview} alt="" className="max-h-32 rounded-lg border border-zinc-700 object-cover" />
                  <button type="button" onClick={clearMsgImage}
                    className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5">
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              </div>
            )}
            <form onSubmit={handleSend} className="flex gap-2 p-3">
              <input ref={msgImageRef} type="file" accept="image/*" className="hidden" onChange={handleMsgImage} />
              <button
                type="button"
                onClick={() => msgImageRef.current?.click()}
                className="p-2.5 rounded-xl transition-colors text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                title="Resim gönder"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowEmoji(v => !v)}
                className={`p-2.5 rounded-xl transition-colors ${showEmoji ? 'text-brand-400 bg-brand-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
              >
                <Smile className="h-4 w-4" />
              </button>
              <input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Mesaj yaz..."
                maxLength={2000}
                className="input-base flex-1 text-sm py-2.5"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
              />
              <button type="submit" disabled={(!text.trim() && !msgImageFile) || sending || msgImageUploading}
                className="btn-primary px-4 flex items-center gap-1.5 disabled:opacity-40">
                {sending || msgImageUploading ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden sm:flex items-center justify-center text-center bg-zinc-950">
          <div>
            <div className="h-20 w-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-10 w-10 text-zinc-700" />
            </div>
            <p className="text-zinc-400 font-medium">Mesajların burada görünür</p>
            <p className="text-zinc-600 text-sm mt-1">Sol taraftan bir konuşma seç</p>
          </div>
        </div>
      )}
    </div>
  )
}
