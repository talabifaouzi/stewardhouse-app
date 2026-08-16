import { useCallback, useEffect, useId, useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Modal } from '../../components/Modal.jsx';
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
//
// INTERACTIVE ROWS (authenticated tree only). onRowAction + rowAriaLabel are
// OPTIONAL; DemoAccounts passes neither, so `interactive` is false there and the
// spread below contributes nothing. Guarded on typeof === 'function' rather than
// truthiness, per DataTable.jsx:20-27.
//
// The applied set is DataTable.jsx:44-66 verbatim in intent: tabIndex 0,
// aria-label, onClick, onKeyDown for Enter and Space with preventDefault (Space
// would otherwise scroll the page), hover handlers, cursor, hover background and
// transition. role="row" is PRESERVED with NO role="button" override, per the
// WAI-ARIA tabular-data practice DataTable.jsx:17-18 cites.
//
// PER-ROW, NOT PER-TABLE. DataTable's `interactive` is table-wide; here a row is
// interactive only when NOT claimed, because DELETE /api/invites/:id refuses a
// claimed row with 409. Offering an action that is guaranteed to be refused is
// worse than offering none. Self-delete needs no separate rule: the session
// person is necessarily claimed, so suppressing on claimed suppresses self.
function RosterTable({ rows, onRowAction, rowAriaLabel }) {
  const interactive = typeof onRowAction === 'function';
  const [hoveredKey, setHoveredKey] = useState(null);

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
        {rows.map((r, i) => {
          const rowInteractive = interactive && !r.claimed;
          const rowProps = rowInteractive
            ? {
                tabIndex: 0,
                'aria-label': rowAriaLabel ? rowAriaLabel(r) : undefined,
                onClick: () => onRowAction(r),
                onKeyDown: (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowAction(r);
                  }
                },
                onMouseEnter: () => setHoveredKey(r.key),
                onMouseLeave: () => setHoveredKey(null),
              }
            : {};
          return (
          <div
            role="row"
            key={r.key}
            {...rowProps}
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLUMNS,
              gap: 'var(--sh-space-4)',
              padding: 'var(--sh-space-3)',
              borderBottom: i === rows.length - 1 ? 'none' : 'var(--sh-border-divider)',
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-body)',
              alignItems: 'center',
              // Merged, not replacing: a non-interactive row spreads an empty
              // object here and its style stays byte-identical to before.
              ...(rowInteractive ? {
                cursor: 'pointer',
                background: hoveredKey === r.key ? 'var(--sh-bg-tint)' : undefined,
                transition: 'background 150ms ease',
              } : {}),
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
          );
        })}
      </div>
    </div>
  );
}

// Withdraw-invite confirm. Opened DIRECTLY from a row, so it is TWO deep, the
// same depth CreateInviteModal already exercises from the page CTA. There is no
// detail modal behind it: a detail view would have shown only the six fields
// already visible in the row, and would have made this the first three-deep
// stack in Operations hosting an irreversible action.
//
// Because nothing renders behind it, the copy carries the record itself. The
// AthleteProfile idiom (:70-83) transfers for the in-flight flag and re-entry
// guard, but NOT for the success path: there is no parent to close, so success
// clears the pending record and the row disappearing from the table is the
// confirmation.
//
// COPY CONSTRAINTS, all load-bearing. It names the record (two invites can share
// a display name, never an address). It states the action is irreversible. It
// states the address is released, which is the point of the slice. It states
// nothing else is destroyed, which is TRUE by construction: all thirteen inbound
// FKs to person are empty on an unclaimed row. It avoids the word "account" for
// an unclaimed row, because there is no account (the endpoint reserves that word
// for the claimed case it refuses). And it says plainly that nobody is notified,
// because the delete sends nothing.
function WithdrawInviteConfirm({ record, onCancel, onConfirm, writeError }) {
  const [removing, setRemoving] = useState(false);

  const handleConfirm = async () => {
    if (removing) return;      // re-entry guard, AthleteProfile:71
    setRemoving(true);
    const ok = await onConfirm(record);
    // On success the parent clears `record`, which unmounts this modal; there is
    // no setState to run here. On failure, drop the in-flight flag and stay open
    // so writeError is readable.
    if (!ok) setRemoving(false);
  };

  return (
    <Modal isOpen={!!record} onClose={onCancel} title="Withdraw invite">
      <p style={CONFIRM_BODY_STYLE}>
        Withdraw the invitation to {record?.displayName} at {record?.inviteEmail}?
        An unclaimed invitation has nothing else stored against it, so nothing
        else is removed. The address is released and can be invited again.
        No message is sent to them. This cannot be undone.
      </p>
      {writeError && <p style={CONFIRM_ERROR_STYLE}>{writeError}</p>}
      <div style={CONFIRM_FOOTER_STYLE}>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={removing}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={handleConfirm} disabled={removing}>
          {removing ? 'Withdrawing…' : 'Withdraw invite'}
        </Button>
      </div>
    </Modal>
  );
}

const CONFIRM_BODY_STYLE = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.6,
  marginTop: 0,
  marginBottom: 'var(--sh-space-4)',
};

const CONFIRM_ERROR_STYLE = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-secondary)',
  fontStyle: 'italic',
  marginBottom: 'var(--sh-space-3)',
};

const CONFIRM_FOOTER_STYLE = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--sh-space-2)',
  flexWrap: 'wrap',
};

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
  // Pending withdraw: the ROW OBJECT or null, not a boolean and not a key. The
  // confirm renders the display name and invite email in its copy, and a key
  // would have to be looked up in state.rows at exactly the moment the row is
  // being removed from it.
  const [pendingWithdraw, setPendingWithdraw] = useState(null);
  // Delete-scoped writeError, NOT shared with create. A shared slot would let a
  // failed create and a failed withdraw write the same place, and whichever
  // fired last would render in whichever modal happened to be open.
  const [withdrawError, setWithdrawError] = useState(null);
  // Focus target for the success path, see openWithdraw / withdrawInvite below.
  // Button spreads ...props onto the <button> (Button.jsx:105) but does NOT
  // forwardRef, so this is an id lookup rather than a ref.
  const ctaId = useId();

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

  // Withdraw an unclaimed invite. Returns true on success so the confirm can
  // keep its in-flight flag set through the unmount.
  const withdrawInvite = useCallback(async (record) => {
    setWithdrawError(null);
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(record.key)}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!res.ok) throw new Error(await serverError(res, 'Failed to withdraw invite'));
      // No refetch, matching createInvite: filter by key. On the auth tree
      // toRow keys on the person id, which is also the route parameter.
      setState((prev) => ({ ...prev, rows: prev.rows.filter((r) => r.key !== record.key) }));
      setPendingWithdraw(null);
      // FOCUS: Modal.jsx:36-47 captured the ROW as its trigger at open time and
      // focuses it again in its unmount cleanup. That row is being removed in
      // this same update, so the restore targets a detached node: no throw (the
      // guard at :46 checks for a focus method) but focus silently falls to
      // <body>. Modal's cleanup runs synchronously during the commit that
      // unmounts it, so this rAF lands AFTER it and wins. The CTA is the target
      // because it is the only control guaranteed to exist at that moment: it
      // renders in PageHeader regardless of row count, so it survives even the
      // deletion of the last row, when the table itself is replaced by the
      // empty state.
      requestAnimationFrame(() => {
        const el = document.getElementById(ctaId);
        if (el) el.focus();
      });
      return true;
    } catch (err) {
      setWithdrawError(err.message || 'Failed to withdraw invite');
      return false;
    }
  }, [ctaId]);

  // Only one of the two modals is ever open: each opener clears the other.
  const openCreate = useCallback(() => {
    setPendingWithdraw(null);
    setModalOpen(true);
  }, []);
  const openWithdraw = useCallback((row) => {
    setModalOpen(false);
    setWithdrawError(null);
    setPendingWithdraw(row);
  }, []);

  const cta = (
    <Button id={ctaId} variant="primary" size="sm" onClick={openCreate}>
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
            <RosterTable
              rows={state.rows}
              onRowAction={openWithdraw}
              rowAriaLabel={(r) => `Withdraw the invitation to ${r.displayName}`}
            />
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

      <WithdrawInviteConfirm
        record={pendingWithdraw}
        onCancel={() => setPendingWithdraw(null)}
        onConfirm={withdrawInvite}
        writeError={withdrawError}
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
