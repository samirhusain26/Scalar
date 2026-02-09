export function VennBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
      <svg
        className="absolute w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Large teal orb gradient */}
          <radialGradient id="bg-orb-teal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.07" />
            <stop offset="60%" stopColor="#14B8A6" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
          </radialGradient>

          {/* Large pink orb gradient */}
          <radialGradient id="bg-orb-pink" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F472B6" stopOpacity="0.06" />
            <stop offset="60%" stopColor="#EC6B5E" stopOpacity="0.025" />
            <stop offset="100%" stopColor="#EC6B5E" stopOpacity="0" />
          </radialGradient>

          {/* Golden intersection glow */}
          <radialGradient id="bg-orb-gold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EAB308" stopOpacity="0.05" />
            <stop offset="70%" stopColor="#EAB308" stopOpacity="0.015" />
            <stop offset="100%" stopColor="#EAB308" stopOpacity="0" />
          </radialGradient>

          {/* Small accent teal */}
          <radialGradient id="bg-accent-teal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5BC4BE" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#5BC4BE" stopOpacity="0" />
          </radialGradient>

          {/* Small accent pink */}
          <radialGradient id="bg-accent-pink" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F9A8B8" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#F9A8B8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Primary Venn pair — top-left area */}
        <circle cx="280" cy="200" r="260" fill="url(#bg-orb-teal)">
          <animate
            attributeName="cx"
            values="280;300;280"
            dur="25s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="420" cy="220" r="260" fill="url(#bg-orb-pink)">
          <animate
            attributeName="cx"
            values="420;400;420"
            dur="25s"
            repeatCount="indefinite"
          />
        </circle>
        {/* Intersection glow where the pair overlaps */}
        <circle cx="350" cy="210" r="120" fill="url(#bg-orb-gold)" />

        {/* Secondary Venn pair — bottom-right area */}
        <circle cx="1100" cy="680" r="220" fill="url(#bg-orb-pink)">
          <animate
            attributeName="cy"
            values="680;660;680"
            dur="30s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="1240" cy="660" r="220" fill="url(#bg-orb-teal)">
          <animate
            attributeName="cy"
            values="660;680;660"
            dur="30s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="1170" cy="670" r="100" fill="url(#bg-orb-gold)" />

        {/* Floating accent orbs — scattered */}
        <circle cx="100" cy="700" r="150" fill="url(#bg-accent-teal)">
          <animate
            attributeName="cy"
            values="700;680;700"
            dur="20s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="1350" cy="150" r="130" fill="url(#bg-accent-pink)">
          <animate
            attributeName="cx"
            values="1350;1330;1350"
            dur="22s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="720" cy="820" r="180" fill="url(#bg-orb-teal)">
          <animate
            attributeName="cx"
            values="720;740;720"
            dur="28s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Subtle vesica piscis outlines — decorative */}
        <g opacity="0.04" stroke="#18181B" fill="none" strokeWidth="1">
          {/* Top-right small pair */}
          <circle cx="1000" cy="100" r="60" />
          <circle cx="1060" cy="100" r="60" />

          {/* Bottom-left small pair */}
          <circle cx="200" cy="780" r="45" />
          <circle cx="245" cy="780" r="45" />

          {/* Center-left small pair */}
          <circle cx="50" cy="420" r="35" />
          <circle cx="85" cy="420" r="35" />
        </g>
      </svg>
    </div>
  );
}
