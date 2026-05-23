import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { HelpIcon } from '../../components/HelpIcon.jsx';
import { contentTypes, pipelineDefaults } from '../../data/content.js';
import { advisorPracticeProfile } from '../../data/clients.js';

export default function Pipeline() {
  const overrideTotal = Object.values(pipelineDefaults).reduce((sum, d) => sum + d.overrides, 0);

  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <div style={{ marginBottom: 'var(--sh-space-8)' }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--sh-space-2)',
        }}>
          Section 6 · Between-session pipeline
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-3)',
        }}>
          Between-session pipeline
        </h1>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-secondary)',
          maxWidth: '720px',
          lineHeight: 1.6,
        }}>
          How content reaches your clients between the sessions you have with them.
          Configure practice-wide defaults below; per-client overrides are preserved on save.
        </p>
      </div>

      {/* Practice-wide default panel — Section 6 main */}
      <Card>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sh-space-2)',
          marginBottom: 'var(--sh-space-5)',
        }}>
          <SectionLabel>Practice-wide defaults</SectionLabel>
          <HelpIcon definition="Settings that apply to all clients on the default. Per-client overrides supersede these without changing them." />
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sh-space-3)',
        }}>
          {contentTypes.map(ct => {
            const data = pipelineDefaults[ct.key];
            return <ContentTypeRow key={ct.key} type={ct} data={data} />;
          })}
        </div>
      </Card>

      {/* Per-client preview link */}
      <div style={{ marginTop: 'var(--sh-space-6)' }}>
        <Card tint>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            lineHeight: 1.6,
            marginBottom: 'var(--sh-space-3)',
          }}>
            To see what's surfacing to a specific client right now, including their overrides,
            open their workspace and look at the "Active in pipeline" panel.
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
          }}>
            {advisorPracticeProfile.clientCount} clients receiving content · {overrideTotal} active per-client overrides across all content types
          </p>
        </Card>
      </div>
    </main>
  );
}

function ContentTypeRow({ type, data }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sh-space-5)',
      padding: 'var(--sh-space-4) var(--sh-space-5)',
      background: 'var(--sh-bg-tint)',
      border: 'var(--sh-border-thin)',
      borderRadius: 'var(--sh-radius-md)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-base)',
          color: 'var(--sh-text-primary)',
          marginBottom: '2px',
        }}>
          {type.label}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
        }}>
          {type.description}
        </p>
      </div>

      <StateBadge state={data.state} />

      <div style={{
        minWidth: '140px',
      }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '2px',
        }}>
          Cadence
        </p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-primary)',
        }}>
          {data.cadence}
        </p>
      </div>

      <div style={{
        minWidth: '160px',
      }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '2px',
        }}>
          Coverage
        </p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-primary)',
        }}>
          {data.clientsOnDefault} on default · {data.overrides} {data.overrides === 1 ? 'override' : 'overrides'}
        </p>
      </div>

      <Button variant="secondary" size="sm">Adjust</Button>
    </div>
  );
}

function StateBadge({ state }) {
  const colors = {
    Active: { bg: '#E8F0E5', text: '#3E5A3F' },
    Mute: { bg: '#F0EBDF', text: '#5A554C' },
    Pause: { bg: '#F5EFE3', text: '#5A453A' },
  };
  const c = colors[state] || colors.Active;
  return (
    <span style={{
      fontSize: '10px',
      padding: '3px 9px',
      borderRadius: 'var(--sh-radius-full)',
      background: c.bg,
      color: c.text,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontWeight: 500,
    }}>
      {state}
    </span>
  );
}
