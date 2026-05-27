import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { cohorts } from '../../data/cohorts.js';
import { clients } from '../../data/clients.js';
import { THEMES } from '../../data/themes.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(iso) {
  if (!iso || typeof iso !== 'string') return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatNames(names) {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export default function CohortDetail() {
  const { cohortId } = useParams();
  const cohort = cohorts.find(c => c.id === cohortId);
  const [updates, setUpdates] = useState(cohort?.updates || []);
  const [titleDraft, setTitleDraft] = useState('');
  const [bodyDraft, setBodyDraft] = useState('');
  const [flags, setFlags] = useState({});

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

  const themeMembership = {};
  rosterMembers.forEach(m => {
    const themes = m.givingPlan?.themes || [];
    themes.forEach(themeId => {
      if (!themeMembership[themeId]) themeMembership[themeId] = [];
      themeMembership[themeId].push(m.name);
    });
  });
  const themeLabelById = Object.fromEntries(THEMES.map(t => [t.id, t.label]));
  const sharedInterests = Object.entries(themeMembership)
    .filter(([, names]) => names.length >= 2)
    .map(([id, names]) => ({
      id,
      label: themeLabelById[id] || id,
      names,
    }))
    .sort((a, b) => b.names.length - a.names.length);

  const toggleFlag = (themeId) => {
    setFlags(prev => {
      if (prev[themeId]) {
        const next = { ...prev };
        delete next[themeId];
        return next;
      }
      return { ...prev, [themeId]: { note: '' } };
    });
  };

  const updateFlagNote = (themeId, note) => {
    setFlags(prev => ({
      ...prev,
      [themeId]: { ...prev[themeId], note },
    }));
  };

  const canPublish = titleDraft.trim().length > 0 && bodyDraft.trim().length > 0;

  const publish = () => {
    if (!canPublish) return;
    const newUpdate = {
      id: `u-local-${Date.now()}`,
      date: todayIso(),
      title: titleDraft.trim(),
      body: bodyDraft.trim(),
    };
    setUpdates(prev => [newUpdate, ...prev]);
    setTitleDraft('');
    setBodyDraft('');
  };

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

      {/* Shared interests — themes shared by 2+ roster members */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card>
          <SectionLabel>Shared interests</SectionLabel>
          {sharedInterests.length === 0 ? (
            <p style={emptyTextStyle}>No shared interests surfaced yet.</p>
          ) : (
            <>
              <p style={{
                fontSize: 'var(--sh-text-xs)',
                color: 'var(--sh-text-muted)',
                fontStyle: 'italic',
                lineHeight: 1.55,
                marginBottom: 'var(--sh-space-4)',
              }}>
                Flags and notes are private to you. Notes added in this session are not yet persisted.
              </p>
              <ul style={listResetStyle}>
                {sharedInterests.map((s, idx) => {
                  const isFlagged = !!flags[s.id];
                  return (
                    <li key={s.id} style={{
                      paddingTop: idx === 0 ? 0 : 'var(--sh-space-3)',
                      paddingBottom: 'var(--sh-space-3)',
                      borderTop: idx === 0 ? 'none' : 'var(--sh-border-divider)',
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 'var(--sh-space-3)',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontFamily: 'var(--sh-font-serif)',
                            fontSize: 'var(--sh-text-md)',
                            color: 'var(--sh-text-primary)',
                            marginBottom: 'var(--sh-space-1)',
                          }}>
                            {s.label}
                          </p>
                          <p style={{
                            fontSize: 'var(--sh-text-sm)',
                            color: 'var(--sh-text-secondary)',
                            lineHeight: 1.55,
                          }}>
                            {formatNames(s.names)}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleFlag(s.id)}
                          style={{
                            background: isFlagged ? 'var(--sh-bronze-tint)' : 'none',
                            color: isFlagged ? 'var(--sh-bronze-deep)' : 'var(--sh-text-muted)',
                            border: 'none',
                            padding: isFlagged ? '2px 8px' : 0,
                            borderRadius: isFlagged ? '4px' : 0,
                            fontSize: 'var(--sh-text-xs)',
                            fontWeight: isFlagged ? 500 : 400,
                            letterSpacing: '0.02em',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isFlagged ? 'Flagged' : 'Flag for follow-up'}
                        </button>
                      </div>
                      {isFlagged && (
                        <textarea
                          value={flags[s.id].note}
                          onChange={(e) => updateFlagNote(s.id, e.target.value)}
                          placeholder="Private note for your own follow-up (optional)."
                          rows={2}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: 'var(--sh-space-3)',
                            border: 'var(--sh-border-thin)',
                            borderRadius: '6px',
                            fontFamily: 'inherit',
                            fontSize: 'var(--sh-text-sm)',
                            color: 'var(--sh-text-body)',
                            background: 'var(--sh-card)',
                            resize: 'vertical',
                            lineHeight: 1.55,
                            marginTop: 'var(--sh-space-3)',
                          }}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Card>
      </div>

      {/* Updates — composer + published list */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <Card>
          <SectionLabel>Updates</SectionLabel>

          <input
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            placeholder="Title"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: 'var(--sh-space-3)',
              border: 'var(--sh-border-thin)',
              borderRadius: '6px',
              fontFamily: 'inherit',
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-body)',
              background: 'var(--sh-card)',
              marginBottom: 'var(--sh-space-2)',
            }}
          />
          <textarea
            value={bodyDraft}
            onChange={(e) => setBodyDraft(e.target.value)}
            placeholder="What is the update? You author it; the platform routes it to members."
            rows={4}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: 'var(--sh-space-3)',
              border: 'var(--sh-border-thin)',
              borderRadius: '6px',
              fontFamily: 'inherit',
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-body)',
              background: 'var(--sh-card)',
              resize: 'vertical',
              lineHeight: 1.55,
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--sh-space-3)',
            marginTop: 'var(--sh-space-2)',
          }}>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              fontStyle: 'italic',
              lineHeight: 1.4,
              flex: 1,
            }}>
              Updates published in this session are not yet persisted.
            </p>
            <button
              onClick={publish}
              disabled={!canPublish}
              style={{
                background: 'var(--sh-bronze)',
                color: 'white',
                border: 'none',
                padding: 'var(--sh-space-2) var(--sh-space-4)',
                borderRadius: '4px',
                fontSize: 'var(--sh-text-sm)',
                fontWeight: 500,
                cursor: canPublish ? 'pointer' : 'not-allowed',
                opacity: canPublish ? 1 : 0.4,
                flexShrink: 0,
              }}
            >
              Publish update
            </button>
          </div>

          <div style={{
            marginTop: 'var(--sh-space-5)',
            paddingTop: 'var(--sh-space-4)',
            borderTop: 'var(--sh-border-divider)',
          }}>
            {updates.length === 0 ? (
              <p style={emptyTextStyle}>No updates published yet.</p>
            ) : (
              updates.map((u, idx) => (
                <UpdateItem key={u.id} update={u} first={idx === 0} />
              ))
            )}
          </div>
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

function UpdateItem({ update, first }) {
  return (
    <div style={{
      paddingTop: first ? 0 : 'var(--sh-space-4)',
      paddingBottom: 'var(--sh-space-4)',
      borderTop: first ? 'none' : 'var(--sh-border-divider)',
    }}>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        marginBottom: 'var(--sh-space-1)',
        letterSpacing: '0.02em',
      }}>
        {formatDate(update.date)}
      </p>
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-base)',
        color: 'var(--sh-text-primary)',
        marginBottom: 'var(--sh-space-2)',
      }}>
        {update.title}
      </p>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-secondary)',
        lineHeight: 1.6,
        fontStyle: 'italic',
      }}>
        {update.body}
      </p>
    </div>
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
