import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { cohorts } from '../../data/cohorts.js';
import { clients } from '../../data/clients.js';

export default function CohortDetail() {
  const { cohortId } = useParams();
  const cohort = cohorts.find(c => c.id === cohortId);

  if (!cohort) {
    return (
      <main style={mainStyle}>
        <div style={breadcrumbStyle}>
          <Link to="/advisor/cohorts" style={breadcrumbLinkStyle}>
            Cohorts
          </Link>
        </div>
        <Card>
          <p style={emptyTextStyle}>
            Cohort not found.
          </p>
        </Card>
      </main>
    );
  }

  const rosterMembers = cohort.memberIds
    .map(id => clients.find(c => c.id === id))
    .filter(Boolean);
  const externalCount = cohort.externalMembers || 0;
  const memberCount = cohort.memberIds.length + externalCount;
  const assignedLessons = cohort.assignedLessons || [];
  const sessions = cohort.sessions || [];

  return (
    <main style={mainStyle}>
      {/* Breadcrumb */}
      <div style={breadcrumbStyle}>
        <Link to="/advisor/cohorts" style={breadcrumbLinkStyle}>
          Cohorts
        </Link>
        {' · '}
        <span>{cohort.name}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--sh-space-2)',
        }}>
          {cohort.focus}
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: 'var(--sh-text-primary)',
        }}>
          {cohort.name}
        </h1>
      </div>

      {/* Identity card — metadata + summary */}
      <Card style={{ marginBottom: 'var(--sh-space-6)' }}>
        <div style={{
          display: 'flex',
          gap: 'var(--sh-space-8)',
          paddingBottom: 'var(--sh-space-4)',
          borderBottom: 'var(--sh-border-divider)',
          marginBottom: 'var(--sh-space-4)',
        }}>
          <Meta label="Members" value={memberCount} />
          <Meta label="Started" value={cohort.started} />
          <Meta label="Next session" value={cohort.nextSession} />
        </div>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-body)',
          lineHeight: 1.65,
          maxWidth: '720px',
        }}>
          {cohort.summary}
        </p>
      </Card>

      {/* Members */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card>
          <SectionLabel>Members</SectionLabel>
          {rosterMembers.length === 0 && externalCount === 0 && (
            <p style={emptyTextStyle}>No members assigned yet.</p>
          )}
          {rosterMembers.length > 0 && (
            <ul style={listResetStyle}>
              {rosterMembers.map((m, idx) => (
                <li key={m.id} style={{
                  paddingTop: idx === 0 ? 0 : 'var(--sh-space-3)',
                  paddingBottom: 'var(--sh-space-3)',
                  borderTop: idx === 0 ? 'none' : 'var(--sh-border-divider)',
                }}>
                  <Link
                    to={`/advisor/clients/${m.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 'var(--sh-space-3)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--sh-font-serif)',
                      fontSize: 'var(--sh-text-md)',
                      color: 'var(--sh-text-primary)',
                    }}>
                      {m.name}
                    </span>
                    <span style={{
                      fontSize: 'var(--sh-text-xs)',
                      color: 'var(--sh-text-muted)',
                    }}>
                      {m.sport} · {m.level}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {externalCount > 0 && (
            <p style={{
              marginTop: rosterMembers.length > 0 ? 'var(--sh-space-4)' : 0,
              paddingTop: rosterMembers.length > 0 ? 'var(--sh-space-4)' : 0,
              borderTop: rosterMembers.length > 0 ? 'var(--sh-border-divider)' : 'none',
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-muted)',
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}>
              Plus {externalCount} {externalCount === 1 ? 'teammate' : 'teammates'} outside your client roster.
            </p>
          )}
        </Card>
      </div>

      {/* Curriculum track */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card>
          <SectionLabel>Curriculum track</SectionLabel>
          {assignedLessons.length === 0 && (
            <p style={emptyTextStyle}>
              No curriculum assigned to this cohort yet.
            </p>
          )}
        </Card>
      </div>

      {/* Sessions */}
      <div>
        <Card>
          <SectionLabel>Sessions</SectionLabel>
          {sessions.length === 0 && (
            <p style={emptyTextStyle}>
              No sessions logged yet.
            </p>
          )}
        </Card>
      </div>
    </main>
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

const mainStyle = {
  maxWidth: 'var(--sh-content-max)',
  margin: '0 auto',
  padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
};

const breadcrumbStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  marginBottom: 'var(--sh-space-4)',
  letterSpacing: '0.04em',
};

const breadcrumbLinkStyle = {
  color: 'var(--sh-text-muted)',
  textDecoration: 'none',
};

const emptyTextStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  lineHeight: 1.6,
};

const listResetStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};
