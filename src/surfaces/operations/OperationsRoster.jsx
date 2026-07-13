import { useEffect, useId, useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { DEMO_ROSTER } from '../../data/opsFixtures.js';

// Operations Roster (Ruling 1.1; scoping at docs/operations-roster-scoping.md).
// A NEW view spanning all four account types (Q2), distinct from the per-type
// entity directories: the directories list data-model records, the roster
// lists ACCOUNTS/INVITES.
//
// TWO MODES (Ruling 1.1), switched on useOptionalAppIdentity() (null on the
// public demo tree, truthy under AppShell on /app/operations):
//   - demo tree (/operations)         → the DEMO_ROSTER fixture + a §7
//     demonstrative caveat (O-2).
//   - authenticated (/app/operations) → LIVE data from GET /api/roster (O-3),
//     real D1 person rows only (fictional .invalid seeds filtered server-side).
//     The roster is the one view Ruling 1.1 requires honest from birth.
//
// Both modes render the SAME RosterTable. Rows are NON-INTERACTIVE: per the
// aggregate-default-with-purposeful-drill guardrail, no dead click when there
// is no detail target yet — per-account detail + invite actions land with the
// invite-form slice.
//
// "Added" column DEFERRED (O-3): the person table has no created_at (migrations
// 0001/0004), so there is no live source for a creation timestamp. It arrives
// with the invite-form slice that owns the person-row write path. Dropped from
// both branches here.
//
// The "Create invite" CTA's home is the top-right of the page header (reserved
// flex slot below) — no placeholder affordance rendered until the invite-form
// slice.

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// 5 columns: type · display name · invite email · status · source surface.
// minWidth keeps columns readable; the overflow-x wrapper scrolls on narrow
// viewports.
const GRID_COLUMNS = '0.8fr minmax(140px, 1.4fr) minmax(190px, 1.7fr) 0.8fr 1fr';

const HEADER_ROW_STYLE = {
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
};

const FOOTNOTE_STYLE = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  marginTop: 'var(--sh-space-5)',
  marginBottom: 0,
};

// Shared table for both modes. rows: [{ key, type, displayName, inviteEmail,
// claimed (bool), sourceSurface }]. inviteEmail null renders "—".
function RosterTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div role="table" aria-label="Roster" style={{ minWidth: '600px' }}>
        <div role="row" style={HEADER_ROW_STYLE}>
          <div role="columnheader">Type</div>
          <div role="columnheader">Name</div>
          <div role="columnheader">Invite email</div>
          <div role="columnheader">Status</div>
          <div role="columnheader">Source</div>
        </div>
        {rows.map((r, i) => (
          <div
            role="row"
            key={r.key}
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLUMNS,
              gap: 'var(--sh-space-4)',
              padding: 'var(--sh-space-3)',
              borderBottom: i === rows.length - 1 ? 'none' : 'var(--sh-border-divider)',
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-body)',
              alignItems: 'center',
            }}
          >
            <div role="cell">{titleCase(r.type)}</div>
            <div role="cell" style={{ color: 'var(--sh-text-primary)' }}>{r.displayName}</div>
            <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{r.inviteEmail ?? '—'}</div>
            {/* Lifecycle state, not a judgment (Path B): claimed reads affirmed,
                invited reads pending — neither ranks the person. */}
            <div role="cell" style={{
              color: r.claimed ? 'var(--sh-text-body)' : 'var(--sh-text-muted)',
              fontStyle: r.claimed ? 'normal' : 'italic',
            }}>
              {r.claimed ? 'Claimed' : 'Invited'}
            </div>
            <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{titleCase(r.sourceSurface)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footnote() {
  // No dead-click drill (aggregate-default guardrail): per-account detail +
  // invite actions arrive with the invite-form slice.
  return (
    <p style={FOOTNOTE_STYLE}>
      Per-account detail and invite actions arrive in a later release.
    </p>
  );
}

function CountLine({ children }) {
  return (
    <p style={{
      fontSize: 'var(--sh-text-sm)',
      color: 'var(--sh-text-secondary)',
      marginBottom: 'var(--sh-space-5)',
    }}>
      {children}
    </p>
  );
}

// Demo mode (O-2): the DEMO_ROSTER fixture, unchanged, under the §7 caveat.
function DemoRoster({ headingId }) {
  const rows = DEMO_ROSTER.map((r) => ({
    key: r.inviteEmail,
    type: r.type,
    displayName: r.displayName,
    inviteEmail: r.inviteEmail,
    claimed: r.status === 'claimed',
    sourceSurface: r.sourceSurface,
  }));

  return (
    <>
      {/* §7 demonstrative caveat — matches the Overview caveat idiom. */}
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        marginBottom: 'var(--sh-space-5)',
        maxWidth: '720px',
      }}>
        This roster is demonstrative — the five identities below are the local
        seed accounts, not live platform accounts.
      </p>

      <Card aria-labelledby={headingId}>
        <CountLine>{DEMO_ROSTER.length} accounts across all four surfaces</CountLine>
        <RosterTable rows={rows} />
        <Footnote />
      </Card>
    </>
  );
}

// Live mode (O-3): GET /api/roster (ops-gated). Loading / error / empty / rows.
// No retry loop on error — an honest one-line message, per §7.
function LiveRoster({ headingId }) {
  const [state, setState] = useState({ status: 'loading', rows: [] });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/roster', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('load-failed');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const rows = (data.roster ?? []).map((r) => ({
          key: r.id,
          type: r.type,
          displayName: r.displayName,
          inviteEmail: r.inviteEmail,
          claimed: !r.pending,
          sourceSurface: r.sourceSurface,
        }));
        setState({ status: 'ready', rows });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', rows: [] });
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <Card aria-labelledby={headingId}>
      {state.status === 'loading' && (
        <p style={{ fontSize: 'var(--sh-text-sm)', color: 'var(--sh-text-muted)', margin: 0 }}>
          Loading the roster…
        </p>
      )}
      {state.status === 'error' && (
        <p style={{ fontSize: 'var(--sh-text-sm)', color: 'var(--sh-text-secondary)', margin: 0 }}>
          The roster could not be loaded.
        </p>
      )}
      {state.status === 'ready' && state.rows.length === 0 && (
        <p style={{ fontSize: 'var(--sh-text-sm)', color: 'var(--sh-text-muted)', fontStyle: 'italic', margin: 0 }}>
          No accounts or invites yet.
        </p>
      )}
      {state.status === 'ready' && state.rows.length > 0 && (
        <>
          <CountLine>
            {state.rows.length} account{state.rows.length === 1 ? '' : 's'} and invite{state.rows.length === 1 ? '' : 's'} across all four surfaces
          </CountLine>
          <RosterTable rows={state.rows} />
          <Footnote />
        </>
      )}
    </Card>
  );
}

export default function OperationsRoster() {
  const headingId = useId();
  const isAuthenticated = !!useOptionalAppIdentity();

  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      {/* Page header. The flex row reserves the top-right as the "Create invite"
          CTA home for the invite-form slice — left column holds the title, the
          right slot stays empty (no placeholder affordance). */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--sh-space-6)',
      }}>
        <div>
          <h1 id={headingId} style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-2xl)',
            color: 'var(--sh-text-primary)',
            marginBottom: 'var(--sh-space-2)',
          }}>
            Roster
          </h1>
          <p style={{
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-text-secondary)',
            marginBottom: 'var(--sh-space-8)',
            maxWidth: '620px',
          }}>
            Every account and invite across all four surfaces — who has been
            invited, and who has signed in.
          </p>
        </div>
        {/* CTA home reserved (invite-form slice): a "Create invite" Button lands here. */}
      </div>

      {isAuthenticated ? <LiveRoster headingId={headingId} /> : <DemoRoster headingId={headingId} />}
    </main>
  );
}
