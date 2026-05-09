import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, MessageCircle, TrendingUp,
  User, Settings, Zap, Plus, Car, Search,
  CheckCircle2, Clock, Send, Wrench, MapPin,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Spinner from '../components/ui/Spinner'
import UserAvatar from '../components/ui/UserAvatar'
import { useMeta } from '../hooks/useMeta'

const STATUS_LABELS = {
  pending:   { label: 'Beklemede',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  accepted:  { label: 'Kabul Edildi', color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)' },
  rejected:  { label: 'Reddedildi',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
  completed: { label: 'Tamamlandı',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
  in_progress: { label: 'Devam Ediyor', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
}

const MONTH_LABELS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.pending
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  )
}

function MetricCard({ label, value, sub, accent = '#ff6b00' }) {
  return (
    <div style={{
      background: '#0b0b0b', border: '1px solid #141414', borderRadius: 12,
      padding: '20px 20px 16px',
    }}>
      <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 12 }}>
        {label}
      </p>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#f0f0f0', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function RevenueChart({ offers }) {
  const now = new Date()
  const data = MONTH_LABELS.map((m, i) => {
    const monthOffers = offers.filter(o => {
      if (o.status !== 'completed') return false
      const d = new Date(o.appointment_date || o.created_at)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === i
    })
    const total = monthOffers.reduce((s, o) => s + Number(o.price || 0), 0)
    return { month: m, value: total }
  })
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{
              width: '100%',
              height: `${Math.max((d.value / max) * 100, 4)}%`,
              background: 'linear-gradient(to top, #ff6b00, #ff8c33)',
              borderRadius: '2px 2px 0 0',
              transition: 'height 0.5s ease',
              minHeight: 4,
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 8, color: '#333', fontFamily: 'monospace' }}>
            {d.month}
          </div>
        ))}
      </div>
    </div>
  )
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

export default function Dashboard() {
  useMeta('Dashboard')
  const { user, profile, loading: authLoading } = useAuth()
  const { pathname } = useLocation()
  const [listings, setListings] = useState([])
  const [offers, setOffers] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [topPros, setTopPros] = useState([])

  const isOwner = profile?.role === 'owner'

  useEffect(() => {
    if (!profile || !user) return
    setDataLoading(true)
    if (isOwner) { fetchOwnerData(); fetchTopPros() }
    else fetchProData()
  }, [profile?.id])

  async function fetchTopPros() {
    const [{ data: prosData }, { data: ratingData }] = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, avatar_url, city, shop_name, specialties, plan')
        .eq('role', 'pro').neq('banned', true).not('full_name', 'is', null),
      supabase.from('pro_ratings').select('pro_id, rating'),
    ])
    const ratings = ratingData || []
    const scored = (prosData || []).map(p => {
      const pr = ratings.filter(r => r.pro_id === p.id)
      const avgRating = pr.length > 0 ? pr.reduce((s, r) => s + r.rating, 0) / pr.length : 0
      const score = (p.plan === 'turbo' || p.plan === 'elite' ? 15 : 0) + avgRating * 3 + Math.sqrt(pr.length) * 2
      return { ...p, avgRating: Math.round(avgRating * 10) / 10, reviewCount: pr.length, score }
    }).sort((a, b) => b.score - a.score).slice(0, 3)
    setTopPros(scored)
  }

  async function fetchOwnerData() {
    const { data: myListings } = await supabase
      .from('listings')
      .select('*, offers(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setListings(myListings || [])
    const listingIds = (myListings || []).map(l => l.id)
    if (listingIds.length > 0) {
      const { data: incomingOffers } = await supabase
        .from('offers')
        .select('*, listings(brand, model), profiles!offers_sender_id_fkey(id, full_name, avatar_url)')
        .in('listing_id', listingIds)
        .order('created_at', { ascending: false })
      setOffers(incomingOffers || [])
    }
    setDataLoading(false)
  }

  async function fetchProData() {
    const { data: sentOffers } = await supabase
      .from('offers')
      .select('*, listings(brand, model, user_id)')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false })
    setOffers(sentOffers || [])
    setDataLoading(false)
  }

  if (authLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  if (!profile) return (
    <div className="card max-w-md mx-auto mt-16 text-center p-8">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-lg font-semibold text-white mb-2">Profil bulunamadı</h2>
      <p className="text-zinc-500 text-sm mb-6">
        Hesabın var ama profil satırı oluşturulmamış. Supabase SQL Editor'da şunu çalıştır:
      </p>
      <pre className="text-left bg-zinc-800 rounded-lg p-4 text-xs text-brand-300 overflow-x-auto mb-4">{`INSERT INTO public.profiles (id, role, phone, full_name)
VALUES ('${user?.id}', 'owner', '', '');`}</pre>
    </div>
  )

  if (dataLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const pendingOffers   = offers.filter(o => o.status === 'pending')
  const acceptedOffers  = offers.filter(o => o.status === 'accepted')
  const completedOffers = offers.filter(o => o.status === 'completed')
  const upcomingAppointments = offers.filter(o =>
    o.appointment_date && new Date(o.appointment_date) > new Date()
  ).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))

  const fmtDate = dt => new Date(dt).toLocaleString('tr-TR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  const totalRevenue = completedOffers.reduce((s, o) => s + Number(o.price || 0), 0)

  const proSidebarLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: Calendar, label: 'Randevular', to: '/randevular' },
    { icon: MessageCircle, label: 'Mesajlar', to: '/messages' },
    { icon: TrendingUp, label: 'Gelir & Analitik', to: '/analytics' },
    { icon: User, label: 'Profilim', to: `/profile/${user?.id}` },
    { icon: Settings, label: 'Ayarlar', to: '/settings' },
    { icon: Zap, label: 'Üyelik', to: '/pricing' },
  ]

  const ownerSidebarLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: Search, label: 'Usta Ara', to: '/ustalar' },
    { icon: Calendar, label: 'Randevularım', to: '/randevular' },
    { icon: MessageCircle, label: 'Mesajlar', to: '/messages' },
    { icon: Car, label: 'Araçlarım', to: '/garage' },
    { icon: User, label: 'Profilim', to: `/profile/${user?.id}` },
    { icon: Settings, label: 'Ayarlar', to: '/settings' },
  ]

  const sidebarLinks = isOwner ? ownerSidebarLinks : proSidebarLinks

  return (
    <div className="dash-outer -mx-3 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-8 -mb-20 md:-mb-8 flex"
      style={{ minHeight: 'calc(100dvh - 64px)', background: '#080808' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: '#0a0a0a', borderRight: '1px solid #141414',
        flexDirection: 'column',
      }} className="hidden md:flex">

        {/* Menu */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {sidebarLinks.map(link => (
            <SidebarItem
              key={link.to}
              icon={link.icon}
              label={link.label}
              to={link.to}
              active={link.to === '/dashboard' && pathname === '/dashboard'}
            />
          ))}
        </nav>

        {/* User at bottom */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #141414', display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserAvatar profile={profile} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile.full_name || 'Kullanıcı'}
            </div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 1 }}>
              {isOwner ? 'Araç Sahibi' : 'Servis Uzmanı'}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="dash-scroll-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>

        {/* Topbar */}
        <header className="dash-header" style={{
          padding: '16px 24px', borderBottom: '1px solid #141414',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0a0a0a', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#444', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              {isOwner ? `// HOŞ GELDİN, ${(profile.full_name || '').split(' ')[0].toUpperCase()}` : '// DASHBOARD'}
            </span>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f0f0f0', marginTop: 2 }}>
              {isOwner ? 'Kontrol Paneli' : 'Servis Uzmanı Paneli'}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to={isOwner ? '/listings/new' : '/listings'} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px',
              borderRadius: 8, background: '#ff6b00', color: '#fff', fontWeight: 700,
              fontSize: 13, textDecoration: 'none', letterSpacing: '0.02em',
            }}>
              <Plus size={14} />
              {isOwner ? 'YENİ İLAN' : 'YENİ RANDEVU'}
            </Link>
          </div>
        </header>

        <div className="dash-main" style={{ padding: '24px', flex: 1 }}>

          {/* Owner search bar */}
          {isOwner && (
            <div className="dash-search-row" style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
              <input
                placeholder="Usta ara, şehir, uzmanlık..."
                style={{
                  flex: 1, background: '#0b0b0b', border: '1px solid #1a1a1a', borderRadius: 10,
                  color: '#f0f0f0', fontSize: 14, padding: '12px 16px', outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = '#ff6b00' }}
                onBlur={e => { e.target.style.borderColor = '#1a1a1a' }}
                onKeyDown={e => { if (e.key === 'Enter') window.location.href = '/ustalar' }}
              />
              <Link to="/ustalar" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px',
                borderRadius: 10, background: '#ff6b00', color: '#fff', fontWeight: 700,
                fontSize: 14, textDecoration: 'none',
              }}>
                <Search size={14} /> USTA BUL
              </Link>
            </div>
          )}

          {/* ── Metric cards ── */}
          {isOwner ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }} className="metrics-grid">
              <MetricCard label="İlanlarım" value={listings.length} sub="Toplam ilan" />
              <MetricCard label="Bekleyen Teklif" value={pendingOffers.length} sub="Onay bekliyor" />
              <MetricCard label="Kabul Edilen" value={acceptedOffers.length} sub="Aktif" />
              <MetricCard label="Tamamlanan" value={completedOffers.length} sub="Başarılı iş" />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }} className="metrics-grid">
              <MetricCard label="Bu Ay Gelir" value={`₺${totalRevenue.toLocaleString('tr-TR')}`} sub="Tamamlanan işler" />
              <MetricCard label="Randevular" value={offers.length} sub="Toplam teklif" />
              <MetricCard label="Tamamlanan" value={completedOffers.length} sub="Başarılı iş" />
              <MetricCard label="Kabul Bekliyor" value={pendingOffers.length} sub="Cevap bekleniyor" />
            </div>
          )}

          {/* ── Main grid ── */}
          {isOwner ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }} className="main-grid">
              {/* Left: listings + appointments */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.16em' }}>// ARAÇLARIM & İLANLAR</p>
                  <Link to="/listings/new" style={{ fontSize: 12, color: '#ff6b00', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus size={12} /> Yeni
                  </Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {listings.length === 0 ? (
                    <div style={{ background: '#0b0b0b', border: '1px solid #141414', borderRadius: 10, padding: '24px', textAlign: 'center', color: '#444', fontSize: 13 }}>
                      Henüz ilan yok.{' '}
                      <Link to="/listings/new" style={{ color: '#ff6b00', textDecoration: 'none' }}>İlan oluştur →</Link>
                    </div>
                  ) : listings.slice(0, 5).map(l => (
                    <Link key={l.id} to={`/listings/${l.id}`} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#0b0b0b', border: '1px solid #141414', borderRadius: 10,
                      padding: '12px 16px', textDecoration: 'none',
                    }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#1a1a1a' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#141414' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,107,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Car size={16} style={{ color: '#ff6b00' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0' }}>{l.brand} {l.model}</div>
                          <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{l.offers?.[0]?.count || 0} teklif</div>
                        </div>
                      </div>
                      <StatusBadge status={l.status || 'pending'} />
                    </Link>
                  ))}
                </div>

                {/* Upcoming appointments */}
                {upcomingAppointments.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 12 }}>// YAKLAŞAN RANDEVULAR</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {upcomingAppointments.slice(0, 3).map(o => (
                        <Link key={o.id} to={`/listings/${o.listing_id}`} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: '#0b0b0b', border: '1px solid #141414', borderRadius: 10,
                          padding: '12px 16px', textDecoration: 'none',
                        }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>{o.listings?.brand} {o.listings?.model}</div>
                            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{o.profiles?.full_name}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>{fmtDate(o.appointment_date)}</div>
                            <div style={{ fontSize: 11, color: '#ff6b00', marginTop: 2 }}>₺{Number(o.price).toLocaleString('tr-TR')}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: top pros + messages */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.16em' }}>// EN İYİ USTALAR</p>
                  <Link to="/ustalar" style={{ fontSize: 11, color: '#ff6b00', textDecoration: 'none' }}>Tümünü gör →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {topPros.length === 0 ? (
                    <Link to="/ustalar" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: '#0b0b0b', border: '1px dashed #1a1a1a', borderRadius: 10,
                      padding: '18px', textDecoration: 'none', color: '#ff6b00', fontSize: 13,
                    }}>
                      <Search size={14} /> Usta Ara →
                    </Link>
                  ) : topPros.map((pro, i) => (
                    <Link key={pro.id} to={`/usta/${pro.id}`} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: '#0b0b0b', border: '1px solid #141414', borderRadius: 10,
                      padding: '12px 14px', textDecoration: 'none',
                      transition: 'border-color 0.15s',
                    }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#222' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#141414' }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <UserAvatar profile={pro} size="sm" />
                        <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: ['#ffd700','#c0c0c0','#cd7f32'][i] || '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 900, color: '#000' }}>{i + 1}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pro.full_name}
                        </div>
                        <div style={{ fontSize: 11, color: '#555', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pro.shop_name || (pro.specialties?.[0] || 'Servis Uzmanı')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {pro.avgRating > 0 ? (
                          <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>★ {pro.avgRating.toFixed(1)}</div>
                        ) : (
                          <div style={{ fontSize: 10, color: '#333' }}>Yeni</div>
                        )}
                        {pro.city && <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>{pro.city}</div>}
                      </div>
                    </Link>
                  ))}
                </div>

                <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 12 }}>// MESAJLAR</p>
                <div style={{ background: '#0b0b0b', border: '1px solid #141414', borderRadius: 10, padding: '20px', textAlign: 'center', color: '#333', fontSize: 13 }}>
                  <MessageCircle size={24} style={{ color: '#222', margin: '0 auto 8px' }} />
                  <Link to="/messages" style={{ color: '#ff6b00', textDecoration: 'none', fontSize: 13 }}>Mesajlara git →</Link>
                </div>
              </div>
            </div>
          ) : (
            /* PRO view */
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }} className="main-grid">
              {/* Left: upcoming appointments */}
              <div>
                <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 14 }}>// YAKLAŞAN RANDEVULAR</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upcomingAppointments.length === 0 ? (
                    <div style={{ background: '#0b0b0b', border: '1px solid #141414', borderRadius: 10, padding: '24px', textAlign: 'center', color: '#444', fontSize: 13 }}>
                      Yaklaşan randevu yok.{' '}
                      <Link to="/listings" style={{ color: '#ff6b00', textDecoration: 'none' }}>İlanlara göz at →</Link>
                    </div>
                  ) : upcomingAppointments.slice(0, 5).map(o => (
                    <Link key={o.id} to={`/listings/${o.listing_id}`} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#0b0b0b', border: '1px solid #141414', borderRadius: 10,
                      padding: '14px 16px', textDecoration: 'none',
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0' }}>{o.listings?.brand} {o.listings?.model}</div>
                        <div style={{ fontSize: 12, color: '#ff6b00', fontWeight: 700, marginTop: 2 }}>₺{Number(o.price).toLocaleString('tr-TR')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>{fmtDate(o.appointment_date)}</div>
                        <StatusBadge status={o.status} />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* All offers */}
                {offers.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 12 }}>// GÖNDERDİĞİM TEKLİFLER</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {offers.slice(0, 6).map(o => (
                        <Link key={o.id} to={`/listings/${o.listing_id}`} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: '#0b0b0b', border: '1px solid #141414', borderRadius: 10,
                          padding: '12px 16px', textDecoration: 'none',
                        }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>{o.listings?.brand} {o.listings?.model}</div>
                            <div style={{ fontSize: 12, color: '#ff6b00', fontWeight: 700 }}>₺{Number(o.price).toLocaleString('tr-TR')}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <StatusBadge status={o.status} />
                            <span style={{ fontSize: 10, color: '#333' }}>{new Date(o.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: messages + profile summary */}
              <div>
                <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 12 }}>// MESAJLAR</p>
                <div style={{ background: '#0b0b0b', border: '1px solid #141414', borderRadius: 10, padding: '20px', textAlign: 'center', color: '#333', marginBottom: 20 }}>
                  <MessageCircle size={24} style={{ color: '#222', margin: '0 auto 8px' }} />
                  <Link to="/messages" style={{ color: '#ff6b00', textDecoration: 'none', fontSize: 13 }}>Mesajlara git →</Link>
                </div>

                <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 12 }}>// PROFİL ÖZETİ</p>
                <div style={{ background: '#0b0b0b', border: '1px solid #141414', borderRadius: 10, padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <UserAvatar profile={profile} size="md" />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0' }}>{profile.full_name || 'Kullanıcı'}</div>
                      <div style={{ fontSize: 11, color: '#555' }}>{profile.city || 'Konum belirtilmemiş'}</div>
                    </div>
                  </div>
                  {profile.specialties?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {profile.specialties.slice(0, 3).map(s => (
                        <span key={s} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, border: '1px solid #1a1a1a', color: '#555', background: '#0e0e0e' }}>{s}</span>
                      ))}
                    </div>
                  )}
                  <Link to={`/profile/${user?.id}`} style={{ display: 'block', marginTop: 12, textAlign: 'center', fontSize: 12, color: '#ff6b00', textDecoration: 'none' }}>
                    Profili Düzenle →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Pro: Revenue Chart */}
          {!isOwner && (
            <div style={{ marginTop: 28, background: '#0b0b0b', border: '1px solid #141414', borderRadius: 12, padding: '20px 24px' }}>
              <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 6 }}>// AYLIK GELİR</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#f0f0f0' }}>₺{totalRevenue.toLocaleString('tr-TR')}</span>
                <span style={{ fontSize: 12, color: '#444' }}>Bu yıl toplam</span>
              </div>
              <RevenueChart offers={offers} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dash-outer       { margin-bottom: 0 !important; min-height: calc(100dvh - 124px) !important; }
          .dash-scroll-area { overflow-y: visible !important; }
          .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .main-grid    { grid-template-columns: 1fr !important; }
          .dash-header  { padding: 12px 16px !important; }
          .dash-main    { padding: 14px !important; }
        }
        @media (max-width: 480px) {
          .metrics-grid     { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-search-row  { flex-direction: column !important; }
          .dash-header h1   { font-size: 16px !important; }
        }
      `}</style>
    </div>
  )
}
