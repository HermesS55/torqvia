import { useEffect, useState } from 'react'
import { X, Star, Check, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import UserAvatar from './UserAvatar'
import Spinner from './Spinner'
import toast from 'react-hot-toast'

export default function RatingModal({ pro, onClose, onRated }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [existing, setExisting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchExisting()
  }, [])

  async function fetchExisting() {
    const { data, error } = await supabase
      .from('pro_ratings')
      .select('*')
      .eq('pro_id', pro.id)
      .eq('owner_id', user.id)
      .maybeSingle()
    if (error) {
      if (error.message?.includes('schema cache') || error.message?.includes('not found')) {
        toast.error('Değerlendirme tablosu henüz oluşturulmamış. Lütfen yöneticiye bildirin.')
      } else {
        toast.error(error.message || 'Yüklenemedi')
      }
      onClose()
      return
    }
    if (data) {
      setExisting(data)
      setRating(data.rating)
      setComment(data.comment || '')
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!rating) { toast.error('Lütfen bir puan seç'); return }
    setSaving(true)
    try {
      if (existing) {
        const { error } = await supabase
          .from('pro_ratings')
          .update({ rating, comment: comment.trim() || null })
          .eq('id', existing.id)
        if (error) throw error
        toast.success('Değerlendirme güncellendi!')
      } else {
        const { error } = await supabase
          .from('pro_ratings')
          .insert({ pro_id: pro.id, owner_id: user.id, rating, comment: comment.trim() || null })
        if (error) throw error
        supabase.from('notifications').insert({
          user_id: pro.id,
          type: 'rating',
          from_user_id: user.id,
          message: `${rating} yıldız değerlendirme aldınız${comment.trim() ? ': ' + comment.trim().slice(0, 60) : ''}`,
        }).then(() => {})
        toast.success('Değerlendirme gönderildi!')
      }
      onRated?.()
      onClose()
    } catch (e) {
      toast.error(e.message || 'Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!existing) return
    if (!confirm('Değerlendirmeni silmek istediğine emin misin?')) return
    setSaving(true)
    const { error } = await supabase.from('pro_ratings').delete().eq('id', existing.id)
    if (error) toast.error('Silinemedi')
    else { toast.success('Değerlendirme silindi'); onRated?.(); onClose() }
    setSaving(false)
  }

  const stars = [1, 2, 3, 4, 5]
  const displayRating = hovered || rating

  const labels = { 1: 'Berbat', 2: 'Kötü', 3: 'Orta', 4: 'İyi', 5: 'Mükemmel' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white text-sm">Ustayı Değerlendir</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : (
            <>
              {/* Pro info */}
              <div className="flex items-center gap-3 mb-5">
                <UserAvatar profile={pro} size="md" />
                <div>
                  <p className="font-semibold text-white">{pro.full_name || 'Kullanıcı'}</p>
                  <p className="text-xs text-zinc-500">{pro.specialty || 'Servis Uzmanı'}</p>
                </div>
              </div>

              {/* Star selector */}
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {stars.map(s => (
                    <button
                      key={s}
                      onMouseEnter={() => setHovered(s)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(s)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-9 w-9 transition-colors ${
                          s <= displayRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-zinc-700 fill-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {displayRating > 0 && (
                  <p className="text-sm font-medium text-zinc-300">{labels[displayRating]}</p>
                )}
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Yorum <span className="text-zinc-600">(isteğe bağlı)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Deneyimini paylaş..."
                  rows={3}
                  maxLength={500}
                  className="input-base resize-none text-sm"
                />
                <p className="text-xs text-zinc-700 mt-1 text-right">{comment.length}/500</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {existing && (
                  <button onClick={handleDelete} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                    Sil
                  </button>
                )}
                <button onClick={handleSave} disabled={saving || !rating}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <Spinner size="sm" /> : <Check className="h-4 w-4" />}
                  {existing ? 'Güncelle' : 'Gönder'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
