import { SITE_NAME } from "@/lib/seo";

/**
 * Brand wordmark + "UP" monogram. Colours are self-contained (metallic silver +
 * electric blue on a transparent ground), so it reads on the dark header/footer
 * chrome in both themes. Rendered inline rather than as an <img> so the gradients
 * and glow filters stay crisp at any size and there's no extra request.
 *
 * IDs are prefixed so the two instances (header + footer) don't collide.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="24 16 1064 196"
      className={className}
      role="img"
      aria-label={SITE_NAME}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{SITE_NAME}</title>
      <defs>
        <linearGradient id="up-silverBase" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#E2E8F0" />
          <stop offset="70%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="up-silverStroke" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id="up-electricBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="up-lightningGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="up-ballRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284C7" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0369A1" stopOpacity="0.2" />
        </linearGradient>
        <filter id="up-dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.6" />
        </filter>
        <filter id="up-neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g transform="translate(10, 0)">
        <g filter="url(#up-dropShadow)">
          <path
            d="M 65 140 C 40 90 70 35 125 30 C 175 25 215 65 205 120"
            fill="none"
            stroke="url(#up-ballRing)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <g transform="translate(130, 68)">
            <circle cx="0" cy="0" r="34" fill="#E2E8F0" stroke="#1E293B" strokeWidth="3" />
            <polygon points="0,-14 -13,-4 -8,11 8,11 13,-4" fill="#0F172A" />
            <line x1="0" y1="-14" x2="0" y2="-34" stroke="#1E293B" strokeWidth="3" />
            <line x1="-13" y1="-4" x2="-30" y2="-12" stroke="#1E293B" strokeWidth="3" />
            <line x1="-8" y1="11" x2="-22" y2="26" stroke="#1E293B" strokeWidth="3" />
            <line x1="8" y1="11" x2="22" y2="26" stroke="#1E293B" strokeWidth="3" />
            <line x1="13" y1="-4" x2="30" y2="-12" stroke="#1E293B" strokeWidth="3" />
          </g>
          <path
            d="M 45 75 L 82 75 L 82 145 C 82 158 92 165 107 165 C 122 165 132 158 132 145 L 132 105 L 168 105 L 168 145 C 168 185 138 200 107 200 C 76 200 45 185 45 145 Z"
            fill="url(#up-silverBase)"
            stroke="url(#up-silverStroke)"
            strokeWidth="2"
          />
          <path
            d="M 52 82 L 75 82 L 75 145 C 75 165 88 175 107 175 C 126 175 139 165 139 145 L 139 112 L 161 112"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.6"
            strokeWidth="2"
          />
          <path
            d="M 148 75 L 205 75 C 238 75 255 92 255 117 C 255 142 238 158 205 158 L 184 158 L 184 200 L 148 200 Z M 184 103 L 184 130 L 202 130 C 216 130 222 124 222 116 C 222 108 216 103 202 103 Z"
            fill="url(#up-electricBlue)"
            stroke="#0284C7"
            strokeWidth="1.5"
          />
          <path
            d="M 154 81 L 204 81 C 228 81 247 94 247 117"
            fill="none"
            stroke="#7DD3FC"
            strokeOpacity="0.7"
            strokeWidth="2"
          />
          <polygon
            points="35,185 145,112 125,112 245,35 140,128 162,128"
            fill="url(#up-lightningGlow)"
            filter="url(#up-neonGlow)"
          />
          <polygon points="35,185 145,112 125,112 245,35 140,128 162,128" fill="#FFFFFF" opacity="0.9" />
        </g>

        <g filter="url(#up-dropShadow)">
          <text
            x="275"
            y="155"
            style={{ fontFamily: "var(--font-montserrat), 'Arial Black', Impact, sans-serif" }}
            fontSize="82"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="2"
            fill="url(#up-silverBase)"
            stroke="url(#up-silverStroke)"
            strokeWidth="1.5"
          >
            UNIQUE
          </text>
          <text
            x="650"
            y="155"
            style={{ fontFamily: "var(--font-montserrat), 'Arial Black', Impact, sans-serif" }}
            fontSize="82"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="2"
            fill="url(#up-electricBlue)"
            filter="url(#up-neonGlow)"
          >
            PREDICT
          </text>
          <path d="M 280 177 L 1060 177" stroke="url(#up-electricBlue)" strokeWidth="4" strokeLinecap="round" />
          <path d="M 975 177 L 1060 177" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
