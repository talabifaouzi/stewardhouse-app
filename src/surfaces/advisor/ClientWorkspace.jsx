import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { clients } from '../../data/clients.js';
import { contentTypes, getLessonById } from '../../data/content.js';

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
  const client = clients.find(c => c.id === clientId);

  if (!client) return <Navigate to="/advisor/clients" replace />;

  const agenda = client.nextSessionAgenda || { topics: [], openThreads: [], curriculumLinks: [] };
  const sessions = client.sessions || [];
  const givingPlan = client.givingPlan || null;
  const isSunset = client.stage === 'Sunset';

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
        <Link to="/advisor/clients" style={{
          color: 'var(--sh-text-muted)',
          textDecoration: 'none',
        }}>
          Clients
        </Link>
        {' · '}
        <span>{client.name}</span>
      </div>

      {/* Header — client identity */}
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
          <h1 style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-2xl)',
            color: 'var(--sh-text-primary)',
            marginBottom: 'var(--sh-space-2)',
          }}>
            {client.name}
          </h1>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-muted)',
            marginBottom: isSunset ? 'var(--sh-space-1)' : 'var(--sh-space-3)',
          }}>
            {client.sport} · {client.level} · {client.stage} · relationship started {client.relationshipStartedYear}
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
          <p style={{
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-text-body)',
            lineHeight: 1.6,
            maxWidth: '720px',
          }}>
            {client.summary}
          </p>
        </div>
      </div>

      {/* MOVEMENT 1 — Pre-session prep, full width above the workspace columns */}
      <PreSessionPrep
        nextSession={client.nextSession}
        agenda={agenda}
        activeContent={client.activeContent}
        firstName={client.name.split(' ')[0]}
      />

      {/* Workspace columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: 'var(--sh-space-6)',
        alignItems: 'start',
        marginTop: 'var(--sh-space-6)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-5)' }}>
          <GivingPlanCard plan={givingPlan} nextSession={client.nextSession} />
          {/* MOVEMENT 3 — Post-session follow-up */}
          <PostSessionFollowUp sessions={sessions} />
          {/* Section 6 — between-session pipeline */}
          <ActiveInPipelinePanel client={client} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-5)' }}>
          {/* MOVEMENT 2 — In-session notes (writable) */}
          <PrivateNotesPanel initialNotes={client.privateNotes || []} />
        </div>
      </div>
    </main>
  );
}

function PreSessionPrep({ nextSession, agenda, activeContent, firstName }) {
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
          Next session — {nextSession}
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
                      to={`/advisor/curriculum/${link.lessonId}`}
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
            <Link to="/advisor/pipeline" style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-bronze)',
              fontWeight: 500,
              textDecoration: 'none',
            }}>
              {activeContent} {activeContent === 1 ? 'item' : 'items'} surfacing to {firstName} between sessions →
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
    return (
      <Card>
        <SectionLabel>Giving plan</SectionLabel>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-muted)',
          fontStyle: 'italic',
          lineHeight: 1.6,
        }}>
          Giving Studio in progress — first Studio session {nextSession}.
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
        paddingTop: '2px',
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

function PostSessionFollowUp({ sessions }) {
  if (sessions.length === 0) {
    return (
      <Card>
        <SectionLabel>Post-session follow-up</SectionLabel>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-muted)',
          fontStyle: 'italic',
          lineHeight: 1.6,
        }}>
          No sessions yet. The first session will appear here once it has happened.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionLabel>Post-session follow-up</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {sessions.map((session, idx) => (
          <SessionCard key={session.id} session={session} first={idx === 0} />
        ))}
      </div>
    </Card>
  );
}

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
        marginBottom: '2px',
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

function PrivateNotesPanel({ initialNotes }) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState('');

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const newNote = {
      id: `n-local-${Date.now()}`,
      date: todayIso(),
      content: trimmed,
      tags: ['operational'],
    };
    setNotes(prev => [newNote, ...prev]);
    setDraft('');
  };

  const canSubmit = draft.trim().length > 0;

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
          fontSize: '10px',
          color: 'var(--sh-text-muted)',
          fontStyle: 'italic',
          marginBottom: 'var(--sh-space-3)',
        }}>
          (visible only to you)
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
            Notes added in this session are not yet persisted.
          </p>
          <button
            onClick={submit}
            disabled={!canSubmit}
            style={{
              background: 'var(--sh-bronze)',
              color: 'white',
              border: 'none',
              padding: 'var(--sh-space-2) var(--sh-space-4)',
              borderRadius: '4px',
              fontSize: 'var(--sh-text-sm)',
              fontWeight: 500,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: canSubmit ? 1 : 0.4,
              flexShrink: 0,
            }}
          >
            Add note
          </button>
        </div>
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
  padding: '2px 8px',
  borderRadius: '4px',
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

function StateBadge({ state }) {
  const colors = {
    Active: { bg: '#E8F0E5', text: '#3E5A3F' },
    Mute:   { bg: '#F0EBDF', text: '#5A554C' },
    Pause:  { bg: '#F5EFE3', text: '#5A453A' },
  };
  const c = colors[state] || colors.Active;
  return (
    <span style={{
      fontSize: '10px',
      padding: '3px 9px',
      borderRadius: 'var(--sh-radius-full)',
      background: c.bg,
      color: c.text,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontWeight: 500,
    }}>
      {state}
    </span>
  );
}

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
