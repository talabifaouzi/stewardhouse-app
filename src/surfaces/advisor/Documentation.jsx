import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { Icon } from '../../components/Icon.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { useDocumentation } from '../../contexts/DocumentationContext.jsx';

export default function Documentation() {
  const { categories: docCategories, addSection } = useDocumentation();
  const [openHint, setOpenHint] = useState(null);
  const toggleHint = (label) =>
    setOpenHint((prev) => (prev === label ? null : label));

  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState('');
  const [newSectionHint, setNewSectionHint] = useState('');
  const [sectionError, setSectionError] = useState('');

  const resetSectionForm = () => {
    setNewSectionLabel('');
    setNewSectionHint('');
    setSectionError('');
    setIsAddingSection(false);
  };

  const handleSaveSection = () => {
    const ok = addSection(newSectionLabel, newSectionHint);
    if (!ok) {
      setSectionError('A section with that name already exists, or the name is empty.');
      return;
    }
    resetSectionForm();
  };

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
          Documentation
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 'var(--sh-space-4)',
          marginBottom: 'var(--sh-space-2)',
        }}>
          <h1 style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-2xl)',
            color: 'var(--sh-text-primary)',
          }}>
            Documentation hub
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 'var(--sh-space-4)',
          }}>
            <Link
              to="/advisor/docs/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--sh-space-1)',
                color: 'var(--sh-bronze)',
                fontSize: 'var(--sh-text-sm)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name="plus" />
              New document
            </Link>
            <button
              type="button"
              onClick={() => {
                setSectionError('');
                setIsAddingSection(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--sh-space-1)',
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: 'var(--sh-bronze)',
                fontSize: 'var(--sh-text-sm)',
                fontFamily: 'inherit',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name="plus" />
              New section
            </button>
          </div>
        </div>
        <p style={{
          fontSize: 'var(--sh-text-md)',
          color: 'var(--sh-text-secondary)',
          maxWidth: '640px',
          lineHeight: 1.6,
        }}>
          Your practice's own materials — the scripts, templates, and notes you decide to keep here. Private to your practice.
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          fontStyle: 'italic',
          lineHeight: 1.55,
          marginTop: 'var(--sh-space-2)',
          maxWidth: '640px',
        }}>
          Anything you add here is session-only — it won't be saved across refreshes.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-5)' }}>
        {docCategories.map(cat => (
          <Card key={cat.label}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--sh-space-3)',
            }}>
              <SectionLabel>{cat.label}</SectionLabel>
              {cat.hint && (
                <button
                  type="button"
                  onClick={() => toggleHint(cat.label)}
                  aria-label={`What goes in ${cat.label}?`}
                  aria-expanded={openHint === cat.label}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: '1px solid var(--sh-bronze-border)',
                    background: 'transparent',
                    color: 'var(--sh-text-muted)',
                    // ADV-006 F1 ruling: was '9px' — nearest token is 11px (+2px nudge).
                    fontSize: 'var(--sh-text-xs)',
                    lineHeight: 1,
                    cursor: 'help',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'inherit',
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  ?
                </button>
              )}
            </div>
            {openHint === cat.label && (
              <div style={{
                background: 'var(--sh-bg-tint)',
                border: '1px solid var(--sh-card-border)',
                borderRadius: 'var(--sh-radius-md)',
                padding: 'var(--sh-space-3) var(--sh-space-4)',
                marginBottom: 'var(--sh-space-3)',
                fontSize: 'var(--sh-text-xs)',
                color: 'var(--sh-text-secondary)',
                lineHeight: 1.55,
              }}>
                {cat.hint}
              </div>
            )}
            {cat.docs.length === 0 ? (
              <p style={{
                fontSize: 'var(--sh-text-sm)',
                color: 'var(--sh-text-muted)',
                fontStyle: 'italic',
                lineHeight: 1.6,
                marginTop: 'var(--sh-space-3)',
              }}>
                No documents yet — use New document to add one.
              </p>
            ) : (
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
                      marginBottom: 'var(--sh-space-half)',
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
            )}
          </Card>
        ))}
        {isAddingSection && (
          <Card>
            <SectionLabel>New section</SectionLabel>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--sh-space-4)',
              marginTop: 'var(--sh-space-3)',
            }}>
              <input
                type="text"
                value={newSectionLabel}
                onChange={(e) => setNewSectionLabel(e.target.value)}
                placeholder="New section name"
                style={inputStyle}
              />
              <input
                type="text"
                value={newSectionHint}
                onChange={(e) => setNewSectionHint(e.target.value)}
                placeholder="What goes here (optional)"
                style={inputStyle}
              />
              {sectionError && (
                <p style={{
                  fontSize: 'var(--sh-text-xs)',
                  color: 'var(--sh-text-muted)',
                  fontStyle: 'italic',
                  lineHeight: 1.55,
                }}>
                  {sectionError}
                </p>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--sh-space-3)',
              }}>
                <Button variant="ghost" onClick={resetSectionForm}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveSection}>Save</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}

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
