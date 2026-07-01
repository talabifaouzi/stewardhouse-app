import { useState, useEffect, useId } from 'react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import SegmentedControl from '../../components/SegmentedControl.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import { useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';

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

function formatWithCommas(value, allowDecimal) {
  if (value === '' || value === '.') return value;
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  if (allowDecimal) {
    const parts = value.split('.');
    const intPart = Number(parts[0] || 0).toLocaleString('en-US');
    return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
  }
  return num.toLocaleString('en-US');
}

export default function GivingModeler({ budget }) {
  const defaultAmt = BUDGET_TO_DEFAULT[budget] || 5000;
  const [open, setOpen] = useState(false);
  const [annual, setAnnual] = useState(defaultAmt);
  const [years, setYears] = useState(20);
  const [growth, setGrowth] = useState(5);
  const [grantPct, setGrantPct] = useState(60);
  const [careerOn, setCareerOn] = useState(false);
  const [careerRate, setCareerRate] = useState(4);
  const [incomeMode, setIncomeMode] = useState('flat'); // 'flat' | 'percentage'
  const [incomeBase, setIncomeBase] = useState(100000);
  const [givePct, setGivePct] = useState(5);
  const { addScenario, scenarios } = useIntake();
  const appIdentity = useOptionalAppIdentity();
  const incomeModeLabelId = useId();
  const [scenarioLabel, setScenarioLabel] = useState('My scenario');
  const [savingScenario, setSavingScenario] = useState(false);
  const [saveScenarioError, setSaveScenarioError] = useState(null);
  const [scenarioSaved, setScenarioSaved] = useState(false);
  const [hoveredYear, setHoveredYear] = useState(null);

  useEffect(() => {
    if (incomeMode === 'percentage') {
      setAnnual(Math.round((incomeBase * givePct) / 100));
    }
  }, [incomeMode, incomeBase, givePct]);

  function handleLoadScenario(scenarioId) {
    const found = scenarios.find((s) => s.id === scenarioId);
    if (!found) return;
    setAnnual(found.inputs.annual);
    setYears(found.inputs.years);
    setGrowth(found.inputs.growth);
    setGrantPct(found.inputs.grantPct);
    setCareerOn(found.inputs.careerOn);
    setCareerRate(found.inputs.careerRate);
    setIncomeMode('flat'); // loaded scenarios always resume in flat mode showing the saved
                            // annual figure directly — income/percentage are input-UI
                            // convenience only, never part of a saved scenario's stored shape
  }

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

  async function handleSaveScenario() {
    const label = scenarioLabel.trim();
    if (!label) return;
    setSavingScenario(true);
    setSaveScenarioError(null);
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label,
          inputs: { annual, years, growth, grantPct, careerOn, careerRate },
          derivedAtSnapshot: { finalFund, totalIn, totalOut },
        }),
      });
      if (!res.ok) {
        let errMsg = 'Could not save this scenario. Please try again.';
        try {
          const errBody = await res.json();
          if (errBody && typeof errBody.error === 'string') errMsg = errBody.error;
        } catch {
          // response wasn't JSON — keep default message
        }
        setSaveScenarioError(errMsg);
        setSavingScenario(false);
        return;
      }
      const saved = await res.json();
      addScenario(saved);
      setSavingScenario(false);
      setScenarioSaved(true);
      setTimeout(() => setScenarioSaved(false), 2200);
    } catch (err) {
      setSaveScenarioError('Could not reach the server. Check your connection and try again.');
      setSavingScenario(false);
    }
  }

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
        gap: '3px',
        height: '110px',
        marginBottom: 'var(--sh-space-4)',
        padding: 'var(--sh-space-3)',
        background: 'var(--sh-card)',
        border: 'var(--sh-border-thin)',
        borderBottom: '2px solid var(--sh-bronze-border)',
        borderRadius: 'var(--sh-radius-md)',
      }}>
        {pts.map((p, i) => {
          const isFirst = i === 0;
          const isLast = i === pts.length - 1;
          const isHovered = hoveredYear === p.y;
          const pct = (p.fund / maxFund) * 100;
          // Mobile-overflow guard: a centered label over a narrow bar (many
          // years compressed into a small viewport) can spill past the
          // chart's own left/right edge. First/last bars anchor their label
          // INWARD (left-aligned for the first bar, right-aligned for the
          // last) so the label grows away from the container edge instead
          // of spilling past it. Middle-bar hover labels stay centered —
          // they have room on both sides by construction.
          const labelAlign = isFirst ? 'left' : isLast ? 'right' : 'center';
          const showLabel = isFirst || isLast || isHovered;
          return (
            <div
              key={p.y}
              onMouseEnter={() => setHoveredYear(p.y)}
              onMouseLeave={() => setHoveredYear(null)}
              style={{
                position: 'relative',
                flex: 1,
                minWidth: '3px',
                height: '100%',
                display: 'flex',
                alignItems: 'flex-end',
              }}
            >
              {showLabel && (
                <div style={{
                  position: 'absolute',
                  bottom: `calc(${pct}% + 6px)`,
                  left: labelAlign === 'left' ? '0' : labelAlign === 'center' ? '50%' : 'auto',
                  right: labelAlign === 'right' ? '0' : 'auto',
                  transform: labelAlign === 'center' ? 'translateX(-50%)' : 'none',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--sh-font-serif)',
                  fontSize: 'var(--sh-text-xs)',
                  color: 'var(--sh-bronze-deep)',
                  fontWeight: 500,
                  pointerEvents: 'none',
                }}>
                  {fmt(p.fund)}
                </div>
              )}
              <div
                aria-label={`Year ${p.y}: ${fmt(p.fund)}`}
                style={{
                  width: '100%',
                  height: `${pct}%`,
                  minHeight: '2px',
                  background: isHovered ? 'var(--sh-bronze-deep)' : 'var(--sh-bronze)',
                  borderRadius: '3px 3px 0 0',
                  transition: 'background 120ms ease',
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        marginBottom: 'var(--sh-space-5)',
        marginTop: '-8px',
      }}>
        <span>Year 1</span>
        <span>Year {years}</span>
      </div>

      {appIdentity && scenarios.length > 0 && (
        <div style={{ marginBottom: 'var(--sh-space-4)' }}>
          <label
            htmlFor="load-scenario"
            style={{
              display: 'block',
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
              marginBottom: 'var(--sh-space-2)',
            }}
          >
            Load a saved scenario
          </label>
          <select
            id="load-scenario"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) handleLoadScenario(e.target.value);
              e.target.value = '';
            }}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: 'var(--sh-space-3)',
              border: 'var(--sh-border-thin)',
              borderRadius: 'var(--sh-radius-md)',
              fontFamily: 'inherit',
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-body)',
              background: 'var(--sh-card)',
            }}
          >
            <option value="" disabled>Choose a saved scenario…</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Sliders */}
      <div style={{ marginBottom: 'var(--sh-space-3)' }}>
        <p id={incomeModeLabelId} style={{
          fontSize: 'var(--sh-text-xs)',
          fontWeight: 600,
          color: 'var(--sh-text-primary)',
          letterSpacing: '0.02em',
          marginBottom: '6px',
        }}>
          Annual giving
        </p>
        <SegmentedControl
          options={[
            { value: 'flat', label: 'Flat amount' },
            { value: 'percentage', label: '% of income' },
          ]}
          value={incomeMode}
          onChange={setIncomeMode}
          ariaLabelledBy={incomeModeLabelId}
          size="sm"
        />
        {incomeMode === 'flat' ? (
          <div style={{ marginTop: 'var(--sh-space-3)' }}>
            <Slider
              label="Amount"
              value={fmt(annual)}
              min={500}
              max={500000}
              step={500}
              rawValue={annual}
              onChange={setAnnual}
              prefix="$"
            />
          </div>
        ) : (
          <div style={{ marginTop: 'var(--sh-space-3)' }}>
            <Slider
              label="Annual income"
              value={fmt(incomeBase)}
              min={20000}
              max={2000000}
              step={5000}
              rawValue={incomeBase}
              onChange={setIncomeBase}
              prefix="$"
            />
            <Slider
              label="Percent given"
              value={`${givePct}%`}
              min={0}
              max={50}
              step={0.1}
              rawValue={givePct}
              onChange={setGivePct}
              suffix="%"
              allowDecimal
            />
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              marginTop: 'var(--sh-space-2)',
            }}>
              = {fmt(annual)} per year
            </p>
          </div>
        )}
      </div>
      <Slider
        label="Time horizon"
        value={`${years} years`}
        min={5}
        max={40}
        step={1}
        rawValue={years}
        onChange={setYears}
        suffix=" years"
      />
      <Slider
        label="Fund growth rate"
        value={`${growth}%`}
        min={0}
        max={10}
        step={0.1}
        rawValue={growth}
        onChange={setGrowth}
        suffix="%"
        allowDecimal
      />
      <Slider
        label="Granted out each year"
        value={`${grantPct}%`}
        min={0}
        max={100}
        step={0.1}
        rawValue={grantPct}
        onChange={setGrantPct}
        suffix="%"
        allowDecimal
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
          borderRadius: 'var(--sh-radius-md)',
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
          step={0.1}
          rawValue={careerRate}
          onChange={setCareerRate}
          suffix="%"
          allowDecimal
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

      {appIdentity && (
        <div style={{
          marginTop: 'var(--sh-space-5)',
          paddingTop: 'var(--sh-space-5)',
          borderTop: 'var(--sh-border-thin)',
        }}>
          <label
            htmlFor="scenario-label"
            style={{
              display: 'block',
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
              marginBottom: 'var(--sh-space-2)',
            }}
          >
            Save this projection as
          </label>
          <input
            id="scenario-label"
            type="text"
            value={scenarioLabel}
            onChange={(e) => setScenarioLabel(e.target.value)}
            disabled={savingScenario}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: 'var(--sh-space-3)',
              border: 'var(--sh-border-thin)',
              borderRadius: 'var(--sh-radius-md)',
              fontFamily: 'inherit',
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-body)',
              background: 'var(--sh-card)',
              marginBottom: 'var(--sh-space-3)',
            }}
          />
          {saveScenarioError && (
            <p style={{
              marginBottom: 'var(--sh-space-3)',
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-warning-text)',
              background: 'var(--sh-warning-bg)',
              border: '1px solid var(--sh-warning-border)',
              borderRadius: 'var(--sh-radius-md)',
              padding: 'var(--sh-space-2) var(--sh-space-3)',
            }}>
              {saveScenarioError}
            </p>
          )}
          <Button
            variant="secondary"
            type="button"
            onClick={handleSaveScenario}
            disabled={savingScenario || !scenarioLabel.trim()}
            style={{ width: '100%' }}
          >
            {savingScenario ? 'Saving…' : scenarioSaved ? 'Saved' : 'Save this scenario'}
          </Button>
        </div>
      )}
    </Card>
  );
}

function Slider({ label, value, min, max, step, rawValue, onChange, prefix, suffix, allowDecimal = false }) {
  const [textValue, setTextValue] = useState(String(rawValue));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setTextValue(String(rawValue));
  }, [rawValue]);

  function commitTextValue() {
    let n = Number(textValue);
    if (!Number.isFinite(n)) {
      setTextValue(String(rawValue));
      return;
    }
    n = Math.min(max, Math.max(min, n));
    n = step < 1
      ? Math.round(n * 10) / 10
      : Math.round(n / step) * step;
    onChange(n);
    setTextValue(String(n));
  }

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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sh-space-2)',
        marginTop: '6px',
      }}>
        {prefix && (
          <span style={{ fontSize: 'var(--sh-text-xs)', color: 'var(--sh-text-muted)' }}>
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="numeric"
          value={focused ? textValue : formatWithCommas(textValue, allowDecimal)}
          onChange={(e) => {
            const raw = e.target.value;
            const filtered = allowDecimal
              ? raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
              : raw.replace(/[^0-9]/g, '');
            setTextValue(filtered);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); commitTextValue(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
          style={{
            width: '100px',
            boxSizing: 'border-box',
            padding: '6px 8px',
            border: 'var(--sh-border-thin)',
            borderRadius: 'var(--sh-radius-md)',
            fontFamily: 'inherit',
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-primary)',
            background: 'var(--sh-card)',
          }}
        />
        {suffix && (
          <span style={{ fontSize: 'var(--sh-text-xs)', color: 'var(--sh-text-muted)' }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
