import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Globe } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useT, useLang } from '../../contexts/LangContext'
import Spinner from '../../components/ui/Spinner'
import TorqviaLogo from '../../components/ui/TorqviaLogo'
import toast from 'react-hot-toast'
import { checkRateLimit } from '../../lib/security'

function ParticleCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const N = 40
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }))
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < N; i++) {
        const p = pts[i]
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,107,0,0.7)'
        ctx.fill()
        for (let j = i + 1; j < N; j++) {
          const q = pts[j]
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(255,107,0,${(1 - d / 100) * 0.18})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(frame)
    }
    frame()
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    })
    ro.observe(canvas)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}

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

  const inputStyle = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 8,
    color: '#f0f0f0', fontSize: 14, padding: '11px 14px',
    outline: 'none', transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block', fontFamily: 'monospace', fontSize: 10,
    color: '#444', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 7,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#080808',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem', zIndex: 100, overflow: 'hidden',
    }}>
      {/* Canvas bg */}
      <ParticleCanvas />

      {/* Glow orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,0,0.06) 0%, transparent 65%)', filter: 'blur(60px)', animation: 'orb-drift-1 22s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,0,0.04) 0%, transparent 65%)', filter: 'blur(70px)', animation: 'orb-drift-2 30s ease-in-out infinite' }} />
      </div>

      {/* Lang toggle */}
      <button onClick={toggle} title={lang === 'tr' ? 'Switch to English' : "Türkçe'ye geç"}
        style={{ position: 'fixed', top: 16, right: 16, zIndex: 110 }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/80 hover:border-zinc-700 backdrop-blur transition-colors text-xs font-medium text-zinc-500 hover:text-zinc-300">
        <Globe className="h-3.5 w-3.5" />
        {lang === 'tr' ? 'EN' : 'TR'}
      </button>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 10, animation: 'fade-up 0.4s ease both' }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 16, textDecoration: 'none' }}>
            <div style={{ background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)', borderRadius: '50%', padding: 14, border: '1px solid rgba(255,107,0,0.15)' }}>
              <TorqviaLogo size={42} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ background: 'linear-gradient(135deg, #f0f0f0 40%, #ff6b00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', display: 'block' }}>
                Torqvia
              </span>
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#333', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 2 }}>
                Automotive Community
              </p>
            </div>
          </Link>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#444', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            {lang === 'tr' ? '// GİRİŞ YAP' : '// SIGN IN'}
          </p>
        </div>

        {/* Form card */}
        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12, padding: '26px 22px', boxShadow: '0 16px 56px rgba(0,0,0,0.7)' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{t('auth.email')}</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com" required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#ff6b00'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,0,0.08)' }}
                onBlur={e => { e.target.style.borderColor = '#1a1a1a'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{t('auth.password')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••" required
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e => { e.target.style.borderColor = '#ff6b00'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,0,0.08)' }}
                  onBlur={e => { e.target.style.borderColor = '#1a1a1a'; e.target.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: 4, display: 'flex' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <Link to="/forgot-password" style={{ fontSize: 12, color: '#444', textDecoration: 'none' }}
                  className="hover:text-brand-400 transition-colors">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </div>

            {/* Remember me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <button type="button" role="checkbox" aria-checked={rememberMe}
                onClick={() => setRememberMe(v => !v)}
                style={{
                  width: 18, height: 18, borderRadius: 4, border: `1px solid ${rememberMe ? '#ff6b00' : '#333'}`,
                  background: rememberMe ? '#ff6b00' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                }}>
                {rememberMe && (
                  <svg viewBox="0 0 10 8" fill="none" width={10} height={8}>
                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span onClick={() => setRememberMe(v => !v)} style={{ fontSize: 13, color: '#555', cursor: 'pointer', userSelect: 'none' }}>
                {lang === 'tr' ? 'Oturumu açık bırak' : 'Stay signed in'}
              </span>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                background: loading ? '#7c3500' : '#ff6b00', color: '#fff', fontWeight: 700,
                fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s',
              }}>
              {loading ? <Spinner size="sm" /> : (lang === 'tr' ? 'Giriş Yap' : 'Sign In')}
            </button>

          </form>
        </div>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#444' }}>
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" style={{ color: '#ff6b00', textDecoration: 'none' }}>
            {t('auth.login.create')}
          </Link>
        </div>
      </div>
    </div>
  )
}
