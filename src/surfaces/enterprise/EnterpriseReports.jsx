import { Routes, Route, Link } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';

import ProgramSummary from './reports/ProgramSummary.jsx';
import CohortComparison from './reports/CohortComparison.jsx';
import PhilanthropicReadiness from './reports/PhilanthropicReadiness.jsx';
import ROI from './reports/ROI.jsx';
import Endowment from './reports/Endowment.jsx';

const REPORT_CARDS = [
  { slug: 'summary',   title: 'Program Summary',         desc: 'Cohort snapshot, status breakdown, engagement, workshops to date.' },
  { slug: 'cohort',    title: 'Cohort Comparison',       desc: 'Year-over-year and sport-level comparisons.' },
  { slug: 'readiness', title: 'Philanthropic Readiness', desc: 'Per-athlete structural progress against program gates.' },
  { slug: 'roi',       title: 'ROI',                     desc: 'Return on partnership investment.' },
  { slug: 'endowment', title: 'Endowment',               desc: '$8.5K/yr endowment performance and projections.' },
];

export default function EnterpriseReports() {
  return (
    <Routes>
      <Route index element={<ReportsHub />} />
      <Route path="summary" element={<ProgramSummary />} />
      <Route path="cohort" element={<CohortComparison />} />
      <Route path="readiness" element={<PhilanthropicReadiness />} />
      <Route path="roi" element={<ROI />} />
      <Route path="endowment" element={<Endowment />} />
    </Routes>
  );
}

function ReportsHub() {
  return (
    <main style={mainStyle}>
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Reports</h1>
      <div style={gridStyle}>
        {REPORT_CARDS.map((card) => (
          <Link key={card.slug} to={card.slug} style={linkStyle}>
            <Card>
              <p style={cardTitleStyle}>{card.title}</p>
              <p style={cardDescStyle}>{card.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

const mainStyle = {
  maxWidth: 'var(--sh-content-max)',
  margin: '0 auto',
  padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
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
  marginBottom: 'var(--sh-space-6)',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 'var(--sh-space-4)',
};

const linkStyle = {
  display: 'block',
  textDecoration: 'none',
  color: 'inherit',
  cursor: 'pointer',
};

const cardTitleStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-md)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-2)',
};

const cardDescStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.55,
};
