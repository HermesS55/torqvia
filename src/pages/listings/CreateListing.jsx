import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Car, Gauge, Fuel, Settings2, MapPin, Wallet,
  AlertTriangle, Wrench, Camera, X, ChevronRight, Phone,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { uploadListingImage } from '../../lib/avatar'
import { useAuth } from '../../contexts/AuthContext'
import { useT } from '../../contexts/LangContext'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { validateImageFile } from '../../lib/security'

const SERVICE_OPTIONS = [
  'Motor', 'Kaporta', 'Boya', 'Elektrik', 'Lastik',
  'Süspansiyon', 'Fren', 'Tuning', 'Detailing', 'Egzoz',
  'Klima', 'Cam', 'Döşeme', 'Yakıt Sistemi', 'Periyodik Bakım',
  'PPF (Boya Koruma Filmi)', 'Seramik Kaplama', 'Cam Filmi',
  'Rot & Balans', 'Diferansiyel', 'Şanzıman', 'Turbo',
  'Far Yenileme', 'Krom & Vinil', 'Deri Döşeme', 'Ses Sistemi',
  'Güvenlik Sistemi', 'LPG Montajı',
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i)

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-zinc-800">
      <div className="p-1.5 bg-brand-500/10 rounded-lg">
        <Icon className="h-4 w-4 text-brand-400" />
      </div>
      <h2 className="font-semibold text-white text-sm">{title}</h2>
    </div>
  )
}

export default function CreateListing() {
  const t = useT()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [form, setForm] = useState({
    brand: '', model: '', year: '', mileage: '',
    fuel_type: '', transmission: '',
    location: '', budget: '', urgency: 'normal',
    service_types: [], description: '', show_phone: false,
  })
  const [photos, setPhotos] = useState([]) // { file, preview }[]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  function toggleService(s) {
    setForm(f => ({
      ...f,
      service_types: f.service_types.includes(s)
        ? f.service_types.filter(x => x !== s)
        : [...f.service_types, s],
    }))
  }

  async function handlePhotos(e) {
    const files = Array.from(e.target.files || [])
    if (photos.length + files.length > 5) { toast.error(t('cl.maxPhotos')); return }
    const valid = []
    for (const f of files) {
      try {
        await validateImageFile(f, 5 * 1024 * 1024)
        valid.push(f)
      } catch (err) {
        toast.error(err.message)
      }
    }
    setPhotos(prev => [
      ...prev,
      ...valid.map(f => ({ file: f, preview: URL.createObjectURL(f) })),
    ])
    e.target.value = ''
  }

  function removePhoto(idx) {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.brand.trim() || !form.model.trim()) { setError(t('cl.requiredFields')); return }
    setLoading(true)
    try {
      // Upload images
      let cover_image = null
      const extra_images = []
      for (let i = 0; i < photos.length; i++) {
        const url = await uploadListingImage(user.id, photos[i].file)
        if (i === 0) cover_image = url
        else extra_images.push(url)
      }

      const payload = {
        user_id: user.id,
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: form.year ? Number(form.year) : null,
        mileage: form.mileage ? Number(form.mileage) : null,
        fuel_type: form.fuel_type || null,
        transmission: form.transmission || null,
        location: form.location.trim() || null,
        budget: form.budget ? Number(String(form.budget).replace(/\./g, '').replace(/,/g, '')) : null,
        urgency: form.urgency,
        service_types: form.service_types,
        description: form.description.trim() || null,
        show_phone: form.show_phone,
        cover_image,
        extra_images,
        status: 'open',
      }

      const { data, error: err } = await supabase.from('listings').insert(payload).select().single()
      if (err) throw err
      toast.success(t('cl.success'))
      navigate(`/listings/${data.id}`)
    } catch (err) {
      console.error('CreateListing error:', err)
      setError(err.message || t('cl.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">{t('cl.title')}</h1>
        <p className="text-zinc-500 text-sm mt-0.5">{t('cl.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── 1. Araç Bilgileri ── */}
        <div className="card p-5">
          <SectionHeader icon={Car} title={t('cl.section.vehicle')} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                {t('cl.brand')} <span className="text-red-400">*</span>
              </label>
              <input
                value={form.brand}
                onChange={e => set('brand', e.target.value)}
                placeholder={t('cl.brandPlaceholder')}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                {t('cl.model')} <span className="text-red-400">*</span>
              </label>
              <input
                value={form.model}
                onChange={e => set('model', e.target.value)}
                placeholder={t('cl.modelPlaceholder')}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('cl.year')}</label>
              <select value={form.year} onChange={e => set('year', e.target.value)} className="input-base">
                <option value="">{t('common.select')}</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('cl.mileage')}</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={form.mileage}
                  onChange={e => set('mileage', e.target.value)}
                  placeholder={t('cl.mileagePlaceholder')}
                  className="input-base pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">km</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Teknik Özellikler ── */}
        <div className="card p-5">
          <SectionHeader icon={Settings2} title={t('cl.section.technical')} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('cl.fuel')}</label>
              <select value={form.fuel_type} onChange={e => set('fuel_type', e.target.value)} className="input-base">
                <option value="">{t('common.select')}</option>
                {['benzin', 'dizel', 'lpg', 'hybrid', 'elektrik'].map(f => (
                  <option key={f} value={f}>{t(`cl.fuel${f.charAt(0).toUpperCase() + f.slice(1)}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('cl.transmission')}</label>
              <select value={form.transmission} onChange={e => set('transmission', e.target.value)} className="input-base">
                <option value="">{t('common.select')}</option>
                <option value="manuel">{t('cl.transmissionManuel')}</option>
                <option value="otomatik">{t('cl.transmissionAuto')}</option>
                <option value="yari_otomatik">{t('cl.transmissionSemi')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 3. İstenen Hizmet ── */}
        <div className="card p-5">
          <SectionHeader icon={Wrench} title={t('cl.section.service')} />
          <p className="text-xs text-zinc-600 mb-3">{t('cl.serviceTypesDesc')}</p>
          <div className="flex flex-wrap gap-2">
            {SERVICE_OPTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleService(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  form.service_types.includes(s)
                    ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 font-medium'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. Detaylar ── */}
        <div className="card p-5">
          <SectionHeader icon={MapPin} title={t('cl.section.details')} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('cl.location')}</label>
              <input
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder={t('cl.locationPlaceholder')}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('cl.budget')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">₺</span>
                <input
                  type="number"
                  min="0"
                  value={form.budget}
                  onChange={e => set('budget', e.target.value)}
                  placeholder={t('cl.budgetPlaceholder')}
                  className="input-base pl-7"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-zinc-400 mb-2">{t('cl.urgency')}</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'normal', label: t('cl.urgencyNormal'), icon: '🟢' },
                { value: 'acil', label: t('cl.urgencyUrgent'), icon: '🔴' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('urgency', opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.urgency === opt.value
                      ? opt.value === 'acil'
                        ? 'border-red-500/50 bg-red-500/10 text-red-300'
                        : 'border-brand-500/50 bg-brand-500/10 text-brand-300'
                      : 'border-zinc-700 bg-zinc-800/50 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.icon} {opt.value === 'normal' ? t('cl.urgencyNormal') : 'Acil'}</div>
                  {opt.value === 'acil' && <div className="text-xs opacity-70 mt-0.5">En kısa sürede</div>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── 5. Açıklama ── */}
        <div className="card p-5">
          <SectionHeader icon={ChevronRight} title={t('cl.section.description')} />
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder={t('cl.descriptionPlaceholder')}
            rows={5}
            maxLength={2000}
            className="input-base resize-none"
          />
          <p className="text-xs text-zinc-700 mt-1 text-right">{form.description.length}/2000</p>
        </div>

        {/* ── 5.5 Telefon Numarası ── */}
        <div className="card p-5">
          <SectionHeader icon={Phone} title="İletişim Tercihi" />
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Phone className="h-4 w-4 text-zinc-400" />
                Telefon numaramı göster
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">
                {form.show_phone
                  ? 'Ustalar ilanınızda telefon numaranızı görebilir'
                  : 'Telefon numaranız gizli — ustalar mesaj yoluyla iletişim kurar'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => set('show_phone', !form.show_phone)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${form.show_phone ? 'bg-brand-500' : 'bg-zinc-700'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${form.show_phone ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* ── 6. Fotoğraflar ── */}
        <div className="card p-5">
          <SectionHeader icon={Camera} title={t('cl.section.photos')} />
          <p className="text-xs text-zinc-600 mb-3">{t('cl.photosDesc')}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotos}
          />
          <div className="flex flex-wrap gap-3">
            {photos.map((p, i) => (
              <div key={i} className="relative group">
                <img
                  src={p.preview}
                  className={`h-24 w-24 object-cover rounded-xl border ${i === 0 ? 'border-brand-500/50' : 'border-zinc-700'}`}
                  alt=""
                />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 bg-brand-500/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                    KAPAK
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-24 w-24 rounded-xl border-2 border-dashed border-zinc-700 hover:border-brand-500/50 text-zinc-600 hover:text-brand-400 transition-colors flex flex-col items-center justify-center gap-1"
              >
                <Camera className="h-5 w-5" />
                <span className="text-[10px]">{t('cl.addPhoto')}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
            {t('cl.cancel')}
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" /> : t('cl.publish')}
          </button>
        </div>
      </form>
    </div>
  )
}
