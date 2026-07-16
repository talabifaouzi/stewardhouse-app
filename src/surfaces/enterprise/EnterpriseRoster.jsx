import { useState, useMemo } from 'react';
import { Card } from '../../components/Card.jsx';
import StatTile from '../../components/StatTile.jsx';
import FilteredAthletesModal from '../../components/FilteredAthletesModal.jsx';
import AthleteProfile from '../../components/AthleteProfile.jsx';
import DataTable from '../../components/DataTable.jsx';
import { Button } from '../../components/Button.jsx';
import { useComms } from '../../contexts/CommsContext.jsx';
import { useAthletes } from '../../contexts/AthletesContext.jsx';
import { useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { useInstitutionEyebrow } from './shared/useInstitutionEyebrow.js';
import { formatDate } from '../../utils/formatDate.js';
import { computeStats } from './shared/enterpriseStats.js';
import { statusFor, STATUS_PRIORITY, accessLabel } from './shared/athleteStatus.js';
import { CATEGORY_CONFIG, buildModalTitle } from './shared/categoryFilters.js';
import AddAthleteModal from './AddAthleteModal.jsx';

const ROSTER_COLUMNS = [
  { key: 'name',       label: 'Name',        render: (a) => a.name },
  { key: 'sport',      label: 'Sport',       render: (a) => a.sport },
  { key: 'year',       label: 'Year',        render: (a) => a.year },
  { key: 'status',     label: 'Status',      render: (a) => statusFor(a) },
  { key: 'gps',        label: 'GPS',         render: (a) => (a.gpsCompleted ? formatDate(a.gpsDate) : '—') },
  { key: 'lessons',    label: 'Lessons',     render: (a) => a.lessons },
  { key: 'gifts',      label: 'Gifts',       render: (a) => a.gifts },
  { key: 'lastActive', label: 'Last Active', render: (a) => a.lastActive },
  { key: 'certified',  label: 'Certified',   render: (a) => (a.certified ? formatDate(a.certDate) : '—') },
];

// Access column (C-3b) — claim/consent state, plain text. AUTHENTICATED-ONLY:
// `claimed` is a live boolean present only on /api/me roster elements; the demo
// fixtures don't carry it, so surfacing this on the demo tree would falsely
// read every demonstrative athlete as "Unclaimed" (a false live-signal, against
// the demonstrative/LIVE honesty boundary). Inserted after Status on the auth
// tree only; the demo tree renders ROSTER_COLUMNS byte-identical.
const ACCESS_COLUMN = { key: 'access', label: 'Access', render: (a) => accessLabel(a) };
const AUTH_ROSTER_COLUMNS = [
  ...ROSTER_COLUMNS.slice(0, 4),   // through Status
  ACCESS_COLUMN,
  ...ROSTER_COLUMNS.slice(4),
];

export default function EnterpriseRoster() {
  const eyebrow = useInstitutionEyebrow();
  const { openCompose } = useComms();
  const { athletes, add, remove, writeError, clearWriteError } = useAthletes();
  // Roster-add affordance is authenticated-only — the demo tree renders
  // byte-identical (no CTA, no modal). Gate on identity presence.
  const isAuthenticated = !!useOptionalAppIdentity();
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeAthlete, setActiveAthlete] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const { tot, certD, stalled, onTrack, notStarted, activelyProgressingPct } = computeStats(athletes);
  const sortedAthletes = useMemo(() => [...athletes].sort((a, b) => {
    const p = STATUS_PRIORITY[statusFor(a)] - STATUS_PRIORITY[statusFor(b)];
    if (p !== 0) return p;
    return a.name.localeCompare(b.name);
  }), [athletes]);

  // Access column is authenticated-only (see AUTH_ROSTER_COLUMNS docblock);
  // the demo tree keeps the 9-column set byte-identical.
  const rosterColumns = isAuthenticated ? AUTH_ROSTER_COLUMNS : ROSTER_COLUMNS;
  const rosterMinWidth = isAuthenticated ? '960px' : '880px';

  const config = activeCategory ? CATEGORY_CONFIG[activeCategory] : null;
  const filteredAthletes = config ? athletes.filter(config.filter) : [];
  const modalTitle = buildModalTitle(config, filteredAthletes, activeCategory);

  return (
    <main style={mainStyle}>
      {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
      <h1 style={titleStyle}>Roster</h1>

      {/* Stat grid — each tile drills into a filtered athlete list */}
      <div style={statGridStyle}>
        <StatTile label="Athletes" value={tot} onClick={() => setActiveCategory('all')} />
        <StatTile label="Actively progressing" value={onTrack} sublabel={`${activelyProgressingPct}% of program`} onClick={() => setActiveCategory('actively-progressing')} />
        <StatTile label="Certified" value={certD} onClick={() => setActiveCategory('certified')} />
        <StatTile label="Not yet active" value={stalled} onClick={() => setActiveCategory('not-yet-active')} />
        <StatTile label="Invited" value={notStarted} onClick={() => setActiveCategory('invited')} />
      </div>

      {/* Add-athlete CTA — authenticated tree only, when the roster is
          non-empty (the empty state carries its own affordance below). */}
      {isAuthenticated && sortedAthletes.length > 0 && (
        <div style={addRowStyle}>
          <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>Add athlete</Button>
        </div>
      )}

      {/* Roster table — rows clickable, opens profile directly. Empty until
          athletes enroll via the roster-add write path (slim-seed ruling). */}
      <Card>
        {sortedAthletes.length > 0 ? (
          <DataTable
            columns={rosterColumns}
            data={sortedAthletes}
            rowKey={(a) => a.id}
            minWidth={rosterMinWidth}
            onRowClick={setActiveAthlete}
            rowAriaLabel={(a) => `View ${a.name}'s profile`}
          />
        ) : (
          <div style={emptyBlockStyle}>
            <p style={emptyStateStyle}>No athletes enrolled yet.</p>
            {isAuthenticated && (
              <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>Add the first athlete</Button>
            )}
          </div>
        )}
      </Card>

      {/* Roster-add form — authenticated tree only. */}
      {isAuthenticated && (
        <AddAthleteModal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          onAdd={add}
          writeError={writeError}
          clearWriteError={clearWriteError}
        />
      )}

      {/* Drill-down: stat tile → filtered list → profile (stacks) */}
      <FilteredAthletesModal
        isOpen={activeCategory !== null}
        onClose={() => setActiveCategory(null)}
        title={modalTitle}
        athletes={filteredAthletes}
        onAthleteClick={setActiveAthlete}
      />

      {/* Profile: opened from filtered modal OR directly from table row.
          Remove-from-roster (anonymize) is authenticated-only. */}
      <AthleteProfile
        isOpen={activeAthlete !== null}
        onClose={() => setActiveAthlete(null)}
        athlete={activeAthlete}
        onSendReminder={(a) => openCompose({ name: a.name, email: a.email }, 'Reminder')}
        onRemove={isAuthenticated ? remove : undefined}
        writeError={writeError}
        clearWriteError={clearWriteError}
      />
    </main>
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
  marginBottom: 'var(--sh-space-6)',
};

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 'var(--sh-space-4)',
  marginBottom: 'var(--sh-space-6)',
};

// Quiet empty-state line when the roster carries no athletes (auth tree).
const emptyStateStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  padding: 'var(--sh-space-2) 0',
};

// Empty-state block: line + "Add the first athlete" affordance (auth tree).
const emptyBlockStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 'var(--sh-space-3)',
  padding: 'var(--sh-space-2) 0',
};

// Right-aligned "Add athlete" CTA row above a populated roster (auth tree).
const addRowStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: 'var(--sh-space-4)',
};

