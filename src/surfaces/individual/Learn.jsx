import { useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import { UNIVERSAL_LESSONS, ATHLETICS_LESSONS, VISIBILITY_LESSONS } from '../../data/lessonsData.js';

export default function Learn() {
  const { lessonsDone, markLessonDone, answers } = useIntake();
  const [expanded, setExpanded] = useState(null);

  // Build lesson list — universal + visibility-specific + athletics
  const allLessons = [
    ...UNIVERSAL_LESSONS.map(l => ({ ...l, category: 'Foundations' })),
  ];

  // Add visibility-specific lesson if user has set visibility
  const visLesson = answers?.visibility ? VISIBILITY_LESSONS[answers.visibility] : null;
  if (visLesson) {
    allLessons.push({ ...visLesson, category: 'For your style' });
  }

  // Athletics lessons
  ATHLETICS_LESSONS.forEach(l => {
    allLessons.push({ ...l, category: 'Athletics' });
  });

  // Group by category
  const byCategory = {};
  allLessons.forEach(l => {
    if (!byCategory[l.category]) byCategory[l.category] = [];
    byCategory[l.category].push(l);
  });

  const completedCount = allLessons.filter(l => lessonsDone.includes(l.id)).length;

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
        Short lessons. Read one when you have a few minutes. No homework.
      </p>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        marginBottom: 'var(--sh-space-6)',
      }}>
        {completedCount} of {allLessons.length} read
      </p>

      {Object.entries(byCategory).map(([cat, lessons]) => (
        <div key={cat} style={{ marginBottom: 'var(--sh-space-6)' }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--sh-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 'var(--sh-space-3)',
          }}>
            {cat}
          </p>
          {lessons.map(lesson => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              expanded={expanded === lesson.id}
              done={lessonsDone.includes(lesson.id)}
              onToggle={() => {
                const next = expanded === lesson.id ? null : lesson.id;
                setExpanded(next);
                if (next && !lessonsDone.includes(lesson.id)) {
                  markLessonDone(lesson.id);
                }
              }}
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
        More lessons publish as the platform grows. Suggest a topic via feedback.
      </p>
    </main>
  );
}

function LessonCard({ lesson, expanded, done, onToggle }) {
  return (
    <div style={{
      background: 'var(--sh-card)',
      borderRadius: 'var(--sh-radius-lg)',
      border: `1px solid ${done ? 'var(--sh-bronze-border)' : 'var(--sh-card-border)'}`,
      marginBottom: 'var(--sh-space-2)',
      overflow: 'hidden',
    }}>
      <div
        onClick={onToggle}
        style={{
          padding: 'var(--sh-space-4) var(--sh-space-4)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--sh-space-3)',
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
                fontWeight: 600,
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
          {lesson.minutes && (
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
            }}>
              {lesson.minutes} min read
            </p>
          )}
        </div>
        <span style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-muted)',
          flexShrink: 0,
        }}>
          {expanded ? '−' : '+'}
        </span>
      </div>
      {expanded && (
        <div style={{
          padding: '0 var(--sh-space-4) var(--sh-space-4)',
          borderTop: 'var(--sh-border-divider)',
          paddingTop: 'var(--sh-space-3)',
          marginTop: 'var(--sh-space-2)',
        }}>
          {lesson.content?.map((card, i) => (
            <div key={i} style={{
              marginBottom: i < lesson.content.length - 1 ? 'var(--sh-space-4)' : 0,
            }}>
              {card.heading && (
                <p style={{
                  fontFamily: 'var(--sh-font-serif)',
                  fontSize: 'var(--sh-text-md)',
                  color: 'var(--sh-text-primary)',
                  fontWeight: 400,
                  marginBottom: 'var(--sh-space-2)',
                  lineHeight: 1.4,
                }}>
                  {card.heading}
                </p>
              )}
              <p style={{
                fontSize: 'var(--sh-text-sm)',
                color: 'var(--sh-text-body)',
                lineHeight: 1.7,
              }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
