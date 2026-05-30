import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from './Card.jsx';
import { SectionLabel } from './SectionLabel.jsx';

// Generic 4-section briefing shell. Sections with zero items hide entirely.
// Attention section gets a bronze-deep bullet accent to flag priority items
// visually distinct from the other three sections.

export default function DailyBrief({
  notionalDate,
  attention = [],
  priorities = [],
  recentActivity = [],
  upcoming = [],
}) {
  const sections = [
    { label: 'Attention', items: attention, accent: true },
    { label: "Today's priorities", items: priorities, accent: false },
    { label: 'Recent activity', items: recentActivity, accent: false },
    { label: 'Upcoming', items: upcoming, accent: false },
  ].filter((s) => s.items.length > 0);

  return (
    <Card>
      <div style={headerRowStyle}>
        <SectionLabel>Today's brief</SectionLabel>
        <span style={notionalDateStyle}>{notionalDate}</span>
      </div>
      {sections.map((s, i) => (
        <BriefSection
          key={s.label}
          label={s.label}
          items={s.items}
          accent={s.accent}
          isFirst={i === 0}
        />
      ))}
    </Card>
  );
}

function BriefSection({ label, items, accent, isFirst }) {
  if (items.length === 0) return null;
  const countText = `${items.length} item${items.length === 1 ? '' : 's'}`;
  return (
    <div style={sectionStyle(isFirst)}>
      <div style={sectionHeaderStyle}>
        <span style={sectionLabelStyle}>{label}</span>
        <span style={sectionCountStyle}>{countText}</span>
      </div>
      <ul style={itemListStyle}>
        {items.map((item) => (
          <BriefItem key={item.id} item={item} accent={accent} />
        ))}
      </ul>
    </div>
  );
}

function BriefItem({ item, accent }) {
  return (
    <li style={itemRowStyle}>
      <span
        style={{
          ...bulletStyle,
          background: accent ? 'var(--sh-bronze-deep)' : 'var(--sh-text-muted)',
        }}
        aria-hidden="true"
      />
      <div style={itemContentStyle}>
        {item.link ? (
          <ItemLink to={item.link} text={item.text} />
        ) : (
          <span style={itemTextStyle}>{item.text}</span>
        )}
        {item.meta && <p style={itemMetaStyle}>{item.meta}</p>}
      </div>
    </li>
  );
}

function ItemLink({ to, text }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...itemTextStyle,
        color: hovered ? 'var(--sh-bronze-deep)' : 'var(--sh-bronze)',
        textDecoration: 'none',
        transition: 'color 150ms ease',
      }}
    >
      {text}
    </Link>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const headerRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-3)',
};

const notionalDateStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.04em',
};

function sectionStyle(isFirst) {
  return {
    paddingTop: 'var(--sh-space-4)',
    paddingBottom: 'var(--sh-space-2)',
    borderTop: isFirst ? 'none' : 'var(--sh-border-thin)',
  };
}

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-3)',
};

const sectionLabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
};

const sectionCountStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
};

const itemListStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

const itemRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--sh-space-3)',
  paddingTop: 'var(--sh-space-2)',
  paddingBottom: 'var(--sh-space-2)',
};

const bulletStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  flexShrink: 0,
  marginTop: '8px',
  display: 'inline-block',
};

const itemContentStyle = {
  flex: 1,
  minWidth: 0,
};

const itemTextStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-primary)',
  lineHeight: 1.5,
};

const itemMetaStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  lineHeight: 1.5,
  marginTop: 'var(--sh-space-1)',
};
