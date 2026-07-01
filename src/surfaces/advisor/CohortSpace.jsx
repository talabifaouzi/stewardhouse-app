import { Link } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { cohorts } from '../../data/cohorts.js';
import { formatSessionDate } from '../../data/clients.js';
import { useBasePath } from '../../contexts/AppIdentityContext.jsx';

export default function CohortSpace() {
  const basePath = useBasePath('/advisor', '/app/advisor');
  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <div style={{ marginBottom: 'var(--sh-space-8)' }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--sh-space-2)',
        }}>
          Cohorts
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 'var(--sh-space-5)',
      }}>
        {cohorts.map(cohort => (
          <Link
            key={cohort.id}
            to={`${basePath}/cohorts/${cohort.id}`}
            style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
          >
            <CohortCard cohort={cohort} />
          </Link>
        ))}
      </div>
    </main>
  );
}

function CohortCard({ cohort }) {
  return (
    <Card style={{ cursor: 'pointer' }}>
      {/* ADV-002 — cohort.focus is a decorative kicker for the cohort name,
          not a section heading. Was <SectionLabel> (rendered <h2>) above the
          <h3> below — semantic-hierarchy inversion. Now a plain <p> eyebrow
          carrying the same kicker styles so the visible look is unchanged. */}
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        fontWeight: 500,
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 'var(--sh-space-3)',
      }}>
        {cohort.focus}
      </p>
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
        <Meta label="Members" value={cohort.memberIds.length + (cohort.externalMembers || 0)} />
        <Meta label="Started" value={cohort.started} />
        <Meta label="Next" value={formatSessionDate(cohort.nextSession)} />
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
        marginBottom: 'var(--sh-space-half)',
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
