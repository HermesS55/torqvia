import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const on  = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  if (!offline) return null

  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400">
      <WifiOff className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
      İnternet bağlantısı yok — önbelleğe alınan içerikler gösteriliyor
    </div>
  )
}
