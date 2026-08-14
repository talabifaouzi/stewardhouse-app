import { useId, useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { Icon } from '../../components/Icon.jsx';
import { Modal } from '../../components/Modal.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { findLesson, getLessonById } from '../../data/content.js';
import { usePracticeContent } from '../../contexts/PracticeContentContext.jsx';
import { useBasePath } from '../../contexts/AppIdentityContext.jsx';

function capitalize(s) {
  if (!s || typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function LessonDetail() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const basePath = useBasePath('/advisor', '/app/advisor');
  // `authenticated` comes from the context (P-4), NOT from
  // useOptionalAppIdentity(). It is the same predicate that governs remove()'s
  // BEHAVIOUR (PracticeContentContext.jsx:97-104), so the copy describing that
  // behaviour cannot drift away from it. Ruling A in
  // docs/pilot-gate-criteria.md governs isolate-versus-caveat for FIXTURE
  // CONTENT; this is a behavioural divergence between the two trees, a
  // different question, so Ruling A does not apply here.
  const { lessons: practiceLessons, remove, update, writeError, authenticated } = usePracticeContent();

  // Add-material form state — practice lessons only.
  // Hooks must run unconditionally, so these sit above the early return below.
  const [openForm, setOpenForm] = useState(null); // 'reading' | 'task' | null
  const [formTitle, setFormTitle] = useState('');
  const [formFilename, setFormFilename] = useState('');
  const readingFileLabelId = useId();
  const readingTitleLabelId = useId();
  const taskTitleLabelId = useId();

  // ADV-020 — discard confirm flow via Modal (replaces window.confirm).
  // Modal handles focus trap, Escape, backdrop-click, and trigger-restore
  // via its proven 8-consumer pattern.
  const [discardModalOpen, setDiscardModalOpen] = useState(false);

  const lesson = findLesson(lessonId, practiceLessons);

  if (!lesson) {
    return <Navigate to={`${basePath}/curriculum`} replace />;
  }

  const scopeLabel = lesson.scope === 'all' ? 'General' : lesson.scope;
  const baseLesson = lesson.kind === 'fork' && lesson.baseId
    ? getLessonById(lesson.baseId)
    : null;
  const isPractice = lesson.kind === 'fork' || lesson.kind === 'authored';

  const resetForm = () => {
    setOpenForm(null);
    setFormTitle('');
    setFormFilename('');
  };

  const handleAddMaterial = () => {
    const trimmedTitle = formTitle.trim();
    if (!trimmedTitle) return;
    if (openForm === 'reading' && !formFilename) return;
    const newMaterial = {
      id: `mat-${Date.now()}`,
      type: openForm,
      title: trimmedTitle,
      fileName: openForm === 'reading' ? formFilename : null,
    };
    update(lesson.id, { materials: [...(lesson.materials || []), newMaterial] });
    resetForm();
  };

  // P-4: the modal diverges by TREE, because the underlying capability does.
  //
  // Demo tree: remove() genuinely deletes from local state and returns true, so
  // the confirm copy is accurate and is unchanged.
  //
  // Authenticated tree: there is no DELETE endpoint (none in practice-content.js
  // or practice-content/[id].js; PracticeContentContext.jsx:102 states
  // additive-only as the design posture, and lesson deletion has no retention
  // ruling). remove() sets writeError and returns false. The old copy promised
  // "It will be removed from your library", which is a control stating an action
  // it does not perform. The TITLE carried the same promise, so it gets a
  // variant too: "Discard authored lesson" over copy saying discard is
  // unavailable reads as a broken promise in the heading itself.
  const discardTitle = authenticated
    ? 'Discarding is not available yet'
    : (lesson?.kind === 'fork' ? 'Discard tailored version' : 'Discard authored lesson');

  const discardMessage = authenticated
    ? 'Removing a lesson from your library is not available yet. This lesson stays where it is.'
    : (lesson?.kind === 'fork'
      ? 'Discard this tailored version? Your edits to it will be lost.'
      : 'Discard this authored lesson? It will be removed from your library.');

  // Awaits and honours the return value. remove() is async and was called
  // without await, so the navigation raced the failure: the advisor left the
  // page believing the lesson was gone while it was still in their library.
  // On false, stay put; writeError renders below.
  const handleConfirmDiscard = async () => {
    const removed = await remove(lesson.id);
    if (!removed) return;
    setDiscardModalOpen(false);
    navigate(`${basePath}/curriculum`);
  };

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
        <Link to={`${basePath}/curriculum`} style={{
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
          Lesson
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
        {lesson.kind === 'fork' && baseLesson && (
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            letterSpacing: '0.02em',
            marginTop: 'var(--sh-space-1)',
          }}>
            Tailored from &ldquo;{baseLesson.title}&rdquo;
          </p>
        )}
        {lesson.kind === 'authored' && (
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
            letterSpacing: '0.02em',
            marginTop: 'var(--sh-space-1)',
          }}>
            Authored by this practice
          </p>
        )}
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

      {/* Materials — base lessons render only if they carry any (they don't);
          practice lessons always render, to allow adding the first material. */}
      {(isPractice || (lesson.materials && lesson.materials.length > 0)) && (
        <div style={{ marginTop: 'var(--sh-space-5)' }}>
          <Card>
            <h2 style={{
              fontFamily: 'var(--sh-font-serif)',
              fontSize: 'var(--sh-text-lg)',
              color: 'var(--sh-text-primary)',
              margin: 0,
              marginBottom: 'var(--sh-space-4)',
            }}>
              Materials
            </h2>

            {lesson.materials && lesson.materials.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {lesson.materials.map((mat, i) => (
                  <MaterialRow key={mat.id} material={mat} first={i === 0} />
                ))}
              </div>
            ) : (
              <p style={{
                fontSize: 'var(--sh-text-sm)',
                color: 'var(--sh-text-muted)',
                fontStyle: 'italic',
                lineHeight: 1.6,
                margin: 0,
              }}>
                No materials yet.
              </p>
            )}

            {isPractice && (
              <div style={{
                marginTop: 'var(--sh-space-5)',
                paddingTop: 'var(--sh-space-4)',
                borderTop: 'var(--sh-border-divider)',
              }}>
                {openForm === null && (
                  <div style={{ display: 'flex', gap: 'var(--sh-space-2)' }}>
                    <Button variant="secondary" onClick={() => setOpenForm('reading')}>Add reading</Button>
                    <Button variant="secondary" onClick={() => setOpenForm('task')}>Add task</Button>
                  </div>
                )}
                {openForm === 'reading' && (
                  <div>
                    <FieldLabel id={readingFileLabelId}>File</FieldLabel>
                    <input
                      type="file"
                      aria-labelledby={readingFileLabelId}
                      onChange={(e) => setFormFilename(e.target.files?.[0]?.name || '')}
                      style={{
                        fontSize: 'var(--sh-text-sm)',
                        fontFamily: 'inherit',
                        color: 'var(--sh-text-body)',
                        marginBottom: 'var(--sh-space-4)',
                      }}
                    />
                    <FieldLabel id={readingTitleLabelId}>Title</FieldLabel>
                    <input
                      type="text"
                      aria-labelledby={readingTitleLabelId}
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="A short, descriptive title"
                      style={addMaterialInputStyle}
                    />
                    <FormActions
                      onCancel={resetForm}
                      onAdd={handleAddMaterial}
                      canAdd={formTitle.trim().length > 0 && formFilename.length > 0}
                    />
                  </div>
                )}
                {openForm === 'task' && (
                  <div>
                    <FieldLabel id={taskTitleLabelId}>Title</FieldLabel>
                    <input
                      type="text"
                      aria-labelledby={taskTitleLabelId}
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="A short, descriptive title"
                      style={addMaterialInputStyle}
                    />
                    <FormActions
                      onCancel={resetForm}
                      onAdd={handleAddMaterial}
                      canAdd={formTitle.trim().length > 0}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Actions — base: fork; fork: edit + discard fork; authored: edit + discard */}
      <div style={{ display: 'flex', gap: 'var(--sh-space-2)', marginTop: 'var(--sh-space-5)' }}>
        {!lesson.kind && (
          <Button
            variant="secondary"
            onClick={() => navigate(`${basePath}/curriculum/${lesson.id}/fork`)}
          >
            Tailor this lesson
          </Button>
        )}
        {lesson.kind === 'fork' && (
          <>
            <Button
              variant="primary"
              onClick={() => navigate(`${basePath}/curriculum/${lesson.id}/edit`)}
            >
              Edit
            </Button>
            <Button variant="ghost" onClick={() => setDiscardModalOpen(true)}>
              Discard tailored version
            </Button>
          </>
        )}
        {lesson.kind === 'authored' && (
          <>
            <Button
              variant="primary"
              onClick={() => navigate(`${basePath}/curriculum/${lesson.id}/edit`)}
            >
              Edit
            </Button>
            <Button variant="ghost" onClick={() => setDiscardModalOpen(true)}>
              Discard
            </Button>
          </>
        )}
      </div>

      {/* Back link */}
      <div style={{ marginTop: 'var(--sh-space-6)' }}>
        <Link to={`${basePath}/curriculum`} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--sh-space-1)',
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-bronze)',
          fontWeight: 500,
          textDecoration: 'none',
        }}>
          <Icon name="chevron-left" />
          Back to library
        </Link>
      </div>

      {/* Discard confirm modal (ADV-020 — replaces window.confirm). */}
      <Modal
        isOpen={discardModalOpen}
        onClose={() => setDiscardModalOpen(false)}
        title={discardTitle}
      >
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-secondary)',
          lineHeight: 1.6,
          marginBottom: 'var(--sh-space-5)',
        }}>
          {discardMessage}
        </p>
        {writeError && (
          <p role="alert" style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-bronze-deep)',
            lineHeight: 1.5,
            marginBottom: 'var(--sh-space-5)',
            overflowWrap: 'break-word',
          }}>
            {writeError}
          </p>
        )}
        {/* The ACTION ROW diverges for the same reason the copy does. On the
            authenticated tree the modal is informational, so it offers a single
            Close rather than a Cancel/Discard pair: inviting a press on
            "Discard" directly under copy saying discard is unavailable would
            reproduce the defect this slice repairs, one layer down. */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'var(--sh-space-2)',
        }}>
          {authenticated ? (
            <Button variant="primary" onClick={() => setDiscardModalOpen(false)}>Close</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setDiscardModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleConfirmDiscard}>Discard</Button>
            </>
          )}
        </div>
      </Modal>
    </main>
  );
}

function MaterialRow({ material, first }) {
  const typeLabel = material.type === 'reading' ? 'Reading' : 'Task';
  const showFile = material.type === 'reading' && material.fileName;
  return (
    <div style={{
      padding: 'var(--sh-space-3) 0',
      borderTop: first ? 'none' : 'var(--sh-border-divider)',
    }}>
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-base)',
        color: 'var(--sh-text-primary)',
        margin: 0,
        marginBottom: 'var(--sh-space-half)',
      }}>
        {material.title}
      </p>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        margin: 0,
      }}>
        {typeLabel}{showFile ? ` · ${material.fileName}` : ''}
      </p>
    </div>
  );
}

// Local form helpers — kept in-file to honor the "one-file" constraint.
function FieldLabel({ id, children }) {
  return (
    <p id={id} style={{
      fontSize: 'var(--sh-text-xs)',
      color: 'var(--sh-text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontWeight: 500,
      marginBottom: 'var(--sh-space-2)',
    }}>
      {children}
    </p>
  );
}

function FormActions({ onCancel, onAdd, canAdd }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--sh-space-2)',
      marginTop: 'var(--sh-space-4)',
    }}>
      <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      <Button variant="primary" onClick={onAdd} disabled={!canAdd}>Add</Button>
    </div>
  );
}

const addMaterialInputStyle = {
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
