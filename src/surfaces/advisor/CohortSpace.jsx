import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';

const cohorts = [
  {
    id: 'co-01',
    name: 'Spring 2026 — first NIL signers',
    members: 6,
    sector: 'Athletics',
    started: 'February 2026',
    nextSession: 'May 18, 2026',
    summary: 'Six first-year NIL signers working through the same six-session sequence. Cohort meets monthly; individual sessions in between.',
  },
  {
    id: 'co-02',
    name: 'Catalog deal alumni',
    members: 4,
    sector: 'Music',
    started: 'October 2025',
    nextSession: 'May 27, 2026',
    summary: 'Independent artists who recently completed catalog or advance deals. Focused on liquidity-event giving structure.',
  },
];

export default function CohortSpace() {
  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--sh-space-6)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        <div>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 'var(--sh-space-2)',
          }}>
            Section 5 · Cohorts
          </p>
          <h1 style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-2xl)',
            color: 'var(--sh-text-primary)',
            marginBottom: 'var(--sh-space-2)',
          }}>
            Cohorts and workshops
          </h1>
          <p style={{
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-text-secondary)',
            maxWidth: '640px',
            lineHeight: 1.6,
          }}>
            Group-based learning across clients with shared circumstances or stage. Curricula travel as a unit; cohort updates surface to all members.
          </p>
        </div>
        <Button variant="primary">Start a cohort</Button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 'var(--sh-space-5)',
      }}>
        {cohorts.map(cohort => (
          <CohortCard key={cohort.id} cohort={cohort} />
        ))}
      </div>
    </main>
  );
}

function CohortCard({ cohort }) {
  return (
    <Card>
      <SectionLabel>{cohort.sector}</SectionLabel>
      <h3 style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-xl)',
        color: 'var(--sh-text-primary)',
        marginBottom: 'var(--sh-space-3)',
      }}>
        {cohort.name}
      </h3>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-secondary)',
        lineHeight: 1.6,
        marginBottom: 'var(--sh-space-5)',
      }}>
        {cohort.summary}
      </p>
      <div style={{
        display: 'flex',
        gap: 'var(--sh-space-6)',
        paddingTop: 'var(--sh-space-3)',
        borderTop: 'var(--sh-border-divider)',
      }}>
        <Meta label="Members" value={cohort.members} />
        <Meta label="Started" value={cohort.started} />
        <Meta label="Next" value={cohort.nextSession} />
      </div>
    </Card>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '2px',
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-primary)',
      }}>
        {value}
      </p>
    </div>
  );
}
