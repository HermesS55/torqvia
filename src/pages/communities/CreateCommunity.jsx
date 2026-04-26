import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hash, AlertTriangle, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { sanitizeText } from '../../lib/security'

const CATEGORIES = ['Motor', 'Kaporta & Boya', 'Tuning', 'Klasik Araçlar', 'Elektrikli Araçlar', 'Off-Road', 'Genel']

export default function CreateCommunity() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm] = useState({
    name: '', description: '', categories: [], rules: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Topluluk adı zorunludur'); return }
    if (form.name.trim().length < 3) { setError('Topluluk adı en az 3 karakter olmalı'); return }
    setLoading(true)
    try {
      const cats = form.categories.length > 0 ? form.categories : ['Genel']
      const { data, error: err } = await supabase
        .from('communities')
        .insert({
          name:        sanitizeText(form.name, 80),
          description: sanitizeText(form.description, 500),
          category:    cats[0],
          categories:  cats,
          rules:       sanitizeText(form.rules, 1000),
          created_by:  user.id,
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
