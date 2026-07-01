import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { useDocumentation } from '../../contexts/DocumentationContext.jsx';
import { useBasePath } from '../../contexts/AppIdentityContext.jsx';

export default function DocDetail() {
  const { docId } = useParams();
  const { findDocById } = useDocumentation();
  const basePath = useBasePath('/advisor', '/app/advisor');
  const result = findDocById(docId);

  if (!result) {
    return (
      <main style={mainStyle}>
        <div style={breadcrumbStyle}>
          <Link to={`${basePath}/docs`} style={breadcrumbLinkStyle}>
            Documentation
          </Link>
        </div>
        <Card>
          <p style={emptyTextStyle}>Document not found.</p>
        </Card>
      </main>
    );
  }

  const { doc, categoryLabel } = result;

  return (
    <main style={mainStyle}>
      <div style={breadcrumbStyle}>
        <Link to={`${basePath}/docs`} style={breadcrumbLinkStyle}>
          Documentation
        </Link>
        {' · '}
        <span>{doc.title}</span>
      </div>

      <div style={{ marginBottom: 'var(--sh-space-6)' }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--sh-space-2)',
        }}>
          {categoryLabel}
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-2)',
        }}>
          {doc.title}
        </h1>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
        }}>
          Updated {doc.updated}
        </p>
      </div>

      <Card>
        {doc.body.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 'var(--sh-text-md)',
              color: 'var(--sh-text-body)',
              lineHeight: 1.7,
              marginBottom: i === doc.body.length - 1 ? 0 : 'var(--sh-space-4)',
              maxWidth: '680px',
            }}
          >
            {para}
          </p>
        ))}
      </Card>
    </main>
  );
}

const mainStyle = {
  maxWidth: 'var(--sh-content-max)',
  margin: '0 auto',
  padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
};

const breadcrumbStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  marginBottom: 'var(--sh-space-4)',
  letterSpacing: '0.04em',
};

const breadcrumbLinkStyle = {
  color: 'var(--sh-text-muted)',
  textDecoration: 'none',
};

const emptyTextStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
  lineHeight: 1.6,
};
