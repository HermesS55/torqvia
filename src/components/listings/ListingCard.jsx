import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Car, Calendar, MapPin, Gauge, AlertTriangle, CheckCircle2, Bookmark, BookmarkCheck } from 'lucide-react'
import { useT } from '../../contexts/LangContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import UserAvatar from '../ui/UserAvatar'
import toast from 'react-hot-toast'

export default function ListingCard({ listing }) {
  const t = useT()
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [savingBookmark, setSavingBookmark] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('saved_listings').select('id').eq('user_id', user.id).eq('listing_id', listing.id).maybeSingle()
      .then(({ data }) => setSaved(!!data))
  }, [listing.id, user?.id])

  async function toggleSave(e) {
    e.preventDefault()
    e.stopPropagation()
    if (savingBookmark || !user) return
    setSavingBookmark(true)
    if (saved) {
      await supabase.from('saved_listings').delete().eq('user_id', user.id).eq('listing_id', listing.id)
      setSaved(false)
    } else {
      await supabase.from('saved_listings').insert({ user_id: user.id, listing_id: listing.id })
      setSaved(true)
      toast.success('İlan kaydedildi!')
    }
    setSavingBookmark(false)
  }
  const date = new Date(listing.created_at).toLocaleDateString('tr-TR', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const owner = listing.profiles

  const isClosed = listing.status === 'closed'

  return (
    <Link to={`/listings/${listing.id}`} className={`card hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group block overflow-hidden ${isClosed ? 'opacity-60' : ''}`}>
      {/* Cover image */}
      {listing.cover_image ? (
        <div className="relative -mx-5 -mt-5 mb-4 h-44 overflow-hidden">
          <img src={listing.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          {isClosed ? (
            <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-600 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="h-2.5 w-2.5" /> Kapatıldı
            </span>
          ) : listing.urgency === 'acil' && (
            <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
              <AlertTriangle className="h-2.5 w-2.5" />
              {t('listings.urgent')}
            </span>
          )}
          <span className="absolute top-2 right-2 text-[10px] text-zinc-300 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" />
            {date}
          </span>
          {owner && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
              <UserAvatar profile={owner} size="xs" />
              <span className="text-[11px] text-white font-medium max-w-[100px] truncate">
                {owner.full_name || 'Kullanıcı'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {owner ? (
              <div className="flex items-center gap-1.5">
                <UserAvatar profile={owner} size="xs" />
                <span className="text-xs text-zinc-400">{owner.full_name || 'Kullanıcı'}</span>
              </div>
            ) : (
              <div className="bg-brand-500/10 rounded-lg p-2.5">
                <Car className="h-5 w-5 text-brand-400" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {listing.urgency === 'acil' && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-2.5 w-2.5" />
                {t('listings.urgent')}
              </span>
            )}
            <span className="text-xs text-zinc-600 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {date}
            </span>
          </div>
        </div>
      )}

      <h3 className="font-semibold text-white text-base group-hover:text-brand-400 transition-colors">
        {listing.brand} {listing.model}
        {listing.year && <span className="text-zinc-500 font-normal text-sm ml-1">· {listing.year}</span>}
      </h3>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-zinc-600">
        {listing.mileage && (
          <span className="flex items-center gap-1">
            <Gauge className="h-3 w-3" />
            {listing.mileage.toLocaleString('tr-TR')} {t('listings.km')}
          </span>
        )}
        {listing.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {listing.location}
          </span>
        )}
      </div>

      {listing.description && (
        <p className="text-zinc-500 text-sm mt-2 line-clamp-2">{listing.description}</p>
      )}

      {/* Service types */}
      {listing.service_types?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {listing.service_types.slice(0, 3).map(s => (
            <span key={s} className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">{s}</span>
          ))}
          {listing.service_types.length > 3 && (
            <span className="text-[10px] text-zinc-700">+{listing.service_types.length - 3}</span>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
        {listing.budget ? (
          <span className="text-sm font-semibold text-brand-400">₺{Number(listing.budget).toLocaleString('tr-TR')}</span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {user && (
            <button onClick={toggleSave} title={saved ? 'Kaydı Kaldır' : 'Kaydet'}
              className={`p-1 rounded transition-colors ${saved ? 'text-brand-400' : 'text-zinc-600 hover:text-brand-400'}`}>
              {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
          )}
          <span className="text-xs text-zinc-600 group-hover:text-brand-400 transition-colors">
            {t('listings.viewDetails')}
          </span>
        </div>
      </div>
    </Link>
  )
}
