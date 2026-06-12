import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../../components/Card.jsx';
import unified from '../../../data/unified/index.js';
import { SOURCE_ACCENT, resolveSourceAccent } from './sourceAccents.js';

// Module-level population — 7 practices: 1 advisor source (Walker
// Philanthropic Advisory) plus 6 synthetic. Lead-advisor resolution is
// stable at module load — there is no expected unresolvable lead, so a
// dash in that column would be a data-layer signal worth flagging.
const ALL = unified.advisorPractices;

// Pre-resolve lead names once. Used both for the table cell render and to
// extend the name search across "practice name OR lead-advisor name".
const LEAD_NAME_BY_PRACTICE = (() => {
  const map = {};
  for (const p of ALL) {
    const lead = p.leadPersonId ? unified.byId('persons', p.leadPersonId) : null;
    map[p.id] = lead ? lead.name : null;
  }
  return map;
})();

const SOURCE_FILTERS = [
  { key: 'advisor',   label: 'Advisor' },
  { key: 'synthetic', label: 'Synthetic' },
];
const SOURCE_KEYS = SOURCE_FILTERS.map((f) => f.key);

const GRID_COLUMNS = 'minmax(180px, 1.6fr) 1.5fr 1.2fr 0.6fr 0.6fr 0.6fr 110px';

// URL is the source of truth for filter state (slice 5). See IndividualsDirectory
// for the schema rationale — identical scheme: q (debounced), source, ids (override).
const Q_DEBOUNCE_MS = 250;

function parseSetParam(raw, validKeys, allOnDefault) {
  if (raw === null) return new Set(allOnDefault ? validKeys : []);
  const requested = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return new Set(requested.filter((k) => validKeys.includes(k)));
}

export default function AdvisorPracticesDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();

  const idsRaw = searchParams.get('ids');
  const overrideIds = idsRaw === null
    ? null
    : idsRaw.split(',').map((s) => s.trim()).filter(Boolean);
  const inOverrideMode = overrideIds !== null;

  const qFromUrl = searchParams.get('q') ?? '';
  const activeSources = useMemo(
    () => parseSetParam(searchParams.get('source'), SOURCE_KEYS, true),
    [searchParams],
  );

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
    setSearchParams({});
  }

  const filtered = useMemo(() => {
    if (inOverrideMode) {
      const set = new Set(overrideIds);
      return ALL.filter((p) => set.has(p.id));
    }
    const q = qFromUrl.trim().toLowerCase();
    return ALL.filter((p) => {
      if (!activeSources.has(p.sourceSurface)) return false;
      if (q) {
        const leadName = LEAD_NAME_BY_PRACTICE[p.id] || '';
        const hay = (p.name + ' ' + leadName).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [inOverrideMode, overrideIds, qFromUrl, activeSources]);

  const breakdown = useMemo(() => {
    const b = { advisor: 0, synthetic: 0 };
    for (const p of ALL) {
      if (b[p.sourceSurface] !== undefined) b[p.sourceSurface] += 1;
    }
    return b;
  }, []);

  const allOn = !inOverrideMode
    && activeSources.size === SOURCE_KEYS.length
    && qFromUrl.trim() === '';

  const totalLabel = ALL.length === 1 ? 'advisor practice' : 'advisor practices';
  const filteredLabel = filtered.length === 1 ? 'advisor practice' : 'advisor practices';
  const advLabel = breakdown.advisor === 1 ? 'active partner' : 'active partners';

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
        Advisor Practices
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        Every advisor practice on the platform. Search by practice or lead-advisor name; filter by source.
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
              placeholder="Search by practice or lead-advisor name"
              aria-label="Search advisor practices by practice or lead-advisor name"
              style={{
                flex: '1 1 280px',
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
            <span>Showing {filtered.length} selected</span>
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
            {allOn
              ? `${ALL.length} ${totalLabel} · ${breakdown.advisor} ${advLabel} · ${breakdown.synthetic} synthetic`
              : `${filtered.length} ${filteredLabel}`}
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
            No advisor practices match this filter.
          </p>
        ) : (
          <div role="table" aria-label="Advisor practices">
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
              <div role="columnheader">Practice name</div>
              <div role="columnheader">Focus</div>
              <div role="columnheader">Lead advisor</div>
              <div role="columnheader">Co-advisors</div>
              <div role="columnheader">Clients</div>
              <div role="columnheader">Cohorts</div>
              <div role="columnheader">Source</div>
            </div>
            {filtered.map((p, idx) => {
              const accent = resolveSourceAccent(p.sourceSurface);
              const leadName = LEAD_NAME_BY_PRACTICE[p.id];
              const leadDisplay = leadName || '—';
              const leadIsDash = !leadName;
              const coCount = (p.coAdvisorPersonIds || []).length;
              const clientCount = (p.clientPersonIds || []).length;
              const cohortCount = (p.cohortIds || []).length;
              return (
                <div
                  role="row"
                  key={p.id}
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
                  <div role="cell" style={{ color: 'var(--sh-text-primary)' }}>{p.name}</div>
                  <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{p.focus}</div>
                  <div role="cell" style={{ color: leadIsDash ? 'var(--sh-text-muted)' : 'var(--sh-text-secondary)' }}>
                    {leadDisplay}
                  </div>
                  <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{coCount}</div>
                  <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{clientCount}</div>
                  <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{cohortCount}</div>
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
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </main>
  );
}
