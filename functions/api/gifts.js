// POST /api/gifts — records a gift for the signed-in user.
// First write endpoint in the wire-surfaces phase; mirrors the (c) hook's
// INSERT pattern (functions/_lib/auth.js) and me.js's session+person lookup
// (functions/api/me.js). Writes are confirmed server-side before the client
// updates its own local state — no optimistic-then-rollback here, since a
// gift submission is a single deliberate action, not a per-keystroke save.
//
// Request body (JSON): { org, amount, type, vehicle, recurring, notes, date }
//   - org: string, required, non-empty after trim
//   - amount: number, required, > 0 (rounded to nearest whole dollar — schema
//     stores gift.amount as INTEGER; the client currently allows decimals via
//     parseFloat, so this endpoint is the first place that convention is
//     enforced)
//   - type: 'unrestricted' | 'directed'
//   - vehicle: 'personal' | 'daf' | 'community'
//   - recurring: boolean
//   - notes: string, optional
//   - date: ISO 'YYYY-MM-DD' string, required (client computes this at
//     submit time — server does not override it, since "date of gift" is a
//     user-meaningful value even though there's no separate date picker
//     today; it's set to "now" client-side at submit)
//
// Response shapes:
//   No session:               401, { error: 'Not signed in' }
//   Session, no person match: 403, { error: 'No account found for session' }
//     (defensive — should be structurally unreachable per the (c) hook's
//     create-or-claim guarantee)
//   Invalid body:              400, { error: '<reason>' }
//   Success:                   200, { id, org, amount, date, type, vehicle,
//     recurring, notes } — server-generated id (crypto.randomUUID()) and the
//     rounded amount, so the client uses the SAME id the database has rather
//     than a separately-generated client-side one.

import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { makeAuth } from '../_lib/auth.js';

const ALLOWED_TYPES = new Set(['unrestricted', 'directed']);
const ALLOWED_VEHICLES = new Set(['personal', 'daf', 'community']);

export async function onRequestPost(context) {
  const auth = makeAuth(context.env);
  const session = await auth.api.getSession({ headers: context.request.headers });

  if (!session || !session.user) {
    return new Response(JSON.stringify({ error: 'Not signed in' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Kysely({
    dialect: new D1Dialect({ database: context.env.DB }),
  });

  const person = await db
    .selectFrom('person')
    .select(['id'])
    .where('auth_user_id', '=', session.user.id)
    .executeTakeFirst();

  if (!person) {
    return new Response(JSON.stringify({ error: 'No account found for session' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const org = typeof body.org === 'string' ? body.org.trim() : '';
  const amountRaw = Number(body.amount);
  const type = ALLOWED_TYPES.has(body.type) ? body.type : null;
  const vehicle = ALLOWED_VEHICLES.has(body.vehicle) ? body.vehicle : null;
  const recurring = !!body.recurring;
  const notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null;
  const date = typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null;

  if (!org) {
    return new Response(JSON.stringify({ error: 'Organization name is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
    return new Response(JSON.stringify({ error: 'Amount must be a positive number' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!date) {
    return new Response(JSON.stringify({ error: 'Date must be an ISO YYYY-MM-DD string' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const amount = Math.round(amountRaw);
  const giftId = crypto.randomUUID();

  try {
    await db.insertInto('gift').values({
      id: giftId,
      giver_person_id: person.id,
      recipient_org_id: null,
      recipient_org_name: org,
      amount,
      date,
      type,
      vehicle,
      recurring: recurring ? 1 : 0,
      notes,
      source_surface: 'individual',
      exported_to_cpa: 0,
    }).execute();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to save gift' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    id: giftId, org, amount, date, type, vehicle, recurring, notes,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
