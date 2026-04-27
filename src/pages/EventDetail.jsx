import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Tag, Trash2, ArrowLeft, Share2, ExternalLink, MessageCircle, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import UserAvatar from '../components/ui/UserAvatar'
import Spinner from '../components/ui/Spinner'
import { useMeta } from '../hooks/useMeta'
import toast from 'react-hot-toast'
import EventMapPin from '../components/map/EventMapPin'

const fmtDate = dt =>
  new Date(dt).toLocaleString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

export default function EventDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const commentRef = useRef()

  useMeta(event?.title || 'Etkinlik')

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    const [evRes, attRes, cmtRes] = await Promise.all([
      supabase.from('events')
        .select('*, profiles:user_id(id, full_name, avatar_url)')
        .eq('id', id)
        .single(),
      supabase.from('event_attendees')
        .select('user_id, profiles:user_id(id, full_name, avatar_url, role)')
        .eq('event_id', id),
      supabase.from('event_comments')
        .select('*, profiles:user_id(id, full_name, avatar_url, role)')
        .eq('event_id', id)
        .order('created_at', { ascending: true }),
    ])
    setEvent(evRes.data)
    setAttendees(attRes.data || [])
    setComments(cmtRes.data || [])
    setLoading(false)
  }

  async function handleSendComment(e) {
    e.preventDefault()
    const text = commentText.trim()
    if (!text || sendingComment) return
    setSendingComment(true)
    const { data, error } = await supabase
      .from('event_comments')
      .insert({ event_id: id, user_id: user.id, content: text })
      .select('*, profiles(id, full_name, avatar_url, role)')
      .single()
    if (error) { toast.error('Yorum gönderilemedi'); setSendingComment(false); return }
    setComments(prev => [...prev, data])
    setCommentText('')
    setSendingComment(false)
  }

  async function handleDeleteComment(commentId) {
    const { error } = await supabase.from('event_comments').delete().eq('id', commentId).eq('user_id', user.id)
    if (!error) setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const isPast   = event && new Date(event.event_date) < new Date()
  const isOwner  = event?.user_id === user?.id
  const isJoined = attendees.some(a => a.user_id === user?.id)

  async function handleJoinToggle() {
    if (!user) return
    setJoining(true)
    try {
      if (isJoined) {
        await supabase.from('event_attendees').delete().eq('event_id', id).eq('user_id', user.id)
        setAttendees(prev => prev.filter(a => a.user_id !== user.id))
        toast.success('Etkinlikten ayrıldın')
      } else {
        await supabase.from('event_attendees').insert({ event_id: id, user_id: user.id })
        await fetchAll()
        toast.success('Etkinliğe katıldın!')
      }
    } finally {
      setJoining(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Bu etkinliği silmek istediğine emin misin?')) return
    const { error } = await supabase.from('events').delete().eq('id', id).eq('user_id', user.id)
    if (error) { toast.error('Silinemedi'); return }
    toast.success('Etkinlik silindi')
    navigate('/events')
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: event.title, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link kopyalandı!')
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  if (!event) return (
    <div className="text-center py-16 max-w-sm mx-auto">
      <p className="text-zinc-400 mb-4">Etkinlik bulunamadı.</p>
      <Link to="/events" className="btn-secondary">Etkinliklere Dön</Link>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <Link to="/events" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Etkinlikler
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={handleShare}
            className="p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
          {isOwner && !isPast && (
            <button onClick={handleDelete}
              className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cover image */}
      {event.cover_image && (
        <div className="rounded-2xl overflow-hidden mb-4 h-52 sm:h-64">
          <img src={event.cover_image} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Main card */}
      <div className="card mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            {event.category && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full mb-2">
                <Tag className="h-2.5 w-2.5" /> {event.category}
              </span>
            )}
            <h1 className="text-xl font-bold text-white leading-snug">{event.title}</h1>
          </div>
          {isPast && (
            <span className="text-[10px] text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full shrink-0">
              Geçmiş
            </span>
          )}
        </div>

        {/* Date */}
        <div className="flex items-start gap-3 mb-3 p-3 bg-zinc-800/50 rounded-xl">
          <Calendar className="h-4 w-4 text-brand-400 mt-0.5 shrink-0" />
          <p className="text-sm font-medium text-white">{fmtDate(event.event_date)}</p>
        </div>

        {/* Location with map link */}
        {event.location && (
          <>
            <a href={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}`}
              target="_blank" rel="noreferrer"
              className="flex items-start gap-3 mb-3 p-3 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors group">
              <MapPin className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0 group-hover:text-brand-400 transition-colors" />
              <div>
                <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">{event.location}</p>
                <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Google Maps'te aç
                </p>
              </div>
            </a>
            <EventMapPin location={event.location} title={event.title} />
          </>
        )}

        {event.description && (
          <p className="text-zinc-400 text-sm leading-relaxed mb-4">{event.description}</p>
        )}

        {/* Creator + join button */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <Link to={`/profile/${event.user_id}`}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <UserAvatar profile={event.profiles} size="sm" />
            <div>
              <p className="text-sm font-medium text-zinc-200">{event.profiles?.full_name || 'Kullanıcı'}</p>
              <p className="text-xs text-zinc-600">Etkinliği oluşturdu</p>
            </div>
          </Link>
          {!isPast && !isOwner && (
            <button
              onClick={handleJoinToggle}
              disabled={joining}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-60 ${
                isJoined
                  ? 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
              }`}
            >
              {isJoined ? 'Ayrıl' : 'Katıl'}
            </button>
          )}
          {isOwner && !isPast && (
            <span className="text-xs text-zinc-600">Senin etkinliğin</span>
          )}
        </div>
      </div>

      {/* Attendees */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-white text-sm">{attendees.length} Katılımcı</h2>
        </div>
        {attendees.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-3">
            {isPast ? 'Bu etkinliğe kimse katılmadı.' : 'Henüz kimse katılmadı. İlk sen katıl!'}
          </p>
        ) : (
          <div className="space-y-1">
            {attendees.map(a => (
              <Link key={a.user_id} to={`/profile/${a.user_id}`}
                className="flex items-center gap-3 hover:bg-zinc-800 rounded-xl px-2 py-2.5 transition-colors -mx-2">
                <UserAvatar profile={a.profiles} size="sm" />
                <div>
                  <p className="text-sm font-medium text-zinc-200">{a.profiles?.full_name || 'İsimsiz'}</p>
                  <p className="text-xs text-zinc-600">
                    {a.profiles?.role === 'pro' ? 'Servis Uzmanı' : 'Araç Sahibi'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold text-white text-sm">Yorumlar {comments.length > 0 && `(${comments.length})`}</h2>
        </div>

        {/* Comment list */}
        {comments.length > 0 && (
          <div className="space-y-3 mb-4">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3 group">
                <Link to={`/profile/${c.user_id}`} className="shrink-0">
                  <UserAvatar profile={c.profiles} size="xs" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link to={`/profile/${c.user_id}`} className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors">
                      {c.profiles?.full_name || 'İsimsiz'}
                    </Link>
                    <span className="text-[10px] text-zinc-600">
                      {new Date(c.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {c.user_id === user?.id && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="ml-auto text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-[10px]"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comment input */}
        <form onSubmit={handleSendComment} className="flex items-center gap-2">
          <UserAvatar profile={profile} size="xs" />
          <div className="flex-1 flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2 border border-zinc-700 focus-within:border-zinc-600">
            <input
              ref={commentRef}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Bir yorum yaz..."
              maxLength={500}
              className="flex-1 bg-transparent text-sm text-zinc-300 placeholder-zinc-600 outline-none"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || sendingComment}
              className="text-zinc-500 hover:text-brand-400 disabled:opacity-30 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
