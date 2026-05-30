import { Card } from './Card.jsx';
import { SectionLabel } from './SectionLabel.jsx';
import { Modal } from './Modal.jsx';
import { statusFor } from '../surfaces/enterprise/shared/athleteStatus.js';

// Single-athlete profile modal. Six sections: header (with status badge),
// contact, progress, giving, activity timeline, notes. Renders nothing when
// athlete is null (the consumer toggles isOpen based on athlete presence).

const TYPE_LABEL = {
  'gps_completed':    'GPS',
  'lesson_completed': 'Lesson',
  'workshop_attended': 'Workshop',
  'gift_made':        'Gift',
  'note_added':       'Note',
  'certified':        'Certification',
};

export default function AthleteProfile({ isOpen, onClose, athlete }) {
  if (!athlete) return null;

  const giftEvents = athlete.activity.filter((e) => e.type === 'gift_made');

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
            value={athlete.gpsCompleted ? `Completed ${athlete.gpsDate}` : 'Pending'}
          />
          <Field label="Lessons" value={`${athlete.lessons} of 9 completed`} />
          <Field
            label="Certification"
            value={athlete.certified ? `Awarded ${athlete.certDate}` : 'Not yet awarded'}
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
                {giftEvents.slice(0, 3).map((g, i) => (
                  <li key={i} style={giftRowStyle}>
                    <span style={giftDateStyle}>{g.date}</span>
                    <span style={giftLabelStyle}>{g.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Activity */}
        <Card>
          <SectionLabel>Activity</SectionLabel>
          <ul style={listResetStyle}>
            {athlete.activity.map((e, i) => {
              const isLast = i === athlete.activity.length - 1;
              return (
                <li key={i} style={activityRowStyle(isLast)}>
                  <span style={activityDateStyle}>{e.date}</span>
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
      </div>
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
