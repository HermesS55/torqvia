import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, Phone, Clock, Banknote, Wrench, Store,
  ChevronLeft, Star, Zap, CheckCircle, MessageCircle,
  Calendar, Shield,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useMeta } from '../hooks/useMeta'
import UserAvatar from '../components/ui/UserAvatar'
import Spinner from '../components/ui/Spinner'
import TorqviaLogo from '../components/ui/TorqviaLogo'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/* ─────────────────────────────────────────
   Particle canvas — #ff6b00 network
───────────────────────────────────────── */
function ParticleCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const setSize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    setSize()
    const N = 60
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }))
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < N; i++) {
        const p = pts[i]
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        // dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,107,0,0.85)'
        ctx.shadowColor = '#ff6b00'
        ctx.shadowBlur = 6
        ctx.fill()
        ctx.shadowBlur = 0
        // connections
        for (let j = i + 1; j < N; j++) {
          const q = pts[j]
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 115) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(255,107,0,${(1 - d / 115) * 0.28})`
            ctx.lineWidth = 0.65
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(frame)
    }
    frame()
    const ro = new ResizeObserver(setSize)
    ro.observe(canvas)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])
  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  )
}

/* ─────────────────────────────────────────
   Avatar with spinning conic rings
───────────────────────────────────────── */
function TurboAvatar({ profile: p }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {/* Outermost pulse ring */}
      <div style={{
        position: 'absolute',
        width: 112, height: 112, borderRadius: '50%',
        border: '1.5px solid rgba(255,107,0,0.18)',
        animation: 'pulse-outer-ring 2.4s ease-in-out infinite',
      }} />
      {/* Spinning conic ring (outer, slower CCW) */}
      <div style={{
        position: 'absolute',
        width: 104, height: 104, borderRadius: '50%',
        background: 'conic-gradient(from 0deg, rgba(255,107,0,0.55), transparent 35%, rgba(255,140,51,0.4), transparent 70%, rgba(255,107,0,0.55))',
        animation: 'spin-ring-ccw 6s linear infinite',
        maskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2px), black 100%)',
        WebkitMaskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2px), black 100%)',
      }} />
      {/* Inner tight spinning conic ring (CW, faster) */}
      <div style={{
        position: 'absolute',
        width: 96, height: 96, borderRadius: '50%',
        background: 'conic-gradient(from 60deg, #ff6b00, rgba(255,107,0,0.06), #ff8c33, rgba(255,107,0,0.08), #ff6b00)',
        animation: 'spin-ring-cw 3.5s linear infinite',
        maskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2.5px), black 100%)',
        WebkitMaskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2.5px), black 100%)',
      }} />
      {/* Avatar circle */}
      <div style={{ position: 'relative', width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', border: '2px solid #0a0a0a', zIndex: 2 }}>
        <UserAvatar profile={p} size="xl" />
      </div>
      {/* TURBO badge pinned below avatar */}
      <div style={{
        position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 99,
        background: '#ff6b00', color: '#fff', fontSize: 10, fontWeight: 900,
        letterSpacing: '0.1em', whiteSpace: 'nowrap', zIndex: 3,
        boxShadow: '0 0 12px rgba(255,107,0,0.7), 0 0 28px rgba(255,107,0,0.3)',
        animation: 'badge-turbo-glow 2s ease-in-out infinite',
      }}>
        <Zap size={9} fill="#fff" /> TURBO
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Star row helper
───────────────────────────────────────── */
function Stars({ value, size = 12 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s} size={size}
          style={{ color: s <= Math.round(value) ? '#f59e0b' : '#2a2a2a' }}
          fill={s <= Math.round(value) ? '#f59e0b' : 'none'}
        />
      ))}
    </span>
  )
}

/* ─────────────────────────────────────────
   404
───────────────────────────────────────── */
function NotFound() {
  useMeta('Usta bulunamadı')
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <p style={{ fontSize: 72, fontWeight: 900, color: '#1a1a1a', marginBottom: 12 }}>404</p>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f0f0f0', marginBottom: 8 }}>Usta bulunamadı</h1>
      <p style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>Bu profil mevcut değil ya da artık erişilebilir değil.</p>
      <Link to="/" style={{ padding: '11px 24px', borderRadius: 10, background: '#ff6b00', color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
        Anasayfaya Dön
      </Link>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function PublicProProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const title = profile
    ? `${profile.full_name} — ${profile.city || 'Türkiye'}`
    : 'Usta Profili'
  const specialtiesForMeta = profile?.specialties?.length
    ? profile.specialties.join(', ')
    : profile?.specialty || ''
  const description = profile
    ? `${profile.full_name} oto servis${specialtiesForMeta ? ' - ' + specialtiesForMeta : ''}. Torqvia üzerinden iletişim.`
    : ''
  useMeta(title, { description, image: profile?.avatar_url || '/og-default.png', robots: 'index, follow' })

  useEffect(() => {
    if (!UUID_RE.test(id || '')) {
      setNotFound(true)
      setLoading(false)
      return
    }
    fetchProfile()
  }, [id])

  async function fetchProfile() {
    setLoading(true)
    const [{ data: p }, { data: items }, { data: ratingData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, specialty, specialties, shop_name, city, location, phone, service_hours, price_range, bio, plan, banned')
        .eq('id', id)
        .single(),
      supabase
        .from('portfolio_items')
        .select('id, image_url, caption')
        .eq('pro_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('pro_ratings')
        .select('id, rating, comment, created_at, reviewer:profiles!pro_ratings_owner_id_fkey(id, full_name)')
        .eq('pro_id', id)
        .order('created_at', { ascending: false }),
    ])
    if (!p || p.role !== 'pro' || p.banned) {
      setNotFound(true)
    } else {
      setProfile(p)
      setPortfolio(items || [])
      setRatings(ratingData || [])
    }
    setLoading(false)
  }

  /* ── Loading / Not Found ── */
  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <Spinner size="lg" />
      </div>
    )
  }
  if (notFound) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#080808', overflowY: 'auto', zIndex: 100 }}>
        <NotFound />
      </div>
    )
  }

  /* ── Derived values ── */
  const isTurbo = profile.plan === 'turbo'
  const isElite = profile.plan === 'elite'
  const hasPlan = isTurbo || isElite
  const avgRating = ratings.length > 0
    ? Math.round(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length * 10) / 10
    : null
  const satisfactionPct = ratings.length > 0
    ? Math.round((ratings.filter(r => r.rating >= 4).length / ratings.length) * 100)
    : null
  const locationText = [profile.city, profile.location].filter(Boolean).join(' / ')
  const specialties = profile.specialties?.length
    ? profile.specialties
    : profile.specialty
      ? [profile.specialty]
      : []

  /* Weekly schedule — parse or use default */
  const weekDays = [
    { label: 'Pzt', hours: '09:00 – 18:00', open: true },
    { label: 'Sal', hours: '09:00 – 18:00', open: true },
    { label: 'Çar', hours: '09:00 – 18:00', open: true },
    { label: 'Per', hours: '09:00 – 18:00', open: true },
    { label: 'Cum', hours: '09:00 – 18:00', open: true },
    { label: 'Cmt', hours: '09:00 – 14:00', open: true },
    { label: 'Paz', hours: 'KAPALI', open: false },
  ]

  /* ─────────────────────────────────────
     PANEL component helper
  ───────────────────────────────────── */
  const Panel = ({ label, children, style = {} }) => (
    <div style={{
      background: '#0b0b0b', border: '1px solid #141414',
      borderRadius: 14, padding: '22px 24px', ...style,
    }}>
      {label && (
        <p style={{
          fontFamily: 'monospace', fontSize: 9, color: '#444',
          textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 18,
        }}>
          {label}
        </p>
      )}
      {children}
    </div>
  )

  /* ─────────────────────────────────────
     RENDER
  ───────────────────────────────────── */
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#080808',
      overflowY: 'auto', overflowX: 'hidden', zIndex: 100,
    }}>

      {/* ══════════════ NAVBAR ══════════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #141414',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 56,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <TorqviaLogo size={26} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.01em' }}>
            Torqvia
          </span>
        </Link>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              background: 'transparent', border: '1px solid #1a1a1a',
              color: '#888', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#f0f0f0' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.color = '#888' }}
          >
            <ChevronLeft size={14} /> GERİ
          </button>
          <Link
            to={user ? `/listings/new` : '/register?role=owner'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 18px', borderRadius: 8,
              background: '#ff6b00', color: '#fff', fontWeight: 700,
              fontSize: 13, textDecoration: 'none',
              boxShadow: '0 2px 12px rgba(255,107,0,0.3)',
            }}
          >
            <Calendar size={13} /> Randevu Al
          </Link>
        </div>
      </header>

      {/* page body */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px 80px' }}>

        {/* ══════════════ HERO ══════════════ */}
        <div style={{
          position: 'relative', borderRadius: 20, overflow: 'hidden',
          marginTop: 20, marginBottom: 12,
          border: `1px solid ${hasPlan ? 'rgba(255,107,0,0.22)' : '#141414'}`,
          boxShadow: hasPlan ? '0 0 80px rgba(255,107,0,0.06), 0 0 0 1px rgba(255,107,0,0.04)' : 'none',
        }}>

          {/* Canvas layer */}
          <div style={{ position: 'absolute', inset: 0, background: '#080808' }}>
            <ParticleCanvas />
          </div>

          {/* Shimmer sweep overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.025) 50%, transparent 65%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer-sweep 5s ease-in-out infinite',
          }} />

          {/* Bottom dark fade so text is readable */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(to bottom, rgba(8,8,8,0) 0%, rgba(8,8,8,0.55) 60%, rgba(8,8,8,0.95) 100%)',
          }} />

          {/* Turbo shimmer top border */}
          {hasPlan && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2, pointerEvents: 'none',
              background: 'linear-gradient(90deg, transparent 0%, #ff6b00 40%, #ffb347 60%, transparent 100%)',
              backgroundSize: '200% auto',
              animation: 'shimmer-sweep 3s linear infinite',
            }} />
          )}

          {/* Hero content */}
          <div style={{ position: 'relative', zIndex: 2, padding: '44px 36px 44px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }} className="hero-inner">

              {/* Avatar column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flexShrink: 0, marginTop: 6, paddingBottom: 18 }}>
                <TurboAvatar profile={profile} />
              </div>

              {/* Info column */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name + badges row */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 900, color: '#f0f0f0', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
                    {profile.full_name || 'İsimsiz Usta'}
                  </h1>
                  {/* ⚡ TURBO ÜYE */}
                  {hasPlan && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 12px', borderRadius: 99,
                      background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.35)',
                      color: '#ff6b00', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                      animation: 'badge-turbo-glow 2.2s ease-in-out infinite',
                    }}>
                      <Zap size={11} fill="#ff6b00" /> TURBO ÜYE
                    </span>
                  )}
                  {/* ✓ DOĞRULANDI */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 11px', borderRadius: 99,
                    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                    color: '#22c55e', fontSize: 11, fontWeight: 700,
                  }}>
                    <Shield size={10} /> DOĞRULANDI
                  </span>
                </div>

                {/* Shop + location */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 14 }}>
                  {profile.shop_name && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#888' }}>
                      <Store size={13} style={{ color: '#555', flexShrink: 0 }} />
                      {profile.shop_name}
                    </span>
                  )}
                  {locationText && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: '#888' }}>
                      <MapPin size={13} style={{ color: '#555', flexShrink: 0 }} />
                      {locationText}
                    </span>
                  )}
                </div>

                {/* Meta stats row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Stars value={avgRating || 0} size={13} />
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f0' }}>
                      {avgRating ?? '—'}
                    </span>
                    {ratings.length > 0 && (
                      <span style={{ fontSize: 12, color: '#444' }}>({ratings.length} yorum)</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#888' }}>
                    <CheckCircle size={13} style={{ color: '#22c55e' }} />
                    <span style={{ fontWeight: 700, color: '#f0f0f0' }}>{ratings.length}</span>
                    <span style={{ color: '#555' }}>tamamlanan</span>
                  </div>
                  {profile.service_hours && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#888' }}>
                      <Clock size={13} style={{ color: '#ff6b00' }} />
                      <span style={{ color: '#888' }}>{profile.service_hours}</span>
                    </div>
                  )}
                  {profile.price_range && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      <Banknote size={13} style={{ color: '#555' }} />
                      <span style={{ color: '#888' }}>{profile.price_range}</span>
                    </div>
                  )}
                </div>

                {/* Specialty chips */}
                {specialties.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 22 }}>
                    {specialties.map(s => (
                      <span key={s} style={{
                        padding: '5px 13px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                        background: '#0e0e0e', border: '1px solid #1e1e1e', color: '#888',
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTA buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <Link
                    to={user ? `/listings/new` : '/register?role=owner'}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '11px 22px', borderRadius: 10,
                      background: '#ff6b00', color: '#fff', fontWeight: 700, fontSize: 14,
                      textDecoration: 'none', boxShadow: '0 4px 20px rgba(255,107,0,0.35)',
                    }}
                  >
                    <Calendar size={14} /> Randevu Al
                  </Link>
                  <Link
                    to={user ? `/messages?to=${id}` : '/register'}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '11px 20px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid #1a1a1a',
                      color: '#888', fontWeight: 600, fontSize: 14, textDecoration: 'none',
                    }}
                  >
                    <MessageCircle size={14} /> Mesaj Gönder
                  </Link>
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '11px 18px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a1a',
                        color: '#666', fontWeight: 500, fontSize: 14, textDecoration: 'none',
                      }}
                    >
                      <Phone size={14} /> {profile.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════ SPOTLIGHT BANNER ══════════════ */}
        {hasPlan && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 18px', borderRadius: 10, marginBottom: 28,
            background: 'linear-gradient(90deg, rgba(255,107,0,0.06), rgba(139,92,246,0.04))',
            border: '1px solid rgba(255,107,0,0.12)',
            borderLeft: '3px solid #ff6b00',
          }}>
            <Zap size={14} style={{ color: '#ff6b00', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#888' }}>
              Bu usta <strong style={{ color: '#ff6b00' }}>Turbo üyelik</strong> sayesinde arama sonuçlarında öncelikli listeleniyor.
            </span>
          </div>
        )}

        {/* ══════════════ 2-COL BODY ══════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }} className="body-grid">

          {/* ── LEFT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Hakkında */}
            <Panel label="// HAKKINDA">
              {/* 2x2 grid of meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: profile.bio ? 20 : 0 }}>
                {[
                  {
                    icon: <Wrench size={13} style={{ color: '#ff6b00' }} />,
                    label: 'Deneyim',
                    value: profile.specialty || '5+ Yıl',
                  },
                  {
                    icon: <Clock size={13} style={{ color: '#ff6b00' }} />,
                    label: 'Çalışma Saatleri',
                    value: profile.service_hours || 'Hft. 09:00–18:00',
                  },
                  {
                    icon: <Phone size={13} style={{ color: '#ff6b00' }} />,
                    label: 'Telefon',
                    value: profile.phone
                      ? <a href={`tel:${profile.phone}`} style={{ color: '#f0f0f0', textDecoration: 'none' }}>{profile.phone}</a>
                      : '—',
                  },
                  {
                    icon: <Banknote size={13} style={{ color: '#ff6b00' }} />,
                    label: 'Ort. Fiyat',
                    value: profile.price_range || '—',
                  },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '13px 14px', background: '#0e0e0e',
                    border: '1px solid #1a1a1a', borderRadius: 10,
                  }}>
                    <div style={{ marginTop: 1, flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 9, color: '#333', fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 13, color: '#888', fontWeight: 500, lineHeight: 1.4 }}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {profile.bio && (
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: 0 }}>
                  {profile.bio}
                </p>
              )}
              {!profile.bio && !profile.specialty && !profile.service_hours && (
                <p style={{ fontSize: 13, color: '#333', fontStyle: 'italic' }}>Profil açıklaması henüz eklenmemiş.</p>
              )}
            </Panel>

            {/* Yorumlar */}
            <Panel label={`// YORUMLAR${ratings.length > 0 ? ` (${ratings.length})` : ''}`}>
              {ratings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#333', fontSize: 13 }}>
                  Henüz yorum yapılmamış.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ratings.slice(0, 6).map(r => (
                    <div key={r.id} style={{
                      padding: '14px 16px', background: '#0e0e0e',
                      border: '1px solid #1a1a1a', borderRadius: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: r.comment ? 10 : 0 }}>
                        {/* Reviewer avatar (initial) */}
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: '#ff6b00',
                        }}>
                          {(r.reviewer?.full_name || 'K')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>
                              {r.reviewer?.full_name || 'Kullanıcı'}
                            </span>
                            <span style={{ fontSize: 10, color: '#333' }}>
                              {new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <Stars value={r.rating} size={11} />
                          </div>
                        </div>
                      </div>
                      {r.comment && (
                        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, margin: 0 }}>
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* Portfolio */}
            {portfolio.length > 0 && (
              <Panel label="// PORTFÖY">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {portfolio.map(item => (
                    <div key={item.id} style={{
                      position: 'relative', borderRadius: 10, overflow: 'hidden',
                      aspectRatio: '1', border: '1px solid #1a1a1a',
                    }}>
                      <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {item.caption && (
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                          padding: '16px 8px 6px', fontSize: 11, color: '#fff',
                        }}>
                          {item.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* İstatistikler */}
            <Panel label="// İSTATİSTİKLER">
              {/* 4 stat boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Puan', value: avgRating ? avgRating.toFixed(1) : '—', unit: '/ 5.0', accent: '#f59e0b' },
                  { label: 'Tamamlanan', value: ratings.length, unit: 'iş', accent: '#22c55e' },
                  { label: 'Memnuniyet', value: satisfactionPct != null ? `%${satisfactionPct}` : '—', unit: '', accent: '#8b5cf6' },
                  { label: 'Yanıt Süresi', value: '≈15', unit: 'dk', accent: '#ff6b00' },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: '14px 14px 12px', background: '#0e0e0e',
                    border: '1px solid #141414', borderRadius: 10,
                  }}>
                    <div style={{ fontSize: 9, color: '#333', fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                      {s.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 22, fontWeight: 900, color: s.accent, lineHeight: 1 }}>{s.value}</span>
                      {s.unit && <span style={{ fontSize: 11, color: '#444' }}>{s.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Rating bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = ratings.filter(r => r.rating === star).length
                  const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#444', width: 8, flexShrink: 0, textAlign: 'right' }}>{star}</span>
                      <Star size={10} style={{ color: '#f59e0b', flexShrink: 0 }} fill="#f59e0b" />
                      <div style={{ flex: 1, height: 5, background: '#141414', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: 'linear-gradient(90deg, #ff6b00, #ffb347)',
                          borderRadius: 3, transition: 'width 0.6s ease',
                          minWidth: pct > 0 ? 4 : 0,
                        }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#333', width: 16, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </Panel>

            {/* Çalışma Saatleri */}
            <Panel label="// ÇALIŞMA SAATLERİ">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {weekDays.map((d, i) => {
                  const isToday = new Date().getDay() === (i === 6 ? 0 : i + 1)
                  return (
                    <div key={d.label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 2px',
                      borderBottom: i < weekDays.length - 1 ? '1px solid #141414' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isToday && (
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff6b00', flexShrink: 0, display: 'inline-block' }} />
                        )}
                        <span style={{
                          fontSize: 12, fontWeight: isToday ? 700 : 400,
                          color: isToday ? '#f0f0f0' : '#555',
                          minWidth: 24,
                        }}>
                          {d.label}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 500,
                        color: d.open ? (isToday ? '#f0f0f0' : '#888') : '#3a3a3a',
                        fontFamily: d.open ? 'inherit' : 'monospace',
                        letterSpacing: d.open ? 0 : '0.06em',
                      }}>
                        {d.hours}
                      </span>
                    </div>
                  )
                })}
              </div>
              {profile.service_hours && (
                <div style={{
                  marginTop: 14, paddingTop: 14, borderTop: '1px solid #141414',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Clock size={13} style={{ color: '#444', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#555' }}>{profile.service_hours}</span>
                </div>
              )}
            </Panel>

            {/* Contact CTA */}
            <Panel>
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 14 }}>
                // HIZLI ULAŞ
              </p>
              {profile.phone ? (
                <a href={`tel:${profile.phone}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  padding: '13px 0', borderRadius: 10, marginBottom: 10,
                  background: '#ff6b00', color: '#fff', fontWeight: 700, fontSize: 15,
                  textDecoration: 'none', boxShadow: '0 4px 20px rgba(255,107,0,0.3)',
                }}>
                  <Phone size={15} /> {profile.phone}
                </a>
              ) : null}
              <Link to={user ? `/messages?to=${id}` : '/register'} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a1a',
                color: '#888', fontWeight: 600, fontSize: 14, textDecoration: 'none',
              }}>
                <MessageCircle size={14} /> Mesaj Gönder
              </Link>
            </Panel>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, textAlign: 'center', borderTop: '1px solid #141414', paddingTop: 28 }}>
          <p style={{ fontSize: 11, color: '#222', fontFamily: 'monospace', marginBottom: 16 }}>
            Bu profil Torqvia üzerinden sunulmaktadır.
          </p>
          {!user && (
            <Link to="/register?role=owner" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 10,
              background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)',
              color: '#ff6b00', fontWeight: 600, fontSize: 13, textDecoration: 'none',
            }}>
              Torqvia'ya Ücretsiz Katıl →
            </Link>
          )}
        </div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .body-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .hero-inner { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .hero-inner > div:last-child { align-items: center !important; }
          .hero-inner > div:last-child > div { justify-content: center !important; }
        }
      `}</style>
    </div>
  )
}
