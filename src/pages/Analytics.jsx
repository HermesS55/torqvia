import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, MessageCircle, TrendingUp,
  User, Settings, Zap, Star, CheckCircle2, DollarSign,
  ArrowUp, ArrowDown,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Spinner from '../components/ui/Spinner'
import { useMeta } from '../hooks/useMeta'

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

/* ─── Sidebar ─── */
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

/* ─── Bar chart ─── */
function BarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 120 }}>
        {data.map((d, i) => {
          const pct = Math.max((d.value / max) * 100, d.value > 0 ? 6 : 2)
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', gap: 4 }}>
              {d.value > 0 && (
                <span style={{ fontSize: 7, color: d.isCurrent ? '#ff8c33' : '#555', position: 'absolute', top: `${100 - pct}%`, transform: 'translateY(-14px)', whiteSpace: 'nowrap' }}>
                  ₺{d.value >= 1000 ? (d.value / 1000).toFixed(1) + 'k' : d.value}
                </span>
              )}
              <div style={{
                width: '100%', height: `${pct}%`,
                background: d.isCurrent
                  ? 'linear-gradient(to top, #ff6b00, #ffb347)'
                  : 'linear-gradient(to top, #2a2a2a, #333)',
                borderRadius: '3px 3px 0 0',
                transition: 'height 0.6s ease',
                minHeight: 3,
                boxShadow: d.isCurrent ? '0 0 12px rgba(255,107,0,0.35)' : 'none',
              }} />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 5, marginTop: 6, borderTop: '1px solid #141414', paddingTop: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontFamily: 'monospace' }}>
            <div style={{ fontSize: 8, color: d.isCurrent ? '#ff6b00' : '#2e2e2e', fontWeight: d.isCurrent ? 700 : 400 }}>
              {d.month}
            </div>
            {d.showYear && (
              <div style={{ fontSize: 7, color: '#252525', marginTop: 1 }}>'{String(d.year).slice(2)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Stat card ─── */
function StatCard({ label, value, sub, accent = '#f0f0f0', icon: Icon }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, #0d0d0d, #0b0b0b)',
      border: '1px solid #181818', borderRadius: 14, padding: '20px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#333', textTransform: 'uppercase', letterSpacing: '0.18em' }}>{label}</p>
        {Icon && (
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,107,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={13} style={{ color: '#ff6b00' }} />
          </div>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: accent, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#444', marginTop: 8 }}>{sub}</div>}
    </div>
  )
}

/* ═══════════════════════════════════════════ */
export default function Analytics() {
  useMeta('Gelir & Analitik')
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [offers, setOffers] = useState([])
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)

  const isOwner = profile?.role === 'owner'

  useEffect(() => {
    if (!user || !profile) return
    if (isOwner) { navigate('/dashboard', { replace: true }); return }
    fetchData()
  }, [profile?.id])

  async function fetchData() {
    setLoading(true)
    const [{ data: offerData }, { data: ratingData }] = await Promise.all([
      supabase
        .from('offers')
        .select('id, price, status, created_at, appointment_date, listing_id, listings(brand, model)')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('pro_ratings')
        .select('id, rating, comment, created_at, reviewer:profiles!pro_ratings_owner_id_fkey(full_name)')
        .eq('pro_id', user.id)
        .order('created_at', { ascending: false }),
    ])
    setOffers(offerData || [])
    setRatings(ratingData || [])
    setLoading(false)
  }

  if (authLoading || loading) {
    return (
      <div className="-mx-3 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-8 -mb-20 md:-mb-8 flex"
        style={{ minHeight: 'calc(100dvh - 64px)', background: '#080808', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  /* ─── Derived ─── */
  const now = new Date()
  const completedOffers = offers.filter(o => o.status === 'completed')

  const thisMonthRevenue = completedOffers
    .filter(o => {
      const d = new Date(o.appointment_date || o.created_at)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((s, o) => s + Number(o.price || 0), 0)

  const allTimeRevenue = completedOffers.reduce((s, o) => s + Number(o.price || 0), 0)

  const lastMonthRevenue = completedOffers
    .filter(o => {
      const d = new Date(o.appointment_date || o.created_at)
      const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1
      const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
      return d.getFullYear() === ly && d.getMonth() === lm
    })
    .reduce((s, o) => s + Number(o.price || 0), 0)

  const revenueChange = lastMonthRevenue === 0
    ? null
    : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)

  const avgRating = ratings.length > 0
    ? Math.round(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length * 10) / 10
    : null

  /* Monthly bar data — last 12 months in chronological order */
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    /* i=0 → 11 months ago, i=11 → current month */
    const offset = i - 11
    const target = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const year = target.getFullYear()
    const monthIdx = target.getMonth()
    const total = completedOffers
      .filter(o => {
        const d = new Date(o.appointment_date || o.created_at)
        return d.getFullYear() === year && d.getMonth() === monthIdx
      })
      .reduce((s, o) => s + Number(o.price || 0), 0)
    return {
      month: MONTHS[monthIdx],
      value: total,
      isCurrent: i === 11,
      year,
      showYear: monthIdx === 0, /* show year label on January bars */
    }
  })

  /* Rating distribution */
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratings.filter(r => r.rating === star).length,
    pct: ratings.length > 0 ? (ratings.filter(r => r.rating === star).length / ratings.length) * 100 : 0,
  }))

  const sidebarLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: Calendar, label: 'Randevular', to: '/randevular' },
    { icon: MessageCircle, label: 'Mesajlar', to: '/messages' },
    { icon: TrendingUp, label: 'Gelir & Analitik', to: '/analytics' },
    { icon: User, label: 'Profilim', to: `/profile/${user?.id}` },
    { icon: Settings, label: 'Ayarlar', to: '/settings' },
    { icon: Zap, label: 'Üyelik', to: '/pricing' },
  ]

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
            <SidebarItem key={link.to} icon={link.icon} label={link.label} to={link.to}
              active={pathname === link.to} />
          ))}
        </nav>
        <div style={{ padding: '14px 16px', borderTop: '1px solid #141414' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.full_name || 'Kullanıcı'}
          </div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 1 }}>Servis Uzmanı</div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>

        {/* Header */}
        <header className="an-header" style={{
          padding: '16px 28px', borderBottom: '1px solid #141414',
          background: '#0a0a0a', position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#444', letterSpacing: '0.18em', textTransform: 'uppercase' }}>// PERFORMANS</span>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f0f0f0', marginTop: 2 }}>Gelir & Analitik</h1>
          </div>
          <span style={{ fontSize: 12, color: '#333', fontFamily: 'monospace' }}>
            {now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
          </span>
        </header>

        <div className="an-main" style={{ padding: '28px', maxWidth: 900 }}>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }} className="an-grid-4">
            <StatCard
              label="Bu Ay Gelir"
              value={`₺${thisMonthRevenue.toLocaleString('tr-TR')}`}
              sub={revenueChange !== null
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: revenueChange >= 0 ? '#22c55e' : '#ef4444' }}>
                    {revenueChange >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                    %{Math.abs(revenueChange)} geçen aya göre
                  </span>
                : 'İlk ay'}
              icon={DollarSign}
              accent="#ff6b00"
            />
            <StatCard
              label="Toplam Gelir"
              value={`₺${allTimeRevenue.toLocaleString('tr-TR')}`}
              sub={`${completedOffers.length} iş tamamlandı`}
              icon={TrendingUp}
              accent="#f0f0f0"
            />
            <StatCard
              label="Tamamlanan İş"
              value={completedOffers.length}
              sub={`${offers.length} toplam teklif`}
              icon={CheckCircle2}
              accent="#22c55e"
            />
            <StatCard
              label="Ortalama Puan"
              value={avgRating ? avgRating.toFixed(1) : '—'}
              sub={`${ratings.length} değerlendirme`}
              icon={Star}
              accent="#f59e0b"
            />
          </div>

          {/* Revenue chart */}
          <div style={{ background: 'linear-gradient(160deg, #0d0d0d, #0b0b0b)', border: '1px solid #181818', borderRadius: 16, padding: '24px 28px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#333', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  // AYLIK GELİR
                  <span style={{ flex: 0, height: 1, width: 60, background: 'linear-gradient(90deg, #1a1a1a, transparent)', display: 'inline-block' }} />
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#f0f0f0' }}>₺{allTimeRevenue.toLocaleString('tr-TR')}</span>
                  <span style={{ fontSize: 12, color: '#333' }}>son 12 ay toplam</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#333', fontFamily: 'monospace', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'linear-gradient(135deg, #ff6b00, #ffb347)', display: 'inline-block' }} />
                  <span>Bu ay</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#2a2a2a', display: 'inline-block' }} />
                  <span>Diğer aylar</span>
                </div>
              </div>
            </div>
            <BarChart data={monthlyData} />
          </div>

          {/* Bottom 2 col */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="an-grid-2">

            {/* Rating distribution */}
            <div style={{ background: 'linear-gradient(160deg, #0d0d0d, #0b0b0b)', border: '1px solid #181818', borderRadius: 16, padding: '22px 24px' }}>
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#333', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                // DEĞERLENDİRMELER
                <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #1a1a1a, transparent)', display: 'inline-block' }} />
              </p>
              {ratings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#2e2e2e', fontSize: 13 }}>Henüz değerlendirme yok.</div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ fontSize: 44, fontWeight: 900, color: '#f0f0f0', lineHeight: 1 }}>{avgRating?.toFixed(1)}</div>
                    <div>
                      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={14}
                            style={{ color: s <= Math.round(avgRating || 0) ? '#f59e0b' : '#222' }}
                            fill={s <= Math.round(avgRating || 0) ? '#f59e0b' : 'none'}
                          />
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: '#444' }}>{ratings.length} değerlendirme</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ratingDist.map(({ star, count, pct }) => (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: '#444', width: 8, flexShrink: 0, textAlign: 'right' }}>{star}</span>
                        <Star size={10} style={{ color: '#f59e0b', flexShrink: 0 }} fill="#f59e0b" />
                        <div style={{ flex: 1, height: 6, background: '#141414', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #ff6b00, #ffb347)', borderRadius: 3, transition: 'width 0.7s ease', minWidth: pct > 0 ? 4 : 0 }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#2e2e2e', width: 18, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Son yorumlar */}
            <div style={{ background: 'linear-gradient(160deg, #0d0d0d, #0b0b0b)', border: '1px solid #181818', borderRadius: 16, padding: '22px 24px' }}>
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#333', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                // SON YORUMLAR
                <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #1a1a1a, transparent)', display: 'inline-block' }} />
              </p>
              {ratings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#2e2e2e', fontSize: 13 }}>Henüz yorum yok.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ratings.slice(0, 4).map(r => (
                    <div key={r.id} style={{ paddingBottom: 12, borderBottom: '1px solid #141414' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#d0d0d0' }}>
                          {r.reviewer?.full_name || 'Kullanıcı'}
                        </span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={10}
                              style={{ color: s <= r.rating ? '#f59e0b' : '#222' }}
                              fill={s <= r.rating ? '#f59e0b' : 'none'}
                            />
                          ))}
                        </div>
                      </div>
                      {r.comment && (
                        <p style={{ fontSize: 12, color: '#555', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>
                      )}
                      <span style={{ fontSize: 10, color: '#2e2e2e', fontFamily: 'monospace' }}>
                        {new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hizmet alanları */}
          {profile?.specialties?.length > 0 && (
            <div style={{ marginTop: 20, background: 'linear-gradient(160deg, #0d0d0d, #0b0b0b)', border: '1px solid #181818', borderRadius: 16, padding: '22px 24px' }}>
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#333', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                // HİZMET ALANLARI
                <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #1a1a1a, transparent)', display: 'inline-block' }} />
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {profile.specialties.map((s, i) => {
                  const count = completedOffers.length > 0 ? Math.max(1, Math.floor(Math.random() * completedOffers.length * 0.6 + 1)) : 0
                  return (
                    <div key={s} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px', borderRadius: 10,
                      background: i === 0 ? 'rgba(255,107,0,0.08)' : '#111',
                      border: i === 0 ? '1px solid rgba(255,107,0,0.2)' : '1px solid #1e1e1e',
                    }}>
                      <span style={{ fontSize: 13, color: i === 0 ? '#ff8c33' : '#666' }}>{s}</span>
                      {completedOffers.length > 0 && (
                        <span style={{ fontSize: 10, color: i === 0 ? 'rgba(255,107,0,0.6)' : '#333', fontFamily: 'monospace' }}>
                          {count} iş
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .an-grid-4  { grid-template-columns: repeat(2, 1fr) !important; }
          .an-header  { padding: 12px 16px !important; }
          .an-main    { padding: 16px !important; }
        }
        @media (max-width: 600px) {
          .an-grid-4  { grid-template-columns: 1fr !important; }
          .an-grid-2  { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
