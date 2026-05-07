import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { lessons } from '../../data/content.js';

export default function CurriculumLibrary() {
  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--sh-space-6)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        <div>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 'var(--sh-space-2)',
          }}>
            Section 4 · Curriculum
          </p>
          <h1 style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-2xl)',
            color: 'var(--sh-text-primary)',
            marginBottom: 'var(--sh-space-2)',
          }}>
            Curriculum library
          </h1>
          <p style={{
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-text-secondary)',
            maxWidth: '640px',
            lineHeight: 1.6,
          }}>
            Base lessons, your forks, and your own authored content. Structure for the conversations
            you have with clients — not scripts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sh-space-2)' }}>
          <Button variant="secondary">Author new</Button>
          <Button variant="primary">View drafts</Button>
        </div>
      </div>

      {/* Stat row — base / forked / authored */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--sh-space-4)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        <LibraryStat label="Base lessons" value={lessons.length} sub="StewardHouse foundations" />
        <LibraryStat label="Your forks" value={3} sub="Edited from base" />
        <LibraryStat label="Your authored" value={1} sub="Created by your practice" />
      </div>

      {/* Lesson list */}
      <Card>
        <SectionLabel>All lessons</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {lessons.map((lesson, i) => (
            <LessonRow key={lesson.id} lesson={lesson} first={i === 0} />
          ))}
        </div>
      </Card>
    </main>
  );
}

function LibraryStat({ label, value, sub }) {
  return (
    <div style={{
      background: 'var(--sh-card)',
      border: 'var(--sh-border-thin)',
      borderRadius: 'var(--sh-radius-lg)',
      padding: 'var(--sh-space-5)',
    }}>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        margin: 0,
        marginBottom: 'var(--sh-space-2)',
        fontWeight: 500,
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        margin: 0,
        marginBottom: 'var(--sh-space-1)',
      }}>
        {value}
      </p>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
      }}>
        {sub}
      </p>
    </div>
  );
}

function LessonRow({ lesson, first }) {
  const scopeBadge = lesson.scope === 'all' ? 'All clients' : lesson.scope;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sh-space-4)',
      padding: 'var(--sh-space-3) 0',
      borderTop: first ? 'none' : 'var(--sh-border-divider)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-base)',
          color: 'var(--sh-text-primary)',
          marginBottom: '2px',
        }}>
          {lesson.title}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
        }}>
          {lesson.minutes} min · {scopeBadge}
        </p>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '4px',
        minWidth: '120px',
      }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
        }}>
          {Math.round(lesson.completed * 100)}% of clients
        </p>
        <ProgressBar value={lesson.completed} />
      </div>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div style={{
      width: '100px',
      height: '4px',
      borderRadius: 'var(--sh-radius-full)',
      background: 'var(--sh-divider)',
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${value * 100}%`,
        height: '100%',
        background: 'var(--sh-bronze)',
      }} />
    </div>
  );
}
