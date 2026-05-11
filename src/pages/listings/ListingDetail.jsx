import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Car, Calendar, Trash2, ArrowLeft, Send,
  MapPin, Gauge, Fuel, Settings2, AlertTriangle, Wallet, Wrench,
  MessageCircle, Phone, User, Edit2, CheckCircle2, RotateCcw, Cog, Bookmark, BookmarkCheck,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useT } from '../../contexts/LangContext'
import { useLightbox, MediaThumb } from '../../components/ui/MediaLightbox'
import Spinner from '../../components/ui/Spinner'
import OfferCard from '../../components/offers/OfferCard'
import SendOfferForm from '../../components/offers/SendOfferForm'
import UserAvatar from '../../components/ui/UserAvatar'
import toast from 'react-hot-toast'

function PhoneReveal({ phone }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="mt-3 pt-3 border-t border-zinc-800">
      {revealed ? (
        <a href={`tel:${phone}`} className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors font-medium">
          <Phone className="h-3.5 w-3.5" />
          {phone}
        </a>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors font-medium"
        >
          <Phone className="h-3.5 w-3.5" />
          Telefon Numarasını Göster
        </button>
      )}
    </div>
  )
}

function InfoChip({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-3 py-2">
      <Icon className="h-4 w-4 text-zinc-500 shrink-0" />
      <div>
        <p className="text-[10px] text-zinc-600">{label}</p>
        <p className="text-sm font-medium text-zinc-200">{value}</p>
      </div>
    </div>
  )
}

export default function ListingDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const t = useT()
  const navigate = useNavigate()
  const { show: showMedia, LightboxModal } = useLightbox()
  const [listing, setListing] = useState(null)
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingBookmark, setSavingBookmark] = useState(false)

  const isOwner = listing?.user_id === user?.id
  const isPro = profile?.role === 'pro'

  useEffect(() => { fetchAll(); if (user?.id) checkSaved() }, [id])

  async function fetchAll() {
    const [{ data: listingData }, { data: offersData }] = await Promise.all([
      supabase.from('listings').select('*, profiles(id, role, phone, full_name, avatar_url, bio, specialty)').eq('id', id).single(),
      supabase.from('offers').select('*, profiles(id, role, phone, full_name, avatar_url, city, shop_name, specialties, plan)').eq('listing_id', id).order('created_at', { ascending: false }),
    ])
    setListing(listingData)
    setOffers(offersData || [])
    setLoading(false)
  }

  async function checkSaved() {
    const { data } = await supabase.from('saved_listings').select('id').eq('user_id', user.id).eq('listing_id', id).maybeSingle()
    setSaved(!!data)
  }

  async function toggleSave() {
    if (savingBookmark) return
    setSavingBookmark(true)
    if (saved) {
      await supabase.from('saved_listings').delete().eq('user_id', user.id).eq('listing_id', id)
      setSaved(false)
      toast('İlanı kayıtlardan çıkardın')
    } else {
      await supabase.from('saved_listings').insert({ user_id: user.id, listing_id: id })
      setSaved(true)
      toast.success('İlan kaydedildi!')
    }
    setSavingBookmark(false)
  }

  async function setListingStatus(newStatus) {
    setTogglingStatus(true)
    const { error } = await supabase.from('listings').update({ status: newStatus }).eq('id', id)
    if (error) { toast.error('Güncellenemedi'); setTogglingStatus(false); return }
    setListing(l => ({ ...l, status: newStatus }))
    if (newStatus === 'closed') {
      const acceptedOffer = offers.find(o => o.status === 'accepted')
      if (acceptedOffer) {
        await supabase.from('offers').update({ status: 'completed' }).eq('id', acceptedOffer.id)
        setOffers(prev => prev.map(o => o.id === acceptedOffer.id ? { ...o, status: 'completed' } : o))
      }
    }
    const labels = { open: 'İlan açıldı', in_progress: 'İlan devam ediyor', closed: 'İlan tamamlandı!' }
    toast.success(labels[newStatus] || 'Güncellendi')
    setTogglingStatus(false)
  }

  async function toggleListingStatus() {
    const newStatus = listing.status === 'closed' ? 'open' : 'closed'
    setListingStatus(newStatus)
  }

  async function handleDelete() {
    if (!confirm(t('ld.delete'))) return
    setDeleting(true)
    const { error } = await supabase.from('listings').delete().eq('id', id)
    if (error) { toast.error(t('ld.deleteFailed')); setDeleting(false) }
    else { toast.success(t('ld.deleted')); navigate('/listings') }
  }

  async function handleOfferStatus(offerId, status) {
    const { error } = await supabase.from('offers').update({ status }).eq('id', offerId)
    if (error) { toast.error('Güncelleme başarısız'); return }
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status } : o))
    const offer = offers.find(o => o.id === offerId)
    if (offer?.sender_id && (status === 'accepted' || status === 'rejected')) {
      supabase.from('notifications').insert({
        user_id: offer.sender_id,
        type: status === 'accepted' ? 'offer_accepted' : 'offer_rejected',
        from_user_id: user.id,
        listing_id: id,
        message: `${listing.brand} ${listing.model}`,
      }).then(() => {})
    }
    if (status === 'completed') {
      await supabase.from('listings').update({ status: 'closed' }).eq('id', id)
      setListing(l => ({ ...l, status: 'closed' }))
    }
  }

  const fuelLabels = { benzin: t('cl.fuelBenzin'), dizel: t('cl.fuelDizel'), lpg: t('cl.fuelLpg'), hybrid: t('cl.fuelHybrid'), elektrik: t('cl.fuelElektrik') }
  const transmissionLabels = { manuel: t('cl.transmissionManuel'), otomatik: t('cl.transmissionAuto'), yari_otomatik: t('cl.transmissionSemi') }

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!listing) return (
    <div className="text-center py-16">
      <p className="text-zinc-500">{t('ld.notFound')}</p>
      <Link to="/listings" className="btn-primary mt-4 inline-block">{t('ld.browse')}</Link>
    </div>
  )

  const allImages = [listing.cover_image, ...(listing.extra_images || [])].filter(Boolean)
  const date = new Date(listing.created_at).toLocaleDateString('tr-TR', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/listings" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t('ld.back')}
      </Link>

      {listing.status === 'closed' && !isOwner && (
        <div className="mb-5 flex items-center gap-3 bg-zinc-800/60 border border-zinc-700 rounded-2xl px-5 py-4">
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Bu ilan tamamlandı</p>
            <p className="text-xs text-zinc-500 mt-0.5">Araç sahibi hizmet aldı, yeni teklif kabul edilmiyor.</p>
          </div>
        </div>
      )}

      {/* Image gallery */}
      {allImages.length > 0 && (
        <div className={`grid gap-2 mb-5 ${allImages.length === 1 ? '' : 'grid-cols-4'}`}>
          <MediaThumb src={allImages[0]} type="image" onOpen={showMedia}
            className={allImages.length > 1 ? 'col-span-3' : ''}>
            <img src={allImages[0]} alt="" className="w-full h-56 object-cover rounded-xl border border-zinc-800" />
          </MediaThumb>
          {allImages.slice(1).map((img, i) => (
            <MediaThumb key={i} src={img} type="image" onOpen={showMedia}>
              <img src={img} alt="" className="w-full h-[106px] object-cover rounded-xl border border-zinc-800" />
            </MediaThumb>
          ))}
        </div>
      )}

      <div className="card mb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {listing.status === 'closed' && (
                <span className="flex items-center gap-1 text-xs font-bold bg-zinc-700/50 text-zinc-400 border border-zinc-600/50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Tamamlandı
                </span>
              )}
              {listing.status === 'in_progress' && (
                <span className="flex items-center gap-1 text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  <Cog className="h-3 w-3" /> Devam Ediyor
                </span>
              )}
              {listing.urgency === 'acil' && listing.status !== 'closed' && (
                <span className="flex items-center gap-1 text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  {t('ld.urgent')}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">
              {listing.brand} {listing.model}
              {listing.year && <span className="text-zinc-500 text-lg font-normal ml-2">· {listing.year}</span>}
            </h1>
            <span className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              {t('ld.posted')} {date}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {listing.budget && (
              <div className="text-right">
                <p className="text-xs text-zinc-600">{t('ld.budget')}</p>
                <p className="text-xl font-bold text-brand-400">₺{Number(listing.budget).toLocaleString('tr-TR')}</p>
              </div>
            )}
            <div className="flex items-center gap-1">
              {!isOwner && (
                <button onClick={toggleSave} disabled={savingBookmark} title={saved ? 'Kaydı Kaldır' : 'Kaydet'}
                  className={`p-2 rounded-lg border transition-colors ${saved ? 'border-brand-500/40 text-brand-400 bg-brand-500/10' : 'border-zinc-700 text-zinc-500 hover:text-brand-400 hover:border-brand-500/40'}`}>
                  {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                </button>
              )}
              {isOwner && (
                <>
                  {listing.status === 'open' && (
                    <button onClick={() => setListingStatus('in_progress')} disabled={togglingStatus}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 transition-colors">
                      {togglingStatus ? <Spinner size="sm" /> : <><Cog className="h-3.5 w-3.5" /><span className="hidden sm:inline">Devam Ediyor</span></>}
                    </button>
                  )}
                  {listing.status === 'in_progress' && (
                    <button onClick={() => setListingStatus('closed')} disabled={togglingStatus}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-colors">
                      {togglingStatus ? <Spinner size="sm" /> : <><CheckCircle2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Tamamlandı</span></>}
                    </button>
                  )}
                  {listing.status === 'closed' && (
                    <button onClick={() => setListingStatus('open')} disabled={togglingStatus}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-zinc-600 text-zinc-400 hover:bg-zinc-800 transition-colors">
                      {togglingStatus ? <Spinner size="sm" /> : <><RotateCcw className="h-3.5 w-3.5" /><span className="hidden sm:inline">Yeniden Aç</span></>}
                    </button>
                  )}
                  <Link to={`/listings/${id}/edit`}
                    className="p-2 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </Link>
                  <button onClick={handleDelete} disabled={deleting}
                    className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                    {deleting ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          <InfoChip icon={Gauge}    label={t('ld.mileage')}      value={listing.mileage ? `${listing.mileage.toLocaleString('tr-TR')} km` : null} />
          <InfoChip icon={MapPin}   label={t('ld.location')}     value={listing.location} />
          <InfoChip icon={Fuel}     label={t('ld.fuel')}         value={fuelLabels[listing.fuel_type] || listing.fuel_type} />
          <InfoChip icon={Settings2}label={t('ld.transmission')} value={transmissionLabels[listing.transmission] || listing.transmission} />
          <InfoChip icon={Car}      label={t('ld.year')}         value={listing.year} />
        </div>

        {/* Service types */}
        {listing.service_types?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5" />
              {t('ld.serviceNeeded')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {listing.service_types.map(s => (
                <span key={s} className="text-xs bg-brand-500/10 border border-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {listing.description && (
          <p className="mt-4 pt-4 border-t border-zinc-800 text-zinc-300 leading-relaxed text-sm">
            {listing.description}
          </p>
        )}
      </div>

      {/* Owner profile card */}
      {listing.profiles && !isOwner && (
        <div className="card mb-5">
          <p className="text-[11px] text-zinc-600 font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <User className="h-3 w-3" /> İlanı Veren
          </p>
          <div className="flex items-center gap-3">
            <Link to={`/profile/${listing.user_id}`}>
              <UserAvatar profile={listing.profiles} size="md" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${listing.user_id}`} className="font-semibold text-white hover:text-brand-400 transition-colors text-sm">
                {listing.profiles.full_name || 'Kullanıcı'}
              </Link>
              <p className="text-xs text-zinc-500">Araç Sahibi</p>
              {listing.profiles.bio && (
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{listing.profiles.bio}</p>
              )}
            </div>
            <Link
              to={`/messages?to=${listing.user_id}`}
              className="btn-secondary flex items-center gap-1.5 text-sm shrink-0"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Mesaj</span>
            </Link>
          </div>
          {listing.show_phone && listing.profiles.phone && (
            <PhoneReveal phone={listing.profiles.phone} />
          )}
        </div>
      )}

      {isPro && !isOwner && listing.status !== 'closed' && (
        <div className="mb-5">
          {showOfferForm ? (
            <SendOfferForm
              listingId={id}
              listingOwnerId={listing?.user_id}
              listingLabel={`${listing?.brand} ${listing?.model}`}
              onSuccess={offer => { setOffers(prev => [offer, ...prev]); setShowOfferForm(false) }}
              onCancel={() => setShowOfferForm(false)}
            />
          ) : (
            <button onClick={() => setShowOfferForm(true)} className="btn-primary flex items-center gap-2 w-full justify-center">
              <Send className="h-4 w-4" />
              {t('ld.sendOffer')}
            </button>
          )}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          {t('ld.offers')}
          {offers.length > 0 && <span className="ml-2 text-sm text-zinc-500 font-normal">({offers.length})</span>}
        </h2>
        {offers.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-zinc-500 text-sm">{t('ld.noOffers')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map(offer => (
              <OfferCard key={offer.id} offer={offer} isOwner={isOwner}
                onUpdateStatus={isOwner ? handleOfferStatus : null} />
            ))}
          </div>
        )}
      </div>

      <LightboxModal />
    </div>
  )
}
