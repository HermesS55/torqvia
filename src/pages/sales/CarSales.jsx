import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Tag, Plus, Search, Car, Gauge, Fuel, MapPin, Calendar,
  X, SlidersHorizontal, ChevronDown, ArrowUpDown,
  TrendingDown, TrendingUp, Clock, Heart,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Spinner from '../../components/ui/Spinner'
import UserAvatar from '../../components/ui/UserAvatar'
import { useMeta } from '../../hooks/useMeta'

const FUEL_LABELS = { benzin: 'Benzin', dizel: 'Dizel', lpg: 'LPG', hybrid: 'Hybrid', elektrik: 'Elektrik' }
const TRANS_LABELS = { manuel: 'Manuel', otomatik: 'Otomatik', yari_otomatik: 'Yarı Oto.' }

const PRICE_RANGES = [
  { label: '0–250K', min: 0, max: 250000 },
  { label: '250K–500K', min: 250000, max: 500000 },
  { label: '500K–1M', min: 500000, max: 1000000 },
  { label: '1M+', min: 1000000, max: null },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'En Yeni', icon: Clock },
  { value: 'price_asc', label: 'Fiyat ↑', icon: TrendingUp },
  { value: 'price_desc', label: 'Fiyat ↓', icon: TrendingDown },
  { value: 'mileage_asc', label: 'En Az KM', icon: Gauge },
]

function CarSaleCard({ sale, onFav, favIds }) {
  const seller = sale.profiles
  const isFav = favIds.has(sale.id)

  return (
    <Link
      to={`/sales/${sale.id}`}
      className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 flex flex-col"
    >
      {/* Cover image */}
      <div className="relative h-52 overflow-hidden bg-zinc-800 shrink-0">
        {sale.cover_image ? (
          <img
            src={sale.cover_image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <Car className="h-16 w-16 text-zinc-700" />
          </div>
        )}

        {/* Fav button */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onFav(sale.id) }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-sm transition-all ${
            isFav ? 'bg-red-500 text-white' : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${isFav ? 'fill-current' : ''}`} />
        </button>

        {/* Photos count */}
        {sale.extra_images?.length > 0 && (
          <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>
            {sale.extra_images.length + 1}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Price */}
        <p className="text-2xl font-black text-brand-400 leading-none mb-1">
          {Number(sale.price).toLocaleString('tr-TR')} <span className="text-base font-bold">₺</span>
        </p>

        {/* Title */}
        <h3 className="font-semibold text-white text-base leading-tight group-hover:text-brand-300 transition-colors">
          {sale.brand} {sale.model}
          {sale.year && <span className="text-zinc-500 font-normal text-sm ml-1.5">{sale.year}</span>}
        </h3>

        {/* Specs chips */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {sale.mileage != null && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
              <Gauge className="h-2.5 w-2.5" />{Number(sale.mileage).toLocaleString('tr-TR')} km
            </span>
          )}
          {sale.fuel_type && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
              <Fuel className="h-2.5 w-2.5" />{FUEL_LABELS[sale.fuel_type] || sale.fuel_type}
            </span>
          )}
          {sale.transmission && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
              {TRANS_LABELS[sale.transmission] || sale.transmission}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          {sale.location && (
            <span className="text-xs text-zinc-600 flex items-center gap-1">
              <MapPin className="h-3 w-3" />{sale.location}
            </span>
          )}
          {seller && (
            <div className="flex items-center gap-1.5 ml-auto">
              <UserAvatar profile={seller} size="xs" />
              <span className="text-[11px] text-zinc-500 max-w-[80px] truncate">{seller.full_name || 'Kullanıcı'}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function CarSales() {
  useMeta('Satılık Araçlar')
  const { user } = useAuth()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ fuel: '', transmission: '', priceRange: null, minYear: '', maxKm: '' })
  const [favIds, setFavIds] = useState(new Set())

  useEffect(() => { fetchSales(); fetchFavs() }, [tab])

  async function fetchFavs() {
    if (!user) return
    const { data } = await supabase
      .from('car_sale_favorites')
      .select('sale_id')
      .eq('user_id', user.id)
    if (data) setFavIds(new Set(data.map(r => r.sale_id)))
  }

  async function fetchSales() {
    setLoading(true)
    try {
      let q = supabase
        .from('car_sales')
        .select('*, profiles(id, full_name, avatar_url, plan)')
        .eq('status', 'active')

      if (tab === 'mine') q = q.eq('user_id', user.id)

      const { data, error } = await q
      if (error) throw error
      setSales(data || [])
    } catch (err) {
      console.error('car_sales fetch error:', err)
      setSales([])
    }
    setLoading(false)
  }

  async function toggleFav(id) {
    if (!user) return
    const isFav = favIds.has(id)
    setFavIds(prev => {
      const next = new Set(prev)
      isFav ? next.delete(id) : next.add(id)
      return next
    })
    if (isFav) {
      await supabase.from('car_sale_favorites').delete().eq('user_id', user.id).eq('sale_id', id)
    } else {
      await supabase.from('car_sale_favorites').insert({ user_id: user.id, sale_id: id })
    }
  }

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })) }

  const filtered = useMemo(() => {
    let list = [...sales]
    const q = search.toLowerCase().trim()
    if (q) {
      list = list.filter(s =>
        s.brand?.toLowerCase().includes(q) ||
        s.model?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q)
      )
    }
    if (filters.fuel) list = list.filter(s => s.fuel_type === filters.fuel)
    if (filters.transmission) list = list.filter(s => s.transmission === filters.transmission)
    if (filters.priceRange) {
      const { min, max } = filters.priceRange
      list = list.filter(s => s.price >= min && (max === null || s.price <= max))
    }
    if (filters.minYear) list = list.filter(s => s.year && s.year >= Number(filters.minYear))
    if (filters.maxKm) list = list.filter(s => s.mileage != null && s.mileage <= Number(filters.maxKm))

    list.sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price
      if (sort === 'price_desc') return b.price - a.price
      if (sort === 'mileage_asc') return (a.mileage ?? 9999999) - (b.mileage ?? 9999999)
      return new Date(b.created_at) - new Date(a.created_at)
    })
    return list
  }, [sales, search, filters, sort])

  const activeFilterCount = [filters.fuel, filters.transmission, filters.priceRange, filters.minYear, filters.maxKm].filter(Boolean).length
  const avgPrice = sales.length ? Math.round(sales.reduce((s, c) => s + Number(c.price), 0) / sales.length) : 0
  const minPrice = sales.length ? Math.min(...sales.map(s => Number(s.price))) : 0

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-brand-500/10 rounded-xl">
              <Tag className="h-5 w-5 text-brand-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Satılık Araçlar</h1>
          </div>
          {!loading && sales.length > 0 && (
            <p className="text-zinc-500 text-sm mt-0.5 ml-0.5">
              <span className="text-zinc-300 font-medium">{sales.length}</span> aktif ilan
              {avgPrice > 0 && (
                <> · Ort. <span className="text-brand-400 font-medium">{avgPrice.toLocaleString('tr-TR')} ₺</span></>
              )}
              {minPrice > 0 && (
                <> · En düşük <span className="text-zinc-300 font-medium">{minPrice.toLocaleString('tr-TR')} ₺</span></>
              )}
            </p>
          )}
        </div>
        <Link to="/sales/new" className="btn-primary flex items-center gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">İlan Ver</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-zinc-900 rounded-xl border border-zinc-800 w-fit">
        {[{ v: 'all', l: 'Tüm İlanlar' }, { v: 'mine', l: 'İlanlarım' }].map(t => (
          <button key={t.v} onClick={() => setTab(t.v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.v ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Search + Sort + Filter toggle */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Marka, model, konum ara..."
            className="input-base pl-10 w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="input-base pr-8 appearance-none cursor-pointer min-w-[130px]"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
            showFilters || activeFilterCount > 0
              ? 'bg-brand-500/10 border-brand-500/40 text-brand-400'
              : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filtrele</span>
          {activeFilterCount > 0 && (
            <span className="bg-brand-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
          {/* Price range chips */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-2">Fiyat Aralığı</p>
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map(r => (
                <button key={r.label}
                  onClick={() => setFilter('priceRange', filters.priceRange?.label === r.label ? null : r)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    filters.priceRange?.label === r.label
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 font-medium'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {r.label} ₺
                </button>
              ))}
            </div>
          </div>

          {/* Row: Yakıt + Vites + MinYear + MaxKm */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Yakıt</label>
              <select value={filters.fuel} onChange={e => setFilter('fuel', e.target.value)} className="input-base w-full text-sm">
                <option value="">Tümü</option>
                {Object.entries(FUEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Vites</label>
              <select value={filters.transmission} onChange={e => setFilter('transmission', e.target.value)} className="input-base w-full text-sm">
                <option value="">Tümü</option>
                {Object.entries(TRANS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Min. Yıl</label>
              <input type="number" value={filters.minYear} onChange={e => setFilter('minYear', e.target.value)}
                className="input-base w-full text-sm" placeholder="ör. 2018" min="1990" max="2025" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Max. KM</label>
              <input type="number" value={filters.maxKm} onChange={e => setFilter('maxKm', e.target.value)}
                className="input-base w-full text-sm" placeholder="ör. 100000" min="0" />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters({ fuel: '', transmission: '', priceRange: null, minYear: '', maxKm: '' })}
              className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <X className="h-3 w-3" />Filtreleri Temizle
            </button>
          )}
        </div>
      )}

      {/* Results info */}
      {!loading && (search || activeFilterCount > 0) && (
        <p className="text-xs text-zinc-600 mb-3">
          {filtered.length} sonuç bulundu
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 max-w-sm mx-auto">
          <div className="inline-flex p-5 bg-zinc-900 rounded-full border border-zinc-800 mb-5">
            <Car className="h-10 w-10 text-zinc-700" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">
            {search || activeFilterCount > 0 ? 'Arama kriterlerine uygun ilan bulunamadı' : tab === 'mine' ? 'Henüz ilanın yok' : 'Henüz ilan yok'}
          </h3>
          <p className="text-zinc-500 text-sm mb-6">
            {tab === 'mine' ? 'Garajındaki aracını satmak için aşağıdaki butona tıkla.' : 'Topluluğa ilk satılık ilanını sen ekle!'}
          </p>
          {(search || activeFilterCount > 0) ? (
            <button onClick={() => { setSearch(''); setFilters({ fuel: '', transmission: '', priceRange: null, minYear: '', maxKm: '' }) }}
              className="btn-secondary mx-auto">
              Filtreleri Temizle
            </button>
          ) : (
            <Link to="/sales/new" className="btn-primary mx-auto flex items-center gap-2 w-fit">
              <Plus className="h-4 w-4" />İlan Ver
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(s => (
            <CarSaleCard key={s.id} sale={s} onFav={toggleFav} favIds={favIds} />
          ))}
        </div>
      )}
    </div>
  )
}
