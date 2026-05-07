import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Phone, Clock, Banknote, Wrench, Store, ChevronLeft, Star, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useMeta } from '../hooks/useMeta'
import UserAvatar from '../components/ui/UserAvatar'
import Spinner from '../components/ui/Spinner'
import PlanBadge from '../components/ui/PlanBadge'
import TorqviaLogo from '../components/ui/TorqviaLogo'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function NotFound() {
  useMeta('Usta bulunamadı')
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-6xl font-black text-zinc-800 mb-4">404</p>
      <h1 className="text-xl font-bold text-white mb-2">Usta bulunamadı</h1>
      <p className="text-zinc-500 text-sm mb-6">Bu profil mevcut değil ya da artık erişilebilir değil.</p>
      <Link to="/" className="btn-primary">Anasayfaya Dön</Link>
    </div>
  )
}

function TurboParticleCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const N = 50
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
    }))
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < N; i++) {
        const p = pts[i]
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2)
        ctx.fillStyle = '#ff6b00'
        ctx.shadowColor = '#ff6b00'
        ctx.shadowBlur = 5
        ctx.fill()
        ctx.shadowBlur = 0
        for (let j = i + 1; j < N; j++) {
          const q = pts[j]
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(255,107,0,${(1 - d / 100) * 0.3})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(frame)
    }
    frame()
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    })
    ro.observe(canvas)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}

function TurboAvatarRings({ children }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', padding: 16 }}>
      {/* Outer pulse ring */}
      <div style={{
        position: 'absolute', inset: 4, borderRadius: '50%',
        border: '1px solid rgba(255,107,0,0.2)',
        animation: 'pulse-outer-ring 2.2s ease-in-out infinite',
      }} />
      {/* Inner conic ring CW */}
      <div style={{
        position: 'absolute', inset: 8, borderRadius: '50%',
        background: 'conic-gradient(from 0deg, #ff6b00, rgba(255,107,0,0.05), #ff8c33, rgba(255,107,0,0.08), #ff6b00)',
        animation: 'spin-ring-cw 3s linear infinite',
        maskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2px), black 100%)',
        WebkitMaskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2px), black 100%)',
      }} />
      {/* Outer conic ring CCW */}
      <div style={{
        position: 'absolute', inset: 3, borderRadius: '50%',
        background: 'conic-gradient(from 90deg, rgba(255,107,0,0.6), transparent 40%, rgba(255,140,51,0.4), transparent 80%)',
        animation: 'spin-ring-ccw 5s linear infinite',
        maskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2px), black 100%)',
        WebkitMaskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2px), black 100%)',
      }} />
      {children}
    </div>
  )
}

export default function PublicProProfile() {
  const { id } = useParams()
  const { user } = useAuth()
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

  useMeta(title, {
    description,
    image: profile?.avatar_url || '/og-default.png',
    robots: 'index, follow',
  })

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
      const arr = ratingData || []
      setRatings(arr)
    }
    setLoading(false)
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (notFound) return <NotFound />

  const isTurbo = profile.plan === 'turbo'
  const isElite = profile.plan === 'elite'
  const hasPlan = isTurbo || isElite
  const avgRating = ratings.length > 0
    ? Math.round(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length * 10) / 10
    : null

  const locationText = [profile.city, profile.location].filter(Boolean).join(' / ')
  const specialties = profile.specialties?.length ? profile.specialties : null

  return (
    <div style={{ background: '#080808', minHeight: '100vh' }} className="-mx-3 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-8">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 60px' }}>

        {/* ── Back + Book buttons ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 0' }}>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555',
            textDecoration: 'none', padding: '7px 14px', borderRadius: 8,
            border: '1px solid #1a1a1a', background: '#0b0b0b',
          }}>
            <ChevronLeft size={14} /> GERİ
          </Link>
          <div style={{ display: 'flex', gap: 10 }}>
            {!user && (
              <Link to="/register?role=owner" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px',
                borderRadius: 8, background: '#ff6b00', color: '#fff', fontWeight: 700,
                fontSize: 14, textDecoration: 'none',
              }}>
                Randevu Al
              </Link>
            )}
          </div>
        </div>

        {/* ── Hero ── */}
        <div style={{
          position: 'relative', borderRadius: 20, overflow: 'hidden',
          marginTop: 16, marginBottom: 24,
          border: `1px solid ${isTurbo ? 'rgba(255,107,0,0.25)' : isElite ? 'rgba(139,92,246,0.25)' : '#141414'}`,
          boxShadow: isTurbo ? '0 0 60px rgba(255,107,0,0.08)' : 'none',
        }}>
          {/* Canvas bg */}
          <div style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#080808' }}>
              {hasPlan && <TurboParticleCanvas />}
            </div>
            {/* Radial fade */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 50% 0%, transparent 30%, rgba(8,8,8,0.85) 100%)',
            }} />
            {/* Shimmer line */}
            {isTurbo && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: 'linear-gradient(90deg, transparent, #ff6b00, transparent)',
                backgroundSize: '200% auto',
                animation: 'shimmer-sweep 2.5s linear infinite',
              }} />
            )}
          </div>

          {/* Avatar + Info */}
          <div style={{ background: '#0a0a0a', padding: '0 28px 28px', marginTop: -60 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 16 }}>
              {isTurbo ? (
                <TurboAvatarRings>
                  <UserAvatar profile={profile} size="xl" />
                </TurboAvatarRings>
              ) : (
                <div style={{ padding: 8 }}>
                  <UserAvatar profile={profile} size="xl" />
                </div>
              )}
              <div style={{ flex: 1, paddingBottom: 4 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f0f0', marginBottom: 4 }}>
                  {profile.full_name || 'İsimsiz Usta'}
                </h1>
                {profile.shop_name && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#888', marginBottom: 4 }}>
                    <Store size={13} /> {profile.shop_name}
                  </p>
                )}
                {locationText && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#555' }}>
                    <MapPin size={12} /> {locationText}
                  </p>
                )}
              </div>
              {/* Turbo badge */}
              {isTurbo && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 99,
                  background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.35)',
                  color: '#ff6b00', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em',
                  animation: 'badge-turbo-glow 2s ease-in-out infinite',
                }}>
                  <Zap size={12} fill="#ff6b00" /> TURBO ÜYE
                </div>
              )}
              {isElite && <PlanBadge plan="elite" size="md" />}
            </div>

            {/* Turbo spotlight banner */}
            {isTurbo && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', borderRadius: 10,
                background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.15)',
                marginBottom: 20,
              }}>
                <Zap size={14} style={{ color: '#ff6b00', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#888' }}>
                  Bu usta Turbo üyelik sayesinde öncelikli listeleniyor
                </span>
              </div>
            )}

            {/* Roles row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11,
                padding: '5px 11px', borderRadius: 99,
                background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa',
              }}>
                <Wrench size={11} /> Servis Uzmanı
              </span>
              {hasPlan && <PlanBadge plan={profile.plan} size="sm" />}
            </div>
          </div>
        </div>

        {/* ── 2-column body ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }} className="profile-grid">
          {/* Left */}
          <div>
            {/* Hakkında */}
            {profile.bio && (
              <div style={{ background: '#0b0b0b', border: '1px solid #141414', borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
                <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 12 }}>// HAKKINDA</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  {profile.shop_name && (
                    <div>
                      <div style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>Dükkan</div>
                      <div style={{ fontSize: 13, color: '#888' }}>{profile.shop_name}</div>
                    </div>
                  )}
                  {locationText && (
                    <div>
                      <div style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>Konum</div>
                      <div style={{ fontSize: 13, color: '#888' }}>{locationText}</div>
                    </div>
                  )}
                  {profile.service_hours && (
                    <div>
                      <div style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>Çalışma Saatleri</div>
                      <div style={{ fontSize: 13, color: '#888' }}>{profile.service_hours}</div>
                    </div>
                  )}
                  {profile.price_range && (
                    <div>
                      <div style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>Fiyat Aralığı</div>
                      <div style={{ fontSize: 13, color: '#888' }}>{profile.price_range}</div>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 13, color: '#777', lineHeight: 1.65 }}>{profile.bio}</p>
              </div>
            )}

            {/* Hizmetler */}
            {specialties && (
              <div style={{ background: '#0b0b0b', border: '1px solid #141414', borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
                <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 12 }}>// HİZMETLER</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {specialties.map(s => (
                    <span key={s} style={{
                      padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                      border: `1px solid ${isTurbo ? 'rgba(255,107,0,0.3)' : '#1a1a1a'}`,
                      color: isTurbo ? '#ff8c33' : '#666',
                      background: isTurbo ? 'rgba(255,107,0,0.06)' : '#0e0e0e',
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Yorumlar */}
            {ratings.length > 0 && (
              <div style={{ background: '#0b0b0b', border: '1px solid #141414', borderRadius: 14, padding: '20px 22px' }}>
                <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 16 }}>// YORUMLAR</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ratings.slice(0, 4).map(r => (
                    <div key={r.id} style={{ padding: '12px 14px', background: '#0e0e0e', borderRadius: 10, border: '1px solid #141414' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>{r.reviewer?.full_name || 'Kullanıcı'}</span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={11} style={{ color: s <= r.rating ? '#f59e0b' : '#222', fill: s <= r.rating ? '#f59e0b' : 'none' }} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize: 12, color: '#555', lineHeight: 1.55 }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right */}
          <div>
            {/* Stats */}
            <div style={{ background: '#0b0b0b', border: '1px solid #141414', borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 16 }}>// İSTATİSTİKLER</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Puan', value: avgRating ? `${avgRating}★` : '—' },
                  { label: 'Yorum', value: ratings.length },
                  { label: 'Plan', value: profile.plan?.toUpperCase() || 'ÜCRETSİZ' },
                  { label: 'Konum', value: profile.city || '—' },
                ].map(item => (
                  <div key={item.label} style={{ background: '#0e0e0e', border: '1px solid #141414', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: '#333', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f0f0' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Rating bars */}
              {ratings.length > 0 && (
                <div>
                  {[5,4,3,2,1].map(star => {
                    const count = ratings.filter(r => r.rating === star).length
                    const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: '#444', width: 10, flexShrink: 0 }}>{star}</span>
                        <div style={{ flex: 1, height: 4, background: '#141414', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#ff6b00', borderRadius: 2, transition: 'width 0.5s ease' }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#333', width: 14, textAlign: 'right' }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Çalışma Saatleri */}
            {profile.service_hours && (
              <div style={{ background: '#0b0b0b', border: '1px solid #141414', borderRadius: 14, padding: '18px 22px', marginBottom: 16 }}>
                <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 10 }}>// ÇALIŞMA SAATLERİ</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock size={15} style={{ color: '#555' }} />
                  <span style={{ fontSize: 13, color: '#888' }}>{profile.service_hours}</span>
                </div>
              </div>
            )}

            {/* Call CTA */}
            <div style={{ background: '#0b0b0b', border: '1px solid #141414', borderRadius: 14, padding: '18px 22px' }}>
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 12 }}>// İLETİŞİM</p>
              {profile.phone ? (
                <a href={`tel:${profile.phone}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '13px 0', borderRadius: 10,
                  background: '#ff6b00', color: '#fff', fontWeight: 700, fontSize: 15,
                  textDecoration: 'none', boxShadow: '0 4px 20px rgba(255,107,0,0.3)',
                }}>
                  <Phone size={16} /> {profile.phone}
                </a>
              ) : (
                <Link to="/register?role=owner" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px 0', borderRadius: 10,
                  background: '#ff6b00', color: '#fff', fontWeight: 700, fontSize: 14,
                  textDecoration: 'none',
                }}>
                  Randevu Al
                </Link>
              )}
              {!user && (
                <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#333' }}>
                  Platformu kullanmak için{' '}
                  <Link to="/register" style={{ color: '#ff6b00', textDecoration: 'none' }}>ücretsiz hesap aç</Link>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio */}
        {portfolio.length > 0 && (
          <div style={{ background: '#0b0b0b', border: '1px solid #141414', borderRadius: 14, padding: '20px 22px', marginTop: 20 }}>
            <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 16 }}>// PORTFÖY</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {portfolio.map(item => (
                <div key={item.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', border: '1px solid #1a1a1a' }}>
                  <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {item.caption && (
                    <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', fontSize: 11, color: '#fff' }}>
                      {item.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#222', fontFamily: 'monospace' }}>Bu profil Torqvia üzerinden sunulmaktadır.</p>
          {!user && (
            <div style={{ marginTop: 20, background: '#0b0b0b', border: '1px solid #141414', borderRadius: 14, padding: '20px 24px' }}>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 14 }}>Aracın için servis lazım mı?</p>
              <Link to="/register?role=owner" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 28px',
                borderRadius: 10, background: '#ff6b00', color: '#fff', fontWeight: 700,
                fontSize: 14, textDecoration: 'none',
              }}>
                Servis Talep Et
              </Link>
            </div>
          )}
        </footer>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
