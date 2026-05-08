import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Tag } from '../../components/Tag.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import { CAUSES, VIS, TRUST, DEPTH } from '../../data/intakeData.js';

export default function PlanTab() {
  const navigate = useNavigate();
  const { answers: a, givingStyle, worldLabel, resetIntake } = useIntake();
  const [copied, setCopied] = useState(false);

  const causeLabels = (a.causes || []).map(id => CAUSES.find(c => c.id === id)?.label).filter(Boolean);
  const vis = VIS.find(v => v.id === a.visibility);
  const trust = TRUST.find(t => t.id === a.trust);
  const depth = DEPTH.find(d => d.id === a.depth);
  const isFirst = a.existingOrgs?.includes('first step') || a.existingOrgs?.includes("haven't given");
  const hasGuardian = a.authority === 'guardian';
  const hasTeam = a.authority === 'team';
  const stageLabel = a.stage ? a.stage.charAt(0).toUpperCase() + a.stage.slice(1) : '';

  const onCopy = () => {
    const txt = `MY GIVING PLAN STATEMENT

Where I Come From
"${a.lived}"

Who Shaped Me
"${a.influence}"

What Moves Me
${causeLabels.join(', ')}${a.geoDetail ? ' · ' + a.geoDetail : ''}

How I Want to Give
${vis?.label || ''} — ${vis?.desc || ''}
${trust?.label || ''} — ${trust?.desc || ''}
${depth?.label || ''} — ${depth?.desc || ''}

${isFirst ? "Where I'm Starting" : "What I'm Building On"}
${isFirst ? 'This is my first step. I am here to start.' : a.existingOrgs}

My Intention
${a.budget}

Where I'm Headed
"${a.legacy}"

— StewardHouse`;
    navigator.clipboard?.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const onUpdate = () => {
    if (window.confirm('Walk through the questions again? Your current answers will guide where you start, but you can change anything.')) {
      // Clear and restart — the demo uses resetIntake. In production this
      // would preserve answers and let the user revise specific sections.
      resetIntake();
      navigate('/individual/welcome');
    }
  };

  return (
    <main style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-6) var(--sh-space-16)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--sh-space-6)' }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-bronze)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontWeight: 600,
          marginBottom: 'var(--sh-space-2)',
        }}>
          My Giving Plan Statement
        </p>
        {givingStyle && (
          <div style={{
            display: 'inline-block',
            padding: '6px 18px',
            borderRadius: 'var(--sh-radius-full)',
            background: 'var(--sh-bronze-tint)',
            border: '1px solid var(--sh-bronze)',
            marginBottom: 'var(--sh-space-2)',
          }}>
            <span style={{
              fontFamily: 'var(--sh-font-serif)',
              fontSize: 'var(--sh-text-base)',
              color: 'var(--sh-bronze-deep)',
              fontWeight: 400,
            }}>
              {givingStyle}
            </span>
          </div>
        )}
        {(worldLabel || stageLabel) && (
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
          }}>
            {worldLabel}{stageLabel ? ` · ${stageLabel}` : ''}
          </p>
        )}
      </div>

      {/* Main statement card */}
      <Card padding="lg" style={{
        marginBottom: 'var(--sh-space-4)',
        boxShadow: '0 4px 18px rgba(60, 50, 30, 0.05)',
      }}>
        <Section label="Where I come from">
          <Quote text={a.lived} />
        </Section>

        <Section label="Who shaped me">
          <Quote text={a.influence} />
        </Section>

        <Section label="What moves me">
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: a.geoDetail ? 'var(--sh-space-2)' : 0,
          }}>
            {causeLabels.map(c => <Tag key={c}>{c}</Tag>)}
          </div>
          {a.geoDetail && (
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-secondary)',
            }}>
              {a.geoDetail}
            </p>
          )}
        </Section>

        <Section label="How I want to give">
          <div style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-body)',
            lineHeight: 1.7,
          }}>
            {vis && (
              <p style={{ marginBottom: 'var(--sh-space-2)' }}>
                <span style={{ fontWeight: 600, color: 'var(--sh-text-primary)' }}>{vis.label}</span>
                {' — '}{vis.desc}
              </p>
            )}
            {trust && (
              <p style={{ marginBottom: 'var(--sh-space-2)' }}>
                <span style={{ fontWeight: 600, color: 'var(--sh-text-primary)' }}>{trust.label}</span>
                {' — '}{trust.desc}
              </p>
            )}
            {depth && (
              <p>
                <span style={{ fontWeight: 600, color: 'var(--sh-text-primary)' }}>{depth.label}</span>
                {' — '}{depth.desc}
              </p>
            )}
          </div>
        </Section>

        <Section label={isFirst ? "Where I'm starting" : "What I'm building on"}>
          {isFirst ? (
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-body)',
              lineHeight: 1.6,
            }}>
              This is my first step. I'm here to start.
            </p>
          ) : (
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-body)',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
            }}>
              {a.existingOrgs}
            </p>
          )}
        </Section>

        <Section label="My intention">
          <Tag accent>{a.budget}</Tag>
        </Section>

        {(hasGuardian || hasTeam) && (
          <Section label="Who's involved">
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-body)',
              lineHeight: 1.6,
            }}>
              {hasGuardian && 'A parent or guardian is involved in my financial decisions. My giving values are mine — the execution involves my family.'}
              {hasTeam && 'I have a team that manages my finances. My giving values are mine — my team helps with the logistics.'}
            </p>
          </Section>
        )}

        <Section label="Where I'm headed" last>
          <Quote text={a.legacy} />
        </Section>

        {/* Footer disclaimer */}
        <div style={{
          marginTop: 'var(--sh-space-4)',
          paddingTop: 'var(--sh-space-3)',
          borderTop: 'var(--sh-border-divider)',
        }}>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            lineHeight: 1.55,
          }}>
            These are your words. StewardHouse organized them — we didn't write them. Your data is never sold or shared.
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-2)', marginBottom: 'var(--sh-space-4)' }}>
        <Button variant="secondary" onClick={onCopy} style={{ width: '100%' }}>
          {copied ? 'Copied ✓' : 'Copy to clipboard'}
        </Button>
        <Button variant="ghost" onClick={onUpdate} style={{ width: '100%' }}>
          Update my giving focus
        </Button>
      </div>

      <p style={{
        textAlign: 'center',
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
      }}>
        Your giving evolves. Update anytime — your plan adapts with you.
      </p>
    </main>
  );
}

// — internal helpers —

function Section({ label, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 'var(--sh-space-5)' }}>
      <p style={{
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--sh-bronze)',
        marginBottom: 'var(--sh-space-2)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function Quote({ text }) {
  return (
    <blockquote style={{
      fontFamily: 'var(--sh-font-serif)',
      fontSize: 'var(--sh-text-base)',
      lineHeight: 1.75,
      color: 'var(--sh-text-primary)',
      fontStyle: 'italic',
      paddingLeft: 'var(--sh-space-3)',
      borderLeft: '3px solid var(--sh-bronze-tint)',
      margin: 0,
    }}>
      "{text}"
    </blockquote>
  );
}
