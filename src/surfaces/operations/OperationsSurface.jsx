import { useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Chrome from '../../components/Chrome.jsx';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import unified from '../../data/unified/index.js';

// Operations Overview stat values — computed once at module load from the
// unified data layer. unified import is eager: it runs the three adapters +
// synthetic seed + assemble at first reference. No useMemo needed; these
// are pure const integers / plain objects, not state.
const INDIVIDUAL_COUNT  = unified.personsBy({ type: 'individual' }).length;
const INSTITUTION_COUNT = unified.countBy('institutions');
const PRACTICE_COUNT    = unified.countBy('advisorPractices');

// Mission-funnel pillar (Slice B): aggregate-only, derived from the
// ConnectionRequest entity. The funnel and pilot headlines below are
// demonstrative — drawn from the synthetic seed, not live traction.
const FUNNEL  = unified.connectionFunnel();
const METRICS = unified.pilotMetrics();

// Ordered stages for the funnel rendering. Descriptive labels — no scoring,
// no ranking. Each later stage is a subset of all earlier stages.
const FUNNEL_STAGES = [
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

// Recent Activity card (Slice F). Card-level curation: exclude issue-opened
// events so this card doesn't duplicate the Open-issues card next to it.
// recentActivity() stays a faithful full feed; filtering happens here only.
// Filter BEFORE slicing so the 6 are post-exclusion.
const RECENT_ACTIVITY_LIMIT = 6;
const RECENT_ACTIVITY = unified.recentActivity({ limit: 105 })
  .filter((i) => i.sourceEventType !== 'issue-opened')
  .slice(0, RECENT_ACTIVITY_LIMIT);

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
  { key: 'advisors', label: 'Philanthropic Advisors', path: '/operations/advisors' },
  { key: 'health', label: 'Platform health', path: '/operations/health' },
];

export default function OperationsSurface() {
  const location = useLocation();
  const path = location.pathname;
  const activeNav =
    path.includes('/individuals') ? 'individuals' :
    path.includes('/institutions') ? 'institutions' :
    path.includes('/advisors') ? 'advisors' :
    path.includes('/health') ? 'health' :
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
          <Route path="individuals" element={<UserList kind="individuals" />} />
          <Route path="institutions" element={<UserList kind="institutions" />} />
          <Route path="advisors" element={<UserList kind="advisors" />} />
          <Route path="health" element={<PlatformHealth />} />
          <Route path="*" element={<Navigate to="/operations" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function OperationsHome() {
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
          Monitor and support across all three end-user surfaces. View user activity, surface issues, and provide support.
          This view is internal-only and is never exposed to platform users.
        </p>
      </div>

      {/* Demonstrative-state caveat — applies to the funnel, pilot headlines,
          and the open-issues card below. Phrased so no synthetic number reads
          as live traction. */}
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        marginBottom: 'var(--sh-space-5)',
        maxWidth: '720px',
      }}>
        Mission funnel, pilot headlines, and the open-issues + recent-activity
        cards below are demonstrative — drawn from the synthetic seed, not live
        platform traction.
      </p>

      {/* Mission funnel — primary pillar (Slice B) */}
      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <MissionFunnel funnel={FUNNEL} />
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
          sub="post-gift, still engaged"
        />
        <Stat
          label="Orgs supported"
          value={METRICS.distinctOrgsAtGave}
          sub="distinct nonprofits at gave or ongoing"
        />
        <Stat
          label="Total given via StewardHouse"
          value={`$${METRICS.totalDollarsAtGave.toLocaleString()}`}
          sub={`across ${METRICS.gaveCount} gifts`}
        />
        <Stat
          label="Matched → gave"
          value={`${Math.round(METRICS.conversionMatchedToGave * 100)}%`}
          sub="cumulative funnel conversion"
        />
      </div>

      {/* Platform composition — existing four tiles, demoted below the funnel pillar.
          Three derived counts plus the hardcoded Open issues (wired in Slice C). */}
      <div style={{ marginBottom: 'var(--sh-space-8)' }}>
        <SectionLabel>Platform composition</SectionLabel>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--sh-space-4)',
        }}>
          <Stat label="Individuals" value={INDIVIDUAL_COUNT} sub="On platform" />
          <Stat label="Institutions" value={INSTITUTION_COUNT} sub="Active programs" />
          <Stat label="Advisor Practices" value={PRACTICE_COUNT} sub="On platform" />
          <Stat label="Open issues" value={OPEN_ISSUE_COUNT} sub="Awaiting response" />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: 'var(--sh-space-6)',
      }}>
        <Card>
          <SectionLabel>Recent activity</SectionLabel>
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
            Per-activity drill-down pending — Operations route-pages slice.
          </p>
        </Card>

        <Card tint>
          <SectionLabel>Open issues</SectionLabel>
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
            Per-issue drill-down pending — Operations route-pages slice.
          </p>
        </Card>
      </div>
    </main>
  );
}

function MissionFunnel({ funnel }) {
  // matched is always the total CR count, so it's the natural 100% reference.
  // Guard against an empty seed: max=1 keeps width math well-defined (0/1 = 0).
  const max = funnel.matched || 1;
  return (
    <Card>
      <SectionLabel>Mission funnel</SectionLabel>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sh-space-3)',
      }}>
        {FUNNEL_STAGES.map((s) => (
          <FunnelRow key={s.key} label={s.label} count={funnel[s.key]} max={max} />
        ))}
      </div>
    </Card>
  );
}

function FunnelRow({ label, count, max }) {
  const pct = (count / max) * 100;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '140px 1fr 56px',
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

function IssueRow({ issue, first }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const related = issue.relatedEntityType
    ? unified.byId(ENTITY_FOR_TYPE[issue.relatedEntityType], issue.relatedEntityId)
    : null;
  const relatedLine = issue.relatedEntityType === null
    ? 'Platform-level (no specific record)'
    : `About: ${related ? related.name : '(unresolved)'} (${issue.relatedEntityType})`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setExpanded((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded((v) => !v);
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
          marginBottom: '2px',
          lineHeight: 1.45,
        }}>
          {issue.summary}
        </p>
        <div style={{ paddingTop: '4px' }}>
          <Chevron expanded={expanded} />
        </div>
      </div>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        margin: 0,
      }}>
        {formatFiled(issue.openedAt)} · {issue.category} · {issue.severity}
      </p>
      {expanded && (
        <div style={{
          marginTop: 'var(--sh-space-3)',
          padding: 'var(--sh-space-4)',
          background: 'var(--sh-card)',
          borderLeft: '3px solid var(--sh-bronze)',
          borderRadius: 'var(--sh-radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sh-space-1)',
        }}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            margin: 0,
          }}>
            Opened {issue.openedAt}
          </p>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            margin: 0,
          }}>
            {relatedLine}
          </p>
        </div>
      )}
    </div>
  );
}

function ActivityRowInteractive({ item, first }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const related = item.relatedEntityType
    ? unified.byId(ENTITY_FOR_TYPE[item.relatedEntityType], item.relatedEntityId)
    : null;
  const relatedLine = item.relatedEntityType === null
    ? 'Platform-level (no specific record)'
    : `About: ${related ? related.name : '(unresolved)'} (${item.relatedEntityType})`;

  const surfaceAccent = SURFACE_COLORS[item.surface] || 'var(--sh-text-muted)';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setExpanded((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded((v) => !v);
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
            {formatTimeAgo(item.timestamp)}
          </p>
        </div>
        <span style={{
          fontSize: '10px',
          padding: '2px 8px',
          borderRadius: 'var(--sh-radius-full)',
          background: 'var(--sh-bg-tint)',
          color: 'var(--sh-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 500,
          flexShrink: 0,
          border: `0.5px solid ${surfaceAccent}`,
        }}>
          {item.surface}
        </span>
        <p style={{
          flex: 1,
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-secondary)',
          lineHeight: 1.5,
          margin: 0,
        }}>
          {item.description}
        </p>
        <div style={{ paddingTop: '4px' }}>
          <Chevron expanded={expanded} />
        </div>
      </div>
      {expanded && (
        <div style={{
          marginTop: 'var(--sh-space-3)',
          padding: 'var(--sh-space-4)',
          background: 'var(--sh-card)',
          borderLeft: '3px solid var(--sh-bronze)',
          borderRadius: 'var(--sh-radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sh-space-1)',
        }}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            margin: 0,
          }}>
            Logged {formatAbsDate(item.timestamp)}
          </p>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            margin: 0,
          }}>
            {relatedLine}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={{
      background: 'var(--sh-card)',
      border: 'var(--sh-border-thin)',
      borderRadius: 'var(--sh-radius-lg)',
      padding: 'var(--sh-space-5)',
    }}>
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

function UserList({ kind }) {
  const titleMap = {
    individuals: 'Individuals',
    institutions: 'Institutions',
    advisors: 'Philanthropic Advisors',
  };
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
        {titleMap[kind]}
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        Aggregate view across all {titleMap[kind].toLowerCase()} on the platform. Filtering, search, and per-user drill-down.
      </p>
      <Card tint>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-muted)',
          textAlign: 'center',
          fontStyle: 'italic',
          padding: 'var(--sh-space-6)',
        }}>
          Section scaffolded · aggregation queries will land here when data layer is wired.
        </p>
      </Card>
    </main>
  );
}

function PlatformHealth() {
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
        Platform health
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        Deploys, errors, latency, and active sessions across the platform.
      </p>
      <Card tint>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-muted)',
          textAlign: 'center',
          fontStyle: 'italic',
          padding: 'var(--sh-space-6)',
        }}>
          Section scaffolded · monitoring will integrate when production traffic begins.
        </p>
      </Card>
    </main>
  );
}
