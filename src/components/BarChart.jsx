import { useState } from 'react';

// Interactive bar chart with fixed 0-100% Y scale, labeled X-axis,
// hover/focus tooltips, and accessible markup.
//
// Layout: HTML+CSS (no SVG aspect-ratio gymnastics). Y-axis tick labels
// and grid lines are absolutely positioned by bottom percentage; bars
// are flex slots with inner divs whose heights track the data value as
// a percentage of the chart area.
//
// The bar darkens to bronze-deep on both hover and keyboard focus (shared
// activeIndex state). The browser's default focus outline is suppressed —
// the color shift IS the focus indicator. Each bar carries aria-label
// matching the tooltip text so screen readers get per-bar context.

const Y_TICKS = [0, 25, 50, 75, 100];

export default function BarChart({ data, labels, ariaLabel, tooltipFormatter }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const fmt = tooltipFormatter || ((v, i) => {
    const label = labels?.[i] || (i + 1).toString();
    return `${label}: ${v}%`;
  });

  return (
    <div role="img" aria-label={ariaLabel} style={wrapperStyle}>
      <div style={contentRowStyle}>
        {/* Y-axis tick labels */}
        <div style={yAxisStyle}>
          {Y_TICKS.map((pct) => (
            <span
              key={pct}
              style={{ ...tickLabelStyle, bottom: `${pct}%` }}
            >
              {pct}%
            </span>
          ))}
        </div>

        {/* Chart column: chart area + x-axis labels */}
        <div style={chartColStyle}>
          <div style={chartAreaStyle}>
            {/* Horizontal grid lines */}
            {Y_TICKS.map((pct) => (
              <div
                key={pct}
                style={{ ...gridLineStyle, bottom: `${pct}%` }}
              />
            ))}
            {/* Bars */}
            <div style={barsRowStyle}>
              {data.map((value, i) => (
                <BarSlot
                  key={i}
                  value={value}
                  isActive={activeIndex === i}
                  tooltip={fmt(value, i)}
                  onEnter={() => setActiveIndex(i)}
                  onLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(i)}
                  onBlur={() => setActiveIndex(null)}
                />
              ))}
            </div>
          </div>

          {/* X-axis labels */}
          <div style={xAxisStyle}>
            {data.map((_, i) => (
              <span key={i} style={xLabelStyle}>
                {labels?.[i] || i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BarSlot({ value, isActive, tooltip, onEnter, onLeave, onFocus, onBlur }) {
  return (
    <button
      type="button"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label={tooltip}
      style={barSlotStyle}
    >
      <div
        style={{
          position: 'absolute',
          left: '15%',
          right: '15%',
          bottom: 0,
          height: `${value}%`,
          background: isActive ? 'var(--sh-bronze-deep)' : 'var(--sh-bronze)',
          borderRadius: '2px 2px 0 0',
          transition: 'background 150ms ease',
        }}
      />
      {isActive && (
        <div
          style={{
            position: 'absolute',
            bottom: `calc(${value}% + 10px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--sh-bg)',
            border: 'var(--sh-border-thin)',
            borderRadius: 'var(--sh-radius-sm)',
            padding: 'var(--sh-space-1) var(--sh-space-2)',
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-body)',
            whiteSpace: 'nowrap',
            fontWeight: 500,
            letterSpacing: '0.02em',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {tooltip}
          {/* Downward-pointing CSS triangle */}
          <div
            style={{
              position: 'absolute',
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid var(--sh-card-border)',
            }}
          />
        </div>
      )}
    </button>
  );
}

const wrapperStyle = {
  width: '100%',
  height: '240px',
  paddingTop: 'var(--sh-space-6)',
  position: 'relative',
  boxSizing: 'border-box',
};

const contentRowStyle = {
  display: 'flex',
  height: '100%',
};

const yAxisStyle = {
  width: '48px',
  position: 'relative',
  flexShrink: 0,
  marginRight: 'var(--sh-space-2)',
};

const tickLabelStyle = {
  position: 'absolute',
  right: 0,
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  transform: 'translateY(50%)',
  whiteSpace: 'nowrap',
};

const chartColStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
};

const chartAreaStyle = {
  flex: 1,
  position: 'relative',
  minHeight: 0,
};

const gridLineStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: '0',
  borderTop: 'var(--sh-border-thin)',
  pointerEvents: 'none',
};

const barsRowStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
};

const barSlotStyle = {
  flex: 1,
  position: 'relative',
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'inherit',
  outline: 'none',
};

const xAxisStyle = {
  display: 'flex',
  paddingTop: 'var(--sh-space-2)',
  borderTop: 'var(--sh-border-thin)',
};

const xLabelStyle = {
  flex: 1,
  textAlign: 'center',
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
};
