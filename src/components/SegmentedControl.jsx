// ENT #48 — Enterprise-scoped shared SegmentedControl. Replaces the two
// near-identical bordered-jointed segmentButtonStyle helpers at
// SetupWizard.jsx + Endowment.jsx. Per Cluster I ruling, Advisor's
// LessonEditor (pill) + Pipeline (fused-rectangle) SegmentedControls have
// deliberately distinct visual treatments and are OUT OF SCOPE; their
// local copies remain untouched.
//
// A11y baked in (the Enterprise consumers previously had none):
//   - role="group" + aria-labelledby on outer container (SC-α group label)
//   - aria-pressed={selected} per button (consistent with the aria-pressed
//     idiom; this does NOT touch ADV-044, which is an Advisor-scoped open
//     decision)
//   - Native <button> elements — keyboard-focusable by default
//
// Visual: Endowment's borderRight convention (generalizes to N buttons);
// per-button outer-corner radii (first → left-rounded, last → right-rounded,
// 1-button edge-case → all four rounded).
export default function SegmentedControl({ options, value, onChange, ariaLabelledBy, size = 'md' }) {
  const padding = size === 'sm' ? '4px 12px' : '6px 14px';
  return (
    <div
      role="group"
      aria-labelledby={ariaLabelledBy}
      style={{ display: 'inline-flex' }}
    >
      {options.map((opt, idx, arr) => {
        const selected = opt.value === value;
        const isFirst = idx === 0;
        const isLast = idx === arr.length - 1;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={selected}
            style={{
              background: selected ? 'var(--sh-bronze)' : 'transparent',
              color: selected ? 'var(--sh-bg)' : 'var(--sh-bronze)',
              border: '1px solid var(--sh-bronze)',
              padding,
              fontSize: 'var(--sh-text-xs)',
              fontFamily: 'inherit',
              fontWeight: 500,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              borderTopLeftRadius: isFirst ? 'var(--sh-radius-md)' : 0,
              borderBottomLeftRadius: isFirst ? 'var(--sh-radius-md)' : 0,
              borderTopRightRadius: isLast ? 'var(--sh-radius-md)' : 0,
              borderBottomRightRadius: isLast ? 'var(--sh-radius-md)' : 0,
              borderRight: isLast ? '1px solid var(--sh-bronze)' : 'none',
              transition: 'background 150ms ease, color 150ms ease',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
