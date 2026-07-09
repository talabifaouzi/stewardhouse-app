import { useState } from 'react';
import { Card } from './Card.jsx';
import { SectionLabel } from './SectionLabel.jsx';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import MessageHistoryCard from './MessageHistoryCard.jsx';
import { statusFor } from '../surfaces/enterprise/shared/athleteStatus.js';
import { useComms } from '../contexts/CommsContext.jsx';
import { athleteReflections } from '../data/enterpriseFixtures.js';
import { formatDate } from '../utils/formatDate.js';

// Single-athlete profile modal. Six sections: header (with status badge),
// contact, progress, giving, activity timeline, notes. Renders nothing when
// athlete is null (the consumer toggles isOpen based on athlete presence).
//
// Remove from roster (E-Write-2): when onRemove is wired (Roster, auth-only),
// the footer carries a destructive "Remove from roster" action that opens a
// nested confirm modal (E3 anonymize-to-stub copy). writeError surfaces in the
// confirm modal (E-Write-1 idiom). Demo tree: no onRemove → no Remove action.

const TYPE_LABEL = {
  'gps_completed':    'GPS',
  'lesson_completed': 'Lesson',
  'workshop_attended': 'Workshop',
  'gift_made':        'Gift',
  'note_added':       'Note',
  'certified':        'Certification',
};

export default function AthleteProfile({ isOpen, onClose, athlete, onSendReminder, onRemove, writeError, clearWriteError }) {
  const { getThread } = useComms();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  if (!athlete) return null;

  const openConfirm = () => {
    clearWriteError?.();
    setConfirmOpen(true);
  };
  const handleConfirmRemove = async () => {
    if (removing) return;
    setRemoving(true);
    clearWriteError?.();
    const ok = await onRemove(athlete.id);
    if (ok) {
      setConfirmOpen(false);
      setRemoving(false);
      onClose();   // the athlete row no longer exists — close the profile too
    } else {
      setRemoving(false);   // writeError surfaces in the confirm modal
    }
  };

  const giftEvents = athlete.activity.filter((e) => e.type === 'gift_made');
  const messages = getThread(athlete.email);
  const reflections = athleteReflections[athlete.id] ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={athlete.name}>
      {/* Header */}
      <div style={headerStyle}>
        <p style={subtitleStyle}>{athlete.sport} · {athlete.year} · {athlete.position}</p>
        <span style={statusBadgeStyle}>{statusFor(athlete)}</span>
      </div>

      <div style={sectionsStyle}>
        {/* Contact */}
        <Card>
          <SectionLabel>Contact</SectionLabel>
          <Field
            label="Email"
            value={<a href={`mailto:${athlete.email}`} style={emailLinkStyle}>{athlete.email}</a>}
          />
          <Field label="Phone" value={athlete.phone} last />
        </Card>

        {/* Progress */}
        <Card>
          <SectionLabel>Progress</SectionLabel>
          <Field
            label="GPS"
            value={athlete.gpsCompleted ? `Completed ${formatDate(athlete.gpsDate)}` : 'Pending'}
          />
          <Field label="Lessons" value={`${athlete.lessons} of 9 completed`} />
          <Field
            label="Certification"
            value={athlete.certified ? `Awarded ${formatDate(athlete.certDate)}` : 'Not yet awarded'}
            last
          />
        </Card>

        {/* Giving */}
        <Card>
          <SectionLabel>Giving</SectionLabel>
          <Field
            label="Total gifts"
            value={athlete.gifts}
            last={giftEvents.length === 0}
          />
          {giftEvents.length > 0 && (
            <div style={recentGiftsStyle}>
              <p style={subLabelStyle}>Recent</p>
              <ul style={listResetStyle}>
                {giftEvents.slice(0, 3).map((g) => (
                  <li key={`${g.date}-${g.label}`} style={giftRowStyle}>
                    <span style={giftDateStyle}>{formatDate(g.date)}</span>
                    <span style={giftLabelStyle}>{g.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Reflections — athlete's own first-person voice (Path B) */}
        {reflections.length > 0 && (
          <Card>
            <SectionLabel>Reflections</SectionLabel>
            <p style={reflectionsContextStyle}>
              Their own words on their philanthropic practice. First-person reflections shared during program activities.
            </p>
            <ul style={listResetStyle}>
              {[...reflections].reverse().map((r, i, arr) => (
                <li key={r.date} style={reflectionItemStyle(i === arr.length - 1)}>
                  <p style={reflectionDateStyle}>{formatDate(r.date)}</p>
                  <p style={reflectionTextStyle}>{r.text}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Activity */}
        <Card>
          <SectionLabel>Activity</SectionLabel>
          <ul style={listResetStyle}>
            {athlete.activity.map((e, i) => {
              const isLast = i === athlete.activity.length - 1;
              return (
                <li key={`${e.date}-${e.type}-${e.label}`} style={activityRowStyle(isLast)}>
                  <span style={activityDateStyle}>{formatDate(e.date)}</span>
                  <span style={activityTypeStyle}>{TYPE_LABEL[e.type] || e.type}</span>
                  <span style={activityLabelStyle}>{e.label}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Notes */}
        <Card tint>
          <SectionLabel>Notes</SectionLabel>
          <p style={notesStyle}>{athlete.notes}</p>
        </Card>

        {/* Message history — only renders when prior messages exist */}
        <MessageHistoryCard messages={messages} />
      </div>

      {/* Footer — Remove (destructive, auth-only) + Send reminder. */}
      {(onSendReminder || onRemove) && (
        <div style={footerStyle}>
          {onRemove && (
            <Button variant="ghost" size="sm" onClick={openConfirm}>
              Remove from roster
            </Button>
          )}
          {onSendReminder && (
            <Button variant="primary" size="sm" onClick={() => onSendReminder(athlete)}>
              Send reminder
            </Button>
          )}
        </div>
      )}

      {/* Nested confirm modal — E3 anonymize-to-stub. Modal focuses its close
          (×) affordance first, so the destructive Confirm never receives
          initial focus (the safe default). */}
      {onRemove && (
        <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Remove from roster">
          <p style={confirmBodyStyle}>
            Remove {athlete.name}? This deletes their contact details, activity, notes, and reflections. Only an anonymized cohort tally (class and sport) is retained. This cannot be undone.
          </p>
          {writeError && <p style={confirmErrorStyle}>{writeError}</p>}
          <div style={confirmFooterStyle}>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)} disabled={removing}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmRemove} disabled={removing}>
              {removing ? 'Removing…' : 'Remove athlete'}
            </Button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

function Field({ label, value, last }) {
  return (
    <div style={fieldRowStyle(last)}>
      <span style={fieldLabelStyle}>{label}</span>
      <span style={fieldValueStyle}>{value}</span>
    </div>
  );
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-5)',
};

const subtitleStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.5,
};

const statusBadgeStyle = {
  display: 'inline-block',
  padding: 'var(--sh-space-1) var(--sh-space-3)',
  background: 'var(--sh-bg-tint)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-full)',
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-secondary)',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
};

const sectionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-4)',
};

function fieldRowStyle(last) {
  return {
    display: 'flex',
    gap: 'var(--sh-space-3)',
    padding: 'var(--sh-space-2) 0',
    borderBottom: last ? 'none' : 'var(--sh-border-thin)',
    fontSize: 'var(--sh-text-sm)',
    alignItems: 'baseline',
  };
}

const fieldLabelStyle = {
  color: 'var(--sh-text-muted)',
  minWidth: '140px',
  flexShrink: 0,
  fontSize: 'var(--sh-text-xs)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const fieldValueStyle = {
  color: 'var(--sh-text-body)',
  flex: 1,
};

const emailLinkStyle = {
  color: 'var(--sh-bronze)',
  textDecoration: 'none',
};

const recentGiftsStyle = {
  marginTop: 'var(--sh-space-3)',
};

const subLabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 'var(--sh-space-2)',
};

const listResetStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

const giftRowStyle = {
  display: 'flex',
  gap: 'var(--sh-space-3)',
  padding: 'var(--sh-space-2) 0',
  fontSize: 'var(--sh-text-sm)',
};

const giftDateStyle = {
  color: 'var(--sh-text-muted)',
  minWidth: '100px',
  flexShrink: 0,
};

const giftLabelStyle = {
  color: 'var(--sh-text-body)',
  flex: 1,
};

function activityRowStyle(isLast) {
  return {
    display: 'flex',
    gap: 'var(--sh-space-3)',
    padding: 'var(--sh-space-2) 0',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
    fontSize: 'var(--sh-text-sm)',
    alignItems: 'baseline',
  };
}

const activityDateStyle = {
  color: 'var(--sh-text-muted)',
  minWidth: '90px',
  flexShrink: 0,
  fontSize: 'var(--sh-text-xs)',
  letterSpacing: '0.02em',
};

const activityTypeStyle = {
  color: 'var(--sh-text-secondary)',
  minWidth: '90px',
  flexShrink: 0,
  fontSize: 'var(--sh-text-xs)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
};

const activityLabelStyle = {
  color: 'var(--sh-text-body)',
  flex: 1,
  lineHeight: 1.5,
};

const notesStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--sh-space-2)',
  marginTop: 'var(--sh-space-5)',
  paddingTop: 'var(--sh-space-4)',
  borderTop: 'var(--sh-border-thin)',
};

// Nested remove-confirm modal (E-Write-2).
const confirmBodyStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.65,
  marginTop: 0,
  marginBottom: 'var(--sh-space-4)',
};

const confirmErrorStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-bronze-deep)',
  lineHeight: 1.5,
  marginBottom: 'var(--sh-space-3)',
};

const confirmFooterStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--sh-space-2)',
  marginTop: 'var(--sh-space-4)',
  paddingTop: 'var(--sh-space-4)',
  borderTop: 'var(--sh-border-thin)',
};

// Reflections styles
const reflectionsContextStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  lineHeight: 1.55,
  marginTop: 'var(--sh-space-2)',
  marginBottom: 'var(--sh-space-4)',
};

function reflectionItemStyle(isLast) {
  return {
    marginBottom: isLast ? 0 : 'var(--sh-space-4)',
  };
}

const reflectionDateStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  marginBottom: 'var(--sh-space-1)',
};

const reflectionTextStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
  fontStyle: 'italic',
  lineHeight: 1.6,
  borderLeft: '3px solid var(--sh-bronze)',
  paddingLeft: 'var(--sh-space-3)',
  margin: 0,
};
