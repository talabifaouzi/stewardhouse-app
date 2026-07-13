import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Card } from '../../../components/Card.jsx';
import unified from '../../../data/unified/index.js';
import { SOURCE_ACCENT, resolveSourceAccent } from './sourceAccents.js';
import { useBasePath } from '../../../contexts/AppIdentityContext.jsx';

const NAME_LINK_STYLE = {
  color: 'var(--sh-text-primary)',
  textDecoration: 'none',
  borderBottom: '1px dotted var(--sh-bronze)',
};

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
const SOURCE_KEYS = SOURCE_FILTERS.map((f) => f.key);

const GRID_COLUMNS = 'minmax(160px, 1.4fr) 110px 1.1fr 1fr 1.2fr';

// URL is the source of truth for filter state (slice 5):
//   ?q=text                    initial search-input value (debounced URL writes)
//   ?source=advisor,enterprise comma-separated subset of SOURCE_KEYS; absent = all ON
//   ?ids=p-foo,p-bar           OVERRIDE MODE — controls unmount, render only those rows
// Unknown values are silently dropped (shareable URLs shouldn't shout at typos).
// Composition in normal mode is AND across q + active sources (unchanged).
const Q_DEBOUNCE_MS = 250;

function parseSetParam(raw, validKeys, allOnDefault) {
  if (raw === null) return new Set(allOnDefault ? validKeys : []);
  const requested = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return new Set(requested.filter((k) => validKeys.includes(k)));
}

export default function IndividualsDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = useBasePath('/operations', '/app/operations');
  const [hoveredId, setHoveredId] = useState(null);

  // Slice 6 — row click navigates to the detail page, preserving the
  // current filter URL (?source=…&q=… or ?ids=…) so the detail's BackLink
  // returns to the exact filtered/override view. The anchor-target guard
  // lets the inner name <Link> handle its own click without double-navigation.
  function onRowClick(e, personId) {
    if (e.target.closest('a')) return;
    navigate(`${basePath}/individuals/${personId}`, {
      state: { fromQuery: location.search },
    });
  }

  // ids takes priority: when present, override mode replaces all other params.
  const idsRaw = searchParams.get('ids');
  const overrideIds = idsRaw === null
    ? null
    : idsRaw.split(',').map((s) => s.trim()).filter(Boolean);
  const inOverrideMode = overrideIds !== null;

  // Normal-mode derived state.
  const qFromUrl = searchParams.get('q') ?? '';
  const activeSources = useMemo(
    () => parseSetParam(searchParams.get('source'), SOURCE_KEYS, true),
    [searchParams],
  );

  // Local input shadows the URL q so typing stays responsive while we debounce
  // the URL writes. URL changes (back/forward, direct paste) sync down.
  const [qInput, setQInput] = useState(qFromUrl);
  useEffect(() => { setQInput(qFromUrl); }, [qFromUrl]);

  const debounceRef = useRef(null);
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function writeParam(name, value, isDefault) {
    setSearchParams((prev) => {
      const np = new URLSearchParams(prev);
      if (isDefault) np.delete(name);
      else np.set(name, value);
      return np;
    }, { replace: true });
  }

  function onQueryChange(next) {
    setQInput(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      writeParam('q', next, next === '');
    }, Q_DEBOUNCE_MS);
  }

  function toggleSource(key) {
    const next = new Set(activeSources);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    const isDefault = next.size === SOURCE_KEYS.length;
    writeParam('source', [...next].join(','), isDefault);
  }

  function clearOverride() {
    setSearchParams({}); // push history so back-button restores the override
  }

  // Filtering — override OR normal.
  const filtered = useMemo(() => {
    if (inOverrideMode) {
      const set = new Set(overrideIds);
      return ALL.filter((p) => set.has(p.id));
    }
    const q = qFromUrl.trim().toLowerCase();
    return ALL.filter((p) => {
      if (!activeSources.has(p.sourceSurface)) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [inOverrideMode, overrideIds, qFromUrl, activeSources]);

  const sourceCount = useMemo(() => {
    const s = new Set();
    for (const p of filtered) s.add(p.sourceSurface);
    return s.size;
  }, [filtered]);

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
        {!inOverrideMode && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 'var(--sh-space-4)',
            marginBottom: 'var(--sh-space-5)',
          }}>
            <input
              type="text"
              value={qInput}
              onChange={(e) => onQueryChange(e.target.value)}
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
              {SOURCE_FILTERS.map((f) => {
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
        )}

        {inOverrideMode ? (
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            marginBottom: 'var(--sh-space-5)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sh-space-3)',
            flexWrap: 'wrap',
          }}>
            <span>
              Showing {filtered.length} selected
            </span>
            <button
              type="button"
              onClick={clearOverride}
              style={{
                fontSize: 'var(--sh-text-xs)',
                fontWeight: 500,
                padding: 'var(--sh-space-1) var(--sh-space-3)',
                borderRadius: 'var(--sh-radius-full)',
                border: '1px solid var(--sh-bronze-deep)',
                background: 'var(--sh-bronze-tint)',
                color: 'var(--sh-bronze-deep)',
                cursor: 'pointer',
                transition: 'background 150ms ease, color 150ms ease',
              }}
            >
              Clear filter
            </button>
          </p>
        ) : (
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            marginBottom: 'var(--sh-space-5)',
          }}>
            {filtered.length} {filtered.length === 1 ? 'individual' : 'individuals'} across {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
          </p>
        )}

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
                  onClick={(e) => onRowClick(e, p.id)}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: GRID_COLUMNS,
                    gap: 'var(--sh-space-4)',
                    padding: 'var(--sh-space-3)',
                    borderBottom: i === filtered.length - 1 ? 'none' : 'var(--sh-border-divider)',
                    fontSize: 'var(--sh-text-sm)',
                    color: 'var(--sh-text-body)',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: hoveredId === p.id ? 'var(--sh-bronze-tint)' : undefined,
                    transition: 'background 150ms ease',
                  }}
                >
                  <div role="cell">
                    <Link
                      to={`${basePath}/individuals/${p.id}`}
                      state={{ fromQuery: location.search }}
                      style={NAME_LINK_STYLE}
                    >
                      {p.name}
                    </Link>
                  </div>
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
