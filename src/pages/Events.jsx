import { useEffect, useRef, useState } from 'react'
import { Calendar, MapPin, PlusCircle, X, Users, Clock, Tag, Trash2, ImagePlus, ExternalLink, Map, List } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { uploadEventImage } from '../lib/avatar'
import UserAvatar from '../components/ui/UserAvatar'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { Link } from 'react-router-dom'
import { useMeta } from '../hooks/useMeta'
import toast from 'react-hot-toast'
import LocationAutocomplete from '../components/ui/LocationAutocomplete'
import EventsMapView from '../components/map/EventsMapView'

const CATEGORIES = ['Buluşma', 'Yarış', 'Fuar', 'Sergi', 'Etkinlik', 'Diğer']

const fmtDate = dt =>
  new Date(dt).toLocaleString('tr-TR', {
    weekday: 'short', day: 'numeric', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

/* ── Event card ──────────────────────────────────────────── */
function EventCard({ event, currentUserId, onJoinToggle, onDelete }) {
  const isOwner    = event.user_id === currentUserId
  const isPast     = new Date(event.event_date) < new Date()
  const isJoined   = event.event_attendees?.some(a => a.user_id === currentUserId)
  const attendeeCount = event.event_attendees?.length || 0

  return (
    <div className={`card hover:border-zinc-700 transition-colors flex flex-col gap-3 ${isPast ? 'opacity-60' : ''}`}>
      {event.cover_image && (
        <div className="-mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-1 h-36 overflow-hidden rounded-t-xl">
          <img src={event.cover_image} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {event.category && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full mb-1.5">
              <Tag className="h-2.5 w-2.5" /> {event.category}
            </span>
          )}
          <Link to={`/events/${event.id}`}
            className="block font-semibold text-white text-sm leading-snug hover:text-brand-400 transition-colors">
            {event.title}
          </Link>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isPast && (
            <span className="text-[10px] text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">
              Geçmiş
            </span>
          )}
          {isOwner && !isPast && (
            <button onClick={() => onDelete(event.id)}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {event.description && (
        <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">{event.description}</p>
      )}

      {/* Meta */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Clock className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
          <span className="truncate">{fmtDate(event.event_date)}</span>
        </div>
        {event.location && (
          <a href={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}`}
            target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-brand-400 transition-colors">
            <MapPin className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
            <span className="truncate">{event.location}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
          </a>
        )}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Users className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
          {attendeeCount} katılımcı
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800 mt-auto">
        <Link to={`/profile/${event.user_id}`}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          onClick={e => e.stopPropagation()}>
          <UserAvatar profile={event.profiles} size="xs" />
          <span className="text-xs text-zinc-500 truncate max-w-[100px]">
            {event.profiles?.full_name || 'Kullanıcı'}
          </span>
        </Link>
        {!isPast && !isOwner && (
          <button
            onClick={() => onJoinToggle(event.id, isJoined)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              isJoined
                ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400'
                : 'bg-brand-500 border-brand-500 text-white hover:bg-brand-600'
            }`}
          >
            {isJoined ? 'Ayrıl' : 'Katıl'}
          </button>
        )}
        {isOwner && !isPast && (
          <Link to={`/events/${event.id}`}
            className="text-xs text-zinc-600 hover:text-brand-400 transition-colors">
            Detaylar →
          </Link>
        )}
      </div>
    </div>
  )
}

/* ── Create modal ─────────────────────────────────────────── */
function CreateModal({ onClose, onCreated }) {
  const { user } = useAuth()
  const fileRef = useRef()
  const [form, setForm] = useState({
    title: '', description: '', event_date: '', location: '', category: 'Buluşma', cover_image: '',
  })
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  async function handleImageSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Görsel 5MB\'dan büyük olamaz'); return }
    setUploading(true)
    try {
      const url = await uploadEventImage(user.id, file)
      set('cover_image', url)
    } catch {
      toast.error('Görsel yüklenemedi')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Etkinlik adı zorunludur.'); return }
    if (!form.event_date)   { setError('Tarih ve saat zorunludur.'); return }

    setCreating(true)
    try {
      const { error: err } = await supabase.from('events').insert({
        user_id:     user.id,
        title:       form.title.trim(),
        description: form.description.trim() || null,
        event_date:  new Date(form.event_date).toISOString(),
        location:    form.location.trim() || null,
        category:    form.category,
        cover_image: form.cover_image || null,
      })
      if (err) { setError(err.message); return }
      toast.success('Etkinlik oluşturuldu!')
      onCreated()
    } catch {
      setError('Beklenmeyen bir hata oluştu.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full sm:max-w-md bg-zinc-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-zinc-800 overflow-y-auto max-h-[92vh]"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white">Etkinlik Oluştur</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 pb-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 text-red-400 text-xs leading-relaxed">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Etkinlik Adı *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Örn: İstanbul Klasik Araç Buluşması" className="input-base" maxLength={120} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Açıklama</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Etkinlik hakkında bilgi ver..." rows={3} maxLength={500}
              className="input-base resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tarih & Saat *</label>
              <input type="datetime-local" value={form.event_date}
                onChange={e => set('event_date', e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="input-base text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Kategori</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="input-base text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Konum</label>
            <LocationAutocomplete
              value={form.location}
              onChange={val => set('location', val)}
              placeholder="Örn: İstanbul, Atatürk Havalimanı"
            />
          </div>

          {/* Cover image upload */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Kapak Görseli</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            {form.cover_image ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={form.cover_image} alt="" className="w-full h-32 object-cover" />
                <button type="button" onClick={() => set('cover_image', '')}
                  className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-red-500/80 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full flex items-center justify-center gap-2 h-20 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors text-sm disabled:opacity-50">
                {uploading ? <Spinner size="sm" /> : <ImagePlus className="h-4 w-4" />}
                {uploading ? 'Yükleniyor...' : 'Fotoğraf Seç'}
              </button>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">İptal</button>
            <button type="submit" disabled={creating || uploading}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {creating ? <Spinner size="sm" /> : <Calendar className="h-4 w-4" />}
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────── */
export default function Events() {
  useMeta('Etkinlikler')
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab] = useState('upcoming')
  const [viewMode, setViewMode] = useState('list')

  useEffect(() => { fetchEvents() }, [])

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles:user_id(id, full_name, avatar_url),
        event_attendees(user_id)
      `)
      .order('event_date', { ascending: true })
    if (error) toast.error('Yükleme hatası: ' + error.message)
    setEvents(data || [])
    setLoading(false)
  }

  async function handleJoinToggle(eventId, isJoined) {
    if (!user) return
    if (isJoined) {
      await supabase.from('event_attendees').delete().eq('event_id', eventId).eq('user_id', user.id)
    } else {
      await supabase.from('event_attendees').insert({ event_id: eventId, user_id: user.id })
    }
    setEvents(prev => prev.map(ev => {
      if (ev.id !== eventId) return ev
      const attendees = ev.event_attendees || []
      return {
        ...ev,
        event_attendees: isJoined
          ? attendees.filter(a => a.user_id !== user.id)
          : [...attendees, { user_id: user.id }],
      }
    }))
  }

  async function handleDelete(eventId) {
    if (!window.confirm('Bu etkinliği silmek istediğine emin misin?')) return
    const { error } = await supabase.from('events').delete().eq('id', eventId).eq('user_id', user.id)
    if (error) { toast.error('Silinemedi: ' + error.message); return }
    setEvents(prev => prev.filter(e => e.id !== eventId))
    toast.success('Etkinlik silindi.')
  }

  const now      = new Date()
  const upcoming = events.filter(e => new Date(e.event_date) >= now)
  const past     = events.filter(e => new Date(e.event_date) < now)
  const mine     = events.filter(e => e.user_id === user?.id)
  const joined   = events.filter(e => e.event_attendees?.some(a => a.user_id === user?.id))

  const lists = { upcoming, past, mine, joined }

  const TABS = [
    { id: 'upcoming', label: 'Yaklaşan',   count: upcoming.length },
    { id: 'joined',   label: 'Katıldığım', count: joined.length },
    { id: 'mine',     label: 'Benimkiler', count: mine.length },
    { id: 'past',     label: 'Geçmiş',     count: past.length },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">Etkinlikler</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Buluşmalar, fuarlar, topluluk etkinlikleri</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-800 rounded-lg p-0.5 border border-zinc-700">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Liste"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'map' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Harita"
            >
              <Map className="h-3.5 w-3.5" />
            </button>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Etkinlik Oluştur</span>
            <span className="sm:hidden">Oluştur</span>
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none pb-0.5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                tab === t.id
                  ? 'bg-brand-500/10 text-brand-400 border-brand-500/40'
                  : 'text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full leading-none ${
                  tab === t.id ? 'bg-brand-500 text-white' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {viewMode === 'map' ? (
        <EventsMapView events={events.filter(e => new Date(e.event_date) >= new Date())} />
      ) : loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (lists[tab] || []).length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={
            tab === 'upcoming' ? 'Yaklaşan etkinlik yok' :
            tab === 'mine'     ? 'Henüz etkinlik oluşturmadın' :
            tab === 'joined'   ? 'Katıldığın etkinlik yok' :
                                 'Geçmiş etkinlik yok'
          }
          description={tab === 'upcoming' ? 'İlk etkinliği sen oluştur!' : ''}
          action={(tab === 'upcoming' || tab === 'mine') ? (
            <button onClick={() => setShowCreate(true)} className="btn-primary">Etkinlik Oluştur</button>
          ) : null}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(lists[tab] || []).map(event => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={user?.id}
              onJoinToggle={handleJoinToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchEvents() }} />
      )}
    </div>
  )
}
