import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { SHLogoStacked } from '../../components/SHLogo.jsx';

export default function Letter() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--sh-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'var(--sh-space-10) var(--sh-space-6)',
    }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 800ms ease',
      }}>
        {/* Brand mark */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sh-space-12)' }}>
          <SHLogoStacked size="large" />
        </div>

        {/* Letter body */}
        <div style={{
          fontSize: 'var(--sh-text-md)',
          lineHeight: 1.85,
          color: 'var(--sh-text-body)',
          fontFamily: 'var(--sh-font-sans)',
        }}>
          <p style={{ marginBottom: 'var(--sh-space-4)' }}>
            I built StewardHouse because I've been on both sides of the giving table.
          </p>
          <p style={{ marginBottom: 'var(--sh-space-4)' }}>
            I've sat inside a foundation deciding where millions go. And I've worked inside a nonprofit wondering if funding would come through.
          </p>
          <p style={{ marginBottom: 'var(--sh-space-4)' }}>
            The way philanthropy has worked wasn't designed for you. It was built for old money and boardrooms. You built your success differently. Your giving should reflect that.
          </p>
          <p style={{ marginBottom: 'var(--sh-space-4)' }}>
            StewardHouse is{' '}
            <em style={{ color: 'var(--sh-text-primary)', fontWeight: 600, fontStyle: 'italic' }}>
              yours
            </em>
            . Not your manager's, not your accountant's. Yours.
          </p>
          <p style={{ marginBottom: 'var(--sh-space-8)' }}>
            Take 15 minutes. Answer honestly. What you build here becomes the compass for every giving decision you make.
          </p>
        </div>

        {/* Founder identity */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sh-space-3)',
          marginBottom: 'var(--sh-space-8)',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--sh-bronze-tint)',
            color: 'var(--sh-bronze-deep)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--sh-text-sm)',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}>
            FT
          </div>
          <div>
            <div style={{
              fontSize: 'var(--sh-text-sm)',
              fontWeight: 600,
              color: 'var(--sh-text-primary)',
              marginBottom: '2px',
            }}>
              Faouzi Talabi
            </div>
            <div style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              fontStyle: 'italic',
            }}>
              Founder, StewardHouse
            </div>
          </div>
        </div>

        {/* Begin button */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/individual/privacy')}
          style={{ width: '100%' }}
        >
          Begin
        </Button>

        {/* Skip to demo */}
        <div style={{
          textAlign: 'center',
          marginTop: 'var(--sh-space-6)',
        }}>
          <button
            onClick={() => navigate('/individual')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--sh-text-muted)',
              fontSize: 'var(--sh-text-xs)',
              fontStyle: 'italic',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: 'inherit',
              padding: 0,
            }}
          >
            Skip to the demo home →
          </button>
        </div>
      </div>
    </main>
  );
}
