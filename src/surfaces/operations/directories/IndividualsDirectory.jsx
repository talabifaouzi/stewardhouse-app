import { useMemo, useState } from 'react';
import { Card } from '../../../components/Card.jsx';
import unified from '../../../data/unified/index.js';
import { SOURCE_ACCENT, resolveSourceAccent } from './sourceAccents.js';

// Module-level population — 77 individuals across all four sources
// (individual 1, advisor 9, enterprise 16, synthetic 51). Same-person dedup
// is deferred: a person active on more than one surface appears once per
// source (see the dedup footnote at the foot of the directory).
const ALL = unified.personsBy({ type: 'individual' });

const CONTEXT_LABEL = {
  individual: 'Individual funder',
  advisor:    'Advisor client',
  enterprise: 'Enterprise athlete',
  synthetic:  'Synthetic',
};

const SOURCE_FILTERS = [
  { key: 'individual', label: 'Individual' },
  { key: 'advisor',    label: 'Advisor' },
  { key: 'enterprise', label: 'Enterprise' },
  { key: 'synthetic',  label: 'Synthetic' },
];

const GRID_COLUMNS = 'minmax(160px, 1.4fr) 110px 1.1fr 1fr 1.2fr';

export default function IndividualsDirectory() {
  const [query, setQuery] = useState('');
  const [activeSources, setActiveSources] = useState(
    () => new Set(SOURCE_FILTERS.map(f => f.key))
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL.filter(p => {
      if (!activeSources.has(p.sourceSurface)) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, activeSources]);

  const sourceCount = useMemo(() => {
    const s = new Set();
    for (const p of filtered) s.add(p.sourceSurface);
    return s.size;
  }, [filtered]);

  function toggleSource(key) {
    setActiveSources(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

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
        Individuals
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        Every individual on the platform across all four sources. Search by name; filter by source.
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
            aria-label="Search individuals by name"
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
          {filtered.length} {filtered.length === 1 ? 'individual' : 'individuals'} across {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
        </p>

        {filtered.length === 0 ? (
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: 'var(--sh-space-8)',
          }}>
            No individuals match this filter.
          </p>
        ) : (
          <div role="table" aria-label="Individuals">
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
              <div role="columnheader">Source</div>
              <div role="columnheader">Context</div>
              <div role="columnheader">Sport</div>
              <div role="columnheader">ID</div>
            </div>
            {filtered.map((p, i) => {
              const ext = (p.extensions && p.extensions[p.sourceSurface]) || {};
              const sport = ext.sport || '—';
              const accent = resolveSourceAccent(p.sourceSurface);
              const isDash = sport === '—';
              return (
                <div
                  role="row"
                  key={p.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: GRID_COLUMNS,
                    gap: 'var(--sh-space-4)',
                    padding: 'var(--sh-space-3)',
                    borderBottom: i === filtered.length - 1 ? 'none' : 'var(--sh-border-divider)',
                    fontSize: 'var(--sh-text-sm)',
                    color: 'var(--sh-text-body)',
                    alignItems: 'center',
                  }}
                >
                  <div role="cell" style={{ color: 'var(--sh-text-primary)' }}>{p.name}</div>
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
                      {p.sourceSurface}
                    </span>
                  </div>
                  <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>
                    {CONTEXT_LABEL[p.sourceSurface]}
                  </div>
                  <div role="cell" style={{ color: isDash ? 'var(--sh-text-muted)' : 'var(--sh-text-secondary)' }}>
                    {sport}
                  </div>
                  <div role="cell" style={{
                    fontSize: 'var(--sh-text-xs)',
                    color: 'var(--sh-text-muted)',
                    fontFamily: 'monospace',
                  }}>
                    {p.id}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          fontStyle: 'italic',
          marginTop: 'var(--sh-space-5)',
          marginBottom: 0,
        }}>
          A person active on more than one surface appears here once per source; combining those records into a single profile is planned.
        </p>
      </Card>
    </main>
  );
}
