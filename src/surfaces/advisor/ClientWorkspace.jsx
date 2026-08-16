import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { Icon } from '../../components/Icon.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { formatSessionDate, stages } from '../../data/clients.js';
import { contentTypes, getLessonById } from '../../data/content.js';
import { useBasePath, useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { useClients } from '../../contexts/ClientsContext.jsx';
import { useCohorts } from '../../contexts/CohortsContext.jsx';
import StateBadge from './StateBadge.jsx';

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

function capitalize(s) {
  if (!s || typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ClientWorkspace() {
  const { clientId } = useParams();
  const basePath = useBasePath('/advisor', '/app/advisor');
  const { clients, update } = useClients();
  const { cohorts } = useCohorts();
  const client = clients.find(c => c.id === clientId);

  if (!client) return <Navigate to={`${basePath}/clients`} replace />;

  const agenda = client.nextSessionAgenda || { topics: [], openThreads: [], curriculumLinks: [] };
  const sessions = client.sessions || [];
  const givingPlan = client.givingPlan || null;
  const isSunset = client.stage === 'Sunset';
  const cohortMatches = cohorts.filter(c => c.memberIds.includes(client.id));

  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
    }}>
      {/* Breadcrumb */}
      <div style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        marginBottom: 'var(--sh-space-4)',
        letterSpacing: '0.04em',
      }}>
        <Link to={`${basePath}/clients`} style={{
          color: 'var(--sh-text-muted)',
          textDecoration: 'none',
        }}>
          Clients
        </Link>
        {' · '}
        <span>{client.name}</span>
      </div>

      {/* Header — client identity (display or edit) */}
      <IdentityBlock
        client={client}
        cohortMatches={cohortMatches}
        basePath={basePath}
        isSunset={isSunset}
        onSave={(patch) => update(client.id, patch)}
      />

      {/* MOVEMENT 1 — Pre-session prep, full width above the workspace columns */}
      <PreSessionPrep
        nextSession={client.nextSession}
        agenda={agenda}
        activeContent={client.activeContent}
        firstName={client.name.split(' ')[0]}
      />

      {/* Workspace columns.
          The previous template was 'minmax(0, 2fr) minmax(0, 1fr)', which gave
          the second column about 28px of TEXT width at 320px: 320 minus 64 main
          padding minus 24 gap, divided 1:2, minus 48 Card padding. Every text
          element in the notes panel overflowed there, including the Private
          notes label, the visibility line, the textarea placeholder and every
          saved note. That template was character-for-character identical to the
          one fixed as QA-037 at OperationsSurface.jsx:315; the same layout was
          corrected on one surface and not the other.
          This uses INTRINSIC SIZING rather than a breakpoint. No class, no
          media query, no !important, no matchMedia hook, and no pixel threshold
          that can drift out of sync with the content as panels change.
          auto-fit collapses the empty track, so the two panels share the row
          rather than leaving a gap.
          The floor is min(100%, 360px), NOT a bare 360px. A bare floor is a
          HARD minimum: at a 256px container the track is still 360px and the
          PAGE scrolls horizontally, by 104px at a 320px viewport and 49px at
          375px. Wrapping it in min() makes the floor conditional on the
          container, so above 360px of available width the behaviour is
          identical and below it the track shrinks to fit.
          FILED, NOT FIXED HERE: CohortSpace.jsx:167 carries the bare
          minmax(360px, 1fr) floor and has exactly that page-overflow defect
          live today. PracticeHome.jsx:67 uses a 180px floor, so it overflows
          only below a 244px viewport. Both are separate slices. */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
        gap: 'var(--sh-space-6)',
        alignItems: 'start',
        marginTop: 'var(--sh-space-6)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-5)' }}>
          <GivingPlanCard plan={givingPlan} nextSession={client.nextSession} />
          {/* MOVEMENT 3 — Post-session follow-up */}
          <PostSessionFollowUp client={client} sessions={sessions} />
          {/* Section 6 — between-session pipeline */}
          <ActiveInPipelinePanel client={client} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-5)' }}>
          {/* MOVEMENT 2 — In-session notes (writable) */}
          <PrivateNotesPanel client={client} />
        </div>
      </div>
    </main>
  );
}

// IdentityBlock — display + inline edit for the 7 R4-IN client fields.
// PracticeSettings precedent copied: single `editing` state, DisplayRow ↔
// EditRow swap, save awaits ClientsProvider.update and closes on success.
// Stage renders as four click-to-select pills (StageBadge palette from
// ClientRoster) — no ordering / progression visual per R6.
function IdentityBlock({ client, cohortMatches, basePath, isSunset, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(client.name || '');
  const [draftInitials, setDraftInitials] = useState(client.initials || '');
  const [draftSport, setDraftSport] = useState(client.sport || '');
  const [draftLevel, setDraftLevel] = useState(client.level || '');
  const [draftStage, setDraftStage] = useState(client.stage || 'New');
  const [draftYear, setDraftYear] = useState(
    client.relationshipStartedYear != null ? String(client.relationshipStartedYear) : ''
  );
  const [draftSummary, setDraftSummary] = useState(client.summary || '');
  const [draftNextSession, setDraftNextSession] = useState(client.nextSession || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const openEdit = () => {
    setDraftName(client.name || '');
    setDraftInitials(client.initials || '');
    setDraftSport(client.sport || '');
    setDraftLevel(client.level || '');
    setDraftStage(client.stage || 'New');
    setDraftYear(client.relationshipStartedYear != null ? String(client.relationshipStartedYear) : '');
    setDraftSummary(client.summary || '');
    setDraftNextSession(client.nextSession || '');
    setSaveError('');
    setEditing(true);
  };
  const cancelEdit = () => {
    setSaveError('');
    setEditing(false);
  };
  const save = async () => {
    setSaveError('');
    const name = draftName.trim();
    if (!name) { setSaveError('Name is required.'); return; }
    const patch = {};
    if (name !== (client.name || '')) patch.name = name;
    const initials = draftInitials.trim().toUpperCase();
    if (initials !== (client.initials || '')) patch.initials = initials || null;
    const sport = draftSport.trim();
    if (sport !== (client.sport || '')) patch.sport = sport || null;
    const level = draftLevel.trim();
    if (level !== (client.level || '')) patch.level = level || null;
    if (draftStage !== client.stage) patch.stage = draftStage;
    const yearStr = draftYear.trim();
    let yearVal = null;
    if (yearStr) {
      const parsed = Number(yearStr);
      if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 2200) {
        setSaveError('Year must be a plausible integer (1900–2200) or empty.');
        return;
      }
      yearVal = parsed;
    }
    if (yearVal !== (client.relationshipStartedYear ?? null)) {
      patch.relationshipStartedYear = yearVal;
    }
    const summary = draftSummary.trim();
    if (summary !== (client.summary || '')) patch.summary = summary || null;
    const nextSession = draftNextSession.trim();
    if (nextSession && !/^\d{4}-\d{2}-\d{2}$/.test(nextSession)) {
      setSaveError('Next session must be an ISO YYYY-MM-DD date or empty.');
      return;
    }
    if (nextSession !== (client.nextSession || '')) {
      patch.nextSession = nextSession || null;
    }
    if (Object.keys(patch).length === 0) { setEditing(false); return; }
    setSaving(true);
    const result = await onSave(patch);
    setSaving(false);
    if (!result) { setSaveError('Could not save. Please try again.'); return; }
    setEditing(false);
  };

  if (editing) {
    return (
      <Card style={{ marginBottom: 'var(--sh-space-8)' }}>
        <div style={identityEditHeaderStyle}>
          <SectionLabel>Client identity</SectionLabel>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-4)' }}>
          <FieldGroup id="cw-name" label="Name" required>
            <input id="cw-name" type="text" value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              style={fieldInputStyle} autoFocus />
          </FieldGroup>
          <FieldGroup id="cw-initials" label="Initials">
            <input id="cw-initials" type="text" value={draftInitials}
              maxLength={4}
              onChange={(e) => setDraftInitials(e.target.value.toUpperCase())}
              style={{ ...fieldInputStyle, maxWidth: '160px', textAlign: 'center', letterSpacing: '0.04em', fontWeight: 500 }} />
          </FieldGroup>
          <FieldGroup id="cw-sport" label="Sport">
            <input id="cw-sport" type="text" value={draftSport}
              onChange={(e) => setDraftSport(e.target.value)}
              style={fieldInputStyle} placeholder="Free text (Basketball, Track and Field, …)" />
          </FieldGroup>
          <FieldGroup id="cw-level" label="Level">
            <input id="cw-level" type="text" value={draftLevel}
              onChange={(e) => setDraftLevel(e.target.value)}
              style={fieldInputStyle} placeholder="Free text (D1 college, Professional, …)" />
          </FieldGroup>
          <FieldGroup label="Stage">
            <div role="radiogroup" aria-label="Stage" style={{
              display: 'flex', flexWrap: 'wrap', gap: 'var(--sh-space-2)',
            }}>
              {stages.map((s) => {
                const selected = draftStage === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setDraftStage(s)}
                    style={stagePillStyle(s, selected)}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </FieldGroup>
          <FieldGroup id="cw-year" label="Relationship started (year)">
            <input id="cw-year" type="number" min={1900} max={2200}
              value={draftYear}
              onChange={(e) => setDraftYear(e.target.value)}
              style={{ ...fieldInputStyle, maxWidth: '160px' }}
              placeholder="e.g. 2024" />
          </FieldGroup>
          <FieldGroup id="cw-next" label="Next session (date, optional)">
            <input id="cw-next" type="date" value={draftNextSession}
              onChange={(e) => setDraftNextSession(e.target.value)}
              style={{ ...fieldInputStyle, maxWidth: '220px' }} />
          </FieldGroup>
          <FieldGroup id="cw-summary" label="Summary">
            <textarea id="cw-summary" value={draftSummary}
              onChange={(e) => setDraftSummary(e.target.value)}
              rows={4}
              style={{ ...fieldInputStyle, resize: 'vertical', minHeight: '96px' }}
              placeholder="A short line about the working relationship." />
          </FieldGroup>
          {saveError && (
            <p role="alert" style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
            }}>{saveError}</p>
          )}
          <div style={identityEditActionsStyle}>
            <Button variant="ghost" onClick={cancelEdit} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={saving || !draftName.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--sh-space-5)',
      marginBottom: 'var(--sh-space-8)',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'var(--sh-bronze-tint)',
        color: 'var(--sh-bronze-deep)',
        fontSize: 'var(--sh-text-md)',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: '0.04em',
        flexShrink: 0,
      }}>
        {client.initials}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 'var(--sh-space-4)',
          flexWrap: 'wrap',
          marginBottom: 'var(--sh-space-2)',
        }}>
          <h1 style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-2xl)',
            color: 'var(--sh-text-primary)',
          }}>
            {client.name}
          </h1>
          <Button variant="ghost" size="sm" onClick={openEdit}>Edit</Button>
        </div>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-muted)',
          marginBottom: isSunset ? 'var(--sh-space-1)' : 'var(--sh-space-3)',
        }}>
          {[client.sport, client.level, client.stage,
            client.relationshipStartedYear ? `relationship started ${client.relationshipStartedYear}` : null,
          ].filter(Boolean).join(' · ')}
        </p>
        {isSunset && (
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            marginBottom: 'var(--sh-space-3)',
            letterSpacing: '0.02em',
          }}>
            (Sunset — relationship closing)
          </p>
        )}
        {cohortMatches.length > 0 && (
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            marginBottom: 'var(--sh-space-3)',
            letterSpacing: '0.02em',
          }}>
            {cohortMatches.length === 1 ? 'Cohort' : 'Cohorts'}
            {' · '}
            {cohortMatches.map((c, idx) => (
              <span key={c.id}>
                {idx > 0 && ' · '}
                <Link
                  to={`${basePath}/cohorts/${c.id}`}
                  style={{
                    color: 'var(--sh-text-muted)',
                    fontStyle: 'italic',
                    textDecoration: 'none',
                  }}
                >
                  {c.name}
                </Link>
              </span>
            ))}
          </p>
        )}
        {client.summary && (
          <p style={{
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-text-body)',
            lineHeight: 1.6,
            maxWidth: '720px',
          }}>
            {client.summary}
          </p>
        )}
      </div>
    </div>
  );
}

function FieldGroup({ id, label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-1)' }}>
      <label htmlFor={id} style={fieldLabelStyle}>
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  );
}

// Stage pill uses ClientRoster's StageBadge palette (bronze accent on the
// selected pill; neutral fill for the rest). No ordering / progression
// implication — R6.
function stagePillStyle(stage, selected) {
  const bronzeTint = 'var(--sh-bronze-tint)';
  const bronzeDeep = 'var(--sh-bronze-deep)';
  const bronze = 'var(--sh-bronze)';
  return {
    padding: 'var(--sh-space-2) var(--sh-space-4)',
    borderRadius: 'var(--sh-radius-full)',
    border: `1px solid ${selected ? bronze : 'var(--sh-card-border)'}`,
    background: selected ? bronzeTint : 'var(--sh-card)',
    color: selected ? bronzeDeep : 'var(--sh-text-secondary)',
    fontSize: 'var(--sh-text-xs)',
    fontFamily: 'inherit',
    fontWeight: selected ? 500 : 400,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    // 44px min touch target per mobile flag.
    minHeight: '32px',
  };
}

const identityEditHeaderStyle = {
  marginBottom: 'var(--sh-space-4)',
};
const identityEditActionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--sh-space-2)',
  marginTop: 'var(--sh-space-4)',
  flexWrap: 'wrap',
};
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

function PreSessionPrep({ nextSession, agenda, activeContent, firstName }) {
  const basePath = useBasePath('/advisor', '/app/advisor');
  const hasTopics = agenda.topics && agenda.topics.length > 0;
  const hasOpenThreads = agenda.openThreads && agenda.openThreads.length > 0;
  const hasCurriculum = agenda.curriculumLinks && agenda.curriculumLinks.length > 0;

  return (
    <div>
      <SectionLabel>Pre-session prep</SectionLabel>
      <Card>
        <p style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-lg)',
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-1)',
        }}>
          Next session — {formatSessionDate(nextSession)}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          letterSpacing: '0.02em',
          marginBottom: 'var(--sh-space-5)',
        }}>
          What to bring into the room.
        </p>

        {hasTopics && (
          <PrepBlock title="Working topics" items={agenda.topics} />
        )}

        {hasOpenThreads && (
          <PrepBlock title="Open threads" items={agenda.openThreads} muted />
        )}

        {hasCurriculum && (
          <div style={{ marginTop: 'var(--sh-space-5)' }}>
            <MicroLabel>Curriculum to revisit</MicroLabel>
            <ul style={listResetStyle}>
              {agenda.curriculumLinks.map((link) => {
                const lesson = getLessonById(link.lessonId);
                if (!lesson) return null;
                return (
                  <li key={link.lessonId} style={{
                    fontSize: 'var(--sh-text-sm)',
                    lineHeight: 1.55,
                    paddingLeft: 'var(--sh-space-4)',
                    position: 'relative',
                    marginBottom: 'var(--sh-space-1)',
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      color: 'var(--sh-text-muted)',
                    }}>—</span>
                    <Link
                      to={`${basePath}/curriculum/${link.lessonId}`}
                      style={{
                        color: 'var(--sh-text-muted)',
                        fontStyle: 'italic',
                        textDecoration: 'none',
                      }}
                    >
                      {lesson.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {activeContent > 0 && (
          <div style={{
            marginTop: 'var(--sh-space-5)',
            paddingTop: 'var(--sh-space-4)',
            borderTop: 'var(--sh-border-divider)',
          }}>
            <Link to={`${basePath}/pipeline`} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--sh-space-1)',
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-bronze)',
              fontWeight: 500,
              textDecoration: 'none',
            }}>
              <span>{activeContent} {activeContent === 1 ? 'item' : 'items'} surfacing to {firstName} between sessions</span>
              <Icon name="chevron-right" />
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

function PrepBlock({ title, items, muted = false }) {
  return (
    <div style={{ marginTop: 'var(--sh-space-4)' }}>
      <MicroLabel>{title}</MicroLabel>
      <ul style={listResetStyle}>
        {items.map((item, idx) => (
          <li key={idx} style={{
            fontSize: 'var(--sh-text-sm)',
            color: muted ? 'var(--sh-text-muted)' : 'var(--sh-text-secondary)',
            lineHeight: 1.55,
            paddingLeft: 'var(--sh-space-4)',
            position: 'relative',
            marginBottom: 'var(--sh-space-1)',
          }}>
            <span style={{
              position: 'absolute',
              left: 0,
              color: 'var(--sh-bronze)',
            }}>·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GivingPlanCard({ plan, nextSession }) {
  if (!plan) {
    const dateStr = formatSessionDate(nextSession);
    return (
      <Card>
        <SectionLabel>Giving plan</SectionLabel>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-muted)',
          fontStyle: 'italic',
          lineHeight: 1.6,
        }}>
          {dateStr
            ? `Giving Studio in progress — first Studio session ${dateStr}.`
            : 'Giving Studio in progress — the plan will land after the first Studio session.'}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionLabel>Current giving plan</SectionLabel>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-secondary)',
        lineHeight: 1.65,
        fontStyle: 'italic',
        marginBottom: 'var(--sh-space-5)',
      }}>
        &ldquo;{plan.statement}&rdquo;
      </p>

      {plan.causes && plan.causes.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--sh-space-2)',
          marginBottom: 'var(--sh-space-5)',
        }}>
          {plan.causes.map((cause) => (
            <span key={cause} style={chipStyle}>{cause}</span>
          ))}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        rowGap: 'var(--sh-space-2)',
        columnGap: 'var(--sh-space-5)',
        marginBottom: 'var(--sh-space-4)',
      }}>
        <PlanMetaRow label="Geography" value={plan.geography} />
        <PlanMetaRow label="Structure" value={capitalize(plan.preferredStructure)} />
        <PlanMetaRow label="Visibility" value={capitalize(plan.visibility)} />
        <PlanMetaRow label="Annual pace" value={plan.annualPace} />
      </div>

      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        paddingTop: 'var(--sh-space-3)',
        borderTop: 'var(--sh-border-divider)',
      }}>
        Last revised: {formatDate(plan.lastRevised)}
      </p>
    </Card>
  );
}

function PlanMetaRow({ label, value }) {
  return (
    <>
      <span style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 500,
        paddingTop: 'var(--sh-space-half)',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-body)',
        lineHeight: 1.55,
      }}>
        {value}
      </span>
    </>
  );
}

function PostSessionFollowUp({ client, sessions }) {
  const { addSession, writeError, clearWriteError } = useClients();

  const [logging, setLogging] = useState(false);
  const [logDate, setLogDate] = useState(todayIso());
  const [logTitle, setLogTitle] = useState('');
  const [logSummary, setLogSummary] = useState('');
  const [logDecisions, setLogDecisions] = useState('');
  const [logActions, setLogActions] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const openLog = () => {
    clearWriteError();
    setLogDate(todayIso()); setLogTitle(''); setLogSummary('');
    setLogDecisions(''); setLogActions('');
    setFormError(''); setLogging(true);
  };
  const cancelLog = () => {
    setFormError(''); setLogging(false);
  };

  // One-per-line split — DocCreate paragraph-split precedent. Trim each
  // line, drop empties, no whitespace-only entries survive.
  const splitLines = (raw) =>
    (raw || '').split(/\r?\n+/).map((s) => s.trim()).filter(Boolean);

  const saveLog = async () => {
    const title = logTitle.trim();
    if (!title) { setFormError('Title is required.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) {
      setFormError('Date must be an ISO YYYY-MM-DD.');
      return;
    }
    setFormError('');
    setSaving(true);
    const payload = {
      date: logDate,
      title,
      summary: logSummary.trim() || null,
      decisions: splitLines(logDecisions),
      actionItems: splitLines(logActions),
    };
    const result = await addSession(client.id, payload);
    setSaving(false);
    if (result) cancelLog();
  };

  const header = (
    <div style={sessionFormHeaderStyle}>
      <SectionLabel>Post-session follow-up</SectionLabel>
      {!logging && (
        <button
          type="button"
          onClick={openLog}
          style={sessionAddButtonStyle}
        >
          <Icon name="plus" />
          New session
        </button>
      )}
    </div>
  );

  const logForm = logging && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-3)', marginBottom: 'var(--sh-space-5)' }}>
      <FieldRow id="log-date" label="Date">
        <input id="log-date" type="date" value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          style={{ ...sessionInputStyle, maxWidth: '220px' }} />
      </FieldRow>
      <FieldRow id="log-title" label="Title" required>
        <input id="log-title" type="text" autoFocus value={logTitle}
          onChange={(e) => setLogTitle(e.target.value)}
          placeholder="e.g. Kickoff conversation"
          style={sessionInputStyle} />
      </FieldRow>
      <FieldRow id="log-summary" label="Summary (optional)">
        <textarea id="log-summary" value={logSummary} rows={3}
          onChange={(e) => setLogSummary(e.target.value)}
          placeholder="A short narrative of what happened in the session."
          style={{ ...sessionInputStyle, resize: 'vertical', minHeight: '72px' }} />
      </FieldRow>
      <FieldRow id="log-decisions" label="Decisions (one per line)">
        <textarea id="log-decisions" value={logDecisions} rows={3}
          onChange={(e) => setLogDecisions(e.target.value)}
          placeholder="One decision per line."
          style={{ ...sessionInputStyle, resize: 'vertical', minHeight: '72px' }} />
      </FieldRow>
      <FieldRow id="log-actions" label="Action items (one per line)">
        <textarea id="log-actions" value={logActions} rows={3}
          onChange={(e) => setLogActions(e.target.value)}
          placeholder="One action item per line."
          style={{ ...sessionInputStyle, resize: 'vertical', minHeight: '72px' }} />
      </FieldRow>
      {(formError || writeError) && (
        <p role="alert" style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-secondary)',
          fontStyle: 'italic',
        }}>{formError || writeError}</p>
      )}
      <div style={sessionFormActionsStyle}>
        <Button variant="ghost" onClick={cancelLog} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={saveLog} disabled={saving || !logTitle.trim()}>
          {saving ? 'Saving…' : 'Save session'}
        </Button>
      </div>
    </div>
  );

  if (sessions.length === 0) {
    return (
      <Card>
        {header}
        {logForm}
        {!logging && (
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}>
            No sessions yet. The first session will appear here once it has happened.
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card>
      {header}
      {logForm}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {sessions.map((session, idx) => (
          <SessionCard key={session.id} session={session} first={idx === 0} />
        ))}
      </div>
    </Card>
  );
}

function FieldRow({ id, label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-1)' }}>
      <label htmlFor={id} style={sessionLabelStyle}>
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  );
}

const sessionFormHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 'var(--sh-space-3)',
  flexWrap: 'wrap',
  marginBottom: 'var(--sh-space-4)',
};
const sessionAddButtonStyle = {
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
};
const sessionInputStyle = {
  padding: 'var(--sh-space-2) var(--sh-space-3)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-primary)',
  background: 'var(--sh-card)',
  fontFamily: 'inherit',
};
const sessionLabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
const sessionFormActionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--sh-space-2)',
  flexWrap: 'wrap',
};

function SessionCard({ session, first }) {
  const hasDecisions = session.decisions && session.decisions.length > 0;
  const hasActionItems = session.actionItems && session.actionItems.length > 0;

  return (
    <div style={{
      paddingTop: first ? 0 : 'var(--sh-space-5)',
      paddingBottom: 'var(--sh-space-5)',
      borderTop: first ? 'none' : 'var(--sh-border-divider)',
    }}>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        marginBottom: 'var(--sh-space-half)',
        letterSpacing: '0.02em',
      }}>
        {formatDate(session.date)}
      </p>
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-base)',
        color: 'var(--sh-text-primary)',
        marginBottom: 'var(--sh-space-2)',
      }}>
        {session.title}
      </p>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-secondary)',
        lineHeight: 1.6,
        marginBottom: (hasDecisions || hasActionItems) ? 'var(--sh-space-4)' : 0,
      }}>
        {session.summary}
      </p>

      {hasDecisions && (
        <div style={{ marginBottom: hasActionItems ? 'var(--sh-space-3)' : 0 }}>
          <MicroLabel>What was decided</MicroLabel>
          <ul style={listResetStyle}>
            {session.decisions.map((d, idx) => (
              <li key={idx} style={bulletItemStyle}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--sh-bronze)' }}>·</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasActionItems && (
        <div>
          <MicroLabel>Action items</MicroLabel>
          <ul style={listResetStyle}>
            {session.actionItems.map((a, idx) => (
              <li key={idx} style={bulletItemStyle}>
                <span style={{ position: 'absolute', left: 0, color: 'var(--sh-bronze)' }}>·</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PrivateNotesPanel({ client }) {
  const { addNote, writeError, clearWriteError } = useClients();
  const isAuthenticated = !!useOptionalAppIdentity();
  const notes = client.privateNotes || [];
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || saving) return;
    clearWriteError();
    setSaving(true);
    // ClientsProvider.addNote appends to canonical `privateNotes` on both
    // trees (auth: after POST /api/client-notes; demo: sync-local). Panel
    // re-renders from provider state — no local shadow copy.
    const result = await addNote(client.id, {
      date: todayIso(),
      content: trimmed,
      tags: ['operational'],
    });
    setSaving(false);
    if (result) setDraft('');
  };

  const canSubmit = draft.trim().length > 0 && !saving;

  return (
    <Card tint>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sh-space-2)',
        marginBottom: 'var(--sh-space-4)',
      }}>
        <SectionLabel>Private notes</SectionLabel>
        <span style={{
          // ADV-006 F1 ruling: was '10px' — nearest token (+1px nudge).
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          fontStyle: 'italic',
          marginBottom: 'var(--sh-space-3)',
        }}>
          (visible to you, not to other users)
        </span>
      </div>

      <div style={{ marginBottom: 'var(--sh-space-5)' }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Observation, context, or thread to carry forward."
          rows={3}
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
          {!isAuthenticated ? (
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              fontStyle: 'italic',
              lineHeight: 1.4,
              flex: 1,
            }}>
              Notes added in this session are not yet persisted.
            </p>
          ) : (
            <div style={{ flex: 1 }} />
          )}
          <button
            onClick={submit}
            disabled={!canSubmit}
            style={{
              background: 'var(--sh-bronze)',
              color: 'var(--sh-text-on-accent)',
              border: 'none',
              padding: 'var(--sh-space-2) var(--sh-space-4)',
              borderRadius: 'var(--sh-radius-sm)',
              fontSize: 'var(--sh-text-sm)',
              fontWeight: 500,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: canSubmit ? 1 : 0.4,
              flexShrink: 0,
            }}
          >
            {saving ? 'Saving…' : 'Add note'}
          </button>
        </div>
        {writeError && (
          <p role="alert" style={{
            marginTop: 'var(--sh-space-2)',
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-secondary)',
            fontStyle: 'italic',
          }}>
            {writeError}
          </p>
        )}
      </div>

      <div style={{ borderTop: 'var(--sh-border-divider)', paddingTop: 'var(--sh-space-4)' }}>
        {notes.length === 0 ? (
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}>
            No notes yet.
          </p>
        ) : (
          notes.map((note, idx) => (
            <NoteItem key={note.id} note={note} first={idx === 0} />
          ))
        )}
      </div>
    </Card>
  );
}

function NoteItem({ note, first }) {
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
        {formatDate(note.date)}
      </p>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-secondary)',
        lineHeight: 1.6,
        fontStyle: 'italic',
        marginBottom: note.tags && note.tags.length > 0 ? 'var(--sh-space-2)' : 0,
      }}>
        {note.content}
      </p>
      {note.tags && note.tags.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--sh-space-1)',
        }}>
          {note.tags.map((t) => (
            <span key={t} style={chipStyle}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function MicroLabel({ children }) {
  return (
    <p style={{
      fontSize: 'var(--sh-text-xs)',
      color: 'var(--sh-text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontWeight: 500,
      marginBottom: 'var(--sh-space-2)',
    }}>
      {children}
    </p>
  );
}

const chipStyle = {
  background: 'var(--sh-bronze-tint)',
  color: 'var(--sh-bronze-deep)',
  padding: 'var(--sh-space-half) var(--sh-space-2)',
  borderRadius: 'var(--sh-radius-sm)',
  fontSize: 'var(--sh-text-xs)',
  letterSpacing: '0.02em',
  fontWeight: 500,
};

const listResetStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

const bulletItemStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.55,
  paddingLeft: 'var(--sh-space-4)',
  position: 'relative',
  marginBottom: 'var(--sh-space-1)',
};


// ---- Section 6: between-session pipeline components (from section6-step-a) ----

function PipelineRow({ label, state, source, first }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sh-space-3)',
      paddingTop: first ? 0 : 'var(--sh-space-3)',
      paddingBottom: 'var(--sh-space-3)',
      borderTop: first ? 'none' : 'var(--sh-border-divider)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-primary)',
        }}>
          {label}
        </p>
      </div>
      <StateBadge state={state} />
      <span style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        minWidth: '64px',
        textAlign: 'right',
      }}>
        {source}
      </span>
    </div>
  );
}

function ActiveInPipelinePanel({ client }) {
  const pipeline = client.pipeline || [];
  const labelByKey = Object.fromEntries(contentTypes.map(ct => [ct.key, ct.label]));
  const total = pipeline.length;
  const active = pipeline.filter(p => p.state === 'Active').length;
  const overrides = pipeline.filter(p => p.source === 'override').length;
  const firstName = client.name.split(' ')[0];

  return (
    <Card>
      <div id="active-in-pipeline" style={{ scrollMarginTop: 'var(--sh-space-6)' }}>
        <SectionLabel>Active in pipeline</SectionLabel>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-secondary)',
          marginBottom: 'var(--sh-space-4)',
          lineHeight: 1.55,
        }}>
          What's currently surfacing to {firstName} between sessions, by content type.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {pipeline.map((entry, i) => (
            <PipelineRow
              key={entry.type}
              label={labelByKey[entry.type] || entry.type}
              state={entry.state}
              source={entry.source}
              first={i === 0}
            />
          ))}
        </div>

        <div style={{
          marginTop: 'var(--sh-space-4)',
          paddingTop: 'var(--sh-space-3)',
          borderTop: 'var(--sh-border-divider)',
        }}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-primary)',
            marginBottom: 'var(--sh-space-1)',
          }}>
            {active} of {total} content types active · {overrides} {overrides === 1 ? 'override' : 'overrides'} from practice default
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            lineHeight: 1.55,
          }}>
            Overrides are preserved when practice-wide defaults change.
          </p>
        </div>
      </div>
    </Card>
  );
}
