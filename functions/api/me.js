// GET /api/me — the caller's own identity (auth_user + person.type/display_name).
// First SELECT query in functions/ — same Kysely-over-D1 pattern already proven by
// the (c) hook's UPDATE/INSERT statements in _lib/auth.js.
//
// Response shapes:
//   No session:                200, body null
//   Session, no person match:  200, body { user: { email }, person: null }
//   Session, matched:          200, body { user: { email }, person: { type, displayName, intake, gifts, scenarios, advisor? } }
//
// advisor field is present ONLY for person.type='advisor'. It carries the
// slim-scope Q11 payload the wire-surfaces slice needs: practiceProfile
// (from person.extensions.advisor), practiceLessons, docCategories (docs
// nested per-category), cohorts. All owner-scoped via indexed reads
// (owner_advisor_person_id = person.id). Q7 gate holds: client / session /
// note / cohort_member are NOT included here — they enter via separate
// endpoints when the gated write path enables.
//
// person: null is defensive — the (c) hook always creates or claims a person row on
// sign-in, so this shouldn't happen in practice, but callers must not assume person
// is always present.

import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { makeAuth } from '../_lib/auth.js';
import { ATHLETE_ELEMENT_COLUMNS, toAthleteElement } from './athletes.js';
import { WORKSHOP_ELEMENT_COLUMNS, toWorkshopElement } from './workshops.js';
import { EXCLUSION_ELEMENT_COLUMNS, toExclusionElement } from './exclusions.js';
import { toAuditElement } from '../_lib/audit.js';
import { SNAPSHOT_ELEMENT_COLUMNS, toSnapshotElement } from './snapshots.js';

export async function onRequest(context) {
  const auth = makeAuth(context.env);

  const session = await auth.api.getSession({ headers: context.request.headers });

  if (!session || !session.user) {
    return new Response('null', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Kysely({
    dialect: new D1Dialect({ database: context.env.DB }),
  });

  const person = await db
    .selectFrom('person')
    .select(['id', 'type', 'display_name', 'extensions'])
    .where('auth_user_id', '=', session.user.id)
    .executeTakeFirst();

  let intake = null;
  if (person && person.extensions) {
    try {
      const parsed = JSON.parse(person.extensions);
      intake = parsed.individual ?? null;
    } catch {
      intake = null;
    }
  }

  let gifts = [];
  if (person) {
    const rows = await db
      .selectFrom('gift')
      .select([
        'id', 'recipient_org_name', 'amount', 'date', 'type', 'vehicle',
        'recurring', 'recurring_years', 'notes', 'purpose', 'exported_to_cpa',
      ])
      .where('giver_person_id', '=', person.id)
      .orderBy('date', 'desc')
      .execute();
    gifts = rows.map((row) => ({
      id: row.id,
      org: row.recipient_org_name,
      amount: row.amount,
      date: row.date,
      type: row.type,
      vehicle: row.vehicle,
      recurring: !!row.recurring,
      recurringYears: row.recurring_years,
      notes: row.notes,
      purpose: row.purpose,
      exportedToCpa: !!row.exported_to_cpa,
    }));
  }

  let scenarios = [];
  if (person) {
    const rows = await db
      .selectFrom('scenario')
      .select(['id', 'label', 'created_at', 'inputs', 'derived_at_snapshot'])
      .where('owner_person_id', '=', person.id)
      .orderBy('created_at', 'desc')
      .execute();
    scenarios = rows.map((row) => {
      let inputs = {};
      try { inputs = JSON.parse(row.inputs); } catch { inputs = {}; }
      let derivedAtSnapshot = null;
      if (row.derived_at_snapshot) {
        try { derivedAtSnapshot = JSON.parse(row.derived_at_snapshot); } catch { derivedAtSnapshot = null; }
      }
      return { id: row.id, label: row.label, createdAt: row.created_at, inputs, derivedAtSnapshot };
    });
  }

  let advisor = null;
  if (person?.type === 'advisor') {
    // practiceProfile is an EXPLICIT ALLOWLIST pick from parsed.advisor —
    // never the whole sub-blob. Same reasoning as the write-path allowlist:
    // the wire contract declares its fields, never inherits the blob. Two
    // reasons this matters: (1) `$.advisor.demo_gate` (role-gate marker per
    // schema-draft §6 amended in write slice 1) also lives at this JSON
    // path — passing the blob through would leak the gate flag to every
    // authenticated client on every /api/me poll; (2) any future
    // `$.advisor.*` key added for another server-only purpose (say a
    // Q7-resolution allowlist marker) would silently ship to the client
    // without explicit opt-in. Absent keys emit as null so the wire
    // contract shape stays stable.
    const parsedAdvisorExt = (() => {
      if (!person.extensions) return null;
      try {
        const parsed = JSON.parse(person.extensions);
        return parsed && typeof parsed === 'object' ? parsed.advisor ?? null : null;
      } catch { return null; }
    })();
    const practiceProfile = {
      practiceName: parsedAdvisorExt?.practiceName ?? null,
      advisorTitle: parsedAdvisorExt?.advisorTitle ?? null,
      practiceFocus: parsedAdvisorExt?.practiceFocus ?? null,
    };

    const practiceLessonRows = await db
      .selectFrom('practice_lesson')
      .select([
        'id', 'kind', 'base_id', 'status', 'title', 'minutes',
        'scope', 'category', 'summary', 'materials',
        'created_at', 'updated_at',
      ])
      .where('owner_advisor_person_id', '=', person.id)
      .orderBy('created_at', 'desc')
      .execute();
    const practiceLessons = practiceLessonRows.map((row) => {
      let materials = null;
      if (row.materials) {
        try { materials = JSON.parse(row.materials); } catch { materials = null; }
      }
      return {
        id: row.id,
        kind: row.kind,
        baseId: row.base_id,
        status: row.status,
        title: row.title,
        minutes: row.minutes,
        scope: row.scope,
        category: row.category,
        summary: row.summary,
        materials,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    const docCategoryRows = await db
      .selectFrom('doc_category')
      .select(['id', 'label', 'hint', 'created_at'])
      .where('owner_advisor_person_id', '=', person.id)
      .execute();
    let docCategories = [];
    if (docCategoryRows.length > 0) {
      const categoryIds = docCategoryRows.map((c) => c.id);
      const docRows = await db
        .selectFrom('doc')
        .select(['id', 'category_id', 'title', 'updated', 'notes', 'body', 'created_at'])
        .where('category_id', 'in', categoryIds)
        .execute();
      docCategories = docCategoryRows.map((cat) => ({
        id: cat.id,
        label: cat.label,
        hint: cat.hint,
        docs: docRows
          .filter((d) => d.category_id === cat.id)
          .map((d) => {
            let body = [];
            if (d.body) {
              try { body = JSON.parse(d.body); } catch { body = []; }
            }
            return {
              id: d.id,
              title: d.title,
              updated: d.updated,
              notes: d.notes,
              body,
            };
          }),
      }));
    }

    const cohortRows = await db
      .selectFrom('cohort')
      .select([
        'id', 'name', 'focus', 'started', 'next_session_date', 'summary',
        'external_members', 'assigned_lessons', 'updates', 'sessions',
        'created_at', 'updated_at',
      ])
      .where('owner_advisor_person_id', '=', person.id)
      .orderBy('created_at', 'desc')
      .execute();
    const parseJsonOr = (s, fallback) => {
      if (!s) return fallback;
      try { return JSON.parse(s); } catch { return fallback; }
    };

    // cohort_member: single scoped read across all this advisor's cohorts.
    // If there are zero cohorts we skip the query — .where('in', []) is a
    // syntactically dubious edge case worth avoiding.
    let memberRowsByCohort = new Map();
    if (cohortRows.length > 0) {
      const cohortIds = cohortRows.map((c) => c.id);
      const memberRows = await db
        .selectFrom('cohort_member')
        .select(['cohort_id', 'client_id', 'joined_at'])
        .where('cohort_id', 'in', cohortIds)
        .execute();
      for (const m of memberRows) {
        if (!memberRowsByCohort.has(m.cohort_id)) {
          memberRowsByCohort.set(m.cohort_id, []);
        }
        memberRowsByCohort.get(m.cohort_id).push(m.client_id);
      }
    }

    const cohorts = cohortRows.map((row) => ({
      id: row.id,
      name: row.name,
      focus: row.focus,
      started: row.started,
      nextSession: row.next_session_date,
      summary: row.summary,
      externalMembers: row.external_members,
      assignedLessons: parseJsonOr(row.assigned_lessons, []),
      updates: parseJsonOr(row.updates, []),
      sessions: parseJsonOr(row.sessions, []),
      // Populated from cohort_member where cohort_id matches; always [] if
      // no members. Preserves the every-array-key-present invariant that the
      // fold-in signal relies on (initialState !== undefined ↔ authenticated).
      memberIds: memberRowsByCohort.get(row.id) ?? [],
    }));

    // Clients + nested sessions + notes. Payload note: this is the first
    // /api/me block that grows per-client and per-session over time rather
    // than staying roughly fixed. Pagination / split-fetch is documented
    // debt — revisit when a real practice's payload gets heavy. Same #116
    // "close as documented debt at current scale, revisit when consumer set
    // changes" precedent.
    const clientRows = await db
      .selectFrom('client')
      .select([
        'id', 'name', 'initials', 'sport', 'level', 'stage',
        'relationship_started_year', 'summary', 'next_session_date',
        'giving_plan', 'next_session_agenda', 'pipeline_state',
        'created_at', 'updated_at',
      ])
      .where('owner_advisor_person_id', '=', person.id)
      .orderBy('created_at', 'desc')
      .execute();

    let clients = [];
    if (clientRows.length > 0) {
      const clientIds = clientRows.map((c) => c.id);
      const sessionRows = await db
        .selectFrom('client_session')
        .select([
          'id', 'client_id', 'date', 'title', 'summary',
          'decisions', 'action_items', 'created_at',
        ])
        .where('client_id', 'in', clientIds)
        .orderBy('date', 'desc')
        .execute();
      const noteRows = await db
        .selectFrom('client_note')
        .select(['id', 'client_id', 'date', 'content', 'tags', 'created_at'])
        .where('client_id', 'in', clientIds)
        .orderBy('date', 'desc')
        .execute();
      clients = clientRows.map((row) => ({
        id: row.id,
        name: row.name,
        initials: row.initials,
        sport: row.sport,
        level: row.level,
        stage: row.stage,
        relationshipStartedYear: row.relationship_started_year,
        summary: row.summary,
        nextSession: row.next_session_date,
        givingPlan: parseJsonOr(row.giving_plan, null),
        nextSessionAgenda: parseJsonOr(row.next_session_agenda, null),
        pipeline: parseJsonOr(row.pipeline_state, null),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        clientSessions: sessionRows
          .filter((s) => s.client_id === row.id)
          .map((s) => ({
            id: s.id,
            date: s.date,
            title: s.title,
            summary: s.summary,
            decisions: parseJsonOr(s.decisions, []),
            actionItems: parseJsonOr(s.action_items, []),
            createdAt: s.created_at,
          })),
        clientNotes: noteRows
          .filter((n) => n.client_id === row.id)
          .map((n) => ({
            id: n.id,
            date: n.date,
            content: n.content,
            tags: parseJsonOr(n.tags, []),
            createdAt: n.created_at,
          })),
      }));
    }

    advisor = { practiceProfile, practiceLessons, docCategories, cohorts, clients };
  }

  // Enterprise/staff identity block (E-Slice 5a). Relational join is the
  // authoritative source for role + institution — NOT person.extensions
  // (the seeded $.enterprise.{title,organization} copy would drift the
  // moment a role/name changes via the enterprise write path, which
  // updates institution_contact / institution, not extensions). Same
  // allowlist-pick discipline as the advisor block above: three named
  // fields, absent → null, and NEVER emit extensions or any
  // $.enterprise.* server-side key to the client.
  let enterprise = null;
  if (person?.type === 'staff') {
    // Which institution does this staff person operate? A person may hold
    // more than one institution_contact row (E4 cross-role identity), so
    // prefer the is_default_operator=1 row deterministically. Read is
    // covered by idx_institution_contact_person_id (0009).
    const contact = await db
      .selectFrom('institution_contact')
      .select(['institution_id', 'role_title', 'is_default_operator'])
      .where('person_id', '=', person.id)
      .orderBy('is_default_operator', 'desc')
      .executeTakeFirst();

    let institution = null;
    let athletes = [];
    let workshops = [];
    let exclusions = [];
    let complianceAudit = [];
    let snapshots = [];
    if (contact) {
      institution = await db
        .selectFrom('institution')
        .select(['name', 'program_term', 'contract_label', 'endowment_annual', 'endowment_current'])
        .where('id', '=', contact.institution_id)   // PRIMARY KEY
        .executeTakeFirst();

      // Institution athlete roster (E-Slice E-Write-1). Owner-scoped by
      // institution_id (idx_athlete_institution_id). Mapped to the fixture-
      // shaped element AthletesProvider consumes (camelCase, activity: []),
      // via the shared toAthleteElement so the /api/me roster and the
      // POST /api/athletes round-trip stay identical. notes rides along here
      // because this block is STAFF-ONLY (RequireType('staff')) — it is never
      // emitted to athlete-facing or cross-surface reads (E8 never-emit side).
      const athleteRows = await db
        .selectFrom('athlete')
        .select(ATHLETE_ELEMENT_COLUMNS)
        .where('institution_id', '=', contact.institution_id)
        // Exclude anonymized stubs (E-Write-2): a 'Sunset' row is E9-snapshot
        // residue (class + sport cohort tally), never an active roster row.
        .where('enrollment_status', '!=', 'Sunset')
        .orderBy('created_at', 'desc')
        .execute();
      athletes = athleteRows.map(toAthleteElement);

      // Institution workshops (E-Write-3a). Owner-scoped by institution_id
      // (idx_workshop_institution_id), ORDER BY date so the calendar and the
      // WorkshopsProvider share one ordering. Attendance is nested per workshop
      // via a single IN query grouped by workshop_id (the advisor cohort_member
      // nesting shape), mapped through the same toWorkshopElement used by the
      // POST round-trip so the two paths stay identical.
      //
      // Q7 DEBT: attendance[] rides inside this staff payload; it grows
      // per-workshop-per-athlete as a real institution accrues sessions.
      // Revisit to a per-workshop fetch (on WorkshopDetail open) when a real
      // institution's payload is measurable. Empty at 3a — no attendance write
      // path exists until 3b.
      const workshopRows = await db
        .selectFrom('workshop')
        .select(WORKSHOP_ELEMENT_COLUMNS)
        .where('institution_id', '=', contact.institution_id)
        .orderBy('date')
        .execute();
      let attendanceByWorkshop = new Map();
      if (workshopRows.length > 0) {
        const workshopIds = workshopRows.map((w) => w.id);
        const attendanceRows = await db
          .selectFrom('workshop_attendance')
          .select(['workshop_id', 'athlete_id', 'attended', 'note'])
          .where('workshop_id', 'in', workshopIds)
          .execute();
        for (const a of attendanceRows) {
          if (!attendanceByWorkshop.has(a.workshop_id)) {
            attendanceByWorkshop.set(a.workshop_id, []);
          }
          attendanceByWorkshop.get(a.workshop_id).push(a);
        }
      }
      workshops = workshopRows.map(
        (w) => toWorkshopElement(w, attendanceByWorkshop.get(w.id) ?? []),
      );

      // Institution exclusions (E-Write-4). Owner-scoped by institution_id
      // (idx_exclusion_institution_id). connection_detail rides in this element
      // — STAFF-ONLY (RequireType('staff')); per E8 it is emitted nowhere else
      // (never-emit side of the athlete-facing/cross-surface allowlist).
      const exclusionRows = await db
        .selectFrom('exclusion')
        .select(EXCLUSION_ELEMENT_COLUMNS)
        .where('institution_id', '=', contact.institution_id)
        .orderBy('created_at', 'desc')
        .execute();
      exclusions = exclusionRows.map(toExclusionElement);

      // Compliance audit log (E-Write-4, E7). Owner-scoped, NEWEST-FIRST. The
      // author display name resolves via a leftJoin to person (the row stores
      // user_person_id + the frozen user_role); user_role is NOT re-derived
      // (append-only historical accuracy).
      const auditRows = await db
        .selectFrom('compliance_audit as ca')
        .leftJoin('person as p', 'p.id', 'ca.user_person_id')
        .select([
          'ca.id as id', 'ca.timestamp as timestamp', 'ca.user_role as user_role',
          'ca.action as action', 'ca.target as target', 'ca.reason as reason',
          'ca.notes as notes', 'p.display_name as user_display',
        ])
        .where('ca.institution_id', '=', contact.institution_id)
        .orderBy('ca.timestamp', 'desc')
        .execute();
      complianceAudit = auditRows.map((r) => toAuditElement(r, r.user_display));

      // Cohort period snapshots (E-Write-5, E9). Owner-scoped, NEWEST-FIRST
      // (snapshot_at desc). Frozen historical aggregates — seeds
      // SnapshotsProvider; CohortComparison renders 0 → gate, 1 → single-cohort,
      // ≥2 → year-over-year (the two most recent). The two nullable aggregates
      // pass through as null (rendered "Not tracked").
      const snapshotRows = await db
        .selectFrom('cohort_period_snapshot')
        .select(SNAPSHOT_ELEMENT_COLUMNS)
        .where('institution_id', '=', contact.institution_id)
        .orderBy('snapshot_at', 'desc')
        .execute();
      snapshots = snapshotRows.map(toSnapshotElement);
    }

    enterprise = {
      roleTitle: contact?.role_title ?? null,
      institutionName: institution?.name ?? null,
      // Ship the raw term string; the Chrome year-range parse stays
      // client-side (mirrors the fixture cohortLabel derivation). Do NOT
      // pre-bake the subtitle server-side.
      programTerm: institution?.program_term ?? institution?.contract_label ?? null,
      // Endowment values from the SAME already-fetched institution row (no
      // extra query) — the enterprise Reports/Endowment page reads these on
      // the authenticated tree (E-Slice 6b). Allowlist-picked, null-safe.
      endowmentAnnual: institution?.endowment_annual ?? null,
      endowmentCurrent: institution?.endowment_current ?? null,
      // The staff operator's institution roster (empty [] until athletes are
      // enrolled via POST /api/athletes). Seeds AthletesProvider's
      // initialState on the authenticated tree.
      athletes,
      // The staff operator's institution workshops (empty [] until scheduled
      // via POST /api/workshops). Seeds WorkshopsProvider's initialState on the
      // authenticated tree; each element carries nested attendance[] (Q7).
      workshops,
      // Institution exclusions + compliance audit (E-Write-4). Both seed
      // ComplianceProvider on the authenticated tree. connection_detail rides in
      // exclusions here and NOWHERE else (E8 staff-only); audit is newest-first.
      exclusions,
      complianceAudit,
      // Cohort period snapshots (E-Write-5). Seeds SnapshotsProvider; newest
      // first. Drives CohortComparison's 0 / 1 / ≥2 rendering.
      snapshots,
    };
  }

  const body = {
    user: { email: session.user.email },
    person: person ? {
      type: person.type,
      displayName: person.display_name,
      intake,
      gifts,
      scenarios,
      ...(advisor && { advisor }),
      ...(enterprise && { enterprise }),
    } : null,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
