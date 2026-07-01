import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import { CAUSES, deriveCelebration } from '../../data/intakeData.js';
import { useBasePath } from './useBasePath.js';

export default function GPSReveal() {
  const navigate = useNavigate();
  const basePath = useBasePath();
  const { answers, givingStyle } = useIntake();
  const [phase, setPhase] = useState(0);

  // Phase 0: blank pause. 1: badge. 2: causes. 3: geography. 4: celebration line. 5: button.
  useEffect(() => {
    const timings = [800, 1400, 1200, 1200, 1000];
    if (phase < 5) {
      const timer = setTimeout(() => setPhase(p => p + 1), timings[phase]);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const a = answers || {};
  const causeLabels = (a.causes || []).map(id => {
    const found = CAUSES.find(c => c.id === id);
    return found ? found.label : id;
  });
  const geoText = a.geoDetail || (a.geo || []).join(', ');
  const celebMsg = deriveCelebration(a);

  const fade = (show) => ({
    opacity: show ? 1 : 0,
    transform: show ? 'translateY(0)' : 'translateY(12px)',
    transition: 'all 800ms ease',
  });

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--sh-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sh-space-10) var(--sh-space-6)',
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Quiet intro */}
        <div style={{ ...fade(phase >= 0), marginBottom: 'var(--sh-space-8)' }}>
          <div style={{
            width: '40px',
            height: '1px',
            background: 'var(--sh-bronze)',
            margin: '0 auto var(--sh-space-5)',
            opacity: 0.5,
          }} />
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            Your Giving Plan
          </p>
        </div>

        {/* Phase 1: Badge */}
        <div style={{ ...fade(phase >= 1), marginBottom: 'var(--sh-space-6)' }}>
          <div style={{
            display: 'inline-block',
            padding: '8px 22px',
            borderRadius: 'var(--sh-radius-full)',
            background: 'var(--sh-bronze-tint)',
            border: '1.5px solid var(--sh-bronze)',
          }}>
            <span style={{
              fontFamily: 'var(--sh-font-serif)',
              fontSize: 'var(--sh-text-md)',
              fontWeight: 400,
              color: 'var(--sh-bronze-deep)',
            }}>
              {givingStyle || 'Intentional Giver'}
            </span>
          </div>
        </div>

        {/* Phase 2: Causes */}
        <div style={{ ...fade(phase >= 2), marginBottom: 'var(--sh-space-5)' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
          }}>
            {causeLabels.map((c, i) => (
              <span
                key={i}
                style={{
                  fontSize: 'var(--sh-text-sm)',
                  color: 'var(--sh-text-primary)',
                  padding: '6px 14px',
                  background: 'var(--sh-card)',
                  borderRadius: 'var(--sh-radius-full)',
                  border: 'var(--sh-border-thin)',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Phase 3: Geography */}
        <div style={{ ...fade(phase >= 3), marginBottom: 'var(--sh-space-7)' }}>
          {geoText && (
            <p style={{
              fontFamily: 'var(--sh-font-serif)',
              fontSize: 'var(--sh-text-base)',
              color: 'var(--sh-text-secondary)',
              fontStyle: 'italic',
            }}>
              {geoText}
            </p>
          )}
        </div>

        {/* Phase 4: Celebration line */}
        <div style={{ ...fade(phase >= 4), marginBottom: 'var(--sh-space-8)' }}>
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-lg)',
            color: 'var(--sh-text-primary)',
            fontWeight: 400,
            lineHeight: 1.55,
            maxWidth: '380px',
            margin: '0 auto',
          }}>
            {celebMsg}
          </p>
        </div>

        {/* Phase 5: Button */}
        <div style={fade(phase >= 5)}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(basePath, { replace: true })}
            style={{ width: '100%', maxWidth: '320px' }}
          >
            See what we built for you
          </Button>
        </div>
      </div>
    </main>
  );
}
