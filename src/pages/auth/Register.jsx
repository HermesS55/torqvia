import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useT } from '../../contexts/LangContext'
import AuthCard from '../../components/auth/AuthCard'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { checkRateLimit } from '../../lib/security'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function Register() {
  const { signUp, signInWithGoogle } = useAuth()
  const t = useT()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', phone: '', role: 'owner' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 8) { setError(t('auth.passwordShort')); return }
    if (!form.phone.match(/^\+?[\d\s\-()]{7,}$/)) { setError(t('auth.phoneInvalid')); return }
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

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message || 'Google ile giriş başarısız')
      setGoogleLoading(false)
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
      {/* Google butonu */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/60 text-zinc-200 text-sm font-medium transition-colors disabled:opacity-50 mb-4"
      >
        {googleLoading ? <Spinner size="sm" /> : <GoogleIcon />}
        Google ile kayıt ol
      </button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-xs text-zinc-600" style={{ background: 'rgba(24,24,27,0.85)' }}>veya e-posta ile</span>
        </div>
      </div>

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
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.email')}</label>
          <input type="email" name="email" value={form.email} onChange={handleChange}
            placeholder="you@example.com" required className="input-base" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.phone')}</label>
          <input type="tel" name="phone" value={form.phone} onChange={handleChange}
            placeholder="+90 555 000 0000" required className="input-base" />
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

        <button type="submit" disabled={loading || googleLoading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          {loading ? <Spinner size="sm" /> : t('auth.register.submit')}
        </button>

        <p className="text-xs text-zinc-600 text-center">{t('auth.register.terms')}</p>
      </form>
    </AuthCard>
  )
}
