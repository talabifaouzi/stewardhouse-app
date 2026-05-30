import { Card } from './Card.jsx';
import { SectionLabel } from './SectionLabel.jsx';
import { Modal } from './Modal.jsx';

// Single-workshop detail modal. Five sections: header meta (date + facilitator
// + module), summary, attendance (count + per-athlete list), follow-ups
// (description + owner + due date + status badge), module reference.
//
// For upcoming/scheduled workshops the attendance section renders a
// "pending" placeholder instead of an empty list.

const STATUS_LABEL = {
  pending: 'Pending',
  completed: 'Completed',
};

export default function WorkshopDetail({ isOpen, onClose, workshop, athletesById }) {
  if (!workshop) return null;

  const isPast = workshop.status === 'completed';
  const attendedCount = workshop.attendance.filter((a) => a.attended).length;
  const totalCount = workshop.attendance.length;

  // Sort: attended first (alphabetical), then absent (alphabetical).
  const sortedAttendance = [...workshop.attendance].sort((a, b) => {
    if (a.attended !== b.attended) return b.attended ? 1 : -1;
    const nameA = athletesById[a.athleteId]?.name || '';
    const nameB = athletesById[b.athleteId]?.name || '';
    return nameA.localeCompare(nameB);
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={workshop.title}>
      {/* Header meta */}
      <div style={headerMetaStyle}>
        <span style={metaItemStyle}>{workshop.date}</span>
        <span style={metaSepStyle}>·</span>
        <span style={metaItemStyle}>{workshop.facilitator}</span>
        <span style={metaSepStyle}>·</span>
        <span style={metaItemStyle}>{workshop.module}</span>
      </div>

      <div style={sectionsStyle}>
        {/* Summary */}
        <Card>
          <SectionLabel>Summary</SectionLabel>
          <p style={summaryStyle}>{workshop.summary}</p>
        </Card>

        {/* Attendance */}
        <Card>
          <SectionLabel>Attendance</SectionLabel>
          {!isPast ? (
            <p style={pendingStyle}>Attendance pending.</p>
          ) : (
            <>
              <p style={attendanceCountStyle}>
                {attendedCount} of {totalCount} athletes attended.
              </p>
              <ul style={listResetStyle}>
                {sortedAttendance.map((record) => {
                  const athlete = athletesById[record.athleteId];
                  if (!athlete) return null;
                  return (
                    <li key={record.athleteId} style={attendanceRowStyle}>
                      <span style={record.attended ? nameStyle : nameAbsentStyle}>
                        {athlete.name}
                      </span>
                      <span style={attendanceMetaStyle}>{athlete.sport}</span>
                      {!record.attended && record.note && (
                        <span style={attendanceNoteStyle}>{record.note}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Card>

        {/* Follow-ups */}
        <Card>
          <SectionLabel>Follow-ups</SectionLabel>
          <ul style={listResetStyle}>
            {workshop.followUps.map((f, i) => (
              <li key={f.id} style={followUpRowStyle(i === workshop.followUps.length - 1)}>
                <div style={followUpHeaderStyle}>
                  <p style={f.status === 'completed' ? followUpDescCompletedStyle : followUpDescStyle}>
                    {f.description}
                  </p>
                  <span style={statusBadgeStyle(f.status)}>
                    {STATUS_LABEL[f.status]}
                  </span>
                </div>
                <p style={followUpMetaStyle}>
                  {f.owner} · Due {f.dueDate}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        {/* Module reference */}
        <p style={moduleRefStyle}>
          Maps to curriculum: <span style={moduleNameStyle}>{workshop.module}</span>.
          Athletes complete the corresponding module on the Individual surface.
        </p>
      </div>
    </Modal>
  );
}

const headerMetaStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'var(--sh-space-2)',
  marginBottom: 'var(--sh-space-5)',
};

const metaItemStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
};

const metaSepStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-muted)',
};

const sectionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-4)',
};

const summaryStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
};

const pendingStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  marginTop: 'var(--sh-space-3)',
};

const attendanceCountStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  marginTop: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-3)',
  fontWeight: 500,
};

const listResetStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

const attendanceRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: 'var(--sh-space-2)',
  padding: 'var(--sh-space-2) 0',
  fontSize: 'var(--sh-text-sm)',
  borderBottom: 'var(--sh-border-thin)',
};

const nameStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
};

const nameAbsentStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-muted)',
};

const attendanceMetaStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
};

const attendanceNoteStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  marginLeft: 'auto',
};

function followUpRowStyle(isLast) {
  return {
    padding: 'var(--sh-space-3) 0',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
  };
}

const followUpHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-1)',
};

const followUpDescStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.5,
  flex: 1,
};

const followUpDescCompletedStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-muted)',
  lineHeight: 1.5,
  flex: 1,
};

function statusBadgeStyle(status) {
  const isPending = status === 'pending';
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 'var(--sh-radius-full)',
    fontSize: 'var(--sh-text-xs)',
    fontWeight: 500,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    background: isPending ? 'var(--sh-bronze-tint)' : 'transparent',
    color: isPending ? 'var(--sh-bronze-deep)' : 'var(--sh-text-muted)',
    border: isPending ? 'none' : 'var(--sh-border-thin)',
  };
}

const followUpMetaStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
};

const moduleRefStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  lineHeight: 1.55,
  marginTop: 'var(--sh-space-2)',
  paddingLeft: 'var(--sh-space-3)',
  paddingRight: 'var(--sh-space-3)',
};

const moduleNameStyle = {
  color: 'var(--sh-text-secondary)',
  fontStyle: 'normal',
  fontWeight: 500,
};
