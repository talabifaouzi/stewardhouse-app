import { useState } from 'react';
import { INST_PROFILES, workshops, athletes } from '../../data/enterpriseFixtures.js';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';

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
            <InfoRow
              label="Endowment"
              value={(
                <>
                  {profile.endowment}
                  <span style={pendingPillStyle}>Pending review</span>
                </>
              )}
              last
            />
          </div>
        </Card>

        {/* Card 2 — Workshop calendar */}
        <Card>
          <SectionLabel>Workshop calendar</SectionLabel>
          <p style={framingStyle}>Five workshops over the program term.</p>
          <WorkshopCalendar workshops={workshops} onWorkshopClick={setActiveWorkshop} />
        </Card>

        {/* Card 3 — Module curriculum reference */}
        <Card>
          <SectionLabel>Module curriculum reference</SectionLabel>
          <p style={curriculumIntroStyle}>
            16-lesson v1 curriculum. Sequence is flexible — facilitator may adjust pacing per cohort.
          </p>
          <ol style={curriculumListStyle}>
            {DEFAULT_CURRICULUM.map((title, i) => {
              const isLast = i === DEFAULT_CURRICULUM.length - 1;
              return (
                <li key={i} style={curriculumRowStyle(isLast)}>
                  <span style={curriculumNumberStyle}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={curriculumTitleStyle}>{title}</span>
                </li>
              );
            })}
          </ol>
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
  minWidth: '32px',
  flexShrink: 0,
};

const curriculumTitleStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.5,
};

const pendingPillStyle = {
  display: 'inline-block',
  padding: '2px 8px',
  background: 'var(--sh-bronze-tint)',
  color: 'var(--sh-bronze-deep)',
  borderRadius: 'var(--sh-radius-full)',
  fontSize: 'var(--sh-text-xs)',
  fontWeight: 500,
  letterSpacing: '0.06em',
  marginLeft: 'var(--sh-space-2)',
};
