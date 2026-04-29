import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'

export default function PaymentCallback() {
  const { pathname } = useLocation()
  const success = pathname === '/payment/success'

  useEffect(() => {
    // Pricing iframe'ine sonucu bildir
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ paytr: success ? 'success' : 'failed' }, '*')
    }
  }, [success])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      {success ? (
        <>
          <CheckCircle className="h-16 w-16 text-green-400" />
          <h2 className="text-xl font-bold text-white">Ödeme Tamamlandı</h2>
          <p className="text-zinc-400 text-sm">Üyeliğin aktifleştiriliyor...</p>
        </>
      ) : (
        <>
          <XCircle className="h-16 w-16 text-red-400" />
          <h2 className="text-xl font-bold text-white">Ödeme Başarısız</h2>
          <p className="text-zinc-400 text-sm">Lütfen tekrar deneyin.</p>
        </>
      )}
    </div>
  )
}
