import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Globe } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useT, useLang } from '../../contexts/LangContext'
import Spinner from '../../components/ui/Spinner'
import TorqviaLogo from '../../components/ui/TorqviaLogo'
import toast from 'react-hot-toast'
import { checkRateLimit } from '../../lib/security'

const SPECIALTIES = ['Motor', 'Kaporta-Boya', 'Elektrik', 'Lastik-Jant', 'Klima', 'Genel Bakım', 'Diğer']

function ParticleCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const N = 38
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
    }))
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < N; i++) {
        const p = pts[i]
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,107,0,0.65)'
        ctx.fill()
        for (let j = i + 1; j < N; j++) {
          const q = pts[j]
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 95) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(255,107,0,${(1 - d / 95) * 0.16})`
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

  const focusIn = e => { e.target.style.borderColor = '#ff6b00'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,0,0.08)' }
  const focusOut = e => { e.target.style.borderColor = '#1a1a1a'; e.target.style.boxShadow = 'none' }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#080808',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '3rem 1rem 2rem', zIndex: 100, overflow: 'auto',
    }}>
      <ParticleCanvas />

      {/* Glow orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden>
        <div style={{ position: 'absolute', top: 0, left: '5%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,0,0.07) 0%, transparent 65%)', filter: 'blur(65px)', animation: 'orb-drift-1 22s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: 0, right: '5%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,0,0.05) 0%, transparent 65%)', filter: 'blur(75px)', animation: 'orb-drift-2 30s ease-in-out infinite' }} />
      </div>

      {/* Lang toggle */}
      <button onClick={toggle} title={lang === 'tr' ? 'Switch to English' : "Türkçe'ye geç"}
        style={{ position: 'fixed', top: 16, right: 16, zIndex: 110 }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/80 hover:border-zinc-700 backdrop-blur transition-colors text-xs font-medium text-zinc-500 hover:text-zinc-300">
        <Globe className="h-3.5 w-3.5" />
        {lang === 'tr' ? 'EN' : 'TR'}
      </button>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 10, animation: 'fade-up 0.4s ease both' }}>
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
            {lang === 'tr' ? '// KAYIT OL' : '// CREATE ACCOUNT'}
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

            {/* Role selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>{t('auth.register.iam')}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { value: 'owner', label: t('auth.register.carOwner'), desc: t('auth.register.carOwnerDesc') },
                  { value: 'pro', label: t('auth.register.pro'), desc: t('auth.register.proDesc') },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, role: opt.value }))}
                    style={{
                      padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                      border: `1px solid ${form.role === opt.value ? '#ff6b00' : '#1a1a1a'}`,
                      background: form.role === opt.value ? 'rgba(255,107,0,0.06)' : '#0e0e0e',
                      transition: 'all 0.2s',
                    }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#f0f0f0' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{lang === 'tr' ? 'Ad Soyad' : 'Full Name'}</label>
              <input type="text" name="full_name" value={form.full_name} onChange={handleChange}
                placeholder={lang === 'tr' ? 'Adınız Soyadınız' : 'Your Full Name'} required
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{t('auth.email')}</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com" required
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{t('auth.phone')}</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                placeholder="05XX XXX XX XX" required
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </div>

            {/* Password */}
            <div style={{ marginBottom: form.role === 'pro' ? 14 : 20 }}>
              <label style={labelStyle}>{t('auth.password')}</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder={t('auth.passwordMin')} required
                  style={{ ...inputStyle, paddingRight: 42 }} onFocus={focusIn} onBlur={focusOut} />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: 4, display: 'flex' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Pro-only fields */}
            {form.role === 'pro' && (
              <>
                <div style={{ height: 1, background: '#141414', margin: '6px 0 18px' }} />
                <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#444', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 16 }}>
                  {lang === 'tr' ? '// USTA BİLGİLERİ' : '// PROFESSIONAL INFO'}
                </p>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>{lang === 'tr' ? 'Dükkan Adı' : 'Shop Name'}</label>
                  <input type="text" name="shop_name" value={form.shop_name} onChange={handleChange}
                    placeholder={lang === 'tr' ? 'Örn: Ahmet Oto' : 'e.g. Ahmet Auto'} required
                    style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>{lang === 'tr' ? 'Şehir / İlçe' : 'City / District'}</label>
                  <input type="text" name="city" value={form.city} onChange={handleChange}
                    placeholder={lang === 'tr' ? 'Örn: Samsun / Atakum' : 'e.g. Samsun / Atakum'} required
                    style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>
                    {lang === 'tr' ? `Hangi hizmetleri veriyorsunuz? (en az 1)` : `What services do you offer? (min 1)`}
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {SPECIALTIES.map(s => (
                      <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                        style={{
                          padding: '9px 16px', borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                          border: `1px solid ${form.specialties.includes(s) ? '#ff6b00' : '#1a1a1a'}`,
                          background: form.specialties.includes(s) ? 'rgba(255,107,0,0.1)' : '#0e0e0e',
                          color: form.specialties.includes(s) ? '#ff6b00' : '#666',
                          transition: 'all 0.18s',
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Terms */}
            <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#2a2a2a', textAlign: 'center', marginBottom: 16, lineHeight: 1.7 }}>
              {t('auth.register.terms')}
            </p>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                background: loading ? '#7c3500' : '#ff6b00', color: '#fff', fontWeight: 700,
                fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s',
              }}>
              {loading ? <Spinner size="sm" /> : t('auth.register.submit')}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#444' }}>
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" style={{ color: '#ff6b00', textDecoration: 'none' }}>
            {t('auth.register.signIn')}
          </Link>
        </div>
      </div>
    </div>
  )
}
