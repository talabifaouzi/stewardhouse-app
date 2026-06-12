import { useMemo, useState } from 'react';
import { Card } from '../../../components/Card.jsx';
import unified from '../../../data/unified/index.js';
import { SOURCE_ACCENT, resolveSourceAccent } from './sourceAccents.js';

// Module-level population — all institutions on the platform. Phase 1
// totals: 4 records, 1 enterprise (Cooper State University) and 3 synthetic.
// Sector is "Athletics" across the board today; the Sector column is in
// place to accommodate multi-sector Phase 2 without a UI change.
const ALL = unified.institutions;

const SOURCE_FILTERS = [
  { key: 'enterprise', label: 'Enterprise' },
  { key: 'synthetic',  label: 'Synthetic' },
];

const GRID_COLUMNS = 'minmax(180px, 1.6fr) 0.9fr 1.2fr 0.9fr 110px 1.4fr 0.5fr';

export default function InstitutionsDirectory() {
  const [query, setQuery] = useState('');
  const [activeSources, setActiveSources] = useState(
    () => new Set(SOURCE_FILTERS.map(f => f.key))
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL.filter(i => {
      if (!activeSources.has(i.sourceSurface)) return false;
      if (q && !i.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, activeSources]);

  // Unfiltered breakdown for the default header — derived live from data.
  const breakdown = useMemo(() => {
    const b = { enterprise: 0, synthetic: 0 };
    for (const i of ALL) {
      if (b[i.sourceSurface] !== undefined) b[i.sourceSurface] += 1;
    }
    return b;
  }, []);

  const allOn = activeSources.size === SOURCE_FILTERS.length && query.trim() === '';

  function toggleSource(key) {
    setActiveSources(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const totalLabel = ALL.length === 1 ? 'institution' : 'institutions';
  const filteredLabel = filtered.length === 1 ? 'institution' : 'institutions';
  const entLabel = breakdown.enterprise === 1 ? 'active customer' : 'active customers';
  const synLabel = breakdown.synthetic === 1 ? 'synthetic' : 'synthetic';

  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <h1 style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        marginBottom: 'var(--sh-space-2)',
      }}>
        Institutions
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        Every institution on the platform. Search by name; filter by source.
      </p>

      <Card>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--sh-space-4)',
          marginBottom: 'var(--sh-space-5)',
        }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name"
            aria-label="Search institutions by name"
            style={{
              flex: '1 1 240px',
              minWidth: 0,
              padding: 'var(--sh-space-2) var(--sh-space-3)',
              fontSize: 'var(--sh-text-sm)',
              border: 'var(--sh-border-default)',
              borderRadius: 'var(--sh-radius-md)',
              background: 'var(--sh-card)',
              color: 'var(--sh-text-body)',
            }}
          />
          <div role="group" aria-label="Filter by source" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--sh-space-2)',
          }}>
            {SOURCE_FILTERS.map(f => {
              const on = activeSources.has(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleSource(f.key)}
                  aria-pressed={on}
                  style={{
                    fontSize: 'var(--sh-text-xs)',
                    fontWeight: 500,
                    padding: 'var(--sh-space-1) var(--sh-space-3)',
                    borderRadius: 'var(--sh-radius-full)',
                    border: on ? `1px solid ${SOURCE_ACCENT[f.key]}` : 'var(--sh-border-default)',
                    background: on ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
                    color: on ? 'var(--sh-bronze-deep)' : 'var(--sh-text-secondary)',
                    cursor: 'pointer',
                    transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-secondary)',
          marginBottom: 'var(--sh-space-5)',
        }}>
          {allOn
            ? `${ALL.length} ${totalLabel} · ${breakdown.enterprise} ${entLabel} · ${breakdown.synthetic} ${synLabel}`
            : `${filtered.length} ${filteredLabel}`}
        </p>

        {filtered.length === 0 ? (
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: 'var(--sh-space-8)',
          }}>
            No institutions match this filter.
          </p>
        ) : (
          <div role="table" aria-label="Institutions">
            <div role="row" style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLUMNS,
              gap: 'var(--sh-space-4)',
              padding: 'var(--sh-space-3)',
              borderBottom: 'var(--sh-border-default)',
              fontSize: 'var(--sh-text-xs)',
              fontWeight: 500,
              color: 'var(--sh-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              <div role="columnheader">Name</div>
              <div role="columnheader">Sector</div>
              <div role="columnheader">Contract tier</div>
              <div role="columnheader">Annual</div>
              <div role="columnheader">Source</div>
              <div role="columnheader">Partner practice</div>
              <div role="columnheader">Staff</div>
            </div>
            {filtered.map((i, idx) => {
              const accent = resolveSourceAccent(i.sourceSurface);
              const partner = i.partnerAdvisorPracticeId
                ? unified.byId('advisorPractices', i.partnerAdvisorPracticeId)
                : null;
              const partnerName = partner ? partner.name : '—';
              const isDash = partnerName === '—';
              const staffCount = (i.staffPersonIds || []).length;
              return (
                <div
                  role="row"
                  key={i.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: GRID_COLUMNS,
                    gap: 'var(--sh-space-4)',
                    padding: 'var(--sh-space-3)',
                    borderBottom: idx === filtered.length - 1 ? 'none' : 'var(--sh-border-divider)',
                    fontSize: 'var(--sh-text-sm)',
                    color: 'var(--sh-text-body)',
                    alignItems: 'center',
                  }}
                >
                  <div role="cell" style={{ color: 'var(--sh-text-primary)' }}>{i.name}</div>
                  <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{i.sector}</div>
                  <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{i.contract?.tier ?? '—'}</div>
                  <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{i.contract?.annual ?? '—'}</div>
                  <div role="cell">
                    <span style={{
                      display: 'inline-block',
                      fontSize: 'var(--sh-text-xs)',
                      fontWeight: 500,
                      padding: 'var(--sh-space-1) var(--sh-space-2)',
                      borderRadius: 'var(--sh-radius-full)',
                      border: `1px solid ${accent}`,
                      color: accent,
                      textTransform: 'capitalize',
                      lineHeight: 'var(--sh-line-tight)',
                    }}>
                      {i.sourceSurface}
                    </span>
                  </div>
                  <div role="cell" style={{ color: isDash ? 'var(--sh-text-muted)' : 'var(--sh-text-secondary)' }}>
                    {partnerName}
                  </div>
                  <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{staffCount}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </main>
  );
}
