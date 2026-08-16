import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { Icon } from '../../components/Icon.jsx';
import { formatSessionDate } from '../../data/clients.js';
import { useBasePath } from '../../contexts/AppIdentityContext.jsx';
import { useCohorts } from '../../contexts/CohortsContext.jsx';

export default function CohortSpace() {
  const basePath = useBasePath('/advisor', '/app/advisor');
  const { cohorts, add } = useCohorts();

  const [isAddingCohort, setIsAddingCohort] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFocus, setNewFocus] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const openAdd = () => {
    setNewName(''); setNewFocus(''); setSaveError('');
    setIsAddingCohort(true);
  };
  const cancelAdd = () => {
    setNewName(''); setNewFocus(''); setSaveError('');
    setIsAddingCohort(false);
  };
  const saveCohort = async () => {
    const name = newName.trim();
    if (!name) { setSaveError('Name is required.'); return; }
    setSaving(true);
    setSaveError('');
    const focus = newFocus.trim();
    // R1 philosophy: minimal name-only create; focus is a small optional
    // one-liner. Other fields (started, nextSessionDate, summary,
    // externalMembers, updates, sessions, assignedLessons) filled through
    // use via edit later.
    const payload = focus ? { name, focus } : { name };
    const result = await add(payload);
    setSaving(false);
    if (!result) { setSaveError('Could not save. Please try again.'); return; }
    cancelAdd();
  };

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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 'var(--sh-space-4)',
          marginBottom: 'var(--sh-space-2)',
          flexWrap: 'wrap',
        }}>
          <h1 style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-2xl)',
            color: 'var(--sh-text-primary)',
          }}>
            Cohorts and workshops
          </h1>
          {!isAddingCohort && (
            <button
              type="button"
              onClick={openAdd}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--sh-space-1)',
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: 'var(--sh-bronze)',
                fontSize: 'var(--sh-text-sm)',
                fontFamily: 'inherit',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name="plus" />
              New cohort
            </button>
          )}
        </div>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-secondary)',
          maxWidth: '640px',
          lineHeight: 1.6,
        }}>
          Group-based learning across clients with shared circumstances or stage. Curricula travel as a unit; cohort updates surface to all members.
        </p>
      </div>

      {isAddingCohort && (
        <Card style={{ marginBottom: 'var(--sh-space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-1)' }}>
              <label htmlFor="new-cohort-name" style={fieldLabelStyle}>Name</label>
              <input
                id="new-cohort-name"
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="What is this cohort called"
                style={fieldInputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-1)' }}>
              <label htmlFor="new-cohort-focus" style={fieldLabelStyle}>Focus (optional)</label>
              <input
                id="new-cohort-focus"
                type="text"
                value={newFocus}
                onChange={(e) => setNewFocus(e.target.value)}
                placeholder="A short line about what this cohort is about"
                style={fieldInputStyle}
              />
            </div>
            {saveError && (
              <p role="alert" style={{
                fontSize: 'var(--sh-text-xs)',
                color: 'var(--sh-text-muted)',
                fontStyle: 'italic',
              }}>{saveError}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sh-space-2)', flexWrap: 'wrap' }}>
              <Button variant="ghost" onClick={cancelAdd} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={saveCohort} disabled={saving || !newName.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {cohorts.length === 0 ? (
        <Card tint>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-muted)',
            textAlign: 'center',
            padding: 'var(--sh-space-6)',
            fontStyle: 'italic',
          }}>
            Your cohorts will appear here.
          </p>
        </Card>
      ) : (
        <div style={{
          display: 'grid',
          // Floor wrapped in min() per 88e07ea: a bare 360px floor is a hard
          // minimum and scrolls the PAGE horizontally below it. Above 360px of
          // available width the behaviour is identical.
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
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
      )}
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
        <Meta label="Members" value={(cohort.memberIds?.length ?? 0) + (cohort.externalMembers || 0)} />
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

const fieldLabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const fieldInputStyle = {
  padding: 'var(--sh-space-2) var(--sh-space-3)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-primary)',
  background: 'var(--sh-card)',
  fontFamily: 'inherit',
};
