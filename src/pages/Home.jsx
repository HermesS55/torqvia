import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Shield, Star, Clock, Zap, Users, MapPin } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useMeta } from '../hooks/useMeta'
import { useLang } from '../contexts/LangContext'

function ParticleCanvas({ style = {} }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const N = 55
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.38,
      vy: (Math.random() - 0.5) * 0.38,
    }))
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < N; i++) {
        const p = pts[i]
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = '#ff6b00'
        ctx.shadowColor = '#ff6b00'
        ctx.shadowBlur = 4
        ctx.fill()
        ctx.shadowBlur = 0
        for (let j = i + 1; j < N; j++) {
          const q = pts[j]
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 110) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(255,107,0,${(1 - d / 110) * 0.28})`
            ctx.lineWidth = 0.6
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
  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block', ...style }} />
}

function TickerBar({ lang }) {
  const tr = ['SYS.DURUM: AKTİF', 'USTALAR: 2.847', 'BUGÜNKÜ İŞLER: 1.203', 'ORT. PUAN: 4.7★', 'UPTIME: %99.98', 'ENLEM: 41.29° K', 'BÖLGE: TR-55']
  const en = ['SYS.STATUS: ONLINE', 'MECHANICS: 2,847', 'JOBS TODAY: 1,203', 'AVG RATING: 4.7★', 'UPTIME: 99.98%', 'LAT: 41.29° N', 'REGION: TR-55']
  const items = lang === 'tr' ? tr : en
  const doubled = [...items, ...items]
  return (
    <div
      className="-mx-3 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-8 mb-0 overflow-hidden"
      style={{ background: '#080808', borderBottom: '1px solid #141414', height: 36 }}
    >
      <div className="flex items-center h-full" style={{ animation: 'ticker 38s linear infinite', width: 'max-content' }}>
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-6 whitespace-nowrap" style={{ fontFamily: 'monospace', fontSize: 11, color: '#444', letterSpacing: '0.08em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0, display: 'inline-block' }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function LiveMatchCard({ lang }) {
  const tr = lang === 'tr'
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '18px 20px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)', maxWidth: 320, width: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {tr ? '// CANLI EŞLEŞİLDİ' : '// LIVE MATCH'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', animation: 'badge-turbo-glow 2s ease-in-out infinite', display: 'inline-block' }} />
          {tr ? 'Canlı' : 'Live'}
        </span>
      </div>
      {[
        { name: tr ? 'Ahmet Oto Tamiri' : 'Ahmet Auto Repair', city: 'Samsun / Atakum', rating: '4.9', spec: tr ? 'Motor · Elektrik' : 'Engine · Electric', time: '≈12 dk', color: '#f97316' },
        { name: tr ? 'Tuğrul Lastik' : 'Tuğrul Tires', city: 'Samsun / Canik', rating: '4.7', spec: tr ? 'Lastik · Jant' : 'Tires · Rims', time: '≈8 dk', color: '#8b5cf6' },
      ].map((m, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i === 0 ? '1px solid #f0f0f0' : 'none' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{m.name[0]}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
            <div style={{ fontSize: 11, color: '#777', marginTop: 1 }}>{m.spec} · ★{m.rating}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>{m.time}</div>
            <div style={{ fontSize: 10, color: '#aaa' }}>{m.city}</div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 14, background: '#ff6b00', borderRadius: 8, padding: '9px 0', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
        {tr ? 'Randevu Al →' : 'Book Now →'}
      </div>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { lang } = useLang()
  const tr = lang === 'tr'

  useMeta(
    "Türkiye'nin Oto Servis Platformu | Güvenilir Tamirci Bul",
    {
      description: "Torqvia ile Türkiye'nin en güvenilir oto servis uzmanlarını bul. Araç tamiri, boya, kaporta, motor ve daha fazlası. Servis ilanı oluştur, teklif al, randevu ayarla.",
      canonical: 'https://www.torqvia.net/',
    }
  )

  const features = tr
    ? [
        { num: '01', title: 'Doğrulanmış Ustalar', desc: 'Her usta kimlik ve belge doğrulamasından geçiyor.' },
        { num: '02', title: 'Şeffaf Fiyatlandırma', desc: 'Gizli ücret yok. İş başlamadan önce fiyatı bilirsin.' },
        { num: '03', title: 'Gerçek Yorumlar', desc: 'Tüm yorumlar gerçek hizmet sonrası yazılıyor. Manipüle edilemez.' },
        { num: '04', title: 'Hızlı Yanıt', desc: 'Ortalama 15 dakikada ilk teklifini al. Vakit kaybetme.' },
        { num: '05', title: 'Konum Bazlı Eşleşme', desc: 'Bölgendeki en yakın ve en iyi ustalarla otomatik eşleşme.' },
        { num: '06', title: 'Güvenli Ödeme', desc: 'Platform üzerinden şeffaf fiyat anlaşması. Sürpriz fatura yok.' },
      ]
    : [
        { num: '01', title: 'Verified Mechanics', desc: 'Every mechanic goes through identity and document verification.' },
        { num: '02', title: 'Transparent Pricing', desc: 'No hidden fees. Know the price before the job starts.' },
        { num: '03', title: 'Real Reviews', desc: 'All reviews are written after real services. Cannot be manipulated.' },
        { num: '04', title: 'Fast Response', desc: 'Get your first quote in an average of 15 minutes.' },
        { num: '05', title: 'Location Matching', desc: 'Automatically matched with the nearest and best mechanics in your area.' },
        { num: '06', title: 'Secure Agreement', desc: 'Transparent price agreement through the platform. No surprise bills.' },
      ]

  const steps = tr
    ? [
        { num: '01', title: 'Sorununu Anlat', desc: 'Araç sorununu ve beklentilerini anlat. Fotoğraf ekle, bütçeni belirt.' },
        { num: '02', title: 'Teklifleri Karşılaştır', desc: 'Yakınındaki ustalardan şeffaf teklifler al. Puanları ve yorumları incele.' },
        { num: '03', title: 'İşi Yaptır', desc: 'Tek tıkla rezervasyon oluştur. İşi takip et, tamamlandığında onayla.' },
      ]
    : [
        { num: '01', title: 'Describe Your Problem', desc: 'Describe your car problem and expectations. Add photos, set your budget.' },
        { num: '02', title: 'Compare Offers', desc: 'Get transparent quotes from nearby mechanics. Check ratings and reviews.' },
        { num: '03', title: 'Get It Fixed', desc: 'Book with one click. Track the job and confirm when done.' },
      ]

  const plans = [
    {
      key: 'free',
      name: tr ? 'Ücretsiz' : 'Free',
      price: '₺0',
      period: tr ? '/ ay' : '/ mo',
      for: tr ? 'ARAÇ SAHİBİ & USTA' : 'OWNER & MECHANIC',
      features: tr
        ? ['Servis talep listesini gör', '3 ücretsiz talep iletişim hakkı', 'İlgileniyorum butonu', 'Temel profil']
        : ['View service requests', '3 free contact unlocks', 'Interested button', 'Basic profile'],
      borderColor: '#1a1a1a',
      featured: false,
      cta: tr ? 'Başla' : 'Get Started',
    },
    {
      key: 'turbo',
      name: 'Turbo',
      price: '₺299',
      period: tr ? '/ ay' : '/ mo',
      for: tr ? 'USTA' : 'MECHANIC',
      features: tr
        ? ['Sınırsız talep iletişim bilgisi', 'Mesajlaşma & sınırsız teklif', 'Randevu yönetimi', 'Profil istatistikleri', '⚡ Turbo rozeti']
        : ['Unlimited contact unlocks', 'Messaging & unlimited offers', 'Appointment management', 'Profile stats', '⚡ Turbo badge'],
      borderColor: '#ff6b00',
      featured: true,
      cta: tr ? 'Turbo\'ya Geç' : 'Get Turbo',
    },
    {
      key: 'elite',
      name: 'Elite',
      price: '₺599',
      period: tr ? '/ ay' : '/ mo',
      for: tr ? 'USTA' : 'MECHANIC',
      features: tr
        ? ["Turbo'nun her şeyi", 'Öncelikli arama sıralaması', 'Verified rozet', 'Rakip kıyaslama & analitik', 'WhatsApp entegrasyonu']
        : ["Everything in Turbo", 'Priority search ranking', 'Verified badge', 'Competitor analytics', 'WhatsApp integration'],
      borderColor: '#8b5cf6',
      featured: false,
      cta: tr ? "Elite'e Geç" : 'Get Elite',
    },
  ]

  return (
    <div style={{ background: '#080808', minHeight: '100vh' }}>
      {/* ── Ticker ── */}
      <TickerBar lang={lang} />

      {/* ── Hero ── */}
      <section className="-mx-3 sm:-mx-6 lg:-mx-8" style={{ padding: '64px 0 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}
          className="flex-col-mobile">
          {/* Left */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
              padding: '6px 14px', borderRadius: 99,
              background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)',
              fontFamily: 'monospace', fontSize: 11, color: '#888', letterSpacing: '0.12em',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              {tr ? "SAMSUN'DA #1 OTO SERVİS PLATFORMU" : '#1 AUTO SERVICE PLATFORM IN SAMSUN'}
            </div>

            <h1 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, lineHeight: 1.07, letterSpacing: '-0.02em', color: '#f0f0f0', marginBottom: 20 }}>
              {tr ? (
                <>
                  Aracın için<br />
                  güvenilir usta<br />
                  <span style={{ color: '#ff6b00', animation: 'glitch-text 7s ease-in-out infinite', display: 'inline-block' }}>anında bul</span>
                </>
              ) : (
                <>
                  Find a trusted<br />
                  mechanic for<br />
                  <span style={{ color: '#ff6b00', animation: 'glitch-text 7s ease-in-out infinite', display: 'inline-block' }}>your car now</span>
                </>
              )}
            </h1>

            <p style={{ color: '#888', fontSize: 16, lineHeight: 1.65, marginBottom: 32, maxWidth: 480 }}>
              {tr
                ? 'Araç sorununu anlat, doğrulanmış ustalarla eşleş, fiyatları karşılaştır ve rezervasyon yap — 2 dakikadan az sürede.'
                : 'Describe your car problem, match with verified mechanics, compare prices and book — all in under 2 minutes.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {user ? (
                <Link to="/dashboard" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px',
                  borderRadius: 10, background: '#ff6b00', color: '#fff', fontWeight: 700, fontSize: 15,
                  textDecoration: 'none', boxShadow: '0 4px 24px rgba(255,107,0,0.35)',
                }}>
                  {tr ? 'Dashboard\'a Git' : 'Go to Dashboard'} <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link to="/register?role=owner" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px',
                    borderRadius: 10, background: '#ff6b00', color: '#fff', fontWeight: 700, fontSize: 15,
                    textDecoration: 'none', boxShadow: '0 4px 24px rgba(255,107,0,0.35)',
                  }}>
                    {tr ? 'Ücretsiz Başla' : 'Start Free'} <ArrowRight size={16} />
                  </Link>
                  <a href="#how-it-works" style={{
                    display: 'inline-flex', alignItems: 'center', padding: '13px 24px',
                    borderRadius: 10, border: '1px solid #1a1a1a', color: '#888',
                    fontWeight: 600, fontSize: 15, textDecoration: 'none',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    {tr ? 'Nasıl Çalışır →' : 'How it works →'}
                  </a>
                </>
              )}
            </div>

            {!user && (
              <p style={{ marginTop: 16, fontSize: 13, color: '#444' }}>
                {tr ? 'Hesabın var mı?' : 'Already have an account?'}{' '}
                <Link to="/login" style={{ color: '#ff6b00', textDecoration: 'none' }}>
                  {tr ? 'Giriş yap' : 'Sign in'}
                </Link>
              </p>
            )}
          </div>

          {/* Right — canvas + match card */}
          <div style={{ position: 'relative', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            className="hidden-on-mobile">
            <div style={{ position: 'absolute', inset: 0, borderRadius: 20, overflow: 'hidden', border: '1px solid #141414' }}>
              <div style={{ position: 'absolute', inset: 0, background: '#080808' }}>
                <ParticleCanvas />
              </div>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(8,8,8,0.7) 100%)',
              }} />
            </div>
            <div style={{ position: 'relative', zIndex: 2, padding: 24 }}>
              <LiveMatchCard lang={lang} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features 3x2 grid ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px' }} className="-mx-3 sm:mx-0">
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#444', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
          {tr ? '// NEDEN TORQVIA' : '// WHY TORQVIA'}
        </p>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#f0f0f0', marginBottom: 40 }}>
          {tr ? 'Her şey düşünüldü' : 'Everything considered'}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid #141414', borderRadius: 16, overflow: 'hidden' }}
          className="features-grid">
          {features.map((f, i) => (
            <div key={f.num} style={{
              padding: '28px 24px',
              borderRight: (i + 1) % 3 !== 0 ? '1px solid #141414' : 'none',
              borderBottom: i < 3 ? '1px solid #141414' : 'none',
              background: '#0b0b0b',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 900, color: '#1a1a1a', marginBottom: 12, lineHeight: 1 }}>
                {f.num}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ borderTop: '2px solid #ff6b00', paddingTop: 40 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#ff6b00', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
            {tr ? '// NASIL ÇALIŞIR' : '// HOW IT WORKS'}
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#f0f0f0', marginBottom: 48 }}>
            {tr ? 'Üç adımda çözüme kavuş' : 'Three steps to a fixed car'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }} className="steps-grid">
            {steps.map((step, i) => (
              <div key={step.num} style={{ position: 'relative' }}>
                <div style={{ fontSize: 64, fontWeight: 900, color: '#141414', lineHeight: 1, marginBottom: 16, fontFamily: 'monospace' }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f0', marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#888', lineHeight: 1.65 }}>{step.desc}</p>
                {i < 2 && (
                  <div style={{
                    display: 'none',
                  }} className="step-arrow">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#444', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
            {tr ? '// ÜYELİK PLANLARI' : '// MEMBERSHIP PLANS'}
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#f0f0f0' }}>
            {tr ? 'Sana uygun planı seç' : 'Choose the plan that fits you'}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 900, margin: '0 auto' }} className="plans-grid">
          {plans.map(plan => (
            <div key={plan.key} style={{
              position: 'relative',
              background: '#0b0b0b',
              border: `1px solid ${plan.borderColor}`,
              borderRadius: 16,
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              transform: plan.featured ? 'scale(1.04)' : 'none',
              boxShadow: plan.featured ? `0 0 40px rgba(255,107,0,0.12)` : 'none',
            }}>
              {plan.featured && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#ff6b00', color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '4px 14px', borderRadius: 99, letterSpacing: '0.1em', whiteSpace: 'nowrap',
                }}>
                  {tr ? '⚡ EN POPÜLER' : '⚡ MOST POPULAR'}
                </div>
              )}

              {/* For who */}
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#444', letterSpacing: '0.18em', marginBottom: 16 }}>
                {plan.for}
              </div>

              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f0f0f0', marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: '#f0f0f0' }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: '#444', marginBottom: 4 }}>{plan.period}</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888', marginBottom: 8 }}>
                    <CheckCircle size={13} style={{ color: plan.featured ? '#ff6b00' : plan.key === 'elite' ? '#8b5cf6' : '#444', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link to={user ? '/pricing' : '/register'} style={{
                display: 'block', textAlign: 'center', padding: '11px 0', borderRadius: 10,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
                background: plan.featured ? '#ff6b00' : plan.key === 'elite' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                color: plan.featured ? '#fff' : plan.key === 'elite' ? '#a78bfa' : '#888',
                border: `1px solid ${plan.featured ? '#ff6b00' : plan.key === 'elite' ? 'rgba(139,92,246,0.4)' : '#1a1a1a'}`,
              }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/pricing" style={{ fontSize: 13, color: '#444', textDecoration: 'none' }}>
            {tr ? 'Tüm plan detaylarını gör →' : 'See all plan details →'}
          </Link>
        </div>
      </section>

      {/* ── Footer minimal ── */}
      <footer style={{ borderTop: '1px solid #141414', padding: '24px', textAlign: 'center', maxWidth: 1280, margin: '0 auto' }}>
        <p style={{ fontSize: 12, color: '#333', fontFamily: 'monospace' }}>
          © 2025 Torqvia · {tr ? 'Samsun\'un Oto Servis Platformu' : "Samsun's Auto Service Platform"} ·{' '}
          <Link to="/terms" style={{ color: '#444', textDecoration: 'none' }}>{tr ? 'Şartlar' : 'Terms'}</Link>
          {' · '}
          <Link to="/privacy" style={{ color: '#444', textDecoration: 'none' }}>{tr ? 'Gizlilik' : 'Privacy'}</Link>
        </p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .flex-col-mobile { grid-template-columns: 1fr !important; }
          .hidden-on-mobile { display: none !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .features-grid > div { border-right: none !important; }
        }
      `}</style>
    </div>
  )
}
