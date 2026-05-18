import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlusCircle, Car, Trash2, Edit2, X, Camera,
  Gauge, Fuel, Check, Settings2, ZoomIn,
  ChevronLeft, ChevronRight, Images, Tag,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { uploadVehicleImage } from '../lib/avatar'
import { validateImageFile, sanitizeText } from '../lib/security'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { useMeta } from '../hooks/useMeta'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i)

export const FUEL_TYPES = [
  { value: 'benzin',   label: 'Benzin' },
  { value: 'dizel',    label: 'Dizel' },
  { value: 'lpg',      label: 'LPG' },
  { value: 'hybrid',   label: 'Hybrid' },
  { value: 'elektrik', label: 'Elektrik' },
]
export const FUEL_LABELS = Object.fromEntries(FUEL_TYPES.map(f => [f.value, f.label]))

const EMPTY_FORM = { brand: '', model: '', year: '', plate: '', mileage: '', color: '', fuel_type: '', notes: '' }

/* ── Photo lightbox ──────────────────────────────────────── */
function PhotoLightbox({ photos, initialIndex, onClose }) {
  const [idx, setIdx] = useState(initialIndex)
  const photo = photos[idx]

  function prev(e) { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length) }
  function next(e) { e.stopPropagation(); setIdx(i => (i + 1) % photos.length) }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + photos.length) % photos.length)
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % photos.length)
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photos.length])

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}>
      <button className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-zinc-300 hover:text-white transition-colors">
        <X className="h-5 w-5" />
      </button>
      <span className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-zinc-500">
        {idx + 1} / {photos.length}
      </span>
      {photos.length > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
      <img
        src={photo.image_url}
        alt=""
        className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl select-none"
        onClick={e => e.stopPropagation()}
      />
      {photo.caption && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white bg-black/60 px-3 py-1.5 rounded-full whitespace-nowrap">
          {photo.caption}
        </p>
      )}
    </div>
  )
}

/* ── Vehicle card ────────────────────────────────────────── */
export function VehicleCard({ vehicle, isOwn, onEdit, onDelete }) {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const photoRef  = useRef()
  const [zoomed, setZoomed]               = useState(false)
  const [photos, setPhotos]               = useState([])
  const [lightboxIdx, setLightboxIdx]     = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    supabase.from('vehicle_photos')
      .select('*').eq('vehicle_id', vehicle.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setPhotos(data || []))
  }, [vehicle.id])

  async function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Fotoğraf 5MB\'dan büyük olamaz'); return }
    setUploadingPhoto(true)
    try {
      const url = await uploadVehicleImage(user.id, file)
      const { data, error } = await supabase.from('vehicle_photos')
        .insert({ vehicle_id: vehicle.id, user_id: user.id, image_url: url })
        .select().single()
      if (error) throw error
      setPhotos(prev => [...prev, data])
      toast.success('Fotoğraf eklendi')
    } catch {
      toast.error('Yüklenemedi')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  async function handlePhotoDelete(photoId, e) {
    e.stopPropagation()
    const { error } = await supabase.from('vehicle_photos').delete().eq('id', photoId)
    if (error) { toast.error('Silinemedi'); return }
    setPhotos(prev => prev.filter(p => p.id !== photoId))
    setLightboxIdx(null)
  }

  return (
    <div className="card hover:border-zinc-700 transition-all overflow-hidden p-0">
      {/* Cover photo lightbox (single image zoom) */}
      {zoomed && vehicle.image_url && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setZoomed(false)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-zinc-300 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
          <img src={vehicle.image_url} alt={`${vehicle.brand} ${vehicle.model}`}
            className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Photo gallery lightbox */}
      {lightboxIdx !== null && (
        <PhotoLightbox photos={photos} initialIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      {/* Cover */}
      {vehicle.image_url ? (
        <div className="h-36 overflow-hidden relative group cursor-pointer" onClick={() => setZoomed(true)}>
          <img src={vehicle.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </div>
      ) : (
        <div className="h-28 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
          <Car className="h-12 w-12 text-zinc-700" />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-white">{vehicle.brand} {vehicle.model}</h3>
            {vehicle.year && <span className="text-sm text-zinc-500">{vehicle.year}</span>}
          </div>
          {isOwn && (
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => navigate(`/sales/new?vehicle_id=${vehicle.id}`)}
                title="Satışa Çıkar"
                className="p-1.5 rounded-lg text-zinc-600 hover:text-green-400 hover:bg-green-500/10 transition-colors">
                <Tag className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onEdit(vehicle)}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onDelete(vehicle.id)}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {vehicle.plate && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-zinc-200 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
              🇹🇷 {vehicle.plate}
            </span>
          )}
          {vehicle.mileage != null && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
              <Gauge className="h-3 w-3" />{Number(vehicle.mileage).toLocaleString('tr-TR')} km
            </span>
          )}
          {vehicle.fuel_type && (
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
              <Fuel className="h-3 w-3" />{FUEL_LABELS[vehicle.fuel_type] || vehicle.fuel_type}
            </span>
          )}
          {vehicle.color && (
            <span className="text-[11px] text-zinc-500">{vehicle.color}</span>
          )}
        </div>

        {vehicle.notes && (
          <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{vehicle.notes}</p>
        )}

        {/* Photo gallery strip */}
        {(photos.length > 0 || isOwn) && (
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-1 mb-2">
              <Images className="h-3 w-3 text-zinc-600" />
              <span className="text-[11px] text-zinc-600">
                {photos.length > 0 ? `${photos.length} fotoğraf` : 'Fotoğraf albümü'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {photos.map((photo, i) => (
                <div key={photo.id} className="relative shrink-0 group">
                  <button
                    onClick={() => setLightboxIdx(i)}
                    className="block w-14 h-14 rounded-lg overflow-hidden border border-zinc-700 hover:border-zinc-500 transition-colors">
                    <img src={photo.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                  {isOwn && (
                    <button
                      onClick={e => handlePhotoDelete(photo.id, e)}
                      className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              ))}
              {isOwn && (
                <>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <button
                    onClick={() => photoRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="shrink-0 w-14 h-14 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-40">
                    {uploadingPhoto ? <Spinner size="sm" /> : <PlusCircle className="h-4 w-4" />}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Vehicle modal (add / edit) ──────────────────────────── */
function VehicleModal({ vehicle, onClose, onSaved }) {
  const { user } = useAuth()
  const fileRef = useRef()
  const [form, setForm] = useState(vehicle ? {
    brand:     vehicle.brand || '',
    model:     vehicle.model || '',
    year:      vehicle.year?.toString() || '',
    plate:     vehicle.plate || '',
    mileage:   vehicle.mileage?.toString() || '',
    color:     vehicle.color || '',
    fuel_type: vehicle.fuel_type || '',
    notes:     vehicle.notes || '',
  } : EMPTY_FORM)
  const [imageFile, setImageFile]       = useState(null)
  const [imagePreview, setImagePreview] = useState(vehicle?.image_url || null)
  const [saving, setSaving]             = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleImage(e) {
    const file = e.target.files[0]; if (!file) return
    try { await validateImageFile(file, 5 * 1024 * 1024) }
    catch (err) { toast.error(err.message); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.brand.trim() || !form.model.trim()) { toast.error('Marka ve model zorunludur'); return }
    setSaving(true)
    try {
      let image_url = vehicle?.image_url || null
      if (imageFile) image_url = await uploadVehicleImage(user.id, imageFile)
      const payload = {
        brand:     sanitizeText(form.brand, 60),
        model:     sanitizeText(form.model, 60),
        year:      form.year ? parseInt(form.year) : null,
        plate:     form.plate.trim().toUpperCase() || null,
        mileage:   form.mileage ? parseInt(form.mileage) : null,
        color:     sanitizeText(form.color, 40) || null,
        fuel_type: form.fuel_type || null,
        notes:     sanitizeText(form.notes, 500) || null,
        image_url,
      }
      if (vehicle) {
        const { data, error } = await supabase.from('vehicles').update(payload).eq('id', vehicle.id).select().single()
        if (error) throw error
        onSaved(data, 'update')
      } else {
        const { data, error } = await supabase.from('vehicles').insert({ ...payload, user_id: user.id }).select().single()
        if (error) throw error
        onSaved(data, 'insert')
      }
      toast.success(vehicle ? 'Araç güncellendi!' : 'Araç garajına eklendi!')
      onClose()
    } catch (e) { toast.error(e.message || 'Kaydedilemedi') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-zinc-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-zinc-800 overflow-y-auto max-h-[92vh]"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <h3 className="font-semibold text-white">{vehicle ? 'Aracı Düzenle' : 'Yeni Araç Ekle'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 pb-8">
          {/* Photo */}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
              <img src={imagePreview} alt="" className="w-full max-h-64 object-contain" />
              <div className="absolute top-2 right-2 flex gap-1">
                <button onClick={() => fileRef.current?.click()}
                  className="bg-black/70 rounded-lg px-2.5 py-1.5 text-xs text-white hover:bg-black/90 flex items-center gap-1">
                  <Camera className="h-3 w-3" /> Değiştir
                </button>
                <button onClick={() => { setImageFile(null); setImagePreview(null) }}
                  className="bg-black/70 rounded-full p-1.5 text-white hover:bg-black/90">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full h-32 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-600 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-400 transition-colors">
              <Camera className="h-8 w-8" />
              <span className="text-sm">Kapak fotoğrafı ekle</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Marka <span className="text-red-400">*</span></label>
              <input value={form.brand} onChange={e => set('brand', e.target.value)} className="input-base" placeholder="Toyota, BMW..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Model <span className="text-red-400">*</span></label>
              <input value={form.model} onChange={e => set('model', e.target.value)} className="input-base" placeholder="Corolla, 320i..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Yıl</label>
              <select value={form.year} onChange={e => set('year', e.target.value)} className="input-base">
                <option value="">Yıl seç...</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Yakıt</label>
              <select value={form.fuel_type} onChange={e => set('fuel_type', e.target.value)} className="input-base">
                <option value="">Yakıt türü...</option>
                {FUEL_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Plaka</label>
              <input value={form.plate} onChange={e => set('plate', e.target.value.toUpperCase())}
                className="input-base font-mono uppercase tracking-widest" placeholder="34 ABC 123" maxLength={10} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Renk</label>
              <input value={form.color} onChange={e => set('color', e.target.value)}
                className="input-base" placeholder="Beyaz, Siyah..." maxLength={30} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Kilometre</label>
            <input type="number" value={form.mileage} onChange={e => set('mileage', e.target.value)}
              className="input-base" placeholder="ör. 45000" min="0" max="9999999" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Notlar <span className="text-zinc-600 font-normal">(isteğe bağlı)</span>
            </label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} maxLength={500} className="input-base resize-none text-sm"
              placeholder="Araçla ilgili notlar, servis bilgileri..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">İptal</button>
            <button onClick={handleSave} disabled={saving || !form.brand.trim() || !form.model.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <Spinner size="sm" /> : <><Check className="h-4 w-4" />{vehicle ? 'Güncelle' : 'Ekle'}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────── */
export default function Garage() {
  useMeta('Garajım')
  const { user } = useAuth()
  const [vehicles, setVehicles]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)

  useEffect(() => { fetchVehicles() }, [])

  async function fetchVehicles() {
    const { data } = await supabase.from('vehicles').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setVehicles(data || [])
    setLoading(false)
  }

  function openAdd()    { setEditingVehicle(null); setShowModal(true) }
  function openEdit(v)  { setEditingVehicle(v);    setShowModal(true) }
  function closeModal() { setShowModal(false);      setEditingVehicle(null) }

  function handleSaved(vehicle, mode) {
    if (mode === 'insert') setVehicles(prev => [vehicle, ...prev])
    else setVehicles(prev => prev.map(v => v.id === vehicle.id ? vehicle : v))
  }

  async function handleDelete(id) {
    if (!confirm('Bu aracı garajdan silmek istediğine emin misin?')) return
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (!error) { setVehicles(prev => prev.filter(v => v.id !== id)); toast.success('Araç silindi') }
    else toast.error('Silinemedi')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Car className="h-5 w-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white">Garajım</h1>
          </div>
          <p className="text-zinc-500 text-sm">Araçlarını kaydet, fotoğraf albümü oluştur</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Araç Ekle</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : vehicles.length === 0 ? (
        <div className="card text-center py-16">
          <Car className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">Garajın boş</h3>
          <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto">
            Araçlarını ekleyerek marka, model, kilometre bilgilerini ve fotoğraf albümünü kaydet
          </p>
          <button onClick={openAdd} className="btn-primary mx-auto flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> İlk Aracı Ekle
          </button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map(v => (
              <VehicleCard key={v.id} vehicle={v} isOwn={true} onEdit={openEdit} onDelete={handleDelete} />
            ))}
            <button onClick={openAdd}
              className="card border-dashed flex flex-col items-center justify-center gap-3 py-10 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 transition-colors cursor-pointer min-h-[160px]">
              <PlusCircle className="h-8 w-8" />
              <span className="text-sm font-medium">Araç Ekle</span>
            </button>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-800">
              <div className="flex items-start gap-3">
                <Settings2 className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-zinc-300">Servis İlanı Ver</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Aracın için servis ihtiyacın mı var?{' '}
                    <Link to="/listings/new" className="text-brand-400 hover:text-brand-300 transition-colors">
                      İlan oluştur
                    </Link>{' '}
                    ve ustalardan teklif al.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-800">
              <div className="flex items-start gap-3">
                <Tag className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-zinc-300">Aracını Sat</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Aracını satmak mı istiyorsun?{' '}
                    <Link to="/sales" className="text-brand-400 hover:text-brand-300 transition-colors">
                      Satılık ilanlarına
                    </Link>{' '}
                    göz at veya{' '}
                    <Link to="/sales/new" className="text-brand-400 hover:text-brand-300 transition-colors">
                      ilan ver.
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <VehicleModal vehicle={editingVehicle} onClose={closeModal} onSaved={handleSaved} />
      )}
    </div>
  )
}
