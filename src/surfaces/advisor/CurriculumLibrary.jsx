import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { lessons } from '../../data/content.js';

const SCOPE_FILTERS = [
  { key: 'any',       label: 'All' },
  { key: 'general',   label: 'General' },
  { key: 'athletics', label: 'Athletics' },
];

function scopeMatches(scopeKey, lessonScope) {
  if (scopeKey === 'general') return lessonScope === 'all';
  if (scopeKey === 'athletics') return lessonScope === 'Athletics';
  return true;
}

function capitalize(s) {
  if (!s || typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function CurriculumLibrary() {
  const [scopeKey, setScopeKey] = useState('any');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lessons.filter((lesson) => {
      if (!scopeMatches(scopeKey, lesson.scope)) return false;
      if (q && !lesson.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [scopeKey, query]);

  const filtersActive = scopeKey !== 'any' || query.trim().length > 0;

  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--sh-space-8)' }}>
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
          Base lessons that support the conversations you have with clients — structure, not script.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sh-space-3)',
        marginBottom: 'var(--sh-space-5)',
      }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lessons by title"
          aria-label="Search lessons by title"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: 'var(--sh-space-3)',
            border: 'var(--sh-border-thin)',
            borderRadius: '6px',
            fontFamily: 'inherit',
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-body)',
            background: 'var(--sh-card)',
            lineHeight: 1.55,
          }}
        />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sh-space-2)',
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 500,
            marginRight: 'var(--sh-space-1)',
          }}>
            Scope
          </span>
          {SCOPE_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              selected={scopeKey === f.key}
              onClick={() => setScopeKey(f.key)}
            />
          ))}
        </div>
      </div>

      {/* Lesson list */}
      <Card>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 'var(--sh-space-3)',
          marginBottom: 'var(--sh-space-4)',
        }}>
          <SectionLabel>All lessons</SectionLabel>
          <span style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            letterSpacing: '0.02em',
          }}>
            {filtersActive
              ? `${filtered.length} of ${lessons.length} lessons`
              : `${lessons.length} lessons`}
          </span>
        </div>

        {filtered.length === 0 ? (
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            lineHeight: 1.6,
            padding: 'var(--sh-space-4) 0',
          }}>
            No lessons match the current filters.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((lesson, i) => (
              <LessonRow key={lesson.id} lesson={lesson} first={i === 0} />
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}

function FilterChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        background: selected ? 'var(--sh-bronze-tint)' : 'transparent',
        color: selected ? 'var(--sh-bronze-deep)' : 'var(--sh-text-secondary)',
        border: selected ? '1px solid transparent' : 'var(--sh-border-thin)',
        padding: '4px 12px',
        borderRadius: 'var(--sh-radius-full)',
        fontSize: 'var(--sh-text-xs)',
        fontFamily: 'inherit',
        fontWeight: 500,
        letterSpacing: '0.02em',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function LessonRow({ lesson, first }) {
  const scopeLabel = lesson.scope === 'all' ? 'General' : lesson.scope;
  return (
    <Link
      to={`/advisor/curriculum/${lesson.id}`}
      style={{
        display: 'block',
        padding: 'var(--sh-space-3) 0',
        borderTop: first ? 'none' : 'var(--sh-border-divider)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
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
        {lesson.minutes} min · {scopeLabel} · {capitalize(lesson.category)}
      </p>
    </Link>
  );
}
