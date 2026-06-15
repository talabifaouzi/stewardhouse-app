import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { Tag } from '../../components/Tag.jsx';
import { lessons } from '../../data/content.js';
import { usePracticeContent } from '../../contexts/PracticeContentContext.jsx';

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
  const navigate = useNavigate();
  const { lessons: practiceLessons } = usePracticeContent();
  const [scopeKey, setScopeKey] = useState('any');
  const [query, setQuery] = useState('');

  const publishedForks = useMemo(
    () => practiceLessons.filter((p) => p.kind === 'fork' && p.status === 'published'),
    [practiceLessons],
  );
  const publishedAuthored = useMemo(
    () => practiceLessons.filter((p) => p.kind === 'authored' && p.status === 'published'),
    [practiceLessons],
  );
  const draftsCount = useMemo(
    () => practiceLessons.filter((p) => p.status === 'draft').length,
    [practiceLessons],
  );

  // Combined list: base lessons in canonical order, with their published forks
  // immediately following, then authored lessons at the end. Drafts excluded.
  const combinedLessons = useMemo(() => {
    const result = [];
    for (const base of lessons) {
      result.push(base);
      const forks = publishedForks
        .filter((p) => p.baseId === base.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      result.push(...forks);
    }
    const authored = [...publishedAuthored].sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt),
    );
    result.push(...authored);
    return result;
  }, [publishedForks, publishedAuthored]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return combinedLessons.filter((lesson) => {
      if (!scopeMatches(scopeKey, lesson.scope)) return false;
      if (q && !lesson.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [combinedLessons, scopeKey, query]);

  const filtersActive = scopeKey !== 'any' || query.trim().length > 0;

  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      {/* Header */}
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
            Curriculum
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
            Base lessons, your tailored lessons, and your own authored content. Structure for the conversations you have with clients — not scripts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sh-space-2)', flexShrink: 0 }}>
          <Button variant="primary" onClick={() => navigate('/advisor/curriculum/new')}>
            Author new
          </Button>
          <Button variant="secondary" onClick={() => navigate('/advisor/curriculum/drafts')}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sh-space-2)' }}>
              View drafts
              {draftsCount > 0 && <Tag color="bronze">{draftsCount}</Tag>}
            </span>
          </Button>
        </div>
      </div>

      {/* Stat row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--sh-space-4)',
        marginBottom: 'var(--sh-space-8)',
      }}>
        <LibraryStat label="Base" value={lessons.length} sub="StewardHouse foundations" />
        <LibraryStat label="Tailored" value={publishedForks.length} sub="Tailored from base" />
        <LibraryStat label="Authored" value={publishedAuthored.length} sub="Created by your practice" />
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
            borderRadius: 'var(--sh-radius-md)',
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
              ? `${filtered.length} of ${combinedLessons.length} lessons`
              : `${combinedLessons.length} lessons`}
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
        padding: 'var(--sh-space-1) var(--sh-space-3)',
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
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 'var(--sh-space-2)',
        marginBottom: 'var(--sh-space-half)',
      }}>
        <p style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-base)',
          color: 'var(--sh-text-primary)',
          margin: 0,
        }}>
          {lesson.title}
        </p>
        {lesson.kind === 'fork' && <Tag color="bronze">Tailored</Tag>}
        {lesson.kind === 'authored' && <Tag color="accent">Authored</Tag>}
      </div>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
      }}>
        {lesson.minutes} min · {scopeLabel} · {capitalize(lesson.category)}
      </p>
    </Link>
  );
}
