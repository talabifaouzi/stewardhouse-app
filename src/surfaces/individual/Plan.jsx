import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Tag } from '../../components/Tag.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import { CAUSES, VIS, TRUST, DEPTH, BUDGETS } from '../../data/intakeData.js';
import GivingModeler from './GivingModeler.jsx';
import { useBasePath } from './useBasePath.js';

export default function Plan() {
  const navigate = useNavigate();
  const basePath = useBasePath();
  const { answers: a, givingStyle, worldLabel, resetIntake } = useIntake();
  const [copied, setCopied] = useState(false);

  if (!a || !a.causes || a.causes.length === 0) {
    return <PlanEmpty navigate={navigate} resetIntake={resetIntake} basePath={basePath} />;
  }

  const causeLabels = a.causes
    .map(id => CAUSES.find(c => c.id === id)?.label)
    .filter(Boolean);
  const visLabel = VIS.find(v => v.id === a.visibility)?.label || '';
  const visDesc = VIS.find(v => v.id === a.visibility)?.desc || '';
  const trustLabel = TRUST.find(t => t.id === a.trust)?.label || '';
  const trustDesc = TRUST.find(t => t.id === a.trust)?.desc || '';
  const depthLabel = DEPTH.find(d => d.id === a.depth)?.label || '';
  const depthDesc = DEPTH.find(d => d.id === a.depth)?.desc || '';
  const isFirst = a.existingOrgs?.includes('first step') || a.existingOrgs?.includes("haven't given");
  const hasGuardian = a.authority === 'guardian';
  const hasTeam = a.authority === 'team';

  const stageLabel = a.stage
    ? a.stage.charAt(0).toUpperCase() + a.stage.slice(1)
    : '';

  const copyToClipboard = () => {
    const text =
`MY GIVING PLAN

Where I Come From
"${a.lived}"

Who Shaped Me
"${a.influence}"

What Moves Me
${causeLabels.join(', ')}${a.geoDetail ? `\n${a.geoDetail}` : ''}

How I Want to Give
${visLabel} — ${visDesc}
${trustLabel} — ${trustDesc}
${depthLabel} — ${depthDesc}

${isFirst ? "Where I'm Starting\nThis is my first step. I'm here to start." : `What I'm Building On\n${a.existingOrgs}`}

My Intention
${a.budget}

Where I'm Headed
"${a.legacy}"

— StewardHouse`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--sh-space-6)' }}>
        <p style={{
          fontSize: '10px',
          color: 'var(--sh-bronze)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontWeight: 600,
          marginBottom: 'var(--sh-space-2)',
        }}>
          My Giving Plan
        </p>
        {givingStyle && (
          <div style={{
            display: 'inline-block',
            padding: '6px 18px',
            borderRadius: 'var(--sh-radius-full)',
            background: 'var(--sh-bronze-tint)',
            color: 'var(--sh-bronze-deep)',
            fontSize: 'var(--sh-text-sm)',
            fontWeight: 600,
            marginBottom: 'var(--sh-space-2)',
            letterSpacing: '0.02em',
          }}>
            {givingStyle}
          </div>
        )}
        {(worldLabel || a.stage) && (
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
          }}>
            {worldLabel}{stageLabel ? ` · ${stageLabel}` : ''}
          </p>
        )}
      </div>

      {/* Plan body */}
      <Card padding="lg" style={{
        marginBottom: 'var(--sh-space-4)',
        boxShadow: '0 3px 16px rgba(60, 50, 30, 0.04)',
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
            lineHeight: 1.65,
          }}>
            <p style={{ marginBottom: 'var(--sh-space-2)' }}>
              <strong style={{ color: 'var(--sh-text-primary)' }}>{visLabel}</strong>
              {' — '}{visDesc}
            </p>
            <p style={{ marginBottom: 'var(--sh-space-2)' }}>
              <strong style={{ color: 'var(--sh-text-primary)' }}>{trustLabel}</strong>
              {' — '}{trustDesc}
            </p>
            <p>
              <strong style={{ color: 'var(--sh-text-primary)' }}>{depthLabel}</strong>
              {' — '}{depthDesc}
            </p>
          </div>
        </Section>

        <Section label={isFirst ? "Where I'm starting" : "What I'm building on"}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-body)',
            lineHeight: 1.6,
            whiteSpace: 'pre-line',
          }}>
            {isFirst
              ? "This is my first step. I'm here to start."
              : a.existingOrgs}
          </p>
        </Section>

        <Section label="My intention">
          <Tag tone="bronze">{a.budget}</Tag>
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

        <div style={{
          borderTop: 'var(--sh-border-divider)',
          paddingTop: 'var(--sh-space-3)',
          marginTop: 'var(--sh-space-2)',
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

      {/* Interactive modeler */}
      <GivingModeler budget={a.budget} />

      {/* Actions */}
      <Button
        variant="secondary"
        onClick={copyToClipboard}
        style={{ width: '100%', marginBottom: 'var(--sh-space-2)' }}
      >
        {copied ? 'Copied ✓' : 'Copy to clipboard'}
      </Button>

      <Button
        variant="ghost"
        onClick={() => {
          resetIntake();
          navigate(`${basePath}/welcome`);
        }}
        style={{ width: '100%' }}
      >
        Update my giving focus
      </Button>

      <p style={{
        textAlign: 'center',
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        marginTop: 'var(--sh-space-4)',
      }}>
        Your giving evolves. Update anytime — your plan adapts with you.
      </p>
    </main>
  );
}

function Section({ label, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 'var(--sh-space-5)' }}>
      <p style={{
        fontSize: '10px',
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
    <p style={{
      fontFamily: 'var(--sh-font-serif)',
      fontSize: 'var(--sh-text-md)',
      color: 'var(--sh-text-primary)',
      fontStyle: 'italic',
      lineHeight: 1.7,
      paddingLeft: 'var(--sh-space-4)',
      borderLeft: '3px solid var(--sh-bronze-tint)',
    }}>
      "{text}"
    </p>
  );
}

function PlanEmpty({ navigate, resetIntake, basePath }) {
  return (
    <main style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: 'var(--sh-space-12) var(--sh-space-8)',
      textAlign: 'center',
    }}>
      <h1 style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        marginBottom: 'var(--sh-space-3)',
      }}>
        You haven't built your plan yet
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-6)',
        lineHeight: 1.6,
      }}>
        The Giving Studio takes 15 minutes. On the other side, you'll have a personal compass for every giving decision.
      </p>
      <Button
        variant="primary"
        size="lg"
        onClick={() => {
          resetIntake();
          navigate(`${basePath}/welcome`);
        }}
      >
        Start the Giving Studio
      </Button>
    </main>
  );
}
