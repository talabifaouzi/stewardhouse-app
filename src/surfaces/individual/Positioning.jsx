import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { SHLogoStacked } from '../../components/SHLogo.jsx';
import { useBasePath } from './useBasePath.js';

const CARDS = [
  {
    label: 'Who this is for',
    body: 'Athletes — people whose careers gave them a platform and who want to use it intentionally.',
  },
  {
    label: 'What it does',
    body: 'Builds your personal giving compass in 15 minutes. Matches you with organizations aligned with your values. Tracks your giving. Teaches you the landscape.',
  },
  {
    label: "What it doesn't do",
    body: "We don't manage your money. We don't replace your advisor. We prepare you to give with the same intention you brought to your career.",
  },
  {
    label: 'Why it exists',
    body: 'Built by a program officer who sat inside a foundation deciding where millions go — and saw that the system wasn\'t designed for people like you.',
  },
];

export default function Positioning() {
  const navigate = useNavigate();
  const basePath = useBasePath();
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
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 'var(--sh-space-8)',
        }}>
          <SHLogoStacked size="large" />
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: 'var(--sh-text-primary)',
          fontWeight: 400,
          lineHeight: 1.4,
          textAlign: 'center',
          marginBottom: 'var(--sh-space-3)',
        }}>
          You built something extraordinary.
          <br />
          Now build your legacy.
        </h1>

        <div style={{
          width: '40px',
          height: '1px',
          background: 'var(--sh-bronze)',
          margin: '0 auto var(--sh-space-8)',
        }} />

        {/* Four positioning cards */}
        <div style={{ marginBottom: 'var(--sh-space-8)' }}>
          {CARDS.map((c) => (
            <Card
              key={c.label}
              padding="md"
              style={{ marginBottom: 'var(--sh-space-2)' }}
            >
              <p style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--sh-bronze)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                {c.label}
              </p>
              <p style={{
                fontSize: 'var(--sh-text-sm)',
                color: 'var(--sh-text-body)',
                lineHeight: 1.65,
              }}>
                {c.body}
              </p>
            </Card>
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate(`${basePath}/letter`)}
          style={{ width: '100%' }}
        >
          See how it works
        </Button>

        {/* Skip to demo */}
        <div style={{
          textAlign: 'center',
          marginTop: 'var(--sh-space-5)',
        }}>
          <button
            onClick={() => navigate(basePath)}
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
