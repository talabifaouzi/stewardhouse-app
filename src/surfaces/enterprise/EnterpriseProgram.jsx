import { useState } from 'react';
import { INST_PROFILES, workshops, athletes } from '../../data/enterpriseFixtures.js';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import WorkshopCalendar from '../../components/WorkshopCalendar.jsx';
import WorkshopDetail from '../../components/WorkshopDetail.jsx';

const profile = INST_PROFILES[0];
const [termPart, dateRangePart = ''] = profile.contract.split(' — ');
const athletesById = Object.fromEntries(athletes.map((a) => [a.id, a]));

export default function EnterpriseProgram() {
  const [activeWorkshop, setActiveWorkshop] = useState(null);

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
          <p style={framingStyle}>Five workshops over the program term. Click a workshop to view details.</p>
          <WorkshopCalendar workshops={workshops} onWorkshopClick={setActiveWorkshop} />
        </Card>

        {/* Card 3 — Module curriculum reference (placeholder) */}
        <Card tint>
          <SectionLabel>Module curriculum reference</SectionLabel>
          <p style={moduleNoteStyle}>
            Athletes complete the StewardHouse 9-lesson curriculum on the Individual surface. Module-by-module progress and certification gates are tracked there.
          </p>
        </Card>
      </div>

      {/* Workshop detail modal */}
      <WorkshopDetail
        isOpen={activeWorkshop !== null}
        onClose={() => setActiveWorkshop(null)}
        workshop={activeWorkshop}
        athletesById={athletesById}
      />
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

const moduleNoteStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.65,
  marginTop: 'var(--sh-space-3)',
  maxWidth: '640px',
};
