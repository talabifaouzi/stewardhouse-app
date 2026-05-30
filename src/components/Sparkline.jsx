// Inline SVG sparkline with a smooth Bézier curve and an emphasized endpoint.
//
// Wrapper is the accessible <div role="img"> with an aria-label that summarizes
// the trend ("12 values rising from 35 to 75"). The SVG itself is decorative
// (aria-hidden) — assistive tech reads the wrapper's label instead of the path.
//
// The endpoint dot is rendered as an HTML element CSS-positioned over the SVG
// rather than as an <svg:circle>. preserveAspectRatio="none" stretches SVG
// shapes non-uniformly, which would distort a <circle> into a horizontal oval;
// the absolutely positioned dot stays round at any container width.
//
// Local min/max normalization preserved from prior implementation — sparklines
// communicate trend, not absolute scale. Pair with a textual caption that
// conveys the underlying numbers.

const HEIGHT_PX = 64;
const VIEW_W = 600;
const VIEW_H = 80;
const DOT_PX = 8;

export default function Sparkline({ data }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * VIEW_W,
    y: VIEW_H - ((v - min) / range) * VIEW_H,
  }));

  const path = buildSmoothPath(points);

  const first = data[0];
  const last = data[data.length - 1];
  const direction = last > first ? 'rising' : last < first ? 'falling' : 'flat';
  const ariaLabel = `Line chart, ${data.length} values ${direction} from ${first} to ${last}`;

  // Endpoint coordinates in rendered space (top in px to match HEIGHT_PX).
  const lastTopPx = (1 - (last - min) / range) * HEIGHT_PX;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      style={{
        position: 'relative',
        width: '100%',
        height: `${HEIGHT_PX}px`,
      }}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
        aria-hidden="true"
      >
        <path
          d={path}
          fill="none"
          stroke="var(--sh-bronze)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '100%',
          top: `${lastTopPx}px`,
          width: `${DOT_PX}px`,
          height: `${DOT_PX}px`,
          borderRadius: '50%',
          background: 'var(--sh-bronze)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// Build a smooth cubic Bézier path through all points via Catmull-Rom →
// Bézier conversion (1/6-chord factor). For each segment from P1 to P2,
// control points use the neighbors P0 and P3; at the ends, the missing
// neighbor falls back to the segment endpoint.
function buildSmoothPath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || points[i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}
