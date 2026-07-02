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
    let practiceProfile = null;
    if (person.extensions) {
      try {
        const parsed = JSON.parse(person.extensions);
        practiceProfile = parsed.advisor ?? null;
      } catch {
        practiceProfile = null;
      }
    }

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
      // Q7 gate: cohort_member is empty (no client rows yet). memberIds
      // will populate when the gated write path enables client + cohort_member
      // writes. Emit as [] here so surface consumers reading
      // cohort.memberIds.length degrade gracefully.
      memberIds: [],
    }));

    advisor = { practiceProfile, practiceLessons, docCategories, cohorts };
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
    } : null,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
