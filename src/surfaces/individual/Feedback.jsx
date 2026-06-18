import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';

const MAX_FIELD_LEN = 5000;
const FORM_ENDPOINT = import.meta.env.VITE_FEEDBACK_ENDPOINT ?? 'https://formsubmit.co/ajax/talabifaouzi@gmail.com';

// 11 questions ported from the HTML prototype, athletics-phase-1 adjusted.
const QUESTIONS = [
  { id: 'name', q: 'Your name', type: 'text', placeholder: 'First and last name' },
  { id: 'contact', q: 'Best way to reach you', type: 'text', placeholder: 'Email or phone number' },
  { id: 'gps_feel', q: 'After completing the Giving Studio, how did your Giving Plan feel?', type: 'choice', options: ['It captured who I am', 'Close but something was missing', "It didn't feel like me", "I haven't completed it yet"] },
  { id: 'most_valuable', q: 'What was the most valuable part of the experience?', type: 'text', placeholder: 'What stood out to you?' },
  { id: 'confused', q: 'What confused you or felt unnecessary?', type: 'text', placeholder: 'Be honest — this helps us' },
  { id: 'come_back', q: 'Would you come back and use this again?', type: 'choice', options: ['Yes', 'Maybe', 'No'] },
  { id: 'share', q: 'Would you share this with a friend or colleague?', type: 'choice', options: ['Yes', 'Maybe', 'No'] },
  { id: 'missing', q: "What's missing that would make this useful for your real giving?", type: 'text', placeholder: 'Features, information, anything' },
  { id: 'pay', q: 'What would you value a platform like StewardHouse at per month?', type: 'choice', options: ["$0 — I wouldn't pay for this", "$0 — I'd use it if free", '$1–$10/mo', '$10–$25/mo', '$25–$50/mo', '$50+/mo'] },
  { id: 'pay_why', q: 'What would make it worth that amount to you?', type: 'text', placeholder: 'What feature, experience, or outcome drives the value?' },
  { id: 'anything', q: 'Anything else you want us to know?', type: 'text', placeholder: 'Open floor — say whatever you want' },
];

export default function Feedback() {
  const navigate = useNavigate();
  const { answers: a, gifts, lessonsDone } = useIntake();
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setResponses(prev => ({ ...prev, [k]: v }));

  // Behavioral data captured automatically
  const behavioral = {
    stage: a?.stage || 'not set',
    visibility: a?.visibility || 'not set',
    trust: a?.trust || 'not set',
    authority: a?.authority || 'not set',
    causesSelected: (a?.causes || []).length,
    giftsLogged: gifts?.length || 0,
    lessonsCompleted: lessonsDone?.length || 0,
    gpsCompleted: a?.legacy ? 'yes' : 'no',
  };

  const buildExport = () => {
    let txt = 'STEWARDHOUSE FEEDBACK\n' + new Date().toLocaleDateString() + '\n';
    txt += 'Name: ' + (responses.name || 'Anonymous') + '\n';
    txt += 'Contact: ' + (responses.contact || 'Not provided') + '\n\n';
    txt += '--- RESPONSES ---\n';
    QUESTIONS
      .filter(q => !['name', 'contact'].includes(q.id))
      .forEach(q => {
        txt += q.q + '\n' + (responses[q.id] || '(no response)') + '\n\n';
      });
    txt += '--- BEHAVIORAL DATA ---\n';
    Object.entries(behavioral).forEach(([k, v]) => {
      txt += k + ': ' + v + '\n';
    });
    return txt;
  };

  const submit = async () => {
    // Length guard
    for (const [, v] of Object.entries(responses)) {
      if (typeof v === 'string' && v.length > MAX_FIELD_LEN) {
        alert('One of your responses is too long. Please shorten it and try again.');
        return;
      }
    }
    setSubmitting(true);
    const txt = buildExport();
    try {
      await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'StewardHouse Feedback — ' + (responses.name || 'Anonymous'),
          name: (responses.name || 'Anonymous').slice(0, 200),
          contact: (responses.contact || 'Not provided').slice(0, 200),
          feedback: txt.slice(0, 50000),
        }),
      });
    } catch (err) {
      // Even if POST fails, clipboard backup runs and we mark submitted.
      console.warn('Feedback POST failed:', err.message);
    }
    // Clipboard backup so nothing is lost
    try {
      await navigator.clipboard?.writeText(txt);
    } catch (e) {
      // clipboard unavailable
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  // Thank-you state
  if (submitted) {
    return (
      <main style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: 'var(--sh-space-12) var(--sh-space-8)',
        textAlign: 'center',
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
          fontWeight: 400,
          marginBottom: 'var(--sh-space-3)',
        }}>
          Thank you
        </p>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-body)',
          lineHeight: 1.6,
          marginBottom: 'var(--sh-space-6)',
        }}>
          Your feedback shapes what StewardHouse becomes. Every response matters.
        </p>
        <Button variant="primary" onClick={() => navigate('/individual')}>
          Back to home
        </Button>
      </main>
    );
  }

  return (
    <main style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <button
        onClick={() => navigate('/individual')}
        style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-muted)',
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          padding: 0,
          fontFamily: 'inherit',
          marginBottom: 'var(--sh-space-3)',
        }}
      >
        ← Back
      </button>

      <p style={{
        fontSize: '10px',
        color: 'var(--sh-bronze)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
        marginBottom: '4px',
      }}>
        Feedback
      </p>
      <h1 style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        fontWeight: 400,
        marginBottom: 'var(--sh-space-2)',
      }}>
        Help us build this right
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-secondary)',
        lineHeight: 1.55,
        marginBottom: 'var(--sh-space-6)',
      }}>
        Honest answers only. There are no wrong responses. Your name and contact info let us follow up — but everything here is confidential and only seen by the StewardHouse team.
      </p>

      {QUESTIONS.map((q, i) => (
        <div key={q.id} style={{ marginBottom: 'var(--sh-space-5)' }}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            fontWeight: 600,
            color: 'var(--sh-text-primary)',
            marginBottom: 'var(--sh-space-2)',
            lineHeight: 1.5,
          }}>
            {i + 1}. {q.q}
          </p>
          {q.type === 'choice' ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {q.options.map(opt => {
                const sel = responses[q.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => set(q.id, opt)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 'var(--sh-radius-full)',
                      cursor: 'pointer',
                      border: `2px solid ${sel ? 'var(--sh-bronze)' : 'var(--sh-card-border)'}`,
                      background: sel ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
                      fontSize: 'var(--sh-text-sm)',
                      fontWeight: 500,
                      color: sel ? 'var(--sh-bronze-deep)' : 'var(--sh-text-body)',
                      transition: 'all 150ms ease',
                      fontFamily: 'inherit',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea
              value={responses[q.id] || ''}
              onChange={e => set(q.id, e.target.value)}
              placeholder={q.placeholder}
              style={{
                width: '100%',
                minHeight: q.id === 'name' || q.id === 'contact' ? '42px' : '70px',
                padding: '12px',
                borderRadius: 'var(--sh-radius-md)',
                border: '2px solid var(--sh-card-border)',
                fontSize: 'var(--sh-text-base)',
                lineHeight: 1.5,
                color: 'var(--sh-text-body)',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                background: 'var(--sh-card)',
                fontFamily: 'inherit',
              }}
            />
          )}
        </div>
      ))}

      <Button
        variant="primary"
        size="lg"
        onClick={submit}
        disabled={submitting}
        style={{ width: '100%' }}
      >
        {submitting ? 'Sending...' : 'Submit feedback'}
      </Button>

      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 'var(--sh-space-3)',
        lineHeight: 1.5,
      }}>
        Your response is sent directly to the StewardHouse founder. It is not shared with anyone else.
      </p>
    </main>
  );
}
