import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, MessageCircle, TrendingUp,
  User, Settings, Zap, Car, Search, Clock, CheckCircle2,
  XCircle, AlertCircle, ChevronRight, Plus, Send, MapPin, Star,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Spinner from '../components/ui/Spinner'
import UserAvatar from '../components/ui/UserAvatar'
import { useMeta } from '../hooks/useMeta'

const STATUS = {
  beklemede:   { label: 'Beklemede',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  icon: AlertCircle },
  onaylandi:   { label: 'Onaylandı',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   icon: CheckCircle2 },
  tamamlandi:  { label: 'Tamamlandı',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)', icon: CheckCircle2 },
  iptal:       { label: 'İptal',        color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',  icon: XCircle },
  /* offers statuses for fallback */
  pending:     { label: 'Beklemede',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', icon: AlertCircle },
  accepted:    { label: 'Onaylandı',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)', icon: CheckCircle2 },
  completed:   { label: 'Tamamlandı',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)', icon: CheckCircle2 },
  rejected:    { label: 'Reddedildi',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)', icon: XCircle },
  in_progress: { label: 'Devam Ediyor', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)', icon: Clock },
}

const TABS_PRO   = ['Tümü', 'Beklemede', 'Onaylı', 'Tamamlanan']
const TABS_OWNER = ['Tümü', 'Beklemede', 'Onaylı', 'Tamamlanan']

/* Map tab label → status values */
const TAB_STATUS_MAP = {
  'Tümü': null,
  'Beklemede':  ['beklemede', 'pending'],
  'Onaylı':     ['onaylandi', 'accepted', 'in_progress'],
  'Tamamlanan': ['tamamlandi', 'completed'],
}

function SidebarItem({ icon: Icon, label, to, active }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
      borderLeft: `2px solid ${active ? '#ff6b00' : 'transparent'}`,
      background: active ? 'rgba(255,107,0,0.07)' : 'transparent',
      color: active ? '#ff6b00' : '#555',
      textDecoration: 'none', borderRadius: '0 8px 8px 0',
      transition: 'all 0.15s', fontSize: 14, fontWeight: active ? 600 : 400,
    }}
      onMouseOver={e => { if (!active) { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' } }}
      onMouseOut={e => { if (!active) { e.currentTarget.style.color = '#555'; e.currentTarget.style.background = 'transparent' } }}>
      <Icon size={16} style={{ flexShrink: 0 }} />
      <span>{label}</span>
    </Link>
  )
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.beklemede
  const Icon = s.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      <Icon size={10} /> {s.label}
    </span>
  )
}

function fmtDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/* ─── Appointment card ─── */
function ApptCard({ appt, isOwner, onStatusUpdate, rated, onRate }) {
  const title = appt.arac_bilgisi ||
    `${appt.listings?.brand || ''} ${appt.listings?.model || ''}`.trim() ||
    'Araç bilgisi yok'
  const counterpartProfile = isOwner ? (appt.usta || appt.profiles) : (appt.musteri || appt.profiles)
  const counterpartName = counterpartProfile?.full_name || (isOwner ? 'Servis Uzmanı' : 'Araç Sahibi')
  const counterpartId = counterpartProfile?.id
  const date = appt.tarih || appt.appointment_date
  const status = appt.durum || appt.status || 'beklemede'
  const shopName = counterpartProfile?.shop_name
  const city = counterpartProfile?.city

  const isActive = ['onaylandi', 'accepted', 'in_progress'].includes(status)
  const isCompleted = ['tamamlandi', 'completed'].includes(status)
  const isCancelled = ['iptal', 'rejected'].includes(status)

  return (
    <div style={{
      background: '#0c0c0c',
      border: `1px solid ${isActive ? 'rgba(34,197,94,0.15)' : isCancelled ? 'rgba(239,68,68,0.1)' : '#181818'}`,
      borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.15s',
    }}
      onMouseOver={e => e.currentTarget.style.borderColor = isActive ? 'rgba(34,197,94,0.3)' : isCancelled ? 'rgba(239,68,68,0.2)' : '#262626'}
      onMouseOut={e => e.currentTarget.style.borderColor = isActive ? 'rgba(34,197,94,0.15)' : isCancelled ? 'rgba(239,68,68,0.1)' : '#181818'}
    >
      {/* Top row */}
      <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid #131313', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {/* Counterpart avatar placeholder */}
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#131313', border: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {counterpartProfile?.avatar_url ? (
              <img src={counterpartProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={18} style={{ color: '#333' }} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e8e8e8', display: 'flex', alignItems: 'center', gap: 6 }}>
              {counterpartName}
            </div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 1 }}>
              {shopName || (isOwner ? 'Servis Uzmanı' : 'Araç Sahibi')}
              {city && <span> · {city}</span>}
            </div>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Mid: vehicle + date */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #111' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: date ? 10 : 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Car size={13} style={{ color: '#ff6b00' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>{title}</div>
            {appt.notlar && (
              <div style={{ fontSize: 11, color: '#444', marginTop: 2, lineHeight: 1.5 }}>{appt.notlar}</div>
            )}
          </div>
        </div>
        {date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', marginTop: 2 }}>
            <Clock size={11} style={{ color: '#ff6b00', flexShrink: 0 }} />
            <span style={{ fontWeight: 500, color: '#888' }}>{fmtDate(date)}</span>
          </div>
        )}
      </div>

      {/* Bottom: actions */}
      <div style={{ padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {counterpartId && (
            <Link
              to={`/messages?to=${counterpartId}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#555', textDecoration: 'none', padding: '5px 10px', borderRadius: 7, background: '#111', border: '1px solid #1e1e1e', transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.color = '#ff6b00'; e.currentTarget.style.borderColor = 'rgba(255,107,0,0.3)' }}
              onMouseOut={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#1e1e1e' }}
            >
              <MessageCircle size={11} /> Mesaj
            </Link>
          )}
          {isOwner && counterpartId && (
            <Link
              to={`/usta/${counterpartId}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#555', textDecoration: 'none', padding: '5px 10px', borderRadius: 7, background: '#111', border: '1px solid #1e1e1e', transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.borderColor = '#333' }}
              onMouseOut={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#1e1e1e' }}
            >
              <User size={11} /> Profil
            </Link>
          )}
          {isOwner && isCompleted && onRate && (
            <button
              onClick={onRate}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                padding: '5px 12px', borderRadius: 7,
                background: rated ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.1)',
                border: rated ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(245,158,11,0.3)',
                color: rated ? '#22c55e' : '#f59e0b',
                transition: 'all 0.15s',
              }}
              disabled={rated}
            >
              <Star size={11} fill={rated ? '#22c55e' : 'none'} />
              {rated ? 'Değerlendirildi' : 'Değerlendir'}
            </button>
          )}
          {appt.price && (
            <span style={{ fontSize: 12, color: '#ff8c33', fontWeight: 700, marginLeft: 4 }}>
              ₺{Number(appt.price).toLocaleString('tr-TR')}
            </span>
          )}
        </div>

        {/* Pro can update status */}
        <div style={{ display: 'flex', gap: 6 }}>
          {!isOwner && onStatusUpdate && status === 'beklemede' && (
            <>
              <button
                onClick={() => onStatusUpdate(appt.id, 'onaylandi')}
                style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e', transition: 'all 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.18)' }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)' }}
              >
                Onayla
              </button>
              <button
                onClick={() => onStatusUpdate(appt.id, 'iptal')}
                style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', transition: 'all 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
              >
                Reddet
              </button>
            </>
          )}
          {!isOwner && onStatusUpdate && status === 'onaylandi' && (
            <button
              onClick={() => onStatusUpdate(appt.id, 'tamamlandi')}
              style={{ padding: '5px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#3b82f6', transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.18)' }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)' }}
            >
              Tamamlandı İşaretle
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function RateProModal({ proId, proName, proAvatar, onClose, onSubmitted }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (rating === 0) return
    setSubmitting(true)
    const { error } = await supabase.from('pro_ratings').insert({
      pro_id: proId,
      owner_id: user.id,
      rating,
      comment: comment.trim() || null,
    })
    if (error) {
      // If duplicate, just close
    }
    onSubmitted()
    onClose()
    setSubmitting(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#0e0e0e', border: '1px solid #222', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          {proAvatar ? (
            <img src={proAvatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid #2a2a2a' }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} style={{ color: '#444' }} />
            </div>
          )}
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 3 }}>// USTA DEĞERLENDİRMESİ</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0' }}>{proName || 'Servis Uzmanı'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, transition: 'transform 0.1s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Star
                size={32}
                style={{ color: s <= (hover || rating) ? '#f59e0b' : '#2a2a2a', transition: 'color 0.15s' }}
                fill={s <= (hover || rating) ? '#f59e0b' : 'none'}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <div style={{ marginBottom: 16 }}>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Yorum ekle (isteğe bağlı)..."
              rows={3}
              style={{
                width: '100%', background: '#111', border: '1px solid #1e1e1e', borderRadius: 10,
                color: '#f0f0f0', fontSize: 13, padding: '10px 12px', outline: 'none',
                resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = '#f59e0b' }}
              onBlur={e => { e.target.style.borderColor = '#1e1e1e' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '10px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#111', border: '1px solid #222', color: '#555' }}
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            style={{
              flex: 1, padding: '10px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: rating === 0 ? 'not-allowed' : 'pointer',
              background: rating === 0 ? '#1a1a1a' : 'linear-gradient(135deg, #f59e0b, #f59e0b)',
              color: rating === 0 ? '#333' : '#000', border: 'none',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════ */
export default function Appointments() {
  useMeta('Randevular')
  const { user, profile, loading: authLoading } = useAuth()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const ustaId = searchParams.get('usta_id')
  const isOwner = profile?.role === 'owner'

  const [appointments, setAppointments] = useState([])
  const [ustaProfile, setUstaProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Tümü')
  const [useAppointmentsTable, setUseAppointmentsTable] = useState(true)
  const [ratingModal, setRatingModal] = useState(null) // { proId, proName, proAvatar } | null
  const [ratedProIds, setRatedProIds] = useState(new Set())

  /* Form state */
  const [form, setForm] = useState({ brand: '', model: '', description: '', tarih: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!user || !profile) return
    fetchAll()
    if (ustaId) fetchUsta()
  }, [profile?.id, ustaId])

  async function fetchAll() {
    setLoading(true)
    try {
      if (isOwner) {
        await fetchOwnerAppointments()
      } else {
        await fetchProAppointments()
      }
    } catch {
      setAppointments([])
    }
    setLoading(false)
  }

  async function fetchOwnerAppointments() {
    const [apptResult, listingsResult] = await Promise.all([
      supabase
        .from('appointments')
        .select('*, usta:profiles!appointments_usta_id_fkey(id, full_name, city, avatar_url, shop_name)')
        .eq('musteri_id', user.id)
        .order('tarih', { ascending: false }),
      supabase.from('listings').select('id, brand, model').eq('user_id', user.id),
    ])

    const apptData = (!apptResult.error && apptResult.data) ? apptResult.data : []
    setUseAppointmentsTable(!apptResult.error)

    const ids = (listingsResult.data || []).map(l => l.id)
    let offersData = []
    if (ids.length > 0) {
      const { data } = await supabase
        .from('offers')
        .select('*, listings(brand, model), profiles!offers_sender_id_fkey(id, full_name, avatar_url, city, shop_name)')
        .in('listing_id', ids)
        .not('appointment_date', 'is', null)
        .in('status', ['accepted', 'in_progress', 'completed'])
        .order('appointment_date', { ascending: false })
      offersData = data || []
    }

    /* Normalize offers to look like appointments */
    const normalizedOffers = offersData.map(o => ({
      ...o,
      _source: 'offers',
      tarih: o.appointment_date,
      notlar: o.appointment_note || o.message,
      durum: o.status === 'completed' ? 'tamamlandi' : o.status === 'accepted' ? 'onaylandi' : 'beklemede',
      arac_bilgisi: `${o.listings?.brand || ''} ${o.listings?.model || ''}`.trim(),
      usta: o.profiles,
    }))

    const existing = new Set(apptData.map(a => a.id))
    const merged = [...apptData, ...normalizedOffers.filter(o => !existing.has(o.id))]
    setAppointments(merged)

    // Fetch which pros the owner has already rated
    const { data: myRatings } = await supabase
      .from('pro_ratings')
      .select('pro_id')
      .eq('owner_id', user.id)
    setRatedProIds(new Set((myRatings || []).map(r => r.pro_id)))
  }

  async function fetchProAppointments() {
    const [apptResult, offersResult] = await Promise.all([
      supabase
        .from('appointments')
        .select('*, musteri:profiles!appointments_musteri_id_fkey(id, full_name, city, avatar_url)')
        .eq('usta_id', user.id)
        .order('tarih', { ascending: false }),
      supabase
        .from('offers')
        .select('*, listings(brand, model, user_id), musteri:profiles!listings(user_id)(id, full_name, avatar_url, city)')
        .eq('sender_id', user.id)
        .not('appointment_date', 'is', null)
        .in('status', ['accepted', 'in_progress', 'completed'])
        .order('appointment_date', { ascending: false }),
    ])

    const apptData = (!apptResult.error && apptResult.data) ? apptResult.data : []
    setUseAppointmentsTable(!apptResult.error)

    const offersData = offersResult.data || []
    const normalizedOffers = offersData.map(o => ({
      ...o,
      _source: 'offers',
      tarih: o.appointment_date,
      notlar: o.appointment_note || o.message,
      durum: o.status === 'completed' ? 'tamamlandi' : o.status === 'accepted' ? 'onaylandi' : 'beklemede',
      arac_bilgisi: `${o.listings?.brand || ''} ${o.listings?.model || ''}`.trim(),
    }))

    const existing = new Set(apptData.map(a => a.id))
    const merged = [...apptData, ...normalizedOffers.filter(o => !existing.has(o.id))]
    setAppointments(merged)
  }

  async function fetchUsta() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, shop_name, city, specialties, avatar_url')
      .eq('id', ustaId)
      .single()
    setUstaProfile(data)
  }

  async function handleStatusUpdate(id, newStatus) {
    if (!useAppointmentsTable) return
    await supabase.from('appointments').update({ durum: newStatus }).eq('id', id)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, durum: newStatus } : a))
  }

  async function handleSubmitRequest(e) {
    e.preventDefault()
    if (!form.brand || !form.tarih) { setSubmitError('Araç markası ve tarih zorunlu.'); return }
    setSubmitting(true)
    setSubmitError('')

    if (useAppointmentsTable) {
      /* Double-booking check: prevent same usta being booked within 2 hours of requested slot */
      const requestedTime = new Date(form.tarih)
      const bufferMs = 2 * 60 * 60 * 1000
      const from = new Date(requestedTime.getTime() - bufferMs).toISOString()
      const to   = new Date(requestedTime.getTime() + bufferMs).toISOString()
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id')
        .eq('usta_id', ustaId)
        .neq('durum', 'iptal')
        .gte('tarih', from)
        .lte('tarih', to)

      if (conflicts && conflicts.length > 0) {
        setSubmitError('Bu saat diliminde ustanın başka bir randevusu var. Lütfen 2 saat önce veya sonrasını deneyin.')
        setSubmitting(false)
        return
      }

      const { error } = await supabase.from('appointments').insert({
        usta_id: ustaId,
        musteri_id: user.id,
        arac_bilgisi: `${form.brand} ${form.model}`.trim(),
        tarih: form.tarih,
        notlar: form.description || null,
        durum: 'beklemede',
      })
      if (error) {
        setSubmitError('Randevu oluşturulamadı. Lütfen tekrar deneyin.')
      } else {
        /* Notify the usta */
        supabase.from('notifications').insert({
          user_id: ustaId,
          type: 'appointment',
          from_user_id: user.id,
          message: `${profile?.full_name || 'Bir kullanıcı'} randevu talebi gönderdi: ${form.brand} ${form.model}`.trim(),
        }).then(() => {})
        setSubmitted(true)
        fetchAll()
      }
    } else {
      /* Fall back: create a listing */
      const { data: newListing, error } = await supabase
        .from('listings')
        .insert({ user_id: user.id, brand: form.brand, model: form.model || '', description: form.description || '', status: 'open' })
        .select()
        .single()
      if (error || !newListing) {
        setSubmitError('İstek oluşturulamadı.')
      } else {
        navigate(`/listings/${newListing.id}`)
      }
    }
    setSubmitting(false)
  }

  /* ─── Sidebar config ─── */
  const proLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: Calendar, label: 'Randevular', to: '/randevular' },
    { icon: MessageCircle, label: 'Mesajlar', to: '/messages' },
    { icon: TrendingUp, label: 'Gelir & Analitik', to: '/analytics' },
    { icon: User, label: 'Profilim', to: `/profile/${user?.id}` },
    { icon: Settings, label: 'Ayarlar', to: '/settings' },
    { icon: Zap, label: 'Üyelik', to: '/pricing' },
  ]
  const ownerLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: Search, label: 'Usta Ara', to: '/ustalar' },
    { icon: Calendar, label: 'Randevularım', to: '/randevular' },
    { icon: MessageCircle, label: 'Mesajlar', to: '/messages' },
    { icon: Car, label: 'Araçlarım', to: '/garage' },
    { icon: User, label: 'Profilim', to: `/profile/${user?.id}` },
    { icon: Settings, label: 'Ayarlar', to: '/settings' },
  ]
  const sidebarLinks = isOwner ? ownerLinks : proLinks

  /* ─── Tab filtering ─── */
  const filtered = activeTab === 'Tümü'
    ? appointments
    : appointments.filter(a => {
        const st = a.durum || a.status || 'beklemede'
        return (TAB_STATUS_MAP[activeTab] || []).includes(st)
      })

  const tabCounts = ['Tümü', 'Beklemede', 'Onaylı', 'Tamamlanan'].map(tab => ({
    tab,
    count: tab === 'Tümü'
      ? appointments.length
      : appointments.filter(a => (TAB_STATUS_MAP[tab] || []).includes(a.durum || a.status || 'beklemede')).length,
  }))

  if (authLoading || loading) {
    return (
      <div className="-mx-3 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-8 -mb-20 md:-mb-8 flex"
        style={{ minHeight: 'calc(100dvh - 64px)', background: '#080808', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  /* ─── RENDER ─── */
  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-8 -mb-20 md:-mb-8 flex"
      style={{ minHeight: 'calc(100dvh - 64px)', background: '#080808' }}>

      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0, background: '#0a0a0a', borderRight: '1px solid #141414',
      }} className="hidden md:flex flex-col">
        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #141414' }}>
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#555', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseOver={e => e.currentTarget.style.color = '#ff6b00'}
            onMouseOut={e => e.currentTarget.style.color = '#555'}>
            <LayoutDashboard size={13} /> Dashboard'a Dön
          </Link>
        </div>
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {sidebarLinks.map(link => (
            <SidebarItem key={link.to} icon={link.icon} label={link.label} to={link.to} active={pathname === link.to} />
          ))}
        </nav>
        <div style={{ padding: '14px 16px', borderTop: '1px solid #141414' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.full_name || 'Kullanıcı'}
          </div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 1 }}>{isOwner ? 'Araç Sahibi' : 'Servis Uzmanı'}</div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <header className="appt-header" style={{
          padding: '16px 28px', borderBottom: '1px solid #141414',
          background: '#0a0a0a', position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#444', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              {isOwner ? '// TAKVİM' : '// İŞ TAKVİMİ'}
            </span>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f0f0f0', marginTop: 2 }}>
              {isOwner ? 'Randevularım' : 'Randevular'}
            </h1>
          </div>
          {isOwner && (
            <Link to="/ustalar" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 8,
              background: '#ff6b00', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none',
            }}>
              <Search size={14} /> Usta Ara
            </Link>
          )}
        </header>

        <div style={{ flex: 1, padding: '24px 28px', display: 'flex', gap: 20 }} className="appt-layout">

          {/* ── Left: list ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Toplam', count: appointments.length, color: '#555', bg: '#111' },
                { label: 'Beklemede', count: appointments.filter(a => ['beklemede','pending'].includes(a.durum||a.status||'beklemede')).length, color: '#f59e0b', bg: 'rgba(245,158,11,0.07)' },
                { label: 'Onaylı', count: appointments.filter(a => ['onaylandi','accepted','in_progress'].includes(a.durum||a.status||'')).length, color: '#22c55e', bg: 'rgba(34,197,94,0.07)' },
                { label: 'Tamamlanan', count: appointments.filter(a => ['tamamlandi','completed'].includes(a.durum||a.status||'')).length, color: '#3b82f6', bg: 'rgba(59,130,246,0.07)' },
              ].map(s => (
                <div key={s.label} style={{ flex: '1 1 80px', minWidth: 80, background: s.bg, border: `1px solid ${s.color}22`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
                  <div style={{ fontSize: 10, color: '#444', marginTop: 4, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* appointments tablosu yoksa SQL mesajı */}
            {!useAppointmentsTable && (
              <div style={{
                padding: '14px 18px', borderRadius: 12, marginBottom: 20,
                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)',
                borderLeft: '3px solid #f59e0b',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>⚠ Randevu tablosu henüz oluşturulmamış</div>
                <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>
                  Tam randevu sistemi için Supabase SQL Editor'da aşağıdaki komutu çalıştırın.<br />
                  Şimdilik mevcut teklifler gösteriliyor.
                </div>
                <details style={{ marginTop: 10 }}>
                  <summary style={{ fontSize: 11, color: '#f59e0b', cursor: 'pointer', userSelect: 'none' }}>SQL Göster →</summary>
                  <pre style={{ fontSize: 10, color: '#888', background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 8, padding: '12px', marginTop: 8, overflowX: 'auto', lineHeight: 1.6 }}>{`CREATE TABLE IF NOT EXISTS appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  usta_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  musteri_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  arac_bilgisi text NOT NULL,
  tarih timestamptz NOT NULL,
  durum text DEFAULT 'beklemede'
    CHECK (durum IN ('beklemede','onaylandi','tamamlandi','iptal')),
  notlar text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appt_select" ON appointments FOR SELECT TO authenticated
  USING (usta_id = auth.uid() OR musteri_id = auth.uid());
CREATE POLICY "appt_insert" ON appointments FOR INSERT TO authenticated
  WITH CHECK (musteri_id = auth.uid());
CREATE POLICY "appt_update" ON appointments FOR UPDATE TO authenticated
  USING (usta_id = auth.uid() OR musteri_id = auth.uid());`}</pre>
                </details>
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: '4px', background: '#0d0d0d', borderRadius: 10, border: '1px solid #181818', width: 'fit-content' }}>
              {tabCounts.map(({ tab, count }) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: activeTab === tab ? '#ff6b00' : 'transparent',
                    color: activeTab === tab ? '#fff' : '#555',
                    border: 'none', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {tab}
                  {count > 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 99,
                      background: activeTab === tab ? 'rgba(255,255,255,0.25)' : 'rgba(255,107,0,0.15)',
                      color: activeTab === tab ? '#fff' : '#ff6b00',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
              <div style={{
                background: '#0b0b0b', border: '1px solid #141414', borderRadius: 14,
                padding: '48px 24px', textAlign: 'center',
              }}>
                <Calendar size={32} style={{ color: '#1e1e1e', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14, color: '#2e2e2e', marginBottom: 8 }}>Bu kategoride randevu yok</div>
                {isOwner && (
                  <Link to="/ustalar" style={{ fontSize: 13, color: '#ff6b00', textDecoration: 'none' }}>
                    Usta ara ve randevu oluştur →
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(appt => (
                  <ApptCard
                    key={appt.id}
                    appt={appt}
                    isOwner={isOwner}
                    onStatusUpdate={useAppointmentsTable && !isOwner ? handleStatusUpdate : null}
                    rated={isOwner && ratedProIds.has(
                      (appt.usta || appt.profiles)?.id
                    )}
                    onRate={isOwner ? () => {
                      const proProfile = appt.usta || appt.profiles
                      if (proProfile) {
                        setRatingModal({ proId: proProfile.id, proName: proProfile.full_name, proAvatar: proProfile.avatar_url })
                      }
                    } : null}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Right: randevu al formu (owner + usta_id) ── */}
          {isOwner && ustaId && (
            <div className="appt-form-col" style={{ width: 300, flexShrink: 0 }}>
              <div style={{
                background: 'linear-gradient(160deg, #0d0d0d, #0b0b0b)',
                border: '1px solid rgba(255,107,0,0.18)',
                borderRadius: 16, overflow: 'hidden',
                position: 'sticky', top: 24,
              }}>
                {/* Usta header */}
                {ustaProfile && (
                  <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #141414', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <UserAvatar profile={ustaProfile} size="md" />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0' }}>{ustaProfile.full_name}</div>
                      {ustaProfile.shop_name && <div style={{ fontSize: 11, color: '#555' }}>{ustaProfile.shop_name}</div>}
                      {ustaProfile.city && (
                        <div style={{ fontSize: 11, color: '#444', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <MapPin size={10} /> {ustaProfile.city}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ padding: '20px' }}>
                  <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#333', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    // RANDEVU TALEBİ
                    <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #1a1a1a, transparent)', display: 'inline-block' }} />
                  </p>

                  {submitted ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <CheckCircle2 size={36} style={{ color: '#22c55e', margin: '0 auto 12px' }} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', marginBottom: 6 }}>Talep Gönderildi</div>
                      <div style={{ fontSize: 12, color: '#555', marginBottom: 16 }}>Usta onayladığında bildirim alacaksınız.</div>
                      <button onClick={() => { setSubmitted(false); setForm({ brand: '', model: '', description: '', tarih: '' }) }}
                        style={{ fontSize: 12, color: '#ff6b00', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Yeni talep oluştur
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, color: '#444', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Araç Markası *</label>
                        <input
                          value={form.brand}
                          onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                          placeholder="örn. Toyota"
                          style={{ width: '100%', background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '9px 12px', color: '#f0f0f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                          onFocus={e => { e.target.style.borderColor = '#ff6b00' }}
                          onBlur={e => { e.target.style.borderColor = '#1e1e1e' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#444', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Araç Modeli</label>
                        <input
                          value={form.model}
                          onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                          placeholder="örn. Corolla"
                          style={{ width: '100%', background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '9px 12px', color: '#f0f0f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                          onFocus={e => { e.target.style.borderColor = '#ff6b00' }}
                          onBlur={e => { e.target.style.borderColor = '#1e1e1e' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#444', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Tercih Edilen Tarih *</label>
                        <input
                          type="datetime-local"
                          value={form.tarih}
                          onChange={e => setForm(f => ({ ...f, tarih: e.target.value }))}
                          style={{ width: '100%', background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '9px 12px', color: '#f0f0f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', colorScheme: 'dark', transition: 'border-color 0.15s' }}
                          onFocus={e => { e.target.style.borderColor = '#ff6b00' }}
                          onBlur={e => { e.target.style.borderColor = '#1e1e1e' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#444', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Notlar</label>
                        <textarea
                          value={form.description}
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Sorun açıklaması..."
                          rows={3}
                          style={{ width: '100%', background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '9px 12px', color: '#f0f0f0', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                          onFocus={e => { e.target.style.borderColor = '#ff6b00' }}
                          onBlur={e => { e.target.style.borderColor = '#1e1e1e' }}
                        />
                      </div>
                      {submitError && <div style={{ fontSize: 11, color: '#ef4444' }}>{submitError}</div>}
                      <button
                        type="submit"
                        disabled={submitting}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '11px 0', borderRadius: 9,
                          background: submitting ? '#2a2a2a' : 'linear-gradient(135deg, #ff6b00, #ff7d1a)',
                          color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                          boxShadow: submitting ? 'none' : '0 4px 16px rgba(255,107,0,0.3)',
                        }}
                      >
                        <Send size={14} /> {submitting ? 'Gönderiliyor...' : 'Talep Gönder'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {ratingModal && (
        <RateProModal
          proId={ratingModal.proId}
          proName={ratingModal.proName}
          proAvatar={ratingModal.proAvatar}
          onClose={() => setRatingModal(null)}
          onSubmitted={() => {
            setRatedProIds(prev => new Set([...prev, ratingModal.proId]))
          }}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .appt-header   { padding: 12px 16px !important; }
          .appt-layout   { flex-direction: column !important; padding: 16px !important; }
          .appt-form-col { width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
