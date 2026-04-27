import { Link } from 'react-router-dom'
import { Wrench, ArrowRight, Shield, Zap, Users, Car } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useMeta } from '../hooks/useMeta'
import TorqviaLogo from '../components/ui/TorqviaLogo'

export default function Home() {
  const { user } = useAuth()
  useMeta(
    'Torqvia — Araç Sahipleri ve Servis Uzmanları için Oto Topluluğu',
    'Torqvia; araç sahiplerini ve servis uzmanlarını buluşturan Türkiye\'nin otomotiv topluluk platformu. Servis ilanı ver, teklif al, topluluğa katıl.',
  )

  return (
    <div className="py-12">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl px-5 py-3">
            <TorqviaLogo size={36} />
            <div className="text-left">
              <span className="text-xl font-bold text-white tracking-tight">Torqvia</span>
              <p className="text-[10px] text-zinc-500 tracking-widest uppercase">Otomotiv Topluluğu</p>
            </div>
          </div>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight">
          Aracını doğru ustayla<br />
          <span className="text-brand-400">buluştur</span>
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg mb-8 max-w-xl mx-auto">
          Torqvia, araç sahiplerini doğrulanmış servis uzmanlarıyla buluşturuyor. İlanını ver, teklifleri karşılaştır, işi yaptır.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link to="/feed" className="btn-primary flex items-center gap-2 text-base px-6 py-3">
              Akışa Git
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-6 py-3">
                Ücretsiz Başla
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="btn-secondary text-base px-6 py-3">
                Giriş Yap
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-16">
        <div className="card border-brand-500/20 hover:border-brand-500/40 transition-colors">
          <div className="bg-brand-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Car className="h-6 w-6 text-brand-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Araç Sahipleri İçin</h3>
          <p className="text-zinc-500 text-sm mb-4">Aracını listele, ne ihtiyacın olduğunu anlat ve bölgenizdeki uzman servis sağlayıcılarından rekabetçi teklifler al.</p>
          <ul className="space-y-1.5 text-sm text-zinc-400">
            {['Dakikalar içinde ilan oluştur', 'Teklifleri karşılaştır', 'Tek tıkla kabul veya reddet'].map(item => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-brand-500 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="card border-zinc-700/50 hover:border-zinc-600 transition-colors">
          <div className="bg-zinc-800 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Wrench className="h-6 w-6 text-zinc-300" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Servis Uzmanları İçin</h3>
          <p className="text-zinc-500 text-sm mb-4">Araç ilanlarına göz at, becerilerinle örtüşen işler bul ve Torqvia aracılığıyla müşteri portföyünü büyüt.</p>
          <ul className="space-y-1.5 text-sm text-zinc-400">
            {['Tüm açık ilanlara göz at', 'Hedefli teklifler gönder', 'Teklif sürecini takip et'].map(item => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-zinc-500 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { icon: Shield, title: 'Güvenli', desc: 'Şifreli iletişim ve doğrulanmış hesaplar' },
          { icon: Zap, title: 'Hızlı', desc: 'İlan verdikten saatler içinde ilk teklifini al' },
          { icon: Users, title: 'Topluluk', desc: 'Türkiye genelinde büyüyen araç sahibi ve uzman ağı' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="p-6">
            <Icon className="h-6 w-6 text-brand-400 mx-auto mb-3" />
            <h4 className="font-semibold text-white mb-1">{title}</h4>
            <p className="text-xs text-zinc-500">{desc}</p>
          </div>
        ))}
      </div>

      {/* SEO text content */}
      <div className="mt-16 text-center max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-white mb-3">Türkiye'nin Oto Topluluğu</h2>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Torqvia; motor tamiri, kaporta, boya, elektrik, lastik, süspansiyon ve daha fazlası için araç sahiplerini alanında uzman servis profesyonelleriyle bir araya getiriyor. Servis ilanı oluştur, farklı ustalardan teklif al, en uygun fiyatı seç.
        </p>
      </div>
    </div>
  )
}
