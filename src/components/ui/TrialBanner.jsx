import { Clock, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function TrialBanner({ daysLeft, trialEnded }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  if (trialEnded) {
    return (
      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border-b border-red-500/20">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-sm text-zinc-300 truncate">
              <span className="font-semibold text-red-400">Deneme süreniz sona erdi.</span>{' '}
              Free planda yalnızca 3 talep iletişim bilgisine erişebilirsin.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/pricing"
              className="flex items-center gap-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <Zap className="h-3 w-3" />
              Turbo&apos;ya Geç
            </Link>
            <button onClick={() => setDismissed(true)} className="text-zinc-600 hover:text-zinc-400 transition-colors p-0.5">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (daysLeft > 0 && daysLeft <= 3) {
    return (
      <div className="bg-gradient-to-r from-orange-900/30 to-amber-900/20 border-b border-orange-500/20">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="h-4 w-4 text-orange-400 shrink-0" />
            <p className="text-sm text-zinc-300 truncate">
              <span className="font-semibold text-orange-400">Deneme süreniz {daysLeft} gün sonra bitiyor.</span>{' '}
              Turbo avantajlarını kaybetmemek için plan seçin.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/pricing"
              className="flex items-center gap-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <Zap className="h-3 w-3" />
              Plan Seç
            </Link>
            <button onClick={() => setDismissed(true)} className="text-zinc-600 hover:text-zinc-400 transition-colors p-0.5">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
