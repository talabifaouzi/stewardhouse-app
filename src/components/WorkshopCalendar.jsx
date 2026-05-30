import { useState } from 'react';

// Month-grid calendar widget. Pure CSS grid, no external library.
// Props: workshops (array), onWorkshopClick (fn).
//
// Default month: September 2026 (first month containing a workshop in the
// current fixture). Prev/Next buttons cycle months; out-of-month cells
// render muted; today's cell (when navigated to) gets a bronze-tint
// background. Workshop entries are clickable buttons within their day cell.

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function WorkshopCalendar({ workshops, onWorkshopClick }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Workshop lookup by YYYY-MM-DD
  const workshopsByDate = {};
  workshops.forEach((w) => {
    const d = new Date(w.date);
    const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    if (!workshopsByDate[key]) workshopsByDate[key] = [];
    workshopsByDate[key].push(w);
  });

  const startDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // 42-cell grid (7×6 — covers any month)
  const cells = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    cells.push({
      date: daysInPrevMonth - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      inMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: d, month, year, inMonth: true });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      date: nextDay++,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      inMonth: false,
    });
  }

  const today = new Date();
  const isToday = (cell) =>
    cell.date === today.getDate() &&
    cell.month === today.getMonth() &&
    cell.year === today.getFullYear();

  const goPrev = () => setCurrentDate(new Date(year, month - 1, 1));
  const goNext = () => setCurrentDate(new Date(year, month + 1, 1));

  const prevMonthShort = MONTH_NAMES_SHORT[(month + 11) % 12];
  const nextMonthShort = MONTH_NAMES_SHORT[(month + 1) % 12];

  return (
    <div>
      {/* Month/year header with prev/next */}
      <div style={headerStyle}>
        <button type="button" onClick={goPrev} style={navButtonStyle} aria-label="Previous month">
          ← {prevMonthShort}
        </button>
        <h3 style={monthLabelStyle}>{MONTH_NAMES[month]} {year}</h3>
        <button type="button" onClick={goNext} style={navButtonStyle} aria-label="Next month">
          {nextMonthShort} →
        </button>
      </div>

      {/* Day-of-week header + day grid */}
      <div style={gridStyle}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={dayLabelStyle}>{d}</div>
        ))}
        {cells.map((cell, i) => {
          const key = dateKey(cell.year, cell.month, cell.date);
          const cellWorkshops = workshopsByDate[key] || [];
          const todayCell = isToday(cell);
          return (
            <div
              key={i}
              style={{
                ...dayCellStyle,
                background: todayCell ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
              }}
            >
              <div style={{ ...dateNumberStyle, opacity: cell.inMonth ? 1 : 0.35 }}>
                {cell.date}
              </div>
              {cellWorkshops.map((w) => (
                <WorkshopEntry key={w.id} workshop={w} onClick={() => onWorkshopClick(w)} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkshopEntry({ workshop, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...workshopEntryStyle,
        background: hovered ? 'var(--sh-bronze-tint)' : 'transparent',
        outline: focused ? '2px solid var(--sh-bronze)' : 'none',
        outlineOffset: '-1px',
      }}
    >
      <span style={workshopDotStyle} />
      <span style={workshopTitleStyle}>{workshop.title}</span>
    </button>
  );
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 'var(--sh-space-4)',
  gap: 'var(--sh-space-3)',
};

const monthLabelStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-lg)',
  color: 'var(--sh-text-primary)',
  margin: 0,
  textAlign: 'center',
  flex: 1,
};

const navButtonStyle = {
  background: 'transparent',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  padding: 'var(--sh-space-2) var(--sh-space-3)',
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-secondary)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: '1px',
  background: 'var(--sh-card-border)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  overflow: 'hidden',
};

const dayLabelStyle = {
  padding: 'var(--sh-space-2)',
  textAlign: 'center',
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  background: 'var(--sh-card)',
  fontWeight: 500,
};

const dayCellStyle = {
  minHeight: '72px',
  padding: 'var(--sh-space-2)',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const dateNumberStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  marginBottom: 'var(--sh-space-1)',
  fontWeight: 500,
};

const workshopEntryStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 4px',
  borderRadius: 'var(--sh-radius-sm)',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  width: '100%',
  textAlign: 'left',
  transition: 'background 150ms ease',
};

const workshopDotStyle = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: 'var(--sh-bronze)',
  flexShrink: 0,
  display: 'inline-block',
};

const workshopTitleStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-body)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  lineHeight: 1.3,
  minWidth: 0,
};
