import { useState, useEffect } from 'react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { HelpIcon } from '../../components/HelpIcon.jsx';
import { contentTypes, pipelineDefaults } from '../../data/content.js';
import { advisorPracticeProfile } from '../../data/clients.js';

// Prototype cadence presets per content type. Real product would resolve these
// against the content engine; here they're a closed set so the segmented control
// stays meaningful. Each type's current default value must be in its list.
const cadencePresets = {
  digest:       ['Weekly', 'Biweekly', 'Monthly'],
  notification: ['Event-driven', 'Daily summary'],
  spotlight:    ['Monthly · first Monday', 'Monthly · last Monday', 'Quarterly'],
  reflection:   ['Post-session', 'Weekly'],
  cohort:       ['As cohort publishes', 'Monthly summary'],
};

const STATE_OPTIONS = ['Active', 'Mute', 'Pause'];

export default function Pipeline() {
  const [defaults, setDefaults] = useState(pipelineDefaults);
  const [editingKey, setEditingKey] = useState(null);

  const overrideTotal = Object.values(defaults).reduce((sum, d) => sum + d.overrides, 0);

  const editingType = editingKey ? contentTypes.find(ct => ct.key === editingKey) : null;

  function handleSave(next) {
    setDefaults({
      ...defaults,
      [editingKey]: { ...defaults[editingKey], ...next },
    });
    setEditingKey(null);
  }

  return (
    <>
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
            const data = defaults[ct.key];
            return (
              <ContentTypeRow
                key={ct.key}
                type={ct}
                data={data}
                onAdjust={() => setEditingKey(ct.key)}
              />
            );
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
    {editingType && (
      <ConfigDrawer
        contentType={editingType}
        current={defaults[editingKey]}
        onSave={handleSave}
        onClose={() => setEditingKey(null)}
      />
    )}
    </>
  );
}

function ContentTypeRow({ type, data, onAdjust }) {
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

      <Button variant="secondary" size="sm" onClick={onAdjust}>Adjust</Button>
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

function ConfigDrawer({ contentType, current, onSave, onClose }) {
  const [workingState, setWorkingState] = useState(current.state);
  const [workingCadence, setWorkingCadence] = useState(current.cadence);

  // Defensive: ensure current cadence is always selectable even if not in presets.
  const cadenceOptions = (() => {
    const presets = cadencePresets[contentType.key] || [];
    return presets.includes(current.cadence) ? presets : [current.cadence, ...presets];
  })();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const overridesLabel = current.overrides === 1 ? 'override' : 'overrides';

  return (
    <>
      <style>{`
        @keyframes sh-drawer-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sh-drawer-slide-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(40, 32, 20, 0.32)',
          zIndex: 40,
          animation: 'sh-drawer-fade-in 180ms ease forwards',
        }}
      />

      <aside
        role="dialog"
        aria-label={`Configure ${contentType.label}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '420px',
          maxWidth: '100vw',
          background: 'var(--sh-card)',
          borderLeft: 'var(--sh-border-thin)',
          boxShadow: '-12px 0 30px rgba(40, 32, 20, 0.08)',
          zIndex: 41,
          display: 'flex',
          flexDirection: 'column',
          animation: 'sh-drawer-slide-in 220ms ease forwards',
        }}
      >
        {/* Header */}
        <div style={{
          padding: 'var(--sh-space-5) var(--sh-space-6)',
          borderBottom: 'var(--sh-border-divider)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--sh-space-3)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 'var(--sh-space-1)',
            }}>
              Practice-wide default
            </p>
            <h2 style={{
              fontFamily: 'var(--sh-font-serif)',
              fontSize: 'var(--sh-text-xl)',
              color: 'var(--sh-text-primary)',
              marginBottom: 'var(--sh-space-1)',
            }}>
              {contentType.label}
            </h2>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
              lineHeight: 1.5,
            }}>
              {contentType.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: 'var(--sh-text-muted)',
              padding: '0 var(--sh-space-2)',
              lineHeight: 1,
              fontFamily: 'inherit',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: 'var(--sh-space-6)',
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sh-space-6)',
        }}>
          {/* State field */}
          <div>
            <FieldLabel
              text="State"
              help="Active surfaces this content on its cadence. Mute stops it without losing the configuration. Pause holds it temporarily."
            />
            <SegmentedControl
              value={workingState}
              options={STATE_OPTIONS}
              onChange={setWorkingState}
            />
          </div>

          {/* Cadence field */}
          <div>
            <FieldLabel
              text="Cadence"
              help="How often this content type surfaces to clients on the practice default."
            />
            <RadioList
              value={workingCadence}
              options={cadenceOptions}
              onChange={setWorkingCadence}
            />
          </div>

          {/* Impact preview */}
          <div style={{
            background: 'var(--sh-bg-tint)',
            border: 'var(--sh-border-thin)',
            borderRadius: 'var(--sh-radius-md)',
            padding: 'var(--sh-space-4) var(--sh-space-5)',
          }}>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 'var(--sh-space-2)',
            }}>
              Impact preview
            </p>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-primary)',
              lineHeight: 1.5,
            }}>
              {current.clientsOnDefault} {current.clientsOnDefault === 1 ? 'client' : 'clients'} on this default · {current.overrides} per-client {overridesLabel} preserved.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: 'var(--sh-space-5) var(--sh-space-6)',
          borderTop: 'var(--sh-border-divider)',
          background: 'var(--sh-card)',
        }}>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            lineHeight: 1.5,
            marginBottom: 'var(--sh-space-3)',
          }}>
            Saving changes the practice-wide default. Per-client overrides are preserved.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sh-space-3)' }}>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => onSave({ state: workingState, cadence: workingCadence })}
            >
              Save
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

function FieldLabel({ text, help }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sh-space-2)',
      marginBottom: 'var(--sh-space-3)',
    }}>
      <span style={{
        fontSize: 'var(--sh-text-xs)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--sh-text-muted)',
        fontWeight: 500,
      }}>
        {text}
      </span>
      <HelpIcon definition={help} position="right" />
    </div>
  );
}

function SegmentedControl({ value, options, onChange }) {
  return (
    <div style={{
      display: 'inline-flex',
      border: 'var(--sh-border-thin)',
      borderRadius: 'var(--sh-radius-md)',
      overflow: 'hidden',
      background: 'var(--sh-card)',
    }}>
      {options.map((opt, i) => {
        const selected = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '8px 16px',
              fontSize: 'var(--sh-text-sm)',
              border: 'none',
              borderLeft: i === 0 ? 'none' : 'var(--sh-border-thin)',
              background: selected ? 'var(--sh-bronze)' : 'transparent',
              color: selected ? '#FFFFFF' : 'var(--sh-text-secondary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: selected ? 500 : 400,
              transition: 'all 150ms ease',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function RadioList({ value, options, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-2)' }}>
      {options.map(opt => {
        const selected = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '10px 14px',
              fontSize: 'var(--sh-text-sm)',
              border: selected ? '1px solid var(--sh-bronze)' : 'var(--sh-border-thin)',
              borderRadius: 'var(--sh-radius-md)',
              background: selected ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
              color: selected ? 'var(--sh-bronze-deep)' : 'var(--sh-text-secondary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: selected ? 500 : 400,
              textAlign: 'left',
              transition: 'all 150ms ease',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
