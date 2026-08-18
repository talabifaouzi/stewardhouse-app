import { useState, useEffect } from 'react';
import { Card } from './Card.jsx';
import { SectionLabel } from './SectionLabel.jsx';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { accessLabel } from '../surfaces/enterprise/shared/athleteStatus.js';
import { formatDate } from '../utils/formatDate.js';

// Single-workshop detail modal. Five sections: header meta (date + facilitator
// + module), summary, attendance (count + per-athlete list OR auth-only edit
// mode), follow-ups, module reference.
//
// Attendance read-render (E-Write-3b, Q2) keys on attendance.length, NOT
// status: a workshop shows its roster once any attendance exists, regardless of
// the explicit status (no implicit status flip). Demo parity holds because in
// the fixture status==='completed' ⟺ attendance rows exist.
//
// Auth-only edit mode (editable): "Record attendance" opens a per-athlete
// roster editor (toggle + note) that PUTs the full-roster batch via
// onSaveAttendance. The demo tree passes editable=false and renders read-only,
// byte-identical.

export default function WorkshopDetail({
  isOpen, onClose, workshop, athletesById,
  editable = false, roster = [], onSaveAttendance, writeError, clearWriteError,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});     // athleteId -> { attended, note }
  const [saving, setSaving] = useState(false);
  const workshopId = workshop?.id ?? null;

  // Reset edit state when the modal opens/closes or the workshop changes.
  useEffect(() => {
    setEditing(false);
    setSaving(false);
    if (clearWriteError) clearWriteError();
  }, [isOpen, workshopId, clearWriteError]);

  if (!workshop) return null;

  const attendance = workshop.attendance ?? [];
  const hasAttendance = attendance.length > 0;
  const attendedCount = attendance.filter((a) => a.attended).length;
  const totalCount = attendance.length;

  // Read view — sort: attended first (alphabetical), then absent (alphabetical).
  const sortedAttendance = [...attendance].sort((a, b) => {
    if (a.attended !== b.attended) return b.attended ? 1 : -1;
    const nameA = athletesById[a.athleteId]?.name || '';
    const nameB = athletesById[b.athleteId]?.name || '';
    return nameA.localeCompare(nameB);
  });

  // Roster for the editor (active athletes, Sunset already excluded upstream).
  const rosterSorted = [...roster].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // P-7 slice 1, the missing attendance gate. This is the SAME predicate as
  // AthleteProfile.jsx:53, enterpriseStats.js:37 and the server's own check at
  // attendance.js:161, and both fields ride the roster objects already passed
  // in (athletes.js:108-109 emits managementMode and claimed on every element).
  //
  // Why per-row and not the whole editor: the roster is in hand, so gating a
  // row costs one branch and keeps the workshop recordable for the athletes
  // who HAVE delegated. Gating the editor would punish the whole roster for
  // one athlete's choice. This is wrong on FIRST LOAD with a perfectly fresh
  // roster, not a staleness bug: before this, the editor was offered for
  // Self-managed, Pending choice and Unclaimed athletes on every load.
  const canRecord = (a) => a.claimed === true && a.managementMode === 'delegated';
  const recordable = rosterSorted.filter(canRecord);

  const enterEdit = () => {
    // Seed one draft row per active athlete: existing attendance when present,
    // else attended=false / empty note (Q3 default-false-until-toggled).
    const existing = Object.fromEntries(attendance.map((a) => [a.athleteId, a]));
    const seed = {};
    // Recordable only: a gated row has no controls, so it has no draft state.
    for (const a of recordable) {
      const rec = existing[a.id];
      seed[a.id] = { attended: rec ? !!rec.attended : false, note: rec?.note ?? '' };
    }
    setDraft(seed);
    if (clearWriteError) clearWriteError();
    setEditing(true);
  };

  const setAttended = (athleteId, val) => setDraft((d) => ({
    ...d, [athleteId]: { ...(d[athleteId] || { attended: false, note: '' }), attended: val },
  }));
  const setNote = (athleteId, val) => setDraft((d) => ({
    ...d, [athleteId]: { ...(d[athleteId] || { attended: false, note: '' }), note: val },
  }));

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    if (clearWriteError) clearWriteError();
    // Q3 built one record per ACTIVE athlete, attended default false. P-7 slice
    // 1 narrows that to the RECORDABLE athletes: a gated athlete is OMITTED
    // from the batch, never submitted as attended:false.
    //
    // Omission, not false, because the two mean different things. A staff
    // member who cannot edit a row has OBSERVED NOTHING about that athlete,
    // and attended:false asserts an absence nobody recorded. The distinction
    // is load-bearing at the storage layer: the upsert
    // (attendance.js:178-188, ON CONFLICT DO UPDATE on the composite key)
    // PRESERVES an omitted athlete's prior row rather than clearing it, so
    // omitting is genuinely "no new observation" and not a silent delete.
    // Anything recorded while they were delegated survives their flip, which
    // is the same retain-frozen posture as the P-3c R2 ruling.
    const records = recordable.map((a) => {
      const d = draft[a.id] || { attended: false, note: '' };
      const rec = { athleteId: a.id, attended: !!d.attended };
      const note = (d.note || '').trim();
      if (note !== '') rec.note = note;
      return rec;
    });
    const saved = await onSaveAttendance(workshop.id, records);
    if (saved) setEditing(false);
    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={workshop.title}>
      {/* Header meta */}
      <div style={headerMetaStyle}>
        <span style={metaItemStyle}>{formatDate(workshop.date)}</span>
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

        {/* Attendance — read view keys on attendance.length (Q2). Auth tree
            (editable) adds the "Record attendance" affordance + edit mode;
            demo tree renders read-only, byte-identical. */}
        <Card>
          <SectionLabel>Attendance</SectionLabel>
          {editing ? (
            <>
              {/* One explanation for the whole list rather than a sentence per
                  gated row: the per-row line names the STATE, this names the
                  rule. Says what is true of the account, never why. */}
              <p style={editIntroStyle}>
                {recordable.length === 0
                  ? 'No one on this roster has delegated record-keeping, so attendance cannot be recorded here.'
                  : 'Mark who attended. Unchecked counts as absent; add a note for context. Athletes who have not delegated record-keeping are listed without controls and are left out of what you save.'}
              </p>
              <ul style={listResetStyle}>
                {rosterSorted.map((a) => {
                  // Gated rows keep the athlete VISIBLE with the same name and
                  // sport in the same row shell, and lose only the two controls.
                  // The RosterTable precedent (OperationsRoster.jsx:152,167):
                  // remove the affordance, keep the record, so the row reads as
                  // an athlete who cannot be edited rather than one who is
                  // missing. accessLabel is the shared four-state resolver, so
                  // this line and the roster Access column can never disagree.
                  if (!canRecord(a)) {
                    return (
                      <li key={a.id} style={editRowStyle}>
                        <div style={gatedRowStyle}>
                          <span style={editNameStyle}>{a.name}</span>
                          <span style={attendanceMetaStyle}>{a.sport}</span>
                        </div>
                        <p style={gatedStateStyle}>{accessLabel(a)}</p>
                      </li>
                    );
                  }
                  const d = draft[a.id] || { attended: false, note: '' };
                  return (
                    <li key={a.id} style={editRowStyle}>
                      <label style={editCheckLabelStyle}>
                        <input
                          type="checkbox"
                          checked={d.attended}
                          onChange={(e) => setAttended(a.id, e.target.checked)}
                          style={checkboxStyle}
                        />
                        <span style={editNameStyle}>{a.name}</span>
                        <span style={attendanceMetaStyle}>{a.sport}</span>
                      </label>
                      <input
                        type="text"
                        value={d.note}
                        onChange={(e) => setNote(a.id, e.target.value)}
                        placeholder="Note (optional)"
                        style={editNoteInputStyle}
                      />
                    </li>
                  );
                })}
              </ul>
              {writeError && <p style={formErrorStyle}>{writeError}</p>}
              <div style={editFooterStyle}>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                {/* validateRecords (attendance.js:57-59) rejects an empty array
                    with a 400 the staff member could not act on, and with every
                    row gated the batch IS empty. Disable rather than let them
                    reach that; the intro above says why. Endpoint unchanged. */}
                <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || recordable.length === 0}>
                  {saving ? 'Saving…' : 'Save attendance'}
                </Button>
              </div>
            </>
          ) : hasAttendance ? (
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
              {editable && roster.length > 0 && (
                <div style={editAffordanceRowStyle}>
                  <Button variant="secondary" size="sm" onClick={enterEdit}>Record attendance</Button>
                </div>
              )}
            </>
          ) : editable ? (
            roster.length > 0 ? (
              <>
                <p style={pendingStyle}>No attendance recorded yet.</p>
                <div style={editAffordanceRowStyle}>
                  <Button variant="secondary" size="sm" onClick={enterEdit}>Record attendance</Button>
                </div>
              </>
            ) : (
              <p style={pendingStyle}>Attendance can be recorded once athletes are enrolled.</p>
            )
          ) : (
            <p style={pendingStyle}>Attendance pending.</p>
          )}
        </Card>

        {/* Follow-ups */}
        <Card>
          <SectionLabel>Follow-ups ({workshop.followUps.length})</SectionLabel>
          {workshop.followUps.length === 0 ? (
            <p style={emptyFollowUpsStyle}>No follow-ups recorded for this workshop.</p>
          ) : (
            <ul style={listResetStyle}>
              {workshop.followUps.map((f, i) => (
                <li key={f.id} style={followUpRowStyle(i === workshop.followUps.length - 1)}>
                  <FollowUpRow followUp={f} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Module reference */}
        <p style={moduleRefStyle}>
          Maps to curriculum: <span style={moduleNameStyle}>{workshop.module}</span>.
          Athletes complete the corresponding module in their own workspace.
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

// Edit-mode styles (auth-only "Record attendance"). Each roster row stacks the
// name+toggle line above a full-width note input so nothing overflows at 375px.
const editIntroStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-3)',
};

// Gated-row name line: the same two spans as the editable row's label, minus
// the checkbox, so the athlete sits at the same measure either way.
const gatedRowStyle = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 'var(--sh-space-2)',
};

// --sh-text-secondary, not --sh-text-muted: this is the only thing telling a
// staff member why a row has no controls, so it is not decoration (QA-021).
const gatedStateStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-secondary)',
  letterSpacing: '0.02em',
  margin: 0,
};

const editRowStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-2)',
  padding: 'var(--sh-space-3) 0',
  borderBottom: 'var(--sh-border-thin)',
};

const editCheckLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 'var(--sh-space-2)',
  cursor: 'pointer',
};

const editNameStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
};

const checkboxStyle = {
  accentColor: 'var(--sh-bronze)',
  flexShrink: 0,
  cursor: 'pointer',
};

const editNoteInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 'var(--sh-space-2) var(--sh-space-3)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  fontFamily: 'inherit',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  background: 'var(--sh-card)',
};

const editAffordanceRowStyle = {
  display: 'flex',
  justifyContent: 'flex-start',
  marginTop: 'var(--sh-space-4)',
};

const editFooterStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--sh-space-2)',
  marginTop: 'var(--sh-space-4)',
  paddingTop: 'var(--sh-space-4)',
  borderTop: 'var(--sh-border-thin)',
};

const formErrorStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-bronze-deep)',
  marginTop: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-2)',
};

function followUpRowStyle(isLast) {
  return {
    padding: 'var(--sh-space-3) 0',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
  };
}

const followUpContentStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--sh-space-3)',
};

function statusMarkerStyle(status) {
  const base = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    boxSizing: 'border-box',
    flexShrink: 0,
    marginTop: '7px',
    display: 'inline-block',
  };
  if (status === 'completed') return { ...base, background: 'var(--sh-bronze-deep)' };
  if (status === 'in_progress') return { ...base, border: '1.5px solid var(--sh-bronze)' };
  return { ...base, border: '1.5px solid var(--sh-text-muted)' };
}

const followUpBodyStyle = {
  flex: 1,
  minWidth: 0,
};

const followUpActionStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-primary)',
  lineHeight: 1.5,
  marginBottom: 'var(--sh-space-1)',
};

const followUpAttributionStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  lineHeight: 1.55,
  marginBottom: 'var(--sh-space-1)',
};

const followUpTrailStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
};

const followUpTrailPendingStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  fontStyle: 'italic',
};

const emptyFollowUpsStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  marginTop: 'var(--sh-space-3)',
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

function FollowUpRow({ followUp }) {
  const { action, owner, ownerRole, target, status, dueDate, completedDate } = followUp;
  const trail =
    status === 'completed' && completedDate ? `Completed ${formatDate(completedDate)}` :
    status === 'in_progress' && dueDate ? `Due ${formatDate(dueDate)}` :
    status === 'pending' ? 'Not yet started' : null;
  return (
    <div style={followUpContentStyle}>
      <span style={statusMarkerStyle(status)} aria-hidden="true" />
      <div style={followUpBodyStyle}>
        <p style={followUpActionStyle}>{action}</p>
        <p style={followUpAttributionStyle}>
          Owner: {owner} · {ownerRole}
          {target && <> · For: {target}</>}
        </p>
        {trail && (
          <p style={status === 'pending' ? followUpTrailPendingStyle : followUpTrailStyle}>
            {trail}
          </p>
        )}
      </div>
    </div>
  );
}
