import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { advisorPracticeProfile, stages } from '../../data/clients.js';

export default function PracticeSettings() {
  return (
    <main style={{
      maxWidth: '880px',
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
          Settings
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: 'var(--sh-text-primary)',
        }}>
          Practice settings
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-5)' }}>
        <Card>
          <SectionLabel>Practice identity</SectionLabel>
          <SettingRow label="Practice name" value={advisorPracticeProfile.practiceName} />
          <SettingRow label="Principal advisor" value={advisorPracticeProfile.advisorName} />
          <SettingRow label="Title" value={advisorPracticeProfile.advisorTitle} />
          <SettingRow label="Practice focus" value={advisorPracticeProfile.practiceFocus} last />
        </Card>

        <Card>
          <SectionLabel>Stage labels</SectionLabel>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-muted)',
            marginBottom: 'var(--sh-space-4)',
          }}>
            Rename if your practice uses different stage language. Renaming applies across your roster.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {stages.map((stage, i) => (
              <SettingRow
                key={stage}
                label={`Stage ${i + 1}`}
                value={stage}
                last={i === stages.length - 1}
                action={<Button variant="ghost" size="sm">Rename</Button>}
              />
            ))}
          </div>
        </Card>

        <Card>
          <SectionLabel>Working preferences</SectionLabel>
          <SettingRow label="Default session length" value="45 minutes" />
          <SettingRow label="Time zone" value="America/New_York" />
          <SettingRow label="Notification preferences" value="Quiet by default" last />
        </Card>

        <Card tint>
          <SectionLabel>Boundaries (read-only)</SectionLabel>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            lineHeight: 1.6,
            marginBottom: 'var(--sh-space-3)',
          }}>
            StewardHouse is a structural platform. It does not provide advisory acts (specific recommendations
            on giving), fiduciary execution (custody, payment, transfers), or financial, legal, or compliance advice.
            These boundaries apply across all surfaces and cannot be configured.
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
          }}>
            Path B boundary · v1.0
          </p>
        </Card>
      </div>
    </main>
  );
}

function SettingRow({ label, value, last, action }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 'var(--sh-space-4)',
      padding: 'var(--sh-space-3) 0',
      borderBottom: last ? 'none' : 'var(--sh-border-divider)',
    }}>
      <div style={{ minWidth: '180px' }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 'var(--sh-space-half)',
        }}>
          {label}
        </p>
      </div>
      <p style={{
        flex: 1,
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-primary)',
      }}>
        {value}
      </p>
      {action}
    </div>
  );
}
