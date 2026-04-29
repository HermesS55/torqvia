import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Tag, Car, Settings2, MapPin, Camera, X, Phone,
  FileText, AlertTriangle, CheckCircle2, Upload, Shield,
  ArrowLeftRight, Users, Gauge,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { uploadVehicleImage } from '../../lib/avatar'
import { useAuth } from '../../contexts/AuthContext'
import Spinner from '../../components/ui/Spinner'
import CarDamageReport, { DEFAULT_DAMAGE_REPORT } from '../../components/sales/CarDamageReport'
import { CAR_BRANDS, SORTED_BRANDS, TURKISH_CITIES } from '../../lib/carData'
import toast from 'react-hot-toast'
import { validateImageFile } from '../../lib/security'
import { useMeta } from '../../hooks/useMeta'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i)

const FUEL_TYPES = [
  { value: 'benzin',   label: 'Benzin' },
  { value: 'dizel',    label: 'Dizel' },
  { value: 'lpg',      label: 'LPG' },
  { value: 'hybrid',   label: 'Hybrid' },
  { value: 'elektrik', label: 'Elektrik' },
]

const ENGINE_CC = ['1000','1200','1400','1500','1600','1800','2000','2500','3000','3500','4000+']
const DRIVE_TYPES = [
  { value: 'fwd', label: 'Önden Çekiş (FWD)' },
  { value: 'rwd', label: 'Arkadan Çekiş (RWD)' },
  { value: 'awd', label: 'Tam Zamanlı 4x4 (AWD)' },
  { value: '4wd', label: 'Part-Time 4x4 (4WD)' },
]

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-zinc-800">
        <div className="p-2 bg-brand-500/10 rounded-xl">
          <Icon className="h-4 w-4 text-brand-400" />
        </div>
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, required, children, half }) {
  return (
    <div className={half ? '' : ''}>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function CreateCarSale() {
  useMeta('Satılık İlan Ver')
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileRef = useRef()
  const vehicleId = searchParams.get('vehicle_id')

  const [form, setForm] = useState({
    brand: '', model: '', year: '', mileage: '',
    fuel_type: '', transmission: '', color: '',
    engine_cc: '', horse_power: '', drive_type: '',
    damage_record: 'yok', exchange: false, owner_count: '',
    price: '', description: '', city: '', district: '',
    show_phone: false,
  })
  const [damageReport, setDamageReport] = useState({ ...DEFAULT_DAMAGE_REPORT })
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [prefilling, setPrefilling] = useState(!!vehicleId)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  const availableModels = form.brand ? (CAR_BRANDS[form.brand] || []) : []

  useEffect(() => {
    if (!vehicleId) return
    supabase.from('vehicles').select('*').eq('id', vehicleId).eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setForm(f => ({
            ...f,
            brand: data.brand || '',
            model: data.model || '',
            year: data.year?.toString() || '',
            mileage: data.mileage?.toString() || '',
            fuel_type: data.fuel_type || '',
            color: data.color || '',
          }))
          if (data.image_url) {
            setPhotos([{ preview: data.image_url, existing: true, url: data.image_url }])
          }
        }
        setPrefilling(false)
      })
  }, [vehicleId])

  function set(field, value) {
    setForm(f => {
      const next = { ...f, [field]: value }
      if (field === 'brand') next.model = ''
      return next
    })
    setError('')
  }

  async function handlePhotos(e) {
    const files = Array.from(e.target.files || [])
    if (photos.length + files.length > 15) { toast.error('En fazla 15 fotoğraf ekleyebilirsin'); return }
    const valid = []
    for (const f of files) {
      try { await validateImageFile(f, 15 * 1024 * 1024); valid.push(f) }
      catch (err) { toast.error(err.message) }
    }
    setPhotos(prev => [...prev, ...valid.map(f => ({ file: f, preview: URL.createObjectURL(f) }))])
    e.target.value = ''
  }

  function moveFirst(idx) {
    setPhotos(prev => {
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.unshift(item)
      return next
    })
  }

  function removePhoto(idx) { setPhotos(prev => prev.filter((_, i) => i !== idx)) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.brand.trim() || !form.model.trim()) { setError('Marka ve model zorunludur'); return }
    if (!form.price || Number(form.price) <= 0) { setError('Geçerli bir fiyat giriniz'); return }
    setLoading(true)
    setUploadProgress(0)
    try {
      let cover_image = null
      const extra_images = []
      const total = photos.length

      for (let i = 0; i < total; i++) {
        const p = photos[i]
        const url = p.existing ? p.url : await uploadVehicleImage(user.id, p.file)
        if (i === 0) cover_image = url
        else extra_images.push(url)
        setUploadProgress(Math.round(((i + 1) / total) * 80))
      }

      const { data, error: err } = await supabase.from('car_sales').insert({
        user_id:       user.id,
        vehicle_id:    vehicleId || null,
        brand:         form.brand.trim(),
        model:         form.model.trim(),
        year:          form.year ? Number(form.year) : null,
        mileage:       form.mileage ? Number(form.mileage) : null,
        fuel_type:     form.fuel_type || null,
        transmission:  form.transmission || null,
        color:         form.color.trim() || null,
        engine_cc:     form.engine_cc ? Number(form.engine_cc.replace('+','')) : null,
        horse_power:   form.horse_power ? Number(form.horse_power) : null,
        drive_type:    form.drive_type || null,
        damage_record: form.damage_record,
        exchange:      form.exchange,
        owner_count:   form.owner_count ? Number(form.owner_count) : null,
        price:         Number(form.price),
        description:   form.description.trim() || null,
        city:          form.city || null,
        district:      form.district.trim() || null,
        show_phone:    form.show_phone,
        cover_image,
        extra_images,
        damage_report: damageReport,
      }).select().single()

      if (err) throw err
      setUploadProgress(100)
      toast.success('İlan başarıyla yayınlandı!')
      navigate(`/sales/${data.id}`)
    } catch (err) {
      console.error(err)
      setError(err.message || 'İlan oluşturulamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  if (prefilling) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-brand-500/10 rounded-xl">
            <Tag className="h-6 w-6 text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Satılık İlan Ver</h1>
            <p className="text-zinc-500 text-sm">Aracınızı topluluğa satışa çıkarın</p>
          </div>
        </div>
        {vehicleId && (
          <div className="mt-3 flex items-center gap-2 text-xs text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-2 rounded-lg">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            Garajınızdaki araç bilgileri otomatik dolduruldu. Kontrol edip düzenleyebilirsiniz.
          </div>
        )}
      </div>

      {error && (
        <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Fotoğraflar */}
        <Section icon={Camera} title="Fotoğraflar">
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
          {photos.length === 0 ? (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full h-48 rounded-xl border-2 border-dashed border-zinc-700 hover:border-brand-500/50 flex flex-col items-center justify-center gap-3 text-zinc-500 hover:text-brand-400 transition-all group">
              <div className="p-4 bg-zinc-800 group-hover:bg-brand-500/10 rounded-full transition-colors">
                <Upload className="h-7 w-7" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Fotoğraf Ekle</p>
                <p className="text-xs text-zinc-600 mt-0.5">En fazla 15 fotoğraf · 4K kalite · JPG, PNG, WebP</p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative h-56 rounded-xl overflow-hidden border border-zinc-700 group">
                <img src={photos[0].preview} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-3 left-3 bg-brand-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">KAPAK FOTOĞRAFI</span>
                <button type="button" onClick={() => removePhoto(0)}
                  className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {photos.slice(1).map((p, i) => (
                  <div key={i} className="relative shrink-0 group">
                    <button type="button" onClick={() => moveFirst(i + 1)}
                      className="block h-20 w-20 rounded-lg overflow-hidden border border-zinc-700 hover:border-brand-500/50 transition-colors">
                      <img src={p.preview} alt="" className="w-full h-full object-cover" />
                    </button>
                    <button type="button" onClick={() => removePhoto(i + 1)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                {photos.length < 15 && (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="shrink-0 h-20 w-20 rounded-lg border-2 border-dashed border-zinc-700 hover:border-brand-500/50 flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-brand-400 transition-colors">
                    <Camera className="h-4 w-4" /><span className="text-[9px]">+Ekle</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-600">{photos.length}/15 fotoğraf · Küçük fotoğrafa tıklayarak kapak yapabilirsiniz</p>
            </div>
          )}
        </Section>

        {/* Araç Bilgileri */}
        <Section icon={Car} title="Araç Bilgileri">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Marka" required>
              <select value={form.brand} onChange={e => set('brand', e.target.value)} className="input-base w-full">
                <option value="">Marka seç</option>
                {SORTED_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Model" required>
              {availableModels.length > 0 ? (
                <select value={form.model} onChange={e => set('model', e.target.value)} className="input-base w-full">
                  <option value="">Model seç</option>
                  {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <input value={form.model} onChange={e => set('model', e.target.value)}
                  className="input-base" placeholder="Model giriniz..." />
              )}
            </Field>
            <Field label="Yıl">
              <select value={form.year} onChange={e => set('year', e.target.value)} className="input-base w-full">
                <option value="">Seç</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            <Field label="Kilometre">
              <div className="relative">
                <input type="number" min="0" value={form.mileage} onChange={e => set('mileage', e.target.value)}
                  className="input-base pr-10" placeholder="ör. 45000" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">km</span>
              </div>
            </Field>
            <Field label="Renk">
              <input value={form.color} onChange={e => set('color', e.target.value)}
                className="input-base" placeholder="Beyaz, Siyah..." maxLength={30} />
            </Field>
            <Field label="Kaç El">
              <select value={form.owner_count} onChange={e => set('owner_count', e.target.value)} className="input-base w-full">
                <option value="">Seç</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}. El{n === 5 ? '+' : ''}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        {/* Teknik Özellikler */}
        <Section icon={Settings2} title="Teknik Özellikler">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Yakıt">
              <select value={form.fuel_type} onChange={e => set('fuel_type', e.target.value)} className="input-base w-full">
                <option value="">Seç</option>
                {FUEL_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </Field>
            <Field label="Vites">
              <select value={form.transmission} onChange={e => set('transmission', e.target.value)} className="input-base w-full">
                <option value="">Seç</option>
                <option value="manuel">Manuel</option>
                <option value="otomatik">Otomatik</option>
                <option value="yari_otomatik">Yarı Otomatik</option>
              </select>
            </Field>
            <Field label="Motor Hacmi">
              <select value={form.engine_cc} onChange={e => set('engine_cc', e.target.value)} className="input-base w-full">
                <option value="">Seç</option>
                {ENGINE_CC.map(cc => <option key={cc} value={cc}>{cc} cc</option>)}
              </select>
            </Field>
            <Field label="Beygir Gücü">
              <div className="relative">
                <input type="number" min="0" max="2000" value={form.horse_power}
                  onChange={e => set('horse_power', e.target.value)} className="input-base pr-10" placeholder="ör. 130" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">HP</span>
              </div>
            </Field>
            <Field label="Çekiş">
              <select value={form.drive_type} onChange={e => set('drive_type', e.target.value)} className="input-base w-full col-span-2">
                <option value="">Seç</option>
                {DRIVE_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        {/* Durum */}
        <Section icon={Shield} title="Araç Durumu">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Hasar Kaydı">
              <select value={form.damage_record} onChange={e => set('damage_record', e.target.value)} className="input-base w-full">
                <option value="yok">Yok</option>
                <option value="var">Var</option>
                <option value="bilinmiyor">Bilinmiyor</option>
              </select>
            </Field>
            <div className="flex flex-col justify-end">
              <div
                onClick={() => set('exchange', !form.exchange)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  form.exchange ? 'bg-brand-500/10 border-brand-500/40' : 'bg-zinc-800/50 border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className={`h-4 w-4 ${form.exchange ? 'text-brand-400' : 'text-zinc-500'}`} />
                  <span className={`text-sm font-medium ${form.exchange ? 'text-brand-400' : 'text-zinc-400'}`}>Takas</span>
                </div>
                <div className={`h-5 w-9 rounded-full transition-colors ${form.exchange ? 'bg-brand-500' : 'bg-zinc-700'}`}>
                  <div className={`h-5 w-5 bg-white rounded-full shadow transition-transform ${form.exchange ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Boya/Hasar Raporu */}
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-3">Boya / Hasar Raporu</p>
            <CarDamageReport report={damageReport} onChange={setDamageReport} />
          </div>
        </Section>

        {/* Fiyat & Konum */}
        <Section icon={MapPin} title="Fiyat & Konum">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Satış Fiyatı (₺)" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">₺</span>
                <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)}
                  className="input-base pl-8" placeholder="ör. 850000" />
              </div>
            </Field>
            <Field label="Şehir">
              <select value={form.city} onChange={e => set('city', e.target.value)} className="input-base w-full">
                <option value="">Seç</option>
                {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="İlçe">
              <input value={form.district} onChange={e => set('district', e.target.value)}
                className="input-base" placeholder="İlçe giriniz..." />
            </Field>
          </div>
        </Section>

        {/* Açıklama */}
        <Section icon={FileText} title="Açıklama">
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Araç hakkında detaylı bilgi verin. Bakım geçmişi, ekstralar, tramer durumu, değişen parçalar, neden satıyorsunuz..."
            rows={6} maxLength={3000} className="input-base resize-none w-full" />
          <div className="flex justify-between mt-1.5">
            <p className="text-xs text-zinc-600">Detaylı açıklama ilanınızın daha hızlı satılmasını sağlar</p>
            <p className="text-xs text-zinc-700">{form.description.length}/3000</p>
          </div>
        </Section>

        {/* İletişim */}
        <Section icon={Phone} title="İletişim Tercihi">
          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-zinc-200">Telefon numaramı göster</p>
              <p className="text-xs text-zinc-600 mt-0.5">
                {form.show_phone ? 'Profilinizdeki telefon alıcılara görünür' : 'Gizli — alıcılar mesaj ile ulaşır'}
              </p>
            </div>
            <button type="button" onClick={() => set('show_phone', !form.show_phone)}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${form.show_phone ? 'bg-brand-500' : 'bg-zinc-700'}`}>
              <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${form.show_phone ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </Section>

        {/* Upload progress */}
        {loading && uploadProgress > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-400">
                {uploadProgress < 80 ? 'Fotoğraflar yükleniyor...' : 'İlan oluşturuluyor...'}
              </p>
              <span className="text-xs text-brand-400 font-medium">{uploadProgress}%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1" disabled={loading}>İptal</button>
          <button type="submit" disabled={loading || !form.brand.trim() || !form.model.trim() || !form.price}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Spinner size="sm" /> : <><CheckCircle2 className="h-4 w-4" />İlanı Yayınla</>}
          </button>
        </div>
      </form>
    </div>
  )
}
