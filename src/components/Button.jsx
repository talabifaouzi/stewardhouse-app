import { useState } from 'react';

export function Button({ children, variant = 'secondary', size = 'normal', onClick, disabled, type = 'button', style = {}, ...props }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const variants = {
    primary: {
      base: {
        background: 'var(--sh-bronze)',
        color: 'var(--sh-text-on-accent)',
        border: '1px solid var(--sh-bronze)',
      },
      hover: {
        background: 'var(--sh-bronze-deep)',
        borderColor: 'var(--sh-bronze-deep)',
      },
    },
    secondary: {
      base: {
        background: 'var(--sh-card)',
        color: 'var(--sh-text-secondary)',
        border: 'var(--sh-border-thin)',
      },
      hover: {
        background: 'var(--sh-bronze-tint)',
        color: 'var(--sh-bronze-deep)',
        borderColor: 'var(--sh-bronze-border)',
      },
    },
    ghost: {
      base: {
        background: 'transparent',
        color: 'var(--sh-text-secondary)',
        border: '1px solid transparent',
      },
      hover: {
        background: 'var(--sh-bg-tint)',
        color: 'var(--sh-text-primary)',
      },
    },
  };

  // TAP TARGETS. `lg` is the TOUCH-PRIMARY size and carries an explicit
  // minHeight of 44px (CLAUDE.md §7). Measured on device 2026-08-14 it rendered
  // at 39px:
  //
  //     padding-top/bottom  10 + 10 = 20
  //     border-top/bottom    1 +  1 =  2   (border-box, so both are inside)
  //     line box                     = 17
  //                                   ────
  //                                     39
  //
  // That 17px line box on a 14px font is a ratio of ~1.21, i.e. `line-height:
  // normal`. It is NOT inheriting --sh-line-normal (1.6), which would have given
  // 14 × 1.6 = 22.4 and a 44.4px button. line-height is an inherited property
  // and <body> sets it, so the only thing that can override it is the UA
  // stylesheet: browsers force `line-height: normal` on form controls.
  // INHERITANCE CANNOT BE RELIED ON HERE.
  //
  // minHeight rather than a corrected lineHeight, deliberately: height as an
  // emergent product of padding + border + line box silently re-breaks the next
  // time a font-size token moves. minHeight names the requirement.
  //
  // Confirmed on device 2026-08-14: lg now measures 44px (RecordKeeping primary
  // and all three interstitial controls). How the UA distributes the extra 5px
  // INSIDE the box was not measured, so no claim is made here about vertical
  // centring of the label.
  //
  // sm and normal are POINTER-DENSITY controls for inline row actions and are
  // deliberately left non-compliant (~27px / ~32px). See §7: padding a 27px
  // control to 44px makes it mostly empty space and it would dominate the rows
  // it sits in. The gap is intentional.
  const sizes = {
    sm: { padding: '6px 10px', fontSize: 'var(--sh-text-xs)' },
    normal: { padding: '8px 14px', fontSize: 'var(--sh-text-sm)' },
    lg: { padding: '10px 18px', fontSize: 'var(--sh-text-base)', minHeight: '44px' },
  };

  const v = variants[variant] || variants.secondary;
  const computedStyle = {
    ...v.base,
    ...sizes[size],
    borderRadius: 'var(--sh-radius-md)',
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 150ms ease',
    transform: pressed && !disabled ? 'translateY(1px)' : 'translateY(0)',
    ...(hovered && !disabled ? v.hover : {}),
    ...style,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={computedStyle}
      {...props}
    >
      {children}
    </button>
  );
}
