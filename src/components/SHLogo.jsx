export function SHLogo({ size = 24, color = 'var(--sh-bronze)' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      {/* Stylized "house" formed by two intersecting lines —
          a structure rather than a literal house, suggesting stewardship */}
      <circle cx="16" cy="16" r="14" fill="none" stroke={color} strokeWidth="1" opacity="0.4" />
      <path
        d="M 8 22 L 8 14 L 16 8 L 24 14 L 24 22"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="13" y1="22" x2="13" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="22" x2="19" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
