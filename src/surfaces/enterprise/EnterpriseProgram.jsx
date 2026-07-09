import { useState, useMemo } from 'react';
import { INST_PROFILES } from '../../data/enterpriseFixtures.js';
import { useAthletes } from '../../contexts/AthletesContext.jsx';
import { useWorkshops } from '../../contexts/WorkshopsContext.jsx';
import { useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { Tag } from '../../components/Tag.jsx';
import { Button } from '../../components/Button.jsx';
import ScheduleWorkshopModal from './ScheduleWorkshopModal.jsx';

const DEFAULT_CURRICULUM = [
  'Building Your GPS',
  'Cause Discovery',
  'Giving Identity',
  'Vetting Organizations',
  'Giving Vehicles',
  'Tax Strategy',
  'Multi-Year Commitments',
  'Year-End Review',
  'Capstone Reflection',
  'Privacy & Identity in Giving',
  'Crisis Posture',
  'Public Voice and Visibility',
  'Family + Community Context',
  'Sustaining Practice',
  'Engagement Depth',
  'Lifetime Stewardship',
];
import WorkshopCalendar from '../../components/WorkshopCalendar.jsx';
import WorkshopDetail from '../../components/WorkshopDetail.jsx';

const profile = INST_PROFILES[0];
const [termPart, dateRangePart = ''] = profile.contract.split(' — ');

const endowmentTag = (label) => (
  <>
    {label}
    <Tag color="bronze" tracking="loose" style={{ marginLeft: 'var(--sh-space-2)' }}>Pending review</Tag>
  </>
);

export default function EnterpriseProgram() {
  const { athletes } = useAthletes();
  // Workshops come from the provider now (was a direct fixture import). Demo
  // tree: the provider's fixture default (byte-identical to the old import).
  // Auth tree: the /api/me institution workshops (empty until scheduled).
  const { workshops, add: addWorkshop, updateAttendance, writeError, clearWriteError } = useWorkshops();
  const appIdentity = useOptionalAppIdentity();
  const [activeWorkshop, setActiveWorkshop] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Attendance save (E-Write-3b): write through the provider, then refresh the
  // open modal with the returned element (activeWorkshop is a click-time
  // snapshot, so it must be re-pointed at the saved workshop to re-render).
  const handleSaveAttendance = async (workshopId, records) => {
    const saved = await updateAttendance(workshopId, records);
    if (saved && typeof saved === 'object') setActiveWorkshop(saved);
    return saved;
  };

  const isAuthenticated = !!appIdentity;
  const ent = appIdentity?.identity?.enterprise ?? null;
  const athletesById = useMemo(
    () => Object.fromEntries(athletes.map((a) => [a.id, a])),
    [athletes],
  );

  // Institution term + endowment: identity on the auth tree, fixture on demo.
  const [authTerm, authRange = ''] = (ent?.programTerm || '').split(' — ');
  const termLabel = isAuthenticated ? authTerm : termPart;
  const rangeLabel = isAuthenticated ? authRange : dateRangePart;
  const endowmentLabel = isAuthenticated
    ? (ent?.endowmentAnnual != null ? `$${ent.endowmentAnnual.toLocaleString('en-US')}/yr` : '—')
    : profile.endowment;

  // Program-details rows differ by tree. The authenticated tree shows only the
  // identity-backed fields (Term, Endowment); Package tier + Facilitator are
  // NOT emitted by /api/me (institution.tier and the facilitator contact are
  // unwired), so they are omitted on auth rather than leaking the fixture.
  // Wiring those would be a follow-up /api/me widening (same shape as the
  // endowment fields added in 6b).
  const detailRows = isAuthenticated
    ? [
        { label: 'Term', value: `${termLabel} · ${rangeLabel}` },
        { label: 'Endowment', value: endowmentTag(endowmentLabel) },
      ]
    : [
        { label: 'Package tier', value: `${profile.tier} — ${profile.annual}` },
        { label: 'Term', value: `${termLabel} · ${rangeLabel}` },
        { label: 'Facilitator', value: profile.facilitator },
        { label: 'Endowment', value: endowmentTag(endowmentLabel) },
      ];

  return (
    <main style={mainStyle}>
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Program</h1>
      <p style={subtitleStyle}>
        {athletes.length} athletes · {termLabel} · {rangeLabel}
      </p>

      <div style={cardStackStyle}>
        {/* Card 1 — Program details */}
        <Card>
          <SectionLabel>Program details</SectionLabel>
          <div style={detailsListStyle}>
            {detailRows.map((row, i) => (
              <InfoRow
                key={row.label}
                label={row.label}
                value={row.value}
                last={i === detailRows.length - 1}
              />
            ))}
          </div>
        </Card>

        {/* Card 2 — Workshop calendar. Demo tree: fixture calendar (no CTA).
            Auth tree: "Schedule workshop" affordance (authenticated-only,
            E11-gated dark on prod) + empty state OR the live calendar. */}
        <Card>
          <SectionLabel>Workshop calendar</SectionLabel>
          {isAuthenticated ? (
            <>
              <div style={scheduleRowStyle}>
                <Button variant="secondary" size="sm" onClick={() => setScheduleOpen(true)}>
                  Schedule workshop
                </Button>
              </div>
              {workshops.length === 0 ? (
                <p style={framingStyle}>No workshops scheduled yet.</p>
              ) : (
                <WorkshopCalendar workshops={workshops} onWorkshopClick={setActiveWorkshop} />
              )}
            </>
          ) : (
            <>
              <p style={framingStyle}>Five workshops over the program term.</p>
              <WorkshopCalendar workshops={workshops} onWorkshopClick={setActiveWorkshop} />
            </>
          )}
        </Card>

        {/* Card 3 — Module curriculum reference */}
        <Card>
          <SectionLabel>Module curriculum reference</SectionLabel>
          <p style={curriculumIntroStyle}>
            16-lesson curriculum. Sequence is flexible — facilitator may adjust pacing per cohort.
          </p>
          <ol style={curriculumListStyle}>
            {DEFAULT_CURRICULUM.map((title, i) => {
              const isLast = i === DEFAULT_CURRICULUM.length - 1;
              return (
                <li key={title} style={curriculumRowStyle(isLast)}>
                  <span style={curriculumNumberStyle}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={curriculumTitleStyle}>{title}</span>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      {/* Workshop detail modal. Auth tree enables attendance edit mode
          (editable + roster + save wired); demo tree renders read-only. */}
      <WorkshopDetail
        isOpen={activeWorkshop !== null}
        onClose={() => setActiveWorkshop(null)}
        workshop={activeWorkshop}
        athletesById={athletesById}
        editable={isAuthenticated}
        roster={athletes}
        onSaveAttendance={handleSaveAttendance}
        writeError={writeError}
        clearWriteError={clearWriteError}
      />

      {/* Schedule-workshop form — authenticated tree only (E11-gated). */}
      {isAuthenticated && (
        <ScheduleWorkshopModal
          isOpen={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          onAdd={addWorkshop}
          writeError={writeError}
          clearWriteError={clearWriteError}
        />
      )}
    </main>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <div style={infoRowStyle(last)}>
      <p style={infoLabelStyle}>{label}</p>
      <p style={infoValueStyle}>{value}</p>
    </div>
  );
}

const mainStyle = {
  maxWidth: 'var(--sh-content-max)',
  margin: '0 auto',
  padding: 'var(--sh-space-10) clamp(var(--sh-space-3), 4vw, var(--sh-space-8)) var(--sh-space-16)',
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
  lineHeight: 1.65,
  marginBottom: 'var(--sh-space-8)',
};

const cardStackStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-5)',
};

const detailsListStyle = {
  marginTop: 'var(--sh-space-3)',
};

function infoRowStyle(last) {
  return {
    paddingTop: 'var(--sh-space-3)',
    paddingBottom: 'var(--sh-space-3)',
    borderBottom: last ? 'none' : 'var(--sh-border-thin)',
  };
}

const infoLabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
  marginBottom: 'var(--sh-space-2)',
};

const infoValueStyle = {
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.55,
};

const framingStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-4)',
};

// Right-aligned "Schedule workshop" CTA row above the calendar (auth tree),
// mirroring the roster's addRowStyle.
const scheduleRowStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-4)',
};

const curriculumIntroStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-4)',
  maxWidth: '640px',
};

const curriculumListStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

function curriculumRowStyle(isLast) {
  return {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--sh-space-4)',
    padding: 'var(--sh-space-3) 0',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
  };
}

const curriculumNumberStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.06em',
  minWidth: 'var(--sh-space-8)',
  flexShrink: 0,
};

const curriculumTitleStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.5,
};

