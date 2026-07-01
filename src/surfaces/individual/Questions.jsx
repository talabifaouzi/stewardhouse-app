import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import {
  CAUSES,
  VIS,
  TRUST,
  BUDGETS,
  DEPTH,
  STAGES_ATHLETICS,
  AUTHORITY,
  GEO_OPTIONS,
  deriveGivingStyle,
} from '../../data/intakeData.js';
import { useBasePath } from './useBasePath.js';

const INTAKE_DEBOUNCE_MS = 250;

async function saveIntake(payload) {
  const res = await fetch('/api/intake', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let errMsg = 'Could not save your answer. Please try again.';
    try {
      const errBody = await res.json();
      if (errBody && typeof errBody.error === 'string') errMsg = errBody.error;
    } catch {
      // response wasn't JSON — keep default message
    }
    throw new Error(errMsg);
  }
}

export default function Questions() {
  const navigate = useNavigate();
  const basePath = useBasePath();
  const { answers, updateAnswer, toggleAnswer, completeIntake } = useIntake();

  const a = answers;

  // Step definitions — each returns { valid, btnText, render, emotional? }
  const steps = [
    // Q0: Stage (athletics-only, no segment branching)
    {
      valid: !!a.stage,
      btnText: 'Keep going',
      render: () => (
        <>
          <SectionHeader
            title="Where are you right now?"
            sub="Different stages, different realities. We want to meet yours."
          />
          {STAGES_ATHLETICS.map(st => (
            <SelectCard
              key={st.id}
              selected={a.stage === st.id}
              onClick={() => updateAnswer('stage', st.id)}
              label={st.label}
              desc={st.desc}
            />
          ))}
        </>
      ),
    },

    // Q1: Authority
    {
      valid: !!a.authority,
      btnText: 'Next',
      render: () => (
        <>
          <SectionHeader
            title="Who helps manage your money?"
            sub="No judgment. This shapes who has access to your StewardHouse account."
          />
          {AUTHORITY.map(auth => (
            <SelectCard
              key={auth.id}
              selected={a.authority === auth.id}
              onClick={() => updateAnswer('authority', auth.id)}
              label={auth.label}
              desc={auth.desc}
            />
          ))}
        </>
      ),
    },

    // Q2: Causes
    {
      valid: a.causes.length > 0,
      btnText: 'Lock these in',
      render: () => (
        <>
          <SectionHeader
            title="Where do you want to make an impact?"
            sub="Choose up to 3. These shape the organizations, lessons, and opportunities we surface for you."
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--sh-space-2)',
            marginBottom: 'var(--sh-space-3)',
          }}>
            {CAUSES.map(c => {
              const sel = a.causes.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleAnswer('causes', c.id, 3)}
                  style={{
                    padding: 'var(--sh-space-3) var(--sh-space-1)',
                    borderRadius: 'var(--sh-radius-md)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: `2px solid ${sel ? 'var(--sh-bronze)' : 'var(--sh-card-border)'}`,
                    background: sel ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
                    transition: 'all 150ms ease',
                    fontSize: 'var(--sh-text-xs)',
                    fontWeight: 500,
                    color: sel ? 'var(--sh-bronze-deep)' : 'var(--sh-text-secondary)',
                    fontFamily: 'inherit',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            textAlign: 'center',
            fontStyle: 'italic',
          }}>
            {a.causes.length} of 3 selected
          </p>
        </>
      ),
    },

    // Q3: Geography
    {
      valid:
        a.geo.length > 0 &&
        (a.geo.every(id => !['hometown', 'current', 'state'].includes(id)) || (a.geoDetail || '').trim().length > 0),
      btnText: 'Set',
      render: () => (
        <>
          <SectionHeader
            title="Where do you want your giving to land?"
            sub="Select all that apply."
          />
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--sh-space-2)',
            marginBottom: 'var(--sh-space-4)',
          }}>
            {GEO_OPTIONS.map(g => {
              const sel = a.geo.includes(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => toggleAnswer('geo', g.id)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--sh-radius-full)',
                    cursor: 'pointer',
                    border: `2px solid ${sel ? 'var(--sh-bronze)' : 'var(--sh-card-border)'}`,
                    background: sel ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
                    fontSize: 'var(--sh-text-sm)',
                    fontWeight: 500,
                    color: sel ? 'var(--sh-bronze-deep)' : 'var(--sh-text-secondary)',
                    transition: 'all 150ms ease',
                    fontFamily: 'inherit',
                  }}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
          {a.geo.some(id => ['hometown', 'current', 'state'].includes(id)) && (
            <input
              value={a.geoDetail}
              onChange={e => { updateAnswer('geoDetail', e.target.value); debouncedSaveField('geoDetail', e.target.value); }}
              placeholder="City, State (e.g., Cleveland, OH)"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--sh-radius-md)',
                border: '2px solid var(--sh-card-border)',
                fontSize: 'var(--sh-text-base)',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
                background: 'var(--sh-card)',
              }}
            />
          )}
        </>
      ),
    },

    // Q4: Lived experience (emotional moment)
    {
      valid: (a.lived || '').trim().length > 0,
      btnText: 'Keep going',
      emotional: true,
      render: () => (
        <>
          <SectionHeader
            title="Where did you come from?"
            sub="The neighborhood. The people. The things you carry."
          />
          <textarea
            value={a.lived}
            onChange={e => { updateAnswer('lived', e.target.value); debouncedSaveField('lived', e.target.value); }}
            placeholder="Even one sentence..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '14px',
              borderRadius: 'var(--sh-radius-md)',
              border: '2px solid var(--sh-card-border)',
              fontFamily: 'inherit',
              fontSize: 'var(--sh-text-base)',
              lineHeight: 1.6,
              color: 'var(--sh-text-body)',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              background: 'var(--sh-card)',
            }}
          />
          {(a.lived || '').trim().length > 0 && (
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-bronze)',
              fontStyle: 'italic',
              textAlign: 'center',
              marginTop: 'var(--sh-space-3)',
            }}>
              That's your story. Everything builds on it.
            </p>
          )}
        </>
      ),
    },

    // Q5: Influence (emotional)
    {
      valid: (a.influence || '').trim().length > 0,
      btnText: 'Go deeper',
      emotional: true,
      render: () => (
        <>
          <SectionHeader
            title="Who taught you what generosity looks like?"
            sub="A parent, coach, mentor. Or maybe nobody did — and that's why you're here."
          />
          <textarea
            value={a.influence}
            onChange={e => { updateAnswer('influence', e.target.value); debouncedSaveField('influence', e.target.value); }}
            placeholder="Tell us about them — or the absence..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '14px',
              borderRadius: 'var(--sh-radius-md)',
              border: '2px solid var(--sh-card-border)',
              fontFamily: 'inherit',
              fontSize: 'var(--sh-text-base)',
              lineHeight: 1.6,
              color: 'var(--sh-text-body)',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              background: 'var(--sh-card)',
            }}
          />
        </>
      ),
    },

    // Q6: Visibility
    {
      valid: !!a.visibility,
      btnText: "That's my preference",
      render: () => (
        <>
          <SectionHeader title="How public do you want your giving to be?" />
          {VIS.map(v => (
            <SelectCard
              key={v.id}
              selected={a.visibility === v.id}
              onClick={() => updateAnswer('visibility', v.id)}
              label={v.label}
              desc={v.desc}
            />
          ))}
          {a.visibility && (
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-bronze)',
              fontStyle: 'italic',
              textAlign: 'center',
              marginTop: 'var(--sh-space-3)',
            }}>
              {a.visibility === 'private' && 'Private giving is powerful. We\'ll help you keep it that way.'}
              {a.visibility === 'selective' && 'Your story, your terms. We\'ll help you decide when sharing serves the cause.'}
              {a.visibility === 'public' && 'When you share, you give others permission to start. That\'s a multiplier.'}
            </p>
          )}
        </>
      ),
    },

    // Q7: Trust
    {
      valid: !!a.trust,
      btnText: "That's honest",
      render: () => (
        <>
          <SectionHeader
            title="How much control do you want over where your money goes?"
            sub="Every answer here is the right one."
          />
          {TRUST.map(t => (
            <SelectCard
              key={t.id}
              selected={a.trust === t.id}
              onClick={() => updateAnswer('trust', t.id)}
              label={t.label}
              desc={t.desc}
            />
          ))}
          {a.trust && (
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-bronze)',
              fontStyle: 'italic',
              textAlign: 'center',
              marginTop: 'var(--sh-space-3)',
            }}>
              {a.trust === 'full' && 'That trust is rare. The organizations you support will feel the difference.'}
              {a.trust === 'some' && 'Flexibility with intention. You\'ll find the right balance as you go.'}
              {a.trust === 'directed' && 'Knowing where your money goes is its own form of care.'}
            </p>
          )}
        </>
      ),
    },

    // Q8: Budget
    {
      valid: !!a.budget,
      btnText: 'Next',
      render: () => (
        <>
          <SectionHeader
            title="What feels right for this year?"
            sub="This is a compass heading, not a contract."
          />
          {BUDGETS.map(b => (
            <SelectCard
              key={b}
              selected={a.budget === b}
              onClick={() => updateAnswer('budget', b)}
              label={b}
            />
          ))}
        </>
      ),
    },

    // Q9: Depth
    {
      valid: !!a.depth,
      btnText: 'That fits',
      render: () => (
        <>
          <SectionHeader
            title="How do you want to spread your giving?"
            sub="Some people go deep with a few organizations. Others spread support across many. Both build impact differently."
          />
          {DEPTH.map(d => (
            <SelectCard
              key={d.id}
              selected={a.depth === d.id}
              onClick={() => updateAnswer('depth', d.id)}
              label={d.label}
              desc={d.desc}
            />
          ))}
          {a.depth && (
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-bronze)',
              fontStyle: 'italic',
              textAlign: 'center',
              marginTop: 'var(--sh-space-3)',
            }}>
              {a.depth === 'deep' && 'Depth builds trust. The organizations you choose will know your name.'}
              {a.depth === 'balanced' && 'Enough range to explore, enough focus to matter.'}
              {a.depth === 'broad' && 'Casting wide teaches you what resonates. You can always go deeper later.'}
            </p>
          )}
        </>
      ),
    },

    // Q10: Existing orgs
    {
      valid: (a.existingOrgs || '').trim().length > 0,
      btnText: 'Almost there',
      render: () => {
        const isFB = (a.existingOrgs || '').includes('first step');
        return (
          <>
            <SectionHeader
              title="Are you already giving?"
              sub="Even $20 counts. If this is your first step, that's a real answer."
            />
            {!isFB && (
              <textarea
                value={a.existingOrgs}
                onChange={e => { updateAnswer('existingOrgs', e.target.value); debouncedSaveField('existingOrgs', e.target.value); }}
                placeholder="e.g., My local food bank — $200"
                style={{
                  width: '100%',
                  minHeight: '90px',
                  padding: '14px',
                  borderRadius: 'var(--sh-radius-md)',
                  border: '2px solid var(--sh-card-border)',
                  fontFamily: 'inherit',
                  fontSize: 'var(--sh-text-base)',
                  lineHeight: 1.6,
                  color: 'var(--sh-text-body)',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: 'var(--sh-card)',
                  marginBottom: 'var(--sh-space-3)',
                }}
              />
            )}
            <button
              onClick={() => updateAnswer('existingOrgs', isFB ? '' : 'This is my first step')}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: 'var(--sh-radius-md)',
                cursor: 'pointer',
                border: `2px solid ${isFB ? 'var(--sh-bronze)' : 'var(--sh-card-border)'}`,
                background: isFB ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
                textAlign: 'center',
                transition: 'all 200ms ease',
                fontSize: 'var(--sh-text-sm)',
                fontWeight: 500,
                color: isFB ? 'var(--sh-bronze-deep)' : 'var(--sh-text-muted)',
                fontFamily: 'inherit',
              }}
            >
              {isFB ? '✓  ' : ''}I haven't given yet — this is my first step
            </button>
          </>
        );
      },
    },

    // Q11: Legacy (emotional)
    {
      valid: (a.legacy || '').trim().length > 0,
      btnText: 'Build my GPS',
      emotional: true,
      render: () => (
        <>
          <SectionHeader
            title="When people talk about you 20 years from now, what do you want them to say?"
            sub="The first thing that comes to mind is usually the truest."
          />
          <textarea
            value={a.legacy}
            onChange={e => { updateAnswer('legacy', e.target.value); debouncedSaveField('legacy', e.target.value); }}
            placeholder="Even one sentence..."
            style={{
              width: '100%',
              minHeight: '130px',
              padding: '14px',
              borderRadius: 'var(--sh-radius-md)',
              border: '2px solid var(--sh-card-border)',
              fontFamily: 'inherit',
              fontSize: 'var(--sh-text-base)',
              lineHeight: 1.6,
              color: 'var(--sh-text-body)',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              background: 'var(--sh-card)',
            }}
          />
        </>
      ),
    },
  ];

  // Resume at the first step whose answer is still empty. Each step's .valid
  // field is the authoritative "is this answered" check (e.g. Q3 encodes the
  // geo + geoDetail compound rule). If every step is already answered — a
  // returning user who completed intake and then browser-backed here — land
  // at the last step so they can advance out via next() → GPSReveal rather
  // than being forced through all 12 questions again.
  const [step, setStep] = useState(() => {
    const firstInvalid = steps.findIndex((s) => !s.valid);
    return firstInvalid === -1 ? steps.length - 1 : firstInvalid;
  });
  const [showBreak, setShowBreak] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function debouncedSaveField(key, value) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveIntake({ [key]: value }).catch(() => {
        // Debounced safety-net write failed silently — the next step-advance
        // sends the FULL answers object and will re-persist this field's
        // current value, so a dropped debounce write self-heals rather than
        // being a permanent loss. No user-facing error needed here.
      });
    }, INTAKE_DEBOUNCE_MS);
  }

  const cur = steps[step];

  // Group transitions
  const groupBreaks = {
    4: { text: 'Now the real questions.', btn: "I'm ready" },
    8: { text: "Almost there. The last few are about where you're headed.", btn: "Let's finish this" },
  };

  const next = async () => {
    setSaving(true);
    setSaveError(null);

    const isLastStep = step === steps.length - 1;
    const style = isLastStep ? deriveGivingStyle(a) : null;
    const payload = isLastStep
      ? { ...a, intakeComplete: true, givingStyle: style }
      : { ...a };

    try {
      await saveIntake(payload);
    } catch (err) {
      setSaveError(err.message || 'Could not save your answer. Please try again.');
      setSaving(false);
      return;
    }

    setSaving(false);

    if (step < steps.length - 1) {
      const breakTo = groupBreaks[step + 1];
      if (breakTo) {
        setShowBreak(breakTo);
      } else {
        setStep(step + 1);
      }
    } else {
      completeIntake(style);
      navigate(`${basePath}/reveal`, { replace: true });
    }
  };

  if (showBreak) {
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
        <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '1px',
            background: 'var(--sh-bronze)',
            margin: '0 auto var(--sh-space-5)',
          }} />
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-lg)',
            color: 'var(--sh-text-primary)',
            lineHeight: 1.5,
            marginBottom: 'var(--sh-space-8)',
          }}>
            {showBreak.text}
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => { setShowBreak(null); setStep(step + 1); }}
            style={{ width: '100%' }}
          >
            {showBreak.btn}
          </Button>
        </div>
      </main>
    );
  }

  // Progress dots
  const dots = Array.from({ length: steps.length }, (_, i) => (
    <div
      key={i}
      style={{
        width: i === step ? 16 : 5,
        height: 5,
        borderRadius: 3,
        background: i <= step ? 'var(--sh-bronze)' : 'var(--sh-card-border)',
        transition: 'all 300ms ease',
        opacity: i < step ? 0.5 : 1,
      }}
    />
  ));

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--sh-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'var(--sh-space-8) var(--sh-space-6)',
    }}>
      <div style={{ maxWidth: '500px', width: '100%' }}>
        {/* Back link */}
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-muted)',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontFamily: 'inherit',
              marginBottom: 'var(--sh-space-2)',
            }}
          >
            ← Back
          </button>
        )}

        {/* Progress dots — hidden during emotional steps */}
        {!cur.emotional && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '4px',
            margin: 'var(--sh-space-3) 0 var(--sh-space-5)',
          }}>
            {dots}
          </div>
        )}
        {cur.emotional && <div style={{ height: '32px' }} />}

        {/* Question content */}
        <div style={{ marginBottom: 'var(--sh-space-6)' }}>
          {cur.render()}
        </div>

        {saveError && (
          <p style={{
            marginTop: 'var(--sh-space-3)',
            marginBottom: 'var(--sh-space-3)',
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-warning-text)',
            background: 'var(--sh-warning-bg)',
            border: '1px solid var(--sh-warning-border)',
            borderRadius: 'var(--sh-radius-md)',
            padding: 'var(--sh-space-2) var(--sh-space-3)',
          }}>
            {saveError}
          </p>
        )}

        {/* Action button */}
        <Button
          variant="primary"
          size="lg"
          onClick={next}
          disabled={!cur.valid || saving}
          style={{ width: '100%' }}
        >
          {saving ? 'Saving…' : (cur.btnText || 'Continue')}
        </Button>
      </div>
    </main>
  );
}

// — internal helpers —

function SectionHeader({ title, sub }) {
  return (
    <>
      <h2 style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-xl)',
        color: 'var(--sh-text-primary)',
        fontWeight: 400,
        marginBottom: sub ? 'var(--sh-space-2)' : 'var(--sh-space-4)',
        lineHeight: 1.35,
      }}>
        {title}
      </h2>
      {sub && (
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-secondary)',
          marginBottom: 'var(--sh-space-5)',
          lineHeight: 1.55,
        }}>
          {sub}
        </p>
      )}
    </>
  );
}

function SelectCard({ selected, onClick, label, desc }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: 'var(--sh-space-3) var(--sh-space-4)',
        borderRadius: 'var(--sh-radius-md)',
        cursor: 'pointer',
        marginBottom: 'var(--sh-space-2)',
        border: `2px solid ${selected ? 'var(--sh-bronze)' : 'var(--sh-card-border)'}`,
        background: selected ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
        transition: 'all 150ms ease',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      <div style={{
        fontSize: 'var(--sh-text-base)',
        fontWeight: 600,
        color: selected ? 'var(--sh-bronze-deep)' : 'var(--sh-text-primary)',
        marginBottom: desc ? '3px' : 0,
      }}>
        {label}
      </div>
      {desc && (
        <div style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-secondary)',
          lineHeight: 1.4,
        }}>
          {desc}
        </div>
      )}
    </button>
  );
}
