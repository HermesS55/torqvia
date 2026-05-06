import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Globe } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useT, useLang } from '../../contexts/LangContext'
import Spinner from '../../components/ui/Spinner'
import TorqviaLogo from '../../components/ui/TorqviaLogo'
import toast from 'react-hot-toast'
import { checkRateLimit } from '../../lib/security'

const SPECIALTIES = ['Motor', 'Kaporta-Boya', 'Elektrik', 'Lastik-Jant', 'Klima', 'Genel Bakım', 'Diğer']

export default function Register() {
  const { signUp } = useAuth()
  const t = useT()
  const { lang, toggle } = useLang()
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

  const fieldLabel = (text) => (
    <label style={{ display: 'block', fontSize: 11, fontFamily: 'monospace', color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 7 }}>
      {text}
    </label>
  )

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden="true">
        <div style={{ position: 'absolute', top: '0%', left: '5%', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.09) 0%, transparent 65%)', filter: 'blur(70px)', animation: 'orb-drift-1 22s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '0%', right: '5%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 65%)', filter: 'blur(80px)', animation: 'orb-drift-2 30s ease-in-out infinite' }} />
      </div>

      {/* Lang toggle */}
      <button
        onClick={toggle}
        title={lang === 'tr' ? 'Switch to English' : "Türkçe'ye geç"}
        style={{ position: 'fixed', top: 16, right: 16, zIndex: 20 }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/80 hover:border-zinc-700 hover:bg-zinc-800/50 backdrop-blur transition-colors text-xs font-medium text-zinc-500 hover:text-zinc-300"
      >
        <Globe className="h-3.5 w-3.5" />
        {lang === 'tr' ? 'EN' : 'TR'}
      </button>

      {/* Card container */}
      <div
        className="w-full relative z-10"
        style={{ maxWidth: 420, animation: 'fade-up 0.4s ease both' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <Link to="/" className="flex flex-col items-center gap-3 mb-4">
            <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)', borderRadius: '50%', padding: 14, border: '1px solid rgba(249,115,22,0.18)' }}>
              <TorqviaLogo size={42} />
            </div>
            <div className="text-center">
              <span style={{ background: 'linear-gradient(135deg, #ffffff 40%, #fb923c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: 21, fontWeight: 700, letterSpacing: '-0.01em', display: 'block' }}>
                Torqvia
              </span>
              <p style={{ fontFamily: 'monospace', fontSize: 9.5, color: '#3f3f46', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 2 }}>
                Automotive Community
              </p>
            </div>
          </Link>

          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#3f3f46', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            {lang === 'tr' ? '// KAYIT OL' : '// CREATE ACCOUNT'}
          </p>
        </div>

        {/* Form card */}
        <div style={{ background: '#111111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '26px 22px', boxShadow: '0 12px 48px rgba(0,0,0,0.6)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Role selector */}
            <div>
              {fieldLabel(t('auth.register.iam'))}
              <div className="grid grid-cols-2 gap-2.5">
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
                        ? 'border-brand-500/60 bg-brand-500/8'
                        : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-medium text-sm text-zinc-200">{opt.label}</div>
                    <div className="text-xs text-zinc-600 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <div>
              {fieldLabel(lang === 'tr' ? 'Ad Soyad' : 'Full Name')}
              <input type="text" name="full_name" value={form.full_name} onChange={handleChange}
                placeholder={lang === 'tr' ? 'Adınız Soyadınız' : 'Your Full Name'} required className="input-base" />
            </div>

            {/* Email */}
            <div>
              {fieldLabel(t('auth.email'))}
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com" required className="input-base" />
            </div>

            {/* Phone */}
            <div>
              {fieldLabel(t('auth.phone'))}
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                placeholder="05XX XXX XX XX" required className="input-base" />
            </div>

            {/* Password */}
            <div>
              {fieldLabel(t('auth.password'))}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Pro fields */}
            {form.role === 'pro' && (
              <>
                <div>
                  {fieldLabel(lang === 'tr' ? 'Dükkan Adı' : 'Shop Name')}
                  <input type="text" name="shop_name" value={form.shop_name} onChange={handleChange}
                    placeholder={lang === 'tr' ? 'Örn: Ahmet Oto' : 'e.g. Ahmet Auto'} required className="input-base" />
                </div>

                <div>
                  {fieldLabel(lang === 'tr' ? 'Şehir / İlçe' : 'City / District')}
                  <input type="text" name="city" value={form.city} onChange={handleChange}
                    placeholder={lang === 'tr' ? 'Örn: Samsun / Atakum' : 'e.g. Samsun / Atakum'} required className="input-base" />
                </div>

                <div>
                  {fieldLabel(
                    lang === 'tr'
                      ? `Hangi hizmetleri veriyorsunuz?  (en az 1)`
                      : `What services do you offer?  (min 1)`
                  )}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {SPECIALTIES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSpecialty(s)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                          form.specialties.includes(s)
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-1">
              {loading ? <Spinner size="sm" /> : t('auth.register.submit')}
            </button>

            <p style={{ fontSize: 11, color: '#2f2f2f', textAlign: 'center', marginTop: 4 }}>
              {t('auth.register.terms')}
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 text-sm" style={{ color: '#3f3f46' }}>
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
            {t('auth.register.signIn')}
          </Link>
        </div>
      </div>
    </div>
  )
}
