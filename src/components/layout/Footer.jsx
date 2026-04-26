import { Link } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import TorqviaLogo from '../ui/TorqviaLogo'

export default function Footer() {
  const { lang } = useLang()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
            <TorqviaLogo size={28} />
            Torqvia
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500">
            <Link to="/terms"   className="hover:text-zinc-300 transition-colors">
              {lang === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service'}
            </Link>
            <Link to="/privacy" className="hover:text-zinc-300 transition-colors">
              {lang === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}
            </Link>
            <Link to="/refund"  className="hover:text-zinc-300 transition-colors">
              {lang === 'tr' ? 'İade Politikası' : 'Refund Policy'}
            </Link>
            <a href="mailto:destek@torqvia.com" className="hover:text-zinc-300 transition-colors">
              destek@torqvia.com
            </a>
          </nav>

          <p className="text-xs text-zinc-700">
            © {year} Torqvia. {lang === 'tr' ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  )
}
