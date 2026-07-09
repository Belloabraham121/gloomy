export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      className="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="logo-cloud" x1="8" y1="14" x2="42" y2="38">
          <stop offset="0%" stopColor="#8b7cff" />
          <stop offset="55%" stopColor="#6c5ce7" />
          <stop offset="100%" stopColor="#4d3fc7" />
        </linearGradient>
        <linearGradient id="logo-spark" x1="30" y1="4" x2="44" y2="18">
          <stop offset="0%" stopColor="#ffd89a" />
          <stop offset="100%" stopColor="#ff9a6b" />
        </linearGradient>
      </defs>

      {/* cloud: three lobes + flat base */}
      <g filter="url(#logo-glow)">
        <circle cx="15" cy="27" r="9" fill="url(#logo-cloud)" />
        <circle cx="25" cy="22" r="11" fill="url(#logo-cloud)" />
        <circle cx="34" cy="28" r="8" fill="url(#logo-cloud)" />
        <rect x="8" y="27" width="33" height="9" rx="4.5" fill="url(#logo-cloud)" />
      </g>

      {/* the "idea" spark escaping the cloud */}
      <path
        className="logo-spark"
        d="M37 5 L38.8 10.2 L44 12 L38.8 13.8 L37 19 L35.2 13.8 L30 12 L35.2 10.2 Z"
        fill="url(#logo-spark)"
      />

      <filter id="logo-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow
          dx="0"
          dy="2"
          stdDeviation="3"
          floodColor="#6c5ce7"
          floodOpacity="0.45"
        />
      </filter>
    </svg>
  );
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="logo-lockup">
      <LogoMark size={size} />
      <span className="logo-word">gloomy</span>
    </span>
  );
}
