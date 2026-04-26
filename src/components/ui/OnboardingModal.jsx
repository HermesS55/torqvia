import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Car, Check, ChevronRight, User, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { uploadAvatar } from '../../lib/avatar'
import { validateImageFile, sanitizeText } from '../../lib/security'
import Spinner from './Spinner'
import toast from 'react-hot-toast'

const TOTAL_STEPS = 2

export default function OnboardingModal({ onComplete }) {
  const { user, profile, refetchProfile } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()
  const isOwner = profile?.role === 'owner'

  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleAvatar(e) {
    const file = e.target.files[0]
    if (!file) return
    try { await validateImageFile(file, 3 * 1024 * 1024) }
    catch (err) { toast.error(err.message); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleStep1() {
    if (!fullName.trim()) { toast.error('İsmin zorunlu'); return }
    setSaving(true)
    try {
      let avatar_url = profile?.avatar_url || null
      if (avatarFile) avatar_url = await uploadAvatar(user.id, avatarFile)
      const { error } = await supabase.from('profiles')
        .update({ full_name: sanitizeText(fullName, 80), avatar_url })
        .eq('id', user.id)
      if (error) throw error
      await refetchProfile?.()
      setStep(2)
    } catch (e) {
      toast.error(e.message || 'Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  function skip() { onComplete() }

  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">

        {/* Progress bar */}
        <div className="h-1 bg-zinc-800">
          <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="px-6 pt-5 pb-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Adım {step}/{TOTAL_STEPS}</p>
            <h2 className="font-bold text-white mt-0.5">
              {step === 1 ? 'Profilini Tanıt' : 'Aramaya Başla'}
            </h2>
          </div>
          <button onClick={skip} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4">

          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-zinc-400">
                Torqvia'ya hoş geldin! Profil bilgilerini ekleyerek topluluğa katıl.
              </p>

              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="relative h-20 w-20 rounded-full border-2 border-dashed border-zinc-700 hover:border-brand-500/50 transition-colors flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-zinc-600">
                      <Camera className="h-6 w-6" />
                      <span className="text-[10px]">Fotoğraf</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </button>
                <p className="text-xs text-zinc-600">Profil fotoğrafı ekle (isteğe bağlı)</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Ad Soyad <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Adın ve soyadın"
                    className="input-base pl-9"
                    maxLength={80}
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={skip} className="btn-secondary flex-1">Atla</button>
                <button onClick={handleStep1} disabled={saving || !fullName.trim()}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <Spinner size="sm" /> : <><span>Devam Et</span><ChevronRight className="h-4 w-4" /></>}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center py-4">
                <div className="h-16 w-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-brand-400" />
                </div>
                <h3 className="font-bold text-white text-lg">Profilin hazır!</h3>
                <p className="text-zinc-400 text-sm mt-2">
                  {isOwner
                    ? 'Servis ilanı oluşturabilir, ustaları keşfedebilirsin.'
                    : 'Araç ilanlarını görebilir, teklif gönderebilirsin.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {isOwner ? (
                  <>
                    <button onClick={() => { onComplete(); navigate('/listings/new') }}
                      className="btn-primary flex items-center justify-center gap-2">
                      <Car className="h-4 w-4" /> İlk İlanımı Oluştur
                    </button>
                    <button onClick={() => { onComplete(); navigate('/garage') }}
                      className="btn-secondary flex items-center justify-center gap-2">
                      <Car className="h-4 w-4" /> Araç Ekle (Garaj)
                    </button>
                  </>
                ) : (
                  <button onClick={() => { onComplete(); navigate('/listings') }}
                    className="btn-primary flex items-center justify-center gap-2">
                    <Car className="h-4 w-4" /> İlanlara Göz At
                  </button>
                )}
                <button onClick={() => { onComplete(); navigate('/feed') }} className="btn-ghost text-sm">
                  Feed'e Git
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
