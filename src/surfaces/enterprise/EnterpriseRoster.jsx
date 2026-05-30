import { athletes } from '../../data/enterpriseFixtures.js';
import { Card } from '../../components/Card.jsx';
import StatTile from '../../components/StatTile.jsx';
import {
  tot,
  certD,
  stalled,
  onTrack,
  notStarted,
  activelyProgressingPct,
} from './shared/enterpriseStats.js';
import { statusFor, STATUS_PRIORITY } from './shared/athleteStatus.js';

const sortedAthletes = [...athletes].sort((a, b) => {
  const p = STATUS_PRIORITY[statusFor(a)] - STATUS_PRIORITY[statusFor(b)];
  if (p !== 0) return p;
  return a.name.localeCompare(b.name);
});

export default function EnterpriseRoster() {
  return (
    <main style={mainStyle}>
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Roster</h1>

      {/* Stat grid (mirrors Overview) */}
      <div style={statGridStyle}>
        <StatTile label="Athletes" value={tot} />
        <StatTile label="Actively progressing" value={onTrack} sublabel={`${activelyProgressingPct}% of program`} />
        <StatTile label="Certified" value={certD} />
        <StatTile label="Not yet active" value={stalled} />
        <StatTile label="Invited" value={notStarted} />
      </div>

      {/* Roster table */}
      <Card>
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Sport</th>
                <th style={thStyle}>Year</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>GPS</th>
                <th style={thStyle}>Lessons</th>
                <th style={thStyle}>Gifts</th>
                <th style={thStyle}>Last Active</th>
                <th style={thStyle}>Certified</th>
              </tr>
            </thead>
            <tbody>
              {sortedAthletes.map((a, i) => {
                const isLast = i === sortedAthletes.length - 1;
                return (
                  <tr key={a.id}>
                    <td style={tdStyle(isLast)}>{a.name}</td>
                    <td style={tdStyle(isLast)}>{a.sport}</td>
                    <td style={tdStyle(isLast)}>{a.year}</td>
                    <td style={tdStyle(isLast)}>{statusFor(a)}</td>
                    <td style={tdStyle(isLast)}>{a.gpsCompleted ? a.gpsDate : '—'}</td>
                    <td style={tdStyle(isLast)}>{a.lessons}</td>
                    <td style={tdStyle(isLast)}>{a.gifts}</td>
                    <td style={tdStyle(isLast)}>{a.lastActive}</td>
                    <td style={tdStyle(isLast)}>{a.certified ? a.certDate : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}

const mainStyle = {
  maxWidth: 'var(--sh-content-max)',
  margin: '0 auto',
  padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
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

const tableWrapperStyle = {
  overflowX: 'auto',
  width: '100%',
};

const tableStyle = {
  width: '100%',
  minWidth: '880px',
  borderCollapse: 'collapse',
};

const thStyle = {
  textAlign: 'left',
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
  padding: 'var(--sh-space-3) var(--sh-space-3)',
  borderBottom: 'var(--sh-border-thin)',
  whiteSpace: 'nowrap',
};

function tdStyle(isLast) {
  return {
    fontSize: 'var(--sh-text-sm)',
    color: 'var(--sh-text-body)',
    padding: 'var(--sh-space-3) var(--sh-space-3)',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
    lineHeight: 1.5,
    verticalAlign: 'top',
    whiteSpace: 'nowrap',
  };
}
