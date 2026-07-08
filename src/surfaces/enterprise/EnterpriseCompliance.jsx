import { useState } from 'react';
import { exclusions, complianceAuditLog, CURRENT_USER } from '../../data/enterpriseFixtures.js';
import { useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { Tag } from '../../components/Tag.jsx';
import ExclusionDetail from '../../components/ExclusionDetail.jsx';
import { formatDateTime } from '../../utils/formatDate.js';

export default function EnterpriseCompliance() {
  const [activeExclusion, setActiveExclusion] = useState(null);
  const [exclusionOverrides, setExclusionOverrides] = useState({});
  const [hoveredId, setHoveredId] = useState(null);
  const [sessionAuditEntries, setSessionAuditEntries] = useState([]);

  // Session-edit audit author: real operator identity on the authenticated
  // tree, Diane fixture on the demo tree.
  const appIdentity = useOptionalAppIdentity();
  const isAuthenticated = !!appIdentity;
  const authorName = appIdentity ? (appIdentity.identity?.displayName ?? '') : CURRENT_USER.name;
  const authorRole = appIdentity ? (appIdentity.identity?.enterprise?.roleTitle ?? '') : CURRENT_USER.title;

  // Auth tree: exclusion + audit fixtures are withheld — the exclusion and
  // compliance_audit tables are empty per the slim seed (write path is
  // future). Session edits made THIS session still append to the visible log
  // (real-authored per the identity above).
  const displayedExclusions = (isAuthenticated ? [] : exclusions).map((e) => ({ ...e, ...exclusionOverrides[e.id] }));

  const handleSave = (updated) => {
    setExclusionOverrides((prev) => ({ ...prev, [updated.id]: updated }));
    setSessionAuditEntries((prev) => [
      {
        id: `session-${crypto.randomUUID()}`,
        timestamp: 'Just now',
        user: authorName,
        userRole: authorRole,
        action: 'Edited organization in exclusion list',
        target: updated.name,
        reason: 'Session edit',
        isSession: true,
      },
      ...prev,
    ]);
  };

  const auditEntries = [...sessionAuditEntries, ...(isAuthenticated ? [] : complianceAuditLog)];

  const hasOverride = activeExclusion
    ? Boolean(exclusionOverrides[activeExclusion.id])
    : false;

  return (
    <main style={mainStyle}>
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Compliance</h1>
      <p style={subtitleStyle}>
        The department surfaces compliance-relevant information to athletes. Final filings and approvals remain with the school's compliance officer; the platform does not adjudicate or evaluate.
      </p>

      <div style={cardStackStyle}>
        {/* NIL disclosure tracking — placeholder */}
        <Card tint>
          <SectionLabel>NIL disclosure tracking</SectionLabel>
          <p style={nilNoteStyle}>
            Per-athlete NIL disclosure tracking will integrate with the school's compliance system in a future slice. Athletes participate in the StewardHouse program independent of NIL filings.
          </p>
        </Card>

        {/* Excluded organizations — clickable list */}
        <Card>
          <SectionLabel>Excluded organizations</SectionLabel>
          <p style={explainerStyle}>
            Organizations flagged by the department. Athletes still see these when choosing a gift target, with a contextual note explaining the flag — disclosure model, not blocking.
          </p>
          {displayedExclusions.length > 0 ? (
            <ul style={listResetStyle}>
              {displayedExclusions.map((org, i) => {
                const isLast = i === displayedExclusions.length - 1;
                const isHovered = hoveredId === org.id;
                return (
                  <li key={org.id}>
                    <button
                      type="button"
                      onClick={() => setActiveExclusion(org)}
                      onMouseEnter={() => setHoveredId(org.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        ...rowButtonStyle(isLast),
                        background: isHovered ? 'var(--sh-bg-tint)' : 'transparent',
                      }}
                    >
                      <p style={orgNameStyle}>{org.name}</p>
                      <p style={metaStyle}>EIN: {org.ein}</p>
                      <p style={reasonStyle}>Reason: {org.reason}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={emptyStateStyle}>No exclusions recorded.</p>
          )}
        </Card>
      </div>

      {/* Audit trail */}
      <Card style={{ marginTop: 'var(--sh-space-6)' }}>
        <SectionLabel>Audit trail</SectionLabel>
        <p style={auditContextStyle}>
          Compliance actions logged with timestamp and reviewer. Production maintains tamper-resistant audit log; prototype shows pre-seeded entries and any in-session edits.
        </p>
        {auditEntries.length > 0 ? (
          <ul style={auditListStyle}>
            {auditEntries.map((entry, i) => {
              const isLast = i === auditEntries.length - 1;
              return (
                <li key={entry.id}>
                  <AuditEntry entry={entry} isLast={isLast} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p style={emptyStateStyle}>Audit entries appear here as compliance actions occur.</p>
        )}
        <p style={auditFootnoteStyle}>
          Production deployment captures every exclusion edit, review, and policy change. This audit log is read-only in production.
        </p>
      </Card>

      <ExclusionDetail
        isOpen={activeExclusion !== null}
        onClose={() => setActiveExclusion(null)}
        exclusion={activeExclusion}
        onSave={handleSave}
        hasOverride={hasOverride}
      />
    </main>
  );
}

function AuditEntry({ entry, isLast }) {
  return (
    <div style={auditEntryStyle(isLast)}>
      <div style={auditTopRowStyle}>
        <div style={auditTimestampGroupStyle}>
          <span style={auditTimestampStyle}>{formatDateTime(entry.timestamp)}</span>
          {entry.isSession && <Tag color="bronze" tracking="loose">SESSION</Tag>}
        </div>
        <span style={auditUserStyle}>
          {entry.user} <span style={auditRoleStyle}>({entry.userRole})</span>
        </span>
      </div>
      <p style={auditActionStyle}>{entry.action}</p>
      {entry.target && (
        <p style={auditDetailStyle}>
          <span style={auditDetailLabelStyle}>Organization:</span> {entry.target}
        </p>
      )}
      {entry.reason && (
        <p style={auditReasonStyle}>
          <span style={auditDetailLabelStyle}>Reason:</span> {entry.reason}
        </p>
      )}
      {entry.notes && (
        <p style={auditNotesStyle}>{entry.notes}</p>
      )}
    </div>
  );
}

const mainStyle = {
  maxWidth: 'var(--sh-content-max)',
  margin: '0 auto',
  padding: 'var(--sh-space-10) clamp(var(--sh-space-3), 4vw, var(--sh-space-8)) var(--sh-space-16)',
};

// Quiet empty-state line for the auth tree (no exclusions / audit entries yet).
const emptyStateStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 'var(--sh-space-3)',
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
  maxWidth: '720px',
  lineHeight: 1.65,
  marginBottom: 'var(--sh-space-8)',
};

const cardStackStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-5)',
};

const nilNoteStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
  maxWidth: '640px',
};

const explainerStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-3)',
  maxWidth: '640px',
};

const listResetStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

function rowButtonStyle(isLast) {
  return {
    display: 'block',
    width: '100%',
    border: 'none',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
    padding: 'var(--sh-space-4) var(--sh-space-3)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'background 150ms ease',
  };
}

const orgNameStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-1)',
};

const metaStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  marginBottom: 'var(--sh-space-1)',
};

const reasonStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.55,
};

// Audit trail styles
const auditContextStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  lineHeight: 1.55,
  marginTop: 'var(--sh-space-2)',
  marginBottom: 'var(--sh-space-4)',
  maxWidth: '720px',
};

const auditListStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

const auditFootnoteStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  lineHeight: 1.55,
  marginTop: 'var(--sh-space-4)',
  paddingTop: 'var(--sh-space-3)',
  borderTop: 'var(--sh-border-thin)',
  maxWidth: '720px',
};

function auditEntryStyle(isLast) {
  return {
    paddingTop: 'var(--sh-space-4)',
    paddingBottom: 'var(--sh-space-4)',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
  };
}

const auditTopRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-2)',
};

const auditTimestampGroupStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--sh-space-2)',
};

const auditTimestampStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
};

const auditUserStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
};

const auditRoleStyle = {
  color: 'var(--sh-text-muted)',
};

const auditActionStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-2)',
  lineHeight: 1.5,
};

const auditDetailStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.55,
  marginBottom: 'var(--sh-space-1)',
};

const auditDetailLabelStyle = {
  color: 'var(--sh-text-muted)',
  fontWeight: 500,
};

const auditReasonStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  fontStyle: 'italic',
  lineHeight: 1.55,
  marginBottom: 'var(--sh-space-1)',
};

const auditNotesStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.55,
  marginTop: 'var(--sh-space-2)',
};
