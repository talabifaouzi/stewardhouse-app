import { useState } from 'react';
import { Card } from '../../../components/Card.jsx';
import { SectionLabel } from '../../../components/SectionLabel.jsx';
import BackLink from '../../../components/BackLink.jsx';
import StatTile from '../../../components/StatTile.jsx';
import { endowmentSnapshot } from '../../../data/enterpriseFixtures.js';

const fmtUSD = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const fmtPct = (n) => `${n.toFixed(1)}%`;

export default function Endowment() {
  const [annualContribution, setAnnualContribution] = useState(endowmentSnapshot.annualContribution);
  const [payoutRate, setPayoutRate] = useState(5);
  const [growthRate, setGrowthRate] = useState(6);
  const [termYears, setTermYears] = useState(10);
  const [showFormula, setShowFormula] = useState(false);

  // Projection math — compounded starting balance + annuity contributions
  const g = growthRate / 100;
  const n = termYears;
  const P = annualContribution;
  const startingValue = endowmentSnapshot.currentValue;
  const projectedValue = Math.round(
    startingValue * Math.pow(1 + g, n) + P * ((Math.pow(1 + g, n) - 1) / g),
  );
  const finalYearDistribution = Math.round(projectedValue * (payoutRate / 100));
  const totalContributions = P * n;

  return (
    <main style={mainStyle}>
      <BackLink to="/enterprise/reports" label="Reports" />
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Endowment</h1>
      <p style={subtitleStyle}>
        Phase 1 snapshot and forward modeling. Structural details subject to legal review.
      </p>

      {/* Phase 1 — Current state */}
      <Card>
        <SectionLabel>Current state</SectionLabel>
        <p style={asOfStyle}>As of {endowmentSnapshot.asOfDate}</p>
        <div style={statRowStyle}>
          <StatTile
            variant="inline"
            label="Current value"
            value={fmtUSD(endowmentSnapshot.currentValue)}
            sublabel="Endowment principal + growth"
          />
          <StatTile
            variant="inline"
            label="Contributions to date"
            value={fmtUSD(endowmentSnapshot.contributionsToDate)}
            sublabel="Program year 1"
          />
          <StatTile
            variant="inline"
            label="Growth to date"
            value={fmtUSD(endowmentSnapshot.growthToDate)}
            sublabel="Estimated, ~6% annualized"
          />
        </div>
        <p style={policyNoteStyle}>
          Distributions follow the 5% annual payout rule applied to trailing 3-year average value. First-year distributions begin in program year 2. Distribution proceeds support cohort-selected nonprofits aligned with the philanthropic curriculum.
        </p>
        <p style={taxFootnoteStyle}>
          Tax treatment: Charitable contribution; deductible per IRS § 170(c). Consult your tax advisor.
        </p>
      </Card>

      {/* Modeling section header */}
      <div style={modelingHeaderStyle}>
        <h2 style={modelingTitleStyle}>How this might grow — interactive modeling</h2>
        <p style={modelingDescStyle}>
          Adjust the assumptions below to project how the endowment may grow under different scenarios. All figures are illustrative.
        </p>
      </div>

      {/* Phase 2 — Modeling */}
      <Card style={{ marginBottom: 'var(--sh-space-5)' }}>
        <SectionLabel>Assumptions</SectionLabel>
        <div style={slidersStackStyle}>
          <SliderBlock
            label="Annual contribution"
            display={fmtUSD(annualContribution)}
            value={annualContribution}
            min={5000}
            max={50000}
            step={500}
            onChange={setAnnualContribution}
          />
          <SliderBlock
            label="Payout rate"
            display={fmtPct(payoutRate)}
            value={payoutRate}
            min={3.5}
            max={7}
            step={0.5}
            onChange={setPayoutRate}
          />
          <SliderBlock
            label="Growth assumption"
            display={fmtPct(growthRate)}
            value={growthRate}
            min={4}
            max={8}
            step={0.5}
            onChange={setGrowthRate}
          />

          {/* Term horizon segmented control */}
          <div>
            <div style={sliderLabelRowStyle}>
              <span style={sliderLabelStyle}>Term horizon</span>
              <span style={sliderValueStyle}>{termYears} years</span>
            </div>
            <div style={segmentedControlStyle}>
              {[5, 10, 20].map((yr, idx, arr) => {
                const side = idx === 0 ? 'left' : idx === arr.length - 1 ? 'right' : 'middle';
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setTermYears(yr)}
                    style={segmentButtonStyle(termYears === yr, side)}
                  >
                    {yr} years
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Phase 2 — Output */}
      <Card style={{ marginBottom: 'var(--sh-space-5)' }}>
        <SectionLabel>Projected outcomes at year {termYears}</SectionLabel>
        <div style={statRowStyle}>
          <StatTile
            variant="inline"
            label="Projected endowment value"
            value={fmtUSD(projectedValue)}
            sublabel={`End of ${termYears}-year horizon`}
          />
          <StatTile
            variant="inline"
            label="Final-year annual distribution"
            value={fmtUSD(finalYearDistribution)}
            sublabel={`${fmtPct(payoutRate)} of projected value`}
          />
          <StatTile
            variant="inline"
            label="Total contributions"
            value={fmtUSD(totalContributions)}
            sublabel={`${termYears} years × ${fmtUSD(annualContribution)}`}
          />
        </div>

        {/* How this is calculated — expandable footer */}
        <div style={calcExpanderStyle}>
          <button
            type="button"
            onClick={() => setShowFormula((s) => !s)}
            style={calcToggleStyle}
          >
            {showFormula ? 'Hide calculation' : 'Show calculation'}
          </button>
          {showFormula && (
            <div style={formulaBoxStyle}>
              <p style={formulaTextStyle}>
                Projected value = current value × (1 + g)^n + P × ((1 + g)^n − 1) / g
              </p>
              <p style={formulaLegendStyle}>
                where P = annual contribution, g = growth rate, n = years
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Compliance notice */}
      <Card tint>
        <div style={noticeHeaderStyle}>
          <SectionLabel>Important notice</SectionLabel>
          <span style={reviewPillStyle}>REVIEW PENDING</span>
        </div>
        <p style={noticeBodyStyle}>
          Illustrative projections only. Not investment advice. Actual outcomes may vary based on market conditions and economic factors. Endowment structure — including tax treatment, distribution mechanism, and governance — is subject to legal review prior to partnership finalization. Consult your financial advisor and legal counsel before relying on these projections for planning purposes.
        </p>
      </Card>
    </main>
  );
}

function SliderBlock({ label, display, value, min, max, step, onChange }) {
  return (
    <div>
      <div style={sliderLabelRowStyle}>
        <span style={sliderLabelStyle}>{label}</span>
        <span style={sliderValueStyle}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={sliderInputStyle}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const mainStyle = {
  maxWidth: 'var(--sh-content-max)',
  margin: '0 auto',
  padding: 'var(--sh-space-10) clamp(var(--sh-space-3), 4vw, var(--sh-space-8)) var(--sh-space-16)',
};

const eyebrowStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--sh-space-2)',
};

const titleStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-2xl)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-3)',
};

const subtitleStyle = {
  fontSize: 'var(--sh-text-md)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  marginBottom: 'var(--sh-space-6)',
  maxWidth: '720px',
};

const asOfStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  marginTop: 'var(--sh-space-2)',
  marginBottom: 'var(--sh-space-3)',
};

const statRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 'var(--sh-space-4)',
  marginTop: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-4)',
};

const policyNoteStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-3)',
  maxWidth: '720px',
};

const taxFootnoteStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  lineHeight: 1.55,
  maxWidth: '720px',
};

const modelingHeaderStyle = {
  marginTop: 'var(--sh-space-8)',
  marginBottom: 'var(--sh-space-5)',
};

const modelingTitleStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-lg)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-2)',
};

const modelingDescStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  maxWidth: '720px',
};

const slidersStackStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-5)',
  marginTop: 'var(--sh-space-3)',
};

const sliderLabelRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: 'var(--sh-space-2)',
};

const sliderLabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
};

const sliderValueStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
};

const sliderInputStyle = {
  width: '100%',
  accentColor: 'var(--sh-bronze)',
  cursor: 'pointer',
};

const segmentedControlStyle = {
  display: 'inline-flex',
};

function segmentButtonStyle(isActive, side) {
  const radius = 'var(--sh-radius-md)';
  return {
    background: isActive ? 'var(--sh-bronze)' : 'transparent',
    color: isActive ? 'var(--sh-bg)' : 'var(--sh-bronze)',
    border: '1px solid var(--sh-bronze)',
    padding: '6px 14px',
    fontSize: 'var(--sh-text-xs)',
    fontFamily: 'inherit',
    fontWeight: 500,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    borderTopLeftRadius: side === 'left' ? radius : 0,
    borderBottomLeftRadius: side === 'left' ? radius : 0,
    borderTopRightRadius: side === 'right' ? radius : 0,
    borderBottomRightRadius: side === 'right' ? radius : 0,
    borderRight: side === 'right' ? '1px solid var(--sh-bronze)' : 'none',
    transition: 'background 150ms ease, color 150ms ease',
  };
}

const calcExpanderStyle = {
  marginTop: 'var(--sh-space-4)',
  paddingTop: 'var(--sh-space-4)',
  borderTop: 'var(--sh-border-thin)',
};

const calcToggleStyle = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-bronze)',
  fontFamily: 'inherit',
  cursor: 'pointer',
  letterSpacing: '0.04em',
};

const formulaBoxStyle = {
  marginTop: 'var(--sh-space-3)',
  padding: 'var(--sh-space-3) var(--sh-space-4)',
  background: 'var(--sh-bg-tint)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
};

const formulaTextStyle = {
  fontFamily: 'monospace',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  margin: 0,
};

const formulaLegendStyle = {
  fontFamily: 'monospace',
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  marginTop: 'var(--sh-space-2)',
  lineHeight: 1.5,
};

const noticeHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-3)',
};

const reviewPillStyle = {
  display: 'inline-block',
  padding: '2px 10px',
  background: 'var(--sh-bronze-tint)',
  color: 'var(--sh-bronze-deep)',
  borderRadius: 'var(--sh-radius-full)',
  fontSize: 'var(--sh-text-xs)',
  fontWeight: 500,
  letterSpacing: '0.08em',
  whiteSpace: 'nowrap',
};

const noticeBodyStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  fontStyle: 'italic',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-2)',
};
