# Client record rulings (pre-slice-2b)
FT-ruled 7/2/26 at Aisha product review, amended same day (Alex, Parker; R3 re-ruled after launch-scope correction). These govern write slice 2b (client CRUD UI). Endpoints from slice 2a already support the full schema; these rulings constrain what the UI exposes and how.

LAUNCH SCOPE (governing context): The current build and launch serve ATHLETES ONLY. No design, labeling, or product argument in 2b may assume music, entertainment, or creator audiences.

R1 - Minimum viable create. Create form asks for name ONLY (required). Initials derived from name client-side at create so the advisor sees and can correct before submit; algorithm: first grapheme of first token + first grapheme of last token, uppercase; single-token names take first two graphemes; editable anytime after. Stage defaults to New SERVER-SIDE in POST /api/clients (verify: an absent stage in the payload still lands the row as New — a form-only default breaks future non-form callers). All other fields absent from create; filled through use via edit/PUT. A ten-second create happens during the client conversation; a two-minute one gets deferred.

R2 - Stage is asserted, never derived. The advisor sets and changes stage manually. The platform never infers stage from activity (sessions logged, plans created, etc.). Path B discipline: expose what the advisor declared; never compute a judgment about a relationship.

R3 - Field stays "Sport" (re-ruled). Original Focus relabel was reasoned from multi-sector audiences that are NOT part of this launch. Athletes-only scope makes Sport the precise, native label. UI label: Sport; free-text input; no rename debt, no controlled vocabulary in the pilot. If a future vertical opens, the label question reopens then with real context.

R4 - 2b scope boundary. IN: create flow (per R1), roster rendering real data, basic field edit, session logging, note capture (wire ClientWorkspace's existing local note UI to POST /api/client-notes), cohort membership add/remove UI, CohortDetail disclaimer copy fix (auth tree persists via provider since slice 2a). OUT: any create/edit UI for giving_plan, next_session_agenda, pipeline_state - endpoints exist, UI deferred; each gets its own design pass (giving_plan is the philanthropic heart of the record and will not be a JSON textarea).

R5 - No client contact fields, deliberately. No email/phone columns for client in schema or UI until the parked Q7-counsel item resolves. A contact field turns the platform from system-of-record-about into channel-to the advisor's clients - a materially different consent posture. The client record describes the relationship; it does not reach into it. Recorded as a decision, not an omission. Posture on free-text content (Parker): client_note content and all free-text fields are advisor work product - StewardHouse stores them and never parses, mines, surfaces, or acts on their content.

R6 - Stage never reads as ranking. Stage renders as a neutral chip. Roster default sort: next_session_date, alphabetical fallback. NO sort-by-stage control, NO aggregate stage counts on the roster, NO stage-progress visuals or nudges. The no-scoring discipline held for nonprofits applies to the advisor's own clients.

Open prerequisite for 2b scoping (not a ruling): first real invited advisor named by FT - determines whether 2b builds to a demo-polish bar or a real-practice bar.
