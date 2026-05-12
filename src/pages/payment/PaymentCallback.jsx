import { useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function PaymentCallback() {
  const { pathname } = useLocation()
  const { refetchProfile } = useAuth()
  const success      = pathname.startsWith('/payment/success')
  const fetched      = useRef(false)

  useEffect(() => {
    if (success && !fetched.current) {
      fetched.current = true
      refetchProfile()
    }
  }, [success, refetchProfile])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 text-center px-4">
      {success ? (
        <>
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Ödeme Tamamlandı</h2>
            <p className="text-zinc-400 text-sm">
              Üyeliğin aktifleştirildi. Artık tüm avantajlardan yararlanabilirsin.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard" className="btn-primary">Dashboard'a Git</Link>
            <Link to="/pricing" className="btn-secondary">Planlar</Link>
          </div>
        </>
      ) : (
        <>
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Ödeme Başarısız</h2>
            <p className="text-zinc-400 text-sm">
              Ödeme işlemi tamamlanamadı. Kart bilgilerini kontrol edip tekrar deneyebilirsin.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/pricing" className="btn-primary">Tekrar Dene</Link>
            <Link to="/" className="btn-secondary">Ana Sayfa</Link>
          </div>
        </>
      )}
    </div>
  )
}
