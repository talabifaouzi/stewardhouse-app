import { INST_PROFILES, workshops, athletes } from '../../data/enterpriseFixtures.js';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';

const profile = INST_PROFILES[0];
// Split contract on " — " to separate term from date range.
// Edge case: if fixture format changes, dateRangePart defaults to ''.
const [termPart, dateRangePart = ''] = profile.contract.split(' — ');

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export default function EnterpriseProgram() {
  return (
    <main style={mainStyle}>
      <p style={eyebrowStyle}>Athletic Department · Cooper State University</p>
      <h1 style={titleStyle}>Program</h1>
      <p style={subtitleStyle}>
        {athletes.length} athletes participating · {termPart} · {dateRangePart}
      </p>

      <div style={cardStackStyle}>
        {/* Card 1 — Program details */}
        <Card>
          <SectionLabel>Program details</SectionLabel>
          <div style={detailsListStyle}>
            <InfoRow label="Package tier" value={`${profile.tier} — ${profile.annual}`} />
            <InfoRow label="Term" value={`${termPart} · ${dateRangePart}`} />
            <InfoRow label="Facilitator" value={profile.facilitator} />
            <InfoRow label="Endowment" value={profile.endowment} last />
          </div>
        </Card>

        {/* Card 2 — Workshop calendar */}
        <Card>
          <SectionLabel>Workshop calendar</SectionLabel>
          <p style={framingStyle}>Five workshops over the program term.</p>
          <ul style={listResetStyle}>
            {workshops.map((w, i) => {
              const isLast = i === workshops.length - 1;
              return (
                <li key={w.id} style={workshopRowStyle(isLast)}>
                  <div style={workshopDateStyle}>{w.date}</div>
                  <div style={workshopTitleStyle}>{w.title}</div>
                  <div style={workshopStatusStyle}>
                    {w.attendees != null ? `${w.attendees} attended` : capitalize(w.status)}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Card 3 — Module curriculum reference (placeholder) */}
        <Card tint>
          <SectionLabel>Module curriculum reference</SectionLabel>
          <p style={moduleNoteStyle}>
            Athletes complete the StewardHouse 9-lesson curriculum on the Individual surface. Module-by-module progress and certification gates are tracked there.
          </p>
        </Card>
      </div>
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
    borderBottom: last ? 'none' : `1px solid var(--sh-card-border)`,
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
  marginBottom: 'var(--sh-space-3)',
};

const listResetStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

function workshopRowStyle(isLast) {
  return {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--sh-space-4)',
    padding: 'var(--sh-space-3) 0',
    borderBottom: isLast ? 'none' : `1px solid var(--sh-card-border)`,
  };
}

const workshopDateStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-base)',
  color: 'var(--sh-text-primary)',
  minWidth: '140px',
  flexShrink: 0,
};

const workshopTitleStyle = {
  flex: 1,
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.5,
};

const workshopStatusStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  whiteSpace: 'nowrap',
  letterSpacing: '0.02em',
};

const moduleNoteStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
  maxWidth: '640px',
};
