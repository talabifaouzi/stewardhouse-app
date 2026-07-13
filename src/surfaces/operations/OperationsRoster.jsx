import { useId } from 'react';
import { Card } from '../../components/Card.jsx';
import { useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { DEMO_ROSTER } from '../../data/opsFixtures.js';

// Operations Roster — O-2, demonstrative mode (Ruling 1.1; scoping at
// docs/operations-roster-scoping.md). A NEW view spanning all four account
// types (Q2), distinct from the per-type entity directories: the directories
// list data-model records, the roster lists ACCOUNTS/INVITES.
//
// TWO MODES (Ruling 1.1):
//   - demo tree (/operations)     → the DEMO_ROSTER fixture + a §7 demonstrative
//                                    caveat. Matches how the rest of the demo
//                                    Operations surface reads synthetic data.
//   - authenticated (/app/operations) → an HONEST interim state, NOT the
//     fixture. The roster is the one view Ruling 1.1 requires to be honest from
//     birth, so it must never show fictional accounts to a real operator. Live
//     rows arrive in O-3 (GET /api/roster). useOptionalAppIdentity() is null on
//     the demo tree and truthy on the authenticated tree — the mode switch.
//
// NO endpoint, no live data this slice. Rows are NON-INTERACTIVE by design:
// per the aggregate-default-with-purposeful-drill guardrail, a view with no
// real drill target renders a "detail coming" footnote rather than a dead
// click. Per-account detail + invite actions land with O-3 / the invite-form
// slice. The "Create invite" CTA's home is the top-right of the page header
// (see the reserved flex slot below) — NO placeholder affordance is rendered
// now, but the layout is ready for the button when the invite-form slice lands.

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ISO 'YYYY-MM-DD' → 'Mon DD, YYYY'. Parsed field-wise (no Date) so the day is
// stable regardless of local clock — matches the surface's formatAbsDate idiom.
function formatAdded(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTH_SHORT[m - 1]} ${d}, ${y}`;
}

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// 6 columns per the scoping: type · display name · invite email · status ·
// source surface · added (created_at). minWidth on the table keeps columns
// readable; the overflow-x wrapper scrolls it on narrow viewports.
const GRID_COLUMNS = '0.8fr minmax(140px, 1.4fr) minmax(190px, 1.7fr) 0.8fr 1fr 0.9fr';

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
          right slot stays empty in O-2 (no placeholder affordance). */}
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

      {isAuthenticated ? (
        <Card aria-labelledby={headingId}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            lineHeight: 'var(--sh-line-normal)',
            margin: 0,
          }}>
            The live roster is not yet connected. Real accounts will appear here
            once it is.
          </p>
        </Card>
      ) : (
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
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
              marginBottom: 'var(--sh-space-5)',
            }}>
              {DEMO_ROSTER.length} accounts across all four surfaces
            </p>

            <div style={{ overflowX: 'auto' }}>
              <div role="table" aria-label="Roster" style={{ minWidth: '680px' }}>
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
                  <div role="columnheader">Type</div>
                  <div role="columnheader">Name</div>
                  <div role="columnheader">Invite email</div>
                  <div role="columnheader">Status</div>
                  <div role="columnheader">Source</div>
                  <div role="columnheader">Added</div>
                </div>

                {DEMO_ROSTER.map((r, i) => {
                  const claimed = r.status === 'claimed';
                  return (
                    <div
                      role="row"
                      key={r.inviteEmail}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: GRID_COLUMNS,
                        gap: 'var(--sh-space-4)',
                        padding: 'var(--sh-space-3)',
                        borderBottom: i === DEMO_ROSTER.length - 1 ? 'none' : 'var(--sh-border-divider)',
                        fontSize: 'var(--sh-text-sm)',
                        color: 'var(--sh-text-body)',
                        alignItems: 'center',
                      }}
                    >
                      <div role="cell">{titleCase(r.type)}</div>
                      <div role="cell" style={{ color: 'var(--sh-text-primary)' }}>{r.displayName}</div>
                      <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{r.inviteEmail}</div>
                      {/* Lifecycle state, not a judgment (Path B): claimed reads
                          affirmed, invited reads pending — neither ranks the person. */}
                      <div role="cell" style={{
                        color: claimed ? 'var(--sh-text-body)' : 'var(--sh-text-muted)',
                        fontStyle: claimed ? 'normal' : 'italic',
                      }}>
                        {claimed ? 'Claimed' : 'Invited'}
                      </div>
                      <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{titleCase(r.sourceSurface)}</div>
                      <div role="cell" style={{ color: 'var(--sh-text-secondary)' }}>{formatAdded(r.createdAt)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* No dead-click drill (aggregate-default guardrail): per-account
                detail + invite actions arrive with the live roster. */}
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              fontStyle: 'italic',
              marginTop: 'var(--sh-space-5)',
              marginBottom: 0,
            }}>
              Per-account detail and invite actions arrive with the live roster.
            </p>
          </Card>
        </>
      )}
    </main>
  );
}
