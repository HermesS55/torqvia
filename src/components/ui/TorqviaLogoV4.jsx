export default function TorqviaLogoV4({ size = 40 }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="v4-bg" x1="32" y1="4" x2="32" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
        <linearGradient id="v4-bd" x1="8" y1="4" x2="56" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="v4-shine" x1="32" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.13" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <filter id="v4-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#f97316" floodOpacity="0.4" />
        </filter>
      </defs>
      <path d="M8 5 L56 5 L59 30 L32 62 L5 30 Z" fill="url(#v4-bg)" filter="url(#v4-glow)" />
      <path d="M8 5 L56 5 L59 30 L32 62 L5 30 Z" fill="url(#v4-shine)" />
      <path d="M8 5 L56 5 L59 30 L32 62 L5 30 Z" stroke="url(#v4-bd)" strokeWidth="2" fill="none" />
      <rect x="14" y="13" width="36" height="11" rx="5.5" fill="white" />
      <rect x="27" y="24" width="10" height="26" rx="5" fill="white" />
    </svg>
  )
}
