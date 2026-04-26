import { Check, Flame, Zap, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PlanBadge from '../components/ui/PlanBadge'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: null,
    desc: 'Topluluğa katıl, temel özellikleri keşfet',
    icon: null,
    accent: 'border-zinc-700',
    btnClass: 'btn-secondary',
    features: [
      { text: 'Profil oluştur', ok: true },
      { text: 'Feed\'i görüntüle & beğen', ok: true },
      { text: 'Metin + fotoğraf paylaşımı', ok: true },
      { text: 'Mesajlaşma', ok: true },
      { text: 'Aylık 5 teklif (servis uzmanı)', ok: true },
      { text: 'Video paylaşımı', ok: false },
      { text: 'İlan öne çıkarma', ok: false },
      { text: 'Profil istatistikleri', ok: false },
    ],
  },
  {
    id: 'turbo',
    name: 'Turbo',
    price: 79,
    period: 'ay',
    desc: 'Aracını ve işini öne çıkar, kitlen büyüsün',
    icon: Flame,
    accent: 'border-orange-500/60',
    glow: 'shadow-[0_0_30px_rgba(249,115,22,0.15)]',
    headerGrad: 'from-orange-500/15 via-red-500/10 to-transparent',
    btnClass: 'bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl px-4 py-2.5 text-sm hover:opacity-90 transition-opacity',
    badge: 'turbo',
    popular: true,
    features: [
      { text: 'Free\'nin tüm özellikleri', ok: true },
      { text: 'Video paylaşımı (maks 50MB)', ok: true },
      { text: 'Sınırsız teklif (servis uzmanı)', ok: true },
      { text: 'Kişiler\'de öncelikli sıralama', ok: true },
      { text: 'Turbo rozeti profilde', ok: true },
      { text: 'Profil görüntülenme istatistiği', ok: true },
      { text: 'İlan öne çıkarma', ok: false },
      { text: 'Verified rozet', ok: false },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 199,
    period: 'ay',
    desc: 'Maksimum görünürlük, eksiksiz araç seti',
    icon: Zap,
    accent: 'border-violet-500/60',
    glow: 'shadow-[0_0_30px_rgba(167,139,250,0.15)]',
    headerGrad: 'from-violet-500/15 via-amber-500/10 to-transparent',
    btnClass: 'bg-gradient-to-r from-violet-500 to-amber-400 text-white font-semibold rounded-xl px-4 py-2.5 text-sm hover:opacity-90 transition-opacity',
    badge: 'elite',
    features: [
      { text: 'Turbo\'nun tüm özellikleri', ok: true },
      { text: 'Video paylaşımı (maks 200MB)', ok: true },
      { text: 'Haftada 3 ilan öne çıkarma', ok: true },
      { text: 'Elite rozeti + altın kenar', ok: true },
      { text: 'Verified rozet', ok: true },
      { text: 'Detaylı analitik paneli', ok: true },
      { text: 'Öncelikli destek', ok: true },
      { text: 'Yakında: özel etkinliklere erişim', ok: true },
    ],
  },
]

function PlanCard({ plan, currentPlan }) {
  const { user } = useAuth()
  const isActive = currentPlan === plan.id
  const Icon = plan.icon

  return (
    <div className={`relative rounded-2xl border bg-zinc-900 flex flex-col overflow-hidden transition-all
      ${plan.accent} ${plan.glow || ''} ${plan.popular ? 'scale-[1.02]' : ''}`}>

      {plan.popular && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500" />
      )}
      {plan.id === 'elite' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-amber-400" />
      )}

      {plan.popular && (
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-0.5 rounded-full">
            EN POPÜLER
          </span>
        </div>
      )}

      {/* Header gradient */}
      {plan.headerGrad && (
        <div className={`absolute inset-0 bg-gradient-to-b ${plan.headerGrad} pointer-events-none`} />
      )}

      <div className="relative p-6 flex flex-col flex-1">
        {/* Plan name & icon */}
        <div className="flex items-center gap-2 mb-3">
          {Icon && (
            <div className={`p-1.5 rounded-lg ${plan.id === 'turbo' ? 'bg-orange-500/15' : 'bg-violet-500/15'}`}>
              <Icon className={`h-4 w-4 ${plan.id === 'turbo' ? 'text-orange-400' : 'text-amber-400'}`} />
            </div>
          )}
          <h3 className="text-lg font-bold text-white">{plan.name}</h3>
          {plan.badge && <PlanBadge plan={plan.badge} size="sm" />}
        </div>

        <p className="text-zinc-500 text-sm mb-5 leading-relaxed">{plan.desc}</p>

        {/* Price */}
        <div className="mb-6">
          {plan.price === 0 ? (
            <span className="text-3xl font-black text-white">Ücretsiz</span>
          ) : (
            <div className="flex items-end gap-1">
              <span className="text-3xl font-black text-white">{plan.price}₺</span>
              <span className="text-zinc-500 text-sm mb-0.5">/ {plan.period}</span>
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2.5 flex-1 mb-6">
          {plan.features.map((f, i) => (
            <li key={i} className={`flex items-start gap-2.5 text-sm ${f.ok ? 'text-zinc-300' : 'text-zinc-600'}`}>
              {f.ok
                ? <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                : <X className="h-4 w-4 text-zinc-700 shrink-0 mt-0.5" />
              }
              {f.text}
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isActive ? (
          <div className="text-center py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm font-medium text-zinc-400">
            Mevcut planın
          </div>
        ) : user ? (
          <button className={`w-full text-center ${plan.btnClass}`} onClick={() => alert('Ödeme sistemi yakında!')}>
            {plan.price === 0 ? 'Mevcut plan' : `${plan.name}\'e Geç`}
          </button>
        ) : (
          <Link to="/register" className={`block w-full text-center ${plan.btnClass}`}>
            Başla
          </Link>
        )}
      </div>
    </div>
  )
}

export default function Pricing() {
  const { profile } = useAuth()
  const currentPlan = profile?.plan || 'free'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-white mb-3">
          Torqvia Üyelikleri
        </h1>
        <p className="text-zinc-400 text-base max-w-lg mx-auto">
          Topluluğun içinde öne çık. Aracını, işini ve tutkunu en iyi şekilde sergile.
        </p>
        {currentPlan !== 'free' && (
          <div className="mt-4 inline-flex items-center gap-2 bg-zinc-800/80 border border-zinc-700 rounded-full px-4 py-1.5 text-sm text-zinc-400">
            Aktif planın: <PlanBadge plan={currentPlan} size="sm" />
          </div>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-5 items-start">
        {PLANS.map(p => <PlanCard key={p.id} plan={p} currentPlan={currentPlan} />)}
      </div>

      {/* FAQ */}
      <div className="mt-14 grid sm:grid-cols-2 gap-5">
        {[
          {
            q: 'İptal edebilir miyim?',
            a: 'Evet, istediğin zaman. Kalan süre boyunca planın avantajlarını kullanmaya devam edersin.',
          },
          {
            q: 'Plan değiştirince ne olur?',
            a: 'Yükseltince anında aktif olur. Düşürünce mevcut dönem sonunda geçer.',
          },
          {
            q: 'Video boyutu sınırı nedir?',
            a: 'Turbo\'da 50MB, Elite\'de 200MB. MP4, MOV ve WEBM formatları desteklenir.',
          },
          {
            q: 'Ödeme güvenli mi?',
            a: 'Evet, tüm ödemeler Stripe altyapısı üzerinden SSL korumalı işlenir.',
          },
        ].map((item, i) => (
          <div key={i} className="card p-5">
            <p className="font-semibold text-white text-sm mb-1.5">{item.q}</p>
            <p className="text-zinc-500 text-sm leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
