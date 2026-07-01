import { Children, cloneElement, isValidElement, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { useDocumentation } from '../../contexts/DocumentationContext.jsx';
import { useBasePath } from '../../contexts/AppIdentityContext.jsx';

export default function DocCreate() {
  const navigate = useNavigate();
  const basePath = useBasePath('/advisor', '/app/advisor');
  const { categories, addDoc } = useDocumentation();

  const [title, setTitle] = useState('');
  const [section, setSection] = useState(categories[0]?.label ?? '');
  const [notes, setNotes] = useState('');
  const [bodyText, setBodyText] = useState('');

  const trimmedTitle = title.trim();
  const paragraphs = bodyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const canSave =
    trimmedTitle.length > 0 && section.length > 0 && paragraphs.length > 0;

  const invalidReason =
    trimmedTitle.length === 0
      ? 'Title is required.'
      : section.length === 0
      ? 'Section is required.'
      : paragraphs.length === 0
      ? 'Body is required.'
      : '';

  const handleSave = () => {
    if (!canSave) return;
    const newId = addDoc(section, {
      title: trimmedTitle,
      notes,
      body: paragraphs,
    });
    navigate(`${basePath}/docs/${newId}`);
  };

  const handleCancel = () => {
    navigate(`${basePath}/docs`);
  };

  return (
    <main style={mainStyle}>
      {/* Breadcrumb */}
      <div style={breadcrumbStyle}>
        <Link to={`${basePath}/docs`} style={breadcrumbLinkStyle}>
          Documentation
        </Link>
        {' · '}
        <span>New document</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 'var(--sh-space-8)' }}>
        <p style={eyebrowStyle}>Documentation</p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-2)',
          lineHeight: 1.3,
        }}>
          New document
        </h1>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-muted)',
          fontStyle: 'italic',
          lineHeight: 1.55,
          maxWidth: '640px',
        }}>
          Manual entry only. Anything you add is session-only and won't survive a page refresh.
        </p>
      </div>

      {/* Form */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-5)' }}>
          <FormField label="Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A short, declarative title"
              style={inputStyle}
            />
          </FormField>

          <FormField label="Section" required>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              style={{ ...inputStyle, width: '280px' }}
            >
              {categories.map((cat) => (
                <option key={cat.label} value={cat.label}>
                  {cat.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Notes">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="One-line description shown beneath the title in the list."
              style={inputStyle}
            />
          </FormField>

          <FormField label="Body" required>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Write your notes. Separate paragraphs with a blank line."
              rows={10}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
            />
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              fontStyle: 'italic',
              lineHeight: 1.55,
              marginTop: 'var(--sh-space-2)',
            }}>
              Blank lines separate paragraphs.
            </p>
          </FormField>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 'var(--sh-space-3)',
          marginTop: 'var(--sh-space-6)',
          paddingTop: 'var(--sh-space-5)',
          borderTop: 'var(--sh-border-divider)',
        }}>
          {!canSave && (
            <span style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              fontStyle: 'italic',
            }}>
              {invalidReason}
            </span>
          )}
          <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSave}>
            Save document
          </Button>
        </div>
      </Card>
    </main>
  );
}

// Native form-control tags that get auto-wired with aria-labelledby +
// aria-required from FormField. Wrapped controls (custom components like
// SegmentedControl) are passed through unchanged — their root div is not
// the interactive element, so cloning aria onto them would mislead AT.
// Those need their own labelledby plumbing (see LessonEditor scope/category).
const NATIVE_FORM_TAGS = new Set(['input', 'textarea', 'select']);

function FormField({ label, required, children }) {
  const labelId = useId();
  let enhanced = false;
  const wired = Children.map(children, (child) => {
    if (enhanced || !isValidElement(child)) return child;
    if (typeof child.type !== 'string' || !NATIVE_FORM_TAGS.has(child.type)) return child;
    enhanced = true;
    return cloneElement(child, {
      'aria-labelledby': labelId,
      ...(required ? { 'aria-required': true } : {}),
    });
  });
  return (
    <div>
      <p id={labelId} style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 500,
        marginBottom: 'var(--sh-space-2)',
      }}>
        {label}
        {required && <span style={{ color: 'var(--sh-bronze)', marginLeft: 'var(--sh-space-1)' }} aria-hidden="true">·</span>}
      </p>
      {wired}
    </div>
  );
}

const mainStyle = {
  maxWidth: 'var(--sh-content-max)',
  margin: '0 auto',
  padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
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

const eyebrowStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--sh-space-2)',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 'var(--sh-space-3)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  fontFamily: 'inherit',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  background: 'var(--sh-card)',
};
