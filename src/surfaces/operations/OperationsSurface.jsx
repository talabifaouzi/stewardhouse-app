import { useId, useState } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Chrome from '../../components/Chrome.jsx';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import unified from '../../data/unified/index.js';
import IndividualsDirectory from './directories/IndividualsDirectory.jsx';
import InstitutionsDirectory from './directories/InstitutionsDirectory.jsx';
import AdvisorPracticesDirectory from './directories/AdvisorPracticesDirectory.jsx';
import OrganizationsDirectory from './directories/OrganizationsDirectory.jsx';
import InstitutionDetail from './directories/InstitutionDetail.jsx';

// Operations Overview stat values — computed once at module load from the
// unified data layer. unified import is eager: it runs the three adapters +
// synthetic seed + assemble at first reference. No useMemo needed; these
// are pure const integers / plain objects, not state.
//
// QA-052 — Eager-eval pattern: simply importing this surface (or any module
// that transitively pulls `src/data/unified/index.js`) executes the entire
// data pipeline — three adapters + the synthetic seed + assemble + five
// runChecks suites. Module-level helpers below (`pilotMetrics`,
// `connectionFunnel`, `openIssues`, `recentActivity`, `platformHealth`) run
// once at first reference. Cost is one-time but real; bear it in mind when
// importing this module from a test, a story, or another surface.
const INDIVIDUAL_COUNT  = unified.personsBy({ type: 'individual' }).length;
const INSTITUTION_COUNT = unified.countBy('institutions');
const PRACTICE_COUNT    = unified.countBy('advisorPractices');

// Relationship-progression pillar (Slice B / fix bundle 2): aggregate-only,
// derived from the ConnectionRequest entity. Demonstrative — drawn from the
// synthetic seed, not live traction.
const FUNNEL  = unified.connectionFunnel();
const METRICS = unified.pilotMetrics();

// Ordered stages for the relationship-progression rendering. Descriptive
// labels — no scoring, no ranking. Each later stage is a subset of all
// earlier stages.
//
// Naming note (bundle 4): this surface-side constant was renamed
// FUNNEL_STAGES → PROGRESSION_STAGES to match the bundle-2 copy reframe
// (QA-001). The data layer's own `FUNNEL_STAGES` in src/data/unified/
// index.js is intentionally left untouched — it's an internal projection
// helper whose keys are the wire format `connectionFunnel()` returns; the
// rename asymmetry is intentional and not a missed-site.
const PROGRESSION_STAGES = [
  { key: 'matched',    label: 'Matched' },
  { key: 'viewed',     label: 'Viewed' },
  { key: 'connected',  label: 'Connected' },
  { key: 'conversing', label: 'Conversing' },
  { key: 'gave',       label: 'Gave' },
  { key: 'ongoing',    label: 'Ongoing' },
];

// Open issues — tile + card data (Slice D). Module-level captures match the
// FUNNEL / METRICS pattern; openIssues() already returns the records sorted
// by openedAt descending (Slice C helper contract).
const OPEN_ISSUE_COUNT = unified.openIssueCount();
const OPEN_ISSUES      = unified.openIssues();

// Maps Issue.relatedEntityType to the unified-store array name, for the
// per-row relatedEntity name lookup in the IssueRow expand.
const ENTITY_FOR_TYPE = {
  person: 'persons',
  org: 'orgs',
  advisorPractice: 'advisorPractices',
  institution: 'institutions',
};

// Card-level curation for the Recent Activity card (Slice F + QA-053).
// Excludes issue-opened events so this card doesn't duplicate the Open-issues
// card next to it; filters BEFORE slicing so the display count is
// post-exclusion. QA-007 bound lives inside: each ConnectionRequest can emit
// ≤6 stage transitions (matched..ongoing), each Issue ≤2 events (opened /
// resolved); the product is a permissive ceiling that grows with the data.
function curateForRecentActivityCard(store, displayLimit) {
  const rawBound = store.connectionRequests.length * 6 + store.issues.length * 2;
  return store.recentActivity({ limit: rawBound })
    .filter((i) => i.sourceEventType !== 'issue-opened')
    .slice(0, displayLimit);
}

const RECENT_ACTIVITY_LIMIT = 6;
const RECENT_ACTIVITY = curateForRecentActivityCard(unified, RECENT_ACTIVITY_LIMIT);

// Platform health pillar (Slice H). LIVE system-status — sits ABOVE the
// demonstrative caveat so the caveat's "below" framing stays literally
// accurate. The pillar is read-only (no interactivity this slice).
const HEALTH = unified.platformHealth();

// Surface accent colors — promoted from inside the old passive ActivityRow.
// Keys match ActivityItem.surface emissions from Slice E ('Advisor' not
// 'Philanthropic Advisor'); Operations is the platform's primary bronze
// (reads as platform/internal for org and platform-level events).
const SURFACE_COLORS = {
  Individual: 'var(--sh-individual-accent)',
  Advisor: 'var(--sh-advisor-accent)',
  Enterprise: 'var(--sh-enterprise-accent)',
  Operations: 'var(--sh-bronze)',
};

const SURFACE_COLORS_FALLBACK = 'var(--sh-text-muted)';

// QA-048 — Resolver with explicit dev-time signal when an
// ActivityItem.surface value has no accent in the map. Production behavior
// matches the previous silent `|| 'var(--sh-text-muted)'` fallback exactly
// (same return value, no console output). The dev warn makes a future
// projection-vs-map drift loud instead of silent.
function resolveSurfaceColor(surface) {
  const hit = SURFACE_COLORS[surface];
  if (hit !== undefined) return hit;
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[OperationsSurface] No accent for ActivityItem.surface "${surface}" — falling back to muted.`);
  }
  return SURFACE_COLORS_FALLBACK;
}

// Short-form month names for the absolute-date format used by formatTimeAgo
// (≥56 days) and the IssueRow/ActivityRow expand "Logged Mon DD, YYYY".
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatAbsDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTH_SHORT[m - 1]} ${d}, ${y}`;
}

const NAV_ITEMS = [
  { key: 'home', label: 'Overview', path: '/operations' },
  { key: 'individuals', label: 'Individuals', path: '/operations/individuals' },
  { key: 'institutions', label: 'Institutions', path: '/operations/institutions' },
  { key: 'advisors', label: 'Advisor Practices', path: '/operations/advisors' },
  { key: 'organizations', label: 'Organizations', path: '/operations/organizations' },
];

export default function OperationsSurface() {
  const location = useLocation();
  const path = location.pathname;
  const activeNav =
    path.includes('/individuals') ? 'individuals' :
    path.includes('/institutions') ? 'institutions' :
    path.includes('/advisors') ? 'advisors' :
    path.includes('/organizations') ? 'organizations' :
    'home';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--sh-bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Chrome
        surface="operations"
        userName="Faouzi Talabi"
        userRole="Founder"
        navItems={NAV_ITEMS}
        activeNav={activeNav}
      />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route index element={<OperationsHome />} />
          <Route path="individuals" element={<IndividualsDirectory />} />
          <Route path="institutions" element={<InstitutionsDirectory />} />
          <Route path="institutions/:id" element={<InstitutionDetail />} />
          <Route path="advisors" element={<AdvisorPracticesDirectory />} />
          <Route path="organizations" element={<OrganizationsDirectory />} />
          <Route path="*" element={<Navigate to="/operations" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function OperationsHome() {
  // Stable ids wired to each section's SectionLabel for aria-labelledby (QA-018).
  const compositionLabelId = useId();
  const recentActivityLabelId = useId();
  const openIssuesLabelId = useId();
  const navigate = useNavigate();
  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <div style={{ marginBottom: 'var(--sh-space-8)' }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--sh-space-2)',
        }}>
          Internal · StewardHouse staff
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-3xl)',
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-3)',
        }}>
          Operations
        </h1>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-secondary)',
          maxWidth: '720px',
          lineHeight: 1.6,
        }}>
          Monitor and support across the customer surfaces. View user activity, surface issues, and provide support.
          This view is internal-only and is never exposed to platform users.
        </p>
      </div>

      {/* Demonstrative-state caveat — Q1→Q3 IA: explicit exception of Platform
          health (which is LIVE and anchors the bottom). */}
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        marginBottom: 'var(--sh-space-5)',
        maxWidth: '720px',
      }}>
        Everything on this page except Platform health is demonstrative — drawn
        from the synthetic seed, not live platform traction.
      </p>

      {/* Q1 — attention-shaped content leads: Open issues (wide left, 2fr) +
          Recent activity (narrow right, 1fr). Collapses to a single column
          below ~720px via the .sh-ops-attention-row global rule (QA-037). */}
      <div className="sh-ops-attention-row" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: 'var(--sh-space-6)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        <Card tint accent="var(--sh-bronze)" as="section" aria-labelledby={openIssuesLabelId}>
          <SectionLabel id={openIssuesLabelId}>Open issues</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {OPEN_ISSUES.map((issue, i) => (
              <IssueRow key={issue.id} issue={issue} first={i === 0} />
            ))}
          </div>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            marginTop: 'var(--sh-space-4)',
            marginBottom: 0,
          }}>
            Per-issue detail view coming soon.
          </p>
        </Card>

        <Card as="section" aria-labelledby={recentActivityLabelId}>
          <SectionLabel id={recentActivityLabelId}>Recent activity</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {RECENT_ACTIVITY.map((item, i) => (
              <ActivityRowInteractive
                key={`${item.timestamp}-${item.sourceEventType}-${i}`}
                item={item}
                first={i === 0}
              />
            ))}
          </div>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            marginTop: 'var(--sh-space-4)',
            marginBottom: 0,
          }}>
            Per-activity detail view coming soon.
          </p>
        </Card>
      </div>

      {/* Q2 — Relationship progression pillar */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <RelationshipProgression funnel={FUNNEL} />
      </div>

      {/* Pilot headlines — four cards derived from pilotMetrics() */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--sh-space-4)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        <Stat
          label="Relationships continuing"
          value={METRICS.ongoingCount}
          sub="Post-gift, still engaged"
        />
        <Stat
          label="Orgs supported"
          value={METRICS.distinctOrgsAtGave}
          sub="Distinct nonprofits at gave or ongoing"
        />
        <Stat
          label="Total given via StewardHouse"
          value={`$${METRICS.totalDollarsAtGave.toLocaleString()}`}
          sub={`Across ${METRICS.gaveCount} gifts`}
        />
        <Stat
          label="Reached giving"
          value={FUNNEL.gave}
          sub={`of ${FUNNEL.matched} connections matched`}
        />
      </div>

      {/* Q3 — Platform composition (three derived counts plus the Open issues count). */}
      <section
        aria-labelledby={compositionLabelId}
        style={{ marginBottom: 'var(--sh-space-8)' }}
      >
        <SectionLabel id={compositionLabelId}>Platform composition</SectionLabel>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--sh-space-4)',
        }}>
          <Stat
            label="Individuals"
            value={INDIVIDUAL_COUNT}
            sub="On platform"
            onClick={() => navigate('/operations/individuals')}
          />
          <Stat
            label="Institutions"
            value={INSTITUTION_COUNT}
            sub="Active programs"
            onClick={() => navigate('/operations/institutions')}
          />
          <Stat
            label="Advisor Practices"
            value={PRACTICE_COUNT}
            sub="On platform"
            onClick={() => navigate('/operations/advisors')}
          />
          {/* Open issues stays non-interactive — its drill is the Open-issues
              card above; clicking the tile would duplicate that affordance. */}
          <Stat label="Open issues" value={OPEN_ISSUE_COUNT} sub="Currently open" />
        </div>
      </section>

      {/* Q3 — Platform health pillar (LIVE) anchors the bottom of the page. */}
      <div>
        <PlatformHealthCard health={HEALTH} />
      </div>
    </main>
  );
}

function RelationshipProgression({ funnel }) {
  // matched is always the total CR count, so it's the natural 100% reference.
  // Guard against an empty seed: max=1 keeps width math well-defined (0/1 = 0).
  const max = funnel.matched || 1;
  const labelId = useId();
  return (
    <Card as="section" aria-labelledby={labelId}>
      <SectionLabel id={labelId}>Relationship progression</SectionLabel>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sh-space-3)',
      }}>
        {PROGRESSION_STAGES.map((s) => (
          <ProgressionRow key={s.key} label={s.label} count={funnel[s.key]} max={max} />
        ))}
      </div>
    </Card>
  );
}

function ProgressionRow({ label, count, max }) {
  const pct = (count / max) * 100;
  return (
    <div style={{
      display: 'grid',
      // QA-038: was '140px 1fr 56px' — fixed widths compressed the middle bar
      // at narrow widths. min-widths keep label and value legible while the
      // bar takes whatever's left.
      gridTemplateColumns: 'minmax(110px, max-content) 1fr minmax(48px, max-content)',
      alignItems: 'center',
      gap: 'var(--sh-space-4)',
    }}>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 500,
        margin: 0,
      }}>
        {label}
      </p>
      <div style={{
        height: '8px',
        background: 'var(--sh-bg-tint)',
        borderRadius: 'var(--sh-radius-sm)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: 'var(--sh-bronze)',
          borderRadius: 'inherit',
        }} />
      </div>
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-xl)',
        color: 'var(--sh-text-primary)',
        textAlign: 'right',
        margin: 0,
      }}>
        {count}
      </p>
    </div>
  );
}

// PlatformHealthCard sub-label style — hoisted (QA-046) so the literal isn't
// re-built per render. Used for the Data integrity / Composition /
// Informational eyebrow labels inside the card.
const PLATFORM_HEALTH_SUB_LABEL = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
  margin: 0,
  marginBottom: 'var(--sh-space-2)',
};

function PlatformHealthCard({ health }) {
  const labelId = useId();
  const externalMonText = health.externalMonitoring === 'not-wired'
    ? 'not yet enabled'
    : health.externalMonitoring;

  return (
    <Card as="section" aria-labelledby={labelId}>
      <SectionLabel id={labelId}>Platform health</SectionLabel>

      {/* Honesty callout — the live framing the dropped LIVE pill used to carry,
          now anchored entirely in the prose. */}
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        maxWidth: '720px',
        margin: 0,
        marginBottom: 'var(--sh-space-5)',
        lineHeight: 1.5,
      }}>
        These checks run live over the assembled data layer. Pass/fail reflects
        the data layer's own integrity; the records being checked include the
        synthetic seed.
      </p>

      {/* Data integrity rollup */}
      <div style={{ marginBottom: 'var(--sh-space-5)' }}>
        <p style={PLATFORM_HEALTH_SUB_LABEL}>Data integrity</p>
        <p style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-xl)',
          color: health.allPass ? 'var(--sh-text-secondary)' : 'var(--sh-text-primary)',
          fontWeight: health.allPass ? 400 : 600,
          margin: 0,
        }}>
          {health.suitesPassing} of {health.suitesTotal} check suites passing
        </p>
      </div>

      {/* Per-suite breakdown */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sh-space-3)',
        marginBottom: 'var(--sh-space-5)',
      }}>
        {health.suites.map((s) => (
          <SuiteRow key={s.key} suite={s} />
        ))}
      </div>

      {/* Composition rollup */}
      <div style={{ marginBottom: 'var(--sh-space-5)' }}>
        <p style={PLATFORM_HEALTH_SUB_LABEL}>Composition</p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-primary)',
          margin: 0,
          lineHeight: 1.5,
        }}>
          {health.composition.totalRecords} records assembled across {health.composition.entityTypes} entity types
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          margin: 0,
          marginTop: 'var(--sh-space-half)',
        }}>
          {/* QA-008: "synthetic" is the seed, not a customer surface. Frame
              the three real source bundles separately and call the seed
              out by name so the line doesn't conflate the two. */}
          {(() => {
            const real = health.composition.sources.filter((s) => s !== 'synthetic');
            const hasSynthetic = health.composition.sources.includes('synthetic');
            return `${real.length} source bundle${real.length === 1 ? '' : 's'}: ${real.join(' · ')}${hasSynthetic ? ' + synthetic seed' : ''}`;
          })()}
        </p>
      </div>

      {/* Informational — data-driven, all entries from HEALTH.informational */}
      {health.informational.length > 0 && (
        <div style={{ marginBottom: 'var(--sh-space-5)' }}>
          <p style={PLATFORM_HEALTH_SUB_LABEL}>Informational — not errors</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-3)' }}>
            {health.informational.map((info) => (
              <div key={info.key}>
                <p style={{
                  fontSize: 'var(--sh-text-sm)',
                  color: 'var(--sh-text-secondary)',
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {info.text}
                </p>
                <p style={{
                  fontSize: 'var(--sh-text-xs)',
                  color: 'var(--sh-text-muted)',
                  margin: 0,
                  marginTop: 'var(--sh-space-half)',
                }}>
                  {info.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External monitoring */}
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        margin: 0,
      }}>
        External monitoring: {externalMonText}
      </p>
    </Card>
  );
}

function SuiteRow({ suite }) {
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 'var(--sh-space-4)',
      }}>
        <span style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-primary)',
        }}>
          {suite.label}
        </span>
        <span style={{
          fontSize: 'var(--sh-text-sm)',
          color: suite.pass ? 'var(--sh-text-secondary)' : 'var(--sh-text-primary)',
          fontWeight: suite.pass ? 400 : 600,
          flexShrink: 0,
        }}>
          {suite.pass ? 'OK' : `${suite.errorCount} error${suite.errorCount === 1 ? '' : 's'}`}
        </span>
      </div>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        margin: 0,
        marginTop: 'var(--sh-space-half)',
      }}>
        {suite.note}
      </p>
      {!suite.pass && suite.errors.length > 0 && (
        <div style={{
          marginTop: 'var(--sh-space-2)',
          padding: 'var(--sh-space-3)',
          background: 'var(--sh-bg-tint)',
          borderLeft: 'var(--sh-border-accent)',
          borderRadius: 'var(--sh-radius-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sh-space-1)',
        }}>
          {suite.errors.slice(0, 3).map((e, i) => (
            <p key={i} style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-secondary)',
              fontFamily: 'var(--sh-font-mono)',
              margin: 0,
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}>
              {e}
            </p>
          ))}
          {suite.errorCount > 3 && (
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              fontStyle: 'italic',
              margin: 0,
              marginTop: 'var(--sh-space-half)',
            }}>
              Showing first 3 of {suite.errorCount}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Pure ISO-date math for "Filed N days ago" — uses Date.UTC for numeric
// arithmetic (no string-parse timezone shift) and pulls today from the
// user's clock via new Date() so the relative text ages naturally.
function daysAgo(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const opened = Date.UTC(y, m - 1, d);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - opened) / 86_400_000);
}

function formatFiled(iso) {
  const n = daysAgo(iso);
  if (n === 0) return 'Filed today';
  if (n === 1) return 'Filed yesterday';
  if (n < 0)   return `Filed in ${-n} day${-n === 1 ? '' : 's'}`;
  return `Filed ${n} days ago`;
}

// Relative-time helper for the Recent Activity card (Slice F). Bands:
//   0       → "today"
//   1       → "yesterday"
//   2-13    → "N days ago"
//   14-55   → "N weeks ago"   (rounded to nearest week)
//   ≥56     → absolute "Mon DD, YYYY" via formatAbsDate
// Uses the same daysAgo() helper as formatFiled, computed against the user's
// local current date.
function formatTimeAgo(iso) {
  const n = daysAgo(iso);
  if (n === 0) return 'today';
  if (n === 1) return 'yesterday';
  if (n < 0)   return `in ${-n} day${-n === 1 ? '' : 's'}`;
  if (n <= 13) return `${n} days ago`;
  if (n <= 55) {
    const weeks = Math.round(n / 7);
    return `${weeks} weeks ago`;
  }
  return formatAbsDate(iso);
}

// SVG chevron — brand is SVG icons only (no unicode glyphs). Rotates 90°
// when the row is expanded, indicating the down-arrow state.
function Chevron({ expanded }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      style={{
        flexShrink: 0,
        color: 'var(--sh-text-muted)',
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 150ms ease',
      }}
    >
      <path
        d="M3 1.5 L7 5 L3 8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ExpandableRow — shared interaction shell for keyboard-expandable rows
// (QA-044 + QA-050). Owns: role=button, tabIndex, aria-expanded, click +
// Enter/Space toggling, hover bronze-tint, divider (suppressed on first),
// padding + negative-margin breakout, userSelect:none. The internal boolean
// is named `open`; the JSX-bearing prop is `expandedPanel` and the children
// render-prop receives `open` so the consumer can wire its own Chevron
// rotation without lifting state.
function ExpandableRow({ first = false, expandedPanel, children }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const toggle = () => setOpen((v) => !v);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: 'var(--sh-space-3)',
        marginLeft: 'calc(var(--sh-space-3) * -1)',
        marginRight: 'calc(var(--sh-space-3) * -1)',
        borderTop: first ? 'none' : 'var(--sh-border-divider)',
        cursor: 'pointer',
        background: hovered ? 'var(--sh-bronze-tint)' : 'transparent',
        transition: 'background 150ms ease',
        userSelect: 'none',
      }}
    >
      {typeof children === 'function' ? children(open) : children}
      {open && expandedPanel}
    </div>
  );
}

// Shared expand-panel style for IssueRow / ActivityRowInteractive expand
// content — the bronze-stripe tile that appears below the row when open.
const EXPAND_PANEL_STYLE = {
  marginTop: 'var(--sh-space-3)',
  padding: 'var(--sh-space-4)',
  background: 'var(--sh-card)',
  borderLeft: 'var(--sh-border-accent)',
  borderRadius: 'var(--sh-radius-md)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-1)',
};

const EXPAND_PANEL_LINE = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  margin: 0,
};

function IssueRow({ issue, first }) {
  const related = issue.relatedEntityType
    ? unified.byId(ENTITY_FOR_TYPE[issue.relatedEntityType], issue.relatedEntityId)
    : null;
  const relatedLine = issue.relatedEntityType === null
    ? 'Platform-level (no specific record)'
    : `About: ${related ? related.name : '(unresolved)'} (${issue.relatedEntityType})`;

  return (
    <ExpandableRow
      first={first}
      expandedPanel={
        <div style={EXPAND_PANEL_STYLE}>
          <p style={EXPAND_PANEL_LINE}>Opened {issue.openedAt}</p>
          <p style={EXPAND_PANEL_LINE}>{relatedLine}</p>
        </div>
      }
    >
      {(open) => (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--sh-space-3)',
          }}>
            <p style={{
              flex: 1,
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-primary)',
              margin: 0,
              marginBottom: 'var(--sh-space-half)',
              lineHeight: 1.45,
            }}>
              {issue.summary}
            </p>
            <div style={{ paddingTop: 'var(--sh-space-1)' }}>
              <Chevron expanded={open} />
            </div>
          </div>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            margin: 0,
          }}>
            {/* QA-020: <time> wraps the relative-time text so screen readers and
                tooltips get an absolute-date fallback for unexpanded rows. */}
            <time dateTime={issue.openedAt} title={formatAbsDate(issue.openedAt)}>
              {formatFiled(issue.openedAt)}
            </time>
            {' · '}{issue.category} · {issue.severity}
          </p>
        </>
      )}
    </ExpandableRow>
  );
}

function ActivityRowInteractive({ item, first }) {
  const related = item.relatedEntityType
    ? unified.byId(ENTITY_FOR_TYPE[item.relatedEntityType], item.relatedEntityId)
    : null;
  const relatedLine = item.relatedEntityType === null
    ? 'Platform-level (no specific record)'
    : `About: ${related ? related.name : '(unresolved)'} (${item.relatedEntityType})`;

  const surfaceAccent = resolveSurfaceColor(item.surface);

  return (
    <ExpandableRow
      first={first}
      expandedPanel={
        <div style={EXPAND_PANEL_STYLE}>
          <p style={EXPAND_PANEL_LINE}>Logged {formatAbsDate(item.timestamp)}</p>
          <p style={EXPAND_PANEL_LINE}>{relatedLine}</p>
        </div>
      }
    >
      {(open) => (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--sh-space-3)',
        }}>
          <div style={{ minWidth: '90px' }}>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              margin: 0,
            }}>
              {/* QA-020: <time> wraps the relative-time text so screen readers
                  and tooltips get an absolute-date fallback for unexpanded rows. */}
              <time dateTime={item.timestamp} title={formatAbsDate(item.timestamp)}>
                {formatTimeAgo(item.timestamp)}
              </time>
            </p>
          </div>
          <span style={{
            // QA-031: was the literal '10px' — moved to the nearest token
            // (--sh-text-xs is 11px, a one-pixel nudge upward).
            fontSize: 'var(--sh-text-xs)',
            padding: '2px 8px',
            borderRadius: 'var(--sh-radius-full)',
            background: 'var(--sh-bg-tint)',
            color: 'var(--sh-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 500,
            flexShrink: 0,
            // QA-022: was 0.5px — sub-pixel borders rendered inconsistently
            // (some browsers rounded to 0). 1px guarantees the chip outline.
            border: `1px solid ${surfaceAccent}`,
          }}>
            {item.surface}
          </span>
          <p style={{
            flex: 1,
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            lineHeight: 1.5,
            margin: 0,
            // QA-039: prevent long org names / unbroken strings from breaking
            // the row layout horizontally.
            overflowWrap: 'anywhere',
          }}>
            {item.description}
          </p>
          <div style={{ paddingTop: 'var(--sh-space-1)' }}>
            <Chevron expanded={open} />
          </div>
        </div>
      )}
    </ExpandableRow>
  );
}

function Stat({ label, value, sub, onClick }) {
  const [hovered, setHovered] = useState(false);
  const interactive = typeof onClick === 'function';
  const handleKeyDown = interactive
    ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }
    : undefined;
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={handleKeyDown}
      onMouseEnter={interactive ? () => setHovered(true) : undefined}
      onMouseLeave={interactive ? () => setHovered(false) : undefined}
      style={{
        background: interactive && hovered ? 'var(--sh-bg-tint)' : 'var(--sh-card)',
        border: 'var(--sh-border-thin)',
        borderRadius: 'var(--sh-radius-lg)',
        padding: 'var(--sh-space-5)',
        cursor: interactive ? 'pointer' : 'default',
        transition: interactive ? 'background 180ms ease' : undefined,
        userSelect: interactive ? 'none' : undefined,
      }}
    >
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        margin: 0,
        marginBottom: 'var(--sh-space-2)',
        fontWeight: 500,
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        margin: 0,
        marginBottom: 'var(--sh-space-1)',
      }}>
        {value}
      </p>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
      }}>
        {sub}
      </p>
    </div>
  );
}

