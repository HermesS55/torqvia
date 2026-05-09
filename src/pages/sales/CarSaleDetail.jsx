import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Car, Gauge, Fuel, MapPin, Calendar, Phone, MessageCircle,
  ChevronLeft, ChevronRight, X, Settings2, CheckCircle,
  Trash2, Share2, Tag, Heart, ArrowLeftRight, Shield, Eye,
  Users, Send, DollarSign,
} from 'lucide-react'
import CarDamageReport from '../../components/sales/CarDamageReport'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Spinner from '../../components/ui/Spinner'
import UserAvatar from '../../components/ui/UserAvatar'
import toast from 'react-hot-toast'
import { useMeta } from '../../hooks/useMeta'

const FUEL_LABELS = { benzin: 'Benzin', dizel: 'Dizel', lpg: 'LPG', hybrid: 'Hybrid', elektrik: 'Elektrik' }
const TRANS_LABELS = { manuel: 'Manuel', otomatik: 'Otomatik', yari_otomatik: 'Yarı Otomatik' }

function PhotoGallery({ photos }) {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    if (!lightbox) return
    function onKey(e) {
      if (e.key === 'ArrowLeft')  setCurrent(i => (i - 1 + photos.length) % photos.length)
      if (e.key === 'ArrowRight') setCurrent(i => (i + 1) % photos.length)
      if (e.key === 'Escape')     setLightbox(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, photos.length])

  if (photos.length === 0) {
    return (
      <div className="h-72 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
        <Car className="h-20 w-20 text-zinc-700" />
      </div>
    )
  }

  return (
    <>
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/98 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 p-2.5 rounded-full bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors z-10">
            <X className="h-5 w-5" />
          </button>
          <span className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-zinc-400 z-10">
            {current + 1} / {photos.length}
          </span>
          {photos.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setCurrent(i => (i - 1 + photos.length) % photos.length) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors z-10">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={e => { e.stopPropagation(); setCurrent(i => (i + 1) % photos.length) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors z-10">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img src={photos[current]} alt=""
            className="max-w-full max-h-[90vh] object-contain select-none"
            onClick={e => e.stopPropagation()} />
        </div>
      )}

      <div className="mb-6 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
        {/* Main photo */}
        <div className="relative h-72 sm:h-[480px] cursor-zoom-in" onClick={() => setLightbox(true)}>
          <img src={photos[current]} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
              {current + 1} / {photos.length}
            </span>
          </div>
        </div>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="flex gap-1.5 p-2.5 overflow-x-auto scrollbar-none bg-zinc-950/50">
            {photos.map((url, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`shrink-0 h-16 w-24 rounded-lg overflow-hidden border-2 transition-all ${
                  i === current ? 'border-brand-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                }`}>
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default function CarSaleDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sale, setSale] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [fav, setFav] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerNote, setOfferNote] = useState('')
  const [offerSending, setOfferSending] = useState(false)
  const [offerSent, setOfferSent] = useState(false)

  useMeta(sale ? `${sale.brand} ${sale.model} - ${Number(sale.price).toLocaleString('tr-TR')} ₺` : 'Satılık Araç')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('car_sales')
        .select('*, profiles(id, full_name, avatar_url, plan)')
        .eq('id', id)
        .single()

      if (error || !data) { navigate('/sales', { replace: true }); return }
      setSale(data)
      setLoading(false)
      // Görüntülenme sayısını artır
      supabase.rpc('increment_car_sale_views', { sale_id: id }).catch(() => {})

      if (user) {
        const { data: favData } = await supabase
          .from('car_sale_favorites')
          .select('sale_id')
          .eq('user_id', user.id)
          .eq('sale_id', id)
          .maybeSingle()
        setFav(!!favData)
      }

      // Load similar listings
      const { data: sim } = await supabase
        .from('car_sales')
        .select('id, brand, model, year, price, cover_image, fuel_type, mileage')
        .eq('status', 'active')
        .eq('brand', data.brand)
        .neq('id', id)
        .limit(4)
      setSimilar(sim || [])
    }
    load()
  }, [id])

  const allPhotos = sale ? [sale.cover_image, ...(sale.extra_images || [])].filter(Boolean) : []
  const isOwner = sale?.user_id === user?.id

  async function markSold() {
    if (!confirm('Aracı "Satıldı" olarak işaretleyip ilanı kapatmak istiyorsunuz?')) return
    setActionLoading(true)
    const { error } = await supabase.from('car_sales').update({ status: 'sold' }).eq('id', id)
    if (error) toast.error('İşlem başarısız')
    else { toast.success('İlan kapatıldı — Tebrikler!'); setSale(s => ({ ...s, status: 'sold' })) }
    setActionLoading(false)
  }

  async function deleteListing() {
    if (!confirm('İlanı silmek istediğinize emin misiniz?')) return
    setActionLoading(true)
    const { error } = await supabase.from('car_sales').delete().eq('id', id)
    if (error) { toast.error('Silinemedi'); setActionLoading(false); return }
    toast.success('İlan silindi')
    navigate('/sales')
  }

  async function sendOffer() {
    if (!offerAmount || isNaN(Number(offerAmount))) { toast.error('Geçerli bir tutar girin'); return }
    setOfferSending(true)
    const msg = `💰 Teklif: ${Number(offerAmount).toLocaleString('tr-TR')} ₺\n🚗 ${sale.brand} ${sale.model}${sale.year ? ` (${sale.year})` : ''}${offerNote ? `\n📝 ${offerNote}` : ''}`
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: sale.profiles.id,
      content: msg,
    })
    if (error) { toast.error('Teklif gönderilemedi'); setOfferSending(false); return }
    await supabase.from('notifications').insert({
      user_id: sale.profiles.id,
      type: 'message',
      from_user_id: user.id,
      message: `${sale.brand} ${sale.model} için ${Number(offerAmount).toLocaleString('tr-TR')} ₺ teklif`,
    })
    setOfferSent(true)
    setOfferSending(false)
    toast.success('Teklifiniz satıcıya iletildi!')
  }

  function share() {
    if (navigator.share) {
      navigator.share({ title: `${sale.brand} ${sale.model}`, url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link kopyalandı!')
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (!sale) return null

  const DRIVE_LABELS = { fwd: 'Önden Çekiş', rwd: 'Arkadan Çekiş', awd: 'Tam Zamanlı 4x4', '4wd': 'Part-Time 4x4' }
  const DAMAGE_LABELS = { yok: 'Yok', var: 'Var', bilinmiyor: 'Bilinmiyor' }

  const specs = [
    sale.mileage != null && { icon: Gauge,         label: 'Kilometre',     value: `${Number(sale.mileage).toLocaleString('tr-TR')} km` },
    sale.fuel_type       && { icon: Fuel,           label: 'Yakıt Türü',    value: FUEL_LABELS[sale.fuel_type] || sale.fuel_type },
    sale.transmission    && { icon: Settings2,      label: 'Vites Tipi',    value: TRANS_LABELS[sale.transmission] || sale.transmission },
    sale.year            && { icon: Calendar,       label: 'Model Yılı',    value: `${sale.year}` },
    sale.engine_cc       && { icon: Settings2,      label: 'Motor Hacmi',   value: `${sale.engine_cc} cc` },
    sale.horse_power     && { icon: Gauge,          label: 'Güç',           value: `${sale.horse_power} HP` },
    sale.drive_type      && { icon: Car,            label: 'Çekiş',         value: DRIVE_LABELS[sale.drive_type] || sale.drive_type },
    sale.color           && { icon: Car,            label: 'Renk',          value: sale.color },
    sale.owner_count     && { icon: Users,          label: 'Kaç El',        value: `${sale.owner_count}. El` },
    sale.damage_record   && { icon: Shield,         label: 'Hasar Kaydı',   value: DAMAGE_LABELS[sale.damage_record] || sale.damage_record, accent: sale.damage_record === 'var' ? 'text-red-400' : 'text-green-400' },
    sale.exchange        && { icon: ArrowLeftRight, label: 'Takas',         value: 'Evet' },
    (sale.city || sale.location) && { icon: MapPin, label: 'Konum',        value: [sale.district, sale.city || sale.location].filter(Boolean).join(', ') },
    sale.view_count != null && { icon: Eye,         label: 'Görüntülenme',  value: `${sale.view_count} kez` },
  ].filter(Boolean)

  const postedDate = new Date(sale.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 text-sm text-zinc-600">
        <button onClick={() => navigate('/sales')} className="hover:text-zinc-400 flex items-center gap-1.5 transition-colors">
          <Tag className="h-3.5 w-3.5" />Satılık Araçlar
        </button>
        <span>/</span>
        <span className="text-zinc-400">{sale.brand} {sale.model}</span>
      </div>

      {/* Sold banner */}
      {sale.status !== 'active' && (
        <div className="mb-5 px-5 py-4 rounded-2xl border flex items-center gap-3 bg-zinc-800/50 border-zinc-700">
          <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">
              {sale.status === 'sold' ? 'Bu araç satılmıştır' : 'Bu ilan kapatılmıştır'}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">İlan artık aktif değil.</p>
          </div>
        </div>
      )}

      {/* Photo gallery */}
      <PhotoGallery photos={allPhotos} />

      {/* Content grid */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        {/* Left: main info */}
        <div className="space-y-4">
          {/* Title card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {sale.year && (
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">
                      {sale.year}
                    </span>
                  )}
                  {sale.fuel_type && (
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">
                      {FUEL_LABELS[sale.fuel_type]}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {sale.brand} {sale.model}
                </h1>
                <p className="text-4xl font-black text-brand-400 mt-2 leading-none">
                  {Number(sale.price).toLocaleString('tr-TR')}
                  <span className="text-2xl text-brand-500/70 ml-1">₺</span>
                </p>
                <p className="text-xs text-zinc-600 mt-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />İlan tarihi: {postedDate}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={async () => {
                    if (!user || favLoading) return
                    setFavLoading(true)
                    const next = !fav
                    setFav(next)
                    if (next) {
                      await supabase.from('car_sale_favorites').insert({ user_id: user.id, sale_id: id })
                    } else {
                      await supabase.from('car_sale_favorites').delete().eq('user_id', user.id).eq('sale_id', id)
                    }
                    setFavLoading(false)
                  }}
                  className={`p-2.5 rounded-xl border transition-all ${fav ? 'bg-red-500/15 border-red-500/40 text-red-400' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'}`}>
                  <Heart className={`h-4 w-4 ${fav ? 'fill-current' : ''}`} />
                </button>
                <button onClick={share}
                  className="p-2.5 rounded-xl border border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-all">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Owner actions */}
            {isOwner && sale.status === 'active' && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
                <button onClick={markSold} disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/15 transition-colors disabled:opacity-50">
                  <CheckCircle className="h-4 w-4" />Satıldı Olarak İşaretle
                </button>
                <button onClick={deleteListing} disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/15 transition-colors disabled:opacity-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Specs */}
          {specs.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h2 className="font-semibold text-white mb-4">Araç Özellikleri</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-zinc-800/60 rounded-xl">
                    <div className="p-2 bg-zinc-700/50 rounded-lg shrink-0">
                      <spec.icon className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wide">{spec.label}</p>
                      <p className="text-sm font-semibold text-zinc-200 truncate">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {sale.description && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h2 className="font-semibold text-white mb-3">Açıklama</h2>
              <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">{sale.description}</p>
            </div>
          )}

          {/* Hasar / Boya Raporu */}
          {sale.damage_report && Object.keys(sale.damage_report).length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h2 className="font-semibold text-white mb-4">Boya / Hasar Raporu</h2>
              <CarDamageReport report={sale.damage_report} readOnly />
            </div>
          )}
        </div>

        {/* Right: seller + contact */}
        <div className="space-y-4 lg:sticky lg:top-20 self-start">
          {sale.profiles && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">Satıcı</h2>
              <Link to={`/profile/${sale.profiles.id}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity mb-5 group">
                <UserAvatar profile={sale.profiles} size="lg" />
                <div>
                  <p className="font-semibold text-white group-hover:text-brand-400 transition-colors">
                    {sale.profiles.full_name || 'Kullanıcı'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Profili görüntüle →</p>
                </div>
              </Link>

              {!isOwner && sale.status === 'active' ? (
                <div className="space-y-2.5">
                  {/* Offer button */}
                  {offerSent ? (
                    <div className="w-full flex items-center justify-center gap-2 py-3 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl font-medium">
                      <CheckCircle className="h-4 w-4" /> Teklifiniz İletildi
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setShowOfferForm(o => !o)}
                        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all"
                        style={{ background: showOfferForm ? 'rgba(255,107,0,0.15)' : '#ff6b00', color: showOfferForm ? '#ff8c33' : '#fff', border: showOfferForm ? '1px solid rgba(255,107,0,0.3)' : 'none' }}
                      >
                        <DollarSign className="h-4 w-4" /> Teklif Ver
                      </button>
                      {showOfferForm && (
                        <div className="space-y-2 pt-1">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">₺</span>
                            <input
                              type="number"
                              value={offerAmount}
                              onChange={e => setOfferAmount(e.target.value)}
                              placeholder="Teklif tutarı..."
                              className="input-base pl-8 text-sm py-2.5 w-full"
                            />
                          </div>
                          <input
                            value={offerNote}
                            onChange={e => setOfferNote(e.target.value)}
                            placeholder="Notunuz (isteğe bağlı)..."
                            className="input-base text-sm py-2.5 w-full"
                          />
                          <button onClick={sendOffer} disabled={offerSending || !offerAmount}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50">
                            <Send className="h-3.5 w-3.5" /> {offerSending ? 'Gönderiliyor...' : 'Teklifi Gönder'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  <Link
                    to={`/messages?to=${sale.profiles.id}`}
                    className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50 transition-all"
                  >
                    <MessageCircle className="h-4 w-4" />Mesaj Gönder
                  </Link>
                  {sale.show_phone && (
                    <Link to={`/profile/${sale.profiles.id}`}
                      className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50 transition-all">
                      <Phone className="h-4 w-4 text-zinc-400" />Telefon Numarasını Gör
                    </Link>
                  )}
                </div>
              ) : isOwner ? (
                <div className="text-center py-3 px-4 bg-zinc-800/50 rounded-xl">
                  <p className="text-xs text-zinc-500">Bu sizin ilanınız</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Safety tips */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-xs font-semibold text-zinc-400 mb-2">Güvenli alışveriş</p>
            <ul className="text-xs text-zinc-600 space-y-1.5">
              <li>• Aracı mutlaka bizzat görün ve test sürüşü yapın</li>
              <li>• Resmi belgelerini kontrol edin</li>
              <li>• Önceden para transferi yapmayın</li>
              <li>• Noterde resmi satış yapın</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Similar listings */}
      {similar.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white mb-4">Benzer {sale.brand} İlanları</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similar.map(s => (
              <Link key={s.id} to={`/sales/${s.id}`}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all group">
                <div className="h-32 overflow-hidden bg-zinc-800">
                  {s.cover_image
                    ? <img src={s.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center"><Car className="h-10 w-10 text-zinc-700" /></div>
                  }
                </div>
                <div className="p-3">
                  <p className="text-base font-bold text-brand-400">{Number(s.price).toLocaleString('tr-TR')} ₺</p>
                  <p className="text-sm font-medium text-zinc-300 leading-tight">{s.brand} {s.model}</p>
                  {s.year && <p className="text-xs text-zinc-600">{s.year}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
