import { Link } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import TorqviaLogo from '../ui/TorqviaLogo'

export default function Footer() {
  const { lang } = useLang()
  const tr = lang === 'tr'
  const year = new Date().getFullYear()

  const cols = tr
    ? [
        {
          heading: 'Platform',
          links: [
            { label: 'İlanlar', to: '/listings' },
            { label: 'Satılık Araçlar', to: '/sales' },
            { label: 'Üyelik Planları', to: '/pricing' },
            { label: 'Dashboard', to: '/dashboard' },
          ],
        },
        {
          heading: 'Usta mısın?',
          links: [
            { label: 'Usta Olarak Başvur', to: '/register?role=pro' },
            { label: 'Nasıl Çalışır', href: '/#how-it-works' },
            { label: 'Planlar', to: '/pricing' },
          ],
        },
        {
          heading: 'Yasal',
          links: [
            { label: 'Kullanım Koşulları', to: '/terms' },
            { label: 'Gizlilik Politikası', to: '/privacy' },
            { label: 'İade Politikası', to: '/refund' },
          ],
        },
      ]
    : [
        {
          heading: 'Platform',
          links: [
            { label: 'Listings', to: '/listings' },
            { label: 'Car Sales', to: '/sales' },
            { label: 'Membership Plans', to: '/pricing' },
            { label: 'Dashboard', to: '/dashboard' },
          ],
        },
        {
          heading: 'Are you a pro?',
          links: [
            { label: 'Apply as a Professional', to: '/register?role=pro' },
            { label: 'How It Works', href: '/#how-it-works' },
            { label: 'Plans', to: '/pricing' },
          ],
        },
        {
          heading: 'Legal',
          links: [
            { label: 'Terms of Service', to: '/terms' },
            { label: 'Privacy Policy', to: '/privacy' },
            { label: 'Refund Policy', to: '/refund' },
          ],
        },
      ]

  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Top row: brand + columns */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <TorqviaLogo size={28} />
              Torqvia
            </Link>
            <p className="text-xs text-zinc-600 leading-relaxed mb-3 max-w-[200px]">
              {tr
                ? "Samsun'da araç sahipleri ve servis ustalarını buluşturan platform."
                : 'The platform connecting car owners with trusted service professionals in Samsun.'}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {tr ? 'TÜM SİSTEMLER AKTİF' : 'ALL SYSTEMS OPERATIONAL'}
            </div>
          </div>

          {/* Link columns */}
          {cols.map(col => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-zinc-900">
          <p className="text-xs text-zinc-700">
            © {year} Torqvia. {tr ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-700">
            <a href="mailto:destek@torqvia.com" className="hover:text-zinc-500 transition-colors">
              destek@torqvia.com
            </a>
            <span className="font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
