export default function TorqviaLogoV3({ size = 40 }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="v3-bg" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
        <linearGradient id="v3-border" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="v3-shine" x1="32" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.14" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <clipPath id="v3-clip">
          <path d="M32 4 L60 32 L32 60 L4 32 Z" />
        </clipPath>
        <filter id="v3-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#f97316" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Diamond fill */}
      <path d="M32 4 L60 32 L32 60 L4 32 Z" fill="url(#v3-bg)" filter="url(#v3-glow)" />

      {/* Shine */}
      <path d="M32 4 L60 32 L32 60 L4 32 Z" fill="url(#v3-shine)" />

      {/* Orange border */}
      <path d="M32 4 L60 32 L32 60 L4 32 Z" stroke="url(#v3-border)" strokeWidth="2.5" />

      {/* T crossbar */}
      <rect x="18" y="19" width="28" height="9.5" rx="4.75" fill="white" />
      {/* T stem */}
      <rect x="28" y="28.5" width="8" height="20" rx="4" fill="white" />
    </svg>
  )
}
