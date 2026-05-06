import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, Shield, Clock, CheckCircle, Wrench } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useMeta } from '../hooks/useMeta'
import { useLang } from '../contexts/LangContext'

function SectionLabel({ text }) {
  return (
    <p className="font-mono text-[11px] text-zinc-600 tracking-[0.2em] uppercase mb-3">
      {text}
    </p>
  )
}

function HomeBackground() {
  const sparks = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    left: `${8 + (i * 9.7) % 84}%`,
    top: `${20 + (i * 15.3) % 60}%`,
    delay: `${(i * 0.85) % 6}s`,
    dur: `${3.2 + (i * 0.45) % 3.2}s`,
    dx: `${-28 + (i * 13) % 56}px`,
    size: i % 3 === 0 ? 2.5 : i % 3 === 1 ? 1.8 : 1.2,
  }))

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
      aria-hidden="true"
    >
      {/* Top-center spotlight — warm glow from above */}
      <div style={{
        position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 420,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.2) 0%, transparent 68%)',
        filter: 'blur(45px)',
      }} />

      {/* Drift orbs */}
      <div style={{ position: 'absolute', top: '2%', left: '2%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 68%)', filter: 'blur(55px)', animation: 'orb-drift-1 20s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: '42%', right: '-4%', width: 580, height: 580, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.11) 0%, transparent 68%)', filter: 'blur(65px)', animation: 'orb-drift-2 27s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-6%', left: '18%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,146,60,0.1) 0%, transparent 68%)', filter: 'blur(60px)', animation: 'orb-drift-3 35s ease-in-out infinite' }} />

      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(rgba(249,115,22,0.032) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(249,115,22,0.032) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        animation: 'grid-fade 9s ease-in-out infinite',
      }} />

      {/* Scan line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.1) 25%, rgba(249,115,22,0.32) 50%, rgba(249,115,22,0.1) 75%, transparent 100%)',
        animation: 'line-scan 11s linear infinite',
        animationDelay: '1s',
      }} />

      {/* Floating sparks */}
      {sparks.map(s => (
        <div key={s.id} style={{
          position: 'absolute', left: s.left, top: s.top,
          width: s.size, height: s.size, borderRadius: '50%',
          backgroundColor: '#f97316',
          boxShadow: `0 0 ${s.size * 4}px rgba(249,115,22,0.95)`,
          '--dx': s.dx,
          animation: `spark-float ${s.dur} ease-in-out infinite`,
          animationDelay: s.delay,
          opacity: 0,
        }} />
      ))}

      {/* Edge vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 35%, transparent 30%, rgba(9,9,11,0.72) 100%)',
      }} />
    </div>
  )
}

function TickerBar({ lang }) {
  const tr = [
    'SYS.DURUM: AKTİF',
    'ENLEM: 41.2867° K',
    'BOYLAM: 36.3300° D',
    'BÖLGE: TR-55',
    'USTALAR: 2.847',
    'BUGÜNKÜ İŞLER: 1.203',
    'ORT. PUAN: 4.7★',
    'ÇALIŞMA SÜRESİ: %99.98',
  ]
  const en = [
    'SYS.STATUS: ONLINE',
    'LAT: 41.2867° N',
    'LON: 36.3300° E',
    'REGION: TR-55',
    'MECHANICS: 2,847',
    'JOBS TODAY: 1,203',
    'AVG RATING: 4.7★',
    'UPTIME: 99.98%',
  ]
  const items = lang === 'tr' ? tr : en
  const doubled = [...items, ...items]

  return (
    <div
      className="-mx-3 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-8 mb-0 bg-black border-b border-zinc-900/80 overflow-hidden"
      style={{ height: 38 }}
    >
      <div
        className="flex items-center h-full"
        style={{ animation: 'ticker 40s linear infinite', width: 'max-content' }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-6 font-mono text-[11px] text-zinc-500 whitespace-nowrap"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function MechanicCard({ name, rating, reviews, distance, specialties, response, price, status, city, lang }) {
  const isOnline = status === 'ONLINE' || status === 'ÇEVRİMİÇİ'
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-white text-sm">{name}</h4>
          <p className="text-xs text-zinc-500 mt-0.5">{city}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-1 rounded border ${
            isOnline
              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
              : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
          {status}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
        <span className="text-sm font-bold text-white">{rating}</span>
        <span className="text-xs text-zinc-600">
          ({reviews} {lang === 'tr' ? 'yorum' : 'reviews'})
        </span>
        <span className="text-zinc-700 mx-1">·</span>
        <span className="text-xs text-zinc-500">{distance}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {specialties.map(s => (
          <span key={s} className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            {s}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {response}
          </span>
          <span className="font-semibold text-zinc-300">{price}</span>
        </div>
        <Link
          to="/register?role=owner"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
        >
          {lang === 'tr' ? 'Teklif İste' : 'Get Quote'}
        </Link>
      </div>
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-zinc-900/80 last:border-b-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between py-4 text-left group"
      >
        <span className={`text-sm pr-6 leading-snug transition-colors ${open ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
          {q}
        </span>
        <span className="text-zinc-700 text-xl leading-none mt-0 shrink-0 select-none group-hover:text-zinc-500 transition-colors">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className="pb-4 text-sm text-zinc-600 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { lang } = useLang()
  const tr = lang === 'tr'

  useMeta(
    "Torqvia — Samsun'un Oto Servis Platformu",
    "Samsun'da araç sahipleri ve servis ustalarını buluşturan platform. İlanını ver, usta bul, işi yaptır.",
  )

  const mechanics = tr
    ? [
        { name: 'Ahmet Oto Tamiri', rating: 4.9, reviews: 127, distance: '3.2 km', specialties: ['Motor', 'Elektrik', 'Genel Bakım'], response: '≈15 dk', price: '₺450–800', status: 'ÇEVRİMİÇİ', city: 'Samsun / Atakum' },
        { name: 'Mersin Kaporta & Boya', rating: 4.8, reviews: 89, distance: '5.1 km', specialties: ['Kaporta', 'Boya', 'Eksper'], response: '≈30 dk', price: '₺800–2.000', status: 'ÇEVRİMİÇİ', city: 'Samsun / İlkadım' },
        { name: 'Tuğrul Lastik Merkezi', rating: 4.7, reviews: 234, distance: '1.8 km', specialties: ['Lastik', 'Jant', 'Balans'], response: '≈10 dk', price: '₺200–500', status: 'MEŞGUL', city: 'Samsun / Canik' },
      ]
    : [
        { name: 'Ahmet Auto Repair', rating: 4.9, reviews: 127, distance: '3.2 km', specialties: ['Engine', 'Electric', 'General'], response: '≈15 min', price: '₺450–800', status: 'ONLINE', city: 'Samsun / Atakum' },
        { name: 'Mersin Body & Paint', rating: 4.8, reviews: 89, distance: '5.1 km', specialties: ['Body', 'Paint', 'Expert'], response: '≈30 min', price: '₺800–2,000', status: 'ONLINE', city: 'Samsun / İlkadım' },
        { name: 'Tuğrul Tire Center', rating: 4.7, reviews: 234, distance: '1.8 km', specialties: ['Tires', 'Rims', 'Balancing'], response: '≈10 min', price: '₺200–500', status: 'BUSY', city: 'Samsun / Canik' },
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

  const features = tr
    ? [
        { icon: Shield, title: 'Doğrulanmış Ustalar', desc: 'Her usta kimlik ve belge doğrulamasından geçiyor. Güvenli hizmet garantisi.' },
        { icon: CheckCircle, title: 'Şeffaf Fiyatlandırma', desc: 'Gizli ücret yok. İş başlamadan önce fiyatı bilirsin.' },
        { icon: Star, title: 'Gerçek Yorumlar', desc: 'Tüm yorumlar gerçek hizmet sonrası yazılıyor. Manipüle edilemez.' },
        { icon: Clock, title: 'Hızlı Yanıt', desc: 'Ortalama 15 dakikada ilk teklifini al. Vakit kaybetme.' },
      ]
    : [
        { icon: Shield, title: 'Verified Mechanics', desc: 'Every mechanic passes identity and certification verification.' },
        { icon: CheckCircle, title: 'Transparent Pricing', desc: 'No hidden fees. Know the price before the job starts.' },
        { icon: Star, title: 'Real Reviews', desc: 'All reviews are written after real services. Cannot be manipulated.' },
        { icon: Clock, title: 'Fast Response', desc: 'Get your first quote in an average of 15 minutes.' },
      ]

  const plans = [
    {
      name: tr ? 'Ücretsiz' : 'Free',
      price: '₺0',
      period: tr ? '/ ay' : '/ mo',
      features: tr
        ? ['Profil oluştur', '5 randevu / ay', 'Temel özellikler']
        : ['Create profile', '5 appointments / mo', 'Basic features'],
      accent: 'border-zinc-800',
      popular: false,
      cta: tr ? 'Başla' : 'Get Started',
      to: '/register',
    },
    {
      name: 'Pro',
      price: '₺80',
      period: tr ? '/ ay' : '/ mo',
      features: tr
        ? ["Ücretsiz'in her şeyi", 'Sınırsız randevu', 'Öncelikli listeleme', 'Analitik', 'Onaylı rozet']
        : ['Everything in Free', 'Unlimited appointments', 'Priority listing', 'Analytics', 'Verified badge'],
      accent: 'border-brand-500/50',
      popular: true,
      cta: tr ? "Pro'ya Geç" : 'Get Pro',
      to: '/register',
    },
    {
      name: 'Turbo',
      price: '₺200',
      period: tr ? '/ ay' : '/ mo',
      features: tr
        ? ["Pro'nun her şeyi", 'Spotlight listeleme', 'Öncelikli destek', 'Özel rozet']
        : ["Everything in Pro", 'Spotlight listing', 'Priority support', 'Custom badge'],
      accent: 'border-orange-500/40',
      popular: false,
      cta: tr ? "Turbo'ya Geç" : 'Get Turbo',
      to: '/register',
    },
  ]

  const faqItems = tr
    ? [
        { q: 'Torqvia nasıl çalışır?', a: 'Araç sorununu ilan olarak paylaşırsın, bölgendeki doğrulanmış ustalar sana teklif gönderir. Teklifleri karşılaştırıp uygun olanı seçersin, usta işe gelir.' },
        { q: 'Servis ücretleri nasıl belirleniyor?', a: 'Ücretler ustalar tarafından belirlenir. Platform üzerinden şeffaf teklifler alırsın. Gizli ücret veya platform komisyonu yoktur.' },
        { q: 'Ustaları nasıl doğruluyorsunuz?', a: 'Her servis uzmanı kayıt sırasında kimlik ve belge doğrulamasından geçiyor. Ek olarak kullanıcı yorumları sürekli izleniyor.' },
        { q: 'Sorun yaşarsam ne olur?', a: 'Bir anlaşmazlık durumunda destek ekibimiz 24 saat içinde devreye girer. Kullanıcı memnuniyeti her şeyden önce gelir.' },
        { q: 'Torqvia hangi şehirlerde hizmet veriyor?', a: "Şu an Samsun'da aktif olarak hizmet veriyoruz. Yakında Türkiye'nin diğer şehirlerine de genişliyoruz." },
      ]
    : [
        { q: 'How does Torqvia work?', a: 'You post your car problem as a listing, and verified mechanics in your area send you quotes. You compare offers and choose the best one.' },
        { q: 'How are service fees determined?', a: 'Fees are set by the mechanics themselves. You receive transparent quotes through the platform. No hidden fees or commissions.' },
        { q: 'How do you verify mechanics?', a: 'Every service professional goes through identity and certification verification at registration. User reviews are also continuously monitored.' },
        { q: 'What happens if something goes wrong?', a: 'In case of a dispute, our support team steps in within 24 hours. User satisfaction is our priority.' },
        { q: 'Which cities does Torqvia serve?', a: 'We are currently active in Samsun. We are expanding to other cities in Turkey soon.' },
      ]

  const stats = tr
    ? [
        { num: '2.847', label: 'AKTİF USTA' },
        { num: '1.203', label: 'BUGÜNKÜ İŞ' },
        { num: '4.7★', label: 'ORT. PUAN' },
        { num: '%99.9', label: 'ÇALIŞMA SÜRESİ' },
      ]
    : [
        { num: '2,847', label: 'ACTIVE MECHANICS' },
        { num: '1,203', label: 'JOBS TODAY' },
        { num: '4.7★', label: 'AVG RATING' },
        { num: '99.9%', label: 'UPTIME' },
      ]

  const proFeatures = tr
    ? [
        'Aylık yüzlerce açık ilana ulaş',
        'Profilini ve çalışmalarını sergile',
        'Hedefli teklifler gönder',
        "Turbo ile sınırsız teklif gönder",
      ]
    : [
        'Access hundreds of open listings monthly',
        'Showcase your profile and work samples',
        'Send targeted offers',
        'Upgrade to Turbo for unlimited offers',
      ]

  return (
    <div>
      <HomeBackground />
      {/* ── Ticker Bar ── */}
      <TickerBar lang={lang} />

      {/* ── Hero ── */}
      <section className="text-center py-10 sm:py-14">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {tr ? "SAMSUN'DA #1 OTO SERVİS PLATFORMU" : '#1 AUTO SERVICE PLATFORM IN SAMSUN'}
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white mb-5 leading-[1.08] tracking-tight">
            {tr ? (
              <>Güvenilir bir<br /><span className="text-brand-400">usta bul</span></>
            ) : (
              <>Find a mechanic<br /><span className="text-brand-400">you can trust</span></>
            )}
          </h1>

          <p className="text-zinc-400 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            {tr
              ? 'Araç sorununu anlat, bölgenizdeki doğrulanmış ustalarla eşleş, fiyatları karşılaştır ve rezervasyon yap — 2 dakikadan az sürede.'
              : 'Describe your car problem, get matched with nearby verified mechanics, compare transparent prices, and book — all in under 2 minutes.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Link to="/feed" className="btn-primary flex items-center gap-2 text-base px-6 py-3">
                {tr ? 'Akışa Git' : 'Go to Feed'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/register?role=owner" className="btn-primary flex items-center gap-2 text-base px-6 py-3">
                  {tr ? 'Servis Talep Et' : 'Request Service'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how-it-works" className="btn-secondary text-base px-6 py-3">
                  {tr ? 'Nasıl Çalışır →' : 'See how it works →'}
                </a>
              </>
            )}
          </div>

          {!user && (
            <p className="mt-4 text-sm text-zinc-600">
              {tr ? 'Hesabın var mı?' : 'Already have an account?'}{' '}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
                {tr ? 'Giriş yap' : 'Sign in'}
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-16 border-t border-zinc-900">
        <SectionLabel text={tr ? '// NASIL ÇALIŞIR' : '// HOW IT WORKS'} />
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-12">
          {tr ? 'Üç adımda çözüme kavuş' : 'Three steps to a fixed car'}
        </h2>

        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.num} className="relative">
              <div className="text-7xl font-black text-zinc-900 leading-none mb-4 select-none tabular-nums">
                {step.num}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-8 -right-4 text-zinc-800 text-xl font-light pointer-events-none">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Mechanics ── */}
      <section className="py-16 border-t border-zinc-900">
        <div className="flex items-end justify-between mb-10">
          <div>
            <SectionLabel text={tr ? '// CANLI USTALAR' : '// LIVE MECHANICS'} />
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {tr ? 'Bölgende aktif ustalar' : 'Active mechanics near you'}
            </h2>
          </div>
          {!user && (
            <Link
              to="/register"
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors hidden sm:flex items-center gap-1"
            >
              {tr ? 'Tümünü Gör →' : 'View All →'}
            </Link>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {mechanics.map((m, i) => (
            <MechanicCard key={i} {...m} lang={lang} />
          ))}
        </div>
      </section>

      {/* ── Trust & Transparency ── */}
      <section className="py-16 border-t border-zinc-900">
        <SectionLabel text={tr ? '// GÜVEN & ŞEFFAFLIK' : '// TRUST & TRANSPARENCY'} />
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-10">
          {tr ? 'Neden Torqvia?' : 'Why Torqvia?'}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-brand-400" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-2">{title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── For Service Professionals ── */}
      <section className="py-16 border-t border-zinc-900">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionLabel text={tr ? '// SERVİS UZMANLARI İÇİN' : '// FOR SERVICE PROFESSIONALS'} />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              {tr ? 'Müşteri tabanını büyüt' : 'Grow your customer base'}
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              {tr
                ? '10 dükkan aramaktan bıktın mı? Torqvia ile müşteriler seni bulur. Her gün yüzlerce araç sahibi usta arıyor.'
                : 'Tired of hunting for customers? With Torqvia, customers find you. Hundreds of car owners search for mechanics every day.'}
            </p>
            <ul className="space-y-2.5 mb-8">
              {proFeatures.map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-300">
                  <CheckCircle className="h-4 w-4 text-brand-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/register?role=pro" className="btn-secondary inline-flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              {tr ? 'Usta Olarak Başvur →' : 'Apply as a Professional →'}
            </Link>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
            <div className="grid grid-cols-2 gap-4">
              {stats.map(({ num, label }) => (
                <div key={label} className="text-center p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <div className="text-2xl font-black text-white mb-1">{num}</div>
                  <div className="text-[10px] text-zinc-600 font-mono tracking-wider">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-16 border-t border-zinc-900">
        <div className="text-center mb-10">
          <SectionLabel text={tr ? '// ÜYELİK PLANLARI' : '// MEMBERSHIP PLANS'} />
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {tr ? 'Sana uygun planı seç' : 'Choose the plan that fits you'}
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`relative bg-zinc-900 border ${plan.accent} rounded-2xl p-6 flex flex-col transition-colors ${
                plan.popular ? 'scale-[1.03]' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-bold bg-brand-500 text-white px-3 py-1 rounded-full whitespace-nowrap">
                    {tr ? 'EN POPÜLER' : 'MOST POPULAR'}
                  </span>
                </div>
              )}
              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
              <div className="flex items-end gap-1 mb-5">
                <span className="text-3xl font-black text-white">{plan.price}</span>
                <span className="text-zinc-500 text-sm mb-0.5">{plan.period}</span>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={user ? '/pricing' : plan.to}
                className={`text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${
                  plan.popular
                    ? 'bg-brand-500 text-white hover:bg-brand-600'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link to="/pricing" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            {tr ? 'Tüm plan detaylarını gör →' : 'See all plan details →'}
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 border-t border-zinc-900 max-w-2xl">
        <SectionLabel text={tr ? '// SSS' : '// FAQ'} />
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
          {tr ? 'Sık Sorulan Sorular' : 'Frequently Asked Questions'}
        </h2>

        <div className="border border-zinc-900 rounded-xl overflow-hidden">
          {faqItems.map((item, i) => (
            <div key={i} className="px-5">
              <FAQItem {...item} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
