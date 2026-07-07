// POST /api/clients — creates a client for the signed-in advisor. Q7-dark
// per section 6 (as amended for write slice 1): requireGatedAdvisor gates
// all advisor writes; production Morgan carries no demo_gate, so this
// endpoint returns 403 until FT designates a person row. Local smoke works
// against locally-designated Morgan.
//
// Owner scope: owner_advisor_person_id from session ONLY, never from body.
// Q9 platform guardrail: rejectRankKeys before allowlist. Parker no-lifecycle:
// stage is relationship-state (New | Active | Mature | Sunset), NOT lifecycle;
// enforced by validation.
//
// Nested JSON columns (giving_plan, next_session_agenda, pipeline_state) are
// small always-replaced-whole per Q8 ruling — accept the whole nested object
// or null, no partial-path updates.
//
// Response shape: full round-trip { id, name, initials, sport, level, stage,
// relationshipStartedYear, summary, nextSession, givingPlan, nextSessionAgenda,
// pipeline, createdAt, updatedAt, clientSessions: [], clientNotes: [] } —
// matches the /api/me clients element shape so consumers can splice the
// response into local state without transformation.

import {
  makeDb, requireGatedAdvisor, rejectRankKeys, jsonError, jsonOk,
} from '../_lib/gate.js';

const ALLOWED_STAGE = new Set(['New', 'Active', 'Mature', 'Sunset']);

function validateClientBody(body, { requireAll }) {
  const out = {};
  if (requireAll || body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return { error: 'name is required' };
    }
    out.name = body.name.trim();
  }
  if (body.initials !== undefined) {
    if (body.initials !== null && typeof body.initials !== 'string') {
      return { error: 'initials must be a string or null' };
    }
    out.initials = body.initials;
  }
  if (body.sport !== undefined) {
    if (body.sport !== null && typeof body.sport !== 'string') {
      return { error: 'sport must be a string or null' };
    }
    out.sport = body.sport;
  }
  if (body.level !== undefined) {
    if (body.level !== null && typeof body.level !== 'string') {
      return { error: 'level must be a string or null' };
    }
    out.level = body.level;
  }
  if (requireAll || body.stage !== undefined) {
    if (!ALLOWED_STAGE.has(body.stage)) {
      return { error: 'stage must be one of: New, Active, Mature, Sunset' };
    }
    out.stage = body.stage;
  }
  if (body.relationshipStartedYear !== undefined) {
    if (body.relationshipStartedYear === null) {
      out.relationship_started_year = null;
    } else if (!Number.isInteger(body.relationshipStartedYear) ||
               body.relationshipStartedYear < 1900 ||
               body.relationshipStartedYear > 2200) {
      return {
        error: 'relationshipStartedYear must be a plausible integer year or null',
      };
    } else {
      out.relationship_started_year = body.relationshipStartedYear;
    }
  }
  if (body.summary !== undefined) {
    if (body.summary !== null && typeof body.summary !== 'string') {
      return { error: 'summary must be a string or null' };
    }
    out.summary = body.summary;
  }
  if (body.nextSession !== undefined) {
    if (body.nextSession !== null &&
        (typeof body.nextSession !== 'string' ||
         !/^\d{4}-\d{2}-\d{2}$/.test(body.nextSession))) {
      return { error: 'nextSession must be an ISO YYYY-MM-DD string or null' };
    }
    out.next_session_date = body.nextSession;
  }
  if (body.givingPlan !== undefined) {
    if (body.givingPlan !== null &&
        (typeof body.givingPlan !== 'object' || Array.isArray(body.givingPlan))) {
      return { error: 'givingPlan must be an object or null' };
    }
    out.giving_plan = body.givingPlan;
  }
  if (body.nextSessionAgenda !== undefined) {
    if (body.nextSessionAgenda !== null &&
        (typeof body.nextSessionAgenda !== 'object' ||
         Array.isArray(body.nextSessionAgenda))) {
      return { error: 'nextSessionAgenda must be an object or null' };
    }
    out.next_session_agenda = body.nextSessionAgenda;
  }
  if (body.pipeline !== undefined) {
    if (body.pipeline !== null && !Array.isArray(body.pipeline)) {
      return { error: 'pipeline must be an array or null' };
    }
    out.pipeline_state = body.pipeline;
  }
  return { fields: out };
}

function toClientResponse(row) {
  const parseOr = (s, fallback) => {
    if (!s) return fallback;
    try { return JSON.parse(s); } catch { return fallback; }
  };
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    sport: row.sport,
    level: row.level,
    stage: row.stage,
    relationshipStartedYear: row.relationship_started_year,
    summary: row.summary,
    nextSession: row.next_session_date,
    givingPlan: parseOr(row.giving_plan, null),
    nextSessionAgenda: parseOr(row.next_session_agenda, null),
    pipeline: parseOr(row.pipeline_state, null),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientSessions: [],
    clientNotes: [],
  };
}

export async function onRequestPost(context) {
  const db = makeDb(context);
  const { person, error, status } = await requireGatedAdvisor(db, context);
  if (error) return jsonError(error, status);

  let body;
  try { body = await context.request.json(); }
  catch { return jsonError('Invalid JSON body', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Body must be an object', 400);
  }
  const forbidden = rejectRankKeys(body);
  if (forbidden) return jsonError(`Field "${forbidden}" is not permitted`, 400);

  // R1 (docs/client-record-rulings.md): stage defaults to 'New' SERVER-SIDE
  // when omitted. A form-only default breaks future non-form callers (e.g.
  // a CLI ingest tool, a bulk-import script, a partner integration). Do it
  // once here so every caller of the endpoint benefits. When stage IS
  // present, the enum is still enforced by validateClientBody.
  if (body.stage === undefined) body.stage = 'New';

  const validated = validateClientBody(body, { requireAll: true });
  if (validated.error) return jsonError(validated.error, 400);
  const f = validated.fields;

  const id = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  try {
    await db.insertInto('client').values({
      id,
      owner_advisor_person_id: person.id,
      name: f.name,
      initials: f.initials ?? null,
      sport: f.sport ?? null,
      level: f.level ?? null,
      stage: f.stage,
      relationship_started_year: f.relationship_started_year ?? null,
      summary: f.summary ?? null,
      next_session_date: f.next_session_date ?? null,
      giving_plan: f.giving_plan !== undefined && f.giving_plan !== null
        ? JSON.stringify(f.giving_plan) : null,
      next_session_agenda: f.next_session_agenda !== undefined && f.next_session_agenda !== null
        ? JSON.stringify(f.next_session_agenda) : null,
      pipeline_state: f.pipeline_state !== undefined && f.pipeline_state !== null
        ? JSON.stringify(f.pipeline_state) : null,
      created_at: nowIso,
      updated_at: nowIso,
    }).execute();
  } catch (err) {
    return jsonError('Failed to save client', 500);
  }

  const row = await db
    .selectFrom('client')
    .select([
      'id', 'name', 'initials', 'sport', 'level', 'stage',
      'relationship_started_year', 'summary', 'next_session_date',
      'giving_plan', 'next_session_agenda', 'pipeline_state',
      'created_at', 'updated_at',
    ])
    .where('id', '=', id)
    .executeTakeFirst();
  return jsonOk(toClientResponse(row));
}

export { validateClientBody, toClientResponse };
