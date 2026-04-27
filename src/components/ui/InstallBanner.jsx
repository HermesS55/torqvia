import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const DISMISSED_KEY = 'torqvia_install_dismissed'

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
}

function detectPlatform() {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return null
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [platform, setPlatform] = useState(null)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem(DISMISSED_KEY)) return
    const p = detectPlatform()
    if (!p) return
    setPlatform(p)
    setVisible(true)

    const handler = e => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') dismiss()
    setDeferredPrompt(null)
  }

  if (!visible) return null

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex items-center gap-3">
      <img src="/torqvia-logo.png?v=2" alt="" className="h-8 w-8 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">Torqvia'yı Ana Ekrana Ekle</p>
        {platform === 'ios' && (
          <p className="text-xs text-zinc-400 mt-0.5">
            Safari'de{' '}
            <span className="text-zinc-200 font-medium">Paylaş</span>
            {' '}→{' '}
            <span className="text-zinc-200 font-medium">Ana Ekrana Ekle</span>
            {' '}→{' '}
            <span className="text-zinc-200 font-medium">Ekle</span>
          </p>
        )}
        {platform === 'android' && !deferredPrompt && (
          <p className="text-xs text-zinc-400 mt-0.5">
            Chrome menü (⋮) →{' '}
            <span className="text-zinc-200 font-medium">Ana ekrana ekle</span>
          </p>
        )}
        {platform === 'android' && deferredPrompt && (
          <p className="text-xs text-zinc-400 mt-0.5">Uygulamayı yüklemek için butona dokun</p>
        )}
      </div>
      {platform === 'android' && deferredPrompt && (
        <button
          onClick={handleInstall}
          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors"
        >
          Ekle
        </button>
      )}
      <button
        onClick={dismiss}
        className="shrink-0 p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        aria-label="Kapat"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
