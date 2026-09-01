# Filed defects and closed records

Relocated verbatim from CLAUDE.md §7, "Tap targets and control sizing (LOCKED
2026-08-14)", on 2026-08-19 (HEAD 17ad9db). The tap-target ruling itself stays in
§7. Everything below had accreted under that sub-heading without being about tap
targets.

This is where the queue recorded as unruled in
`docs/guardrail-violation-findings.md` ("2. Whether the section 7 defect queue
moves") now lives. That doc is a point-in-time survey and is deliberately left
unamended.

**Three blocks below are CLOSED records, and one carries a TRIGGER TO WATCH
note.** They exist to stop a future audit re-filing something already closed.
Read "CLOSED 2026-08-17: the four Operations directory rows are NOT a keyboard
defect" before re-filing those four files, and "CLOSED 2026-08-18: no modal opens
through the BROWSER-AUTOMATION HARNESS" before treating a harness click that
changes nothing as a product defect. The third, "CLOSED 2026-08-21: `AppShell.jsx`
can now express the fetch failed", **keeps its original filing verbatim and
therefore keeps that filing's PRE-FIX line numbers**, which is its own trap: read
the closing note before opening any line it cites.

---

**Filed: convert the two raw persistence predicates to their contexts.**
`Documentation.jsx:13` and `EnterpriseCompliance.jsx:32-33` derive
`isAuthenticated` from `!!useOptionalAppIdentity()` and use it to govern
BEHAVIOURAL divergences about persistence. They return the correct answer today
and are not defects. But the pattern ruled in P-4 is that copy describing a
behaviour must follow the same predicate that governs the behaviour, which means
the owning context's `authenticated`, not the identity test: a second predicate
is how copy and behaviour drift apart. Converting them was deliberately NOT done
in the banner slice, because it is scope creep on a blocking honesty fix, so
`EnterpriseCompliance.jsx` now carries both side by side with a comment saying
why. Small; touches two files; no endpoint, no migration. Does not block the
pilot gate: nothing is currently false.

**Filed: advisor stage-label renaming, blocked on the Q7 allowlist.** P-4 removed
the dead Rename control from `PracticeSettings.jsx` along with the paragraph
above it that instructed the advisor to use it. The stage labels still display;
only the ability to change them is gone, and it was never present. Making it
work is BLOCKED, not merely unbuilt: `practice-profile.js:33` allowlists exactly
`practiceName`, `advisorTitle` and `practiceFocus`, `:14` warns against casual
additions, and `:20-22` defers expansion to the Q7-resolution allowlist upgrade.
Stage renaming therefore depends on that upgrade landing first and cannot be
picked up as an isolated slice. CLAUDE.md §5 already carries a "Stage Rename
sibling slice" as deferred; this names its blocker.

**Filed: `/individual/welcome` CTA falls below the fold on a short viewport.**
Found during the 2026-08-14 device pass, **PRE-EXISTING and not caused by the
tap-target slice**: measured with `minHeight` forced to 0 it reads the same 746
either way. At a 640x642 viewport the CTA bottom sits at 746, i.e. 104px below
the fold, so the first onboarding screen requires a scroll to find its only
action. The other four onboarding screens are clear at the same height (letter
587, privacy 535, questions 401, reveal 517). Short-viewport layout defect on
`Positioning.jsx`; its own slice.

**Filed: line breaks intermittently missing on the enterprise/program
calendar. BANKED FOR A FULL-PLATFORM QA PASS, not recorded as a live
defect.** Observed 2026-08-17 on localhost only, so it may be a local
rendering artifact rather than anything in the tree. This entry deliberately
does not claim otherwise, and no investigation was run: it is a filing, by
ruling, not a diagnosis.

**What is NOT known, said plainly so a later reader does not inherit this as
established.** Whether it reproduces at all. Whether it appears in a deployed
build or only under the dev server. What conditions trigger it. It was seen,
not reproduced, not diagnosed, and no pattern was established, so there is no
frequency, no trigger, and no affected-view list to hand on.

**Starting point for the QA pass, verified against the tree.** The component
is `src/components/WorkshopCalendar.jsx:33`, and enterprise/program mounts it
at TWO call sites in the same ternary: `EnterpriseProgram.jsx:136` (the
authenticated branch, workshops present) and `:142` (the demo branch). That
split matters for whoever picks this up, because which branch the observation
came from is itself unknown, and the two render the same component from
different data. Establish reproduction before reading either file.

**Siblings already filed for that pass, so it is not scheduled alone:** the
`/individual/welcome` short-viewport CTA immediately above, the two raw
persistence predicates, and the advisor stage-label rename blocked on the Q7
allowlist. All four are observation-grade items waiting on a pass rather than
on a decision.

**CLOSED 2026-08-18: no modal opens through the BROWSER-AUTOMATION HARNESS,
and the code is CORRECT.** During the P-7 slice 1 render, neither the
WorkshopDetail modal nor the roster's AthleteProfile modal opened, across four
attempts by element ref and by coordinate, with no console errors. It
reproduced at HEAD with the slice stashed, so it was not caused by that work.
**FT then clicked an athlete row on the demo tree at `/enterprise/roster` in
Chrome on 2026-08-17 and the profile modal opened over the page.** That is the
observation that closes it: the product is fine and the harness is the thing
that cannot click. The standing limit this implies is recorded in §9.

**The code evidence, kept because it is what made the conclusion safe rather
than merely hopeful.** `Modal.jsx:80` returns null while `isOpen` is false and
`:92` renders `role="dialog"` when true, so an ABSENT dialog node in the
accessibility tree means the governing state never changed. It rules out the
harder possibility, a modal that mounted but rendered invisibly, which would
have been a real defect. Every enterprise modal holds its OWN local state (ten
sites across five files, `activeWorkshop`, `activeAthlete`, `addOpen` and so
on), so one broken hook cannot explain all of them. `ModalStackProvider` wraps
everything at `main.jsx:11-17` and could not be the cause even if it were
absent, since `ModalStackContext.jsx:11-16` supplies no-op defaults and the
stack is consulted only AFTER the `isOpen` guard. Nothing in the modal path has
changed since `8ecdaf3` (2026-06-17), and the FT milestone screen of
2026-07-16 exercised both `AddAthleteModal` and the WorkshopDetail attendance
editor successfully, which is after every change to that path.

**The calendar line-break observation above is PROBABLY UNRELATED.** Different
layer and different mechanism: text wrapping rather than event delivery, and
the calendar rendered correctly in every screenshot taken during this work.
Keep the two ADJACENT in the QA pass rather than merging them, because they
share one property that is worth testing once: both were seen only through this
tooling against a local dev server.

**Filed: two §7 orderings from the 2026-08-18 platform-wide scan, plus the
scan's own boundary.** The scan was prompted by the Discover score and swept
every sort, every score token and every `.slice(0, N)` in `src/`. It found four
things. Two shipped as fixes: the Discover score, cutoff and sort (recorded in
`docs/discover-surface-spec.md`), and `scoreOrg`, an exported org-ranking
function with zero consumers, DELETED in this slice. The other two are recorded
here because nothing else in the repo holds them.

**RULED 2026-08-26: filing (a) below is no longer UNRULED. The ordering STANDS
and the constant is RENAMED.** The filing is preserved verbatim beneath this
block as the record of the question, so it still opens with the word UNRULED and
still names the constant STATUS_PRIORITY. **That constant is now STATUS_ORDER**
(F-B, CLAUDE.md §5.2); read every STATUS_PRIORITY reference in the filing below
as STATUS_ORDER. FT's answers to the three sub-questions the filing poses:

1. Ordering athletes by a status each of them holds is materially different
   from ranking them. The status is a fact of the record; no score or rank
   number is rendered. The ordering STANDS.
2. The harm §7 guards against is the JUDGMENT an ordering implies, not the
   order a staff member sees.
3. The constant SHALL stop being called priority. STATUS_PRIORITY ->
   STATUS_ORDER.

**(a) UNRULED: `EnterpriseRoster.jsx:65-69` orders athletes by journey status,
best first.** It sorts on `STATUS_PRIORITY[statusFor(a)]`
(`athleteStatus.js:12-18`: Certified 1, Actively progressing 2, Not yet active
3, Outreach paused 4, Invited 5), with `localeCompare` only as a tiebreak. §7
permits severity that rates an ISSUE's triage urgency and "never a
participant"; this rates the participant, through a constant named priority.
It is a DEFENSIBLE OPERATIONAL ORDERING and it is not obviously inside the
permission §7 grants, which is why it is filed unruled rather than as a defect.
**What a ruling would have to decide:** whether ordering people by a status
each of them holds is materially different from ranking them, since the status
itself is a fact of the record rather than an assessment; whether the harm §7
guards against is the ORDER a staff member sees or the JUDGMENT it implies;
and, if the ordering stands, whether the constant should stop being called
priority, since the name is doing rhetorical work the data does not support.

**(b) PROBABLY FINE, recorded so a future scan does not rediscover it as
novel: `ProgramOutputs.jsx:73` orders recipient organizations by dollars.** It
sorts `b.totalAmount - a.totalAmount`. The figure comes from the INSTITUTION'S
OWN GIFT RECORD rather than from any StewardHouse assessment, so it orders orgs
by a fact the institution already holds about its own giving. That is the same
shape as `History.jsx:67`, where a funder's own orgs are ordered by their own
totals. Filed rather than dismissed because "a list of organizations sorted
high to low" is exactly the pattern a scan should stop on, and the next reader
deserves the reasoning rather than having to re-derive it.

**The scan's BOUNDARY, which is the useful part.** Every other sort in the tree
is chronological or alphabetical. Every `.slice(0, N)` is initials, string
truncation, ISO date slicing, a column subset, a show-all toggle, or the next
four sessions chronologically. **No other cutoff-by-computed-value exists.** A
later scan can start from that and look only for what is new.

**The ASYMMETRY the scan exposed, which outlasts all four findings.**
`rejectRankKeys` (`functions/_lib/gate.js:62`, key set at `:57-60`: rank,
score, priority, suggestion, suggested, ordering, progression) enforces the
no-ranking rule on what gets **STORED**, at every participant write path.
**NOTHING enforces it on what gets COMPUTED and RENDERED**, which is where all
four findings sit: the Discover score was computed at render from fixture
fields and never written anywhere, and would have passed the write guard
untouched because it never reached it. The guardrail is real and it is enforced
in one layer only.

**CLOSED 2026-08-17: the four Operations directory rows are NOT a keyboard
defect.** The item filed during the withdraw slice (`onClick` on `role="row"`
with zero `tabIndex` and zero `onKeyDown`, so rows read as unreachable by
keyboard) is **CLOSED, not deferred**.

The mechanism is that the row was never the only path. Each directory puts a
`Link` in its lead cell (`IndividualsDirectory.jsx:327`,
`InstitutionsDirectory.jsx:323`, `AdvisorPracticesDirectory.jsx:336`,
`OrganizationsDirectory.jsx:431`, each inside a `role="cell"`), and each
`onRowClick` opens with `if (e.target.closest('a')) return;`
(`:63`, `:47`, `:58`, `:91`) before navigating to the SAME destination
the `Link` points at. So the `Link` is the accessible primitive and the row
`onClick` is a mouse convenience widening the hit area to the full row. Adding
`tabIndex` would insert a SECOND tab stop per row pointing where the adjacent
link already points, which is a cost rather than a fix.

`OperationsRoster.jsx:155-163` is NOT a counter-example, even though it carries
the full keyboard pattern. Its rows contain no link, so there `tabIndex` is the
ONLY keyboard path rather than a duplicate of one.

What remains true and is deliberately NOT being fixed: each row carries
`cursor: 'pointer'` and a full-width hover background that only a pointer can
use, and the row has no accessible name. A sighted mouse user is told the whole
row is clickable; a keyboard user is not. That is a cosmetic asymmetry over an
already-reachable destination, not an access barrier.

**TRIGGER TO WATCH.** A future audit grepping for `onClick` without `tabIndex`
will re-flag these four files, because the grep cannot see the lead-cell `Link`
or the `closest('a')` guard. This entry is what closes that loop: read it before
filing them again.

**CLOSED 2026-08-21 (`faacb67`): `AppShell.jsx` can now express "the fetch
failed".** The filing below is preserved verbatim as the record of why the slice
existed; it no longer describes the tree. **Every `AppShell.jsx` line number in
it refers to the PRE-FIX tree** and will mislead anyone who opens the file at
HEAD. `App.jsx:30` is the one citation that still holds.

**Filed: `AppShell.jsx` cannot express "the fetch failed", so ANY 5xx reads as
logged out.** `AppShell.jsx:63-64` calls `res.json()` on the `/api/me` response
with no `res.ok` check, and both failure shapes converge on one state: an
unparseable error body rejects into the `.catch` at `:87-88`, a parseable one
falls to the `else` at `:83-85`, and either way `setStatus('unauthenticated')`
runs and `:133-134` renders `<Navigate to="/signin" replace />`. **All four
authenticated surfaces sit under this single shell** (`App.jsx:30`), with their
`RequireType` guards nested inside it, so the redirect fires before any of them
render and one failed fetch signs a user out of all four at once. **PRE-EXISTING,
and it fires on ANY 5xx** rather than on any particular cause. It shows a
signed-in user the signed-out state, which is wrong rather than merely unhelpful;
whether that reaches the pilot gate's blocking bar is not ruled here. Surfaced by
the BMF availability work, where a D1 import makes `/api/me` return 500, and
ruled OUT of that arc at `docs/bmf-load-scoping.md` section 13: the shell gains a
third status so a failed fetch renders a retry state rather than a redirect.
Touches one file. No endpoint, no migration.

**What shipped.** A fourth status, `'unavailable'`, carrying one of two reasons.
`fetch()` throwing is `'unreachable'`; a non-ok response is `'server'` and
returns before `json()` is called; a 2xx whose body will not parse is also
`'server'`, because the request arrived and the server answered and only the
answer was unusable (`AppShell.jsx:138-159`). The `data && data.user` test is
unchanged, so the legitimate 200-with-null still reaches `'unauthenticated'`
(`:160`) and still redirects (`:330`). A failed fetch instead renders a retry
panel at `:247`, which EARLY-RETURNS rather than mounting `AppIdentityProvider`,
because roughly 35 sites treat provider presence as equivalent to
`status === 'ready'`.

Behind it is a bounded ladder of 1s/2s/4s/8s/16s (`:40`), six attempts and about
31s cumulative, chosen so it clears the measured 14,359 to 17,647 ms BMF import
window rather than capping inside it. At the cap the panel stops and offers Try
again beside a link to sign-in; nothing retries afterward without a click.

**What this does NOT close.** The BMF availability ruling itself
(`docs/bmf-load-scoping.md` section 13) stands, along with both preconditions it
put on a production load. And the panel it introduced has its own filing, the
12px action-row spacing entry above, which is an affordance question rather than
a behavioural one.

**Filed: the AppShell retry panel puts a state reset and a navigation 12px
apart.** The cap-state action row (`AppShell.jsx:292-306`) places the "Try again"
`<Button>` and the "Sign in again" `<Link>` in one flex row with
`gap: var(--sh-space-3)` (12px), separated only by a middot. **Both controls are
CORRECT and were verified at `faacb67`:** Try again is
`onClick={() => setAttempt(0)}` (`:298`), a pure state reset that re-runs the
fetch in place, and the link is a client-side `<Link to="/signin">` (`:317`) that
navigates away. So this is a spacing and affordance question, not a behavioural
one.

**What makes it worth filing is that the two outcomes are not similar.** A
mis-hit on the link leaves the retry state entirely and lands on sign-in, which
is a longer way back than the control the user meant to press. **A second
observation for whoever picks it up:** the button takes `Button.jsx`'s default
`size="normal"` (about 32px), which §7 marks as a deliberately non-compliant
pointer-density size for inline row actions. This is not an inline row action; it
is the only recovery control on a full-viewport panel, on a phone-first product.
Whether it should be `size="lg"` belongs to the same question. No fix proposed.

**Filed: the Marcus Thompson person row is structurally unclaimable, which is a
dead end rather than a data state.** The production `person` row for Marcus
Thompson carries `invite_email` NULL. The `user.create.before` hook
(`functions/_lib/auth.js:303-321`, shipped `1c64296`, 2026-08-16) refuses
`createUser` unless a `person` row exists whose `invite_email` matches the
supplied address AND whose `auth_user_id` is NULL (`:308-313`). A NULL
`invite_email` cannot match any supplied address, so the refusal at `:320` is
unconditional for that row. The pre-send allowlist reaches the same result one
step earlier: `functions/api/auth/[[route]].js:98-103` admits an address only if
it has an `auth_user` row or a matching `person.invite_email`, and this row has
neither.

**No sign-in path recovers it.** Not a magic link, not an allowlisted send, not a
retry. The only remedies are a write that gives the row an `invite_email`, or
replacing the row.

**No fix proposed, because the remedy is a ruling rather than a patch.** What has
to be decided first is what Marcus's production row is FOR: a canonical demo
record, a real claimable account, or a fixture that should never have had a
production row at all. Each answer implies a different write, and one of them
implies no write.

**The MECHANISM is already recorded in CLAUDE.md §5, Advisor row.** This entry is
the DEFECT record and deliberately does not restate the reasoning, so the two
cannot drift apart.

**Filed: TWELVE `rgba()` colour literals across five files, left standing by the
cream-token slice.** That slice removed the last nine HEX literals from
components. It did not touch `rgba()`, and the distinction is exactly where §7's
two sentences part company. **"No hex literals in components" names hex
specifically and is now satisfied.** The sentence above it, "Every color /
spacing / radius / type-size goes through a `--sh-*` token", is not, and these
twelve are what remain outside it.

```
  src/components/Card.jsx:29                        rgba(60, 50, 30, 0.06)
  src/surfaces/landing/Landing.jsx:198              rgba(60, 50, 30, 0.06)
  src/surfaces/individual/IndividualSurface.jsx:929 rgba(60, 50, 30, 0.05)
  src/surfaces/individual/Plan.jsx:119              rgba(60, 50, 30, 0.04)
  src/surfaces/individual/GivingModeler.jsx:278     rgba(255,255,255,0.7)
  src/surfaces/individual/GivingModeler.jsx:298     rgba(255,255,255,0.7)
  src/surfaces/individual/GivingModeler.jsx:308     rgba(255,255,255,0.95)
  src/surfaces/individual/History.jsx:146           rgba(255,255,255,0.75)
  src/surfaces/individual/History.jsx:163           rgba(255,255,255,0.7)
  src/surfaces/individual/History.jsx:333           rgba(255,255,255,0.65)
  src/surfaces/individual/IndividualSurface.jsx:820 rgba(255,255,255,0.75)
  src/surfaces/individual/Team.jsx:164              rgba(255,255,255,0.3)
```

**Eight of the twelve are alpha-variant whites sitting directly beside figures
the cream slice retokenised.** `IndividualSurface.jsx:820` is EIGHT lines from
the `:812` swap and `History.jsx:146` is NINE lines from `:137`; both are the
label text under the large serif number, on the same `--sh-bronze` panel. So a
reader opening either file after the slice sees a tokenized figure and a
hardcoded label in one glance, which is the shape most likely to be read as an
oversight rather than as scope.

**The open question, and it is a real one rather than a formality: whether
alpha-variant whites want tokens at all.** There are FIVE distinct alphas across
the eight white sites (0.3, 0.65, 0.7, 0.75, 0.95), which is either five tokens
for eight consumers or one token plus an opacity convention the system does not
currently have. The four dark sites are ONE colour at THREE alphas (0.04, 0.05,
0.06) and are all box-shadow, which may be a different answer again. **No fix
proposed**, and no naming proposed, because the count is what makes it a design
question rather than a sweep.

**COUNT CORRECTION, recorded because the undercount is instructive rather than
embarrassing.** This was scoped as EIGHT sites in FOUR files, and both figures
were wrong. The source was a diagnostic that deduplicated by VALUE
(`sort -u -k2`), so it printed one site per distinct `rgba()` string and silently
dropped every repeat: `GivingModeler.jsx:298`, `History.jsx:163`,
`IndividualSurface.jsx:820`, and `Landing.jsx:198`. **The fifth FILE went with
them**, which is why the scoping described "the same four files" when Landing is
a fifth and is not an Individual-surface file at all. This is the §6 hazard
verbatim, a diagnostic that did not count what it claimed to count, and it
survived into a ruling because the deduplicated output looked like an inventory.
A `grep -c` against the same pattern would have said twelve immediately.

**CLOSED 2026-08-21: the `SignIn.jsx` + `Landing.jsx` `res.ok` item is NOT A
DEFECT, and it was never filed here in the first place.** Both halves matter. The
item existed ONLY in the body of `faacb67` ("Found and deferred to one follow-up
slice, not fixed here: SignIn.jsx:39-47 and Landing.jsx:47-55"), and nowhere
else: a grep of this file before this entry found no `SignIn`, no `get-session`,
and no `Landing.jsx` outside the two `rgba()` rows. §7 names this file as where
live items go. **A live item discoverable only by reading a commit message is a
FILING gap, not merely a scoping one**, and this entry both files it and closes
it so the gap is visible rather than silently repaired.

**As filed, the fix is a NO-OP.** Adding `if (!res.ok) throw` sends the throw
into the existing `.catch` (`SignIn.jsx:45-47`, `Landing.jsx:53-55`), which sets
`'unauthenticated'`. That is the SAME state a parseable error body already
reached through the ternary in the second `.then`, where `data.user` is
undefined. Same state, same render, same pixels. The diff changes which line
performs the assignment and nothing a user or a test can observe.

**The asymmetry with AppShell is PRINCIPLED, not a matter of degree.** There the
identical addition was load-bearing because the DESTINATION was wrong: the shell
converged on `<Navigate to="/signin">`, telling a signed-in user they were logged
out. Here the convergence destination is already correct at both sites, which is
why the same two lines are worth shipping in one place and not the other.

**`res.ok` is NOT a clean discriminator on this endpoint, for a reason the
deferral did not anticipate.** The deferral's worry was that signed-out might be
a non-2xx. It is not: signed-out is a 200 on BOTH paths, `session.mjs:43` (bare
`return null`) and `:189` (`ctx.json(null)`, after `deleteSessionCookie` at
`:181`). But `:233` throws `UNAUTHORIZED` immediately after
`deleteSessionCookie(ctx)` at `:232`, when a refresh-due session was deleted
concurrently. **That caller genuinely IS signed out** and their cookie is already
gone. So a non-2xx exists whose correct reading is `'unauthenticated'`, and any
fix mapping `!res.ok` onto an error state gets it wrong in the direction of
showing a failure panel to someone who should be shown the sign-in form.

**The verified endpoint contract, recorded because it is the expensive part of
this pass and the reason the item was deferred at all.** `/api/auth/get-session`
is entirely better-auth's: `functions/api/auth/[[route]].js` intercepts only
`POST /api/auth/sign-in/magic-link`, and its own comment at `:41` says
get-session passes straight through. The contract is therefore
`node_modules/better-auth/dist/api/routes/session.mjs` (better-auth 1.6.20, route
defined at `:17`). **`cookieCache` is DISABLED** (`functions/_lib/auth.js:169`),
which kills the entire cached-session branch, and `deferSessionRefresh` is unset.
Live paths only:

```
  :43        no session cookie                     200   body `null`
  :181,:189  session missing from D1, or expired   200   body `null`
  :190-197   valid, dontRememberMe/disableRefresh  200   {session, user}
  :246-252   valid, refreshed or not needing it    200   {session, user}
  :232-233   updateSession falsy (concurrent del)  401   error JSON
  :254-257   any other throw                       500   error JSON
  :40        POST without deferSessionRefresh      405   unreachable, both GET
```

The route's own OpenAPI block types the 200 body as `["object", "null"]` at
`:28`. **The bare `return null` at `:43` is not an empty body:** `better-call`
1.3.6 `dist/to-response.mjs:133-135` stringifies `null` and sets
`application/json`, and `:157` returns a `Response` with no status, so the wire
form is 200 carrying the four bytes `null`, which `res.json()` parses. Identical
in shape to `/api/me`'s legitimate 200-with-null.

**GREP CAUTION.** `session.mjs:306`, `:319`, `:331` and `:346` also throw
`UNAUTHORIZED`, but they sit in `getSessionFromCtx` and the session-middleware
helpers, NOT in the `/get-session` route handler, which ends at `:258`. A grep
for `UNAUTHORIZED` in that file over-reports by four.

**What each site's failure actually costs, both verified against the tree.**
`SignIn` degrades safely BY ACCIDENT: `'unauthenticated'` is both the failure
default and the correct answer for most `/signin` traffic, so the failure
rendering and the correct rendering are the same page (the form at `:132`, which
`'unauthenticated'` reaches by failing the `:112` and `:128` guards). A signed-in
visitor loses only the `:129` convenience redirect. `Landing` is cosmetic: the
whole consequence is which of two buttons occupies the reserved 37px at
`:113-128`. **One caveat worth carrying:** the button offered on failure is
"Already invited? Sign in", which navigates to `/signin`, so the recovery path
routes THROUGH the other affected site. Still cosmetic; not self-contained.

**Filed: `SignIn.jsx`'s session check has no timeout, and its checking state is a
full-viewport takeover.** `SignIn.jsx:112-126` renders "Checking your session…"
over the whole viewport while `sessionStatus === 'checking'`. A response that
FAILS is handled; a fetch that HANGS is not. There is no timeout, no abort and no
ladder, so a hung request leaves the user on that screen indefinitely with no
form and no action. **`res.ok` does not touch this, because a hang never produces
a response to test**, which is why it is filed separately from the item closed
above rather than folded into it.

**This is a STRICTLY WORSE outcome than the defect just closed**, and it is on
the same file and the same fetch. Whoever opens `SignIn.jsx` should meet it here
rather than rediscover it.

**`Landing.jsx` is immune BY CONSTRUCTION, not by handling.** Its `'checking'`
branch renders `null` at `:127` inside the box at `:113-118`, whose
`minHeight: '37px'` reserves the space either way, so a hang there shows a page
with no button. That is the cosmetic outcome again.

**No fix proposed.** Found during the 2026-08-21 scoping pass on the item closed
above, and deliberately not investigated on its own.

**Filed: the plain-vite lever does not establish WHICH failure branch it
produced, and `faacb67`'s verification inherited that ambiguity harmlessly.**
That commit recorded "Plain vite, `/app/individual` reaches the panel with reason
`'server'`". In `AppShell.jsx`, `'server'` covers BOTH a non-ok response AND a
2xx whose body will not parse, so reaching it does not establish which one plain
vite actually returned at the endpoint.

**Harmless there, because AppShell treats the two identically.** Not harmless
anywhere the two are DIFFERENT branches, which is exactly the position the
`res.ok` item above would have been in had it shipped: `res.ok` tests one of them
and not the other, so a lever that might be exercising either proves neither.

**The rule this implies, for any future slice reaching for it:** establish the
ACTUAL status code plain vite returns at the endpoint under test, rather than
inheriting the AppShell result. One `curl -i` against the running vite server
answers it. Recorded here because the lever is cheap and will be reached for
again, and because "it worked for AppShell" is precisely the reasoning that would
carry the ambiguity forward.

**Filed: the enterprise overview renders a null progression rate as the literal
`null%`, at three sites that bypass the helper written to prevent exactly that.**
Observed incidentally during the `844ea31` verification run, on the
AUTHENTICATED enterprise overview with an empty roster: "null% of program" on the
Actively progressing tile, and "GPS completed by 0 of 0 athletes (%)" on the
supplementary line. **Verified against the tree rather than carried forward on
the observation.**

**This is a STATED-VERSUS-ACTUAL gap, not a cosmetic bug, which is why it is
filed as such.** `enterpriseStats.js:50-51` states the rule in a docblock ("R4:
`rateBaseTotal === 0` → rates are NULL … NEVER 0%") and `:55-57` implements it
correctly, returning null. `RateDisclosure.jsx:14-18` then exports the display
half, `fmtRate`, whose own docblock says a null rate "renders 'Not tracked',
NEVER 'null%'". **The rule is stated twice in the code and the helper
implementing it is exported from the same surface. Three render sites do not
call it.** A bare `null%` is further from R4 than the `0%` R4 was written to
forbid, and P-2 FORK 1 rests on the same denominator. This is the class P-0
exists to close: the tree contradicting what the repo says about it.

**The three sites, all the ELSE half of a `consentAware` ternary whose IF half is
correct.** `EnterpriseOverview.jsx:95` and `EnterpriseRoster.jsx:93` are
identical: the `consentAware` branch at `:94` / `:92` tests
`activelyProgressingPct == null` and renders 'Not tracked', while the else falls
through to an unguarded template literal. `EnterpriseOverview.jsx:118` is the
same shape against `gpsRate`, its guarded twin being `:115-117`.

**The two symptoms differ, and the reason is worth recording because it will
confuse whoever greps for the string.** `:95` and `:93` are TEMPLATE LITERALS, so
`${null}` stringifies to the four characters `null` and the user sees "null%".
`:118` is JSX interpolation, where `{null}` renders NOTHING, so the same null
value produces "(%)" with the literal percent sign left stranded. **One null,
two different wrong outputs, and only one of them contains the word null.**

**The trigger is exactly and only: the authenticated tree with ZERO athletes.**
`enterpriseStats.js:38` derives `consentAware` as
`athletes.some((a) => typeof a.claimed === 'boolean')`, and `[].some()` is false,
so an empty roster takes the else branch while `:53` has already returned null
for the zero denominator. A NON-empty authenticated roster is safe: every
server-emitted element carries `claimed` (`functions/api/athletes.js:109`,
`claimed: !!row.person_id`), so `consentAware` is true and the guarded branch
runs. **The demo tree is unaffected** and this is not a fixture regression:
fixtures omit `claimed`, so `consentAware` is false there too, but `rateBase`
collapses to the full non-empty roster and the rates are real numbers.

**REACHABLE IN PRODUCTION TODAY, and the urgency is higher than "empty state"
suggests.** It needs no fresh local store: any production staff account whose
institution has no `athlete` rows renders it on sign-in. **And that account
cannot leave the state**, because enterprise writes are gated dark (§5.1: no
staff row carries `$.enterprise.demo_gate`, so `POST /api/athletes` returns 403).
So for a newly provisioned institution this is not an edge case reached by
unusual data, it is the FIRST screen, and it is stuck until FT designates the
gate. `+staff` on production is in exactly this position.

**One near-miss NOT filed, checked so a later scan does not re-open it.**
`ProgramSummary.jsx:99-100` reads the same two values and routes both through
`fmtRate`, so it is correct. `CohortComparison.jsx:43-49,62-63` uses a bare
`fmtPct` on `gpsRate` / `certRate`, but those come from SNAPSHOT rows, whose rate
columns are NOT NULL (E-Write-5 zero-athlete guard writes 0), not from
`computeStats`. Different source, not the same defect.

**No fix proposed.** The shape is obvious (call `fmtRate` at the three sites),
but the ruling is not: whether the else branch should render 'Not tracked' or
whether a zero-athlete roster should render no rate line at all is a copy
decision on the first screen a real institution ever sees.

**Filed: seven items from the enterprise roster-import arc, each re-proven
against HEAD `8e6c78f` before being written here.** All seven lived only in
session minutes until this commit. Every citation below was verified at HEAD in a
read-only pass rather than carried forward, because this arc had already shipped
one set of stale session-minute citations. **Two of the seven do not say what the
minutes said**, and both corrections are recorded in place rather than quietly
applied. Nothing below proposes a fix, and nothing below is ruled except where it
says so.

**RULED 2026-08-26: F-C is no longer UNRULED, the BLOCKING CONDITION below is
DISCHARGED, and the filing's "send script" language is WRONG.** The filing is
preserved verbatim below as the record of the question, so it still reads UNRULED
and still says a send script must not be authored. **Both of those are now false,
and this block is the correction.**

**There is NO send script, and there never will be. The invite is a STAFF ACT in
the UI**, taken after an offline conversation and athlete acknowledgment, through
an invite endpoint. Every place the filing below says "send script" should be
read as that staff act. The BLOCKING CONDITION was written to stop whoever wrote
the send path from deciding the transition unilaterally; **FT has now decided it,
so the condition has done its job and is discharged.** Nothing is blocked.

**The transition is an ATOMIC invite act.** Setting `enrollment_status='Invited'`,
stamping `person.invited_at`, and minting the person row succeed or fail together,
via `env.DB.batch()`, the D1 implicit transaction whose heterogeneous multi-table
precedent is `functions/api/athletes/[id].js:107`.

**`resolveStatus` is NOT modified.** The filing's mechanism below stands
unchanged and is not a defect to be fixed: `resolveStatus` never advances an
athlete off `'Pending'`, and the invite act is what moves the row, not the
milestone path. So the branch-by-branch analysis below remains accurate about
`functions/api/athletes/[id].js:177-183`, and the `certified: true` escape it
describes remains the only way the milestone endpoint can change the value.

**The atomic unit is the three SQL writes only.** The send, its sent-stamp, and
the conditional UNIQUE-collision bind cannot be batch members: `env.DB.batch()`
requires every statement compiled with parameters bound before execution, and
those three depend on outcomes not yet observed. The send stays what
`athletes.js:228-236` already describes, a step after the committed act whose
failure degrades an outcome string rather than rolling anything back.

**Filed (F-C): `resolveStatus` strands a `'Pending'` athlete permanently, and
`certified: true` is the only exit.** `functions/api/athletes/[id].js:177-183`,
`resolveStatus`, the act-derived `enrollment_status` mirror. With
`current = 'Pending'`, branch by branch: `:178` `f.certified === true` returns
`'Certified'` and is the sole escape; `:180` requires `current === 'Invited'` and
does not match; `:181` requires `current === 'Certified'` and does not match;
`:182` falls through and returns `current`, unchanged. **The escape carries no
intermediate state.** A Pending athlete does not pass through `'Active'` on the
way to `'Certified'`; one write moves it the whole distance.

**Milestone columns are still written while the mirror stays frozen.** `:238-246`
sets `lessons_count`, `gps_completed_at`, `certified` and `cert_at` from the body
BEFORE `:247` computes `set.enrollment_status = resolveStatus(...)`. So an
athlete can accumulate all nine lessons and a GPS completion date while
`enrollment_status` still reads `'Pending'`, and every consumer deriving from the
status sees none of it.

**The complete accepted input space, which is what makes this exhaustive rather
than illustrative.** `ALLOWED_MILESTONE_KEYS = ['lessons', 'gpsCompleted',
'certified']` at `:144`, enforced by `validateMilestoneBody` at `:150-153` (any
other key returns 400, never silently dropped) and `:154-156` (at least one
required). The three are validated at `:158-164` (integer 0..9), `:165-168`
(boolean) and `:169-172` (boolean). **Under every combination the endpoint
accepts except `certified: true`, the mirror is returned unchanged.** There is
one call site: a repo-wide grep for `resolveStatus` returns the docblock at
`:137`, the definition at `:177`, and the call at `:247`, and nothing else.

**Reachability: unreachable at import, reachable after claim and delegate.** The
permitting gate is `functions/api/athletes/[id].js:231`, in `onRequestPut`:
`row.management_mode !== 'delegated' || row.person_id == null` returns 403. An
imported athlete holds NULL in both columns, so both disjuncts fire and every PUT
is refused. The gate opens once the athlete claims their account and chooses
delegated. **Neither of those two paths writes `enrollment_status`:**
`bindAthleteRows` in `functions/_lib/auth.js` sets `person_id` only, and
`functions/api/athlete-consent.js:67` sets `management_mode` and `updated_at`
only. The row is therefore still `'Pending'` at the exact moment staff writes
become possible, and `:182` holds it there from then on.

**BLOCKING CONDITION, FT-RULED 2026-08-26, stated as a requirement of this filing
and not as advice: F-C MUST BE RULED BEFORE THE SEND SCRIPT IS WRITTEN. The send
script may not be authored while this filing is UNRULED.** The condition attaches
here rather than to the send script because the send script is the thing that
would move rows off `'Pending'`, so whoever writes it is the first person with a
reason to decide what that transition is. **A future reader who arrives at the
send script without having read this filing is exactly the reader this condition
exists to stop.** If you are about to write the send path: the question is open,
and it is open here.

**Filed (G1): one imported athlete in an attendance batch discards the whole
batch, and the refusal names a cause that is not the cause.**
`functions/api/workshops/[id]/attendance.js`, `onRequestPut`. Trace of a batch
containing one Pending athlete. It **passes** the roster-membership query at
`:139-145`, whose only status filter is `.where('enrollment_status', '!=',
'Sunset')` at `:144`, so the row is returned into `validAthletes`. It therefore
**passes** the count check at `:146-148`, because `validAthletes.length` still
equals `athleteIds.length` and the 400 at `:147` does not fire. It is **rejected**
by the D7 claim gate at `:173-175`, `a.management_mode !== 'delegated' ||
a.person_id == null`, both disjuncts true for an imported athlete.

**The whole batch is discarded rather than the offending entry, and two separate
things cause that.** The `return` at `:177` exits the handler before the upsert at
`:185`, so nothing is written. And the `.filter().map()` at `:173-175` collects
offending ids only in order to name them in the message; **it never partitions the
batch into a writable half and a rejected half**, so no code path exists in which
the other athletes' marks survive. One imported athlete costs every other
athlete's attendance mark and note in that request.

**The exact user-facing message, at `:178`, returned with status 403 at `:179`:**
"Cannot record attendance — athlete(s) have not delegated management to staff (or
the linked account was removed): " followed by the offending ids. **It attributes
the failure to consent state and to nothing else.** Both causes it offers are
consent or claim causes: the athlete declined to delegate, or the linked account
was removed. **Neither import state nor the word Pending appears anywhere in it**,
so a staff member is told something about the athlete's choices that is not true
of an athlete who was imported and never invited. **The message also lists
athletes by raw id**: `:175` collects them with `.map((a) => a.id)` and `:178`
interpolates `notDelegated.join(', ')` into the message. A raw athlete id appears
nowhere in the staff UI, so the identifiers it hands over cannot be matched to
anything on screen.

**Filed: the staff-writability predicate is hand-maintained in FIVE places, not
three, and the server pair and the client trio are not written the same way.**
The session minutes recorded three copies. **The tree has five**, located by
content rather than by remembered line number.

**The server pair, negated reject form**, both `management_mode !== 'delegated'
|| person_id == null`: `functions/api/athletes/[id].js:231` (`onRequestPut`, the
milestone-write gate) and `functions/api/workshops/[id]/attendance.js:174`
(`onRequestPut`, the D7 whole-batch gate).

**The client trio, positive allow form**, all `claimed === true && managementMode
=== 'delegated'`: `src/surfaces/enterprise/shared/enterpriseStats.js:37`
(`computeStats`, as `isWritable`, which sets the FORK 1 rate denominator);
`src/components/AthleteProfile.jsx:53` (as `isWritable`, gating the milestone
editor); and `src/components/WorkshopDetail.jsx:68` (as `canRecord`, gating
per-athlete attendance rows). **The last two are the pair the minutes omitted.**
`athleteStatus.js:30` is NOT a sixth copy: it sits in `accessLabel` and returns a
display string rather than a writability decision.

**The two forms are not identical, and the difference is in the null test.** The
server tests `person_id == null`, loose equality, true only for `null` and
`undefined`. The client tests `claimed`, which `functions/api/athletes.js:109`
derives as `claimed: !!row.person_id`, false for `null` and `undefined` **and also
for the empty string and 0**. **The divergence, with its direction: for an athlete
holding an empty-string `person_id` and `management_mode = 'delegated'`, the
server ALLOWS the write while all three client gates hide the affordance.** That
is the authority failing open against its own mirrors. It requires a falsy
non-null value in a TEXT foreign-key column, so it is **practically unreachable**,
and it is recorded as a semantic difference between the authority and its copies
rather than as an observed failure.

**Filed: CLAUDE.md's E3 snapshot-survival claim is UNVERIFIABLE from the tree.**
The claim sits at `CLAUDE.md:205`, inside the E-Write-5 cohort-snapshot paragraph
of the §5 Enterprise row, immediately before ENTERPRISE WRITE ARC COMPLETE, and
reads verbatim: "**E3 survival proven in smoke: anonymizing an athlete leaves
already-taken snapshots byte-identical** (frozen aggregates, the arc's capstone
invariant)."

**Verifying it would need snapshot rows to have existed, an anonymize to have run
against them, and a byte comparison afterward. None of the three is reproducible
from the tree.** No such smoke exists: `scripts/` holds thirteen entries and the
only smokes are `smoke-p2-screen.mjs`, `smoke-p3c-run.mjs` and
`smoke-p3c-seed.mjs`, none of which is an E3 or snapshot-survival smoke. **No
script writes a snapshot row:** a repo-wide grep for an insert into
`cohort_period_snapshot` returns one hit, `functions/api/snapshots.js:153`, the
endpoint itself, and the two script files that mention the table do so only in
PRAGMA nullability assertions. **Both local stores hold zero rows** in
`cohort_period_snapshot`, the config-resolved `e7ff` store and the frozen `7202`
orphan alike. **The only creation path is a gated staff POST through the running
app**, so nothing automated can reach the precondition the claim rests on.

**`--remote` was not attempted**, per the read-only scope of the pass that
produced this filing, so the claim is unverified rather than refuted.

**Filed: three comments are stale, and they are stale in three different ways.
Migration 0020 falsified exactly ONE of them.** The session minutes recorded all
three as falsified by 0020. That attribution is wrong for two of the three, and
the correction matters because it changes which slice each one belongs to.

**0020 falsified `functions/api/athletes.js:101-105`, the comment above the
`status` emission in `toAthleteElement`, in two clauses.** It reads:
"enrollment_status is CHECK-constrained to the 5-value enum (migration 0016) and
STATUS_MAP covers all five, so this lookup is always defined". **First, "the
5-value enum (migration 0016)": the CHECK admits six values as of 0020**, so both
the count and the citation are now incomplete. **Second, "so this lookup is always
defined": false.** `STATUS_MAP['Pending']` evaluates to `undefined`, and the same
comment records that the `?? 'active'` fallback was deliberately removed, so
nothing catches it. **What survives is the middle clause**: STATUS_MAP does still
cover all five of 0016's values. It is the inference drawn from it that broke.

**`scripts/smoke-p3c-seed.mjs:48` carries a stale recitation but a TRUE
assertion.** Line `:48` recites the enum as
`'Invited','Active','Stalled','Sunset','Certified'`, which 0020 made incomplete.
But the assertion it supports at `:47`, "all four in-enum for the 0016 CHECK",
**remains true**: the four seeded values at `:49-52` are all still in-enum. Only
the parenthetical list is out of date.

**`functions/api/athletes.js:64-68`, the STATUS_MAP docblock, is stale for a
different reason and belongs to a different slice.** 0020 falsified no clause in
it. Checked individually: "roster-add only ever creates 'Invited' athletes" is
still true at `athletes.js:209`, and "the map is not yet exercised beyond
'Invited'" is still true of roster-add. **The stale clause is "Full reconciliation
lands with the progress-write slices", and it went stale at P-2 (`6f1b501`)**,
when the progress-write slices landed and the reconciliation did not happen.
0020's only bearing on this comment is that the map no longer covers the enum,
which this comment never claims.

**Filed (F-D): the persisted rate columns fall back to 0 where the render layer
returns null, and the cause is the SCHEMA rather than a code choice.**
`functions/api/snapshots.js:145-147`, in `onRequestPost`, computes `gpsRate`,
`certRate` and `attendanceRate` with a zero-denominator fallback of `0`.
`src/surfaces/enterprise/shared/enterpriseStats.js:51-53`, in `computeStats`,
computes the same three rate concepts with a zero-denominator fallback of `null`,
under a docblock at `:49-50` that names R4 and gives the reason: rates are NULL
"NEVER 0% (which would read as a real 'nobody progressed' measurement)".

**R4's null choice was never adopted on the persisted side, and could not have
been without a migration.** `PRAGMA table_info(cohort_period_snapshot)` at HEAD
shows `gps_rate`, `cert_rate` and `attendance_rate` all `notnull=1`. **The
nullability work that did happen covered only the unsourced counters:** migration
0013 made `dollars_moved` and `avg_weekly_engagement` nullable, 0017 made
`gifts_count` nullable, and `snapshots.js:164-167` duly writes `null` to all
three. **The three rate columns were never included in that work.** So the `0` at
`:145-147` is not a divergent decision a code edit could reverse; it is the only
value the schema permits, and closing the divergence requires a migration.

**The NOT NULL fact is already recorded once in this document, in a different
filing and for a different purpose**, in the near-miss paragraph of the `null%`
filing above, which notes that `CohortComparison` reads snapshot rows "whose rate
columns are NOT NULL (E-Write-5 zero-athlete guard writes 0)". That filing used
the fact to rule a site OUT of its scope. This filing is about the fact itself.

**True independent of Pending.** Every element holds for a roster containing no
Pending athlete, and all of it predates 0020.

**Filed: the render side and the persisted side divide by different populations,
which is a separate item from the null-versus-0 divergence above.** FT ruled on
2026-08-26 that this is its own filing rather than a sub-finding of F-D, and the
reason is that the two are independently true: closing the null-versus-0 gap
would leave this one exactly as it is.

**The two sides do not compute the same quantity.**
`src/surfaces/enterprise/shared/enterpriseStats.js:39`, in `computeStats`, sets
`rateBase` to the FORK 1 institution-writable subset when `consentAware` holds,
filtering on `isWritable` at `:37`, and `:40` takes `rateBaseTotal` from that
subset. `functions/api/snapshots.js:116-126`, in `onRequestPost`, derives
`athletes_count` at `:119` from the **full non-Sunset roster**, its only
predicates being `institution_id` at `:124` and `enrollment_status != 'Sunset'` at
`:125`. **That query selects neither `management_mode` nor `person_id`**, at
`:118-123`, so the endpoint has no writable-denominator concept available to it at
all.

**So a rate rendered on screen and the same-named rate frozen into a snapshot
answer different questions**, one about athletes the institution may write for and
one about every athlete on the roster, and neither surface says so.

**Independent of Pending, and predating 0020.** Both denominators were in place
before 0020, and the mismatch holds for a roster containing no Pending athlete.
**Pending only widens it**, by adding rows that enter the snapshot denominator
while contributing zero to its numerators, and that are excluded from the render
denominator by `isWritable`.

**Relation to L4, which is parked.** This mismatch is only observable through
persisted snapshots, and snapshot creation is a deliberate staff act rather than
an automatic one: the endpoint has exactly two HTTP call sites,
`src/contexts/SnapshotsContext.jsx:45` and `:67`, both authenticated, and the
create path is reached only by pressing "Record period snapshot" at
`src/surfaces/enterprise/reports/CohortComparison.jsx:145`. `wrangler.toml`
carries no `[triggers]` block and no cron key. L4 stays parked and this filing
does not disturb it; the relation is recorded because the parked item and this one
touch the same endpoint.

**Filed (D3 + D4, ONE item by FT ruling 2026-08-26): four of the five
athlete-state derivation sites do not route through `statusFor`, and the
tile/drill divergences are what that produces on screen.** FT ruled on
2026-08-26 that D3, derivation unification, and D4, the tile/drill mismatch, are
not two findings but one root cause with two faces, and that they file together.
**The claim of this filing is the root cause. The divergence result below is its
proof, not a second item.** Everything here was proven at HEAD `23c82f3` by
execution or by grep; nothing is carried from session minutes, and where the
minutes disagree with the tree the tree is recorded.

**The five derivation sites, all present at HEAD.**
`statusFor` (`src/surfaces/enterprise/shared/athleteStatus.js:6-13`) derives six
display labels. `computeStats`
(`src/surfaces/enterprise/shared/enterpriseStats.js:12-25`) derives count buckets:
`onTrack` at `:21`, `stalled` at `:22`, `notStarted` at `:23`, `certD` at `:15`,
`gpsD` at `:14`. An inline `useMemo`
(`src/surfaces/enterprise/reports/ProgramOutputs.jsx:86-110`) derives its own
counts and percentages at `:89`, `:91`, `:92`, `:104` and `:105`.
`philanthropicStage`
(`src/surfaces/enterprise/reports/PhilanthropicReadiness.jsx:34-39`) derives stage
integers, labelled at `:44`, `:49`, `:54`, `:59` and `:64`. SQL aggregates in
`onRequestPost` (`functions/api/snapshots.js:116-126`) derive `athletes_count` at
`:119`, `gps_completed_count` at `:120` and `certified_count` at `:121`.

**FOUR of the five do not route through `statusFor`, not three.** The session
minutes said three. A repo-wide grep for `statusFor` in `src/` (exit 0) returns it
only in `AthleteProfile.jsx:95`, `FilteredAthletesModal.jsx:47`,
`EnterpriseRoster.jsx:23` and `:66`, and `categoryFilters.js:9`, `:11`, `:12`,
`:13`. **The four that derive independently are `computeStats`, the
`ProgramOutputs.jsx` inline block, `philanthropicStage`, and the `snapshots.js`
SQL.** The fifth is `statusFor` itself.

**The vocabulary composition, recorded WITHOUT a count. FT ruled 2026-08-26 to
drop the "four vocabularies" figure, because the tree does not decide the
grouping.** What is provable is the composition: **one label vocabulary**
(`statusFor`'s six labels), **one stage vocabulary** (`philanthropicStage`'s five
stage labels), and **three mutually disjoint count vocabularies** (`computeStats`,
the `ProgramOutputs` inline block, and the SQL columns), which share no field
names with one another. **Whether that totals four, five, or three is not
determinable from the tree**, because nothing in the tree decides whether three
disjoint count vocabularies are one kind or three.

**`athleteStatus.js:1` still describes the file as a single source of truth while
four sites derive independently.** At HEAD it reads, verbatim: "Single source of
truth for athlete-state derivation and sort order." Commit `894f22d` edited that
line, changing "priority" to "order" as part of the F-B rename, and **left the
single-source-of-truth claim intact**. The claim is accurate about the four call
sites that import it and silent about the four derivations that do not.

**`statusFor` and `philanthropicStage` actively contradict, PROVEN BY EXECUTION
rather than by reading.** `philanthropicStage` is module-local inside a `.jsx`
file that node cannot import, so it was not transcribed: **its source was
extracted from the tree by regex and evaluated**, so what ran is the tree's own
code. **Over the demo fixture, 10 of 16 athletes receive different labels from the
two functions.** The sharpest case is constructed rather than fixture-drawn, and
sits on reachable inputs: **an athlete with `lessons: 0` and `gpsCompleted: true`
is labelled `'Invited'` by `statusFor` and stage 3, `'GPS Defined'`, by
`philanthropicStage`, at the same moment.**

**They cannot be reconciled by input, because neither reads what the other keys
on.** `philanthropicStage` never reads `a.status` at any of `:35-38`.
`statusFor` short-circuits at `athleteStatus.js:9` on `a.lessons === 0` and never
reaches a GPS test at all. So there is no athlete record that makes the two agree
by construction; the disagreement is structural rather than data-dependent.

**The 8-versus-7 tile/drill mismatch STILL REPRODUCES at HEAD, and D2 did not
close it.** Executed against the demo fixture, n=16: the "Actively progressing"
tile displays **8** while its drill lists **7**. The athlete counted but not
listed is **Andre Mitchell**, whose fixture values are `lessons=2`,
`gpsCompleted=true`, `certified=false`, `status='inactive'`. He is a member of the
`onTrack` set and `statusFor` returns **`'Outreach paused'`** for him, so he
appears in the outreach-paused drill and not in the actively-progressing one.
Nothing is listed-but-not-counted on that pair.

**Why D2 did not close it, stated precisely so the fix is not credited twice.**
D2 (`enterpriseStats.js:16-21`) replaced a subtraction of two overlapping counts
with a direct set count, and that did fix the certified-without-GPS miscount it
was written for. **But the new predicate at `:21` is
`a.lessons > 0 && a.gpsCompleted && !a.certified`, which still never reads
`a.status`**, while the drill at `categoryFilters.js:9` routes through
`statusFor`, which does. D2 changed the arithmetic underneath the tile and did
not change the fact that the tile ignores status.

**The exhaustive pair test, and its method, because the method is what makes the
result trustworthy.** A roster of **32 athletes** was constructed over every
combination of `status` in invited / active / inactive / pending, `certified` in
false / true, `lessons` in 0 / 3, and `gpsCompleted` in false / true. Each
tile/drill pair was then compared **per athlete rather than by count, because two
counts can coincide while the underlying sets differ.** The tile-side predicates
were first validated against `computeStats` itself: all five transcribed
predicates produced counts identical to `computeStats` on the same roster (32, 4,
16, 8, 16), so the comparison is against the real derivation rather than a
paraphrase of it.

**Result. Three of the five pairs diverge; two agree always.** Athletes: tile set
32, drill set 32, nothing counted-but-unlisted and nothing listed-but-uncounted.
**Actively progressing: tile set 4, drill set 1, THREE counted but not listed**,
none the other way. Certified: tile set 16, drill set 16, nothing either way.
**Not yet active: tile set 8, drill set 3, FIVE counted but not listed**, none the
other way. **Invited: tile set 16, drill set 7, TEN counted but not listed, and
ONE listed but not counted.**

**Athletes and Certified agree always, and the reason is that both sides run the
identical predicate**: `athletes.length` against `() => true` for Athletes, and
`a.certified` against `a.certified` for Certified. `categoryFilters.js:10` is the
one drill predicate that does not call `statusFor`, which is exactly why its pair
cannot drift.

**The diverging members, by field combination.** **Actively progressing**, counted
but not listed: an athlete with `lessons>0, gps, not certified` whose status is
`invited`, `inactive` or `pending`. **Not yet active**, counted but not listed:
`certified` athletes with `lessons>0, no gps` across three status values, plus
both `pending` variants. **Invited**, counted but not listed: every `certified`
athlete with `lessons===0`, plus all four `pending` variants.

**Invited is the only pair that diverges in BOTH directions.** Its one
listed-but-not-counted member is an athlete with `status='invited'` and 3 lessons:
`statusFor:9` labels them `'Invited'` on the `a.status === 'invited'` disjunct,
while the tile predicate `lessons === 0` excludes them. So that athlete appears in
a drill whose tile never counted them.

**The 23c82f3 instance, ruled onto this filing on 2026-08-26 rather than filed
separately.** A roster of one Pending and one genuinely Invited athlete, both with
`lessons: 0`: the Invited tile displays **2** and its drill lists **1**. Across
every non-catch-all category, only the Invited athlete is reachable; the Pending
athlete appears in none. This was first observed during the `23c82f3` verification
and re-proven at HEAD for this filing. FT ruled it an instance of the root cause
above rather than its own item.

**The rendered tile/drill pairs: five distinct pairs, each rendered on two
surfaces, so ten tile instances.** On `EnterpriseOverview.jsx` they are at `:89`
Athletes, `:90-97` Actively progressing, `:98` Certified, `:99` Not yet active and
`:100` Invited; on `EnterpriseRoster.jsx` at `:87`, `:88-95`, `:96`, `:97` and
`:98`. **A grep for `StatTile` with `onClick` finds only eight of the ten**,
because both Actively progressing tiles are multi-line JSX with the handler on its
own line, at `EnterpriseOverview.jsx:96` and `EnterpriseRoster.jsx:94`. **Both
surfaces feed the same `CATEGORY_CONFIG` and the same `FilteredAthletesModal`, so
a divergence appears identically on each** rather than being a property of either
page.

**Two other drills exist and are explicitly OUT of this filing's scope, recorded
so a later fix does not sweep them in.** `ProgramSummary.jsx:177-183` mounts
`FilteredAthletesModal`, but it is driven by a BarChart week click and filters on
fixture id membership at `:80-81` through `engagedAthletesByWeek`, which `:78`
documents as demo-only; its four `StatTile`s at `:98-104` are `variant="inline"`
with no `onClick` and do not drill at all.
`PhilanthropicReadiness.jsx:80` partitions by `philanthropicStage` and `:153`
lists athlete names inline per stage, which is a listing rather than a modal
drill. **Neither reads `CATEGORY_CONFIG`, and neither is a tile/drill pair.**

**Filed: `management_mode` carries no CHECK, so the disclosure's four buckets do
not exhaustively cover claimed-and-not-delegated, and its headline count can
silently under-report.** Introduced by the enumeration slice and filed with it
rather than left to be discovered later. The residual is also recorded in code,
at `src/surfaces/enterprise/shared/enterpriseStats.js:69`, so a reader meets it
beside the buckets; this entry is the queue record and carries the reasoning.

`migrations/0015_athlete_management_mode.sql:21` is a bare
`ALTER TABLE athlete ADD COLUMN management_mode TEXT`, with no CHECK and no
DEFAULT. The applied schema agrees: reading `sqlite_master` for the `athlete`
table returns the declaration `management_mode TEXT` and no
`CHECK (management_mode ...)` anywhere in it. **The absence is deliberate**, and
`0015:13-16` says why: the gate is deny-by-default, so "NULL, 'self', or any
other value blocks". The column was never meant to be constrained, because the
write gate was meant to carry the whole burden.

**What the enumeration slice added on top of that.**
`enterpriseStats.js:82-83` splits claimed-and-not-delegated into two buckets,
`claimedNoMode` (`managementMode == null`) and `selfManaged`
(`managementMode === 'self'`). Those two values plus `'delegated'` are the whole
INTENDED domain, so the split is exhaustive over the intended domain and not
over the column. A claimed athlete holding some third value is non-writable, is
therefore excluded from the rate denominator by `isWritable` (`:37`), and lands
in **no bucket**. `excludedTotal` (`:84-86`), being the sum of the four,
under-counts by exactly that many rows.

**The direction is safe; the failure mode is not.** It can only under-count,
never over-count, since nothing is double-counted and no row is invented. But
`RateDisclosure.jsx` now renders `excludedTotal` as its headline figure, "N
athletes are not counted here", above lines that would not reconcile with the
roster arithmetic a staff member can do for themselves. **The expression it
replaced could not fail this way.** `tot - writable` was a subtraction over the
same array, correct for any value the column could hold, including one nobody
anticipated. The enumeration bought per-reason detail at the cost of an
exhaustiveness assumption, and this entry is that cost written down.

**Unreachable through any endpoint at HEAD, re-proven here rather than carried
forward from session text.** A repo-wide grep for writes to the column returns
exactly three sites. `functions/api/athlete-consent.js:67` sets it from the
request body; `functions/api/athletes.js:204` writes `null` at roster-add; and
`functions/api/athletes/[id].js:135` writes `null` on anonymize. Only the first
can write a non-null value, and it is guarded: `ALLOWED_MODES` is
`new Set(['self', 'delegated'])` at `:38`, tested at `:61-63`, which returns 400
before the UPDATE at `:65-68`. The roster import path writes nothing to the
column at all, leaving it NULL (`functions/api/athletes/import.js:280-282`).
**So a third value requires a direct database write**, meaning a hand-run
statement, or a future endpoint that forgets the allowlist.

**Two ways to close it, neither proposed, because they are different kinds of
decision.** A CHECK on the column would make the state unrepresentable, and
would be a migration against a table with four inbound child FKs, which is the
0016 table-rebuild hazard rather than an `ALTER`. A fifth bucket, or a residual
line, would make the state visible instead, and that is a copy decision on a
screen that has just been screened on both trees and on mobile. **No fix
proposed.**

**Filed: `athlete.badge` has a ruling and no author. No code path writes it, so
every athlete's badge is NULL forever.** E10 rules it a staff-authored
descriptive label, restated across three migrations
(`0009_enterprise_schema.sql:156` and `:201`,
`0016_athlete_enrollment_status_check.sql:30`,
`0020_athlete_pending_status.sql:69`), each pairing the ruling with a
prohibition on any `badge_rank` or `badge_score` column. The ruling is recorded
four times. The write is recorded nowhere.

**C-1 closed the only door it had.** `ALLOWED_BODY_KEYS` at
`functions/api/athletes.js:62` is `['name', 'email', 'consentAcknowledged']`,
and `:158-163` rejects anything else with a 400 naming the offending keys. The
comment at `:156` lists badge explicitly among what that check catches. The
milestone PUT does not accept it either: `ALLOWED_MILESTONE_KEYS`
(`functions/api/athletes/[id].js:187`) is lessons, gpsCompleted and certified,
enforced at `:193`.

**Both writes that exist set it to NULL.** `athletes.js:203` at enrollment,
commented "C-1: locked out pre-claim (was E10)", and
`functions/api/athletes/[id].js:129` on anonymize. A repo-wide grep across
`functions/` for the column returns exactly those two writes plus two comments.

**It is still carried the whole way to the client.** `badge` sits in
`ATHLETE_ELEMENT_COLUMNS` (`athletes.js:76`) and is emitted by
`toAthleteElement` (`:92`), so every roster element on every authenticated read
carries the field. **No UI renders it**: a grep across `src/` finds `badge` only
inside three comments, none of them a render site. A column is therefore
selected, shipped and ignored, and the phrase "was E10" in the enrollment
comment is the closest the tree comes to saying the ruling is unimplemented.

**What is NOT known.** Whether the intended author is staff at enrollment, staff
after the athlete claims, or something else. C-1's field lockdown answers the
pre-claim case with nobody and leaves the post-claim case unstated. **No fix
proposed**, because the missing piece is who writes it and when, which is a
ruling rather than a patch.

**Filed: `athlete_activity` exists as a table with an event enum and has no
INSERT path anywhere in the repo. The client-facing `activity` array is a
hardcoded literal.** The table is created at
`migrations/0009_enterprise_schema.sql:232-241`, carrying `athlete_id`, `date`,
`type`, `label` and `created_at`, with its six-value enum documented in the
comment at `:236-237`: `lesson_completed`, `workshop_attended`, `gift_made`,
`note_added`, `gps_completed`, `certified`. It has an index at `:562`.

**Nothing writes it.** A repo-wide grep for an INSERT into the table across
`functions/`, `src/`, `scripts/` and `migrations/` returns nothing, exit 1. The
only code naming it at all is the anonymize batch,
`functions/api/athletes/[id].js:119`, which DELETES from it. Local D1 holds 0
rows, as do its two siblings `athlete_note` and `athlete_reflection`.

**The emission is a literal.** `functions/api/athletes.js:115` writes
`activity: []` into every element, under a comment at `:112-114` saying the
table is "empty until the activity-write slice" and that the array is always
present so `AthleteProfile`'s `.map` / `.filter` never touch undefined. That
literal is doing real defensive work, which is why it is easy to miss that it is
also the only value the field will ever hold.

**Three consumers read it as though it were populated.**
`src/components/AthleteProfile.jsx:84` filters it for `gift_made` events and
`:229-230` maps it as a timeline;
`src/surfaces/enterprise/reports/ProgramOutputs.jsx:47` parses it for the same
events; `src/data/unified/adapters/enterprise.js:185` and `:196` carry and
iterate it. On the demo tree the fixtures supply real arrays, so all three work.
On the authenticated tree all three read an array that is empty by construction
rather than by observation.

**Already documented once, in a comment, on one of the three.**
`ProgramOutputs.jsx:19-24` states the whole finding accurately and uses it to
justify rendering "Not tracked". This entry exists because a finding recorded
only in one consumer's comment is not in the queue, which is the same filing gap
the `SignIn.jsx` closed record above names by its own name.

**No fix proposed.** Writing the table means deciding which acts emit which enum
values and when, and the `gift_made` value additionally touches the accepted
Phase-1 boundary on enterprise gift tracking.

**Filed: the BMF rollback path is a stated precondition on a production BMF
load, and it lives only in the scoping doc rather than in this queue.**
`docs/bmf-load-scoping.md:1026-1032` records two preconditions on any production
load, both attributed to Parker and both marked ACCEPTED. The first is the
rollback path; the second is the observability gap.

**The rollback precondition, in full.** `:1029` states it as "The rollback path,
open item 1 below, must be closed." Open item 1 sits at `:1142-1161`, and its
finding is narrow and exact: the measured import committed ATOMICALLY on the
success path, with an exact row count and no partial table ever visible
(`:1144-1147`), but nothing failed during the run, so the rollback claim was
never exercised (`:1149-1153`). `:1155` states the position in five words:
"Success path proven. Failure path untested." `:1157-1161` records it as GATING
the load rather than the window.

**The second precondition resolves, and already has a home.** `:1030-1032`
points at CLAUDE.md section 11 for the auth-observability gap. **That reference
resolves**: section 11 begins at `CLAUDE.md:2106` and the filing is at
`:2170-2174`, recording that magic-link sends stamp nothing, that there is no
health check, and that the July outage therefore ran silently. It is queued
there as a near-term small build.

**Why this is filed here.** Section 7 names this document as where live items
go. The rollback precondition is live, it gates a production action, and it is
discoverable only by reading a scoping doc for a build that has not started. The
observability half already sits in CLAUDE.md; the rollback half sat nowhere.
**No fix proposed**, and nothing here disturbs the section 13 ruling: the window
is accepted, and the load waits on these two.

**Filed: two controls were reported as mobile-as-app violations. One is provable
from the tree and one is not, and they are recorded separately for exactly that
reason.**

**PROVABLE, `AddAthleteModal`.** Its footer carries `size="sm"` on all three
buttons: `src/surfaces/enterprise/AddAthleteModal.jsx:107` (Done), `:139`
(Cancel) and `:140` (the primary submit). `Button.jsx:75` defines `sm` as
`padding: '6px 10px'` at `--sh-text-xs`, and `Button.jsx:70-73` states what that
size is FOR, verbatim: "sm and normal are POINTER-DENSITY controls for inline
row actions and are deliberately left non-compliant (~27px / ~32px)". A modal
footer's primary submit is not an inline row action, so the deliberate carve-out
in section 7 does not cover this use, and the control that commits a roster
enrollment renders at roughly 27px against a standard section 7 locks at 44px
for a phone-first product. **This is the same shape as the AppShell retry-panel
entry above**, which flagged `size="normal"` on the only recovery control of a
full-viewport panel; the two should be read together.

**NOT PROVABLE, `WorkshopDetail` attendance toggles. Reported, mechanism partly
established, magnitude unverified.** The toggle is a native
`<input type="checkbox">` at `src/components/WorkshopDetail.jsx:179-184`.
`checkboxStyle` (`:417-421`) sets `accentColor`, `flexShrink` and `cursor`, and
NO dimensions; a grep across `src/` finds no width, height, minWidth or
minHeight on any checkbox, exit 1. So it renders at the user agent's default
size, whatever that is on the device. **What complicates the reading** is that
`:178` wraps it in a `<label style={editCheckLabelStyle}>` carrying the name and
sport spans, so the hit area extends across the label rather than stopping at
the box. `editCheckLabelStyle` (`:403-409`) is a flex row with no height, so the
height emerges from the name span's line box at `--sh-text-base`.

**The horizontal target is therefore generous and the vertical one is
text-driven and unnamed. Whether the result clears 44px is UNVERIFIED**, because
it needs a rendered measurement on a device and none has been taken. Recording
it as a violation would be inventing a mechanism. **What IS established** is that
the control's height is an emergent product of a font-size token rather than a
named requirement, which is the exact pattern `Button.jsx:61-63` rejected when it
chose `minHeight` over a corrected `lineHeight`, on the grounds that an emergent
height "silently re-breaks the next time a font-size token moves".

**No fix proposed for either.**

**Filed: no mobile render check has been performed on the sites that now render
a Pending athlete. This is a gap in verification, not a defect in code.** Nothing
below claims any of these sites is wrong. The claim is that `Pending` reached the
interface across the roster-import arc and that no site rendering it has been
looked at on a phone.

**The render sites, located by grep at HEAD.** Status label, via `statusFor`
returning "Not yet invited": `EnterpriseRoster.jsx:33` (Status column cell),
`AthleteProfile.jsx:95` (status badge), `FilteredAthletesModal.jsx:47` (the
`{year} · {status}` meta line). Claim state, via `accessLabel`, which renders
adjacent to it: `EnterpriseRoster.jsx:50` (Access column, authenticated tree
only), `AthleteProfile.jsx:102` (the Access line) and `:171` (the gated
milestone-editor explanation), `WorkshopDetail.jsx:171` (the non-recordable row
state). Staged-row treatment: `EnterpriseRoster.jsx:284` passes `rowState`, and
`DataTable.jsx:215-217` applies `uncommittedRowStyle` (`:356`).
`FilteredAthletesModal` is mounted at three sites, so its line renders on three
surfaces: `EnterpriseOverview.jsx:160`, `EnterpriseRoster.jsx:363`,
`ProgramSummary.jsx:177`.

**Why the roster is the one most worth checking.** `EnterpriseRoster.jsx:138`
sets `rosterMinWidth` to `'960px'` on the authenticated tree and `'880px'` on
the demo tree, passed at `:279` into `DataTable`, whose wrapper is
`overflowX: 'auto'` (`DataTable.jsx:257`). At a 375px viewport the table is
roughly two and a half times the viewport width, so Status and Access are
reached by horizontal scroll. **That is the ruled behaviour and not a defect**:
the import arc chose the scroll wrapper deliberately, over a preview grid, on
mobile-overflow grounds. What is unverified is what an operator actually sees
and reaches at that width, which is the question the ruling deferred rather than
answered.

**Two adjacent labels are the specific thing to look at.** "Not yet invited" and
"Pending choice" render in adjacent columns on the authenticated roster, and the
display label was chosen precisely because those two sit side by side. That
choice has never been seen at a phone width.

**Also unchecked at mobile width: the review bar and the bulk-selection bar**,
both new with the review-before-save slice and both rendering only when Pending
rows are present. `EnterpriseRoster.jsx:166-168` documents the review bar as
sitting OUTSIDE the horizontal scroll container so its controls stay reachable
at any viewport width. That is a deliberate mobile accommodation, and it is
exactly the kind of claim a render would confirm or refute.

**No fix proposed, because there is nothing yet to fix.** The disposition is a
check, and it belongs with the full-platform QA pass the calendar entry above is
already banked for.

**Filed: `POST /api/snapshots` re-SELECTs outside its try, so an undefined row
throws and the caller receives 500 for a write that committed.** Found during
the snapshot write-gate scoping pass and filed with the slice that gated the
write, which deliberately did not touch this. **It predates that slice**: the
shape is unchanged from before it, and only the line numbers moved.

`functions/api/snapshots.js:211-231` wraps the INSERT in `try` / `catch`, and
the catch at `:230` returns `jsonError('Failed to record snapshot', 500)`. The
re-SELECT that follows at `:233-237` sits OUTSIDE that block, and `:238` passes
its result straight into `toSnapshotElement(row)`. **`toSnapshotElement`
(`:76`) dereferences `row.id` at `:78` with no guard.** Proven by execution
against the function's own first statement: calling it with `undefined` throws
`TypeError: Cannot read properties of undefined (reading 'id')`.

**The consequence is the wrong direction of wrong.** The INSERT has already
committed by then. A throw at `:238` produces a 5xx, `SnapshotsContext.jsx:50`
turns any non-ok response into an error, `:56` sets `writeError`, and
`RecordSnapshotModal.jsx:60` renders it in-form. **So the operator is told the
snapshot failed while the row exists**, and the natural response to that message
is to press the button again, which writes a second row: the table carries no
UNIQUE constraint on `(institution_id, cohort_label)` and the INSERT carries no
`onConflict`, both confirmed by reading the applied schema.

**What is NOT established, said plainly.** Whether D1 can actually return
`undefined` from a `SELECT ... WHERE id = ?` immediately after that id was
committed in the same request. No mechanism for it was identified and none was
reproduced. The throw is proven; its reachability is **unverified**. That is
what makes this a filing rather than a defect with a known trigger.

**The sibling path does not share the shape**, checked so a fix is not scoped
wider than it needs to be. `DELETE /api/snapshots/:id` reads before it writes
(`functions/api/snapshots/[id].js:37-45`, returning 404 when the row is absent)
and returns a literal object at `:57` rather than mapping a re-read row, so it
has no post-write dereference at all.

**No fix proposed.** The shape admits at least two readings that differ in what
they claim: widening the `try` treats the re-read as part of the write, while
guarding the row treats a missing row as a reportable state. Which one is right
depends on whether the re-read is understood as confirmation of the write or as
a separate read, and that is a decision rather than a patch.

**Filed: the `certified` and `not-yet-invited` categories overlap, so the six
enterprise tile categories no longer partition the roster.** Surfaced by the
tile/drill pairing slice and filed with it. **Nothing regressed**: the overlap
existed the moment `statusFor` gained its Pending branch, and pairing only made
it visible by giving 'Not yet invited' a tile of its own.

**The cause is that the two categories are defined on different axes.**
`categoryFilters.js` filters `certified` on `a.certified` directly, while every
other category routes through `statusFor`. And `athleteStatus.js:7` returns
`'Not yet invited'` for a Pending athlete BEFORE `:8` can return `'Certified'`,
which is the branch order F-A ruled deliberately. So an athlete who is both
Pending and certified satisfies both filters and is counted twice.

**The overlap rows, proven by execution over the exhaustive synthetic roster**
(status x certified x lessons x gps, n=32). Four rows sit in both categories,
and `statusFor` returns `'Not yet invited'` for every one of them:

```
  status=pending  certified=true  lessons=0  gps=false   statusFor = Not yet invited
  status=pending  certified=true  lessons=0  gps=true    statusFor = Not yet invited
  status=pending  certified=true  lessons=3  gps=false   statusFor = Not yet invited
  status=pending  certified=true  lessons=3  gps=true    statusFor = Not yet invited
```

The six categories sum to **36 over a 32-athlete roster**, and the excess is
exactly the four overlapping rows.

**Each tile still equals its own drill.** This is NOT a pairing failure: the
pairing check reports zero mismatches on all seven pairs across all three
rosters, because a tile and its drill run one predicate. What fails is a
DIFFERENT property, that the categories are mutually exclusive, which nothing
in the tree ever asserted and which the tiles do not claim on screen.

**UNREACHABLE on both real rosters, verified rather than assumed.** The live
local store holds 46 athlete rows and **zero** with
`enrollment_status='Pending' AND certified=1`. The demo fixture roster holds 16
and **zero** with `status='pending' && certified`; it has no Pending athlete at
all. So the sum is 46 over 46 and 16 over 16 respectively, and no operator can
see a double count today.

**Whether it is reachable in principle is the F-C question, and that is why
this is filed rather than fixed.** F-C above records that `resolveStatus` in
`functions/api/athletes/[id].js` strands a Pending athlete and that
`certified: true` is its ONLY exit, with no intermediate state: one write moves
a Pending athlete the whole distance to `'Certified'`. **But that write sets
`enrollment_status` as well**, so the row it produces is Certified rather than
Pending-and-certified, and the overlap needs a row where the column and the
flag disagree. **Whether any path can produce that pair is NOT established
here.** Fixing the overlap means deciding which category owns such an athlete,
and that decision is downstream of F-C's, so the two want ruling together.

**No fix proposed.** The obvious change, routing `certified` through
`statusFor` like its five siblings, is not obviously right: it would make the
Certified tile stop counting a certified athlete whose status column says
something else, which is a different falsehood rather than none. The
alternative, leaving both and saying so on screen, is a copy decision.

**Filed: the "Workshops held" tile renders "0 of 0" for an institution with no
workshops, which is the exact string the slice beside it just stopped rendering.**
Noticed during the slice-3 screen and deliberately NOT folded in. **The
arithmetic is honest and this is not a defect in it**: the demo tree renders
"2 of 5" over five real fixture workshops, two completed, and every number the
tile produces is a true count of the rows it was given. What is filed is a
STRING that reads as a measurement when there is nothing to measure.

**Two corrections to how this was described when it was raised, both proven at
HEAD, recorded because the second changes what a reader will find.**

**First, the expression.** It is `functions`-free and lives at
`src/surfaces/enterprise/reports/ProgramOutputs.jsx:242`, reading
`` value={`${workshopsHeld} of ${workshopsHeld + workshopsScheduled}`} ``. The
denominator is the SUM, not `workshopsScheduled` alone, which is why the demo
renders "2 of 5" rather than "2 of 3". `workshopsHeld` is
`workshops.filter((w) => w.status === 'completed').length` (`:95`) and
`workshopsScheduled` is its complement (`:96`).

**Second, the position.** It is not three lines above the two tiles slice 3
changed; it sits BETWEEN them. The tile is `:239-244`, the last of Section 1
(Activity summary). "Athletes certified" is `:213-218`, twenty-one lines ABOVE
it in the same Card. "GPS frameworks completed" is `:290-295`, in Section 3,
some fifty lines below. So an operator meets the suppressed shape, then the
unsuppressed one, then the suppressed one again, in that order down the page.

**Why the shapes are the same and the mechanisms are not.** The two progression
tiles were suppressed because their denominator is a CONSENT population: with no
delegated athlete the measurement does not exist, and R4 already ruled that
absence renders "Not tracked" rather than 0. The workshops tile's denominator is
a COUNT OF ROWS. Zero workshops is a real and correct answer to "how many
workshops", not an unmeasurable one, and an institution that has scheduled
nothing has genuinely held none of nothing. Folding it into slice 3 would have
applied a consent-population rule to a row count, and the resemblance between
the two output strings is not a reason to treat them alike.

**REACHABLE, and it is the first screen a new institution sees.** The live local
store holds **zero** `workshop` rows, so the tile renders "0 of 0" today under
"Workshops held", with the sublabel "0 remaining this term" beneath it. The tile
is ungated: `:239` sits outside the `isAuthenticated` ternary that closes at
`:238`, so it renders identically on both trees. A newly provisioned institution
has no workshops by definition, which puts this on the same first-screen footing
as the `null%` filing above.

**The sublabel is the second string, and it is arguably the worse one.** "0
remaining this term" asserts a term with nothing left in it, which reads as a
completed programme rather than an empty one.

**No fix proposed**, and the resemblance to slice 3 is a reason for caution
rather than for a matching patch. Whether zero workshops should read as "None
scheduled", as "Not tracked", or as the honest "0 of 0" it already is, is a copy
decision about a row count, and the page has three separate absence conventions
in play already: NT for unsourced figures, the R4 "Not tracked" for unmeasurable
rates, and plain zeros for counts.

**Filed: the enterprise roster's stat grid stacks into seven full-width rows on
a phone, putting the table's header row roughly a thousand pixels down the
page.** Surfaced while scoping a sticky table header, which does NOT address it
and is recorded here so the two are not confused. Filed, not fixed.

**The mechanism, and it is one line.** `EnterpriseRoster.jsx:425-432`,
`statGridStyle`, is `repeat(auto-fit, minmax(min(100%, 180px), 1fr))` with a
`--sh-space-4` gap. At a 375px viewport the `<main>` padding is
`clamp(var(--sh-space-3), 4vw, var(--sh-space-8))` (`:404-408`), which resolves
to 15px a side, leaving a 345px content box. One 180px track fits. So the seven
tiles mounted at `:168-177` become **seven rows, one tile wide**.

**FIGURES ARE SOURCE ARITHMETIC, NOT MEASUREMENTS.** Every number below is
derived from tokens in `src/styles/tokens.css` and from style objects read at
HEAD, with rounding. Nothing was rendered and nothing was measured on a device.
§7 already records a case where a 640-wide measurement and a 320-wide estimate
disagreed, so these should be confirmed before anyone quotes them.

```
  tile height          97   (padding 20 + label 18 + margin 8 + value 31 + padding 20)
  columns at 375px      1
  grid with 5 tiles   549
  grid with 7 tiles   775
  header row top    ~1016   (accent 3 + chrome 64 + main pad 40 + eyebrow 26
                             + h1 60 + grid 775 + grid margin 24 + Card pad 24)
```

**A CORRECTION to the figures this was first raised with, made here rather than
carried.** It was raised as "roughly 972px" with a "roughly 216px" slice-2
delta. Both were computed with an assumed 1.2 line-height. The tokens say
`--sh-line-normal: 1.6` (`tokens.css:86`) and `--sh-line-tight: 1.3` (`:84`),
and `global.css:36` applies the tight one to `h1`. Re-derived from those, the
figures are **~1016px and ~226px**. The correction makes the problem slightly
worse, not better, and the shape of the finding is unchanged.

**A SECOND CORRECTION, and this one does not replace a figure, it WITHDRAWS
one.** The `label 18` term in the tile-height line above is `11 × 1.6`, and 1.6
never reaches the element it was applied to. `labelStyle`
(`StatTile.jsx:79-86`) declares `fontSize` and NO `lineHeight`, so it takes
whatever it inherits. Every roster and overview tile passes an `onClick`, so
every one of them renders through `ClickableTile`, which is a `<button>`
(`StatTile.jsx:40`). `global.css:54-57` gives `button` exactly two
declarations, `font-family: inherit` and `cursor: pointer`: no `font-size` and
no `line-height`. Verified by grep rather than by reading that one rule: no
`line-height` or `font-size` declaration targets `button` anywhere in
`src/styles/` (the only two line-height declarations sit in the `html, body`
rule at `:20` and the heading rule at `:36`, and the only font-size declaration
sits at `:19`), and a `find` for `*.css` under `src/` returns `global.css` and
`tokens.css` and no third stylesheet. The UA stylesheet's `line-height: normal`
is applied DIRECTLY to the button, and a directly-applied declaration beats an
inherited value, so `--sh-line-normal` is interrupted one element above the
label.

**The mechanism is already LOCKED section 7 text and is cited rather than
restated.** `CLAUDE.md:1565-1569` records that `lg` "computes to 39px (padding
20 + border 2 + a 17px UA line box), because browsers force `line-height:
normal` on form controls and inheritance of `--sh-line-normal` never reaches
them." **The 17px does NOT transfer.** That figure was measured on a `lg`
`Button`, whose font-size is not `--sh-text-xs`, and a UA line box is computed
against the font-size it applies to. What transfers is the mechanism sentence.
The number belongs to a different control.

**NO REPLACEMENT FIGURE IS GIVEN, and that is the point rather than an
omission.** `normal` resolves from the font's own ascent, descent and line-gap
metrics, which are not in the source and cannot be derived from any token.
Supplying a third number would repeat exactly the move that produced the first
two: this filing was raised at an assumed 1.2, corrected in the paragraph above
to an assumed 1.6, and both were assumptions about a value the source does not
carry. **`label 18` is therefore UNSOUND rather than imprecise**, and the
honest disposition is to withdraw it and say plainly what is not known.

**CONSEQUENCE FOR THE TOTALS: they are UPPER BOUNDS, not estimates.** `tile
height 97`, `grid with 5 tiles 549`, `grid with 7 tiles 775` and `header row
top ~1016` are each built on the withdrawn term and each bounds the true value
from above. The sensitivity is linear and is stated so a later reader can
rescale without re-deriving: every 1px of error in the label line box moves
`tile height` by 1px, the five-tile grid by 5px, the seven-tile grid by 7px,
and the `~1016` total by 7px, since the total carries the seven-tile grid and
nothing else that depends on the label. **How far below 18 the true value sits
is NOT asserted here.** The one directional claim this correction makes is that
a `normal` line box for a text font runs below a 1.6 multiplier, which is a
property of how font metrics are generally shaped rather than a reading of this
font's, and it is flagged as such rather than folded in with the token reads.

**THE FINDING ITSELF IS UNCHANGED.** One column at 375px follows from the 345px
content box and the 180px `minmax` floor, and no line-height question touches
that derivation at any point.

**Exactly ONE term in the tile computation is affected, which is checkable
rather than argued.** `labelStyle` is the only style object in `StatTile.jsx`
that relies on inherited line-height: `valueStyle` declares `1.1` (`:92`),
`sublabelStyle` declares `1.5` (`:99`), and the `<button>` declares neither,
which is what interrupts the inheritance in the first place. So `value 31` is
sound, both `padding 20` terms are token reads of `--sh-space-5`, and `margin
8` is `--sh-space-2`. Only `label 18` moves.

**The vocabulary gap, recorded because it explains why this went unqualified
rather than being caught.** A grep of this file for "UA line box", "form
control", "form controls" and "inheritance" returns no match at all, exit
status 1. No filing in the queue carries the vocabulary to reason about a
UA-applied declaration beating an inherited one, so nothing here was positioned
to notice. The closest is the `/individual/welcome` CTA filing above, which
reasons about the same `minHeight`-over-`lineHeight` decision in
`Button.jsx:61-63` but explicitly DECLINES to assert a mechanism and records
its own height as UNVERIFIED pending a device measurement. That filing stopped
where this one did not.

**No fix proposed, and no figure proposed: the term is withdrawn rather than
replaced.**

**Slice 2 added about 226px of it**, and that is worth naming rather than
leaving for someone to discover. `3b0f26b` took the grid from five tiles to
seven, adding 'Outreach paused' and 'Not yet invited' so that every `statusFor`
label has a tile. At 375px that is two more rows plus two more gaps. The tiles
were right to add: before them a Pending athlete was counted by the Invited tile
and listed by no drill at all. The cost landed entirely on narrow viewports.

**The sticky header does not address this, and the distinction is the point.** A
sticky header orients you WITHIN the table once you are looking at it. The grid
height determines how long it takes to GET there. They are different problems
with different fixes, and shipping the first would not shorten the ~1016px by a
pixel.

**STICKY HEADER: INVESTIGATED, RULED, DROPPED. Recorded so nobody re-opens it.**
It was scoped as an opt-in prop on `DataTable` and is not being built. What
follows is why, at the level of detail that stops the question being asked
again.

**The mechanism.** `tableWrapperStyle` (`src/components/DataTable.jsx:256-259`)
is `{ overflowX: 'auto', width: '100%' }` and sets no `overflow-y`. Under CSS
Overflow Level 3, a `visible` axis computes to `auto` when the other axis is
neither `visible` nor `clip`, so the wrapper is a scroll container on BOTH axes.
A `position: sticky` `<th>` resolves against its nearest scrollport, which is
that wrapper. The wrapper has no height constraint, so its scrollport height is
always its content height and it never scrolls vertically: a sticky header would
pin to a position it already occupies and never move. The page itself scrolls in
the window (nothing in `src/styles/` sets `overflow` or `height` on `html`,
`body` or `#root`), so the element the operator scrolls and the element the
header would stick to are different elements.

**PREMISE CONFIRMED BY RENDER, not merely cited from spec.** `getComputedStyle`
on the table's parent, read in DevTools on the live authenticated roster,
returned `overflow-y: 'auto'`. That matters because the whole ruling rests on
one computed value, and a spec citation is an argument about what a browser
should do rather than a reading of what it did.

**No overflow value satisfies both requirements**, which is stronger than "the
wrapper would have to change". The two requirements are that the table scrolls
horizontally, which is not optional (`minWidth` is 560px by default at
`DataTable.jsx:70` and 880/960px on the roster at `EnterpriseRoster.jsx:150`,
against a 297px box inside the Card at 375px), and that no vertical scrollport
sits between the `<th>` and the window. Every combination was enumerated:
`auto` or `scroll` on x always yields a y scrollport, whatever y is set to,
because `hidden` and `clip` are scrollports too; `clip` or `visible` on x
removes the scrollport but also removes the horizontal scrolling. **The
horizontal scroll container IS the vertical scrollport.** There is no CSS-only
sticky header here.

**Both workable approaches were considered and rejected.** The first gives the
wrapper a `max-height` so it becomes a real vertical scroll region and sticky
works inside it; that costs nested scrolling, so an operator scrolls ~1016px to
reach the table and then scrolls again inside a capped region while the page
still scrolls behind it, and it requires choosing a height, which is a design
decision nobody had made. The second renders a duplicate header outside the
wrapper and syncs its column widths and horizontal offset in JavaScript; that
costs two header rows in the DOM with one `aria-hidden`, a measurement pass or
`ResizeObserver`, and a scroll listener, and it is not `position: sticky` on the
real header. `borderCollapse: 'collapse'` (`DataTable.jsx:261-264`) is a third
obstacle that bites the first approach and not the second, since the header's
bottom border is painted by the table and would not travel with a sticky cell.

**THE RULING: sticky is dropped. The tile grid is the live item.** Nothing about
`DataTable` changed, and its three call sites are untouched. If a future reader
wants a sticky roster header, the question to answer first is not how to make
sticky work; it is whether the wrapper should stop being the scrollport, which
is a change to how every table on the surface scrolls.

**RULED, and recorded as settled rather than open: any fix applies at ALL
WIDTHS, not narrow viewports only.** A below-a-breakpoint variant would be a
second layout to maintain, and the tree has consistently refused that shape: the
`min()` floor in this very style exists (per its own comment at `:427-428`,
citing `88e07ea`) precisely so the track degrades continuously rather than
switching at a breakpoint. Whatever replaces or condenses the grid does so
everywhere.

**Not ruled, and left open deliberately.** Whether the answer is fewer tiles, a
denser tile, a collapsed summary row, or moving the grid below the table. Each
trades something different away, and the seven tiles are load-bearing after
`3b0f26b`: every one of them is a drill target, and dropping any label would
return an athlete to being counted with no list to reach.

**Reachable on both trees.** The grid is ungated; `EnterpriseRoster.jsx:167`
sits outside every `isAuthenticated` condition on the page, so the demo tree and
the authenticated tree stack identically at 375px.

**No fix proposed.**

**Filed: three items from the single-Name-column scoping pass, plus a fourth
found while re-proving them, each verified against HEAD `a63fcee` by execution or
grep before being written here.** No line number below is carried from the
scoping pass. One of the four is an OBSERVATION rather than a defect and says so,
one is a RULING recorded so the question is not re-opened, and one is STALE
DOCUMENTATION rather than a defect. Nothing below proposes a fix, and nothing
below is built in this commit.

**Filed: `suggestMapping`'s containment fallback claims a column for a field the
header does not name, and "Full Name" is the known instance.**
`src/surfaces/enterprise/shared/parseRoster.js`. The mechanism is the fallback
loop at `:220-223`, which runs after the exact-label loop at `:213-216` has
failed for every label in the field, and matches on `c.includes(k)` rather than
equality. **Proven by execution, not by reading:** `norm` at `:198` reduces
"Full Name" to `"fullname"`, `CANDIDATES.lastName` at `:194` contains `'lname'`,
and `"fullname".includes("lname")` is `true`, because `"fullname"` carries the
contiguous run `l,n,a,m,e` from index 3. Calling the real exported function,
`suggestMapping(['Full Name','Email'])` returns
`{"firstName":null,"lastName":0,"email":1}`, so index 0, the Full Name column,
is pre-selected as **Last name**.

**It steers wrong rather than landing wrong, and the guards that make that true
are worth naming because they are what keeps this off the blocking list.**
Submit is disabled until all three fields are mapped:
`ImportRosterModal.jsx:184` computes `allMapped` from the count of non-null
mappings, `:185` folds it into `canSubmit`, and `:374` passes
`disabled={!canSubmit}`. The operator therefore cannot submit the two-of-three
state this mis-claim produces, because `firstName` comes back `null` and nothing
fills it. And the live example under each select shows the cell contents from
their own first data row: `:323` reads `parsed.rows[0].fields[idx]` and
`:340-343` renders it as `First row: {value}`, so a Full Name column pre-selected
as Last name displays `First row: Marcus Thompson` under the Last name dropdown.
The mis-claim is visible at the moment it is made. `:183` separately blocks
mapping one source column to two targets via `duplicateColumn`, and `FIELDS` at
`:59-63` fixes the three targets.

**THE AUDIT, AND ITS RESULT IS THE OPPOSITE OF WHAT THE FILING TITLE SUGGESTS.
"Full Name" is NOT one collision among several inside the candidate vocabulary.
It is outside the vocabulary entirely, and the exhaustive vocabulary audit is
CLEAN.** Every one of the 16 candidate labels at `:193-195` was run against every
other as a header string, 240 ordered pairs, testing
`norm(header).includes(label)` where the two belong to different fields.
**Cross-field containment pairs found: ZERO.** Within the vocabulary the fallback
is sound, and no candidate label is a substring of any other field's label.
**So an audit confined to the candidate lists would have reported the fallback
safe and would not have surfaced "Full Name" at all**, because `"fullname"` is
not a candidate label. That is the finding: the collision surface is not the
vocabulary, it is the space of real headers the vocabulary was never compared
against.

**THE COLLISION SURFACE IS UNAUDITED FOR HEADERS OUTSIDE THE CANDIDATE
VOCABULARY, AND IT CANNOT BE AUDITED EXHAUSTIVELY**, because it is the set of
strings an athletic department might put in a header cell, which is unbounded and
undocumented. The tree carries no sample roster file, no test, and no statement
of what real exports look like, so there is no corpus to run this against. What
follows was found by probing plausible headers and is **ILLUSTRATIVE, NOT
EXHAUSTIVE.** Every line is the real function's real return value, with the
wrongly claimed header named:

- `['Full Name','Email']` claims "Full Name" as **Last name**, via `'lname'`.
- `['Legal Name','Preferred Email']` claims "Legal Name" as **Last name**, via
  `'lname'` again: `"legalname"` also carries `l,n,a,m,e` contiguously.
- `['Athlete','Last Active','Email']` claims "Last Active" as **Last name**, via
  `'last'`.
- `['Student Name','Last Login','Email']` claims "Last Login" as **Last name**.
- `['Player','Last Updated','Email']` claims "Last Updated" as **Last name**.
- `['Name','Mailing Address']` claims "Mailing Address" as **Email**, via
  `'mail'`.
- `['Given Consent','Surname','Email']` claims "Given Consent" as **First
  name**, via `'given'`.
- `['First Contact','Last Name','Email']` claims "First Contact" as **First
  name**, via `'first'`.
- `['Family Contact','First Name','Email']` claims "Family Contact" as **Last
  name**, via `'family'`.

**The three-and-four-letter labels are the whole exposure.** `'last'`, `'first'`,
`'mail'`, `'given'`, `'family'` and `'lname'` are short enough to sit inside
ordinary English header phrases; `'emailaddress'`, `'familyname'` and
`'forename'` are not. **The last-something family is the one most likely to be
met in practice**, because "Last Active", "Last Login" and "Last Updated" are
columns a CRM or SIS export produces by default, and any of them sitting to the
left of the real surname column takes the Last name slot before the exact label
is reached. Note that this specific ordering hazard does not arise inside one
field, since `:213-216` tries every exact label across every cell before
`:220-223` runs at all; it arises when a field has NO exact match anywhere in the
row, which is exactly the single-Name-column case.

**One candidate entry is DEAD and can never match, found during the same audit
and recorded here rather than filed separately because it is harmless.**
`CANDIDATES.email` at `:195` carries `'e mail'`, with a space. `cells` at `:210`
are normed, and `norm` at `:198` strips every non-alphanumeric character, so no
cell can ever contain a space. `'e mail'` therefore fails `indexOf` at `:214` and
`includes` at `:221` for every possible input. It costs nothing, because a header
reading "E-Mail" or "e mail" norms to `"email"` and is caught by the exact
`'email'` candidate on the line before. **It is dead, not broken.**

**No fix proposed, and the shape of a fix is genuinely unobvious**, which is why
this is filed rather than patched. Anchoring the containment match, requiring the
label to sit at a word boundary, or dropping the short labels each trade a class
of correct pre-selection away for a class of wrong one, and none of them can be
evaluated without knowing what real headers look like. The guards above mean
nothing is currently mis-imported, so this is not blocking.

**Filed as an OBSERVATION, not a defect: the two enrollment paths disagree about
whether a name has parts, and both write the same single column.** Both
endpoints behave correctly and neither is doing anything wrong; what is recorded
is the divergence.

**`POST /api/athletes`, the one-at-a-time path, takes a single `name`.**
`functions/api/athletes.js:62` sets `ALLOWED_BODY_KEYS = ['name', 'email',
'consentAcknowledged']`, `:121-122` requires `body.name` to be a non-empty
string, and `:124` stores `out.name = body.name.trim()` whole. There is no
first/last pair in the accepted body, and `:158` rejects any key outside the
allowlist.

**`POST /api/athletes/import` requires firstName AND lastName and joins them.**
`functions/api/athletes/import.js:85` sets `ALLOWED_ROW_KEYS = ['firstName',
'lastName', 'email']`, `:110-111` rejects a row whose `firstName` trims empty,
`:112-113` does the same for `lastName`, and `:121-122` writes the joined
`` `${first} ${last}` `` into `name`, the join its own comment marks as ruled.
All three are required and nothing is optional. The comment at `:106-108` gives
the reason: guessing which half is present, or storing a one-word name, would be
the endpoint inventing a record.

**Both write `athlete.name`, which is ONE column.** `migrations/0001` declares
`name TEXT NOT NULL` on `athlete` and there is no second name column: a grep for
`first_name`, `last_name`, `firstname`, `lastname`, `given_name` and `surname`
across all of `migrations/` returns nothing. **So the split the importer demands
exists only in transit.** It is consumed at the join and is not recoverable from
stored data.

**A precision correction to the scoping pass, recorded rather than quietly
applied.** The minutes said no code anywhere splits `athlete.name`. **The
narrower claim is the true one and it is the one that matters here:
`athlete.name` is never split.** Every read of it renders it whole, at
`AthleteProfile.jsx:89` and `:274`, `FilteredAthletesModal.jsx:45` and
`WorkshopDetail.jsx:223`. But the tree does carry name splits:
`ClientWorkspace.jsx:93` and `:1239` both take `client.name.split(' ')[0]` as a
first name, and `Chrome.jsx:378` splits a display name for initials. Those
operate on the advisor `client` record and on a display string, not on an
athlete, so they do not contradict the finding. They do contradict the sentence
as it was written.

**CLAUDE.md's C-1 FIELDS ruling is the nearest thing to a governing rule, and its
scope over this case is UNVERIFIED.** Quoted verbatim from CLAUDE.md `:787-792`:
"**C-1 FIELDS RULED: DISCARD.** Import stores name and email only, matching what
POST /api/athletes already does when it explicitly NULLs sport, year, position,
phone, notes, badge, management_mode, gps_completed_at and last_active_at. A
roster file will contain those columns; they are dropped. Anything else would be
a second enrollment path with different rules, and the divergence would be
invisible."

**That ruling was written about DISCARDED COLUMNS**, which its own sentence makes
plain: the divergence it forbids is one path keeping fields the other drops. **It
was not written about the shape of the name field**, and whether "a second
enrollment path with different rules" reaches a difference in how a name is
submitted is not something this filing can settle. **It is not asserted to
apply.** It is quoted because a reader who meets this divergence will reach for
it, and should know both that it exists and that its scope here is undecided. The
two paths agree exactly on what is STORED, which is name plus email and nothing
else, so if the ruling is read narrowly as being about stored fields, there is no
divergence at all.

**No fix proposed.** The ruling below settles what happens next, and it is not a
reconciliation of these two shapes.

**RULED: no name splitter will ever be built. Recorded so the question is not
re-opened.** The importer will not accept a single Name column by splitting it,
and no future slice should propose one.

**The reasoning, which is the part worth keeping.** `athlete` has exactly one
name column, proven above. The importer's two halves are joined at
`import.js:121-122` and the split is discarded there, so nothing downstream can
recover it. **A splitter would therefore be guessing, at import time, in order to
produce a string it immediately re-joins.** The guess is not a rounding error: it
is the endpoint deciding something about a person's name that the operator knows
and the file does not encode.

**The shape enumeration. Every one of these is a legitimate thing a single Name
cell can hold, and no rule distinguishes them from the cell alone:**

- `Marcus Thompson`, two tokens, first then last, the shape a splitter would
  assume.
- `Thompson, Marcus`, last then first, comma-delimited, which a naive splitter
  reverses.
- `Marcus James Thompson`, three tokens, where the middle token is a middle name.
- `Anna van der Berg`, four tokens, where three of them are the surname.
- `Maria del Carmen Rodriguez Garcia`, a compound given name and two surnames,
  where every token boundary is a plausible and wrong split point.
- `Chen Wei`, family name first, where the correct split point is right but the
  assignment is inverted.
- `Marcus Thompson Jr.` and `Marcus Thompson III`, where the last token is a
  suffix and not a name at all.
- `Mary-Kate Olsen` and `Jean-Luc Picard`, where a hyphen sits inside a single
  given name.
- A mononym, one token, where there is no last name to produce and the endpoint
  would have to invent one or refuse the row.

**No heuristic separates these, because the information is not in the cell.**
Token count does not: two tokens can be first-last or a mononym plus a suffix,
and four can be a middle name or a particle surname. A comma helps only the
second shape and appears in none of the others. **Whether "Garcia" is a surname
or the second half of a compound one is a fact about the person, and the file
records only the string.** The operator knows; the parser cannot.

**FT RULED: the importer will ACCEPT BOTH SHAPES, with the operator declaring
which.** A single name column, or a first/last pair. **Nothing is inferred either
way**, which is what distinguishes this from the splitter: the operator states
the shape of their file rather than the importer deducing it, and a declared
single-name column is stored as given rather than split. This is consistent with
the module's own standing posture at `parseRoster.js:15-16` and
`ImportRosterModal.jsx:21-24`, both of which record that the import never guesses
a mapping.

**THAT BUILD IS A SEPARATE SLICE AND IS NOT DONE IN THIS COMMIT.** This entry
records the ruling only. Until it lands, the importer requires both halves and a
single-Name-column roster cannot be imported without the operator splitting the
column in their spreadsheet first, which is the current behaviour and is not a
defect.

**FT reports that most real rosters split names into two columns, so the
single-column case is the MINORITY shape.** That is why the current requirement
is workable in the meantime, and it is recorded because it bears on sequencing
rather than on the ruling: the ruling holds regardless of which shape is more
common.

**Filed as STALE DOCUMENTATION, not a defect: `parseRoster.js`'s header docblock
says the import path has no file upload, and the path has had one since
2026-08-27. The code is correct; the docblock is wrong.** Nothing here describes
a behaviour that needs changing. What is recorded is that a module's own header
now misdescribes the arc it belongs to.

**The two contradicting docblocks, both at HEAD `a63fcee`.**

- **The older one: `src/surfaces/enterprise/shared/parseRoster.js:3-8`**, opening
  "PASTED TEXT, not file upload (ruled). There is no file input, no FormData and
  no FileReader anywhere in this path: the operator copies a range out of a
  spreadsheet and pastes it".
- **The newer one: `src/surfaces/enterprise/ImportRosterModal.jsx:37-39`**,
  opening "THREE EQUAL WAYS IN (INPUT SHAPE AMENDED 2026-08-27): drop a file,
  pick a file, or paste. All three end at the same place, a string in `text`,
  which the existing parser consumes unchanged."

**The three code sites that falsify the older one**, each verified at HEAD:

- **`ImportRosterModal.jsx:213`** renders `type="file"` on an `<input>` whose
  `onChange` at `:216` takes `e.target.files[0]` and hands it to `acceptFile`.
  That is a file input, named as absent.
- **`ImportRosterModal.jsx:166`** defines `onDrop`, which at `:169` calls
  `fileFromDrop(e.dataTransfer)` and passes the result to `acceptFile` at `:172`.
  It is wired to the drop zone via `onDrop={onDrop}` at `:243`.
- **`src/surfaces/enterprise/shared/readRosterFile.js`** is a whole module that
  exists only to read uploaded files: `classifyFile` at `:74`, `file.text()` at
  `:124` for the text formats, `XLSX.read(new Uint8Array(await
  file.arrayBuffer()))` at `:144` for the workbook formats, `fileFromDrop` at
  `:194`, and `files[0]` at `:220`. It sits in the same `shared/` directory as
  `parseRoster.js`, one file away from the docblock denying it.

**THE STALENESS IS PARTIAL, AND THE SURVIVING HALF IS TRUE BY ACCIDENT. This is
the part worth recording, because a reader correcting the docblock will otherwise
delete two claims that still hold.** The sentence makes four negative claims and
they do not fail together. Each was tested separately:

- **"PASTED TEXT, not file upload (ruled)" is FALSE** as a description of the
  current path, and the parenthetical `(ruled)` is the specific problem: it cites
  a ruling that was superseded. CLAUDE.md §5.2 carries "INPUT SHAPE AMENDED
  2026-08-27", which supersedes the TRANSPORT half of the original ruling and
  records file upload and drag-and-drop as a basic feature rather than an
  enhancement.
- **"There is no file input" is FALSE**, per `ImportRosterModal.jsx:213` above.
- **"no FormData" is STILL TRUE.** A grep for `FormData` across
  `src/surfaces/enterprise/` and `functions/api/athletes/import.js` returns
  exactly one hit: the docblock line asserting its absence. The endpoint takes
  `context.request.json()` at `import.js:204`, consistent with the INPUT SHAPE
  ruling's reasoning that `request.json()` is the shape with precedent in this
  tree.
- **"no FileReader" is STILL TRUE**, by the same grep, which again returns only
  the docblock's own line. The upload path reads with the Blob methods
  `file.text()` and `file.arrayBuffer()`, not the legacy `FileReader` API.

**So two of the four claims survive a change that removed their premise.** They
were written to mean "there is no upload here, therefore none of upload's
machinery is here", and they now read as true only because the upload that
arrived happened to be built on Blob methods and a JSON body. **The conclusions
outlived the reasoning**, which is why this is filed with the claims separated
rather than as a single stale paragraph.

**The staleness is ONE-SIDED rather than a genuine ambiguity, and the modal's own
docblock is what makes that determinable.** `ImportRosterModal.jsx:37` carries
the amendment date, "INPUT SHAPE AMENDED 2026-08-27", inline in the text. A
reader meeting both docblocks does not have to weigh two undated assertions
against each other or go to the tree to break a tie: one of them names the date
on which the other was superseded. **There is no question about which is current,
only a stale sentence sitting where a reader of the parser will meet it first.**
That is also why this is low-severity: the contradiction is self-resolving for
anyone who reads both, and dangerous only for someone who reads the parser alone
and concludes the arc never took file upload.

**Not filed as part of the containment finding above, though both live in
`parseRoster.js`.** They are unrelated: that one is about `suggestMapping`'s
behaviour, this one is about the module header, and the module header is correct
about `suggestMapping` ("IT NEVER GUESSES A MAPPING" at `:15-16` holds, and the
containment fallback proposes a default the operator confirms rather than a guess
the import acts on).

**No fix proposed, and deliberately not applied here.** The correction is a
comment edit in a source file, which is a code change and not a docs-only commit;
folding it in would put a `src/` edit into a commit whose diff is otherwise one
markdown file. Whoever makes it should keep the two surviving claims, drop the
`(ruled)` parenthetical rather than leave it pointing at a superseded ruling, and
consider whether the module header should describe the arc's input shape at all
now that `ImportRosterModal.jsx` and `readRosterFile.js` both own that concern.

**Filed: on the AUTHENTICATED enterprise tree, a roster with no athletes renders
the literal string "null% of program" as the Actively progressing tile's
sublabel.** Both the Roster and the Overview do it, from character-identical
expressions. Verified by execution against `computeStats`, not by reading. Filed,
not fixed.

**The string, and the two states it sits between.** The sublabel expression at
`EnterpriseRoster.jsx:139-141` was evaluated against three rosters:

```
  empty authenticated roster        consentAware false  rateBaseTotal 0  pct null   ->  "null% of program"
  one athlete, unclaimed            consentAware true   rateBaseTotal 0  pct null   ->  "Not tracked"
  one athlete, claimed + delegated  consentAware true   rateBaseTotal 1  pct 100    ->  "1 of 1 tracked"
```

The middle row is what makes this a defect rather than an absent measurement.
`activelyProgressingPct` is null in the first two rows alike; one athlete later
the same null renders correctly. Nothing about the value changed, only which
branch read it. The empty roster is the ONLY input state in which a null
reaches a render at all: one athlete of any kind, claimed or unclaimed,
delegated or not, flips `consentAware` true and routes the identical null
through the working guard at `:140`.

**The mechanism, and it is the vacuous-truth case.** `consentAware` is
`athletes.some((a) => typeof a.claimed === 'boolean')`
(`enterpriseStats.js:38`). `Array.prototype.some` returns false on an empty array
without ever invoking its predicate, so an empty authenticated roster is
indistinguishable at that test from the demo fixture roster, which the predicate
is actually written to detect. Control therefore takes the `:141` branch, which
is a TEMPLATE LITERAL: `` `${activelyProgressingPct}% of program` ``. Template
interpolation stringifies null to the four characters `null`. The value is null
because `rateBaseTotal` is 0 (`enterpriseStats.js:98`).

**The guard exists, is correct, and is on the wrong side of the branch.** The
`activelyProgressingPct == null ? 'Not tracked'` test at `:140` is the intended
handling, and it is nested INSIDE the `consentAware`-true arm. The one input
state that produces a null while `consentAware` is false never reaches it. This
is not a missing guard; it is a guard placed where the condition it guards
against cannot arrive.

**R4, and a citation collision worth recording rather than working around.** The
rule this contradicts is labelled R4 in the code, at `enterpriseStats.js:94-95`,
quoted verbatim:

    // R4: rateBaseTotal === 0 -> rates are NULL ("Not tracked" in Stage D), NEVER
    // 0% (which would read as a real "nobody progressed" measurement).

CLAUDE.md records the same rule in SECTION 5, in the Enterprise row's P-2 Stage C
text, inside FORK 1 and without the R4 label: "`rateBaseTotal===0` -> rates null
-> Not tracked, never 0%". **It is NOT the R4 in section 5.1.** That one
(`CLAUDE.md:356-357`) is the P-3c ruling, "a **standalone consent card**, not an
unparked settings route", and has nothing to do with rates. Two unrelated rulings
carry the same label in two places, so a filing that cited section 5.1 for this
would send a reader to the wrong one. Cite the code for the label and section 5
for the manifest record.

**What R4 forbids is narrower than what ships here, and the shipped string is
worse than the case R4 names.** R4 refuses a rendered `0%` because it would read
as a real measurement of nobody progressing. `null% of program` is not a false
measurement; it is a visibly broken one, which fails differently and arguably
more loudly. Recorded because the two are easy to conflate: the rule was written
against a plausible falsehood, and what escaped the rule is an implausible one.

**SCOPE, first half: the Overview shares it, from a character-identical
expression.** `EnterpriseOverview.jsx:39-41` and `EnterpriseRoster.jsx:139-141`
are the same three lines. A `grep` for `activelyProgressingPct` across `src/`
returns eight sites in three files: the derivation and return in
`enterpriseStats.js:98` and `:102`, a destructure in each consumer
(`EnterpriseOverview.jsx:29`, `EnterpriseRoster.jsx:129`), the guarded arm in
each (`:40`, `:140`), and the unguarded interpolation in each (`:41`, `:141`).
**Two unguarded sites, no others, and no other surface reads the value at all.**

**SCOPE, second half: a non-empty authenticated roster CANNOT reach it, and this
is established from the tree rather than assumed.** `claimed` is assigned in
exactly two places, both unconditional boolean coercions:
`functions/api/athletes.js:111`, `claimed: !!row.person_id`, and
`src/contexts/AthletesContext.jsx:163`, `claimed: false`, on staged import rows.
Every `setAthletes` call site in `AthletesContext.jsx` was enumerated (`:42`,
`:57`, `:72`, `:87`, `:98`, `:111`, `:121`, `:167`, `:174`, `:181`, `:207`,
`:221`, `:237`). The five that INSERT on the authenticated tree are `:42` (initial
state, from `EnterpriseSurface.jsx:81` -> `/api/me` -> `me.js:411`, which maps
`toAthleteElement`), `:72` (`add()`, from `athletes.js:226`), `:98` (`update()`,
from `athletes/[id].js:306`), `:167` (`stageImport()`, the literal above) and
`:207` (`saveStaged()`, from `import.js:362`). Four route through
`toAthleteElement` and the fifth writes the literal. The remaining call sites are
the `!authenticated` demo branches and filters. **So every athlete on an
authenticated roster carries a boolean `claimed`, and `athletes.length === 0` is
the only route to `consentAware === false` there.** The demo tree never reaches
it either: its 16 fixture athletes omit `claimed`, so `consentAware` is false by
design, but `rateBaseTotal` is then 16 and the percentage is a real number.

**The state is REACHABLE, and it is the first thing a new institution sees.**
`EnterpriseSurface.jsx:81` seeds the authenticated roster as
`appIdentity?.identity?.enterprise?.athletes ?? []`, so a provisioned staff
account holds an empty array until its first enrollment. The grid at
`EnterpriseRoster.jsx:167` sits outside every `athletes.length` condition; only
the `Card` contents at `:288` branch on emptiness, into the "No athletes enrolled
yet." block. The seven tiles therefore render on an empty roster, reading 0, with
this string under the Actively progressing one. `EnterpriseOverview.jsx:112` is
ungated in the same way, and that file's own comment at `:26` states the
assumption the defect sits inside: "Stat tiles follow the roster data
automatically (computeStats([]) -> zeros)." Zeros were anticipated. A null was
not.

**One adjacent site that is NOT this defect, named so the two are not merged.**
`EnterpriseOverview.jsx:140` renders `({gpsRate}%)` as a JSX CHILD rather than
through a template literal. React renders a null child as nothing, so that
expression produces `(%)` on an empty roster, not `(null%)`. Different variable,
different mechanism, different output, and whether an empty parenthesised percent
sign is itself worth filing is a separate question this filing does not reach.

**SEVERITY, recorded because where this sits in the tree understates where it
appears to a customer.** This is what a newly provisioned enterprise account
displays before its first enrollment, so it is not a state reached after some
sequence of actions: it is the roster and the overview an institution meets on
its first authenticated load. It appears on the AUTHENTICATED tree ONLY, which
is the surface a pilot institution is given, and the demo tree cannot reach it
at all. That makes it a first-impression defect on the customer surface rather
than a demo-tree cosmetic one.

**No fix proposed.**

**PARKED SCOPING ITEM, not a defect and not a queued build: a StewardHouse iOS
app.** Recorded so it is FOUND later rather than acted on now. Nothing below
describes anything wrong with the tree. The founder ruling is dated 2026-09-01
and is recorded first; everything after it is SCOPING NOTES, which are
observations from a read-only pass and carry no ruling force.

**FT RULED 2026-09-01, three parts.** An iOS app, IF it is ever built, must be
a REAL FUNCTIONING APP DESIGNED FOR THE PHONE. It must not be a truncated or
reflowed view of the desktop surface, and **a PWA or add-to-home-screen wrapper
around the existing renderer does NOT satisfy this ruling.** Audience scope as
ruled: individuals certainly, advisors and enterprise possibly, **Operations
OUT**. And **PARKED**: no design, no build, and no dependency may be added
toward it, and nothing in the current arc is to be shaped around it.

**SCOPING NOTE, auth: the session rides a COOKIE, and there is no second
mechanism.** `functions/api/me.js:43` reads the session as
`auth.api.getSession({ headers: context.request.headers })`, and better-auth's
own cookie handling is what populates those headers;
`functions/_lib/auth.js:174` sets `cookieCache: { enabled: false }`, which
tunes that mechanism rather than replacing it. On the client every
authenticated call passes `credentials: 'include'` (`AppIdentityContext.jsx:42`
and every write in `AthletesContext.jsx`, `ClientsContext.jsx` and their
siblings). **No inbound bearer-token path exists anywhere in the tree**: a grep
for `Authorization` and `Bearer` across `src/` and `functions/` returns one
functional hit, `functions/_lib/sender.js:39`, which is the OUTBOUND Resend API
key and is not an authentication path into this application. A native iOS
client has no same-origin cookie context, so it would need bearer tokens and a
token-issuing endpoint, and **neither exists**. **That doubles the
authentication surface, and it would double it while the auth observability gap
is still open.** This queue records that gap at `:1106-1111`, which resolves it
to CLAUDE.md section 11.

**Recorded in passing, verified while following that pointer and NOT a
correction to the paragraph it concerns**, which is left exactly as written:
the line numbers inside `:1106-1111` have DRIFTED. It states that section 11
begins at `CLAUDE.md:2106` and that the filing sits at `:2170-2174`. At HEAD
the section 11 heading is at `:2170` and the observability filing opens at
`:2234`. The pointer still resolves by section; only the line numbers are
stale, and they are stale because CLAUDE.md grew beneath them.

**SCOPING NOTE, magic links: the return path is the hard part, and it is
UNVERIFIED here.** An emailed link opens the system browser, not an app. Coming
back into a native app requires universal links, which require an
Apple-hosted-domain association file and a provisioned Apple Developer team.
**None of that is established from this tree**, because none of it is in this
tree: it is an Apple platform requirement, recorded so a later reader does not
discover it after committing to a direction. What IS established from the tree
is the shape of the existing flow, which is browser-terminated by construction:
the verify request sets the session cookie on whichever origin served it and
then redirects to `BETTER_AUTH_URL` (CLAUDE.md section 9 records the origin
stranding that follows from exactly this).

**SCOPING NOTE, the Apple Developer account, which is a FOUNDER-JUDGMENT ITEM
and is NOT resolved here.** An Apple Developer ORGANIZATION account requires a
legal entity and a D-U-N-S number. **No entity formation is recorded anywhere
in this repository**: a grep of CLAUDE.md for `LLC`, `incorporat`, `legal
entity`, `D-U-N-S`, `DUNS`, `Delaware` and `501(c)` returns exit status 1, no
match, and the only hits across `docs/` are fictional org names in fixtures and
sample ProPublica records, none of them StewardHouse's own. The alternative is
an INDIVIDUAL account, which would place StewardHouse's entire iOS presence in
a personal name. Recorded as the choice it is; nothing here resolves it.

**SCOPING NOTE, honesty-surface duplication, and this is the one that touches
the guardrails directly.** Every disclosure surface would exist in two
renderers: `RateDisclosure` (`src/surfaces/enterprise/shared/RateDisclosure.jsx`),
the consent card (`src/surfaces/individual/RecordKeeping.jsx`), and the "Not
tracked" language, which a grep places at 30 sites across `src/`. **The current
discipline holds PARTLY BECAUSE THERE IS ONE RENDERER.** CLAUDE.md section 6
rule 14 defines the demo-tree byte-identical claim as a per-slice isolation
proof, and section 7 carries the absence-gating rules it serves: "Demonstrative
vs LIVE honesty boundary", "Aggregate-default with purposeful drill", and "Path
B, the structural-not-advisory boundary". Every one of those is enforced today
by convention over a single codebase, and CLAUDE.md section 6 opens by recording
that NOTHING in this repository enforces any of it automatically. **Two
renderers would create a drift surface for precisely the disclosures Path B
depends on**, and the drift would be invisible to the one check that exists,
since `npm run build` is `vite build` and would not read a second client at all.

**SCOPING NOTE, App Store review: FLAGGED, NOT RESOLVED.** Review would evaluate
whether the product gives financial or philanthropic advice. Path B's answer is
that it does not, and the answer is structural rather than a disclaimer: the
platform organizes what an advisor or funder decides and does not decide for
them. That answer would be made to a reviewer who arrives without any of this
context. **How a reviewer would read it is UNVERIFIED and cannot be established
from the tree.**

**No path forward is proposed here. Neither PWA nor native is recommended, and
this item is not ranked against anything else in this queue.** It exists to be
found.

**Filed: flow content is rendered inside `<button>` at 20 sites across 7 files.**
The HTML content model for `<button>` is PHRASING content. `p`, `div`, `h1`
through `h6`, `ul`, `li` and `table` are FLOW content and are not permitted
there. Re-verified against HEAD `e396306` by execution, with a known-positive
control asserted before any count was trusted. Filed, not fixed.

**THE FULL ENUMERATION, by file and line.** Each line names the offending
element and the `<button>` it sits inside.

    src/components/BarChart.jsx:95                 <div>  in <button> at :85
    src/components/BarChart.jsx:108                <div>  in <button> at :85
    src/components/BarChart.jsx:129                <div>  in <button> at :85
    src/components/ContactsDirectory.jsx:45        <div>  in <button> at :31
    src/components/ContactsDirectory.jsx:46        <p>    in <button> at :31
    src/components/ContactsDirectory.jsx:47        <p>    in <button> at :31
    src/components/FilteredAthletesModal.jsx:45    <p>    in <button> at :31
    src/components/FilteredAthletesModal.jsx:46    <p>    in <button> at :31
    src/components/FilteredAthletesModal.jsx:47    <p>    in <button> at :31
    src/components/StatTile.jsx:61                 <p>    in <button> at :40
    src/components/StatTile.jsx:62                 <p>    in <button> at :40
    src/components/StatTile.jsx:63                 <p>    in <button> at :40
    src/surfaces/enterprise/EnterpriseCompliance.jsx:133   <p>   in <button> at :123
    src/surfaces/enterprise/EnterpriseCompliance.jsx:134   <p>   in <button> at :123
    src/surfaces/enterprise/EnterpriseCompliance.jsx:135   <p>   in <button> at :123
    src/surfaces/enterprise/reports/ProgramSummary.jsx:235 <div> in <button> at :221
    src/surfaces/enterprise/reports/ProgramSummary.jsx:236 <div> in <button> at :221
    src/surfaces/enterprise/reports/ProgramSummary.jsx:237 <div> in <button> at :221
    src/surfaces/individual/Questions.jsx:765      <div>  in <button> at :749
    src/surfaces/individual/Questions.jsx:774      <div>  in <button> at :749

Six of the seven files carry three sites each; `Questions.jsx` carries two.
All four surfaces are represented, plus four shared components.

**`Button.jsx` IS CLEAN, and that is the most useful fact here.** The component
intended as the shared button is not the problem, so this is not a defect in the
design system. `Button.jsx:107` renders a bare `{children}` inside its
`<button>`, so what it contains is entirely a property of its call sites. There
are **124** of them, and **exactly ONE passes any element child**:
`CurriculumLibrary.jsx:122`, which passes a `<span>` wrapping a `<Tag>`. `Tag`
renders a `<span>` as its root (`Tag.jsx:22`). Both are PHRASING content, so
that site is valid. Every other one of the 124 passes a string. **The 20 sites
above are therefore all hand-rolled `<button>` elements written outside the
shared component**, which is what let them diverge from it.

**SCOPE: the `StatTile.jsx` instance is the widest of the seven.** Every roster
and overview tile passes an `onClick`, and `StatTile.jsx:15-25` routes any tile
with an `onClick` through `ClickableTile`, which is the `<button>` at `:40`. So
all seven tiles on `EnterpriseRoster` and all seven on `EnterpriseOverview`
render three `<p>` elements inside a `<button>` each, on both the demo and the
authenticated tree, on every load. The other six files are narrower: a chart
bar, two directory rows, an exclusion row, a workshop row, and an onboarding
option.

**CONSEQUENCE, stated as what IS and IS NOT established.** What is established
is the content-model violation itself, which is a fact about the markup and is
enumerated above. What is also established is why it survived: **browsers render
it without visible error.** There is no parse failure, no console warning from
the browser, and nothing in the build touches it, so nothing in this project's
one automated check would ever surface it. **Whether it changes
accessibility-tree exposure or how a screen reader announces these controls is
UNVERIFIED and cannot be established from this tree.** That question needs
assistive technology on a device, which has not been run. **No claim about
screen-reader behaviour is made here**, and a later reader should not treat the
violation as evidence of one.

**HOW THE COUNT WAS ARRIVED AT, and the earlier miss, recorded because a naive
re-check will under-count exactly the same way.** The first scan of this
question reported **3** sites where there are **20**. The scanner built its
matcher by CONCATENATING A STRING rather than writing a regex literal, and the
intended suffix `'(?=[\\s>/]|$)'` lost a backslash TWICE, at two separate
stages. One was consumed writing the script to disk, leaving `'(?=[\s>/]|$)'`
in the file. JavaScript then consumed the second when it evaluated that
single-quoted string, because `'\s'` is not a recognised escape and
evaluates to a bare `s`. The engine received the literal class `[s>/]` and
required the character after a tag name to be `s`, `>` or `/`. **`<p style=`
is followed by a SPACE and never matched.** The only hits that survived were
tags sitting at end of line, which is why `BarChart.jsx` appeared and the
other six files did not, and why the result looked like a plausible small
finding rather than a broken tool.

**What caught it was asserting a KNOWN-POSITIVE CONTROL**, not reading the
output. `StatTile.jsx:61-63` were known to be three `<p>` inside a `<button>`
before the scan ran, so a scan returning zero for that file was a broken scan
regardless of what it reported elsewhere. The re-verification for this filing
asserts that control first and exits non-zero if it does not hold, and it uses
regex LITERALS only, since a literal cannot lose a backslash the way a
constructed string can. **A grep is the wrong tool for this question anyway:**
the nesting is multi-line, so establishing that a `<p>` is INSIDE a `<button>`
requires tracking element depth, which a line-oriented grep cannot do.

**Not counted, and named so the number is not over-read.** The scan sees literal
`<button>` elements only. A component that renders flow content and is used
inside a hand-rolled `<button>` would not appear, so **20 is a floor rather than
a total.** `Button.jsx`'s 124 call sites were checked separately, by the
element-child pass described above.

**No fix proposed.**
