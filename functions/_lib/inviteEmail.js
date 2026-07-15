// Invite email — the notification an invitee receives when an ops operator
// creates their invite (POST /api/invites). NOTIFICATION-LINK model (FT ruling
// 2026-07-15): the email points the invitee to the /signin page where they
// request their own magic link — it does NOT carry a magic link itself (no
// auth.api call, no token, no 5-minute expiry). This reuses the proven sign-in
// flow and keeps the email non-expiring.
//
// BRAND-SURFACE COPY. Every string below is FT-ruled copy, not developer
// scaffolding: edits here are RULINGS, not refactors — do not reword without a
// ruling. Voice per §7 (quiet, editorial; no exclamation points). Genre is an
// invitation, distinct from the transactional "Sign in to StewardHouse"
// magic-link email in _lib/auth.js.
//
// Text + HTML variants follow the sendMagicLink idiom (auth.js): plain-text
// lines joined with blank-line spacing; HTML as <p>s with the sign-in URL as
// an <a>.

const SIGNIN_URL = 'https://steward-house.org/signin';

export function buildInviteEmail({ displayName }) {
  const subject = "You're invited to StewardHouse";

  const lines = [
    `Hello ${displayName},`,
    "You've been invited to StewardHouse, a private platform for philanthropic planning and education.",
    `To get started, visit ${SIGNIN_URL.replace('https://', '')} and enter this email address. We'll send you a secure sign-in link — no password needed.`,
    "If you weren't expecting this invitation, you can disregard this message.",
  ];

  const text = [
    lines[0], '',
    lines[1], '',
    lines[2], '',
    lines[3],
  ].join('\n');

  // Escape the visible URL's `&` (none today, but mirrors the auth.js idiom in
  // case the sign-in URL ever carries query params).
  const linkSafe = SIGNIN_URL.replace(/&/g, '&amp;');
  const html = [
    `<p>Hello ${displayName},</p>`,
    `<p>You've been invited to StewardHouse, a private platform for philanthropic planning and education.</p>`,
    `<p>To get started, visit <a href="${linkSafe}">${SIGNIN_URL.replace('https://', '')}</a> and enter this email address. We'll send you a secure sign-in link — no password needed.</p>`,
    `<p>If you weren't expecting this invitation, you can disregard this message.</p>`,
  ].join('\n');

  return { subject, html, text };
}
