export default function TorqviaLogoV5({ size = 40 }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="v5-orange" x1="10" y1="22" x2="54" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <filter id="v5-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#f97316" floodOpacity="0.35" />
        </filter>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#18181b" />
      <rect x="10" y="15" width="44" height="13" rx="6.5" fill="url(#v5-orange)" filter="url(#v5-glow)" />
      <rect x="27" y="28" width="10" height="24" rx="5" fill="white" />
      <rect x="2" y="2" width="60" height="60" rx="14" stroke="white" strokeOpacity="0.05" strokeWidth="1" fill="none" />
    </svg>
  )
}
