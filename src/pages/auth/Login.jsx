import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Globe } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useT, useLang } from '../../contexts/LangContext'
import Spinner from '../../components/ui/Spinner'
import TorqviaLogo from '../../components/ui/TorqviaLogo'
import toast from 'react-hot-toast'
import { checkRateLimit } from '../../lib/security'

export default function Login() {
  const { signIn } = useAuth()
  const t = useT()
  const { lang, toggle } = useLang()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      checkRateLimit(`login:${form.email}`, 5, 60_000)
    } catch (err) {
      setError(err.message)
      return
    }
    setLoading(true)
    try {
      await signIn({ ...form, rememberMe })
      toast.success(t('auth.login.success'))
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || t('auth.login.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden="true">
        <div style={{ position: 'absolute', top: '5%', left: '5%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 65%)', filter: 'blur(70px)', animation: 'orb-drift-1 22s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 65%)', filter: 'blur(80px)', animation: 'orb-drift-2 30s ease-in-out infinite' }} />
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
            {lang === 'tr' ? '// GİRİŞ YAP' : '// SIGN IN'}
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

            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'monospace', color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 7 }}>
                {t('auth.email')}
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="input-base"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'monospace', color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 7 }}>
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="input-base pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-right mt-1.5">
                <Link
                  to="/forgot-password"
                  style={{ fontSize: 12, color: '#3f3f46' }}
                  className="hover:text-brand-400 transition-colors"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(v => !v)}
                className={`w-4.5 h-4.5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                  rememberMe
                    ? 'bg-brand-500 border-brand-500'
                    : 'bg-transparent border-zinc-700 hover:border-zinc-500'
                }`}
              >
                {rememberMe && (
                  <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span
                onClick={() => setRememberMe(v => !v)}
                className="text-sm text-zinc-600 cursor-pointer select-none hover:text-zinc-400 transition-colors"
              >
                {lang === 'tr' ? 'Oturumu açık bırak' : 'Stay signed in'}
              </span>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-1">
              {loading ? <Spinner size="sm" /> : t('auth.login.submit')}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 text-sm" style={{ color: '#3f3f46' }}>
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 transition-colors">
            {t('auth.login.create')}
          </Link>
        </div>
      </div>
    </div>
  )
}
