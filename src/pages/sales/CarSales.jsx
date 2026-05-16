import { useEffect, useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Tag, Plus, Search, Car, Gauge, Fuel, MapPin,
  X, SlidersHorizontal, ArrowUpDown,
  TrendingDown, TrendingUp, Clock, Heart, ArrowUp, ArrowDown,
  Eye, RefreshCw, ChevronDown,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Spinner from '../../components/ui/Spinner'
import UserAvatar from '../../components/ui/UserAvatar'
import { useMeta } from '../../hooks/useMeta'
import { CAR_BRANDS, SORTED_BRANDS, TURKISH_CITIES } from '../../lib/carData'

const FUEL_LABELS = { benzin: 'Benzin', dizel: 'Dizel', lpg: 'LPG', hybrid: 'Hybrid', elektrik: 'Elektrik' }
const TRANS_LABELS = { manuel: 'Manuel', otomatik: 'Otomatik', yari_otomatik: 'Yarı Oto.' }
const DRIVE_LABELS = { fwd: 'Önden Çekiş', rwd: 'Arkadan İtiş', awd: 'AWD / 4x4', '4wd': '4WD' }
const ENGINE_CC_OPTIONS = ['1.0', '1.2', '1.4', '1.5', '1.6', '1.8', '2.0', '2.4', '3.0', '3.5', '4.0+']

const PRICE_PRESETS = [
  { label: '0–250K',   min: 0,       max: 250000 },
  { label: '250–500K', min: 250000,  max: 500000 },
  { label: '500K–1M',  min: 500000,  max: 1000000 },
  { label: '1M–2M',    min: 1000000, max: 2000000 },
  { label: '2M+',      min: 2000000, max: null },
]

const KM_PRESETS = [
  { label: '0–50K',   min: 0,     max: 50000 },
  { label: '50–100K', min: 50000, max: 100000 },
  { label: '100–150K',min: 100000,max: 150000 },
  { label: '150K+',   min: 150000,max: null },
]

const SORT_OPTIONS = [
  { value: 'newest',       label: 'En Yeni' },
  { value: 'oldest',       label: 'En Eski' },
  { value: 'price_asc',    label: 'Fiyat (Düşükten Yükseğe)' },
  { value: 'price_desc',   label: 'Fiyat (Yüksekten Düşüğe)' },
  { value: 'mileage_asc',  label: 'En Az KM' },
  { value: 'mileage_desc', label: 'En Çok KM' },
  { value: 'views_desc',   label: 'En Çok Görüntülenen' },
]

const YEAR_NOW = new Date().getFullYear()
const YEAR_RANGE = Array.from({ length: YEAR_NOW - 1989 }, (_, i) => YEAR_NOW - i)

const EMPTY_FILTERS = {
  brand: '', model: '',
  minYear: '', maxYear: '',
  minPrice: '', maxPrice: '', pricePreset: null,
  minKm: '', maxKm: '', kmPreset: null,
  fuel: '', transmission: '', driveType: '',
  engineCc: '', ownerCount: '',
  damageRecord: '', exchange: '',
  city: '',
}

function chip(active, extra = '') {
  return `text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
    active
      ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 font-semibold'
      : `bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 ${extra}`
  }`
}

function SectionHead({ children }) {
  return <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{children}</p>
}

function CarSaleCard({ sale, onFav, favIds }) {
  const seller = sale.profiles
  const isFav = favIds.has(sale.id)

  return (
    <Link
      to={`/sales/${sale.id}`}
      className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 flex flex-col"
    >
      <div className="relative h-52 overflow-hidden bg-zinc-800 shrink-0">
        {sale.cover_image ? (
          <img src={sale.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <Car className="h-16 w-16 text-zinc-700" />
          </div>
        )}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onFav(sale.id) }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-sm transition-all ${
            isFav ? 'bg-red-500 text-white' : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${isFav ? 'fill-current' : ''}`} />
        </button>
        {sale.extra_images?.length > 0 && (
          <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>
            {sale.extra_images.length + 1}
          </span>
        )}
        {sale.damage_record === 'var' && (
          <span className="absolute bottom-2 right-2 bg-red-500/80 backdrop-blur-sm text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
            Hasar Kayıtlı
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-2xl font-black text-brand-400 leading-none mb-1">
          {Number(sale.price).toLocaleString('tr-TR')} <span className="text-base font-bold">₺</span>
        </p>
        <h3 className="font-semibold text-white text-base leading-tight group-hover:text-brand-300 transition-colors">
          {sale.brand} {sale.model}
          {sale.year && <span className="text-zinc-500 font-normal text-sm ml-1.5">{sale.year}</span>}
        </h3>

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
          {sale.engine_cc && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
              {sale.engine_cc}L
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          {(sale.city || sale.location) && (
            <span className="text-xs text-zinc-600 flex items-center gap-1">
              <MapPin className="h-3 w-3" />{sale.city || sale.location}
            </span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {sale.view_count > 0 && (
              <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                <Eye className="h-2.5 w-2.5" />{sale.view_count}
              </span>
            )}
            {sale.exchange && (
              <span className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                <RefreshCw className="h-2.5 w-2.5" />Takas
              </span>
            )}
            {seller && (
              <div className="flex items-center gap-1.5">
                <UserAvatar profile={seller} size="xs" />
                <span className="text-[11px] text-zinc-500 max-w-[80px] truncate">{seller.full_name || 'Kullanıcı'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function CarSales() {
  useMeta('Satılık Araçlar')
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [favIds, setFavIds] = useState(new Set())

  useEffect(() => { fetchSales(); fetchFavs() }, [tab])

  async function fetchFavs() {
    if (!user) return
    const { data } = await supabase.from('car_sale_favorites').select('sale_id').eq('user_id', user.id)
    if (data) setFavIds(new Set(data.map(r => r.sale_id)))
  }

  async function fetchSales() {
    setLoading(true)
    try {
      let q = supabase
        .from('car_sales')
        .select('*, profiles(id, full_name, avatar_url, plan)')
        .eq('status', 'active')

      if (tab === 'mine' && user) q = q.eq('user_id', user.id)

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

  function togglePreset(key, presetKey, preset) {
    const isActive = filters[presetKey]?.label === preset.label
    setFilters(f => ({
      ...f,
      [presetKey]: isActive ? null : preset,
      [key === 'price' ? 'minPrice' : 'minKm']: isActive ? '' : '',
      [key === 'price' ? 'maxPrice' : 'maxKm']: isActive ? '' : '',
    }))
  }

  const modelOptions = filters.brand ? (CAR_BRANDS[filters.brand] || []) : []

  const filtered = useMemo(() => {
    let list = [...sales]

    if (tab === 'favs') list = list.filter(s => favIds.has(s.id))

    const q = search.toLowerCase().trim()
    if (q) list = list.filter(s =>
      s.brand?.toLowerCase().includes(q) ||
      s.model?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.location?.toLowerCase().includes(q) ||
      String(s.year || '').includes(q)
    )

    if (filters.brand) list = list.filter(s => s.brand === filters.brand)
    if (filters.model) list = list.filter(s => s.model === filters.model)

    const minY = Number(filters.minYear)
    const maxY = Number(filters.maxYear)
    if (minY) list = list.filter(s => s.year && s.year >= minY)
    if (maxY) list = list.filter(s => s.year && s.year <= maxY)

    const effectiveMinPrice = filters.pricePreset ? filters.pricePreset.min : Number(filters.minPrice) || 0
    const effectiveMaxPrice = filters.pricePreset ? filters.pricePreset.max : Number(filters.maxPrice) || null
    if (effectiveMinPrice) list = list.filter(s => Number(s.price) >= effectiveMinPrice)
    if (effectiveMaxPrice) list = list.filter(s => Number(s.price) <= effectiveMaxPrice)

    const effectiveMinKm = filters.kmPreset ? filters.kmPreset.min : Number(filters.minKm) || 0
    const effectiveMaxKm = filters.kmPreset ? filters.kmPreset.max : Number(filters.maxKm) || null
    if (effectiveMinKm) list = list.filter(s => s.mileage != null && s.mileage >= effectiveMinKm)
    if (effectiveMaxKm) list = list.filter(s => s.mileage != null && s.mileage <= effectiveMaxKm)

    if (filters.fuel) list = list.filter(s => s.fuel_type === filters.fuel)
    if (filters.transmission) list = list.filter(s => s.transmission === filters.transmission)
    if (filters.driveType) list = list.filter(s => s.drive_type === filters.driveType)
    if (filters.engineCc) list = list.filter(s => s.engine_cc === filters.engineCc)
    if (filters.ownerCount) list = list.filter(s => String(s.owner_count) === filters.ownerCount)
    if (filters.damageRecord) list = list.filter(s => s.damage_record === filters.damageRecord)
    if (filters.exchange === 'var') list = list.filter(s => s.exchange === true)
    if (filters.exchange === 'yok') list = list.filter(s => !s.exchange)
    if (filters.city) list = list.filter(s => s.city === filters.city)

    list.sort((a, b) => {
      if (sort === 'price_asc')    return Number(a.price) - Number(b.price)
      if (sort === 'price_desc')   return Number(b.price) - Number(a.price)
      if (sort === 'mileage_asc')  return (a.mileage ?? 9999999) - (b.mileage ?? 9999999)
      if (sort === 'mileage_desc') return (b.mileage ?? 0) - (a.mileage ?? 0)
      if (sort === 'views_desc')   return (b.view_count ?? 0) - (a.view_count ?? 0)
      if (sort === 'oldest')       return new Date(a.created_at) - new Date(b.created_at)
      return new Date(b.created_at) - new Date(a.created_at)
    })
    return list
  }, [sales, search, filters, sort, tab, favIds])

  const activeFilterCount = [
    filters.brand, filters.model, filters.minYear, filters.maxYear,
    filters.pricePreset || filters.minPrice || filters.maxPrice,
    filters.kmPreset || filters.minKm || filters.maxKm,
    filters.fuel, filters.transmission, filters.driveType,
    filters.engineCc, filters.ownerCount, filters.damageRecord,
    filters.exchange, filters.city,
  ].filter(Boolean).length

  function clearFilters() { setFilters(EMPTY_FILTERS) }

  const totalActive = sales.length
  const avgPrice = totalActive ? Math.round(sales.reduce((s, c) => s + Number(c.price), 0) / totalActive) : 0

  const TABS = [
    { v: 'all',  l: 'Tüm İlanlar' },
    { v: 'favs', l: 'Favoriler' },
    { v: 'mine', l: 'İlanlarım' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* İlan tipi seçimi */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid #1e1e1e' }}>
        {[
          { to: '/listings', label: 'Servis İlanları' },
          { to: '/sales',    label: 'Satılık Araçlar' },
        ].map(item => (
          <Link key={item.to} to={item.to} style={{
            flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 9, fontSize: 13, fontWeight: 600,
            textDecoration: 'none', transition: 'all 0.15s',
            background: pathname === item.to ? '#ff6b00' : 'transparent',
            color: pathname === item.to ? '#fff' : '#555',
          }}>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-brand-500/10 rounded-xl">
              <Tag className="h-5 w-5 text-brand-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Satılık Araçlar</h1>
          </div>
          {!loading && totalActive > 0 && (
            <p className="text-zinc-500 text-sm mt-0.5 ml-0.5">
              <span className="text-zinc-300 font-medium">{totalActive}</span> aktif ilan
              {avgPrice > 0 && <> · Ort. <span className="text-brand-400 font-medium">{avgPrice.toLocaleString('tr-TR')} ₺</span></>}
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
        {TABS.map(t => (
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
            placeholder="Marka, model, şehir veya yıl ara..."
            className="input-base pl-10 w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="input-base pr-8 appearance-none cursor-pointer min-w-[150px]"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
        </div>

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
        <div className="mb-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-5">

          {/* Marka & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <SectionHead>Marka</SectionHead>
              <select
                value={filters.brand}
                onChange={e => setFilters(f => ({ ...f, brand: e.target.value, model: '' }))}
                className="input-base w-full text-sm"
              >
                <option value="">Tüm Markalar</option>
                {SORTED_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <SectionHead>Model</SectionHead>
              <select
                value={filters.model}
                onChange={e => setFilter('model', e.target.value)}
                className="input-base w-full text-sm"
                disabled={!filters.brand}
              >
                <option value="">Tüm Modeller</option>
                {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Yıl */}
          <div>
            <SectionHead>Yıl Aralığı</SectionHead>
            <div className="grid grid-cols-2 gap-3">
              <select value={filters.minYear} onChange={e => setFilter('minYear', e.target.value)} className="input-base w-full text-sm">
                <option value="">Min. Yıl</option>
                {YEAR_RANGE.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={filters.maxYear} onChange={e => setFilter('maxYear', e.target.value)} className="input-base w-full text-sm">
                <option value="">Max. Yıl</option>
                {YEAR_RANGE.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Fiyat */}
          <div>
            <SectionHead>Fiyat (₺)</SectionHead>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {PRICE_PRESETS.map(p => (
                <button key={p.label} onClick={() => togglePreset('price', 'pricePreset', p)}
                  className={chip(filters.pricePreset?.label === p.label)}>
                  {p.label} ₺
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number" value={filters.minPrice}
                onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value, pricePreset: null }))}
                className="input-base w-full text-sm" placeholder="Min ₺"
              />
              <input
                type="number" value={filters.maxPrice}
                onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value, pricePreset: null }))}
                className="input-base w-full text-sm" placeholder="Max ₺"
              />
            </div>
          </div>

          {/* KM */}
          <div>
            <SectionHead>Kilometre</SectionHead>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {KM_PRESETS.map(p => (
                <button key={p.label} onClick={() => togglePreset('km', 'kmPreset', p)}
                  className={chip(filters.kmPreset?.label === p.label)}>
                  {p.label} km
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number" value={filters.minKm}
                onChange={e => setFilters(f => ({ ...f, minKm: e.target.value, kmPreset: null }))}
                className="input-base w-full text-sm" placeholder="Min km"
              />
              <input
                type="number" value={filters.maxKm}
                onChange={e => setFilters(f => ({ ...f, maxKm: e.target.value, kmPreset: null }))}
                className="input-base w-full text-sm" placeholder="Max km"
              />
            </div>
          </div>

          {/* Yakıt + Vites */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <SectionHead>Yakıt Tipi</SectionHead>
              <div className="flex flex-wrap gap-2">
                {Object.entries(FUEL_LABELS).map(([v, l]) => (
                  <button key={v} onClick={() => setFilter('fuel', filters.fuel === v ? '' : v)}
                    className={chip(filters.fuel === v)}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <SectionHead>Vites</SectionHead>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TRANS_LABELS).map(([v, l]) => (
                  <button key={v} onClick={() => setFilter('transmission', filters.transmission === v ? '' : v)}
                    className={chip(filters.transmission === v)}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Çekiş + Motor Hacmi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <SectionHead>Çekiş Tipi</SectionHead>
              <div className="flex flex-wrap gap-2">
                {Object.entries(DRIVE_LABELS).map(([v, l]) => (
                  <button key={v} onClick={() => setFilter('driveType', filters.driveType === v ? '' : v)}
                    className={chip(filters.driveType === v)}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <SectionHead>Motor Hacmi</SectionHead>
              <div className="flex flex-wrap gap-2">
                {ENGINE_CC_OPTIONS.map(v => (
                  <button key={v} onClick={() => setFilter('engineCc', filters.engineCc === v ? '' : v)}
                    className={chip(filters.engineCc === v)}>{v}L</button>
                ))}
              </div>
            </div>
          </div>

          {/* Kaç El + Hasar Kaydı + Takas */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <SectionHead>Kaç El</SectionHead>
              <div className="flex flex-wrap gap-2">
                {['1', '2', '3', '4+'].map(v => (
                  <button key={v} onClick={() => setFilter('ownerCount', filters.ownerCount === v ? '' : v)}
                    className={chip(filters.ownerCount === v)}>{v}. El</button>
                ))}
              </div>
            </div>
            <div>
              <SectionHead>Hasar Kaydı</SectionHead>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilter('damageRecord', filters.damageRecord === 'yok' ? '' : 'yok')}
                  className={chip(filters.damageRecord === 'yok')}>Yok</button>
                <button onClick={() => setFilter('damageRecord', filters.damageRecord === 'var' ? '' : 'var')}
                  className={chip(filters.damageRecord === 'var', 'text-red-500 border-red-900')}>Var</button>
              </div>
            </div>
            <div>
              <SectionHead>Takas</SectionHead>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilter('exchange', filters.exchange === 'var' ? '' : 'var')}
                  className={chip(filters.exchange === 'var')}>Takas Olur</button>
                <button onClick={() => setFilter('exchange', filters.exchange === 'yok' ? '' : 'yok')}
                  className={chip(filters.exchange === 'yok')}>Takas Olmaz</button>
              </div>
            </div>
          </div>

          {/* Şehir */}
          <div>
            <SectionHead>Şehir</SectionHead>
            <select
              value={filters.city}
              onChange={e => setFilter('city', e.target.value)}
              className="input-base w-full sm:w-64 text-sm"
            >
              <option value="">Tüm Şehirler</option>
              {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Clear */}
          {activeFilterCount > 0 && (
            <div className="pt-1 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-600">{activeFilterCount} filtre aktif · {filtered.length} sonuç</span>
              <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                <X className="h-3 w-3" />Tümünü Temizle
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active filter pills */}
      {!showFilters && activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {filters.brand && (
            <span className="inline-flex items-center gap-1 text-xs bg-brand-500/15 border border-brand-500/30 text-brand-300 px-2.5 py-1 rounded-full">
              {filters.brand}
              <button onClick={() => setFilters(f => ({ ...f, brand: '', model: '' }))}><X className="h-3 w-3" /></button>
            </span>
          )}
          {filters.model && (
            <span className="inline-flex items-center gap-1 text-xs bg-brand-500/15 border border-brand-500/30 text-brand-300 px-2.5 py-1 rounded-full">
              {filters.model}
              <button onClick={() => setFilter('model', '')}><X className="h-3 w-3" /></button>
            </span>
          )}
          {(filters.minYear || filters.maxYear) && (
            <span className="inline-flex items-center gap-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-2.5 py-1 rounded-full">
              {filters.minYear || '?'} – {filters.maxYear || '?'}
              <button onClick={() => setFilters(f => ({ ...f, minYear: '', maxYear: '' }))}><X className="h-3 w-3" /></button>
            </span>
          )}
          {(filters.pricePreset || filters.minPrice || filters.maxPrice) && (
            <span className="inline-flex items-center gap-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-2.5 py-1 rounded-full">
              {filters.pricePreset ? `${filters.pricePreset.label} ₺` : `${filters.minPrice || 0} – ${filters.maxPrice || '∞'} ₺`}
              <button onClick={() => setFilters(f => ({ ...f, pricePreset: null, minPrice: '', maxPrice: '' }))}><X className="h-3 w-3" /></button>
            </span>
          )}
          {filters.fuel && (
            <span className="inline-flex items-center gap-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-2.5 py-1 rounded-full">
              {FUEL_LABELS[filters.fuel]}
              <button onClick={() => setFilter('fuel', '')}><X className="h-3 w-3" /></button>
            </span>
          )}
          {filters.transmission && (
            <span className="inline-flex items-center gap-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-2.5 py-1 rounded-full">
              {TRANS_LABELS[filters.transmission]}
              <button onClick={() => setFilter('transmission', '')}><X className="h-3 w-3" /></button>
            </span>
          )}
          {filters.city && (
            <span className="inline-flex items-center gap-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-2.5 py-1 rounded-full">
              <MapPin className="h-2.5 w-2.5" />{filters.city}
              <button onClick={() => setFilter('city', '')}><X className="h-3 w-3" /></button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-zinc-600 hover:text-red-400 px-2.5 py-1 rounded-full border border-zinc-800 hover:border-red-900 transition-colors">
            Temizle
          </button>
        </div>
      )}

      {!loading && (search || activeFilterCount > 0) && (
        <p className="text-xs text-zinc-600 mb-3">{filtered.length} sonuç bulundu</p>
      )}

      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 max-w-sm mx-auto">
          <div className="inline-flex p-5 bg-zinc-900 rounded-full border border-zinc-800 mb-5">
            <Car className="h-10 w-10 text-zinc-700" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">
            {search || activeFilterCount > 0
              ? 'Kriterlere uygun ilan bulunamadı'
              : tab === 'mine'
                ? 'Henüz ilanın yok'
                : tab === 'favs'
                  ? 'Favori ilanın yok'
                  : 'Henüz ilan yok'}
          </h3>
          <p className="text-zinc-500 text-sm mb-6">
            {tab === 'mine'
              ? 'Garajındaki aracını satmak için ilan ver.'
              : tab === 'favs'
                ? 'Beğendiğin ilanlara kalp at, burada görünsün.'
                : 'Topluluğa ilk satılık ilanını sen ekle!'}
          </p>
          {(search || activeFilterCount > 0) ? (
            <button onClick={() => { setSearch(''); clearFilters() }} className="btn-secondary mx-auto">
              Filtreleri Temizle
            </button>
          ) : tab !== 'favs' && (
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
