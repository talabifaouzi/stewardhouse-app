import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { useBasePath } from './useBasePath.js';

const PROMISES = [
  {
    title: 'Your data is yours',
    desc: 'Never sold. Never shared with advertisers, sponsors, or brands.',
  },
  {
    title: 'You control access',
    desc: 'Private by default. You choose who sees what.',
  },
  {
    title: 'Leave anytime',
    desc: 'Delete your account and everything goes. No archives.',
  },
  {
    title: 'Annual transparency report',
    desc: 'A complete record of every piece of data we hold.',
  },
];

export default function Privacy() {
  const navigate = useNavigate();
  const basePath = useBasePath();

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--sh-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'var(--sh-space-10) var(--sh-space-6)',
    }}>
      <div style={{ maxWidth: '560px', width: '100%' }}>
        {/* Eyebrow */}
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-bronze)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontWeight: 600,
          marginBottom: 'var(--sh-space-2)',
        }}>
          Before we begin
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: 'var(--sh-text-primary)',
          fontWeight: 400,
          marginBottom: 'var(--sh-space-6)',
        }}>
          Our promise to you
        </h1>

        {/* Promise list */}
        <Card padding="lg" style={{ marginBottom: 'var(--sh-space-5)' }}>
          {PROMISES.map((promise, i) => (
            <div
              key={promise.title}
              style={{
                paddingTop: i === 0 ? 0 : 'var(--sh-space-4)',
                paddingBottom: i === PROMISES.length - 1 ? 0 : 'var(--sh-space-4)',
                borderTop: i === 0 ? 'none' : 'var(--sh-border-divider)',
              }}
            >
              <p style={{
                fontSize: 'var(--sh-text-base)',
                color: 'var(--sh-text-primary)',
                fontWeight: 600,
                marginBottom: '4px',
              }}>
                {promise.title}
              </p>
              <p style={{
                fontSize: 'var(--sh-text-sm)',
                color: 'var(--sh-text-secondary)',
                lineHeight: 1.55,
              }}>
                {promise.desc}
              </p>
            </div>
          ))}
        </Card>

        {/* Action */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate(`${basePath}/questions`, { replace: true })}
          style={{ width: '100%' }}
        >
          I'm in
        </Button>
      </div>
    </main>
  );
}
