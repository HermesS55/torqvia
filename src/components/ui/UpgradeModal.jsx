import { X, Lock, Zap, MessageCircle, Send, Calendar, BarChart2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const CONFIGS = {
  talep_iletisim: {
    title: 'İletişim Bilgisi Kilitli',
    desc: 'İlan sahibinin telefon numarasını ve tam adını görmek için Turbo plana geçin.',
    plan: 'Turbo',
    price: '299',
    perks: ['Sınırsız talep iletişim bilgisi', 'Müşterilerle mesajlaşma', 'Sınırsız teklif gönderme', 'Randevu yönetimi'],
  },
  messaging: {
    title: 'Mesajlaşma Kilitli',
    desc: 'Müşterilerle doğrudan mesajlaşmak için Turbo plana geçin.',
    plan: 'Turbo',
    price: '299',
    perks: ['Sınırsız mesajlaşma', 'Tüm talep iletişim bilgileri', 'Teklif gönderme', 'Randevu yönetimi'],
  },
  offer_send: {
    title: 'Teklif Gönderme Kilitli',
    desc: 'Servis teklifi göndermek ve iş almak için Turbo plana geçin.',
    plan: 'Turbo',
    price: '299',
    perks: ['Sınırsız teklif gönderme', 'Talep iletişim bilgileri', 'Mesajlaşma', 'Randevu yönetimi'],
  },
  appointments: {
    title: 'Randevular Kilitli',
    desc: 'Randevu yönetimini kullanmak için Turbo plana geçin.',
    plan: 'Turbo',
    price: '299',
    perks: ['Randevu yönetimi', 'Teklif gönderme', 'Mesajlaşma', 'Talep iletişim bilgileri'],
  },
  analytics: {
    title: 'Analitik Kilitli',
    desc: 'Rakip kıyaslama, talep hunisi ve detaylı raporlar için Elite plana geçin.',
    plan: 'Elite',
    price: '599',
    perks: ['Rakip kıyaslama', 'Talep hunisi analizi', 'En çok aranan hizmetler', 'Öncelikli destek'],
  },
  stats: {
    title: 'İstatistikler Kilitli',
    desc: 'Profil görüntülenme ve dönüşüm istatistiklerini görmek için Turbo plana geçin.',
    plan: 'Turbo',
    price: '299',
    perks: ['Profil görüntülenme sayısı', 'Servis talebi sayısı', 'Dönüşüm oranı', 'Aylık karşılaştırma'],
  },
}

const FEATURE_ICONS = {
  talep_iletisim: Lock,
  messaging: MessageCircle,
  offer_send: Send,
  appointments: Calendar,
  analytics: BarChart2,
  stats: BarChart2,
}

export default function UpgradeModal({ feature = 'talep_iletisim', onClose }) {
  const cfg = CONFIGS[feature] || CONFIGS.talep_iletisim
  const Icon = FEATURE_ICONS[feature] || Lock
  const isElite = cfg.plan === 'Elite'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className={`h-0.5 w-full ${isElite ? 'bg-gradient-to-r from-violet-500 to-amber-400' : 'bg-gradient-to-r from-orange-500 to-red-500'}`} />

        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isElite ? 'bg-violet-500/15' : 'bg-orange-500/15'}`}>
              <Icon className={`h-4 w-4 ${isElite ? 'text-amber-400' : 'text-orange-400'}`} />
            </div>
            <span className="font-bold text-white text-sm">{cfg.title}</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-zinc-400 text-sm mb-5 leading-relaxed">{cfg.desc}</p>

          <ul className="space-y-2 mb-6">
            {cfg.perks.map((perk, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-zinc-300">
                <div className="h-4 w-4 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                </div>
                {perk}
              </li>
            ))}
          </ul>

          <Link
            to="/pricing"
            onClick={onClose}
            className={`w-full flex items-center justify-center gap-2 text-white font-semibold rounded-xl px-4 py-3 text-sm hover:opacity-90 transition-opacity
              ${isElite ? 'bg-gradient-to-r from-violet-500 to-amber-400' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}
          >
            <Zap className="h-4 w-4" />
            {cfg.plan}&apos;ya Geç — {cfg.price}₺/ay
          </Link>
          <p className="text-center text-zinc-600 text-xs mt-3">14 gün ücretsiz deneme · İptal istediğin zaman</p>
        </div>
      </div>
    </div>
  )
}
