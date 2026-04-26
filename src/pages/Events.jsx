import { useEffect, useState } from 'react'
import { Calendar, MapPin, PlusCircle, X, Users, Clock, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import UserAvatar from '../components/ui/UserAvatar'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { Link } from 'react-router-dom'
import { useMeta } from '../hooks/useMeta'
import toast from 'react-hot-toast'

function AttendeesModal({ eventId, eventTitle, onClose }) {
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('event_attendees')
      .select('user_id, profiles(id, full_name, avatar_url, role)')
      .eq('event_id', eventId)
      .then(({ data }) => { setAttendees(data || []); setLoading(false) })
  }, [eventId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h3 className="font-semibold text-white text-sm">Katılımcılar</h3>
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{eventTitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : attendees.length === 0 ? (
            <p className="text-center text-zinc-600 text-sm py-6">Henüz katılımcı yok</p>
          ) : (
            <div className="space-y-3">
              {attendees.map(a => (
                <Link key={a.user_id} to={`/profile/${a.user_id}`} onClick={onClose}
                  className="flex items-center gap-3 hover:bg-zinc-800 rounded-xl px-2 py-2 transition-colors">
                  <UserAvatar profile={a.profiles} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{a.profiles?.full_name || 'İsimsiz'}</p>
                    <p className="text-xs text-zinc-600">{a.profiles?.role === 'pro' ? 'Servis Uzmanı' : 'Araç Sahibi'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const CATEGORIES = ['Buluşma', 'Yarış', 'Fuar', 'Sergi', 'Etkinlik', 'Diğer']

function EventCard({ event, currentUserId, onJoinToggle, onShowAttendees }) {
  const isOwner = event.user_id === currentUserId
  const isPast = new Date(event.event_date) < new Date()
  const isJoined = event.event_attendees?.some(a => a.user_id === currentUserId)
  const attendeeCount = event.event_attendees?.length || 0

  const fmtDate = dt => new Date(dt).toLocaleString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className={`card hover:border-zinc-700 transition-colors ${isPast ? 'opacity-60' : ''}`}>
      {event.cover_image && (
        <div className="-mx-5 -mt-5 mb-4 h-40 overflow-hidden rounded-t-2xl">
          <img src={event.cover_image} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {event.category && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full mb-2">
              <Tag className="h-2.5 w-2.5" /> {event.category}
            </span>
          )}
          <h3 className="font-semibold text-white text-base leading-tight">{event.title}</h3>
        </div>
        {isPast && (
          <span className="text-[10px] text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full shrink-0">Geçmiş</span>
        )}
      </div>

      {event.description && (
        <p className="text-zinc-500 text-sm mb-3 line-clamp-2">{event.description}</p>
      )}

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Clock className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
          {fmtDate(event.event_date)}
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <MapPin className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
            {event.location}
          </div>
        )}
        <button onClick={() => attendeeCount > 0 && onShowAttendees(event.id, event.title)}
          className={`flex items-center gap-2 text-xs text-zinc-400 ${attendeeCount > 0 ? 'hover:text-brand-400 transition-colors' : ''}`}>
          <Users className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
          {attendeeCount} katılımcı
        </button>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <UserAvatar profile={event.profiles} size="xs" />
          <span className="text-xs text-zinc-500">{event.profiles?.full_name || 'Kullanıcı'}</span>
        </div>
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
        {isOwner && (
          <span className="text-[10px] text-zinc-600">Senin etkinliğin</span>
        )}
      </div>
    </div>
  )
}

export default function Events() {
  useMeta('Etkinlikler')
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab] = useState('upcoming')
  const [form, setForm] = useState({
    title: '', description: '', event_date: '', location: '', category: 'Buluşma',
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [attendeesModal, setAttendeesModal] = useState(null)

  useEffect(() => { fetchEvents() }, [])

  async function fetchEvents() {
    const { data } = await supabase
      .from('events')
      .select('*, profiles(id, full_name, avatar_url), event_attendees(user_id)')
      .order('event_date', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    console.log('handleCreate çalıştı, user:', user?.id)
    setCreateError('')
    if (!form.title.trim()) { setCreateError('Etkinlik adı zorunludur.'); return }
    if (!form.event_date)   { setCreateError('Tarih ve saat zorunludur.'); return }
    setCreating(true)
    try {
      const { data, error } = await supabase.from('events').insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: form.event_date,
        location: form.location.trim() || null,
        category: form.category,
      }).select()
      if (error) {
        setCreateError(`${error.message} [${error.code}]`)
        return
      }
      toast.success('Etkinlik oluşturuldu!')
      setShowCreate(false)
      setCreateError('')
      setForm({ title: '', description: '', event_date: '', location: '', category: 'Buluşma' })
      fetchEvents()
    } catch (err) {
      setCreateError(`Beklenmeyen hata: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  async function handleJoinToggle(eventId, isJoined) {
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

  const now = new Date()
  const upcoming = events.filter(e => new Date(e.event_date) >= now)
  const past = events.filter(e => new Date(e.event_date) < now)
  const mine = events.filter(e => e.user_id === user?.id)
  const joined = events.filter(e => e.event_attendees?.some(a => a.user_id === user?.id))

  const lists = { upcoming, past, mine, joined }
  const displayList = lists[tab] || []

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Etkinlikler</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Araç buluşmaları, fuarlar ve topluluk etkinlikleri</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Etkinlik Oluştur</span>
        </button>
      </div>

      <div className="flex gap-1 border-b border-zinc-800 mb-6 overflow-x-auto scrollbar-none">
        {[
          { id: 'upcoming', label: 'Yaklaşan', count: upcoming.length },
          { id: 'joined', label: 'Katıldığım', count: joined.length },
          { id: 'mine', label: 'Benimkiler', count: mine.length },
          { id: 'past', label: 'Geçmiş', count: past.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.id ? 'border-brand-500 text-brand-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-brand-500/20 text-brand-400' : 'bg-zinc-800 text-zinc-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : displayList.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={tab === 'upcoming' ? 'Yaklaşan etkinlik yok' : tab === 'mine' ? 'Henüz etkinlik oluşturmadın' : tab === 'joined' ? 'Katıldığın etkinlik yok' : 'Geçmiş etkinlik yok'}
          description={tab === 'upcoming' ? 'İlk etkinliği sen oluştur!' : ''}
          action={tab === 'upcoming' || tab === 'mine' ? (
            <button onClick={() => setShowCreate(true)} className="btn-primary">Etkinlik Oluştur</button>
          ) : null}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {displayList.map(event => (
            <EventCard key={event.id} event={event} currentUserId={user?.id} onJoinToggle={handleJoinToggle}
              onShowAttendees={(id, title) => setAttendeesModal({ eventId: id, eventTitle: title })} />
          ))}
        </div>
      )}

      {attendeesModal && (
        <AttendeesModal
          eventId={attendeesModal.eventId}
          eventTitle={attendeesModal.eventTitle}
          onClose={() => setAttendeesModal(null)}
        />
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 overflow-y-auto max-h-[90vh]"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h3 className="font-semibold text-white">Etkinlik Oluştur</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {createError && (
                <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 text-red-400 text-xs leading-relaxed">
                  {createError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Etkinlik Adı *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Örn: İstanbul Klasik Araç Buluşması" className="input-base" maxLength={120} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Açıklama</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Etkinlik hakkında bilgi ver..." rows={3} maxLength={500}
                  className="input-base resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tarih & Saat *</label>
                <input type="datetime-local" value={form.event_date}
                  onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)} className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Konum</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Örn: İstanbul, Atatürk Havalimanı Pisti" className="input-base" maxLength={200} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Kategori</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="input-base">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">İptal</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {creating ? <Spinner size="sm" /> : <Calendar className="h-4 w-4" />}
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
