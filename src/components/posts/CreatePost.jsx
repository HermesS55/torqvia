import { useEffect, useRef, useState } from 'react'
import { Image, X, AtSign, Send, Video, Lock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { uploadPostImage, uploadPostVideo } from '../../lib/avatar'
import { useAuth } from '../../contexts/AuthContext'
import UserAvatar from '../ui/UserAvatar'
import PlanBadge from '../ui/PlanBadge'
import Spinner from '../ui/Spinner'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { validateImageFile, validateVideoFile } from '../../lib/security'

const VIDEO_LIMITS = { turbo: 50, elite: 200 } // MB

export default function CreatePost({ onCreated }) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [mediaType, setMediaType] = useState(null) // 'image' | 'video'
  const [tagSearch, setTagSearch] = useState('')
  const [tagResults, setTagResults] = useState([])
  const [taggedUsers, setTaggedUsers] = useState([])
  const [showTagSearch, setShowTagSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showVideoGate, setShowVideoGate] = useState(false)
  const imageRef = useRef()
  const videoRef = useRef()
  const tagRef = useRef()

  const plan = profile?.plan || 'free'
  const canVideo = plan === 'turbo' || plan === 'elite'
  const videoLimitMB = VIDEO_LIMITS[plan] || 0

  useEffect(() => {
    if (!tagSearch.trim()) { setTagResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .neq('id', user.id)
        .or(`full_name.ilike.%${tagSearch}%`)
        .limit(5)
      setTagResults(data || [])
    }, 300)
    return () => clearTimeout(t)
  }, [tagSearch])

  async function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      await validateImageFile(file, 5 * 1024 * 1024)
    } catch (err) {
      toast.error(err.message)
      e.target.value = ''
      return
    }
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
    setMediaType('image')
  }

  async function handleVideo(e) {
    const file = e.target.files[0]
    if (!file) return
    const maxBytes = videoLimitMB * 1024 * 1024
    try {
      await validateVideoFile(file, maxBytes)
    } catch (err) {
      toast.error(err.message)
      e.target.value = ''
      return
    }
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
    setMediaType('video')
  }

  function clearMedia() {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    if (imageRef.current) imageRef.current.value = ''
    if (videoRef.current) videoRef.current.value = ''
  }

  function addTag(u) {
    if (taggedUsers.find(t => t.id === u.id)) return
    setTaggedUsers(prev => [...prev, u])
    setTagSearch('')
    setTagResults([])
    setShowTagSearch(false)
    setContent(c => c + `@${u.full_name || 'kullanıcı'} `)
  }

  function removeTag(id) {
    setTaggedUsers(prev => prev.filter(t => t.id !== id))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    try {
      let imageUrl = null
      let videoUrl = null

      if (mediaFile && mediaType === 'image') imageUrl = await uploadPostImage(user.id, mediaFile)
      if (mediaFile && mediaType === 'video') videoUrl = await uploadPostVideo(user.id, mediaFile)

      const { data: post, error } = await supabase
        .from('posts')
        .insert({ user_id: user.id, content: content.trim(), image_url: imageUrl, video_url: videoUrl })
        .select('*, profiles!posts_user_id_fkey(id, avatar_url, full_name, role, specialty, plan)')
        .single()
      if (error) throw error

      if (taggedUsers.length > 0) {
        await supabase.from('post_tags').insert(
          taggedUsers.map(u => ({ post_id: post.id, tagged_user_id: u.id }))
        )
        await supabase.from('notifications').insert(
          taggedUsers.map(u => ({
            user_id: u.id,
            type: 'mention',
            from_user_id: user.id,
            post_id: post.id,
            message: content.slice(0, 80),
          }))
        )
      }

      setContent('')
      clearMedia()
      setTaggedUsers([])
      toast.success('Paylaşıldı!')
      onCreated?.({
        ...post,
        post_tags: taggedUsers.map(u => ({ tagged_user_id: u.id, profiles: u })),
        like_count: 0, comment_count: 0, liked_by_me: false,
      })
    } catch (err) {
      toast.error(err.message || 'Paylaşılamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mb-6">
      <div className="flex gap-3">
        <UserAvatar profile={profile} email={user?.email} size="md" />
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={profile?.role === 'pro'
                ? 'Yaptığın işi paylaş, deneyimini anlat...'
                : 'Aracın hakkında bir şeyler yaz...'
              }
              rows={3}
              maxLength={1000}
              className="input-base resize-none text-sm"
            />

            {/* Tagged users */}
            {taggedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {taggedUsers.map(u => (
                  <span key={u.id} className="inline-flex items-center gap-1 bg-brand-500/15 text-brand-400 text-xs px-2 py-1 rounded-full">
                    @{u.full_name || 'kullanıcı'}
                    <button type="button" onClick={() => removeTag(u.id)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Media preview */}
            {mediaPreview && (
              <div className="relative mt-2 inline-block">
                {mediaType === 'video' ? (
                  <video
                    src={mediaPreview}
                    className="max-h-48 rounded-lg border border-zinc-700 bg-black"
                    controls
                    muted
                  />
                ) : (
                  <img src={mediaPreview} alt="" className="max-h-40 rounded-lg border border-zinc-700 object-cover" />
                )}
                <button type="button" onClick={clearMedia}
                  className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5">
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            )}

            {/* Video gate tooltip */}
            {showVideoGate && (
              <div className="mt-2 p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-zinc-400 flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                <span>
                  Video paylaşımı <PlanBadge plan="turbo" size="xs" /> ve üzeri planlarda kullanılabilir.{' '}
                  <Link to="/pricing" className="text-orange-400 hover:underline font-medium">Planını yükselt</Link>
                </span>
              </div>
            )}

            {/* Tag search */}
            {showTagSearch && (
              <div className="relative mt-2" ref={tagRef}>
                <input
                  value={tagSearch}
                  onChange={e => setTagSearch(e.target.value)}
                  placeholder="Kullanıcı ara..."
                  className="input-base text-sm py-2"
                  autoFocus
                />
                {tagResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden z-10 shadow-xl">
                    {tagResults.map(u => (
                      <button key={u.id} type="button" onClick={() => addTag(u)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-700 transition-colors text-left">
                        <UserAvatar profile={u} size="xs" />
                        <span className="text-sm text-zinc-200">{u.full_name || 'İsimsiz'}</span>
                        <span className="text-xs text-zinc-500 ml-auto">{u.role === 'pro' ? 'Uzman' : 'Sahip'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-1">
                <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
                <input ref={videoRef} type="file" accept="video/mp4,video/mov,video/webm,video/*" className="hidden" onChange={handleVideo} />

                <button type="button" onClick={() => { setShowVideoGate(false); imageRef.current?.click() }}
                  className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors" title="Fotoğraf ekle">
                  <Image className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  title={canVideo ? 'Video ekle' : 'Video — Turbo veya Elite gerekli'}
                  onClick={() => {
                    if (!canVideo) { setShowVideoGate(v => !v); return }
                    setShowVideoGate(false)
                    videoRef.current?.click()
                  }}
                  className={`p-2 rounded-lg transition-colors relative ${
                    canVideo
                      ? 'text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10'
                      : 'text-zinc-700 cursor-not-allowed'
                  }`}
                >
                  <Video className="h-4 w-4" />
                  {!canVideo && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 rounded-full h-2 w-2" />
                  )}
                </button>

                <button type="button" onClick={() => setShowTagSearch(s => !s)}
                  className={`p-2 rounded-lg transition-colors ${showTagSearch ? 'text-brand-400 bg-brand-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                  title="Kullanıcı etiketle">
                  <AtSign className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-600">{content.length}/1000</span>
                <button type="submit" disabled={!content.trim() || loading}
                  className="btn-primary flex items-center gap-1.5 text-sm py-2">
                  {loading ? <Spinner size="sm" /> : <><Send className="h-3.5 w-3.5" />Paylaş</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
