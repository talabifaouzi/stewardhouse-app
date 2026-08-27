import { useState, useMemo } from 'react';
import { Icon } from './Icon.jsx';

// ENT #43 — shared DataTable primitive. Replaces three near-identical table
// blocks (EnterpriseRoster + ProgramOutputs + CohortComparison) whose
// `tableWrapperStyle` / `tableStyle` / `thStyle` / `tdStyle(isLast)` consts
// were verbatim duplicates.
//
// Column shape: { key, label, render: row => ReactNode, lead?, nowrap?, sortValue? }
//   - lead: true   → first-column serif treatment (was tdOrgStyle / tdSportStyle)
//   - nowrap       → for lead columns only, defaults false (wrappable for long
//                    org names — ProgramOutputs); pass nowrap:true to opt in
//                    (CohortComparison's Sport column). Non-lead cells always
//                    nowrap (matches all three pre-refactor behaviors).
//
// SORTING IS OPT-IN PER COLUMN (roster-import arc, SORTING RULED 2026-08-27).
// A column is sortable if and only if it supplies `sortValue: row => primitive`.
// Columns without it render exactly as before, so CohortComparison and
// ProgramOutputs, which pass no sortValue anywhere, are untouched, header
// markup included.
//
// DataTable stays DOMAIN-FREE. It never knows what an athlete is: the consumer
// supplies the ordering by mapping a row to a comparable primitive, and supplies
// `defaultSort` (used when no column is chosen) and `tiebreak` (applied when a
// chosen column ties). STATUS_ORDER, ACCESS_ORDER and YEAR_ORDER live with the
// domain, not here.
//
// SORT STATE IS INTERNAL, which is what makes "a chosen sort RESETS on
// navigation" true by construction rather than by a cleanup effect: the state
// dies with the component. Persisting it would take deliberate extra work,
// which is the right way round for a ruling that declined persistence.
//
// NULLS SORT LAST IN BOTH DIRECTIONS. A null is "no value recorded", not a low
// value, so treating it as smallest would push unrecorded rows to the top on an
// ascending sort and bury the rows that actually have data. Both directions put
// them last, so the rows with data always lead.
//
// NOTHING RENDERS A SCORE, A RANK NUMBER OR A POSITION INDEX (§7). The only
// visual signal is a rotated chevron from the shared Icon registry, and the
// machine-readable signal is aria-sort on the header cell.
//
// Interactive rows: when onRowClick is set, rows get the ENT #15
// keyboard-activation pattern (tabIndex={0} + Enter/Space + preventDefault),
// hover background, and aria-label via rowAriaLabel. Row semantics are
// preserved — NO role="button" override, per WAI-ARIA tabular-data practice.
// When onRowClick is absent, rows are pure presentation.
export default function DataTable({
  columns,
  data,
  rowKey,
  minWidth = '560px',
  onRowClick,
  rowAriaLabel,
  defaultSort,
  tiebreak,
}) {
  const [hoveredRowKey, setHoveredRowKey] = useState(null);
  // null = no column chosen, so defaultSort governs.
  const [sort, setSort] = useState(null);
  const interactive = typeof onRowClick === 'function';

  const toggleSort = (key) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      // Third press clears back to the default rather than cycling forever, so
      // the operator can always get back to what they started with.
      return null;
    });
  };

  const rows = useMemo(() => {
    const copy = [...data];
    const col = sort ? columns.find((c) => c.key === sort.key) : null;
    if (!col || !isSortable(col)) {
      return typeof defaultSort === 'function' ? copy.sort(defaultSort) : copy;
    }
    const dir = sort.dir === 'desc' ? -1 : 1;
    const tie = typeof tiebreak === 'function' ? tiebreak : () => 0;
    return copy.sort((a, b) => {
      const va = col.sortValue(a);
      const vb = col.sortValue(b);
      const na = va == null || va === '';
      const nb = vb == null || vb === '';
      if (na && nb) return tie(a, b);
      if (na) return 1;                       // nulls last, both directions
      if (nb) return -1;
      const cmp = (typeof va === 'number' && typeof vb === 'number')
        ? va - vb
        : String(va).localeCompare(String(vb));
      return cmp !== 0 ? cmp * dir : tie(a, b);
    });
  }, [data, sort, columns, defaultSort, tiebreak]);

  return (
    <div style={tableWrapperStyle}>
      <table style={{ ...tableStyle, minWidth }}>
        <thead>
          <tr>
            {columns.map((c) => {
              const sortable = isSortable(c);
              const active = sortable && sort && sort.key === c.key;
              return (
                <th
                  key={c.key}
                  style={sortable ? sortableThStyle : thStyle}
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : (sortable ? 'none' : undefined)}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      style={sortButtonStyle}
                      aria-label={`Sort by ${c.label}`}
                    >
                      <span>{c.label}</span>
                      {active && (
                        <span style={sort.dir === 'asc' ? caretUpStyle : caretDownStyle}>
                          <Icon name="chevron-right" width={7} height={10} />
                        </span>
                      )}
                    </button>
                  ) : c.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isLast = i === rows.length - 1;
            const key = rowKey(row);
            const isHovered = hoveredRowKey === key;
            const rowProps = interactive
              ? {
                  tabIndex: 0,
                  'aria-label': rowAriaLabel ? rowAriaLabel(row) : undefined,
                  onClick: () => onRowClick(row),
                  onKeyDown: (e) => {
                    // ENT #15 — keyboard activation; Space preventDefault
                    // suppresses page-scroll.
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  },
                  onMouseEnter: () => setHoveredRowKey(key),
                  onMouseLeave: () => setHoveredRowKey(null),
                  style: {
                    cursor: 'pointer',
                    background: isHovered ? 'var(--sh-bg-tint)' : 'transparent',
                    transition: 'background 150ms ease',
                  },
                }
              : {};
            return (
              <tr key={key} {...rowProps}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={c.lead ? leadCellStyle(isLast, c.nowrap) : cellStyle(isLast)}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const tableWrapperStyle = {
  overflowX: 'auto',
  width: '100%',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
};

function isSortable(c) {
  return typeof c.sortValue === 'function';
}

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

// A sortable header drops its own padding and hands it to the button, so the
// button IS the tap target rather than sitting inside one. minHeight 44px meets
// the §7 LOCKED tap-target standard, which the default header does not: at
// --sh-text-xs 11px plus --sh-space-3 12px top and bottom, a plain header cell
// computes to roughly 35px. The header row grows to 44px on any table that opts
// into sorting, and is untouched on the two that do not.
const sortableThStyle = { ...thStyle, padding: 0 };

const sortButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--sh-space-1)',
  width: '100%',
  minHeight: '44px',
  padding: '0 var(--sh-space-3)',
  background: 'none',
  border: 'none',
  font: 'inherit',
  fontSize: 'inherit',
  letterSpacing: 'inherit',
  textTransform: 'inherit',
  fontWeight: 'inherit',
  color: 'inherit',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};

// The shared chevron rotated, rather than a new glyph: §7 is SVG icons only and
// the registry already carries this path. Direction is decoration; aria-sort on
// the th carries the meaning.
const caretBase = {
  display: 'inline-flex',
  alignItems: 'center',
  color: 'var(--sh-bronze)',
  flexShrink: 0,
};
const caretUpStyle = { ...caretBase, transform: 'rotate(-90deg)' };
const caretDownStyle = { ...caretBase, transform: 'rotate(90deg)' };

function cellStyle(isLast) {
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

function leadCellStyle(isLast, nowrap = false) {
  return {
    fontFamily: 'var(--sh-font-serif)',
    fontSize: 'var(--sh-text-base)',
    color: 'var(--sh-text-primary)',
    padding: 'var(--sh-space-3) var(--sh-space-3)',
    borderBottom: isLast ? 'none' : 'var(--sh-border-thin)',
    verticalAlign: 'top',
    ...(nowrap ? { whiteSpace: 'nowrap' } : {}),
  };
}
