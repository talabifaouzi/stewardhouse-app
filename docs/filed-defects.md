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
