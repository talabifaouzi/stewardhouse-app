import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';

export default function AppEntry() {
  const [status, setStatus] = useState('checking');
  const [session, setSession] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/get-session', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data && data.user) {
          setSession(data);
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('unauthenticated');
      });
    return () => { cancelled = true; };
  }, []);

  async function handleSignOut() {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
    } finally {
      setStatus('unauthenticated');
      setSession(null);
    }
  }

  if (status === 'checking') {
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

  if (status === 'unauthenticated') {
    return <Navigate to="/signin" replace />;
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
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--sh-card)',
        border: 'var(--sh-border-default)',
        borderRadius: 'var(--sh-radius-lg)',
        padding: 'var(--sh-space-8)',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-xl)',
          color: 'var(--sh-text-primary)',
          marginTop: 0,
          marginBottom: 'var(--sh-space-2)',
        }}>
          You're signed in
        </h1>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-secondary)',
          marginBottom: 'var(--sh-space-5)',
        }}>
          {session?.user?.email}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          marginBottom: 'var(--sh-space-5)',
        }}>
          Your authenticated surface isn't wired up yet — this confirms sign-in is working end to end.
        </p>
        <Button variant="secondary" type="button" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
