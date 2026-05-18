import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, MapPin, Star, Zap, Calendar, MessageCircle, Filter, X, ChevronRight, Flame, Award } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import UserAvatar from '../components/ui/UserAvatar'
import Spinner from '../components/ui/Spinner'
import { useMeta } from '../hooks/useMeta'
import { CAR_BRANDS } from '../lib/carData'

const BRAND_LIST = Object.keys(CAR_BRANDS).sort()

useMeta && void 0 // tree-shake guard

const SPECIALTIES = ['Motor', 'Kaporta', 'Boya', 'Elektrik', 'Lastik', 'Süspansiyon', 'Fren', 'Tuning', 'Detailing', 'Egzoz', 'Klima', 'Cam', 'Döşeme', 'Yakıt Sistemi', 'Periyodik Bakım']

function scoreOf(pro) {
  const planBonus = (pro.plan === 'turbo' || pro.plan === 'elite') ? 15 : 0
  const ratingScore = (pro.avgRating || 0) * 3
  const reviewScore = Math.sqrt(pro.reviewCount || 0) * 2
  return planBonus + ratingScore + reviewScore
}

/* ─── Pro card ─── */
function ProCard({ pro, compact = false }) {
  const { user } = useAuth()
  const hasPlan = pro.plan === 'turbo' || pro.plan === 'elite'
  const stars = Array.from({ length: 5 }, (_, i) => i + 1)

  if (compact) {
    return (
      <Link to={`/usta/${pro.id}`} style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        background: 'linear-gradient(160deg, #0d0d0d, #0b0b0b)',
        border: `1px solid ${hasPlan ? 'rgba(255,107,0,0.15)' : '#181818'}`,
        borderRadius: 14, textDecoration: 'none',
        transition: 'all 0.15s',
      }}
        onMouseOver={e => { e.currentTarget.style.borderColor = hasPlan ? 'rgba(255,107,0,0.3)' : '#252525'; e.currentTarget.style.background = '#0f0f0f' }}
        onMouseOut={e => { e.currentTarget.style.borderColor = hasPlan ? 'rgba(255,107,0,0.15)' : '#181818'; e.currentTarget.style.background = 'linear-gradient(160deg, #0d0d0d, #0b0b0b)' }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${hasPlan ? 'rgba(255,107,0,0.4)' : '#222'}` }}>
            <UserAvatar profile={pro} fill />
          </div>
          {hasPlan && (
            <span style={{ position: 'absolute', bottom: -2, right: -2, background: '#ff6b00', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={8} fill="white" color="white" />
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pro.full_name}
            </span>
            {hasPlan && <span style={{ fontSize: 8, fontWeight: 900, padding: '1px 5px', borderRadius: 99, background: 'rgba(255,107,0,0.12)', color: '#ff8c33', border: '1px solid rgba(255,107,0,0.25)', letterSpacing: '0.08em', flexShrink: 0 }}>TURBO</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {pro.city && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#555' }}>
                <MapPin size={10} /> {pro.city}
              </span>
            )}
            {pro.avgRating > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#f59e0b' }}>
                <Star size={10} fill="#f59e0b" /> {pro.avgRating.toFixed(1)}
                <span style={{ color: '#333' }}>({pro.reviewCount})</span>
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={14} style={{ color: '#333', flexShrink: 0 }} />
      </Link>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(160deg, #0d0d0d, #0b0b0b)',
      border: `1px solid ${hasPlan ? 'rgba(255,107,0,0.18)' : '#181818'}`,
      borderRadius: 18,
      transition: 'all 0.2s',
      boxShadow: hasPlan ? '0 4px 24px rgba(255,107,0,0.05)' : 'none',
      display: 'flex', flexDirection: 'column',
    }}
      onMouseOver={e => { e.currentTarget.style.borderColor = hasPlan ? 'rgba(255,107,0,0.35)' : '#282828'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = hasPlan ? '0 8px 32px rgba(255,107,0,0.1)' : '0 4px 20px rgba(0,0,0,0.4)' }}
      onMouseOut={e => { e.currentTarget.style.borderColor = hasPlan ? 'rgba(255,107,0,0.18)' : '#181818'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = hasPlan ? '0 4px 24px rgba(255,107,0,0.05)' : 'none' }}
    >
      {/* Shop photo / banner */}
      <div style={{ position: 'relative', height: 120, background: '#0a0a0a', borderRadius: '18px 18px 0 0' }}>
        {/* Image + overlay wrapper — overflow hidden burada, avatar kırpılmasın */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '18px 18px 0 0' }}>
          {pro.shop_photo ? (
            <img src={pro.shop_photo} alt={pro.shop_name || pro.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: hasPlan
                ? 'linear-gradient(135deg, rgba(255,107,0,0.08), rgba(255,107,0,0.03))'
                : 'linear-gradient(135deg, #111, #0d0d0d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ opacity: 0.07, fontSize: 48, fontWeight: 900, color: hasPlan ? '#ff6b00' : '#888', letterSpacing: '-0.04em', userSelect: 'none' }}>
                {(pro.shop_name || pro.full_name || '?')[0]}
              </div>
            </div>
          )}
          {/* Dark gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(10,10,10,0.9) 100%)' }} />
          {/* Plan badge */}
          {hasPlan && (
            <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, background: 'rgba(255,107,0,0.85)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 9, fontWeight: 900, letterSpacing: '0.12em' }}>
              <Zap size={8} fill="white" /> TURBO
            </div>
          )}
        </div>
        {/* Avatar overlapping — dış div'de overflow yok, tam görünür */}
        <div style={{ position: 'absolute', bottom: -22, left: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: `2.5px solid ${hasPlan ? '#ff6b00' : '#1a1a1a'}`, background: '#080808' }}>
            <UserAvatar profile={pro} fill />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Name + rating */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pro.full_name}
            </div>
            {pro.shop_name && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pro.shop_name}</div>
            )}
          </div>
          {pro.avgRating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <Star size={13} fill="#f59e0b" style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f0f0' }}>{pro.avgRating.toFixed(1)}</span>
              <span style={{ fontSize: 11, color: '#444' }}>({pro.reviewCount})</span>
            </div>
          )}
        </div>

        {/* Stars row */}
        {pro.avgRating > 0 && (
          <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
            {stars.map(s => (
              <Star key={s} size={11}
                style={{ color: s <= Math.round(pro.avgRating) ? '#f59e0b' : '#222' }}
                fill={s <= Math.round(pro.avgRating) ? '#f59e0b' : 'none'}
              />
            ))}
          </div>
        )}

        {/* City */}
        {pro.city && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555', marginBottom: 10 }}>
            <MapPin size={12} style={{ flexShrink: 0 }} /> {pro.city}
          </div>
        )}

        {/* Bio */}
        {pro.bio && (
          <p style={{ fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {pro.bio}
          </p>
        )}

        {/* Specialties — bottom */}
        {(pro.specialties?.length > 0 || pro.specialty) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14, marginTop: 'auto', paddingTop: pro.bio ? 0 : 4 }}>
            {(pro.specialties?.length > 0 ? pro.specialties.slice(0, 4) : [pro.specialty]).map(s => (
              <span key={s} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.12)', color: '#ff8c33' }}>{s}</span>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <Link to={`/usta/${pro.id}`} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 0', borderRadius: 9, fontSize: 12, fontWeight: 700,
            background: hasPlan ? 'linear-gradient(135deg, #ff6b00, #ff7d1a)' : 'rgba(255,107,0,0.08)',
            color: hasPlan ? '#fff' : '#ff8c33',
            border: hasPlan ? 'none' : '1px solid rgba(255,107,0,0.2)',
            textDecoration: 'none',
            boxShadow: hasPlan ? '0 2px 12px rgba(255,107,0,0.25)' : 'none',
          }}>
            Profili Gör
          </Link>
          <Link to={`/randevular?usta_id=${pro.id}`} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 0', borderRadius: 9, fontSize: 12, fontWeight: 600,
            background: 'rgba(255,255,255,0.04)', border: '1px solid #222',
            color: '#888', textDecoration: 'none',
          }}>
            <Calendar size={12} /> Randevu Al
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── Trending card (large featured) ─── */
function TrendCard({ pro, rank }) {
  const hasPlan = pro.plan === 'turbo' || pro.plan === 'elite'
  const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32']
  return (
    <Link to={`/usta/${pro.id}`} style={{
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg, #0e0e0e, #0b0b0b)',
      border: `1px solid ${hasPlan ? 'rgba(255,107,0,0.25)' : '#1e1e1e'}`,
      borderRadius: 16, padding: '20px', textDecoration: 'none',
      display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'all 0.2s',
      boxShadow: hasPlan ? '0 4px 28px rgba(255,107,0,0.07)' : 'none',
    }}
      onMouseOver={e => { e.currentTarget.style.borderColor = hasPlan ? 'rgba(255,107,0,0.4)' : '#2a2a2a'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseOut={e => { e.currentTarget.style.borderColor = hasPlan ? 'rgba(255,107,0,0.25)' : '#1e1e1e'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Rank badge */}
      <div style={{ position: 'absolute', top: 12, right: 12, width: 26, height: 26, borderRadius: '50%', background: rankColors[rank] || '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: rank < 3 ? '#000' : '#fff' }}>
        #{rank + 1}
      </div>

      {/* Shop photo strip */}
      {pro.shop_photo && (
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06 }}>
          <img src={pro.shop_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${hasPlan ? '#ff6b00' : '#222'}` }}>
            <UserAvatar profile={pro} fill />
          </div>
          {hasPlan && (
            <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#ff6b00', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={9} fill="white" color="white" />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pro.full_name}</div>
          {pro.shop_name && <div style={{ fontSize: 11, color: '#555', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pro.shop_name}</div>}
          {pro.city && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#555', marginTop: 2 }}>
              <MapPin size={10} /> {pro.city}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <div>
          {pro.avgRating > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {[1,2,3,4,5].map(s => <Star key={s} size={12} style={{ color: s <= Math.round(pro.avgRating) ? '#f59e0b' : '#222' }} fill={s <= Math.round(pro.avgRating) ? '#f59e0b' : 'none'} />)}
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b', marginLeft: 2 }}>{pro.avgRating.toFixed(1)}</span>
              <span style={{ fontSize: 11, color: '#444' }}>({pro.reviewCount} yorum)</span>
            </div>
          ) : (
            <span style={{ fontSize: 11, color: '#2e2e2e' }}>Henüz değerlendirme yok</span>
          )}
          {(pro.specialties?.length > 0 || pro.specialty) && (
            <div style={{ display: 'flex', gap: 4, marginTop: 7, flexWrap: 'wrap' }}>
              {(pro.specialties?.length > 0 ? pro.specialties.slice(0, 2) : [pro.specialty]).map(s => (
                <span key={s} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#111', border: '1px solid #1e1e1e', color: '#555' }}>{s}</span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#ff8c33', fontWeight: 700, flexShrink: 0 }}>
          Profili Gör <ChevronRight size={12} />
        </div>
      </div>
    </Link>
  )
}

/* ═══════════════════════════════════════════ */
export default function Ustalar() {
  const { user, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [pros, setPros] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState(searchParams.get('q') || '')
  const [cityFilter, setCityFilter] = useState('')
  const [specFilter, setSpecFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [sortBy, setSortBy] = useState('rating') // rating | trend | reviews

  useMeta('Usta Bul — Güvenilir Oto Servis Uzmanları', {
    description: "Türkiye'nin en iyi oto servis uzmanlarını bul. Motor, kaporta, boya, elektrik ve daha fazlası. Puana, yoruma ve konuma göre filtrele — ücretsiz randevu al.",
    canonical: 'https://www.torqvia.net/ustalar',
  })

  useEffect(() => { fetchPros() }, [])

  async function fetchPros() {
    setLoading(true)
    const [{ data: proData }, { data: ratingData }] = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, avatar_url, shop_name, city, specialties, plan, bio, specialty, shop_photo, location, brand_expertise')
        .eq('role', 'pro')
        .neq('banned', true)
        .not('full_name', 'is', null),
      supabase.from('pro_ratings').select('pro_id, rating'),
    ])

    const ratings = ratingData || []
    const merged = (proData || []).map(pro => {
      const proRatings = ratings.filter(r => r.pro_id === pro.id)
      const avgRating = proRatings.length > 0
        ? proRatings.reduce((s, r) => s + r.rating, 0) / proRatings.length
        : 0
      return { ...pro, avgRating, reviewCount: proRatings.length }
    })
    setPros(merged)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    let result = [...pros]
    const q = searchQ.trim().toLowerCase()
    if (q) {
      result = result.filter(p =>
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.shop_name || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q) ||
        (p.specialties || []).some(s => s.toLowerCase().includes(q)) ||
        (p.specialty || '').toLowerCase().includes(q)
      )
    }
    if (cityFilter) {
      result = result.filter(p => (p.city || '').toLowerCase().includes(cityFilter.toLowerCase()))
    }
    if (specFilter) {
      result = result.filter(p =>
        (p.specialties || []).includes(specFilter) || (p.specialty || '') === specFilter
      )
    }
    if (brandFilter) {
      result = result.filter(p => (p.brand_expertise || []).includes(brandFilter))
    }
    if (sortBy === 'trend') result.sort((a, b) => scoreOf(b) - scoreOf(a))
    else if (sortBy === 'rating') result.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
    else if (sortBy === 'reviews') result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    return result
  }, [pros, searchQ, cityFilter, specFilter, brandFilter, sortBy])

  const trending = useMemo(
    () => [...pros].sort((a, b) => scoreOf(b) - scoreOf(a)).slice(0, 6),
    [pros]
  )

  const hasFilters = searchQ || cityFilter || specFilter || brandFilter
  const cities = useMemo(() => [...new Set(pros.map(p => p.city).filter(Boolean))].sort(), [pros])

  return (
    <div style={{ minHeight: '100vh', background: '#080808' }}>

      {/* Hero / Search */}
      <div className="ustalar-hero" style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(180deg, #0d0d0d 0%, #080808 100%)',
        borderBottom: '1px solid #141414',
        padding: '48px 20px 40px',
      }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse at 50% 0%, rgba(255,107,0,0.06), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 99, background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.18)', marginBottom: 14 }}>
              <Flame size={12} style={{ color: '#ff6b00' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#ff8c33', letterSpacing: '0.08em' }}>SERVİS UZMANLARI</span>
            </div>
            <h1 className="ustalar-hero-h1" style={{ fontSize: 32, fontWeight: 900, color: '#f0f0f0', letterSpacing: '-0.025em', marginBottom: 10, lineHeight: 1.2 }}>
              Aracına En İyi Ustayı Bul
            </h1>
            <p style={{ fontSize: 14, color: '#555', maxWidth: 420, margin: '0 auto' }}>
              {pros.length} servis uzmanı arasından en iyi puanlı, en yakın ustayı keşfet.
            </p>
          </div>

          {/* Search bar */}
          <div className="ustalar-search-row" style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#444', pointerEvents: 'none' }} />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Usta adı, dükkan adı veya uzmanlık..."
                style={{
                  width: '100%', paddingLeft: 42, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
                  background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: 12,
                  color: '#f0f0f0', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#ff6b00' }}
                onBlur={e => { e.target.style.borderColor = '#1e1e1e' }}
              />
              {searchQ && (
                <button onClick={() => setSearchQ('')}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 4 }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              style={{
                background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: 12,
                color: cityFilter ? '#f0f0f0' : '#555', fontSize: 13, padding: '0 16px',
                outline: 'none', cursor: 'pointer', minWidth: 130,
              }}
            >
              <option value="">Tüm Şehirler</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 80px' }}>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Trend Ustalar — only when no filters */}
            {!hasFilters && trending.length > 0 && (
              <section style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Flame size={14} style={{ color: '#ff6b00' }} />
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#f0f0f0' }}>Trend Ustalar</span>
                  </div>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #1e1e1e, transparent)' }} />
                  <span style={{ fontSize: 11, color: '#444', fontFamily: 'monospace' }}>puan + yorum × plan skoru</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="trend-grid">
                  {trending.map((pro, i) => (
                    <TrendCard key={pro.id} pro={pro} rank={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Filters + all list */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap', rowGap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: '#111', border: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={14} style={{ color: '#888' }} />
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#f0f0f0' }}>
                    {hasFilters ? `${filtered.length} Sonuç` : 'Tüm Ustalar'}
                  </span>
                </div>

                <div className="ustalar-filter-row" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {/* Specialty filter */}
                  <select
                    value={specFilter}
                    onChange={e => setSpecFilter(e.target.value)}
                    style={{ background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: 8, color: specFilter ? '#f0f0f0' : '#555', fontSize: 13, padding: '7px 12px', outline: 'none', cursor: 'pointer', flex: '1 1 140px' }}
                  >
                    <option value="">Tüm Uzmanlıklar</option>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  {/* Sort */}
                  <div style={{ display: 'flex', background: '#0d0d0d', border: '1px solid #181818', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    {[
                      { val: 'trend', label: '🔥' },
                      { val: 'rating', label: '⭐' },
                      { val: 'reviews', label: '💬' },
                    ].map(({ val, label }) => (
                      <button key={val} onClick={() => setSortBy(val)}
                        title={val === 'trend' ? 'Trend' : val === 'rating' ? 'Puan' : 'Yorum'}
                        style={{
                          padding: '8px 14px', fontSize: 14, cursor: 'pointer',
                          background: sortBy === val ? '#ff6b00' : 'transparent',
                          color: sortBy === val ? '#fff' : '#666',
                          border: 'none', transition: 'all 0.15s',
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Clear filters */}
                  {hasFilters && (
                    <button onClick={() => { setSearchQ(''); setCityFilter(''); setSpecFilter('') }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                      <X size={11} /> Temizle
                    </button>
                  )}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#0b0b0b', border: '1px solid #141414', borderRadius: 16 }}>
                  <Search size={36} style={{ color: '#1e1e1e', margin: '0 auto 14px' }} />
                  <div style={{ fontSize: 15, color: '#2e2e2e', marginBottom: 8 }}>Sonuç bulunamadı</div>
                  <button onClick={() => { setSearchQ(''); setCityFilter(''); setSpecFilter('') }}
                    style={{ fontSize: 13, color: '#ff6b00', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Filtreleri temizle
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="ustalar-grid">
                  {filtered.map(pro => <ProCard key={pro.id} pro={pro} />)}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .ustalar-grid, .trend-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .ustalar-hero { padding: 28px 16px 24px !important; }
          .ustalar-search-row { flex-direction: column !important; }
          .ustalar-search-row select { height: 48px; width: 100%; min-width: unset !important; }
          .ustalar-hero-h1 { font-size: 22px !important; }
        }
        @media (max-width: 560px) {
          .ustalar-grid, .trend-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
