import { Link } from 'react-router-dom'
import { Globe } from 'lucide-react'
import TorqviaLogo from '../ui/TorqviaLogo'
import { useLang } from '../../contexts/LangContext'

function AuthBackground() {
  const sparks = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${8 + (i * 7.3) % 84}%`,
    top: `${20 + (i * 13.7) % 60}%`,
    delay: `${(i * 0.7) % 5}s`,
    dur: `${3 + (i * 0.4) % 3}s`,
    dx: `${-30 + (i * 11) % 60}px`,
    size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
  }))

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-zinc-950" />

      <div className="absolute inset-0">
        <div style={{
          position: 'absolute', top: '10%', left: '15%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.13) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'orb-drift-1 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', right: '10%',
          width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.09) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'orb-drift-2 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '45%', right: '30%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,146,60,0.07) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'orb-drift-3 26s ease-in-out infinite',
        }} />
      </div>

      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        animation: 'grid-fade 8s ease-in-out infinite',
      }} />

      <div style={{
        position: 'absolute', left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(249,115,22,0.15) 30%, rgba(249,115,22,0.4) 50%, rgba(249,115,22,0.15) 70%, transparent 100%)',
        animation: 'line-scan 9s linear infinite',
        animationDelay: '2s',
      }} />

      {sparks.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          left: s.left, top: s.top,
          width: s.size, height: s.size,
          borderRadius: '50%',
          backgroundColor: '#f97316',
          boxShadow: `0 0 ${s.size * 3}px rgba(249,115,22,0.8)`,
          '--dx': s.dx,
          animation: `spark-float ${s.dur} ease-in-out infinite`,
          animationDelay: s.delay,
        }} />
      ))}

      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(9,9,11,0.7) 100%)',
      }} />
    </div>
  )
}

export default function AuthCard({ title, subtitle, children, footer }) {
  const { lang, toggle } = useLang()

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-12 relative">
      <AuthBackground />

      {/* Lang toggle — top right */}
      <button
        onClick={toggle}
        title={lang === 'tr' ? 'Switch to English' : "Türkçe'ye geç"}
        className="fixed top-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/80 hover:border-zinc-700 hover:bg-zinc-800/60 backdrop-blur transition-colors text-xs font-medium text-zinc-500 hover:text-zinc-300"
      >
        <Globe className="h-3.5 w-3.5" />
        {lang === 'tr' ? 'EN' : 'TR'}
      </button>

      <div
        className="w-full max-w-md relative z-10"
        style={{ animation: 'fade-up 0.5s ease both' }}
      >
        {/* Logo block */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex flex-col items-center gap-3 group">
            <div className="relative">
              <div style={{
                position: 'absolute', inset: -8, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
                animation: 'logo-glow 3s ease-in-out infinite',
              }} />
              <div style={{
                background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
                borderRadius: '50%',
                padding: 14,
                border: '1px solid rgba(249,115,22,0.25)',
                position: 'relative',
              }}>
                <div style={{ animation: 'logo-glow 3s ease-in-out infinite' }}>
                  <TorqviaLogo size={52} />
                </div>
              </div>
            </div>

            <div className="text-center">
              <span
                className="text-2xl font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #fff 40%, #fb923c 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Torqvia
              </span>
              <p className="text-[11px] text-zinc-600 tracking-[0.18em] uppercase mt-0.5">
                Automotive Community
              </p>
            </div>
          </Link>

          <div className="mt-6 text-center">
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-zinc-400 mt-1 text-sm">{subtitle}</p>}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(24,24,27,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(249,115,22,0.12)',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset',
        }}>
          {children}
        </div>

        {footer && (
          <div className="text-center mt-5 text-sm text-zinc-500">{footer}</div>
        )}
      </div>
    </div>
  )
}
