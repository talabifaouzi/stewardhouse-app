// Shared SVG-icon component. First reusable icon primitive in the platform —
// extracted per ADV-007 (advisor QA bundle 4, glyph-to-SVG sweep). Idiom
// mirrors BackLink.jsx's inline chevron: currentColor stroke, aria-hidden,
// strokeWidth 1.5, rounded caps and joins. Parents pass the label via their
// own copy or aria-label.

const ICONS = {
  'chevron-right': { vb: '0 0 8 12', d: 'M2 1 L7 6 L2 11', w: 8, h: 12 },
  'chevron-left':  { vb: '0 0 8 12', d: 'M6 1 L1 6 L6 11', w: 8, h: 12 },
  'plus':          { vb: '0 0 10 10', d: 'M5 1 V9 M1 5 H9', w: 10, h: 10 },
};

export function Icon({ name, width, height }) {
  const i = ICONS[name];
  if (!i) return null;
  return (
    <svg
      width={width ?? i.w}
      height={height ?? i.h}
      viewBox={i.vb}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={i.d} />
    </svg>
  );
}
