// /api/scenarios — POST saves a labeled giving-projection scenario; GET
// lists the signed-in user's saved scenarios. Both share the same 5-field
// response shape.
//
// inputs = the 6 GivingModeler knobs (annual, years, growth, grantPct,
// careerOn, careerRate). derivedAtSnapshot = the client-computed
// {finalFund, totalIn, totalOut} cache — GivingModeler.jsx already computes
// this on every render, so no server-side calculation is needed here, just
// storage.
//
// Parker Modeler guardrail (hardened in the scenario table's DDL comment):
// this table may NEVER carry a rank/score/suggestion/priority/ordering
// column. This endpoint only ever writes the 6 raw inputs + the 3 derived
// display numbers — nothing resembling advice or a recommendation.
//
// Scenarios are snapshots, not an edit log (5.8 doc §5b) — each save
// creates a NEW row, never updates an existing one.

import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { makeAuth } from '../_lib/auth.js';

const INPUT_KEYS = ['annual', 'years', 'growth', 'grantPct', 'careerOn', 'careerRate'];
const SNAPSHOT_KEYS = ['finalFund', 'totalIn', 'totalOut'];

function parseScenarioRow(row) {
  let inputs = {};
  try { inputs = JSON.parse(row.inputs); } catch { inputs = {}; }
  let derivedAtSnapshot = null;
  if (row.derived_at_snapshot) {
    try { derivedAtSnapshot = JSON.parse(row.derived_at_snapshot); } catch { derivedAtSnapshot = null; }
  }
  return { id: row.id, label: row.label, createdAt: row.created_at, inputs, derivedAtSnapshot };
}

async function getPersonForSession(db, context) {
  const auth = makeAuth(context.env);
  const session = await auth.api.getSession({ headers: context.request.headers });
  if (!session || !session.user) return { error: 'Not signed in', status: 401 };
  const person = await db
    .selectFrom('person')
    .select(['id'])
    .where('auth_user_id', '=', session.user.id)
    .executeTakeFirst();
  if (!person) return { error: 'No account found for session', status: 403 };
  return { person };
}

export async function onRequestPost(context) {
  const db = new Kysely({ dialect: new D1Dialect({ database: context.env.DB }) });
  const { person, error, status } = await getPersonForSession(db, context);
  if (error) {
    return new Response(JSON.stringify({ error }), {
      status, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (!label) {
    return new Response(JSON.stringify({ error: 'Label is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.inputs || typeof body.inputs !== 'object' || Array.isArray(body.inputs)) {
    return new Response(JSON.stringify({ error: 'inputs must be an object' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const inputs = {};
  for (const key of INPUT_KEYS) {
    const value = body.inputs[key];
    if (key === 'careerOn') {
      inputs[key] = !!value;
      continue;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return new Response(JSON.stringify({ error: `inputs.${key} must be a number` }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (key === 'years' && (!Number.isInteger(value) || value <= 0)) {
      return new Response(JSON.stringify({ error: 'inputs.years must be a positive whole number' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    inputs[key] = value;
  }

  let derivedAtSnapshot = null;
  if (body.derivedAtSnapshot && typeof body.derivedAtSnapshot === 'object' && !Array.isArray(body.derivedAtSnapshot)) {
    const snap = {};
    let valid = true;
    for (const key of SNAPSHOT_KEYS) {
      const value = body.derivedAtSnapshot[key];
      if (typeof value !== 'number' || !Number.isFinite(value)) { valid = false; break; }
      snap[key] = value;
    }
    if (valid) derivedAtSnapshot = snap;
  }

  const scenarioId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    await db.insertInto('scenario').values({
      id: scenarioId,
      owner_person_id: person.id,
      label,
      created_at: createdAt,
      inputs: JSON.stringify(inputs),
      derived_at_snapshot: derivedAtSnapshot ? JSON.stringify(derivedAtSnapshot) : null,
    }).execute();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to save scenario' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ id: scenarioId, label, createdAt, inputs, derivedAtSnapshot }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const db = new Kysely({ dialect: new D1Dialect({ database: context.env.DB }) });
  const { person, error, status } = await getPersonForSession(db, context);
  if (error) {
    return new Response(JSON.stringify({ error }), {
      status, headers: { 'Content-Type': 'application/json' },
    });
  }

  const rows = await db
    .selectFrom('scenario')
    .select(['id', 'label', 'created_at', 'inputs', 'derived_at_snapshot'])
    .where('owner_person_id', '=', person.id)
    .orderBy('created_at', 'desc')
    .execute();

  return new Response(JSON.stringify({ scenarios: rows.map(parseScenarioRow) }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
