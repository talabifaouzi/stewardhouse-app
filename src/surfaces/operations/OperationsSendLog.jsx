import { useEffect, useId, useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { formatInstantUTC } from './formatInstant.js';

// Operations "Sign-in email" view — the read surface for auth_send_log
// (A13, elements 6 and 8). Reads GET /api/auth-sends, gated by requireOps.
//
// TWO MODES, switched on useOptionalAppIdentity() exactly as OperationsRoster
// does (null on the public demo tree, truthy under AppShell on /app/operations):
//   - authenticated (/app/operations/auth-sends) → LIVE rows from the endpoint.
//   - demo tree      (/operations/auth-sends)    → an ABSENT STATE. No rows, no
//     fixture, no synthetic history.
//
// FORK 2 (FT-ruled) IS "PRESENT WITH ABSENT STATE", AND THE ALTERNATIVE IT
// REJECTS IS WHY THE NAV ITEM APPEARS ON BOTH TREES. Hiding the item on the
// demo tree would have been the easy option and it is the dishonest one: the
// public tree is how this product is shown, and a surface that quietly omits
// the page where sign-in delivery is inspected misrepresents what the platform
// does. So the item is present, the route resolves, and the page says plainly
// that the record it reads is live and therefore not here.
//
// THE DEMO BRANCH MUST NOT FETCH. Every other operations view can afford a
// fixture; this one cannot invent send history without inventing a claim about
// whether sign-in has been working, which is the §7 LIVE-honesty boundary and
// ruling (5)'s no-verdict posture arriving at the same place from two
// directions. DemoSendLog therefore has no effect and no request — an
// unauthenticated call would 401 and render the error state, which would say
// something false about the server rather than true about the tree.
//
// -----------------------------------------------------------------------------
// RULING (5) GOVERNS THE WHOLE SHAPE: NO HEALTH VERDICT, AND NO GREEN STATE.
//
// The page reports what is recorded and stops. It never says working, healthy,
// degraded or down, and it has no state that reads as reassurance. Three
// consequences are deliberate and should not be "improved" later:
//
//   1. NO COLOUR CODING ON OUTCOME. A failure rendered in a warning colour is a
//      verdict delivered by styling rather than by words, and a success in
//      green is precisely the green state the ruling forbids. Both outcomes
//      render in the same weight and the same token. The word is the signal.
//   2. NO ICON, BADGE, TOTAL OR RATE. A failure count or a success percentage
//      is a health score with the arithmetic hidden, and migration 0021:31-43
//      records why one cannot be computed honestly from this table anyway:
//      there is no expected-rate baseline.
//   3. NO SORTING OR FILTERING CONTROL. Ruling (4) fixes one query. A filter to
//      "failures only" would invite reading the filtered count as a figure.
//
// -----------------------------------------------------------------------------
// THE INTERPRETIVE LINE SITS BETWEEN THE MARKS AND THE TABLE (ruled placement,
// element 7, candidate A).
//
// It governs the two marks, because the marks are the only thing on the page a
// verdict could be drawn FROM: "last success, two hours ago" reads as healthy
// and "last success, five days ago" reads as alarm, and the data supports
// neither. A hundred rows below are records, and nobody infers health from a
// list. So the reading order is marks, then how to read them, then the rows.
//
// AND IT RENDERS IN THE EMPTY STATE TOO, which is the one placement decision
// that is easy to get backwards. The line says an absence of rows cannot be
// distinguished from a quiet stretch. An empty table is exactly when that is
// true, so hiding the line there would withhold it at the only moment it is
// the entire content of the page.
//
// -----------------------------------------------------------------------------
// THE 100-ROW CAP IS DISCLOSED WITH THE COUNT LINE, not inside the interpretive
// line (FT-ruled). The endpoint returns at most 100 rows and does NOT report a
// total, so the view can only distinguish two cases: fewer than 100 came back,
// which means that is the whole table; or exactly 100 came back, which means
// the list is capped and the view cannot see past it.
//
// The capped copy also names what the cap does NOT apply to. The two marks are
// whole-table and the list is not, so a success can sit above the table while
// the rows below hold none — which is not a contradiction and is the single
// most likely thing for an operator to read as one.

const ERROR_NOTE_STYLE = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  margin: 0,
};

const LOADING_STYLE = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-muted)',
  margin: 0,
};

const EMPTY_STYLE = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  margin: 0,
  marginTop: 'var(--sh-space-5)',
};

// The demo-tree absent state. NOT italic, unlike EMPTY_STYLE: the empty state
// above reports a fact about the data, while this reports a fact about the
// tree, and rendering the second as a quiet aside would make it read like the
// first — "no attempts recorded" rather than "this is not where they live".
const ABSENT_STYLE = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  margin: 0,
  maxWidth: '620px',
};

// 4 columns: time · outcome · HTTP status · Resend error. minWidth keeps the
// instant column from wrapping mid-timestamp; the overflow-x wrapper scrolls on
// narrow viewports, matching RosterTable's idiom.
const GRID_COLUMNS = 'minmax(230px, 1.3fr) 0.7fr 0.6fr minmax(160px, 1.2fr)';

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

// Ruling (2)'s "unrecognized failure" case. BOTH derived fields null AND the
// row is a failure: a success row also carries two nulls and has nothing to
// classify, while a failure with a status is not unrecognized — the status is
// the thing that was recognized. See functions/_lib/sendOutcome.js.
function errorCell(row) {
  if (row.outcome !== 'failure') return '—';
  if (row.errorName) return row.errorName;
  if (row.status === null) return 'unrecognized failure';
  return '—';
}

// The two whole-table marks. formatInstantUTC renders "—" when a mark is null,
// which is honest in two different situations the view cannot separate and does
// not try to: no success has ever been recorded, or nothing has been recorded
// at all.
function Mark({ label, value }) {
  return (
    <div>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        margin: 0,
        marginBottom: 'var(--sh-space-1)',
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-text-primary)',
        margin: 0,
      }}>
        {value}
      </p>
    </div>
  );
}

function Marks({ allTime }) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--sh-space-8)',
      marginBottom: 'var(--sh-space-5)',
    }}>
      <Mark label="Last success" value={formatInstantUTC(allTime?.lastSuccessAt)} />
      <Mark label="Last failure" value={formatInstantUTC(allTime?.lastFailureAt)} />
    </div>
  );
}

// Element 7, candidate A, VERBATIM. Both clauses ruling (5) requires are here:
// silence is ambiguous, and a load window leaves a gap rather than failures.
// The load clause is GENERIC on purpose — the view has no knowledge of when a
// load ran, so it cannot say which gap is which.
function InterpretiveLine() {
  return (
    <p style={{
      fontSize: 'var(--sh-text-sm)',
      color: 'var(--sh-text-secondary)',
      margin: 0,
      marginBottom: 'var(--sh-space-5)',
      maxWidth: '620px',
    }}>
      A success row is the only positive signal on this page. Silence is not its
      opposite: a stretch with no rows reads the same whether no one asked for a
      sign-in link or nothing could be recorded, and a database load leaves that
      kind of gap rather than a run of failures.
    </p>
  );
}

function CountLine({ count }) {
  // The endpoint reports no total, so "capped" is inferred from getting exactly
  // the window back. At fewer than 100, what came back IS the whole table.
  const capped = count >= 100;
  return (
    <p style={{
      fontSize: 'var(--sh-text-sm)',
      color: 'var(--sh-text-secondary)',
      marginBottom: 'var(--sh-space-5)',
    }}>
      {capped
        ? 'The 100 most recent attempts, newest first. The list is capped; the two times above are not.'
        : `${count} attempt${count === 1 ? '' : 's'}, newest first.`}
    </p>
  );
}

function SendTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div role="table" aria-label="Sign-in email attempts" style={{ minWidth: '680px' }}>
        <div role="row" style={HEADER_ROW_STYLE}>
          <div role="columnheader">Attempted</div>
          <div role="columnheader">Outcome</div>
          <div role="columnheader">Status</div>
          <div role="columnheader">Error</div>
        </div>
        {rows.map((r, i) => (
          <div
            role="row"
            key={r.id}
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
            <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>
              {formatInstantUTC(r.attemptedAt)}
            </div>
            {/* Same token for both outcomes, deliberately. See ruling (5) note
                at the head of this file: colouring a failure is a verdict, and
                colouring a success is the green state the ruling forbids. */}
            <div role="cell" style={{ color: 'var(--sh-text-body)' }}>{r.outcome}</div>
            <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{r.status ?? '—'}</div>
            <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{errorCell(r)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Shared by both modes, so the page announces itself identically whichever tree
// it is mounted on. The h1 matches the nav label exactly ("Sign-in email"),
// deliberately: A119 files a live defect where the Chrome header and the page
// heading name the same surface differently, and there is no reason to add a
// second instance of it here.
function PageHeader({ headingId }) {
  return (
    <div>
      <h1 id={headingId} style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        marginBottom: 'var(--sh-space-2)',
      }}>
        Sign-in email
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-8)',
        maxWidth: '620px',
      }}>
        Every attempt to send a sign-in link, most recent first.
      </p>
    </div>
  );
}

// The demo-tree branch. No fetch, no fixture, no marks: the two marks are
// whole-table facts about live data, and rendering them as "—" here would
// present an absence of live data as an absence of sends.
function DemoSendLog({ headingId }) {
  return (
    <>
      <PageHeader headingId={headingId} />
      <Card aria-labelledby={headingId}>
        <p style={ABSENT_STYLE}>
          This view reads the live record of sign-in emails. Outside a signed-in
          operations account there is nothing to read, and no sample stands in
          for it.
        </p>
      </Card>
    </>
  );
}

export function AuthenticatedSendLog({ headingId }) {
  const localHeadingId = useId();
  const hid = headingId ?? localHeadingId;
  const [state, setState] = useState({ status: 'loading', sends: [], allTime: null });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth-sends', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('load-failed');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setState({
          status: 'ready',
          sends: data.sends ?? [],
          allTime: data.allTime ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', sends: [], allTime: null });
      });
    return () => { cancelled = true; };
  }, []);

  const ready = state.status === 'ready';

  return (
    <>
      <PageHeader headingId={hid} />

      <Card aria-labelledby={hid}>
        {state.status === 'loading' && (
          <p style={LOADING_STYLE}>Loading attempts…</p>
        )}

        {/* No retry affordance, matching OperationsRoster's live branch. A retry
            button on a read that failed for an unknown reason invites a loop;
            reloading the page is the recovery and needs no control. */}
        {state.status === 'error' && (
          <p style={ERROR_NOTE_STYLE}>The send log could not be loaded.</p>
        )}

        {/* Marks and the interpretive line render for BOTH ready cases. See the
            head of this file: an empty table is exactly when the line's claim
            is true, so it is not conditioned on having rows. */}
        {ready && (
          <>
            <Marks allTime={state.allTime} />
            <InterpretiveLine />
          </>
        )}

        {ready && state.sends.length === 0 && (
          <p style={EMPTY_STYLE}>No attempts recorded.</p>
        )}

        {ready && state.sends.length > 0 && (
          <>
            <CountLine count={state.sends.length} />
            <SendTable rows={state.sends} />
          </>
        )}
      </Card>
    </>
  );
}

// The mode switch. useOptionalAppIdentity() is null on the public demo tree
// (no AppShell provider above it) and carries the identity on the authenticated
// tree, which is the same predicate OperationsRoster.jsx:589-593 uses.
//
// The heading id is minted HERE and passed down, so both branches label their
// Card against the same h1 rather than each generating an id the other cannot
// see.
export default function OperationsSendLog() {
  const headingId = useId();
  const isAuthenticated = !!useOptionalAppIdentity();

  return isAuthenticated
    ? <AuthenticatedSendLog headingId={headingId} />
    : <DemoSendLog headingId={headingId} />;
}
