import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'

export default function ComingSoon() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="card max-w-md w-full text-center p-10">
        <div className="flex justify-center mb-5">
          <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20">
            <Clock className="h-8 w-8 text-brand-400" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Bu özellik yakında</h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          Şu an Torqvia'nın oto servis platformu kısmı aktif. Topluluk özellikleri yakında geliyor.
        </p>
        <Link to="/listings" className="btn-primary inline-flex items-center gap-2">
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  )
}
