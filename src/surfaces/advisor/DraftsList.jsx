import { Link } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { Tag } from '../../components/Tag.jsx';
import { usePracticeContent } from '../../contexts/PracticeContentContext.jsx';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(iso) {
  if (!iso || typeof iso !== 'string') return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

export default function DraftsList() {
  const { lessons: practiceLessons } = usePracticeContent();
  const drafts = [...practiceLessons]
    .filter((l) => l.status === 'draft')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

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
        <span>Drafts</span>
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
          Curriculum library
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-2)',
        }}>
          Drafts
        </h1>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-secondary)',
          maxWidth: '640px',
          lineHeight: 1.6,
        }}>
          Tailored versions and authored lessons you haven&rsquo;t published yet.
        </p>
      </div>

      {/* List */}
      <Card>
        <SectionLabel>All drafts</SectionLabel>
        {drafts.length === 0 ? (
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            lineHeight: 1.6,
            padding: 'var(--sh-space-4) 0',
          }}>
            No drafts yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {drafts.map((draft, i) => (
              <DraftRow key={draft.id} draft={draft} first={i === 0} />
            ))}
          </div>
        )}
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

function DraftRow({ draft, first }) {
  const kindLabel = draft.kind === 'fork' ? 'Tailored' : 'Authored';
  const kindColor = draft.kind === 'fork' ? 'bronze' : 'accent';

  return (
    <Link
      to={`/advisor/curriculum/${draft.id}/edit`}
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
          {draft.title}
        </p>
        <Tag color={kindColor}>{kindLabel}</Tag>
      </div>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
      }}>
        Updated {formatDate(draft.updatedAt)}
      </p>
    </Link>
  );
}
