import { useState } from 'react';

// ENT #43 — shared DataTable primitive. Replaces three near-identical table
// blocks (EnterpriseRoster + ProgramOutputs + CohortComparison) whose
// `tableWrapperStyle` / `tableStyle` / `thStyle` / `tdStyle(isLast)` consts
// were verbatim duplicates.
//
// Column shape: { key, label, render: row => ReactNode, lead?, nowrap? }
//   - lead: true   → first-column serif treatment (was tdOrgStyle / tdSportStyle)
//   - nowrap       → for lead columns only, defaults false (wrappable for long
//                    org names — ProgramOutputs); pass nowrap:true to opt in
//                    (CohortComparison's Sport column). Non-lead cells always
//                    nowrap (matches all three pre-refactor behaviors).
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
}) {
  const [hoveredRowKey, setHoveredRowKey] = useState(null);
  const interactive = typeof onRowClick === 'function';

  return (
    <div style={tableWrapperStyle}>
      <table style={{ ...tableStyle, minWidth }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={thStyle}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const isLast = i === data.length - 1;
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
