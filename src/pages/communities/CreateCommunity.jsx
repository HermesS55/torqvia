import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hash, AlertTriangle, ArrowLeft, Camera, Image as ImageIcon, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { sanitizeText } from '../../lib/security'
import { uploadPostImage } from '../../lib/avatar'

const CATEGORIES = ['Motor', 'Kaporta & Boya', 'Tuning', 'Klasik Araçlar', 'Elektrikli Araçlar', 'Off-Road', 'Genel']

export default function CreateCommunity() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm] = useState({
    name: '', description: '', categories: [], rules: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Avatar / cover
  const [avatarFile, setAvatarFile]     = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [coverFile, setCoverFile]       = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const avatarRef = useRef()
  const coverRef  = useRef()

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); setError('') }

  function toggleCategory(cat) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }))
    setError('')
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Fotoğraf en fazla 5 MB olabilir'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function handleCoverChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Fotoğraf en fazla 5 MB olabilir'); return }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Topluluk adı zorunludur'); return }
    if (form.name.trim().length < 3) { setError('Topluluk adı en az 3 karakter olmalı'); return }
    setLoading(true)
    try {
      const cats = form.categories.length > 0 ? form.categories : ['Genel']
      let avatar_url = null
      let cover_url  = null
      if (avatarFile) avatar_url = await uploadPostImage(user.id, avatarFile)
      if (coverFile)  cover_url  = await uploadPostImage(user.id, coverFile)

      const { data, error: err } = await supabase
        .from('communities')
        .insert({
          name:        sanitizeText(form.name, 80),
          description: sanitizeText(form.description, 500),
          category:    cats[0],
          rules:       sanitizeText(form.rules, 1000),
          created_by:  user.id,
          ...(avatar_url ? { avatar_url } : {}),
          ...(cover_url  ? { cover_url }  : {}),
        })
        .select().single()
      if (err) throw err

      await supabase.from('community_members').insert({
        community_id: data.id, user_id: user.id, role: 'admin',
      })

      toast.success('Topluluk oluşturuldu!')
      navigate(`/communities/${data.id}`)
    } catch (err) {
      setError(err.message || 'Topluluk oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => navigate('/communities')} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Topluluklara Dön
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Hash className="h-5 w-5 text-brand-400" />
          Yeni Topluluk Kur
        </h1>
        <p className="text-zinc-500 text-sm mt-0.5">Kendi topluluğunu oluştur, insanları davet et</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Cover + Avatar */}
        <div className="card p-0 overflow-hidden">
          {/* Cover */}
          <div className="relative h-32 bg-zinc-800 group cursor-pointer" onClick={() => coverRef.current?.click()}>
            {coverPreview
              ? <img src={coverPreview} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-zinc-600 hover:text-zinc-400 transition-colors">
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-xs">Kapak fotoğrafı ekle</span>
                </div>
            }
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-6 w-6 text-white" />
            </div>
            {coverPreview && (
              <button type="button"
                onClick={e => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null) }}
                className="absolute top-2 right-2 bg-black/70 rounded-full p-1 z-10">
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            )}
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>

          {/* Avatar */}
          <div className="px-5 pb-5 pt-0 flex items-end gap-4" style={{ marginTop: -32 }}>
            <div className="relative shrink-0 cursor-pointer" onClick={() => avatarRef.current?.click()}>
              <div className="h-16 w-16 rounded-xl border-2 border-zinc-900 overflow-hidden bg-brand-500/15 flex items-center justify-center">
                {avatarPreview
                  ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  : <Hash className="h-7 w-7 text-brand-400" />
                }
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-4 w-4 text-white" />
              </div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <p className="text-xs text-zinc-500 pb-1">Topluluk ikonu ve kapak fotoğrafını ayarla</p>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Topluluk Adı <span className="text-red-400">*</span>
            </label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Örn: İstanbul Tuning Kulübü"
              maxLength={80}
              className="input-base"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Açıklama</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Topluluğun amacını ve kimler için olduğunu anlat..."
              rows={3}
              maxLength={500}
              className="input-base resize-none"
            />
            <p className="text-xs text-zinc-700 mt-1 text-right">{form.description.length}/500</p>
          </div>

          {/* Categories - multi-select */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Kategoriler
              <span className="text-zinc-600 font-normal ml-1">(birden fazla seçebilirsin)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    form.categories.includes(cat)
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 font-medium'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {form.categories.length === 0 && (
              <p className="text-xs text-zinc-700 mt-1.5">Seçilmezse "Genel" olarak kaydedilir</p>
            )}
          </div>

          {/* Rules */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Kurallar <span className="text-zinc-600">(isteğe bağlı)</span></label>
            <textarea
              value={form.rules}
              onChange={e => set('rules', e.target.value)}
              placeholder="Topluluk kurallarını yaz..."
              rows={4}
              maxLength={1000}
              className="input-base resize-none"
            />
            <p className="text-xs text-zinc-700 mt-1 text-right">{form.rules.length}/1000</p>
          </div>

        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/communities')} className="btn-secondary flex-1">
            İptal
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" /> : <Hash className="h-4 w-4" />}
            Topluluğu Kur
          </button>
        </div>
      </form>
    </div>
  )
}
