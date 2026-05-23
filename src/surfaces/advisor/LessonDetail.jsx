import { useParams, Link, Navigate } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { getLessonById } from '../../data/content.js';

function capitalize(s) {
  if (!s || typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function LessonDetail() {
  const { lessonId } = useParams();
  const lesson = getLessonById(lessonId);

  if (!lesson) {
    return <Navigate to="/advisor/curriculum" replace />;
  }

  const scopeLabel = lesson.scope === 'all' ? 'General' : lesson.scope;

  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      {/* Breadcrumb */}
      <div style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        marginBottom: 'var(--sh-space-4)',
        letterSpacing: '0.04em',
      }}>
        <Link to="/advisor/curriculum" style={{
          color: 'var(--sh-text-muted)',
          textDecoration: 'none',
        }}>
          Curriculum library
        </Link>
        {' · '}
        <span>{lesson.title}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 'var(--sh-space-8)' }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--sh-space-2)',
        }}>
          Section 4 · Lesson
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-2)',
          lineHeight: 1.3,
        }}>
          {lesson.title}
        </h1>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-muted)',
          letterSpacing: '0.02em',
        }}>
          {lesson.minutes} min · {scopeLabel} · {capitalize(lesson.category)}
        </p>
      </div>

      {/* Summary + body shell */}
      <Card>
        <SectionLabel>Summary</SectionLabel>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-secondary)',
          lineHeight: 1.65,
          fontStyle: 'italic',
        }}>
          {lesson.summary}
        </p>

        <div style={{
          marginTop: 'var(--sh-space-6)',
          paddingTop: 'var(--sh-space-5)',
          borderTop: 'var(--sh-border-divider)',
        }}>
          <SectionLabel>Lesson</SectionLabel>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}>
            The full lesson is being written. The summary above describes what the lesson covers; the long-form read will follow.
          </p>
        </div>
      </Card>

      {/* Back link */}
      <div style={{ marginTop: 'var(--sh-space-6)' }}>
        <Link to="/advisor/curriculum" style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-bronze)',
          fontWeight: 500,
          textDecoration: 'none',
        }}>
          ← Back to library
        </Link>
      </div>
    </main>
  );
}
