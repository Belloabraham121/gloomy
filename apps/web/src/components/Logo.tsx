export type LogoVariant = "violet" | "ink";

export function LogoMark({
  size = 34,
  variant = "violet",
}: {
  size?: number;
  variant?: LogoVariant;
}) {
  const gid = `logo-cloud-${variant}`;
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
        <linearGradient id="logo-cloud-violet" x1="8" y1="14" x2="42" y2="38">
          <stop offset="0%" stopColor="#8b7cff" />
          <stop offset="55%" stopColor="#6c5ce7" />
          <stop offset="100%" stopColor="#4d3fc7" />
        </linearGradient>
        <linearGradient id="logo-cloud-ink" x1="8" y1="14" x2="42" y2="38">
          <stop offset="0%" stopColor="#2b241c" />
          <stop offset="100%" stopColor="#191511" />
        </linearGradient>
        <linearGradient id="logo-spark-grad" x1="30" y1="4" x2="44" y2="18">
          <stop offset="0%" stopColor="#ff7a54" />
          <stop offset="100%" stopColor="#ff5a3c" />
        </linearGradient>
      </defs>

      {/* cloud: three lobes + flat base */}
      <g>
        <circle cx="15" cy="27" r="9" fill={`url(#${gid})`} />
        <circle cx="25" cy="22" r="11" fill={`url(#${gid})`} />
        <circle cx="34" cy="28" r="8" fill={`url(#${gid})`} />
        <rect x="8" y="27" width="33" height="9" rx="4.5" fill={`url(#${gid})`} />
      </g>

      {/* the "idea" spark escaping the cloud */}
      <path
        className="logo-spark"
        d="M37 5 L38.8 10.2 L44 12 L38.8 13.8 L37 19 L35.2 13.8 L30 12 L35.2 10.2 Z"
        fill="url(#logo-spark-grad)"
      />
    </svg>
  );
}

export function Logo({
  size = 34,
  variant = "violet",
}: {
  size?: number;
  variant?: LogoVariant;
}) {
  return (
    <span className="logo-lockup">
      <LogoMark size={size} variant={variant} />
      <span className="logo-word">gloomy</span>
    </span>
  );
}
