import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Repeat2, Trash2, Car, Wrench, Volume2, VolumeX, MoreHorizontal, Pin, Share2, Flag, ShieldOff, Edit2, Link2, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useT } from '../../contexts/LangContext'
import UserAvatar from '../ui/UserAvatar'
import PlanBadge from '../ui/PlanBadge'
import { useLightbox, MediaThumb } from '../ui/MediaLightbox'
import CommentModal from './CommentModal'
import SharePostModal from './SharePostModal'
import ReportModal from '../ui/ReportModal'
import toast from 'react-hot-toast'

function RoleBadge({ role }) {
  return role === 'owner'
    ? <span className="inline-flex items-center gap-1 text-[10px] text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-full"><Car className="h-2.5 w-2.5" />Araç Sahibi</span>
    : <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full"><Wrench className="h-2.5 w-2.5" />Servis Uzmanı</span>
}

function renderContent(content) {
  return content.split(/(@\S+|#\S+)/g).map((part, i) => {
    if (part.startsWith('@')) return <span key={i} className="text-brand-400 font-medium">{part}</span>
    if (part.startsWith('#')) return (
      <Link key={i} to={`/search?q=${encodeURIComponent(part)}`}
        className="text-brand-400 font-medium hover:underline" onClick={e => e.stopPropagation()}>
        {part}
      </Link>
    )
    return part
  })
}

function VideoPlayer({ src, onOpen }) {
  const [muted, setMuted] = useState(true)
  return (
    <div className="relative mt-3 rounded-xl overflow-hidden border border-zinc-800 bg-black group cursor-pointer"
      onClick={() => onOpen?.(src, 'video')}>
      <video
        src={src}
        className="w-full max-h-72 object-contain"
        muted={muted}
        playsInline
        preload="metadata"
        onClick={e => e.stopPropagation()}
        controls
      />
      <button
        onClick={e => { e.stopPropagation(); setMuted(m => !m) }}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
      >
        {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

function PostMenu({ isOwn, isPinned, postId, onDelete, onPin, onEdit, onReport, onBlock }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyLink() {
    const url = `${window.location.origin}/posts/${postId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
    setOpen(false)
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="p-1 text-zinc-700 hover:text-zinc-400 rounded transition-colors">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden">
            <button onClick={copyLink}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Link2 className="h-3.5 w-3.5" />}
              {copied ? 'Kopyalandı!' : 'Linki Kopyala'}
            </button>
            <div className="border-t border-zinc-800" />
            {isOwn ? (
              <>
                <button onClick={() => { onEdit(); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                  <Edit2 className="h-3.5 w-3.5" />
                  Düzenle
                </button>
                <button onClick={() => { onPin(); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                  <Pin className="h-3.5 w-3.5" />
                  {isPinned ? 'Sabitlemeyi Kaldır' : 'Profile Sabitle'}
                </button>
                <div className="border-t border-zinc-800" />
                <button onClick={() => { onDelete(); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                  Sil
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { onReport(); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                  <Flag className="h-3.5 w-3.5" />
                  Şikayet Et
                </button>
                <div className="border-t border-zinc-800" />
                <button onClick={() => { onBlock(); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <ShieldOff className="h-3.5 w-3.5" />
                  Engelle
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function PostCard({ post, onDelete, onRepost, pinnedPostId }) {
  const { user } = useAuth()
  const t = useT()
  const { show: showMedia, LightboxModal } = useLightbox()
  const [liked, setLiked] = useState(post.liked_by_me || false)
  const [likeCount, setLikeCount] = useState(post.like_count || 0)
  const [commentCount, setCommentCount] = useState(post.comment_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reposting, setReposting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content || '')
  const [saving, setSaving] = useState(false)

  const isOwn = post.user_id === user?.id
  const isPinned = pinnedPostId === post.id
  const author = post.profiles

  async function toggleLike() {
    if (liked) {
      setLiked(false)
      setLikeCount(c => c - 1)
      await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: user.id })
    } else {
      setLiked(true)
      setLikeCount(c => c + 1)
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
      if (post.user_id !== user.id) {
        supabase.from('notifications').insert({
          user_id: post.user_id,
          type: 'like',
          from_user_id: user.id,
          post_id: post.id,
        }).then(() => {})
      }
    }
  }

  async function handleRepost() {
    if (reposting) return
    setReposting(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({ user_id: user.id, content: post.content, repost_of: post.id })
        .select('*, profiles!posts_user_id_fkey(id, avatar_url, full_name, role, specialty, plan)')
        .single()
      if (error) throw error
      toast.success(t('post.reposted'))
      onRepost?.(data)
    } catch { toast.error(t('post.repostFailed')) }
    finally { setReposting(false) }
  }

  async function handleDelete() {
    if (!confirm(t('post.deleted'))) return
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (!error) onDelete?.(post.id)
    else toast.error('Silinemedi')
  }

  async function handlePin() {
    const newPinId = isPinned ? null : post.id
    const { error } = await supabase.from('profiles').update({ pinned_post_id: newPinId }).eq('id', user.id)
    if (error) toast.error('Kaydedilemedi')
    else toast.success(isPinned ? 'Sabitleme kaldırıldı' : 'Gönderi profile sabitlendi!')
  }

  async function handleEdit() {
    if (!editContent.trim()) return
    setSaving(true)
    const { error } = await supabase.from('posts').update({ content: editContent.trim() }).eq('id', post.id)
    if (error) toast.error('Düzenlenemedi')
    else {
      post.content = editContent.trim()
      setEditing(false)
      toast.success('Gönderi güncellendi')
    }
    setSaving(false)
  }

  async function handleBlock() {
    if (!confirm(`${author?.full_name || 'Bu kullanıcıyı'} engellemek istediğinizden emin misiniz?`)) return
    const { error } = await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: post.user_id })
    if (error && error.code !== '23505') toast.error('Engellenemedi')
    else { toast.success('Kullanıcı engellendi'); onDelete?.(post.id) }
  }

  const timeAgo = (() => {
    const diff = Date.now() - new Date(post.created_at)
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'şimdi'
    if (m < 60) return `${m}d`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}s`
    const d = Math.floor(h / 24)
    if (d < 7) return `${d}g`
    return new Date(post.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  })()

  return (
    <>
      <div className="card hover:border-zinc-700 transition-colors">
        {isPinned && (
          <div className="flex items-center gap-1.5 text-[10px] text-brand-400 font-medium mb-2">
            <Pin className="h-3 w-3" />
            Sabitlenmiş Gönderi
          </div>
        )}
        {post.repost_of && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-3">
            <Repeat2 className="h-3 w-3" />
            {t('post.repost')}
          </div>
        )}

        <div className="flex items-start gap-3">
          <Link to={`/profile/${post.user_id}`}>
            <UserAvatar profile={author} email={author?.email} size="md" />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link to={`/profile/${post.user_id}`} className="font-semibold text-white hover:text-brand-400 transition-colors text-sm">
                  {author?.full_name || author?.email || 'Kullanıcı'}
                </Link>
                {author?.role && <RoleBadge role={author.role} />}
                {author?.plan && author.plan !== 'free' && (
                  <PlanBadge plan={author.plan} size="xs" />
                )}
                {author?.specialty && (
                  <span className="text-[10px] text-zinc-500 hidden sm:inline">· {author.specialty}</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link to={`/posts/${post.id}`} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                  {timeAgo}
                </Link>
                <PostMenu
                  isOwn={isOwn}
                  isPinned={isPinned}
                  postId={post.id}
                  onDelete={handleDelete}
                  onPin={handlePin}
                  onEdit={() => { setEditing(true); setEditContent(post.content || '') }}
                  onReport={() => setShowReport(true)}
                  onBlock={handleBlock}
                />
              </div>
            </div>

            {editing ? (
              <div className="mt-1.5">
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="input-base w-full resize-none text-sm"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleEdit} disabled={saving || !editContent.trim()}
                    className="flex items-center gap-1 btn-primary text-xs px-3 py-1.5">
                    {saving ? '...' : <><Check className="h-3 w-3" />Kaydet</>}
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="btn-secondary text-xs px-3 py-1.5">İptal</button>
                </div>
              </div>
            ) : (
              <p className="text-zinc-300 text-sm mt-1.5 leading-relaxed whitespace-pre-wrap">
                {renderContent(post.content)}
              </p>
            )}

            {post.post_tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {post.post_tags.map(tag => (
                  <Link key={tag.tagged_user_id} to={`/profile/${tag.tagged_user_id}`}
                    className="text-xs text-brand-400 hover:underline">
                    @{tag.profiles?.full_name || 'kullanıcı'}
                  </Link>
                ))}
              </div>
            )}

            {post.image_url && (
              <MediaThumb src={post.image_url} type="image" onOpen={showMedia} className="mt-3">
                <img src={post.image_url} alt="" className="rounded-xl w-full max-h-80 object-cover border border-zinc-800" />
              </MediaThumb>
            )}

            {post.video_url && <VideoPlayer src={post.video_url} onOpen={showMedia} />}

            <div className="flex items-center gap-5 mt-3 pt-3 border-t border-zinc-800/60">
              <button
                onClick={toggleLike}
                className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'}`}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-red-400' : ''}`} />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>

              <button
                onClick={() => setShowComments(true)}
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-blue-400 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                {commentCount > 0 && <span>{commentCount}</span>}
              </button>

              <button
                onClick={handleRepost}
                disabled={reposting || isOwn}
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Repeat2 className="h-4 w-4" />
              </button>

              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-brand-400 transition-colors ml-auto"
                title="DM ile paylaş"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showComments && (
        <CommentModal
          post={post}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentCount(c => c + 1)}
        />
      )}
      {showShare && <SharePostModal post={post} onClose={() => setShowShare(false)} />}
      {showReport && (
        <ReportModal
          targetType="post"
          targetId={post.id}
          reportedUserId={post.user_id}
          onClose={() => setShowReport(false)}
        />
      )}
      <LightboxModal />
    </>
  )
}
