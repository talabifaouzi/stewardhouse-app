import { useState } from 'react';
import { Card } from '../../components/Card.jsx';

// Map intake budget bands to default modeler amount
const BUDGET_TO_DEFAULT = {
  'Under $1,000': 500,
  '$1K – $10K': 5000,
  '$10K – $50K': 25000,
  '$50K – $250K': 100000,
  '$250K+': 250000,
  'Not sure yet': 5000,
};

const fmt = (n) => {
  if (n === undefined || n === null || isNaN(n)) return '$0';
  if (Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return '$' + Math.round(n / 1000) + 'K';
  return '$' + Math.round(n).toLocaleString();
};

export default function GivingModeler({ budget }) {
  const defaultAmt = BUDGET_TO_DEFAULT[budget] || 5000;
  const [open, setOpen] = useState(false);
  const [annual, setAnnual] = useState(defaultAmt);
  const [years, setYears] = useState(20);
  const [growth, setGrowth] = useState(5);
  const [grantPct, setGrantPct] = useState(60);
  const [careerOn, setCareerOn] = useState(false);
  const [careerRate, setCareerRate] = useState(4);

  // Compute year-by-year fund trajectory
  let fund = 0;
  let totalIn = 0;
  let totalOut = 0;
  const pts = [];
  for (let y = 1; y <= years; y++) {
    const contrib = careerOn
      ? Math.round(annual * Math.pow(1 + careerRate / 100, y - 1))
      : annual;
    const grantThisYear = Math.round(((fund + contrib) * grantPct) / 100);
    fund = fund + contrib - grantThisYear;
    fund = fund * (1 + growth / 100);
    totalIn += contrib;
    totalOut += grantThisYear;
    pts.push({ y, fund: Math.max(0, Math.round(fund)) });
  }
  const finalFund = pts.length > 0 ? pts[pts.length - 1].fund : 0;
  const maxFund = Math.max(...pts.map((p) => p.fund), 1);

  // Collapsed teaser
  if (!open) {
    return (
      <div
        onClick={() => setOpen(true)}
        style={{
          background: 'var(--sh-card)',
          borderRadius: 'var(--sh-radius-lg)',
          padding: 'var(--sh-space-4) var(--sh-space-5)',
          border: '1px solid var(--sh-card-border)',
          marginBottom: 'var(--sh-space-3)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--sh-space-3)',
          transition: 'all 180ms ease',
        }}
      >
        <div>
          <p style={{
            fontSize: '10px',
            color: 'var(--sh-bronze)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 600,
            marginBottom: '4px',
          }}>
            Try the model
          </p>
          <p style={{
            fontSize: 'var(--sh-text-base)',
            fontWeight: 600,
            color: 'var(--sh-text-primary)',
            marginBottom: '2px',
          }}>
            Your giving over time
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
          }}>
            See what {budget ? budget.toLowerCase() : '$5K'}/year becomes
          </p>
        </div>
        <span style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-bronze)',
        }}>
          →
        </span>
      </div>
    );
  }

  // Expanded modeler
  return (
    <Card padding="lg" style={{ marginBottom: 'var(--sh-space-3)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--sh-space-4)',
      }}>
        <div>
          <p style={{
            fontSize: '10px',
            color: 'var(--sh-bronze)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 600,
            marginBottom: '4px',
          }}>
            Your giving over time
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
          }}>
            Adjust anything. See what it becomes.
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--sh-text-muted)',
            fontSize: 'var(--sh-text-xs)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          Close
        </button>
      </div>

      {/* Hero card: outcomes */}
      <div style={{
        background: 'var(--sh-bronze)',
        borderRadius: 'var(--sh-radius-md)',
        padding: 'var(--sh-space-4)',
        marginBottom: 'var(--sh-space-4)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 'var(--sh-space-3)',
      }}>
        <div>
          <p style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            Total given over {years} years
          </p>
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: '32px',
            color: '#FFFFFF',
            fontWeight: 400,
            lineHeight: 1,
          }}>
            {fmt(totalOut)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            Fund remaining
          </p>
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-xl)',
            color: 'rgba(255,255,255,0.95)',
            fontWeight: 400,
          }}>
            {fmt(finalFund)}
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '2px',
        height: '60px',
        marginBottom: 'var(--sh-space-4)',
        padding: 'var(--sh-space-2)',
        background: 'var(--sh-bg-tint)',
        borderRadius: 'var(--sh-radius-md)',
      }}>
        {pts.map((p) => (
          <div
            key={p.y}
            style={{
              flex: 1,
              height: `${(p.fund / maxFund) * 100}%`,
              minHeight: '2px',
              background: 'var(--sh-bronze)',
              borderRadius: '1px',
              opacity: 0.7,
            }}
          />
        ))}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: 'var(--sh-text-muted)',
        marginBottom: 'var(--sh-space-5)',
        marginTop: '-8px',
      }}>
        <span>Year 1</span>
        <span>Year {years}</span>
      </div>

      {/* Sliders */}
      <Slider
        label="Annual giving"
        value={fmt(annual)}
        min={500}
        max={500000}
        step={500}
        rawValue={annual}
        onChange={setAnnual}
      />
      <Slider
        label="Time horizon"
        value={`${years} years`}
        min={5}
        max={40}
        step={1}
        rawValue={years}
        onChange={setYears}
      />
      <Slider
        label="Fund growth rate"
        value={`${growth}%`}
        min={0}
        max={10}
        step={1}
        rawValue={growth}
        onChange={setGrowth}
      />
      <Slider
        label="Granted out each year"
        value={`${grantPct}%`}
        min={0}
        max={100}
        step={5}
        rawValue={grantPct}
        onChange={setGrantPct}
      />

      {/* Career growth toggle */}
      <div
        onClick={() => setCareerOn(!careerOn)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sh-space-3)',
          cursor: 'pointer',
          padding: 'var(--sh-space-2) 0',
          marginTop: 'var(--sh-space-2)',
        }}
      >
        <div style={{
          width: '22px',
          height: '22px',
          borderRadius: '6px',
          border: `2px solid ${careerOn ? 'var(--sh-bronze)' : 'var(--sh-card-border)'}`,
          background: careerOn ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: 'var(--sh-bronze-deep)',
          fontWeight: 700,
        }}>
          {careerOn ? '✓' : ''}
        </div>
        <span style={{ fontSize: 'var(--sh-text-sm)', color: 'var(--sh-text-body)' }}>
          My income grows over time
        </span>
      </div>

      {careerOn && (
        <Slider
          label="Income growth rate"
          value={`${careerRate}%`}
          min={0}
          max={15}
          step={1}
          rawValue={careerRate}
          onChange={setCareerRate}
        />
      )}

      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        marginTop: 'var(--sh-space-4)',
        lineHeight: 1.5,
      }}>
        These are projections, not predictions. The model assumes consistent contributions and grant rates. Real giving will look different — but seeing the math helps you plan.
      </p>
    </Card>
  );
}

function Slider({ label, value, min, max, step, rawValue, onChange }) {
  return (
    <div style={{ marginBottom: 'var(--sh-space-3)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '6px',
      }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          fontWeight: 600,
          color: 'var(--sh-text-primary)',
          letterSpacing: '0.02em',
        }}>
          {label}
        </p>
        <p style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-base)',
          color: 'var(--sh-bronze-deep)',
          fontWeight: 400,
        }}>
          {value}
        </p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={rawValue}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: '4px',
          appearance: 'none',
          WebkitAppearance: 'none',
          background: 'var(--sh-card-border)',
          borderRadius: '2px',
          outline: 'none',
          accentColor: 'var(--sh-bronze)',
        }}
      />
    </div>
  );
}
