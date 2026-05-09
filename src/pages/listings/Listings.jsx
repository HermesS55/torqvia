import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Car, PlusCircle, X, SlidersHorizontal, Fuel, Zap, AlertTriangle, Wallet, MapPin, Bookmark, Users, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useT } from '../../contexts/LangContext'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import ListingCard from '../../components/listings/ListingCard'
import { useMeta } from '../../hooks/useMeta'

const FUEL_TYPES  = ['benzin', 'dizel', 'lpg', 'hybrid', 'elektrik']
const FUEL_LABELS = { benzin: 'Benzin', dizel: 'Dizel', lpg: 'LPG', hybrid: 'Hybrid', elektrik: 'Elektrik' }
const SERVICE_OPTIONS = [
  'Motor', 'Kaporta', 'Boya', 'Elektrik', 'Lastik',
  'Süspansiyon', 'Fren', 'Tuning', 'Detailing', 'Egzoz',
  'Klima', 'Cam', 'Döşeme', 'Yakıt Sistemi', 'Periyodik Bakım',
]
const BUDGET_RANGES = [
  { label: '0 – 500₺',   min: 0,    max: 500 },
  { label: '500 – 2k₺',  min: 500,  max: 2000 },
  { label: '2k – 5k₺',   min: 2000, max: 5000 },
  { label: '5k – 10k₺',  min: 5000, max: 10000 },
  { label: '10k₺ üzeri', min: 10000, max: null },
]

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${
        active
          ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 font-medium'
          : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
      }`}
    >
      {label}
    </button>
  )
}

const TABS = [
  { id: 'all',   label: 'Tüm İlanlar' },
  { id: 'mine',  label: 'İlanlarım' },
  { id: 'saved', label: 'Kaydettiklerim' },
]

export default function Listings() {
  useMeta('İlanlar', { description: 'Araç servis ilanlarına göz at, teklif ver veya kendi ilanını oluştur.' })
  const { profile, user } = useAuth()
  const t = useT()
  const [listings, setListings]   = useState([])
  const [savedListings, setSavedListings] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [tab, setTab] = useState('all')
  const [filters, setFilters] = useState({ urgency: '', fuel: '', service: '', budgetRange: null })

  const isOwner = profile?.role === 'owner'

  useEffect(() => { fetchListings() }, [])
  useEffect(() => { if (tab === 'saved') fetchSavedListings() }, [tab])

  async function fetchListings() {
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles(id, full_name, avatar_url, role)')
      .order('created_at', { ascending: false })
    if (!error) setListings(data || [])
    setLoading(false)
  }

  async function fetchSavedListings() {
    if (!user?.id) return
    const { data } = await supabase
      .from('saved_listings')
      .select('listing_id, listings(*, profiles(id, full_name, avatar_url, role))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setSavedListings((data || []).map(r => r.listings).filter(Boolean))
  }

  const sourceList = tab === 'saved' ? savedListings : listings
  const filtered = sourceList.filter(l => {
    if (tab === 'mine' && l.user_id !== user?.id) return false
    if (tab === 'all' && l.status === 'closed') return false
    const text = `${l.brand} ${l.model} ${l.description || ''}`.toLowerCase()
    if (search && !text.includes(search.toLowerCase())) return false
    if (locationSearch && !(l.location || '').toLowerCase().includes(locationSearch.toLowerCase())) return false
    if (filters.urgency && l.urgency !== filters.urgency) return false
    if (filters.fuel && l.fuel_type !== filters.fuel) return false
    if (filters.service && !l.service_types?.includes(filters.service)) return false
    if (filters.budgetRange) {
      const { min, max } = filters.budgetRange
      const b = Number(l.budget) || 0
      if (b < min) return false
      if (max !== null && b > max) return false
    }
    return true
  })

  const hasFilters = !!(filters.urgency || filters.fuel || filters.service || filters.budgetRange || locationSearch)

  function clearFilters() {
    setFilters({ urgency: '', fuel: '', service: '', budgetRange: null })
    setLocationSearch('')
  }

  function toggleFilter(key, value) {
    setFilters(f => ({ ...f, [key]: f[key] === value ? '' : value }))
  }

  function toggleBudget(range) {
    setFilters(f => ({
      ...f,
      budgetRange: f.budgetRange?.label === range.label ? null : range,
    }))
  }

  return (
    <div className="lg:grid lg:gap-6 lg:items-start" style={{ gridTemplateColumns: '200px 1fr' }}>

      {/* ── Left sidebar (desktop only) ── */}
      <aside className="hidden lg:flex lg:flex-col gap-3">
        <Link to="/ustalar" className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-brand-500/40 hover:bg-zinc-800/60 transition-colors group">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-brand-400" />
            </div>
            <span className="text-sm font-semibold text-white">Usta Bul</span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-brand-400 ml-auto transition-colors" />
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">Konumuna göre servis uzmanı bul, profilleri incele ve randevu al.</p>
        </Link>

        {isOwner && (
          <Link to="/listings/new" className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 hover:bg-zinc-800/60 transition-colors group">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <PlusCircle className="h-4 w-4 text-zinc-400" />
              </div>
              <span className="text-sm font-semibold text-white">Yeni İlan</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 ml-auto transition-colors" />
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">Araçın için servis ilanı oluştur, teklifler al.</p>
          </Link>
        )}
      </aside>

      {/* ── Main content ── */}
      <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('listings.title')}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {filtered.length} ilan
            {listings.length !== filtered.length && ` · ${listings.length} toplam`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(s => !s)}
            className={`btn-ghost flex items-center gap-1.5 text-sm ${hasFilters ? 'text-brand-400' : ''}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtrele</span>
            {hasFilters && (
              <span className="bg-brand-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">!</span>
            )}
          </button>
          {isOwner && (
            <Link to="/listings/new" className="btn-primary flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{t('listings.new')}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 mb-4">
        {TABS.filter(t => {
          if (t.id === 'mine') return isOwner
          if (t.id === 'saved') return !!user
          return true
        }).map(tabItem => (
          <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === tabItem.id ? 'border-brand-500 text-brand-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}>
            {tabItem.id === 'saved' && <Bookmark className="h-3.5 w-3.5" />}
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Search bars */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('listings.searchPlaceholder')}
            className="input-base pl-10 pr-10"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={locationSearch}
            onChange={e => setLocationSearch(e.target.value)}
            placeholder="Konum ara... (İstanbul, Ankara...)"
            className="input-base pl-10 pr-10"
          />
          {locationSearch && (
            <button onClick={() => setLocationSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card mb-4 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-300">Filtreler</span>
            {hasFilters && (
              <button onClick={clearFilters}
                className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
                <X className="h-3 w-3" /> Temizle
              </button>
            )}
          </div>

          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" /> Aciliyet
            </p>
            <div className="flex flex-wrap gap-2">
              <Chip label="Acil"   active={filters.urgency === 'acil'}   onClick={() => toggleFilter('urgency', 'acil')} />
              <Chip label="Normal" active={filters.urgency === 'normal'} onClick={() => toggleFilter('urgency', 'normal')} />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Wallet className="h-3 w-3" /> Bütçe Aralığı
            </p>
            <div className="flex flex-wrap gap-2">
              {BUDGET_RANGES.map(r => (
                <Chip key={r.label} label={r.label}
                  active={filters.budgetRange?.label === r.label}
                  onClick={() => toggleBudget(r)} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Fuel className="h-3 w-3" /> Yakıt Tipi
            </p>
            <div className="flex flex-wrap gap-2">
              {FUEL_TYPES.map(f => (
                <Chip key={f} label={FUEL_LABELS[f]} active={filters.fuel === f} onClick={() => toggleFilter('fuel', f)} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Zap className="h-3 w-3" /> Hizmet Türü
            </p>
            <div className="flex flex-wrap gap-2">
              {SERVICE_OPTIONS.map(s => (
                <Chip key={s} label={s} active={filters.service === s} onClick={() => toggleFilter('service', s)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={tab === 'saved' ? Bookmark : Car}
          title={
            tab === 'saved' ? 'Kayıtlı ilan yok' :
            tab === 'mine' ? 'Henüz ilanın yok' :
            (search || hasFilters ? t('listings.emptySearch') : t('listings.empty'))
          }
          description={
            tab === 'saved' ? 'İlanları kaydetmek için ilan sayfasındaki yer imi butonunu kullan' :
            tab === 'mine' ? 'İlk ilanını oluşturarak servis teklifleri al' :
            (!search && !hasFilters ? t('listings.emptyDesc') : '')
          }
          action={
            isOwner && tab === 'mine' ? (
              <Link to="/listings/new" className="btn-primary">{t('listings.create')}</Link>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
