export default function TorqviaLogoV2({ size = 40 }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="v2-body" x1="6" y1="2" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fb923c" />
          <stop offset="55%"  stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="v2-shine" x1="32" y1="2" x2="32" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="white" stopOpacity="0.22" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <clipPath id="v2-hex-clip">
          <polygon points="32,2 58,17 58,47 32,62 6,47 6,17" />
        </clipPath>
        <filter id="v2-glow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="1" stdDeviation="4"
            floodColor="#f97316" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Hex cıvata başlığı */}
      <polygon
        points="32,2 58,17 58,47 32,62 6,47 6,17"
        fill="url(#v2-body)"
        filter="url(#v2-glow)"
      />

      {/* Üst parlaklık — metal yansıma etkisi */}
      <rect x="0" y="0" width="64" height="32"
        fill="url(#v2-shine)"
        clipPath="url(#v2-hex-clip)"
      />

      {/* İç hex çizgisi — cıvata derinlik hissi */}
      <polygon
        points="32,9 51,20 51,44 32,55 13,44 13,20"
        stroke="white"
        strokeWidth="0.8"
        strokeOpacity="0.12"
        fill="none"
      />

      {/* T harfi — kalın, yuvarlak köşeli */}
      <rect x="14" y="19" width="36" height="8.5" rx="4.25" fill="white" />
      <rect x="27" y="27.5" width="10" height="18" rx="5"    fill="white" />

      {/* Torque dönüş yayı — T'nin altında, küçük rotasyon halkası */}
      <path
        d="M 23 49.5 A 9 9 0 0 0 41 49.5"
        stroke="white"
        strokeWidth="2"
        strokeOpacity="0.45"
        strokeLinecap="round"
        fill="none"
      />
      {/* Ok ucu */}
      <path
        d="M 40 46.5 L 41 49.5 L 38 50.5"
        stroke="white"
        strokeWidth="1.8"
        strokeOpacity="0.45"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
