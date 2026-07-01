import { useEffect, useState } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { SHLogo } from '../../components/SHLogo.jsx';

const ERROR_MESSAGES = {
  INVALID_TOKEN: 'That sign-in link is invalid or has already been used. Request a new one below.',
  EXPIRED_TOKEN: 'That sign-in link has expired. Request a new one below.',
  failed_to_create_user: 'We could not create your account. Please try again or contact support.',
  new_user_signup_disabled: 'Sign-up is not currently open for this address.',
  failed_to_create_session: 'We could not sign you in. Please try again.',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 'var(--sh-space-3)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  fontFamily: 'inherit',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  background: 'var(--sh-card)',
};

export default function SignIn() {
  const [searchParams] = useSearchParams();
  const urlError = searchParams.get('error');

  const [sessionStatus, setSessionStatus] = useState('checking');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(
    urlError ? (ERROR_MESSAGES[urlError] || 'Something went wrong. Please try again.') : null
  );

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/get-session', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setSessionStatus(data && data.user ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        if (!cancelled) setSessionStatus('unauthenticated');
      });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setErrorMessage('Enter a valid email address.');
      return;
    }

    setStatus('sending');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/sign-in/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          callbackURL: '/app',
          errorCallbackURL: '/signin',
        }),
      });

      if (res.status === 429) {
        setStatus('error');
        setErrorMessage('Too many requests. Please wait a minute and try again.');
        return;
      }
      if (res.status === 400) {
        setStatus('error');
        setErrorMessage('Enter a valid email address.');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        setErrorMessage('Sign-in is temporarily unavailable. Please try again shortly.');
        return;
      }

      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMessage('Could not reach the server. Check your connection and try again.');
    }
  }

  if (sessionStatus === 'checking') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--sh-bg)',
        color: 'var(--sh-text-muted)',
        fontSize: 'var(--sh-text-sm)',
      }}>
        Checking your session…
      </div>
    );
  }

  if (sessionStatus === 'authenticated') {
    return <Navigate to="/app" replace />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--sh-bg)',
      padding: 'var(--sh-space-8)',
    }}>
      <div style={{ marginBottom: 'var(--sh-space-8)' }}>
        <SHLogo size="normal" />
      </div>

      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--sh-card)',
        border: 'var(--sh-border-default)',
        borderRadius: 'var(--sh-radius-lg)',
        padding: 'var(--sh-space-8)',
      }}>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-xl)',
          color: 'var(--sh-text-primary)',
          marginTop: 0,
          marginBottom: 'var(--sh-space-2)',
        }}>
          Pilot sign-in
        </h1>

        {status === 'sent' ? (
          <div>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
              lineHeight: 'var(--sh-line-normal)',
            }}>
              Check <strong>{email}</strong> for a sign-in link. It expires in 5 minutes.
            </p>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => { setStatus('idle'); setEmail(''); }}
              style={{ marginTop: 'var(--sh-space-4)' }}
            >
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
              lineHeight: 'var(--sh-line-normal)',
              marginTop: 0,
              marginBottom: 'var(--sh-space-5)',
            }}>
              Enter the email address your invite was sent to. We'll email you a link — no password needed.
            </p>

            <label
              htmlFor="signin-email"
              style={{
                display: 'block',
                fontSize: 'var(--sh-text-xs)',
                color: 'var(--sh-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 500,
                marginBottom: 'var(--sh-space-2)',
              }}
            >
              Email
            </label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.org"
              style={inputStyle}
              disabled={status === 'sending'}
              autoFocus
            />

            {errorMessage && (
              <p style={{
                marginTop: 'var(--sh-space-3)',
                fontSize: 'var(--sh-text-xs)',
                color: 'var(--sh-warning-text)',
                background: 'var(--sh-warning-bg)',
                border: '1px solid var(--sh-warning-border)',
                borderRadius: 'var(--sh-radius-md)',
                padding: 'var(--sh-space-2) var(--sh-space-3)',
              }}>
                {errorMessage}
              </p>
            )}

            <Button
              variant="primary"
              type="submit"
              disabled={status === 'sending' || !email}
              style={{ marginTop: 'var(--sh-space-5)', width: '100%' }}
            >
              {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
            </Button>
          </form>
        )}
      </div>

      <Link
        to="/"
        style={{
          marginTop: 'var(--sh-space-6)',
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textDecoration: 'none',
        }}
      >
        ← Back to demo
      </Link>
    </div>
  );
}
