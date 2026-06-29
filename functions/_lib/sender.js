// Magic-link email sender for /api/auth/sign-in/magic-link.
//
// PER-REQUEST RULE (mirrors functions/_lib/auth.js): createSender(env) is
// called inside the better-auth `sendMagicLink` callback — once per request.
// Never hoisted to module scope. env bindings (RESEND_API_KEY, FROM_EMAIL,
// SENDER_PROVIDER) come from the per-request `context.env` surfaced into the
// auth factory.
//
// Provider switch is keyed on env.SENDER_PROVIDER:
//   'resend'   — REST direct against api.resend.com (no npm dep). PILOT default.
//   'cf-email' — Cloudflare Email Service, deferred to sub-slice (d) when the
//                service exits BETA; throws a clear "not yet" until then.
//   (other)    — throws.
//
// Security posture:
//   - The API key never leaves the Authorization header. We do not log it.
//   - On success we return the Resend response body to the caller; we do not
//     log it (it carries the message id, which links to delivery metadata
//     in the Resend dashboard).
//   - On failure we throw with `res.status` + the raw response text so the
//     caller can surface a useful error in dev. Production callers SHOULD
//     narrow the throw before user-facing display.

export function createSender(env) {
  const provider = env.SENDER_PROVIDER || 'resend';
  if (provider === 'resend') return resendSender(env);
  if (provider === 'cf-email') {
    throw new Error('cf-email sender not yet implemented; deferred to sub-slice (d) when Cloudflare Email Service exits BETA');
  }
  throw new Error(`Unknown SENDER_PROVIDER: ${provider}`);
}

function resendSender(env) {
  return {
    async send({ to, subject, html, text }) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL,
          to: [to],
          subject,
          html,
          text,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Resend send failed: ${res.status} ${errText}`);
      }
      return res.json();
    },
  };
}
