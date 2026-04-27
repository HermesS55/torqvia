export default function TorqviaLogoV7({ size = 40 }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" width={size} height={size} aria-hidden="true">
      <defs>
        <radialGradient id="v7-bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#27272a" />
          <stop offset="100%" stopColor="#09090b" />
        </radialGradient>
        <linearGradient id="v7-t" x1="10" y1="18" x2="54" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <filter id="v7-glow" x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#f97316" floodOpacity="0.7" />
        </filter>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#v7-bg)" />
      <rect x="10" y="16" width="44" height="12" rx="6" fill="url(#v7-t)" filter="url(#v7-glow)" />
      <rect x="26.5" y="28" width="11" height="22" rx="5.5" fill="url(#v7-t)" filter="url(#v7-glow)" />
      <rect x="2" y="2" width="60" height="60" rx="14" stroke="#f97316" strokeOpacity="0.12" strokeWidth="1" fill="none" />
    </svg>
  )
}
