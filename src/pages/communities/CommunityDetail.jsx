import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Hash, Users, MessageCircle, Info, ArrowLeft,
  Send, Heart, Trash2, Image, X, Crown, UserCheck, UserPlus,
  Settings, UserMinus, ShieldCheck, ShieldOff, Upload,
  AlertTriangle, Save, Search,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import UserAvatar from '../../components/ui/UserAvatar'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import { sanitizeText, validateImageFile } from '../../lib/security'
import { uploadPostImage, uploadPostVideo } from '../../lib/avatar'

const BASE_TABS = [
  { id: 'feed',    label: 'Paylaşımlar', icon: Hash },
  { id: 'chat',    label: 'Sohbet',      icon: MessageCircle },
  { id: 'members', label: 'Üyeler',      icon: Users },
  { id: 'about',   label: 'Hakkında',    icon: Info },
]

const CATEGORIES = [
  'Genel', 'Klasik Arabalar', 'Modifiye', 'Motorsiklet',
  'Elektrikli Araçlar', 'Off-Road', 'Yarış', 'Teknik Destek', 'Diğer',
]

export default function CommunityDetail() {
  const { id } = useParams()
  const { user, profile: myProfile } = useAuth()
  const navigate = useNavigate()

  const [community, setCommunity] = useState(null)
  const [members, setMembers]     = useState([])
  const [posts, setPosts]         = useState([])
  const [messages, setMessages]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('feed')
  const [isMember, setIsMember]   = useState(false)
  const [isAdmin, setIsAdmin]     = useState(false)
  const [joining, setJoining]         = useState(false)

  // Post creation
  const [postContent, setPostContent]       = useState('')
  const [postFile, setPostFile]             = useState(null)
  const [postIsVideo, setPostIsVideo]       = useState(false)
  const [postPreview, setPostPreview]       = useState(null)
  const [postSubmitting, setPostSubmitting] = useState(false)
  const postFileRef = useRef()

  // Chat
  const [chatText, setChatText]         = useState('')
  const [chatSending, setChatSending]   = useState(false)
  const [chatFile, setChatFile]         = useState(null)
  const [chatPreview, setChatPreview]   = useState(null)
  const chatBottomRef = useRef()
  const channelRef    = useRef()
  const chatFileRef   = useRef()

  // Feed search
  const [feedSearch, setFeedSearch] = useState('')

  // Admin / settings
  const [editName, setEditName]           = useState('')
  const [editDesc, setEditDesc]           = useState('')
  const [editRules, setEditRules]         = useState('')
  const [editCategory, setEditCategory]   = useState('')
  const [editSaving, setEditSaving]       = useState(false)
  const [coverFile, setCoverFile]         = useState(null)
  const [coverPreview, setCoverPreview]   = useState(null)
  const [avatarFile, setAvatarFile]       = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [kickDialog, setKickDialog] = useState(null) // { memberId, memberName }
  const [banDialog, setBanDialog] = useState(null)   // { memberId, memberName }
  const [banDuration, setBanDuration] = useState('permanent')
  const coverFileRef  = useRef()
  const avatarFileRef = useRef()

  useEffect(() => {
    fetchAll()
    return () => channelRef.current?.unsubscribe()
  }, [id, user?.id])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchAll() {
    const [{ data: comm }, { data: mems }, { data: postsData }, { data: msgsData }] = await Promise.all([
      supabase.from('communities')
        .select('*, profiles!communities_created_by_fkey(id, full_name, avatar_url, role)')
        .eq('id', id).single(),
      supabase.from('community_members')
        .select('*, profiles!community_members_user_id_fkey(id, full_name, avatar_url, role)')
        .eq('community_id', id).order('joined_at', { ascending: true }),
      supabase.from('community_posts')
        .select('*, profiles!community_posts_user_id_fkey(id, full_name, avatar_url, role), community_post_likes(user_id)')
        .eq('community_id', id).order('created_at', { ascending: false }),
      supabase.from('community_messages')
        .select('*, profiles!community_messages_user_id_fkey(id, full_name, avatar_url, role)')
        .eq('community_id', id).order('created_at', { ascending: true }).limit(100),
    ])

    setCommunity(comm)
    if (comm) {
      setEditName(comm.name || '')
      setEditDesc(comm.description || '')
      setEditRules(comm.rules || '')
      setEditCategory(comm.category || '')
    }
    setMembers(mems || [])
    setPosts((postsData || []).map(p => ({
      ...p,
      like_count:  p.community_post_likes?.length || 0,
      liked_by_me: p.community_post_likes?.some(l => l.user_id === user?.id) || false,
    })))
    setMessages(msgsData || [])

    const me = mems?.find(m => m.user_id === user?.id)
    setIsMember(!!me)
    const adminNow = me?.role === 'admin' || comm?.created_by === user?.id
    setIsAdmin(adminNow)

    setLoading(false)
  }

  function subscribeToChat() {
    channelRef.current?.unsubscribe()
    channelRef.current = supabase
      .channel(`community-chat-${id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'community_messages',
        filter: `community_id=eq.${id}`,
      }, async payload => {
        const { data } = await supabase
          .from('community_messages')
          .select('*, profiles!community_messages_user_id_fkey(id, full_name, avatar_url, role)')
          .eq('id', payload.new.id).single()
        if (data) setMessages(prev => [...prev, data])
      })
      .subscribe()
  }

  async function toggleMembership() {
    if (!user) return
    setJoining(true)
    if (isMember && !isAdmin) {
      const { error } = await supabase.from('community_members').delete()
        .eq('community_id', id).eq('user_id', user.id)
      if (!error) {
        setIsMember(false)
        setMembers(m => m.filter(m => m.user_id !== user.id))
        toast('Topluluktan ayrıldın')
      }
    } else if (!isMember) {
      const { data, error } = await supabase.from('community_members')
        .insert({ community_id: id, user_id: user.id, role: 'member' })
        .select('*, profiles!community_members_user_id_fkey(id, full_name, avatar_url, role)')
        .single()
      if (!error && data) {
        setIsMember(true)
        setMembers(m => [...m, data])
        toast.success(`${community?.name} topluluğuna katıldın!`)
      }
    }
    setJoining(false)
  }

  async function handlePostFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(file.name)
    if (isVideo) {
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/avi']
      if (!validVideoTypes.includes(file.type) && !file.type.startsWith('video/')) {
        toast.error('Desteklenmeyen video formatı. MP4, WebM veya MOV kullanın.')
        e.target.value = ''
        return
      }
      if (file.size > 80 * 1024 * 1024) { toast.error('Video en fazla 80 MB olabilir'); e.target.value = ''; return }
    } else {
      try { await validateImageFile(file, 5 * 1024 * 1024) }
      catch (err) { toast.error(err.message); e.target.value = ''; return }
    }
    setPostFile(file)
    setPostIsVideo(isVideo)
    setPostPreview(URL.createObjectURL(file))
  }

  async function submitPost(e) {
    e.preventDefault()
    if (!postContent.trim() || !isMember) return
    setPostSubmitting(true)
    try {
      let image_url = null
      if (postFile) {
        image_url = postIsVideo
          ? await uploadPostVideo(user.id, postFile)
          : await uploadPostImage(user.id, postFile)
      }
      const { data, error } = await supabase.from('community_posts')
        .insert({ community_id: id, user_id: user.id, content: sanitizeText(postContent, 2000), image_url })
        .select('*, profiles!community_posts_user_id_fkey(id, full_name, avatar_url, role), community_post_likes(user_id)')
        .single()
      if (error) throw error
      setPosts(prev => [{ ...data, like_count: 0, liked_by_me: false }, ...prev])
      setPostContent('')
      setPostFile(null)
      setPostIsVideo(false)
      setPostPreview(null)
      toast.success('Paylaşıldı!')
    } catch { toast.error('Paylaşılamadı') }
    finally { setPostSubmitting(false) }
  }

  async function togglePostLike(postId) {
    const post = posts.find(p => p.id === postId)
    if (!post) return
    if (post.liked_by_me) {
      await supabase.from('community_post_likes').delete().eq('post_id', postId).eq('user_id', user.id)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: false, like_count: p.like_count - 1 } : p))
    } else {
      await supabase.from('community_post_likes').insert({ post_id: postId, user_id: user.id })
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: true, like_count: p.like_count + 1 } : p))
    }
  }

  async function deletePost(postId) {
    if (!confirm('Bu paylaşımı silmek istiyor musun?')) return
    await supabase.from('community_posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  async function handleChatImage(e) {
    const file = e.target.files[0]
    if (!file) return
    try { await validateImageFile(file, 5 * 1024 * 1024) }
    catch (err) { toast.error(err.message); e.target.value = ''; return }
    setChatFile(file)
    setChatPreview(URL.createObjectURL(file))
  }

  async function sendChatMessage(e) {
    e.preventDefault()
    const trimmed = chatText.trim()
    if (!trimmed && !chatFile) return
    if (!isMember) return
    setChatSending(true)
    const contentToSend = trimmed ? sanitizeText(trimmed, 1000) : ''
    setChatText('')
    let image_url = null
    if (chatFile) {
      try { image_url = await uploadPostImage(user.id, chatFile) }
      catch { toast.error('Fotoğraf yüklenemedi'); setChatSending(false); return }
      setChatFile(null)
      setChatPreview(null)
    }
    await supabase.from('community_messages').insert({
      community_id: id, user_id: user.id, content: contentToSend, image_url,
    })
    setChatSending(false)
  }

  // ── Admin functions ──

  async function handleCoverImage(e) {
    const file = e.target.files[0]
    if (!file) return
    try { await validateImageFile(file, 5 * 1024 * 1024) }
    catch (err) { toast.error(err.message); return }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function handleAvatarImage(e) {
    const file = e.target.files[0]
    if (!file) return
    try { await validateImageFile(file, 2 * 1024 * 1024) }
    catch (err) { toast.error(err.message); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function saveSettings() {
    if (!editName.trim()) { toast.error('Topluluk adı boş olamaz'); return }
    setEditSaving(true)
    try {
      let cover_url = community.cover_url
      let avatar_url = community.avatar_url
      if (coverFile) cover_url = await uploadPostImage(user.id, coverFile)
      if (avatarFile) avatar_url = await uploadPostImage(user.id, avatarFile)

      const { error } = await supabase.from('communities').update({
        name:        editName.trim(),
        description: editDesc.trim() || null,
        rules:       editRules.trim() || null,
        category:    editCategory || null,
        cover_url,
        avatar_url,
      }).eq('id', id)

      if (error) throw error
      setCommunity(prev => ({
        ...prev,
        name: editName.trim(), description: editDesc.trim() || null,
        rules: editRules.trim() || null, category: editCategory || null,
        cover_url, avatar_url,
      }))
      setCoverFile(null); setAvatarFile(null)
      setCoverPreview(null); setAvatarPreview(null)
      toast.success('Topluluk güncellendi!')
    } catch (e) {
      toast.error(e.message || 'Kaydedilemedi')
    }
    setEditSaving(false)
  }

  async function doKickMember(memberId) {
    if (memberId === community.created_by) { toast.error('Kurucu çıkarılamaz'); return }
    const { error } = await supabase.from('community_members').delete()
      .eq('community_id', id).eq('user_id', memberId)
    if (!error) {
      setMembers(prev => prev.filter(m => m.user_id !== memberId))
      toast.success('Üye çıkarıldı')
    } else {
      toast.error('İşlem başarısız')
    }
    setKickDialog(null)
  }

  async function doBanMember(memberId) {
    if (memberId === community.created_by) { toast.error('Kurucu banlanamaz'); return }
    let banUntil = null
    if (banDuration !== 'permanent') {
      const days = parseInt(banDuration)
      banUntil = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString()
    }
    // Remove from members first
    await supabase.from('community_members').delete().eq('community_id', id).eq('user_id', memberId)
    // Insert ban record
    const { error } = await supabase.from('community_bans').upsert({
      community_id: id, user_id: memberId, banned_until: banUntil,
    }, { onConflict: 'community_id,user_id' })
    if (!error) {
      setMembers(prev => prev.filter(m => m.user_id !== memberId))
      toast.success(banUntil ? `Üye ${banDuration} gün süreyle banlandı` : 'Üye kalıcı olarak banlandı')
    } else {
      toast.error('İşlem başarısız')
    }
    setBanDialog(null)
    setBanDuration('permanent')
  }

  async function toggleMemberRole(member) {
    if (member.user_id === community.created_by) { toast.error('Kurucunun rolü değiştirilemez'); return }
    const newRole = member.role === 'admin' ? 'member' : 'admin'
    const { error } = await supabase.from('community_members')
      .update({ role: newRole })
      .eq('community_id', id).eq('user_id', member.user_id)
    if (!error) {
      setMembers(prev => prev.map(m => m.user_id === member.user_id ? { ...m, role: newRole } : m))
      toast.success(newRole === 'admin' ? 'Admin yapıldı' : 'Admin rolü kaldırıldı')
    }
  }

  async function deleteCommunity() {
    if (deleteConfirm !== community?.name) {
      toast.error('Topluluk adını doğru yaz')
      return
    }
    await supabase.from('communities').delete().eq('id', id)
    toast.success('Topluluk silindi')
    navigate('/communities')
  }

  const timeLabel = ts => {
    if (!ts) return ''
    const d   = new Date(ts)
    const now = new Date()
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }

  const visibleTabs = isAdmin
    ? [...BASE_TABS, { id: 'admin', label: 'Yönet', icon: Settings }]
    : BASE_TABS

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!community) return (
    <div className="text-center py-20">
      <p className="text-zinc-500 mb-4">Topluluk bulunamadı</p>
      <Link to="/communities" className="btn-primary">Topluluklara Dön</Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      {/* Kick confirm dialog */}
      <ConfirmDialog
        open={!!kickDialog}
        title="Üyeyi Çıkar"
        message={kickDialog ? `"${kickDialog.memberName}" kişisini topluluktan çıkarmak istediğinizden emin misiniz?` : ''}
        confirmLabel="Çıkar"
        danger
        onConfirm={() => doKickMember(kickDialog?.memberId)}
        onCancel={() => setKickDialog(null)}
      />

      {/* Ban dialog */}
      <ConfirmDialog
        open={!!banDialog}
        title="Üyeyi Banla"
        confirmLabel="Banla"
        danger
        onConfirm={() => doBanMember(banDialog?.memberId)}
        onCancel={() => { setBanDialog(null); setBanDuration('permanent') }}
      >
        <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px', lineHeight: 1.6 }}>
          <strong style={{ color: '#f0f0f0' }}>{banDialog?.memberName}</strong> kişisini banlamak istediğinizden emin misiniz?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { value: '1',         label: '1 Gün' },
            { value: '7',         label: '7 Gün' },
            { value: '30',        label: '30 Gün' },
            { value: 'permanent', label: 'Kalıcı' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, background: banDuration === opt.value ? 'rgba(255,107,0,0.08)' : 'transparent', border: banDuration === opt.value ? '1px solid rgba(255,107,0,0.2)' : '1px solid transparent' }}>
              <input type="radio" name="banDuration" value={opt.value} checked={banDuration === opt.value} onChange={e => setBanDuration(e.target.value)} style={{ accentColor: '#ff7a00' }} />
              <span style={{ fontSize: 13, color: banDuration === opt.value ? '#ff7a00' : '#888', fontWeight: banDuration === opt.value ? 600 : 400 }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </ConfirmDialog>

      <Link to="/communities" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Topluluklara Dön
      </Link>

      {/* Community Header */}
      <div className="card mb-5 overflow-hidden p-0">
        {community.cover_url ? (
          <div className="h-32 overflow-hidden">
            <img src={community.cover_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-20 bg-gradient-to-r from-brand-900/60 via-brand-800/30 to-zinc-900/20" />
        )}

        <div className="p-5">
          <div className="flex items-start gap-4">
            {community.avatar_url ? (
              <img src={community.avatar_url} alt="" className="h-14 w-14 rounded-xl object-cover border-2 border-zinc-700 -mt-9 shrink-0" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-brand-500/20 border-2 border-zinc-700 flex items-center justify-center -mt-9 shrink-0">
                <Hash className="h-7 w-7 text-brand-400" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {community.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {members.length} üye
                    </span>
                    {community.category && (
                      <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                        {community.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {community.created_by === user?.id ? (
                    <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                      <Crown className="h-3 w-3" /> Admin
                    </span>
                  ) : (
                    <button
                      onClick={toggleMembership}
                      disabled={joining}
                      className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg border transition-all ${
                        isMember
                          ? 'border-zinc-700 text-zinc-400 hover:border-red-500/40 hover:text-red-400'
                          : 'border-brand-500/50 text-brand-400 bg-brand-500/10 hover:bg-brand-500/20'
                      }`}
                    >
                      {joining ? <Spinner size="sm" />
                        : isMember
                          ? <><UserCheck className="h-3.5 w-3.5" /> Üyesin</>
                          : <><UserPlus className="h-3.5 w-3.5" /> Katıl</>
                      }
                    </button>
                  )}
                </div>
              </div>

              {community.description && (
                <p className="text-sm text-zinc-400 mt-2">{community.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 mb-5 overflow-x-auto scrollbar-none" style={{ touchAction: 'pan-x' }}>
        {visibleTabs.map(t => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              if (t.id === 'chat' && isMember) subscribeToChat()
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Feed Tab ── */}
      {tab === 'feed' && (
        <div className="space-y-4">
          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={feedSearch}
              onChange={e => setFeedSearch(e.target.value)}
              placeholder="Paylaşımlarda ara..."
              className="input-base pl-10 pr-9"
            />
            {feedSearch && (
              <button onClick={() => setFeedSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {isMember ? (
            <div className="card">
              <div className="flex gap-3">
                <UserAvatar profile={myProfile} size="md" />
                <div className="flex-1">
                  <form onSubmit={submitPost}>
                    <textarea
                      value={postContent}
                      onChange={e => setPostContent(e.target.value)}
                      placeholder="Topluluğa bir şeyler paylaş..."
                      rows={3}
                      maxLength={2000}
                      className="input-base resize-none text-sm w-full"
                    />
                    {postPreview && (
                      <div className="relative mt-2 inline-block">
                        {postIsVideo
                          ? <video src={postPreview} className="max-h-40 rounded-lg border border-zinc-700" controls muted />
                          : <img src={postPreview} alt="" className="max-h-40 rounded-lg border border-zinc-700 object-cover" />
                        }
                        <button type="button" onClick={() => { setPostFile(null); setPostIsVideo(false); setPostPreview(null) }}
                          className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5">
                          <X className="h-3.5 w-3.5 text-white" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-1">
                        <input ref={postFileRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime,video/x-msvideo,video/*" className="hidden" onChange={handlePostFile} />
                        <button type="button" onClick={() => postFileRef.current?.click()}
                          className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Fotoğraf veya video ekle">
                          <Image className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-600">{postContent.length}/2000</span>
                        <button type="submit" disabled={!postContent.trim() || postSubmitting}
                          className="btn-primary flex items-center gap-1.5 text-sm py-2">
                          {postSubmitting ? <Spinner size="sm" /> : <><Send className="h-3.5 w-3.5" />Paylaş</>}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-8">
              <Hash className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm mb-3">Paylaşım yapmak için topluluğa katılman gerekiyor</p>
              <button onClick={toggleMembership} disabled={joining} className="btn-primary">
                {joining ? <Spinner size="sm" /> : 'Topluluğa Katıl'}
              </button>
            </div>
          )}

          {posts.length === 0 && (
            <div className="card text-center py-12">
              <Hash className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Henüz paylaşım yok. İlk paylaşımı sen yap!</p>
            </div>
          )}
          {feedSearch && posts.filter(p => p.content?.toLowerCase().includes(feedSearch.toLowerCase())).length === 0 && posts.length > 0 && (
            <div className="card text-center py-8">
              <Search className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">"{feedSearch}" için sonuç bulunamadı</p>
            </div>
          )}
          {posts.filter(p => !feedSearch || p.content?.toLowerCase().includes(feedSearch.toLowerCase())).map(post => (
            <div key={post.id} className="card">
              <div className="flex items-start gap-3">
                <Link to={`/profile/${post.user_id}`}>
                  <UserAvatar profile={post.profiles} size="sm" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link to={`/profile/${post.user_id}`} className="text-sm font-semibold text-white hover:text-brand-400 transition-colors">
                        {post.profiles?.full_name || 'Kullanıcı'}
                      </Link>
                      <span className="text-xs text-zinc-600 ml-2">{timeLabel(post.created_at)}</span>
                    </div>
                    {(post.user_id === user?.id || isAdmin) && (
                      <button onClick={() => deletePost(post.id)}
                        className="p-1.5 text-zinc-700 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 mt-1 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  {post.image_url && (
                    post.image_url.includes('post-videos')
                      ? <video src={post.image_url} controls className="mt-2 rounded-xl max-h-80 w-full border border-zinc-700" style={{ background: '#000' }} />
                      : <img src={post.image_url} alt="" className="mt-2 rounded-xl max-h-80 w-full object-cover border border-zinc-700" />
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => togglePostLike(post.id)}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${post.liked_by_me ? 'text-red-400' : 'text-zinc-600 hover:text-red-400'}`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${post.liked_by_me ? 'fill-current' : ''}`} />
                      {post.like_count > 0 && post.like_count}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Chat Tab ── */}
      {tab === 'chat' && (
        <div className="card p-0 overflow-hidden">
          {!isMember ? (
            <div className="text-center py-14">
              <MessageCircle className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm mb-3">Sohbete katılmak için önce topluluğa katıl</p>
              <button onClick={toggleMembership} disabled={joining} className="btn-primary">
                {joining ? <Spinner size="sm" /> : 'Topluluğa Katıl'}
              </button>
            </div>
          ) : (
            <>
              <div className="h-[280px] sm:h-[420px] overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="h-10 w-10 text-zinc-700 mb-3" />
                    <p className="text-zinc-600 text-sm">Sohbeti başlat, konuşmayı açan ol!</p>
                  </div>
                ) : (
                  messages.map(m => {
                    const isMine = m.user_id === user?.id
                    return (
                      <div key={m.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                        {!isMine && (
                          <Link to={`/profile/${m.user_id}`} className="shrink-0">
                            <UserAvatar profile={m.profiles} size="xs" />
                          </Link>
                        )}
                        <div className={`max-w-xs lg:max-w-sm flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          {!isMine && (
                            <span className="text-[10px] text-zinc-600 mb-0.5 ml-1">
                              {m.profiles?.full_name || 'Kullanıcı'}
                            </span>
                          )}
                          <div className={`rounded-2xl text-sm leading-relaxed overflow-hidden ${
                            isMine
                              ? 'bg-brand-500 text-white rounded-br-sm'
                              : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                          }`}>
                            {m.image_url && (
                              <img src={m.image_url} alt="" className="max-w-[240px] w-full object-cover" />
                            )}
                            {m.content && (
                              <p className="px-3 py-2">{m.content}</p>
                            )}
                            <p className={`px-3 pb-2 text-[10px] text-right ${m.content ? '-mt-1' : 'pt-1'} ${isMine ? 'text-brand-200' : 'text-zinc-600'}`}>
                              {timeLabel(m.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatBottomRef} />
              </div>
              <div className="border-t border-zinc-800">
                {chatPreview && (
                  <div className="px-4 pt-3 relative inline-block">
                    <img src={chatPreview} alt="" className="max-h-24 rounded-lg border border-zinc-700 object-cover" />
                    <button type="button" onClick={() => { setChatFile(null); setChatPreview(null) }}
                      className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5">
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                )}
                <form onSubmit={sendChatMessage} className="flex gap-2 p-4 items-end">
                  <input ref={chatFileRef} type="file" accept="image/*" className="hidden" onChange={handleChatImage} />
                  <button type="button" onClick={() => chatFileRef.current?.click()}
                    className="p-2.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors shrink-0"
                    title="Fotoğraf gönder">
                    <Image className="h-4 w-4" />
                  </button>
                  <input
                    value={chatText}
                    onChange={e => setChatText(e.target.value)}
                    placeholder="Mesaj yaz..."
                    maxLength={1000}
                    className="input-base flex-1 text-sm py-2.5"
                  />
                  <button type="submit" disabled={(!chatText.trim() && !chatFile) || chatSending}
                    className="btn-primary px-4 flex items-center gap-1.5 shrink-0">
                    {chatSending ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Members Tab ── */}
      {tab === 'members' && (
        <div className="space-y-2">
          {members.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Henüz üye yok</p>
            </div>
          ) : (
            members.map(m => (
              <div
                key={m.user_id}
                className="card hover:border-zinc-700 transition-all flex items-center gap-3 py-3"
              >
                <Link to={`/profile/${m.user_id}`} className="shrink-0">
                  <UserAvatar profile={m.profiles} size="md" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${m.user_id}`}>
                    <p className="text-sm font-medium text-white hover:text-brand-400 transition-colors">
                      {m.profiles?.full_name || 'Kullanıcı'}
                    </p>
                  </Link>
                  <p className="text-xs text-zinc-600">{m.profiles?.role === 'pro' ? 'Servis Uzmanı' : 'Araç Sahibi'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(m.role === 'admin' || m.user_id === community.created_by) && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <Crown className="h-2.5 w-2.5" /> Admin
                    </span>
                  )}
                  <span className="text-xs text-zinc-600">
                    {new Date(m.joined_at).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── About Tab ── */}
      {tab === 'about' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-zinc-500" /> Topluluk Hakkında
            </h3>
            <p className="text-sm text-zinc-400">{community.description || 'Açıklama eklenmemiş.'}</p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{members.length}</p>
                <p className="text-xs text-zinc-500">Üye</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white">{posts.length}</p>
                <p className="text-xs text-zinc-500">Paylaşım</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2.5 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-zinc-600" />
                Herkese açık topluluk
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-600 text-xs">Kategori:</span>
                <span>{community.category || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-600 text-xs">Kuruldu:</span>
                <span>{new Date(community.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {community.rules && (
            <div className="card">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Topluluk Kuralları</h3>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{community.rules}</p>
            </div>
          )}

          {community.profiles && (
            <div className="card">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-400" /> Kurucu
              </h3>
              <Link to={`/profile/${community.created_by}`}
                className="flex items-center gap-3 hover:bg-zinc-800/50 p-2 -mx-2 rounded-xl transition-colors">
                <UserAvatar profile={community.profiles} size="md" />
                <div>
                  <p className="text-sm font-medium text-white">{community.profiles.full_name || 'Kullanıcı'}</p>
                  <p className="text-xs text-zinc-500">{community.profiles.role === 'pro' ? 'Servis Uzmanı' : 'Araç Sahibi'}</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Admin Tab ── */}
      {tab === 'admin' && isAdmin && (
        <div className="space-y-5">

          {/* Cover & Avatar */}
          <div className="card">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <Image className="h-4 w-4 text-zinc-500" /> Görsel Ayarları
            </h3>

            {/* Cover image */}
            <div className="mb-4">
              <p className="text-xs text-zinc-500 mb-2">Kapak Fotoğrafı</p>
              <div className="relative h-28 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
                {(coverPreview || community.cover_url) ? (
                  <img src={coverPreview || community.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-brand-900/40 to-zinc-900/40 flex items-center justify-center">
                    <p className="text-xs text-zinc-600">Kapak fotoğrafı yok</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => coverFileRef.current?.click()}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 text-xs bg-black/70 hover:bg-black/90 text-white px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Upload className="h-3 w-3" /> Değiştir
                </button>
                {coverPreview && (
                  <button
                    type="button"
                    onClick={() => { setCoverFile(null); setCoverPreview(null) }}
                    className="absolute top-2 right-2 bg-black/70 rounded-full p-1 hover:bg-black/90 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                )}
              </div>
              <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverImage} />
            </div>

            {/* Avatar */}
            <div>
              <p className="text-xs text-zinc-500 mb-2">Topluluk Avatarı</p>
              <div className="flex items-center gap-3">
                <div className="relative">
                  {(avatarPreview || community.avatar_url) ? (
                    <img src={avatarPreview || community.avatar_url} alt="" className="h-16 w-16 rounded-xl object-cover border-2 border-zinc-700" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-brand-500/20 border-2 border-zinc-700 flex items-center justify-center">
                      <Hash className="h-8 w-8 text-brand-400" />
                    </div>
                  )}
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => { setAvatarFile(null); setAvatarPreview(null) }}
                      className="absolute -top-1.5 -right-1.5 bg-zinc-900 border border-zinc-700 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3 text-zinc-400" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarFileRef.current?.click()}
                  className="btn-ghost text-sm flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" /> Avatar Yükle
                </button>
                <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarImage} />
              </div>
            </div>
          </div>

          {/* Basic settings */}
          <div className="card">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4 text-zinc-500" /> Temel Bilgiler
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Topluluk Adı</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  maxLength={60}
                  className="input-base w-full text-sm"
                  placeholder="Topluluk adı..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Açıklama <span className="text-zinc-600">(isteğe bağlı)</span>
                </label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="input-base w-full text-sm resize-none"
                  placeholder="Topluluk hakkında kısa bir açıklama..."
                />
                <p className="text-xs text-zinc-700 mt-1 text-right">{editDesc.length}/500</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Kategori</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="input-base w-full text-sm"
                >
                  <option value="">Kategori seç...</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Topluluk Kuralları <span className="text-zinc-600">(isteğe bağlı)</span>
                </label>
                <textarea
                  value={editRules}
                  onChange={e => setEditRules(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  className="input-base w-full text-sm resize-none font-mono"
                  placeholder={"1. Saygılı ol\n2. Konu dışı içerik paylaşma\n3. ..."}
                />
                <p className="text-xs text-zinc-700 mt-1 text-right">{editRules.length}/2000</p>
              </div>

            </div>

            <button
              onClick={saveSettings}
              disabled={editSaving || !editName.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
            >
              {editSaving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
              Değişiklikleri Kaydet
            </button>
          </div>

          {/* Member management */}
          <div className="card">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-500" /> Üye Yönetimi
              <span className="ml-auto text-xs text-zinc-600 font-normal">{members.length} üye</span>
            </h3>

            <div className="space-y-2">
              {members.map(m => {
                const isCreator   = m.user_id === community.created_by
                const memberAdmin = m.role === 'admin' || isCreator
                const isSelf      = m.user_id === user?.id
                return (
                  <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-800/40 transition-colors">
                    <Link to={`/profile/${m.user_id}`} className="shrink-0">
                      <UserAvatar profile={m.profiles} size="sm" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-white truncate">{m.profiles?.full_name || 'Kullanıcı'}</p>
                        {isCreator && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Crown className="h-2.5 w-2.5" /> Kurucu
                          </span>
                        )}
                        {!isCreator && memberAdmin && (
                          <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600">
                        {new Date(m.joined_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {!isSelf && !isCreator && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleMemberRole(m)}
                          title={memberAdmin ? 'Admin rolünü kaldır' : 'Admin yap'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            memberAdmin
                              ? 'text-blue-400 hover:bg-blue-500/10'
                              : 'text-zinc-600 hover:text-blue-400 hover:bg-blue-500/10'
                          }`}
                        >
                          {memberAdmin ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => setKickDialog({ memberId: m.user_id, memberName: m.profiles?.full_name || 'Kullanıcı' })}
                          title="Topluluktan çıkar"
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setBanDialog({ memberId: m.user_id, memberName: m.profiles?.full_name || 'Kullanıcı' })}
                          title="Banla"
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Danger zone */}
          <div className="card border-red-500/20">
            <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Tehlikeli Bölge
            </h3>
            <p className="text-xs text-zinc-500 mb-3">
              Topluluğu silmek geri alınamaz. Tüm paylaşımlar, mesajlar ve üyelikler kalıcı olarak silinir.
            </p>
            <div className="space-y-2">
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={`"${community.name}" yaz ve onayla`}
                className="input-base w-full text-sm border-red-500/20 focus:border-red-500/50"
              />
              <button
                onClick={deleteCommunity}
                disabled={deleteConfirm !== community.name}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                Topluluğu Kalıcı Olarak Sil
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
