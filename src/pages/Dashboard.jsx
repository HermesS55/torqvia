import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Car, Send, Clock, CheckCircle2, PlusCircle, Eye,
  CalendarCheck, Wrench, TrendingUp, XCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { useMeta } from '../hooks/useMeta'

const STATUS_LABELS = {
  pending:   { label: 'Beklemede',    cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  accepted:  { label: 'Kabul Edildi', cls: 'text-green-400 bg-green-500/10 border-green-500/30' },
  rejected:  { label: 'Reddedildi',  cls: 'text-red-400 bg-red-500/10 border-red-500/30' },
  completed: { label: 'Tamamlandı',  cls: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-zinc-500">{label}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.pending
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  )
}

export default function Dashboard() {
  useMeta('Dashboard')
  const { user, profile, loading: authLoading } = useAuth()
  const [listings, setListings] = useState([])
  const [offers, setOffers] = useState([])
  const [dataLoading, setDataLoading] = useState(false)

  const isOwner = profile?.role === 'owner'

  useEffect(() => {
    if (!profile || !user) return
    setDataLoading(true)
    if (isOwner) fetchOwnerData()
    else fetchProData()
  }, [profile?.id])

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          {isOwner ? '🚗 Araç Sahibi' : '⚙️ Servis Uzmanı'} hesabı
        </p>
      </div>

      {isOwner ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Car}         label="İlanlarım"       value={listings.length}       color="bg-brand-500/10 text-brand-400" />
            <StatCard icon={Clock}       label="Bekleyen Teklif" value={pendingOffers.length}  color="bg-yellow-500/10 text-yellow-400" />
            <StatCard icon={CheckCircle2}label="Kabul Edilen"    value={acceptedOffers.length} color="bg-green-500/10 text-green-400" />
            <StatCard icon={TrendingUp}  label="Tamamlanan"      value={completedOffers.length}color="bg-blue-500/10 text-blue-400" />
          </div>

          {/* Yaklaşan randevular */}
          {upcomingAppointments.length > 0 && (
            <div className="mb-8">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-green-400" /> Yaklaşan Randevular
              </h2>
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 5).map(o => (
                  <Link key={o.id} to={`/listings/${o.listing_id}`}
                    className="card flex items-center justify-between hover:border-zinc-700 transition-colors py-3">
                    <div>
                      <p className="font-medium text-white text-sm">{o.listings?.brand} {o.listings?.model}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {o.profiles?.full_name || 'Uzman'} · ₺{Number(o.price).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-green-400">{fmtDate(o.appointment_date)}</p>
                      {o.appointment_note && (
                        <p className="text-[10px] text-zinc-600 mt-0.5 max-w-[140px] truncate">{o.appointment_note}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* İlanlarım */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">İlanlarım</h2>
                <Link to="/listings/new" className="btn-primary text-sm flex items-center gap-1.5">
                  <PlusCircle className="h-3.5 w-3.5" /> Yeni İlan
                </Link>
              </div>
              {listings.length === 0 ? (
                <EmptyState icon={Car} title="Henüz ilan yok"
                  description="İlk ilanını oluşturarak servis teklifleri al"
                  action={<Link to="/listings/new" className="btn-primary">İlan Oluştur</Link>} />
              ) : (
                <div className="space-y-3">
                  {listings.slice(0, 6).map(l => (
                    <Link key={l.id} to={`/listings/${l.id}`}
                      className="card flex items-center justify-between hover:border-zinc-700 transition-colors">
                      <div>
                        <div className="font-medium text-white text-sm">{l.brand} {l.model}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {l.offers?.[0]?.count || 0} teklif
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-zinc-600" />
                    </Link>
                  ))}
                  {listings.length > 6 && (
                    <Link to="/listings?tab=mine" className="text-xs text-brand-400 hover:text-brand-300 pl-1 block">
                      +{listings.length - 6} ilan daha →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Gelen teklifler */}
            <div>
              <h2 className="font-semibold text-white mb-4">Gelen Teklifler</h2>
              {offers.length === 0 ? (
                <EmptyState icon={Send} title="Henüz teklif yok" description="İlanlarına gelen teklifler burada görünecek" />
              ) : (
                <div className="space-y-3">
                  {offers.slice(0, 6).map(o => (
                    <Link key={o.id} to={`/listings/${o.listing_id}`}
                      className="card flex items-center justify-between hover:border-zinc-700 transition-colors">
                      <div>
                        <div className="font-medium text-white text-sm">
                          ₺{Number(o.price).toLocaleString('tr-TR')}
                        </div>
                        <div className="text-xs text-zinc-500">{o.listings?.brand} {o.listings?.model}</div>
                      </div>
                      <StatusBadge status={o.status} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tamamlanan işler */}
          {completedOffers.length > 0 && (
            <div className="mt-8">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400" /> Tamamlanan İşler
              </h2>
              <div className="space-y-3">
                {completedOffers.map(o => (
                  <Link key={o.id} to={`/listings/${o.listing_id}`}
                    className="card flex items-center justify-between hover:border-zinc-700 transition-colors border-blue-500/10">
                    <div>
                      <p className="font-medium text-white text-sm">{o.listings?.brand} {o.listings?.model}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {o.profiles?.full_name} · ₺{Number(o.price).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status="completed" />
                      {o.appointment_date && (
                        <p className="text-[10px] text-zinc-600 mt-1">{fmtDate(o.appointment_date)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* PRO view */
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Send}        label="Gönderilen"    value={offers.length}         color="bg-brand-500/10 text-brand-400" />
            <StatCard icon={Clock}       label="Beklemede"     value={pendingOffers.length}  color="bg-yellow-500/10 text-yellow-400" />
            <StatCard icon={CheckCircle2}label="Kabul Edilen"  value={acceptedOffers.length} color="bg-green-500/10 text-green-400" />
            <StatCard icon={TrendingUp}  label="Tamamlanan"    value={completedOffers.length}color="bg-blue-500/10 text-blue-400" />
          </div>

          {/* Pro yaklaşan randevular */}
          {upcomingAppointments.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-green-400" /> Yaklaşan Randevular
              </h2>
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 3).map(o => (
                  <Link key={o.id} to={`/listings/${o.listing_id}`}
                    className="card flex items-center justify-between hover:border-zinc-700 transition-colors py-3">
                    <div>
                      <p className="font-medium text-white text-sm">{o.listings?.brand} {o.listings?.model}</p>
                      <p className="text-xs text-brand-400 font-semibold">₺{Number(o.price).toLocaleString('tr-TR')}</p>
                    </div>
                    <p className="text-xs font-semibold text-green-400">{fmtDate(o.appointment_date)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Gönderdiğim Teklifler</h2>
            <Link to="/listings" className="btn-secondary text-sm">İlanlara Göz At</Link>
          </div>

          {offers.length === 0 ? (
            <EmptyState icon={Send} title="Henüz teklif göndermediniz"
              description="Araç ilanlarına göz at ve ilk teklifini gönder"
              action={<Link to="/listings" className="btn-primary">İlanları Gör</Link>} />
          ) : (
            <div className="space-y-3">
              {offers.map(o => (
                <Link key={o.id} to={`/listings/${o.listing_id}`}
                  className="card flex items-center justify-between hover:border-zinc-700 transition-colors">
                  <div>
                    <div className="font-medium text-white text-sm">
                      {o.listings?.brand} {o.listings?.model}
                    </div>
                    <div className="text-sm text-brand-400 font-semibold">
                      ₺{Number(o.price).toLocaleString('tr-TR')}
                    </div>
                    {o.appointment_date && new Date(o.appointment_date) > new Date() && (
                      <div className="text-xs text-green-400 mt-0.5 flex items-center gap-1">
                        <CalendarCheck className="h-3 w-3" /> {fmtDate(o.appointment_date)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <StatusBadge status={o.status} />
                    <div className="text-xs text-zinc-600 mt-1">
                      {new Date(o.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Tamamlanan işler (pro) */}
          {completedOffers.length > 0 && (
            <div className="mt-8">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400" /> Tamamlanan İşler
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {completedOffers.map(o => (
                  <div key={o.id} className="card border-blue-500/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white text-sm">{o.listings?.brand} {o.listings?.model}</p>
                        <p className="text-sm text-brand-400 font-semibold">₺{Number(o.price).toLocaleString('tr-TR')}</p>
                      </div>
                      <Wrench className="h-4 w-4 text-blue-400" />
                    </div>
                    {o.appointment_date && (
                      <p className="text-xs text-zinc-600 mt-2">{fmtDate(o.appointment_date)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
