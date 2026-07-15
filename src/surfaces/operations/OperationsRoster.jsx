import { useCallback, useEffect, useId, useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { DEMO_ROSTER } from '../../data/opsFixtures.js';
import CreateInviteModal from './CreateInviteModal.jsx';

// Operations "Accounts" view (Ruling 1.1; scoping at
// docs/operations-roster-scoping.md). A NEW view spanning all four account
// types (Q2), distinct from the per-type entity directories: the directories
// list data-model records, this view lists ACCOUNTS/INVITES. (Display label
// "Accounts" per the 2026-07-13 naming ruling; the route stays /…/roster and
// the endpoint stays GET /api/roster — display-layer rename only.)
//
// TWO MODES (Ruling 1.1), switched on useOptionalAppIdentity() (null on the
// public demo tree, truthy under AppShell on /app/operations):
//   - demo tree (/operations)         → the DEMO_ROSTER fixture + a §7
//     demonstrative caveat. Fixture createdAt dates are synthetic like the
//     rest of the fixture (rendered in the Added column under the caveat).
//   - authenticated (/app/operations) → LIVE data from GET /api/roster, real
//     D1 person rows only (fictional .invalid seeds filtered server-side),
//     plus the "Create invite" affordance (POST /api/invites, requireGatedOps).
//
// Both modes render the SAME RosterTable. Rows are NON-INTERACTIVE (no dead
// click — aggregate-default guardrail). The "Create invite" CTA renders ONLY
// on the authenticated tree (AuthenticatedAccounts), never on the demo tree.

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ISO ('YYYY-MM-DD' or a full ISO instant) → 'Mon DD, YYYY'. Sliced to the date
// part then parsed field-wise (no Date) so the day is stable regardless of the
// local clock. NULL/empty → "—" (the 5 pre-0014 rows have no created_at).
function formatAdded(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${MONTH_SHORT[m - 1]} ${d}, ${y}`;
}

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Display labels for the account-type value (naming ruling 2026-07-13,
// display-layer only). The DB enum + /api/me emission stay 'ops'; only the
// rendered Type cell reads "Admin". Other types fall through to titleCase.
const TYPE_LABELS = { ops: 'Admin' };
function typeLabel(type) {
  return TYPE_LABELS[type] ?? titleCase(type);
}

// Extract the server's { error } message (mirrors the provider serverError
// helpers). Lets the real 403 gate message / 409 duplicate message reach the
// modal's writeError instead of a generic local string.
async function serverError(res, fallback) {
  try {
    const body = await res.json();
    return body?.error || fallback;
  } catch { return fallback; }
}

// Row order matches GET /api/roster: type asc, then displayName COLLATE NOCASE.
function rowCompare(a, b) {
  if (a.type !== b.type) return a.type < b.type ? -1 : 1;
  const an = a.displayName.toLowerCase();
  const bn = b.displayName.toLowerCase();
  if (an !== bn) return an < bn ? -1 : 1;
  return 0;
}
function insertSorted(rows, row) {
  const next = [...rows];
  const i = next.findIndex((r) => rowCompare(row, r) < 0);
  if (i === -1) next.push(row); else next.splice(i, 0, row);
  return next;
}

// API/fixture element → the shared RosterTable row shape.
function toRow(el, key, claimed) {
  return {
    key,
    type: el.type,
    displayName: el.displayName,
    inviteEmail: el.inviteEmail,
    claimed,
    sourceSurface: el.sourceSurface,
    createdAt: el.createdAt ?? null,
  };
}

// 6 columns: type · display name · invite email · status · source · added.
// minWidth keeps columns readable; the overflow-x wrapper scrolls on narrow
// viewports.
const GRID_COLUMNS = '0.8fr minmax(140px, 1.4fr) minmax(190px, 1.7fr) 0.8fr 1fr 0.9fr';

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
// claimed (bool), sourceSurface, createdAt }]. inviteEmail null renders "—";
// createdAt null renders "—".
function RosterTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div role="table" aria-label="Accounts" style={{ minWidth: '680px' }}>
        <div role="row" style={HEADER_ROW_STYLE}>
          <div role="columnheader">Type</div>
          <div role="columnheader">Name</div>
          <div role="columnheader">Invite email</div>
          <div role="columnheader">Status</div>
          <div role="columnheader">Source</div>
          <div role="columnheader">Added</div>
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
            <div role="cell">{typeLabel(r.type)}</div>
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
            <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{formatAdded(r.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footnote() {
  // No dead-click drill (aggregate-default guardrail): per-account detail
  // arrives in a later release.
  return (
    <p style={FOOTNOTE_STYLE}>
      Per-account detail arrives in a later release.
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

// Shared page header. `cta` renders in the reserved top-right slot (the
// "Create invite" Button on the authenticated tree; null on the demo tree).
function PageHeader({ headingId, cta }) {
  return (
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
          Accounts
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
      {cta}
    </div>
  );
}

const PAGE_STYLE = {
  maxWidth: 'var(--sh-content-max)',
  margin: '0 auto',
  padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
};

// Demo mode: the DEMO_ROSTER fixture, under the §7 caveat. Fixture createdAt
// dates are synthetic like the rest of the fixture.
function DemoAccounts({ headingId }) {
  const rows = DEMO_ROSTER.map((r) => toRow(
    { type: r.type, displayName: r.displayName, inviteEmail: r.inviteEmail, sourceSurface: r.sourceSurface, createdAt: r.createdAt },
    r.inviteEmail,
    r.status === 'claimed',
  ));

  return (
    <main style={PAGE_STYLE}>
      <PageHeader headingId={headingId} cta={null} />

      {/* §7 demonstrative caveat — matches the Overview caveat idiom. */}
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        marginBottom: 'var(--sh-space-5)',
        maxWidth: '720px',
      }}>
        The accounts below are demonstrative — five local seed identities, not
        live platform accounts.
      </p>

      <Card aria-labelledby={headingId}>
        <CountLine>{DEMO_ROSTER.length} accounts across all four surfaces</CountLine>
        <RosterTable rows={rows} />
        <Footnote />
      </Card>
    </main>
  );
}

// Live mode: GET /api/roster (ops-gated) + Create invite (POST /api/invites).
// Loading / error (no retry loop) / empty / rows. New invites splice into
// sorted position without a refetch.
function AuthenticatedAccounts({ headingId }) {
  const [state, setState] = useState({ status: 'loading', rows: [] });
  const [modalOpen, setModalOpen] = useState(false);
  const [writeError, setWriteError] = useState(null);
  const clearWriteError = useCallback(() => setWriteError(null), []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/roster', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('load-failed');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const rows = (data.roster ?? []).map((r) => toRow(r, r.id, !r.pending));
        setState({ status: 'ready', rows });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', rows: [] });
      });
    return () => { cancelled = true; };
  }, []);

  const createInvite = useCallback(async (payload) => {
    setWriteError(null);
    try {
      const res = await fetch('/api/invites', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to create invite'));
      const saved = await res.json();
      const row = toRow(saved, saved.id, !saved.pending);
      setState((prev) => ({ ...prev, rows: insertSorted(prev.rows, row) }));
      return saved;
    } catch (err) {
      setWriteError(err.message || 'Failed to create invite');
      return null;
    }
  }, []);

  const cta = (
    <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
      Create invite
    </Button>
  );

  return (
    <main style={PAGE_STYLE}>
      <PageHeader headingId={headingId} cta={cta} />

      <Card aria-labelledby={headingId}>
        {state.status === 'loading' && (
          <p style={{ fontSize: 'var(--sh-text-sm)', color: 'var(--sh-text-muted)', margin: 0 }}>
            Loading accounts…
          </p>
        )}
        {state.status === 'error' && (
          <p style={{ fontSize: 'var(--sh-text-sm)', color: 'var(--sh-text-secondary)', margin: 0 }}>
            The accounts list could not be loaded.
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

      <CreateInviteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={createInvite}
        writeError={writeError}
        clearWriteError={clearWriteError}
      />
    </main>
  );
}

export default function OperationsRoster() {
  const headingId = useId();
  const isAuthenticated = !!useOptionalAppIdentity();

  return isAuthenticated
    ? <AuthenticatedAccounts headingId={headingId} />
    : <DemoAccounts headingId={headingId} />;
}
