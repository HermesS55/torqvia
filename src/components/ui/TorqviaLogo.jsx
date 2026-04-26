export default function TorqviaLogo({ size = 40 }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="tl-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="tl-arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>

      {/* Outer ring */}
      <circle cx="32" cy="32" r="30" stroke="#27272a" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="30"
        stroke="url(#tl-ring)" strokeWidth="1.5"
        strokeDasharray="120 70" strokeLinecap="round"
        transform="rotate(-140 32 32)"
      />

      {/* Tick marks */}
      {[-100,-70,-40,-10,20,50].map((deg, i) => {
        const r = (deg * Math.PI) / 180
        const x1 = 32 + 24 * Math.cos(r), y1 = 32 + 24 * Math.sin(r)
        const x2 = 32 + 28 * Math.cos(r), y2 = 32 + 28 * Math.sin(r)
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={i >= 4 ? '#f97316' : '#3f3f46'} strokeWidth="1.5" strokeLinecap="round" />
        )
      })}

      {/* Arc track */}
      <path d="M 10 44 A 24 24 0 0 1 54 44"
        stroke="#27272a" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M 10 44 A 24 24 0 0 1 54 44"
        stroke="url(#tl-arc)" strokeWidth="3" strokeLinecap="round" fill="none"
        strokeDasharray="75 100" />

      {/* Needle */}
      <line x1="32" y1="32" x2="32" y2="11"
        stroke="white" strokeWidth="2" strokeLinecap="round"
        transform="rotate(25 32 32)" />
      <line x1="32" y1="32" x2="32" y2="38"
        stroke="#f97316" strokeWidth="2" strokeLinecap="round"
        transform="rotate(25 32 32)" />

      {/* Hub */}
      <circle cx="32" cy="32" r="4" fill="#f97316" />
      <circle cx="32" cy="32" r="1.8" fill="white" />
    </svg>
  )
}
