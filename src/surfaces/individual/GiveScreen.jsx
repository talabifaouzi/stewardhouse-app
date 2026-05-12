import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';

export default function GiveScreen() {
  const navigate = useNavigate();
  const { addGift } = useIntake();
  const [org, setOrg] = useState('');
  const [amt, setAmt] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [type, setType] = useState('unrestricted');
  const [vehicle, setVehicle] = useState('personal');
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [done, setDone] = useState(false);

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

  const submit = () => {
    const cleaned = amt.replace(/[^0-9.]/g, '');
    const amount = parseFloat(cleaned);
    if (!org.trim() || isNaN(amount) || amount <= 0) return;
    const gift = {
      id: `g-${Date.now()}`,
      org: org.trim(),
      amount,
      type,
      vehicle,
      recurring,
      notes,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    addGift(gift);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setOrg('');
      setAmt('');
      setType('unrestricted');
      setVehicle('personal');
      setNotes('');
      setRecurring(false);
      setShowMore(false);
      navigate('/individual');
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
          onClick={() => navigate('/individual')}
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
        value={amt}
        onChange={e => setAmt(e.target.value)}
        placeholder="$"
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
          <div style={{ display: 'flex', gap: '6px', marginBottom: 'var(--sh-space-4)' }}>
            <Chip selected={type === 'unrestricted'} onClick={() => setType('unrestricted')} label="Unrestricted" />
            <Chip selected={type === 'directed'} onClick={() => setType('directed')} label="Directed" />
          </div>

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
              borderRadius: '6px',
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

      <Button
        variant="primary"
        size="lg"
        disabled={!org.trim() || !amt.trim()}
        onClick={submit}
        style={{ width: '100%' }}
      >
        Log this gift
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
