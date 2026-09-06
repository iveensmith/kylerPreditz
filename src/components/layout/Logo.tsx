import { SITE_NAME } from "@/lib/seo";

/**
 * Brand wordmark + "UP" monogram. Rendered as a single flat colour that tracks
 * `--brand-light` - the exact green used by the header's "Premium" link - so the
 * logo and that link always match, in both themes. Ball seams and the lightning
 * bolt are dark knockouts (not another colour) so the mark still reads on the
 * dark header/footer chrome. Inline SVG so it stays crisp at any size.
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
      fill="var(--brand-light)"
    >
      <title>{SITE_NAME}</title>
      <defs>
        <filter id="up-dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>

      <g transform="translate(10, 0)" filter="url(#up-dropShadow)">
        <path
          d="M 65 140 C 40 90 70 35 125 30 C 175 25 215 65 205 120"
          fill="none"
          stroke="var(--brand-light)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeOpacity="0.55"
        />
        <g transform="translate(130, 68)">
          <circle cx="0" cy="0" r="34" fill="var(--brand-light)" />
          <polygon points="0,-14 -13,-4 -8,11 8,11 13,-4" fill="#08110D" fillOpacity="0.55" />
          <g stroke="#08110D" strokeOpacity="0.55" strokeWidth="3">
            <line x1="0" y1="-14" x2="0" y2="-34" />
            <line x1="-13" y1="-4" x2="-30" y2="-12" />
            <line x1="-8" y1="11" x2="-22" y2="26" />
            <line x1="8" y1="11" x2="22" y2="26" />
            <line x1="13" y1="-4" x2="30" y2="-12" />
          </g>
        </g>
        <path
          d="M 45 75 L 82 75 L 82 145 C 82 158 92 165 107 165 C 122 165 132 158 132 145 L 132 105 L 168 105 L 168 145 C 168 185 138 200 107 200 C 76 200 45 185 45 145 Z"
          fill="var(--brand-light)"
        />
        <path
          d="M 148 75 L 205 75 C 238 75 255 92 255 117 C 255 142 238 158 205 158 L 184 158 L 184 200 L 148 200 Z M 184 103 L 184 130 L 202 130 C 216 130 222 124 222 116 C 222 108 216 103 202 103 Z"
          fill="var(--brand-light)"
        />
        <polygon
          points="35,185 145,112 125,112 245,35 140,128 162,128"
          fill="#08110D"
          fillOpacity="0.55"
        />
      </g>

      <g transform="translate(10, 0)" filter="url(#up-dropShadow)">
        <text
          x="275"
          y="155"
          style={{ fontFamily: "var(--font-montserrat), 'Arial Black', Impact, sans-serif" }}
          fontSize="82"
          fontWeight="900"
          fontStyle="italic"
          letterSpacing="2"
          fill="var(--brand-light)"
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
          fill="var(--brand-light)"
        >
          PREDICT
        </text>
        <path
          d="M 280 177 L 1060 177"
          stroke="var(--brand-light)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
