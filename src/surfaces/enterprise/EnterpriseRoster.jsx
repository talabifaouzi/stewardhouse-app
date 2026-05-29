import { athletes } from '../../data/enterpriseFixtures.js';
import { Card } from '../../components/Card.jsx';

// Duplicated from EnterpriseOverview — no shared-helper refactor this slice
// (tracked as a polish-pass item: "extract enterprise stats to shared helper").
const tot = athletes.length;
const gpsD = athletes.filter((a) => a.gpsCompleted).length;
const certD = athletes.filter((a) => a.certified).length;
const inProg = athletes.filter((a) => a.lessons > 0 && !a.certified).length;
const stalled = athletes.filter((a) => a.lessons > 0 && !a.gpsCompleted).length;
const onTrack = inProg - stalled;
const notStarted = athletes.filter((a) => a.lessons === 0).length;
const tGi = athletes.reduce((s, a) => s + a.gifts, 0);
const athletesWithGifts = athletes.filter((a) => a.gifts > 0).length;
const gpsRate = Math.round((gpsD / tot) * 100);
const activelyProgressingPct = Math.round(((certD + onTrack) / tot) * 100);

function statusFor(a) {
  if (a.certified) return 'Certified';
  if (a.lessons > 0 && !a.gpsCompleted) return 'Not yet active';
  if (a.status === 'invited' || a.lessons === 0) return 'Invited';
  return 'Actively progressing';
}

const STATUS_PRIORITY = {
  'Certified': 1,
  'Actively progressing': 2,
  'Not yet active': 3,
  'Invited': 4,
};

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
        <Stat label="Athletes" value={tot} />
        <Stat label="Actively progressing" value={onTrack} sublabel={`${activelyProgressingPct}% of program`} />
        <Stat label="Certified" value={certD} />
        <Stat label="Not yet active" value={stalled} />
        <Stat label="Invited" value={notStarted} />
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

function Stat({ label, value, sublabel }) {
  return (
    <div style={statTileStyle}>
      <p style={statLabelStyle}>{label}</p>
      <p style={statValueStyle}>{value}</p>
      {sublabel && <p style={statSublabelStyle}>{sublabel}</p>}
    </div>
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

const statTileStyle = {
  background: 'var(--sh-card)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-lg)',
  padding: 'var(--sh-space-5)',
};

const statLabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--sh-space-2)',
  fontWeight: 500,
};

const statValueStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-2xl)',
  color: 'var(--sh-text-primary)',
  lineHeight: 1.1,
};

const statSublabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  marginTop: 'var(--sh-space-2)',
  lineHeight: 1.5,
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
