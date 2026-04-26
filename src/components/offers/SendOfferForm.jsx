import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Spinner from '../ui/Spinner'
import toast from 'react-hot-toast'
import { sanitizeText } from '../../lib/security'
import { Send, X, Wrench, Clock, MessageSquare, AlertTriangle } from 'lucide-react'

const SERVICE_DURATIONS = [
  { value: '1', label: '1 gün' },
  { value: '2-3', label: '2–3 gün' },
  { value: '4-7', label: '4–7 gün' },
  { value: '7+', label: '1 haftadan fazla' },
]

export default function SendOfferForm({ listingId, listingOwnerId, listingLabel, onSuccess, onCancel }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    price: '',
    duration: '',
    message: '',
    includes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const price = parseFloat(form.price)
    if (!price || price <= 0) { setError('Geçerli bir fiyat girin'); return }
    if (!form.message.trim()) { setError('Hizmet açıklaması zorunludur'); return }
    setLoading(true)
    try {
      const msgText = [
        form.message.trim(),
        form.includes.trim() ? `\nDahil olanlar: ${form.includes.trim()}` : '',
        form.duration ? `\nTahmini süre: ${SERVICE_DURATIONS.find(d => d.value === form.duration)?.label || form.duration}` : '',
      ].filter(Boolean).join('')

      const { data, error: err } = await supabase
        .from('offers')
        .insert({
          listing_id: listingId,
          sender_id: user.id,
          price,
          message: sanitizeText(msgText, 1000),
          status: 'pending',
        })
        .select('*, profiles(role, phone, full_name)')
        .single()
      if (err) throw err
      if (listingOwnerId) {
        supabase.from('notifications').insert({
          user_id: listingOwnerId,
          type: 'new_offer',
          from_user_id: user.id,
          listing_id: listingId,
          message: listingLabel ? `${listingLabel} — ₺${price.toLocaleString('tr-TR')}` : `₺${price.toLocaleString('tr-TR')}`,
        }).then(() => {})
      }
      toast.success('Teklifiniz gönderildi!')
      onSuccess(data)
    } catch (err) {
      setError(err.message || 'Teklif gönderilemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card border-brand-500/30 bg-zinc-900/60">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-500/10 rounded-xl">
            <Wrench className="h-4 w-4 text-brand-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Teklif Gönder</h3>
            <p className="text-xs text-zinc-500">Araç sahibine hizmet teklifinizi iletin</p>
          </div>
        </div>
        <button type="button" onClick={onCancel}
          className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Fiyat + Süre */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Teklif Fiyatı (₺) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">₺</span>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="0"
                min="1"
                step="1"
                required
                className="input-base pl-7"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              <Clock className="h-3 w-3 inline mr-1" />
              Tahmini Süre
            </label>
            <select
              name="duration"
              value={form.duration}
              onChange={handleChange}
              className="input-base"
            >
              <option value="">Seçin...</option>
              {SERVICE_DURATIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Hizmet açıklaması */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            <MessageSquare className="h-3 w-3 inline mr-1" />
            Hizmet Açıklaması <span className="text-red-400">*</span>
          </label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Yapacağınız işi, yaklaşımınızı ve deneyiminizi kısaca anlat..."
            rows={3}
            maxLength={500}
            className="input-base resize-none text-sm"
          />
          <p className="text-xs text-zinc-700 mt-1 text-right">{form.message.length}/500</p>
        </div>

        {/* Dahil olanlar */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Pakete Dahil Olanlar <span className="text-zinc-600 font-normal">(isteğe bağlı)</span>
          </label>
          <input
            name="includes"
            value={form.includes}
            onChange={handleChange}
            placeholder="Örn: Yedek parça, işçilik, 6 ay garanti"
            maxLength={200}
            className="input-base text-sm"
          />
        </div>

        {/* Aksiyon butonları */}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">
            Vazgeç
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" /> : <><Send className="h-3.5 w-3.5" />Teklif Gönder</>}
          </button>
        </div>
      </form>
    </div>
  )
}
