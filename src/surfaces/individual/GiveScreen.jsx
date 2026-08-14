import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import { useBasePath } from './useBasePath.js';

const GIFT_TYPES = [
  { value: 'unrestricted', label: 'Unrestricted' },
  { value: 'program', label: 'Program' },
  { value: 'capital', label: 'Capital' },
  { value: 'capacity-building', label: 'Capacity-building' },
  { value: 'endowment', label: 'Endowment' },
];

export default function GiveScreen() {
  const navigate = useNavigate();
  const basePath = useBasePath();
  const { addGift } = useIntake();
  const [org, setOrg] = useState('');
  const [amt, setAmt] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [type, setType] = useState('unrestricted');
  const [vehicle, setVehicle] = useState('personal');
  const [notes, setNotes] = useState('');
  const [purpose, setPurpose] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurringYears, setRecurringYears] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Celebration screen after a successful log
  if (done) {
    return (
      <main style={{
        minHeight: '60vh',
        background: 'var(--sh-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sh-space-10) var(--sh-space-8)',
      }}>
        <div style={{
          width: '40px',
          height: '1px',
          background: 'var(--sh-bronze)',
          margin: '0 auto var(--sh-space-5)',
        }} />
        <p style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-xl)',
          color: 'var(--sh-bronze-deep)',
          marginBottom: 'var(--sh-space-2)',
          fontWeight: 400,
        }}>
          Gift logged
        </p>
        <p style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-lg)',
          color: 'var(--sh-text-primary)',
          fontWeight: 400,
          textAlign: 'center',
        }}>
          Added to your giving story
        </p>
      </main>
    );
  }

  const submit = async () => {
    const cleaned = amt.replace(/[^0-9.]/g, '');
    const amount = parseFloat(cleaned);
    if (!org.trim() || isNaN(amount) || amount <= 0) return;

    const date = new Date().toISOString().slice(0, 10);

    setSubmitting(true);
    setError(null);

    let res;
    try {
      res = await fetch('/api/gifts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org: org.trim(),
          amount,
          type,
          vehicle,
          recurring,
          recurringYears: recurring && recurringYears ? Number(recurringYears) : null,
          notes,
          purpose,
          date,
        }),
      });
    } catch (err) {
      setError('Could not reach the server. Check your connection and try again.');
      setSubmitting(false);
      return;
    }

    if (!res.ok) {
      let errMsg = 'Could not save the gift. Please try again.';
      try {
        const errBody = await res.json();
        if (errBody && typeof errBody.error === 'string') {
          errMsg = errBody.error;
        }
      } catch {
        // response wasn't JSON — keep default message
      }
      setError(errMsg);
      setSubmitting(false);
      return;
    }

    const saved = await res.json();
    addGift(saved);
    setSubmitting(false);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setOrg('');
      setAmt('');
      setType('unrestricted');
      setVehicle('personal');
      setNotes('');
      setPurpose('');
      setRecurring(false);
      setRecurringYears('');
      setError(null);
      setShowMore(false);
      navigate(basePath);
    }, 2200);
  };

  return (
    <main style={{
      maxWidth: '560px',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--sh-space-5)',
      }}>
        <p style={{
          fontSize: '10px',
          color: 'var(--sh-bronze)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontWeight: 600,
        }}>
          Log a gift
        </p>
        <button
          onClick={() => navigate(basePath)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--sh-text-muted)',
            fontSize: 'var(--sh-text-sm)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          Cancel
        </button>
      </div>

      {/* Org name */}
      <FieldLabel>Who did you give to?</FieldLabel>
      <input
        value={org}
        onChange={e => setOrg(e.target.value)}
        placeholder="Organization name"
        autoFocus
        style={inputStyle}
      />

      {/* Amount */}
      <FieldLabel style={{ marginTop: 'var(--sh-space-4)' }}>How much?</FieldLabel>
      <input
        value={amt ? `$${amt}` : ''}
        onChange={e => setAmt(formatCurrencyInput(e.target.value))}
        placeholder="$0"
        inputMode="decimal"
        style={inputStyle}
      />

      {/* Toggle more details */}
      {!showMore && (
        <button
          onClick={() => setShowMore(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--sh-bronze)',
            fontSize: 'var(--sh-text-sm)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: 0,
            marginTop: 'var(--sh-space-3)',
            marginBottom: 'var(--sh-space-5)',
          }}
        >
          + Add more details
        </button>
      )}

      {showMore && (
        <>
          <FieldLabel style={{ marginTop: 'var(--sh-space-4)' }}>Type</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: 'var(--sh-space-4)' }}>
            {GIFT_TYPES.map(t => (
              <Chip key={t.value} selected={type === t.value} onClick={() => setType(t.value)} label={t.label} />
            ))}
          </div>

          <FieldLabel style={{ marginTop: 'var(--sh-space-4)' }}>Purpose (optional)</FieldLabel>
          <textarea
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
            placeholder="What was this gift for? Useful for your own records — e.g. IRS reporting."
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical', fontFamily: 'inherit', marginBottom: 'var(--sh-space-4)' }}
          />

          <FieldLabel>Vehicle</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: 'var(--sh-space-4)' }}>
            {[
              { id: 'personal', l: 'Personal' },
              { id: 'daf', l: 'DAF' },
              { id: 'community', l: 'Community Foundation' },
            ].map(v => (
              <Chip
                key={v.id}
                selected={vehicle === v.id}
                onClick={() => setVehicle(v.id)}
                label={v.l}
              />
            ))}
          </div>

          {/* Recurring toggle */}
          <div
            onClick={() => setRecurring(!recurring)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sh-space-3)',
              cursor: 'pointer',
              padding: 'var(--sh-space-2) 0',
              marginBottom: 'var(--sh-space-4)',
            }}
          >
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: 'var(--sh-radius-md)',
              border: `2px solid ${recurring ? 'var(--sh-bronze)' : 'var(--sh-card-border)'}`,
              background: recurring ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: 'var(--sh-bronze-deep)',
              fontWeight: 700,
            }}>
              {recurring ? '✓' : ''}
            </div>
            <span style={{ fontSize: 'var(--sh-text-sm)', color: 'var(--sh-text-body)' }}>
              This is a recurring gift
            </span>
          </div>

          {recurring && (
            <div style={{ marginBottom: 'var(--sh-space-4)' }}>
              <FieldLabel>Over how many years? (optional)</FieldLabel>
              <input
                value={recurringYears}
                onChange={e => setRecurringYears(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 3"
                inputMode="numeric"
                style={inputStyle}
              />
            </div>
          )}

          {/* Notes */}
          <FieldLabel>Notes (optional)</FieldLabel>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anything you want to remember about this gift..."
            style={{
              ...inputStyle,
              minHeight: '70px',
              resize: 'vertical',
              fontFamily: 'inherit',
              marginBottom: 'var(--sh-space-5)',
            }}
          />
        </>
      )}

      {error && (
        <p style={{
          marginTop: 'var(--sh-space-3)',
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-warning-text)',
          background: 'var(--sh-warning-bg)',
          border: '1px solid var(--sh-warning-border)',
          borderRadius: 'var(--sh-radius-md)',
          padding: 'var(--sh-space-2) var(--sh-space-3)',
        }}>
          {error}
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        disabled={!org.trim() || !amt.trim() || submitting}
        onClick={submit}
        style={{ width: '100%' }}
      >
        {submitting ? 'Saving…' : 'Log this gift'}
      </Button>

      <p style={{
        textAlign: 'center',
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        marginTop: 'var(--sh-space-4)',
      }}>
        Your record stays private. Only you see it.
      </p>
    </main>
  );
}

const inputStyle = {
  width: '100%',
  padding: '13px',
  borderRadius: 'var(--sh-radius-md)',
  border: '2px solid var(--sh-card-border)',
  fontSize: 'var(--sh-text-base)',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'var(--sh-card)',
  fontFamily: 'inherit',
};

function FieldLabel({ children, style }) {
  return (
    <p style={{
      fontSize: 'var(--sh-text-sm)',
      fontWeight: 600,
      color: 'var(--sh-text-primary)',
      marginBottom: 'var(--sh-space-1)',
      ...style,
    }}>
      {children}
    </p>
  );
}

function Chip({ selected, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 'var(--sh-radius-full)',
        cursor: 'pointer',
        fontSize: 'var(--sh-text-sm)',
        fontWeight: 500,
        border: `2px solid ${selected ? 'var(--sh-bronze)' : 'var(--sh-card-border)'}`,
        background: selected ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
        color: selected ? 'var(--sh-bronze-deep)' : 'var(--sh-text-body)',
        transition: 'all 150ms ease',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}

function formatCurrencyInput(raw) {
  let cleaned = raw.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  }
  const [intPart, decPart] = cleaned.split('.');
  const withCommas = intPart ? Number(intPart).toLocaleString('en-US') : '';
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}
