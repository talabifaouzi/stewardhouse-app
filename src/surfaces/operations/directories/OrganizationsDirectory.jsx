import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../../components/Card.jsx';
import unified from '../../../data/unified/index.js';
import { CAUSES } from '../../../data/intakeData.js';

// Organizations are REFERENCED entities, not platform users — the unclaimed
// tier of the content-sourcing model. They show up as discovery-catalog
// entries, gift targets, and connection destinations across the four user
// surfaces. This directory is the operator view of those records.
//
// Population — 17 organizations, all sourced from the individual surface
// (Marcus Thompson's discovery catalog). Because every record carries
// sourceSurface='individual', a Source column / source-chip row would be
// redundant noise — this directory drops both. If a future adapter contributes
// orgs from another surface, restore them in lockstep with that change.
//
// Known fixture gaps, flagged not fixed:
//  - org.ein is null for every record (Candid integration is future scope)
//  - org.isExcludedByInstitutionIds is empty across all 17 (institution
//    exclusion wiring is not yet populated); the founder-deferred "Excluded
//    by" column returns when that wiring lands.
const ALL = unified.orgs;

// org.causes[] holds CAUSES taxonomy IDs; resolve to display labels once.
const CAUSE_LABEL_BY_ID = (() => {
  const m = {};
  for (const c of CAUSES) m[c.id] = c.label;
  return m;
})();

const CATEGORY_FILTERS = [
  { key: 'community',   label: 'Community'   },
  { key: 'established', label: 'Established' },
  { key: 'emerging',    label: 'Emerging'    },
];
const CAT_KEYS = CATEGORY_FILTERS.map((f) => f.key);

// Distinct causes present across the 17 records — not the full taxonomy —
// so the chip row stays honest about what's filterable today. Sorted by
// display label for predictable chip order.
const DISTINCT_CAUSE_IDS = (() => {
  const s = new Set();
  for (const o of ALL) for (const c of (o.causes || [])) s.add(c);
  return [...s].sort((a, b) =>
    (CAUSE_LABEL_BY_ID[a] || a).localeCompare(CAUSE_LABEL_BY_ID[b] || b)
  );
})();

const GRID_COLUMNS = 'minmax(160px, 1.4fr) 0.7fr 1fr 1.3fr 1.5fr';
const CAUSE_PREVIEW = 3;   // first N cause labels shown inline; rest fold into "+N"
const MISSION_MAX = 120;

// URL is the source of truth for filter state (slice 5):
//   ?q=text                    initial search-input value (debounced URL writes)
//   ?cat=community,established subset of CAT_KEYS; absent = all ON (current default)
//   ?causes=education,sports   cause IDs; absent = all OFF (current default — note
//                              the asymmetry vs. cat, mirrors the in-page UX)
//   ?ids=org-1,org-2           OVERRIDE MODE — controls unmount, render only those
// Unknown values are silently dropped.
const Q_DEBOUNCE_MS = 250;

function parseSetParam(raw, validKeys, allOnDefault) {
  if (raw === null) return new Set(allOnDefault ? validKeys : []);
  const requested = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return new Set(requested.filter((k) => validKeys.includes(k)));
}

function truncate(str, n) {
  if (!str) return '';
  if (str.length <= n) return str;
  return str.slice(0, n).trimEnd() + '…';
}

export default function OrganizationsDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();

  const idsRaw = searchParams.get('ids');
  const overrideIds = idsRaw === null
    ? null
    : idsRaw.split(',').map((s) => s.trim()).filter(Boolean);
  const inOverrideMode = overrideIds !== null;

  const qFromUrl = searchParams.get('q') ?? '';
  const activeCats = useMemo(
    () => parseSetParam(searchParams.get('cat'), CAT_KEYS, true),
    [searchParams],
  );
  const activeCauses = useMemo(
    () => parseSetParam(searchParams.get('causes'), DISTINCT_CAUSE_IDS, false),
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

  function toggleCat(key) {
    const next = new Set(activeCats);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    const isDefault = next.size === CAT_KEYS.length; // all-ON = default
    writeParam('cat', [...next].join(','), isDefault);
  }

  function toggleCause(key) {
    const next = new Set(activeCauses);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    const isDefault = next.size === 0; // all-OFF = default (mirrors in-page UX)
    writeParam('causes', [...next].join(','), isDefault);
  }

  function clearOverride() {
    setSearchParams({});
  }

  const filtered = useMemo(() => {
    if (inOverrideMode) {
      const set = new Set(overrideIds);
      return ALL.filter((o) => set.has(o.id));
    }
    const q = qFromUrl.trim().toLowerCase();
    return ALL.filter((o) => {
      if (!activeCats.has(o.cat)) return false;
      if (q && !o.name.toLowerCase().includes(q)) return false;
      if (activeCauses.size > 0) {
        const orgCauses = o.causes || [];
        const anyMatch = orgCauses.some((c) => activeCauses.has(c));
        if (!anyMatch) return false;
      }
      return true;
    });
  }, [inOverrideMode, overrideIds, qFromUrl, activeCats, activeCauses]);

  // Distinct category count across the full corpus — drives the
  // unfiltered count-header phrasing.
  const distinctCatCount = useMemo(() => {
    const s = new Set();
    for (const o of ALL) s.add(o.cat);
    return s.size;
  }, []);

  const allOn = !inOverrideMode
    && activeCats.size === CAT_KEYS.length
    && activeCauses.size === 0
    && qFromUrl.trim() === '';

  const totalLabel    = ALL.length === 1 ? 'organization' : 'organizations';
  const filteredLabel = filtered.length === 1 ? 'organization' : 'organizations';
  const catLabel      = distinctCatCount === 1 ? 'category' : 'categories';

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
        Organizations
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        Organization records referenced across the platform — discovery catalog entries, gift targets, and connection destinations. Organizations are not platform users.
      </p>

      <Card>
        {!inOverrideMode && (
          <>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 'var(--sh-space-4)',
              marginBottom: 'var(--sh-space-4)',
            }}>
              <input
                type="text"
                value={qInput}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search by name"
                aria-label="Search organizations by name"
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
              <div role="group" aria-label="Filter by category" style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--sh-space-2)',
              }}>
                {CATEGORY_FILTERS.map((f) => {
                  const on = activeCats.has(f.key);
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => toggleCat(f.key)}
                      aria-pressed={on}
                      style={{
                        fontSize: 'var(--sh-text-xs)',
                        fontWeight: 500,
                        padding: 'var(--sh-space-1) var(--sh-space-3)',
                        borderRadius: 'var(--sh-radius-full)',
                        border: on ? '1px solid var(--sh-bronze-deep)' : 'var(--sh-border-default)',
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

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 'var(--sh-space-3)',
              marginBottom: 'var(--sh-space-5)',
            }}>
              <span style={{
                fontSize: 'var(--sh-text-xs)',
                fontWeight: 500,
                color: 'var(--sh-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Causes
              </span>
              <div role="group" aria-label="Filter by cause" style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--sh-space-2)',
              }}>
                {DISTINCT_CAUSE_IDS.map((id) => {
                  const on = activeCauses.has(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleCause(id)}
                      aria-pressed={on}
                      style={{
                        fontSize: 'var(--sh-text-xs)',
                        fontWeight: 500,
                        padding: 'var(--sh-space-1) var(--sh-space-3)',
                        borderRadius: 'var(--sh-radius-full)',
                        border: on ? '1px solid var(--sh-bronze-deep)' : 'var(--sh-border-default)',
                        background: on ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
                        color: on ? 'var(--sh-bronze-deep)' : 'var(--sh-text-secondary)',
                        cursor: 'pointer',
                        transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
                      }}
                    >
                      {CAUSE_LABEL_BY_ID[id] || id}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
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
              ? `${ALL.length} ${totalLabel} across ${distinctCatCount} ${catLabel}`
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
            No organizations match this filter.
          </p>
        ) : (
          <div role="table" aria-label="Organizations">
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
              <div role="columnheader">Category</div>
              <div role="columnheader">Geography</div>
              <div role="columnheader">Causes</div>
              <div role="columnheader">Mission</div>
            </div>
            {filtered.map((o, idx) => {
              const causeIds = o.causes || [];
              const shown = causeIds.slice(0, CAUSE_PREVIEW);
              const overflow = causeIds.length - shown.length;
              const shownLabels = shown.map((c) => CAUSE_LABEL_BY_ID[c] || c);
              const causeText = overflow > 0
                ? `${shownLabels.join(', ')} +${overflow}`
                : shownLabels.join(', ');
              return (
                <div
                  role="row"
                  key={o.id}
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
                  <div role="cell" style={{ color: 'var(--sh-text-primary)' }}>{o.name}</div>
                  <div role="cell" style={{
                    color: 'var(--sh-text-secondary)',
                    textTransform: 'capitalize',
                  }}>
                    {o.cat}
                  </div>
                  <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{o.geo}</div>
                  <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{causeText}</div>
                  <div role="cell" style={{
                    color: 'var(--sh-text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {truncate(o.mission, MISSION_MAX)}
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
