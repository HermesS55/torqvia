export default function TorqviaLogoV6({ size = 40 }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" width={size} height={size} aria-hidden="true">
      <defs>
        <radialGradient id="v6-bg" cx="38%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
        <filter id="v6-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#ea580c" floodOpacity="0.55" />
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#v6-bg)" filter="url(#v6-glow)" />
      <circle cx="32" cy="32" r="27" stroke="white" strokeOpacity="0.1" strokeWidth="1" fill="none" />
      <rect x="15" y="19" width="34" height="11" rx="5.5" fill="white" />
      <rect x="27" y="30" width="10" height="20" rx="5" fill="white" />
    </svg>
  )
}
