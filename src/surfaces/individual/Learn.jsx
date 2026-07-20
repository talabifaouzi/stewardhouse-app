import { useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import { UNIVERSAL_LESSONS, ATHLETICS_LESSONS, VISIBILITY_LESSONS, GLOSSARY, ADVISOR_ASSIGNMENTS } from '../../data/lessonsData.js';
import { useFixtureIsolated } from './useFixtureIsolated.js';

export default function Learn() {
  const { lessonsDone, markLessonDone, assignmentsDone, toggleAssignment, answers } = useIntake();
  const fixtureIsolated = useFixtureIsolated();
  const [activeLesson, setActiveLesson] = useState(null);
  const [showGlossary, setShowGlossary] = useState(false);

  // Build lesson list adaptive to user's visibility setting
  const visKey = answers?.visibility || 'selective';
  const visLesson = VISIBILITY_LESSONS[visKey] || VISIBILITY_LESSONS.selective;

  const sections = [
    { label: 'Foundations', lessons: UNIVERSAL_LESSONS },
    { label: 'For your style', lessons: [visLesson] },
    { label: 'Athletics', lessons: ATHLETICS_LESSONS },
  ];

  const allLessons = sections.flatMap(s => s.lessons);
  const completedCount = allLessons.filter(l => lessonsDone.includes(l.id)).length;
  const assignmentsDoneCount = ADVISOR_ASSIGNMENTS.filter(a => assignmentsDone.includes(a.id)).length;

  // Reader view — drill into one lesson's cards
  if (activeLesson) {
    return (
      <LessonReader
        lesson={activeLesson}
        onClose={(completed) => {
          if (completed) markLessonDone(activeLesson.id);
          setActiveLesson(null);
        }}
      />
    );
  }

  // Glossary view
  if (showGlossary) {
    return <GlossaryView onBack={() => setShowGlossary(false)} />;
  }

  return (
    <main style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <p style={{
        fontSize: '10px',
        color: 'var(--sh-bronze)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
        marginBottom: 'var(--sh-space-2)',
      }}>
        Learn
      </p>
      <h1 style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        fontWeight: 400,
        marginBottom: 'var(--sh-space-2)',
      }}>
        Giving practice, in pieces
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-2)',
        lineHeight: 1.55,
      }}>
        Short lessons or review materials. Read one when you have a few minutes.
      </p>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        marginBottom: 'var(--sh-space-6)',
      }}>
        {completedCount} of {allLessons.length} read
      </p>

      {/* Glossary entry */}
      <Card
        interactive
        onClick={() => setShowGlossary(true)}
        style={{
          marginBottom: 'var(--sh-space-6)',
          borderLeft: '3px solid var(--sh-bronze)',
          cursor: 'pointer',
        }}
      >
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          fontWeight: 600,
          color: 'var(--sh-text-primary)',
          marginBottom: '4px',
        }}>
          Glossary
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
        }}>
          {GLOSSARY.length} key terms — bookmark for reference
        </p>
      </Card>

      {/* From your advisor — standalone client-side assignments mock.
          P-3b-1: DEMO-ONLY. This block asserts that an advisor assigned this
          user specific work, and on the authenticated tree that is false —
          /api/me has no assignment relation in either direction (the advisor
          block at me.js:141-358 scopes by owner_advisor_person_id, i.e. an
          advisor reading their own book; the reciprocal is never emitted).
          Nothing to wire to, so the honest state is absence.
          The two referenced PDFs are dead links, and the rows are interactive
          checkboxes whose toggleAssignment is setState ONLY (IntakeContext.jsx
          :206-211; /api/intake is written from Questions.jsx alone) — so a
          signed-in user could check off a fictional advisor's homework and lose
          it on refresh. Removed rather than given an absent-state line: Learn
          should not advertise a section with nothing in it.
          The lesson catalog and glossary below are editorial content, not
          per-person data, and are deliberately KEPT for authenticated users. */}
      {!fixtureIsolated && (
        <div style={{ marginBottom: 'var(--sh-space-6)' }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--sh-bronze)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px',
          }}>
            From your advisor
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            marginBottom: 'var(--sh-space-3)',
          }}>
            {assignmentsDoneCount} of {ADVISOR_ASSIGNMENTS.length} complete
          </p>
          {ADVISOR_ASSIGNMENTS.map(assignment => (
            <AssignmentRow
              key={assignment.id}
              assignment={assignment}
              done={assignmentsDone.includes(assignment.id)}
              onToggle={() => toggleAssignment(assignment.id)}
            />
          ))}
        </div>
      )}

      {sections.map(section => (
        <div key={section.label} style={{ marginBottom: 'var(--sh-space-6)' }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--sh-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 'var(--sh-space-3)',
          }}>
            {section.label}
          </p>
          {section.lessons.map(lesson => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              done={lessonsDone.includes(lesson.id)}
              onOpen={() => setActiveLesson(lesson)}
            />
          ))}
        </div>
      ))}

      <p style={{
        textAlign: 'center',
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        marginTop: 'var(--sh-space-6)',
      }}>
        More lessons publish as the platform grows.
      </p>
    </main>
  );
}

function LessonRow({ lesson, done, onOpen }) {
  return (
    <div
      onClick={onOpen}
      style={{
        background: 'var(--sh-card)',
        borderRadius: 'var(--sh-radius-lg)',
        border: `1px solid ${done ? 'var(--sh-bronze-border)' : 'var(--sh-card-border)'}`,
        padding: 'var(--sh-space-4)',
        marginBottom: 'var(--sh-space-2)',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--sh-space-3)',
        transition: 'all 150ms ease',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sh-space-2)',
          marginBottom: '4px',
        }}>
          {done && (
            <span style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-bronze)',
              fontWeight: 700,
            }}>
              ✓
            </span>
          )}
          <p style={{
            fontSize: 'var(--sh-text-base)',
            fontWeight: 600,
            color: 'var(--sh-text-primary)',
          }}>
            {lesson.title}
          </p>
        </div>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
        }}>
          {lesson.minutes} min · {lesson.cards.length} cards
        </p>
      </div>
      <span style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-bronze)',
      }}>
        →
      </span>
    </div>
  );
}

function AssignmentRow({ assignment, done, onToggle }) {
  const typeLabel = assignment.type === 'reading' ? 'Reading' : 'Task';
  const meta = assignment.type === 'reading' && assignment.fileName
    ? `${typeLabel} · ${assignment.fileName}`
    : typeLabel;
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };
  return (
    <div
      onClick={onToggle}
      onKeyDown={handleKey}
      role="checkbox"
      aria-checked={done}
      tabIndex={0}
      style={{
        background: 'var(--sh-card)',
        borderRadius: 'var(--sh-radius-lg)',
        border: `1px solid ${done ? 'var(--sh-bronze-border)' : 'var(--sh-card-border)'}`,
        borderLeft: '3px solid var(--sh-bronze)',
        padding: 'var(--sh-space-4)',
        marginBottom: 'var(--sh-space-2)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sh-space-3)',
        transition: 'all 150ms ease',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 20,
          height: 20,
          borderRadius: 4,
          border: `1px solid ${done ? 'var(--sh-bronze)' : 'var(--sh-card-border)'}`,
          background: done ? 'var(--sh-bronze)' : 'transparent',
          color: 'white',
          fontSize: 'var(--sh-text-xs)',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {done ? '✓' : ''}
      </span>
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: 'var(--sh-text-base)',
          fontWeight: 600,
          color: 'var(--sh-text-primary)',
          marginBottom: '4px',
        }}>
          {assignment.title}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
        }}>
          {meta}
        </p>
      </div>
    </div>
  );
}

function LessonReader({ lesson, onClose }) {
  const [cardIndex, setCardIndex] = useState(0);
  const card = lesson.cards[cardIndex];
  const isLast = cardIndex === lesson.cards.length - 1;
  const isFirst = cardIndex === 0;

  return (
    <main style={{
      maxWidth: '640px',
      margin: '0 auto',
      padding: 'var(--sh-space-6) var(--sh-space-8) var(--sh-space-16)',
    }}>
      {/* Close */}
      <button
        onClick={() => onClose(false)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--sh-text-muted)',
          fontSize: 'var(--sh-text-sm)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          padding: 0,
          marginBottom: 'var(--sh-space-3)',
        }}
      >
        ← Back to lessons
      </button>

      {/* Lesson title + progress dots */}
      <p style={{
        fontSize: '10px',
        color: 'var(--sh-bronze)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
        marginBottom: '4px',
      }}>
        {lesson.title}
      </p>
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: 'var(--sh-space-5)',
      }}>
        {lesson.cards.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === cardIndex ? 20 : 6,
              height: 5,
              borderRadius: 3,
              background: i <= cardIndex ? 'var(--sh-bronze)' : 'var(--sh-card-border)',
              transition: 'all 300ms ease',
              opacity: i < cardIndex ? 0.55 : 1,
            }}
          />
        ))}
      </div>

      {/* Card content */}
      <Card padding="lg" style={{
        marginBottom: 'var(--sh-space-5)',
        minHeight: '280px',
      }}>
        <p style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-lg)',
          color: 'var(--sh-text-primary)',
          fontWeight: 400,
          marginBottom: 'var(--sh-space-3)',
          lineHeight: 1.4,
        }}>
          {card.heading}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-body)',
          lineHeight: 1.7,
        }}>
          {card.body}
        </p>
      </Card>

      {/* Card number */}
      <p style={{
        textAlign: 'center',
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        marginBottom: 'var(--sh-space-3)',
      }}>
        {cardIndex + 1} of {lesson.cards.length}
      </p>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        gap: 'var(--sh-space-2)',
      }}>
        {!isFirst && (
          <Button
            variant="secondary"
            onClick={() => setCardIndex(cardIndex - 1)}
            style={{ flex: 1 }}
          >
            ← Previous
          </Button>
        )}
        {isLast ? (
          <Button
            variant="primary"
            size="lg"
            onClick={() => onClose(true)}
            style={{ flex: 1 }}
          >
            Finish lesson
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={() => setCardIndex(cardIndex + 1)}
            style={{ flex: 1 }}
          >
            Continue →
          </Button>
        )}
      </div>
    </main>
  );
}

function GlossaryView({ onBack }) {
  return (
    <main style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: 'var(--sh-space-6) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <button
        onClick={onBack}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--sh-text-muted)',
          fontSize: 'var(--sh-text-sm)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          padding: 0,
          marginBottom: 'var(--sh-space-3)',
        }}
      >
        ← Back to lessons
      </button>

      <p style={{
        fontSize: '10px',
        color: 'var(--sh-bronze)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
        marginBottom: '4px',
      }}>
        Glossary
      </p>
      <h1 style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        fontWeight: 400,
        marginBottom: 'var(--sh-space-2)',
      }}>
        {GLOSSARY.length} terms worth knowing
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-secondary)',
        lineHeight: 1.55,
        marginBottom: 'var(--sh-space-6)',
      }}>
        Plain-language definitions of the language of giving. Skim once, come back when you need it.
      </p>

      {GLOSSARY.map((g, i) => (
        <div
          key={g.term}
          style={{
            paddingTop: i === 0 ? 0 : 'var(--sh-space-4)',
            paddingBottom: 'var(--sh-space-4)',
            borderTop: i === 0 ? 'none' : 'var(--sh-border-divider)',
          }}
        >
          <p style={{
            fontSize: 'var(--sh-text-base)',
            fontWeight: 600,
            color: 'var(--sh-text-primary)',
            marginBottom: '6px',
          }}>
            {g.term}
          </p>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-body)',
            lineHeight: 1.65,
          }}>
            {g.def}
          </p>
        </div>
      ))}
    </main>
  );
}
