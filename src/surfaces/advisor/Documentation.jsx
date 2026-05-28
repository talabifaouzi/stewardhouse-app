import { Link } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { docCategories } from '../../data/documentation.js';

export default function Documentation() {
  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <div style={{ marginBottom: 'var(--sh-space-8)' }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--sh-space-2)',
        }}>
          Section 7 · Documentation
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-2)',
        }}>
          Documentation hub
        </h1>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-secondary)',
          maxWidth: '640px',
          lineHeight: 1.6,
        }}>
          Practice-wide reference materials, working notes, and templates. Private to your practice unless explicitly shared.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-5)' }}>
        {docCategories.map(cat => (
          <Card key={cat.label}>
            <SectionLabel>{cat.label}</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {cat.docs.map((doc, i) => (
                <Link
                  key={doc.id}
                  to={`/advisor/docs/${doc.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sh-space-4)',
                    padding: 'var(--sh-space-3) 0',
                    borderTop: i === 0 ? 'none' : 'var(--sh-border-divider)',
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontFamily: 'var(--sh-font-serif)',
                      fontSize: 'var(--sh-text-base)',
                      color: 'var(--sh-text-primary)',
                      marginBottom: '2px',
                    }}>
                      {doc.title}
                    </p>
                    <p style={{
                      fontSize: 'var(--sh-text-xs)',
                      color: 'var(--sh-text-muted)',
                    }}>
                      {doc.notes}
                    </p>
                  </div>
                  <p style={{
                    fontSize: 'var(--sh-text-xs)',
                    color: 'var(--sh-text-muted)',
                  }}>
                    Updated {doc.updated}
                  </p>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
