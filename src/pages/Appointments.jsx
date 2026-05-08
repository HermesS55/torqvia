import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, MessageCircle, TrendingUp,
  User, Settings, Zap, Car, Search, Clock, CheckCircle2,
  XCircle, AlertCircle, ChevronRight, Plus, Send, MapPin,
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
function ApptCard({ appt, isOwner, onStatusUpdate }) {
  const title = appt.arac_bilgisi ||
    `${appt.listings?.brand || ''} ${appt.listings?.model || ''}`.trim() ||
    'Araç bilgisi yok'
  const counterpart = isOwner
    ? (appt.usta?.full_name || appt.profiles?.full_name || 'Servis Uzmanı')
    : (appt.musteri?.full_name || appt.profiles?.full_name || appt.listings?.user_name || 'Araç Sahibi')
  const date = appt.tarih || appt.appointment_date
  const status = appt.durum || appt.status || 'beklemede'

  return (
    <div style={{
      background: 'linear-gradient(160deg, #0d0d0d, #0b0b0b)',
      border: '1px solid #181818', borderRadius: 14,
      padding: '16px 20px', transition: 'border-color 0.15s',
    }}
      onMouseOver={e => e.currentTarget.style.borderColor = '#242424'}
      onMouseOut={e => e.currentTarget.style.borderColor = '#181818'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Car size={15} style={{ color: '#ff6b00' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e0e0e0' }}>{title}</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 1 }}>{counterpart}</div>
            </div>
          </div>
          {appt.notlar && (
            <p style={{ fontSize: 12, color: '#555', lineHeight: 1.6, margin: '0 0 8px', paddingLeft: 46 }}>{appt.notlar}</p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {date && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555' }}>
              <Clock size={12} style={{ color: '#ff6b00', flexShrink: 0 }} />
              {fmtDate(date)}
            </span>
          )}
          {appt.price && (
            <span style={{ fontSize: 12, color: '#ff8c33', fontWeight: 700 }}>
              ₺{Number(appt.price).toLocaleString('tr-TR')}
            </span>
          )}
        </div>
        {/* Pro can update status */}
        {!isOwner && onStatusUpdate && status === 'beklemede' && (
          <div style={{ display: 'flex', gap: 7 }}>
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
          </div>
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
    /* Try appointments table first */
    const { data: apptData, error: apptError } = await supabase
      .from('appointments')
      .select('*, usta:profiles!appointments_usta_id_fkey(id, full_name, city, avatar_url, shop_name)')
      .eq('musteri_id', user.id)
      .order('tarih', { ascending: false })

    if (!apptError && apptData) {
      setUseAppointmentsTable(true)
      setAppointments(apptData)
      return
    }

    /* Fall back to offers */
    setUseAppointmentsTable(false)
    const { data: myListings } = await supabase
      .from('listings')
      .select('id, brand, model')
      .eq('user_id', user.id)

    const ids = (myListings || []).map(l => l.id)
    if (ids.length === 0) { setAppointments([]); return }

    const { data: offersData } = await supabase
      .from('offers')
      .select('*, listings(brand, model), profiles!offers_sender_id_fkey(id, full_name, avatar_url, city)')
      .in('listing_id', ids)
      .not('appointment_date', 'is', null)
      .order('created_at', { ascending: false })

    setAppointments(offersData || [])
  }

  async function fetchProAppointments() {
    /* Try appointments table first */
    const { data: apptData, error: apptError } = await supabase
      .from('appointments')
      .select('*, musteri:profiles!appointments_musteri_id_fkey(id, full_name, city, avatar_url)')
      .eq('usta_id', user.id)
      .order('tarih', { ascending: false })

    if (!apptError && apptData) {
      setUseAppointmentsTable(true)
      setAppointments(apptData)
      return
    }

    /* Fall back to offers */
    setUseAppointmentsTable(false)
    const { data: offersData } = await supabase
      .from('offers')
      .select('*, listings(brand, model, user_id)')
      .eq('sender_id', user.id)
      .not('appointment_date', 'is', null)
      .order('created_at', { ascending: false })

    setAppointments(offersData || [])
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
    { icon: Search, label: 'Usta Ara', to: '/listings' },
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
        display: 'flex', flexDirection: 'column',
      }} className="hidden md:flex">
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #141414' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #ff6b00, #c2410c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>T</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0' }}>Torqvia</span>
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
            <Link to="/listings/new" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 8,
              background: '#ff6b00', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none',
            }}>
              <Plus size={14} /> Usta Ara
            </Link>
          )}
        </header>

        <div style={{ flex: 1, padding: '24px 28px', display: 'flex', gap: 20 }} className="appt-layout">

          {/* ── Left: list ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

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
                  <Link to="/listings" style={{ fontSize: 13, color: '#ff6b00', textDecoration: 'none' }}>
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
