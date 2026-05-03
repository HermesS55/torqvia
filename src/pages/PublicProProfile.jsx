import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Phone, Clock, Banknote, Wrench, Store } from 'lucide-react'
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

// TODO: is_founding_member kolonu eklenince aktif et
function FoundingBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
      ★ Kurucu Usta
    </span>
  )
}

export default function PublicProProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [portfolio, setPortfolio] = useState([])
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
    const [{ data: p }, { data: items }] = await Promise.all([
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
    ])

    if (!p || p.role !== 'pro' || p.banned) {
      setNotFound(true)
    } else {
      setProfile(p)
      setPortfolio(items || [])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (notFound) return <NotFound />

  const hasPlan = profile.plan === 'elite' || profile.plan === 'turbo'

  const locationText = [profile.city, profile.location].filter(Boolean).join(' / ')

  const specialties = profile.specialties?.length
    ? profile.specialties
    : null

  const showServices = specialties || profile.specialty

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-12">

      {/* Header */}
      <header className="flex items-center justify-between py-4 mb-2">
        <Link to="/" className="opacity-80 hover:opacity-100 transition-opacity">
          <TorqviaLogo size={28} />
        </Link>
        {!user && (
          <Link
            to="/register?role=owner"
            className="btn-primary text-sm py-1.5 px-4"
          >
            Hesap Aç
          </Link>
        )}
      </header>

      {/* Hero Card */}
      <div className="card mb-4 flex flex-col items-center text-center gap-3 py-8">
        <UserAvatar profile={profile} size="xl" />

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            {profile.full_name || 'İsimsiz Usta'}
          </h1>

          {profile.shop_name && (
            <p className="flex items-center justify-center gap-1.5 text-zinc-400 text-base mt-1">
              <Store className="h-4 w-4 shrink-0" />
              {profile.shop_name}
            </p>
          )}

          {locationText && (
            <p className="flex items-center justify-center gap-1 text-zinc-500 text-sm mt-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {locationText}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            <Wrench className="h-3 w-3" /> Servis Uzmanı
          </span>
          {hasPlan && <PlanBadge plan={profile.plan} size="md" />}
          {/* TODO: is_founding_member kolonu eklenince aktif et */}
          {false && <FoundingBadge />}
        </div>
      </div>

      {/* Telefon CTA */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Phone className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-zinc-300">Hemen Ara</span>
        </div>
        {profile.phone ? (
          <a
            href={`tel:${profile.phone}`}
            className="btn-primary flex items-center justify-center gap-2 w-full text-base min-h-14 rounded-xl font-bold tracking-wide"
          >
            <Phone className="h-5 w-5" />
            {profile.phone}
          </a>
        ) : (
          <div className="flex items-center justify-center min-h-14 rounded-xl border border-zinc-700 bg-zinc-800/40 text-zinc-500 text-sm">
            Telefon yakında eklenecek
          </div>
        )}
      </div>

      {/* Verdiği Hizmetler */}
      {showServices && (
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">Verdiği Hizmetler</h2>
          {specialties ? (
            <div className="flex flex-wrap gap-2">
              {specialties.map(s => (
                <span
                  key={s}
                  className="text-sm px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-zinc-300 text-sm leading-relaxed">{profile.specialty}</p>
          )}
        </div>
      )}

      {/* Hakkında */}
      {profile.bio && (
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-2">Hakkında</h2>
          <p className="text-zinc-300 text-sm leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Çalışma Saatleri */}
      {profile.service_hours && (
        <div className="card mb-4 flex items-center gap-3">
          <Clock className="h-4 w-4 text-zinc-500 shrink-0" />
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Çalışma Saatleri</p>
            <p className="text-sm text-zinc-200">{profile.service_hours}</p>
          </div>
        </div>
      )}

      {/* Fiyat Aralığı */}
      {profile.price_range && (
        <div className="card mb-4 flex items-center gap-3">
          <Banknote className="h-4 w-4 text-zinc-500 shrink-0" />
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Fiyat Aralığı</p>
            <p className="text-sm text-zinc-200">{profile.price_range}</p>
          </div>
        </div>
      )}

      {/* Portföy */}
      {portfolio.length > 0 && (
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">Portföy</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {portfolio.map(item => (
              <div
                key={item.id}
                className="relative rounded-xl overflow-hidden aspect-square border border-zinc-800"
              >
                <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                {item.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1 text-xs text-white line-clamp-2">
                    {item.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 text-center space-y-4">
        <p className="text-xs text-zinc-600">Bu profil Torqvia üzerinden sunulmaktadır.</p>
        <div className="card">
          <p className="text-sm text-zinc-400 mb-3">Aracın için servis lazım mı?</p>
          <Link
            to="/register?role=owner"
            className="btn-primary flex items-center justify-center gap-2 w-full"
          >
            Servis Talep Et
          </Link>
        </div>
      </footer>

    </div>
  )
}
