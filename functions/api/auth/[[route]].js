// CF Pages Functions catch-all for /api/auth/* — mounts better-auth's
// handler. The [[route]] filename is the Pages-Functions convention for
// a route-segment catch-all (matches /api/auth/, /api/auth/get-session,
// /api/auth/sign-in/magic-link, etc.).
//
// Per-request instance: makeAuth(context.env) MUST run inside onRequest,
// not at module scope. See functions/_lib/auth.js for the rule.

import { makeAuth } from '../../_lib/auth.js';

export async function onRequest(context) {
  const auth = makeAuth(context.env);
  return auth.handler(context.request);
}
