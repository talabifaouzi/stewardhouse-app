# Client record rulings (pre-slice-2b)
FT-ruled 7/2/26 at Aisha product review. These govern write slice 2b (client CRUD UI). Endpoints from slice 2a already support the full schema; these rulings constrain what the UI exposes and how.

R1 - Minimum viable create. Create form asks for name ONLY (required). Initials derived from name, editable later. Stage defaults to New. All other fields absent from create; filled through use via edit/PUT. A ten-second create happens during the client conversation; a two-minute one gets deferred.

R2 - Stage is asserted, never derived. The advisor sets and changes stage manually. The platform never infers stage from activity (sessions logged, plans created, etc.). Path B discipline: expose what the advisor declared; never compute a judgment about a relationship.

R3 - "Sport" renders as "Focus." UI label is Focus; free-text input with known roster values as type-ahead suggestions; writes to the existing `sport` column. Rationale: the platform serves musicians, entertainers, and creators - a field labeled Sport signals exclusion (Schrepferman: know who the platform is not for, and do not accidentally tell the wrong people it is not for them). Schema rename sport->focus is DOCUMENTED DEBT for the next migration that touches client; do not migrate for this alone. No controlled vocabulary in the pilot - a dropdown is a premature taxonomy.

R4 - 2b scope boundary. IN: create flow (per R1), roster rendering real data, basic field edit, session logging, note capture (wire ClientWorkspace's existing local note UI to POST /api/client-notes), cohort membership add/remove UI, CohortDetail disclaimer copy fix (auth tree persists via provider since slice 2a). OUT: any create/edit UI for giving_plan, next_session_agenda, pipeline_state - endpoints exist, UI deferred; each gets its own design pass (giving_plan is the philanthropic heart of the record and will not be a JSON textarea).

R5 - No client contact fields, deliberately. No email/phone columns for client in schema or UI until the parked Q7-counsel item resolves. A contact field turns the platform from system-of-record-about into channel-to the advisor's clients - a materially different consent posture. The client record describes the relationship; it does not reach into it. Recorded as a decision, not an omission.

R6 - Stage never reads as ranking. Stage renders as a neutral chip. Roster default sort: next_session_date, alphabetical fallback. NO sort-by-stage control, NO aggregate stage counts on the roster, NO stage-progress visuals or nudges. The no-scoring discipline held for nonprofits applies to the advisor's own clients.

Open prerequisite for 2b scoping (not a ruling): first real invited advisor named by FT - determines whether 2b builds to a demo-polish bar or a real-practice bar.
