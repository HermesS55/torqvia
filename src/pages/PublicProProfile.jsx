import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, Phone, Clock, Banknote, Wrench, Store,
  ChevronLeft, Star, Zap, CheckCircle, MessageCircle,
  Calendar, Shield, X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useMeta } from '../hooks/useMeta'
import UserAvatar from '../components/ui/UserAvatar'
import Spinner from '../components/ui/Spinner'
import TorqviaLogo from '../components/ui/TorqviaLogo'
import PostCard from '../components/posts/PostCard'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/* ─── Particle canvas ─── */
function ParticleCanvas({ rgb1 = '255,107,0', rgb2 = null }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const setSize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    setSize()
    const N = 55
    const pts = Array.from({ length: N }, (_, i) => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      rgb: rgb2 && i % 3 === 0 ? rgb2 : rgb1,
    }))
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < N; i++) {
        const p = pts[i]
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.rgb},0.85)`
        ctx.shadowColor = `rgb(${p.rgb})`; ctx.shadowBlur = 6
        ctx.fill(); ctx.shadowBlur = 0
        for (let j = i + 1; j < N; j++) {
          const q = pts[j]; const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 115) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(${p.rgb},${(1 - d / 115) * 0.28})`; ctx.lineWidth = 0.65; ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(frame)
    }
    frame()
    const ro = new ResizeObserver(setSize); ro.observe(canvas)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [rgb1, rgb2])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}

/* ─── Plain avatar (free plan) ─── */
function PlainAvatar({ profile: p }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{
        width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
        border: '2px solid #1e1e1e', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>
        <UserAvatar profile={p} fill />
      </div>
    </div>
  )
}

/* ─── Avatar with spinning rings (turbo / elite) ─── */
function TurboAvatar({ profile: p, accent, accentLight, rgb, rgb2 = null, label, badgeClass }) {
  const outerRing = rgb2
    ? `conic-gradient(from 0deg, rgba(${rgb},0.6), transparent 30%, rgba(${rgb2},0.5), transparent 65%, rgba(${rgb},0.6))`
    : `conic-gradient(from 0deg, rgba(${rgb},0.6), transparent 35%, rgba(${rgb},0.45), transparent 70%, rgba(${rgb},0.6))`
  const innerRing = rgb2
    ? `conic-gradient(from 60deg, ${accent}, rgba(${rgb},0.05), ${accentLight}, rgba(${rgb2},0.4), ${accent})`
    : `conic-gradient(from 60deg, ${accent}, rgba(${rgb},0.07), ${accentLight}, rgba(${rgb},0.09), ${accent})`
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div className="pp-pulse-ring" style={{
        position: 'absolute', width: 124, height: 124, borderRadius: '50%',
        border: `1.5px solid rgba(${rgb},0.2)`,
      }} />
      <div className="pp-spin-ccw" style={{
        position: 'absolute', width: 110, height: 110, borderRadius: '50%',
        background: outerRing,
        maskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2.5px), black 100%)',
        WebkitMaskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2.5px), black 100%)',
      }} />
      <div className="pp-spin-cw" style={{
        position: 'absolute', width: 98, height: 98, borderRadius: '50%',
        background: innerRing,
        maskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2.5px), black 100%)',
        WebkitMaskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2.5px), black 100%)',
      }} />
      <div style={{
        position: 'relative', width: 88, height: 88, borderRadius: '50%',
        overflow: 'hidden', border: '2.5px solid #080808', zIndex: 2,
        boxShadow: `0 0 0 1px rgba(${rgb},0.15)`,
      }}>
        <UserAvatar profile={p} fill />
      </div>
      <div className={badgeClass} style={{
        position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 11px', borderRadius: 99,
        background: `linear-gradient(135deg, ${accent}, ${accentLight})`,
        color: '#fff', fontSize: 10, fontWeight: 900, letterSpacing: '0.12em',
        whiteSpace: 'nowrap', zIndex: 3,
        boxShadow: `0 0 14px rgba(${rgb},0.75), 0 0 32px rgba(${rgb},0.3)`,
      }}>
        <Zap size={9} fill="#fff" /> {label}
      </div>
    </div>
  )
}

/* ─── Stars ─── */
function Stars({ value, size = 12 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size}
          style={{ color: s <= Math.round(value) ? '#f59e0b' : '#222' }}
          fill={s <= Math.round(value) ? '#f59e0b' : 'none'}
        />
      ))}
    </span>
  )
}

/* ─── 404 ─── */
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

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function PublicProProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [ratings, setRatings] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [photoSrc, setPhotoSrc] = useState(null)

  useEffect(() => {
    if (user?.id && id && user.id === id) {
      navigate(`/profile/${id}`, { replace: true })
    }
  }, [user?.id, id])

  const specialtiesForMeta = profile?.specialties?.length ? profile.specialties.join(', ') : profile?.specialty || ''
  const titleForMeta = profile
    ? [profile.full_name, profile.shop_name].filter(Boolean).join(' · ')
    : 'Usta Profili'
  const descForMeta = profile
    ? `${profile.full_name}${profile.city ? ', ' + profile.city : ''} — oto servis uzmanı${specialtiesForMeta ? ': ' + specialtiesForMeta : ''}. Torqvia üzerinden randevu alın ve iletişime geçin.`
    : ''
  const canonicalForMeta = id ? `https://www.torqvia.net/usta/${id}` : undefined

  const avgRatingForMeta = ratings.length > 0
    ? Math.round(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length * 10) / 10
    : null
  const ldJsonData = profile ? {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: profile.shop_name || profile.full_name,
    url: canonicalForMeta,
    image: profile.avatar_url || undefined,
    description: descForMeta,
    ...(profile.city ? { address: { '@type': 'PostalAddress', addressLocality: profile.city, addressCountry: 'TR' } } : {}),
    ...(profile.phone ? { telephone: profile.phone } : {}),
    ...(profile.price_range ? { priceRange: profile.price_range } : {}),
    ...(avgRatingForMeta && ratings.length > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRatingForMeta,
        reviewCount: ratings.length,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  } : null

  useMeta(titleForMeta, {
    description: descForMeta,
    image: profile?.avatar_url || '/torqvia-og.png',
    robots: 'index, follow',
    canonical: canonicalForMeta,
    ldJson: ldJsonData,
    ldJsonId: 'usta-ld-json',
  })

  useEffect(() => {
    if (!UUID_RE.test(id || '')) { setNotFound(true); setLoading(false); return }
    fetchProfile()
  }, [id])

  async function fetchProfile() {
    setLoading(true)
    const [{ data: p, error: pErr }, { data: items }, { data: ratingData }, { data: postsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('portfolio_items')
        .select('id, image_url, caption').eq('pro_id', id).order('created_at', { ascending: false }),
      supabase.from('pro_ratings')
        .select('id, rating, comment, created_at, reviewer:profiles!pro_ratings_owner_id_fkey(id, full_name)')
        .eq('pro_id', id).order('created_at', { ascending: false }),
      supabase.from('posts')
        .select('*, profiles!posts_user_id_fkey(id, avatar_url, full_name, role, specialty, plan), post_likes(user_id), post_comments(count)')
        .eq('user_id', id).order('created_at', { ascending: false }).limit(10),
    ])
    if (pErr || !p || p.role !== 'pro' || p.banned) {
      setNotFound(true)
    } else {
      const uid = user?.id
      const mapped = (postsData || []).map(post => ({
        ...post,
        like_count: post.post_likes?.length || 0,
        comment_count: post.post_comments?.[0]?.count || 0,
        liked_by_me: post.post_likes?.some(l => l.user_id === uid) || false,
      }))
      setProfile(p); setPortfolio(items || []); setRatings(ratingData || []); setPosts(mapped)
    }
    setLoading(false)
  }

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

  /* ─── Derived ─── */
  const planValue = profile.plan || profile.membership_type || 'free'
  const isTurbo = planValue === 'turbo'
  const isElite = planValue === 'elite'
  const hasPlan = isTurbo || isElite
  const planAccent      = isElite ? '#8b5cf6' : '#ff6b00'
  const planAccentLight = isElite ? '#a78bfa' : '#ff8c33'
  const planRgb         = isElite ? '139,92,246' : '255,107,0'
  const planRgb2        = isElite ? '196,160,0' : null
  const planLabel       = isElite ? '⚡ ELİTE ÜYE' : '⚡ TURBO ÜYE'
  const badgeAnimClass  = isElite ? 'pp-badge-elite-glow' : 'pp-badge-glow'
  const avgRating = ratings.length > 0
    ? Math.round(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length * 10) / 10
    : null
  const satisfactionPct = ratings.length > 0
    ? Math.round((ratings.filter(r => r.rating >= 4).length / ratings.length) * 100)
    : null
  const locationText = [profile.city, profile.location].filter(Boolean).join(' / ')
  const specialties = profile.specialties?.length
    ? profile.specialties
    : profile.specialty ? [profile.specialty] : []

  /* Panel helper */
  const Panel = ({ label, accent, children, style = {} }) => (
    <div style={{
      background: 'linear-gradient(160deg, #0d0d0d 0%, #0b0b0b 100%)',
      border: `1px solid ${accent ? 'rgba(255,107,0,0.14)' : '#141414'}`,
      borderRadius: 16,
      padding: '22px 24px',
      ...(accent ? { borderLeftWidth: 3, borderLeftColor: '#ff6b00', borderLeftStyle: 'solid' } : {}),
      ...style,
    }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.22em' }}>
            {label}
          </span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #1a1a1a, transparent)' }} />
        </div>
      )}
      {children}
    </div>
  )

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#080808', overflowY: 'auto', overflowX: 'hidden', zIndex: 100 }}>

      {/* ══ NAVBAR ══ */}
      <header className="pp-navbar" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,8,8,0.88)', backdropFilter: 'blur(16px) saturate(1.6)',
        borderBottom: '1px solid #141414',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: 58,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <TorqviaLogo size={32} />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#f0f0f0', letterSpacing: '-0.02em' }}>Torqvia</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 15px', borderRadius: 9,
              background: 'transparent', border: '1px solid #1e1e1e',
              color: '#666', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.03em', transition: 'all 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#ccc' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#666' }}
          >
            <ChevronLeft size={13} strokeWidth={2.5} /> GERİ
          </button>
          <Link
            to={user ? `/randevular?usta_id=${id}` : '/register?role=owner'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 20px', borderRadius: 9,
              background: 'linear-gradient(135deg, #ff6b00, #ff7d1a)',
              color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none',
              boxShadow: '0 2px 14px rgba(255,107,0,0.35)',
              letterSpacing: '0.01em',
            }}
          >
            <Calendar size={13} strokeWidth={2.5} /> Randevu Al
          </Link>
        </div>
      </header>

      <div className="pp-outer" style={{ maxWidth: 980, margin: '0 auto', padding: '0 20px 80px' }}>

        {/* ══ HERO ══ */}
        <div style={{
          position: 'relative', borderRadius: 22, overflow: 'hidden',
          marginTop: 22, marginBottom: 14,
          border: `1px solid ${hasPlan ? `rgba(${planRgb},0.2)` : '#141414'}`,
          boxShadow: hasPlan ? `0 0 100px rgba(${planRgb},0.07), 0 4px 40px rgba(0,0,0,0.6)` : '0 4px 40px rgba(0,0,0,0.5)',
        }}>

          {/* Background layers */}
          <div style={{ position: 'absolute', inset: 0, background: '#080808' }}>
            {hasPlan && <ParticleCanvas rgb1={planRgb} rgb2={planRgb2} />}
          </div>

          {/* Shimmer sweep */}
          {hasPlan && (
            <div className="pp-shimmer" style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(108deg, transparent 30%, rgba(255,255,255,0.022) 50%, transparent 70%)',
              backgroundSize: '220% 100%',
            }} />
          )}

          {/* Bottom fade */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(to bottom, rgba(8,8,8,0) 0%, rgba(8,8,8,0.45) 55%, rgba(8,8,8,0.92) 100%)',
          }} />

          {/* Plan top border shimmer */}
          {hasPlan && (
            <div className="pp-shimmer" style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2, pointerEvents: 'none',
              background: `linear-gradient(90deg, transparent 0%, ${planAccent} 38%, ${planAccentLight} 62%, transparent 100%)`,
              backgroundSize: '220% auto',
            }} />
          )}

          {/* Hero content */}
          <div className="pp-hero-content" style={{ position: 'relative', zIndex: 2, padding: '48px 40px 48px' }}>
            <div className="pp-hero-inner" style={{ display: 'flex', alignItems: 'flex-start', gap: 36 }}>

              {/* Avatar */}
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginTop: 4, paddingBottom: hasPlan ? 22 : 0, cursor: profile.avatar_url ? 'zoom-in' : 'default' }}
                onClick={() => profile.avatar_url && setPhotoSrc(profile.avatar_url)}
                title={profile.avatar_url ? 'Fotoğrafı büyüt' : undefined}
              >
                {hasPlan
                  ? <TurboAvatar profile={profile} accent={planAccent} accentLight={planAccentLight} rgb={planRgb} rgb2={planRgb2} label={planLabel} badgeClass={badgeAnimClass} />
                  : <PlainAvatar profile={profile} />
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>

                {/* Name + badges */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 900, color: '#f0f0f0', letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0 }}>
                    {profile.full_name || 'İsimsiz Usta'}
                  </h1>
                  {hasPlan && (
                    <span className={badgeAnimClass} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 13px', borderRadius: 99,
                      background: `rgba(${planRgb},0.1)`, border: `1px solid rgba(${planRgb},0.3)`,
                      color: planAccent, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                    }}>
                      <Zap size={11} fill={planAccent} /> {planLabel}
                    </span>
                  )}
                  {profile.verified && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 12px', borderRadius: 99,
                      background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)',
                      color: '#22c55e', fontSize: 11, fontWeight: 700,
                    }}>
                      <Shield size={10} strokeWidth={2.5} /> DOĞRULANDI
                    </span>
                  )}
                </div>

                {/* Shop + city */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 16 }}>
                  {profile.shop_name && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#777' }}>
                      <Store size={13} style={{ color: '#444', flexShrink: 0 }} />
                      {profile.shop_name}
                    </span>
                  )}
                  {locationText && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: '#777' }}>
                      <MapPin size={13} style={{ color: '#444', flexShrink: 0 }} />
                      {locationText}
                    </span>
                  )}
                </div>

                {/* Meta row */}
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18,
                }}>
                  {/* Rating */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 14px', borderRadius: 10,
                    background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)',
                  }}>
                    <Stars value={avgRating || 0} size={12} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#f0f0f0' }}>
                      {avgRating ?? '—'}
                    </span>
                    {ratings.length > 0 && (
                      <span style={{ fontSize: 11, color: '#444' }}>({ratings.length})</span>
                    )}
                  </div>
                  {/* Completed */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '7px 14px', borderRadius: 10,
                    background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)',
                    fontSize: 13,
                  }}>
                    <CheckCircle size={13} style={{ color: '#22c55e' }} />
                    <span style={{ fontWeight: 700, color: '#f0f0f0' }}>{ratings.length}</span>
                    <span style={{ color: '#444' }}>tamamlanan</span>
                  </div>
                  {profile.price_range && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '7px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid #1e1e1e',
                      fontSize: 13, maxWidth: '100%', overflow: 'hidden',
                    }}>
                      <Banknote size={13} style={{ color: '#444', flexShrink: 0 }} />
                      <span style={{ color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.price_range}</span>
                    </div>
                  )}
                </div>

                {/* Specialty chips */}
                {specialties.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 24 }}>
                    {specialties.map(s => (
                      <span key={s} style={{
                        padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                        background: '#111', border: '1px solid #1e1e1e', color: '#777',
                        letterSpacing: '0.01em',
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTAs */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <Link
                    to={user ? `/randevular?usta_id=${id}` : '/register?role=owner'}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '11px 24px', borderRadius: 11,
                      background: 'linear-gradient(135deg, #ff6b00, #ff7d1a)',
                      color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none',
                      boxShadow: '0 4px 22px rgba(255,107,0,0.38)',
                    }}
                  >
                    <Calendar size={14} strokeWidth={2.5} /> Randevu Al
                  </Link>
                  <Link
                    to={user ? `/messages?to=${id}` : '/register'}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '11px 20px', borderRadius: 11,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid #1e1e1e',
                      color: '#888', fontWeight: 600, fontSize: 14, textDecoration: 'none',
                      transition: 'all 0.15s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#bbb' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#888' }}
                  >
                    <MessageCircle size={14} /> Mesaj Gönder
                  </Link>
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '11px 18px', borderRadius: 11,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a1a',
                        color: '#555', fontWeight: 500, fontSize: 14, textDecoration: 'none',
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

        {/* ══ SPOTLIGHT BANNER ══ */}
        {hasPlan && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '13px 20px', borderRadius: 12, marginBottom: 28,
            background: `linear-gradient(90deg, rgba(${planRgb},0.07) 0%, rgba(${planRgb},0.03) 100%)`,
            border: `1px solid rgba(${planRgb},0.12)`,
            borderLeft: `3px solid ${planAccent}`,
          }}>
            <Zap size={15} style={{ color: planAccent, flexShrink: 0 }} fill={planAccent} />
            <span style={{ fontSize: 13, color: '#777', lineHeight: 1.5 }}>
              {isElite
                ? <>Bu usta <strong style={{ color: planAccentLight, fontWeight: 700 }}>ELİTE ÜYE</strong> sayesinde arama sonuçlarında en üstte listeleniyor ve premium rozet taşıyor.</>
                : <>Bu usta <strong style={{ color: planAccentLight, fontWeight: 700 }}>TURBO ÜYE</strong> sayesinde arama sonuçlarında öncelikli listeleniyor.</>
              }
            </span>
          </div>
        )}

        {/* ══ 2-COL BODY ══ */}
        <div className="pp-body-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>

          {/* ── LEFT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Hakkında */}
            <Panel label="// HAKKINDA">
              <div className="pp-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: profile.bio ? 20 : 0 }}>
                {[
                  {
                    icon: <Wrench size={14} style={{ color: '#ff6b00' }} />,
                    label: 'Uzmanlık',
                    value: profile.specialty || '—',
                  },
                  {
                    icon: <Clock size={14} style={{ color: '#ff6b00' }} />,
                    label: 'Çalışma Saatleri',
                    value: profile.service_hours || '—',
                  },
                  {
                    icon: <Phone size={14} style={{ color: '#ff6b00' }} />,
                    label: 'Telefon',
                    value: profile.phone
                      ? <a href={`tel:${profile.phone}`} style={{ color: '#ccc', textDecoration: 'none' }}>{profile.phone}</a>
                      : '—',
                  },
                  {
                    icon: <Banknote size={14} style={{ color: '#ff6b00' }} />,
                    label: 'Ortalama Fiyat',
                    value: profile.price_range || '—',
                  },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 16px',
                    background: 'linear-gradient(135deg, #0e0e0e, #0c0c0c)',
                    border: '1px solid #181818', borderRadius: 12,
                    transition: 'border-color 0.15s',
                  }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#222'}
                    onMouseOut={e => e.currentTarget.style.borderColor = '#181818'}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 9, color: '#333', fontFamily: 'monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 13, color: '#888', fontWeight: 500, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {profile.bio && (
                <p style={{ fontSize: 14, color: '#5a5a5a', lineHeight: 1.75, margin: 0 }}>
                  {profile.bio}
                </p>
              )}
              {!profile.bio && !profile.specialty && !profile.service_hours && (
                <p style={{ fontSize: 13, color: '#2e2e2e', fontStyle: 'italic', margin: 0 }}>
                  Profil açıklaması henüz eklenmemiş.
                </p>
              )}
            </Panel>

            {/* Yorumlar */}
            <Panel label={`// YORUMLAR${ratings.length > 0 ? ` (${ratings.length})` : ''}`}>
              {ratings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                  <p style={{ color: '#2e2e2e', fontSize: 13, margin: 0 }}>Henüz yorum yapılmamış.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ratings.slice(0, 6).map(r => (
                    <div key={r.id} style={{
                      padding: '15px 17px',
                      background: 'linear-gradient(135deg, #0d0d0d, #0b0b0b)',
                      border: '1px solid #181818', borderRadius: 13,
                      transition: 'border-color 0.15s',
                    }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#222'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#181818'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: r.comment ? 11 : 0 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, rgba(255,107,0,0.12), rgba(255,107,0,0.06))',
                          border: '1px solid rgba(255,107,0,0.14)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 800, color: '#ff8c33',
                        }}>
                          {(r.reviewer?.full_name || 'K')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#d0d0d0' }}>
                              {r.reviewer?.full_name || 'Kullanıcı'}
                            </span>
                            <span style={{ fontSize: 10, color: '#2e2e2e', fontFamily: 'monospace' }}>
                              {new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <Stars value={r.rating} size={11} />
                        </div>
                      </div>
                      {r.comment && (
                        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, margin: 0, paddingLeft: 48 }}>
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
                <div className="pp-portfolio-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {portfolio.map(item => (
                    <div key={item.id} style={{ position: 'relative', borderRadius: 11, overflow: 'hidden', aspectRatio: '1', border: '1px solid #1a1a1a', cursor: 'zoom-in' }}
                      onClick={() => setPhotoSrc(item.image_url)}>
                      <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {item.caption && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', padding: '18px 8px 7px', fontSize: 11, color: '#ddd' }}>
                          {item.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Posts */}
            {posts.length > 0 && (
              <Panel label="// PAYLAŞIMLAR">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </Panel>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* İstatistikler */}
            <Panel label="// İSTATİSTİKLER">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Puan', value: avgRating ? avgRating.toFixed(1) : '—', unit: '/ 5.0', accent: '#f59e0b' },
                  { label: 'Yorum', value: ratings.length, unit: 'adet', accent: '#22c55e' },
                  { label: 'Memnuniyet', value: satisfactionPct != null ? `%${satisfactionPct}` : '—', unit: '', accent: '#8b5cf6' },
                  { label: 'Fiyat Aralığı', value: profile.price_range || '—', unit: '', accent: '#ff6b00', small: true },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: '14px 14px 13px',
                    background: 'linear-gradient(135deg, #0e0e0e, #0c0c0c)',
                    border: '1px solid #181818', borderRadius: 12,
                  }}>
                    <div style={{ fontSize: 9, color: '#2e2e2e', fontFamily: 'monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 9 }}>
                      {s.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, overflow: 'hidden' }}>
                      <span style={{ fontSize: s.small ? 14 : 23, fontWeight: 900, color: s.accent, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</span>
                      {s.unit && <span style={{ fontSize: 11, color: '#333' }}>{s.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Rating bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = ratings.filter(r => r.rating === star).length
                  const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#333', width: 8, flexShrink: 0, textAlign: 'right' }}>{star}</span>
                      <Star size={10} style={{ color: '#f59e0b', flexShrink: 0 }} fill="#f59e0b" />
                      <div style={{ flex: 1, height: 5, background: '#141414', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: 'linear-gradient(90deg, #ff6b00, #ffb347)',
                          borderRadius: 3, transition: 'width 0.7s ease',
                          minWidth: pct > 0 ? 4 : 0,
                        }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#2e2e2e', width: 16, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </Panel>

            {/* Çalışma Saatleri — sadece usta girimişse göster */}
            {profile.service_hours && (
              <Panel label="// ÇALIŞMA SAATLERİ">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock size={14} style={{ color: '#ff6b00', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{profile.service_hours}</span>
                </div>
              </Panel>
            )}

            {/* Quick contact */}
            <Panel>
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#333', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                // HIZLI ULAŞ
                <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #1a1a1a, transparent)', display: 'inline-block' }} />
              </p>
              {profile.phone && (
                <a href={`tel:${profile.phone}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  padding: '13px 0', borderRadius: 11, marginBottom: 10,
                  background: 'linear-gradient(135deg, #ff6b00, #ff7d1a)',
                  color: '#fff', fontWeight: 700, fontSize: 15,
                  textDecoration: 'none', boxShadow: '0 4px 22px rgba(255,107,0,0.3)',
                }}>
                  <Phone size={15} strokeWidth={2.5} /> {profile.phone}
                </a>
              )}
              <Link to={user ? `/messages?to=${id}` : '/register'} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0', borderRadius: 11,
                background: 'rgba(255,255,255,0.03)', border: '1px solid #1e1e1e',
                color: '#666', fontWeight: 600, fontSize: 14, textDecoration: 'none',
              }}>
                <MessageCircle size={14} /> Mesaj Gönder
              </Link>
            </Panel>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 52, textAlign: 'center', borderTop: '1px solid #141414', paddingTop: 30 }}>
          <p style={{ fontSize: 11, color: '#1e1e1e', fontFamily: 'monospace', marginBottom: 18, letterSpacing: '0.08em' }}>
            Bu profil Torqvia üzerinden sunulmaktadır.
          </p>
          {!user && (
            <Link to="/register?role=owner" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 26px', borderRadius: 11,
              background: 'rgba(255,107,0,0.07)', border: '1px solid rgba(255,107,0,0.18)',
              color: '#ff8c33', fontWeight: 600, fontSize: 13, textDecoration: 'none',
              transition: 'all 0.15s',
            }}>
              Torqvia&apos;ya Ücretsiz Katıl →
            </Link>
          )}
        </div>
      </div>

      {/* ══ GLOBAL STYLES + KEYFRAMES ══ */}
      <style>{`
        /* ── Keyframes ── */
        @keyframes pp-pulse-ring {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.06); }
        }
        @keyframes pp-spin-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes pp-spin-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pp-badge-glow {
          0%, 100% { box-shadow: 0 0 14px rgba(255,107,0,0.7), 0 0 30px rgba(255,107,0,0.28); }
          50%       { box-shadow: 0 0 22px rgba(255,107,0,0.95), 0 0 50px rgba(255,107,0,0.45); }
        }
        @keyframes pp-badge-elite {
          0%, 100% { box-shadow: 0 0 14px rgba(124,58,237,0.7), 0 0 30px rgba(124,58,237,0.28); }
          50%       { box-shadow: 0 0 22px rgba(124,58,237,0.95), 0 0 50px rgba(124,58,237,0.45); }
        }
        @keyframes pp-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        /* ── Animation classes ── */
        .pp-pulse-ring  { animation: pp-pulse-ring 2.4s ease-in-out infinite; }
        .pp-spin-ccw    { animation: pp-spin-ccw 6s linear infinite; }
        .pp-spin-cw     { animation: pp-spin-cw 3.5s linear infinite; }
        .pp-badge-glow       { animation: pp-badge-glow 2.2s ease-in-out infinite; }
        .pp-badge-elite-glow { animation: pp-badge-elite 2.2s ease-in-out infinite; }
        .pp-shimmer          { animation: pp-shimmer 5s linear infinite; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .pp-body-grid    { grid-template-columns: 1fr !important; }
          .pp-hero-content { padding: 32px 24px 32px !important; }
          .pp-navbar       { padding: 0 16px !important; }
          .pp-outer        { padding-left: 12px !important; padding-right: 12px !important; }
        }
        @media (max-width: 600px) {
          .pp-hero-inner { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .pp-hero-inner > div:first-child { margin-top: 0 !important; }
          .pp-hero-inner > div:last-child > div { justify-content: center !important; }
          .pp-hero-content { padding: 24px 16px 24px !important; }
          .pp-outer        { padding-left: 8px !important; padding-right: 8px !important; }
          .pp-info-grid    { grid-template-columns: 1fr !important; }
          .pp-portfolio-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* ══ PHOTO LIGHTBOX ══ */}
      {photoSrc && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', backdropFilter: 'blur(6px)' }}
          onClick={() => setPhotoSrc(null)}
        >
          <button
            onClick={() => setPhotoSrc(null)}
            style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}
          >
            <X size={18} />
          </button>
          <img
            src={photoSrc}
            alt=""
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 20px 80px rgba(0,0,0,0.8)' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
