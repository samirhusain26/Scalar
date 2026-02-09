interface ScalarLogoProps {
  size?: number;
  className?: string;
}

export function ScalarLogo({ size = 120, className = '' }: ScalarLogoProps) {
  const w = size;
  const h = size * 0.6;

  return (
    <svg
      viewBox="0 0 200 120"
      width={w}
      height={h}
      className={className}
      aria-label="Scalar logo"
    >
      <defs>
        {/* Left circle gradient: teal/cyan */}
        <radialGradient id="logo-left-grad" cx="40%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#7DD3C8" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#5BC4BE" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.7" />
        </radialGradient>

        {/* Right circle gradient: pink/coral */}
        <radialGradient id="logo-right-grad" cx="60%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#F9A8B8" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#F472B6" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#EC6B5E" stopOpacity="0.7" />
        </radialGradient>

        {/* Intersection gradient: golden/amber */}
        <radialGradient id="logo-center-grad" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#EAB308" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#D4A017" stopOpacity="0.8" />
        </radialGradient>

        {/* Clip paths for the vesica piscis intersection */}
        <clipPath id="logo-clip-left">
          <circle cx="75" cy="60" r="50" />
        </clipPath>
        <clipPath id="logo-clip-right">
          <circle cx="125" cy="60" r="50" />
        </clipPath>

        {/* Subtle inner glow for the intersection */}
        <filter id="logo-soft-glow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>

      {/* Left circle */}
      <circle cx="75" cy="60" r="50" fill="url(#logo-left-grad)" />

      {/* Right circle */}
      <circle cx="125" cy="60" r="50" fill="url(#logo-right-grad)" />

      {/* Vesica piscis intersection — drawn as the overlap region */}
      {/* Left circle portion clipped to right circle */}
      <circle
        cx="75"
        cy="60"
        r="50"
        fill="url(#logo-center-grad)"
        clipPath="url(#logo-clip-right)"
      />

      {/* Subtle bright center highlight */}
      <ellipse
        cx="100"
        cy="58"
        rx="12"
        ry="28"
        fill="#FDE68A"
        opacity="0.4"
        filter="url(#logo-soft-glow)"
        clipPath="url(#logo-clip-right)"
      />

      {/* Thin silver/white rim on the vesica piscis edge */}
      <path
        d="M 100 10.4 A 50 50 0 0 1 100 109.6 A 50 50 0 0 1 100 10.4"
        fill="none"
        stroke="white"
        strokeWidth="1.2"
        opacity="0.5"
      />
    </svg>
  );
}
