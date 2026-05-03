import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useT } from '../../contexts/LangContext'
import AuthCard from '../../components/auth/AuthCard'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { checkRateLimit } from '../../lib/security'

const SPECIALTIES = ['Motor', 'Kaporta-Boya', 'Elektrik', 'Lastik-Jant', 'Klima', 'Genel Bakım', 'Diğer']

export default function Register() {
  const { signUp } = useAuth()
  const t = useT()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    email: '', password: '', phone: '', role: 'owner',
    full_name: '', shop_name: '', city: '', specialties: [],
  })

  useEffect(() => {
    const role = searchParams.get('role')
    if (role === 'owner' || role === 'pro') {
      setForm(f => ({ ...f, role }))
    }
  }, [])

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  function toggleSpecialty(s) {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter(x => x !== s)
        : [...f.specialties, s],
    }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const _fn = form.full_name.trim()
    if (_fn.replace(/\s+/g, '').length < 3 || _fn.split(/\s+/).filter(w => w.length > 0).length < 2) { setError('Lütfen ad ve soyadınızı tam yazın'); return }
    if (form.password.length < 8) { setError(t('auth.passwordShort')); return }
    if (form.phone.replace(/\D/g, '').length < 10) { setError(t('auth.phoneInvalid')); return }
    if (form.role === 'pro') {
      if (form.shop_name.trim().length < 2) { setError('Dükkan adı en az 2 karakter olmalı'); return }
      if (form.city.trim().length < 2) { setError('Şehir/ilçe bilgisi en az 2 karakter olmalı'); return }
      if (form.specialties.length === 0) { setError('En az 1 uzmanlık alanı seçmelisin'); return }
    }
    try {
      checkRateLimit(`register:${form.email}`, 3, 300_000)
    } catch (err) {
      setError(err.message)
      return
    }
    setLoading(true)
    try {
      const data = await signUp(form)
      if (data.session) {
        toast.success(t('auth.register.success'))
        navigate('/dashboard')
      } else {
        toast.success(t('auth.register.confirmEmail'))
        navigate('/login')
      }
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <span>
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300">
            {t('auth.register.signIn')}
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.register.iam')}</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'owner', label: t('auth.register.carOwner'), desc: t('auth.register.carOwnerDesc') },
              { value: 'pro',   label: t('auth.register.pro'),      desc: t('auth.register.proDesc') },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, role: opt.value }))}
                className={`p-3 rounded-lg border text-left transition-all ${
                  form.role === opt.value
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                }`}
              >
                <div className="font-medium text-sm text-zinc-100">{opt.label}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Ad Soyad</label>
          <input type="text" name="full_name" value={form.full_name} onChange={handleChange}
            placeholder="Adınız Soyadınız" required className="input-base" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.email')}</label>
          <input type="email" name="email" value={form.email} onChange={handleChange}
            placeholder="you@example.com" required className="input-base" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.phone')}</label>
          <input type="tel" name="phone" value={form.phone} onChange={handleChange}
            placeholder="05XX XXX XX XX" required className="input-base" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.password')}</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={t('auth.passwordMin')}
              required
              className="input-base pr-10"
            />
            <button type="button" onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {form.role === 'pro' && (
          <>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Dükkan Adı</label>
              <input type="text" name="shop_name" value={form.shop_name} onChange={handleChange}
                placeholder="Örn: Ahmet Oto" required className="input-base" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Şehir / İlçe</label>
              <input type="text" name="city" value={form.city} onChange={handleChange}
                placeholder="Örn: Samsun / Atakum" required className="input-base" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Hangi hizmetleri veriyorsunuz?{' '}
                <span className="text-zinc-500 font-normal">(en az 1 seçim)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpecialty(s)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      form.specialties.includes(s)
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          {loading ? <Spinner size="sm" /> : t('auth.register.submit')}
        </button>

        <p className="text-xs text-zinc-600 text-center">{t('auth.register.terms')}</p>
      </form>
    </AuthCard>
  )
}
