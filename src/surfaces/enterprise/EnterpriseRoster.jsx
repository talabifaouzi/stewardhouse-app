import { useState } from 'react';
import { athletes } from '../../data/enterpriseFixtures.js';
import { Card } from '../../components/Card.jsx';
import StatTile from '../../components/StatTile.jsx';
import FilteredAthletesModal from '../../components/FilteredAthletesModal.jsx';
import AthleteProfile from '../../components/AthleteProfile.jsx';
import DataTable from '../../components/DataTable.jsx';
import { useComms } from '../../contexts/CommsContext.jsx';
import { formatDate } from '../../utils/formatDate.js';
import {
  tot,
  certD,
  stalled,
  onTrack,
  notStarted,
  activelyProgressingPct,
} from './shared/enterpriseStats.js';
import { statusFor, STATUS_PRIORITY } from './shared/athleteStatus.js';
import { CATEGORY_CONFIG, buildModalTitle } from './shared/categoryFilters.js';

const sortedAthletes = [...athletes].sort((a, b) => {
  const p = STATUS_PRIORITY[statusFor(a)] - STATUS_PRIORITY[statusFor(b)];
  if (p !== 0) return p;
  return a.name.localeCompare(b.name);
});

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

export default function EnterpriseRoster() {
  const { openCompose } = useComms();
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeAthlete, setActiveAthlete] = useState(null);

  const config = activeCategory ? CATEGORY_CONFIG[activeCategory] : null;
  const filteredAthletes = config ? athletes.filter(config.filter) : [];
  const modalTitle = buildModalTitle(config, filteredAthletes, activeCategory);

  return (
    <main style={mainStyle}>
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Roster</h1>

      {/* Stat grid — each tile drills into a filtered athlete list */}
      <div style={statGridStyle}>
        <StatTile label="Athletes" value={tot} onClick={() => setActiveCategory('all')} />
        <StatTile label="Actively progressing" value={onTrack} sublabel={`${activelyProgressingPct}% of program`} onClick={() => setActiveCategory('actively-progressing')} />
        <StatTile label="Certified" value={certD} onClick={() => setActiveCategory('certified')} />
        <StatTile label="Not yet active" value={stalled} onClick={() => setActiveCategory('not-yet-active')} />
        <StatTile label="Invited" value={notStarted} onClick={() => setActiveCategory('invited')} />
      </div>

      {/* Roster table — rows clickable, opens profile directly */}
      <Card>
        <DataTable
          columns={ROSTER_COLUMNS}
          data={sortedAthletes}
          rowKey={(a) => a.id}
          minWidth="880px"
          onRowClick={setActiveAthlete}
          rowAriaLabel={(a) => `View ${a.name}'s profile`}
        />
      </Card>

      {/* Drill-down: stat tile → filtered list → profile (stacks) */}
      <FilteredAthletesModal
        isOpen={activeCategory !== null}
        onClose={() => setActiveCategory(null)}
        title={modalTitle}
        athletes={filteredAthletes}
        onAthleteClick={setActiveAthlete}
      />

      {/* Profile: opened from filtered modal OR directly from table row */}
      <AthleteProfile
        isOpen={activeAthlete !== null}
        onClose={() => setActiveAthlete(null)}
        athlete={activeAthlete}
        onSendReminder={(a) => openCompose({ name: a.name, email: a.email }, 'Reminder')}
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

