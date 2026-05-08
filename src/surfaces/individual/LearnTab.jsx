import { useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import {
  UNIVERSAL_LESSONS,
  VISIBILITY_LESSONS,
  ATHLETICS_LESSONS,
} from '../../data/lessonsData.js';

export default function LearnTab() {
  const { answers: a, lessonsDone, markLessonDone } = useIntake();
  const [expandedId, setExpandedId] = useState(null);

  const visibilityLesson = VISIBILITY_LESSONS[a.visibility];

  // Order: visibility-specific first (most relevant), then athletics, then universal
  const sections = [
    visibilityLesson && {
      label: 'For your visibility preference',
      desc: 'Lessons tuned to how you want to give.',
      lessons: [visibilityLesson],
    },
    {
      label: 'Athletics',
      desc: 'For athletes thinking through giving and career.',
      lessons: ATHLETICS_LESSONS,
    },
    {
      label: 'Foundations',
      desc: 'Concepts every giver should know.',
      lessons: UNIVERSAL_LESSONS,
    },
  ].filter(Boolean);

  return (
    <main style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-6) var(--sh-space-16)',
    }}>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
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
        marginBottom: 'var(--sh-space-2)',
        fontWeight: 400,
      }}>
        The fundamentals — at your pace
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-6)',
        lineHeight: 1.6,
      }}>
        Short lessons. Real concepts. No jargon, no homework.
      </p>

      {sections.map((section, i) => (
        <div key={section.label} style={{ marginBottom: 'var(--sh-space-6)' }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--sh-bronze)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px',
          }}>
            {section.label}
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            marginBottom: 'var(--sh-space-3)',
          }}>
            {section.desc}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-2)' }}>
            {section.lessons.map(lesson => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                expanded={expandedId === lesson.id}
                done={lessonsDone.includes(lesson.id)}
                onToggle={() => setExpandedId(expandedId === lesson.id ? null : lesson.id)}
                onMarkDone={() => markLessonDone(lesson.id)}
              />
            ))}
          </div>
        </div>
      ))}

      <p style={{
        textAlign: 'center',
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        marginTop: 'var(--sh-space-6)',
      }}>
        More lessons coming soon. Reading slowly is its own form of progress.
      </p>
    </main>
  );
}

function LessonCard({ lesson, expanded, done, onToggle, onMarkDone }) {
  return (
    <Card padding={expanded ? 'lg' : 'md'} interactive>
      <div onClick={onToggle} style={{ cursor: 'pointer' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--sh-space-3)',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: 'var(--sh-font-serif)',
              fontSize: 'var(--sh-text-md)',
              color: 'var(--sh-text-primary)',
              fontWeight: 400,
              lineHeight: 1.4,
              marginBottom: '4px',
            }}>
              {lesson.title}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <p style={{
                fontSize: 'var(--sh-text-xs)',
                color: 'var(--sh-text-muted)',
              }}>
                {lesson.minutes} min read
              </p>
              {done && (
                <span style={{
                  fontSize: '10px',
                  color: 'var(--sh-bronze)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                  padding: '2px 8px',
                  background: 'var(--sh-bronze-tint)',
                  borderRadius: 'var(--sh-radius-full)',
                }}>
                  ✓ Read
                </span>
              )}
            </div>
          </div>
          <span style={{
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-bronze)',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform 200ms ease',
          }}>
            →
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{
          marginTop: 'var(--sh-space-4)',
          paddingTop: 'var(--sh-space-3)',
          borderTop: 'var(--sh-border-divider)',
        }}>
          {lesson.content.map((card, i) => (
            <div
              key={i}
              style={{
                marginBottom: i < lesson.content.length - 1 ? 'var(--sh-space-4)' : 'var(--sh-space-3)',
                paddingBottom: i < lesson.content.length - 1 ? 'var(--sh-space-4)' : 0,
                borderBottom: i < lesson.content.length - 1 ? 'var(--sh-border-divider)' : 'none',
              }}
            >
              <p style={{
                fontFamily: 'var(--sh-font-serif)',
                fontSize: 'var(--sh-text-base)',
                color: 'var(--sh-text-primary)',
                fontWeight: 400,
                marginBottom: 'var(--sh-space-2)',
                lineHeight: 1.4,
              }}>
                {card.heading}
              </p>
              <p style={{
                fontSize: 'var(--sh-text-sm)',
                color: 'var(--sh-text-body)',
                lineHeight: 1.7,
              }}>
                {card.body}
              </p>
            </div>
          ))}

          {!done && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkDone(); }}
              style={{
                background: 'transparent',
                border: '1.5px solid var(--sh-bronze)',
                color: 'var(--sh-bronze-deep)',
                padding: '8px 16px',
                borderRadius: 'var(--sh-radius-full)',
                fontSize: 'var(--sh-text-xs)',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Mark as read
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
