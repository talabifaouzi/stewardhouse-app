import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { Button } from '../../components/Button.jsx';

// Mounted as AppShell's index route. Reads identity from context (already
// fetched by AppShell — no second /api/me call) and routes to the correct
// type-specific surface. Types without a built surface yet get an honest
// placeholder + a sign-out exit (identical mechanism as the Chrome
// affordance — both route through AppIdentityContext.signOut).

export default function AppDispatcher() {
  const { identity, signOut } = useAppIdentity();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    // signOut hard-navigates on completion; setSigningOut(false) never
    // runs (component unmounts on the navigation). No need for a finally.
    await signOut();
  }

  if (!identity || !identity.type) {
    return (
      <PlaceholderPanel
        title="We couldn't find your account"
        message="Your sign-in worked, but we couldn't match it to a pilot account. Contact StewardHouse for help."
        email={identity?.email}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />
    );
  }

  if (identity.type === 'individual') {
    return <Navigate to="/app/individual" replace />;
  }

  if (identity.type === 'advisor') {
    return <Navigate to="/app/advisor" replace />;
  }

  if (identity.type === 'staff') {
    return <Navigate to="/app/enterprise" replace />;
  }

  return (
    <PlaceholderPanel
      title="You're signed in"
      message={`Your ${identity.type} surface isn't built yet — this confirms sign-in is working end to end.`}
      email={identity.email}
      onSignOut={handleSignOut}
      signingOut={signingOut}
    />
  );
}

function PlaceholderPanel({ title, message, email, onSignOut, signingOut }) {
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
          {title}
        </h1>
        {email && (
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            marginBottom: 'var(--sh-space-5)',
          }}>
            {email}
          </p>
        )}
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          marginBottom: 'var(--sh-space-5)',
        }}>
          {message}
        </p>
        <Button variant="secondary" type="button" onClick={onSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </div>
  );
}
