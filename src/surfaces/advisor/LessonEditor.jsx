import { Children, cloneElement, isValidElement, useId, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { findLesson, getLessonById } from '../../data/content.js';
import { usePracticeContent } from '../../contexts/PracticeContentContext.jsx';
import { useBasePath } from '../../contexts/AppIdentityContext.jsx';

const SCOPE_OPTIONS = [
  { value: 'all',       label: 'General' },
  { value: 'Athletics', label: 'Athletics' },
];

const CATEGORY_OPTIONS = [
  { value: 'primer',   label: 'Primer' },
  { value: 'workflow', label: 'Workflow' },
];

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nextPracticeLessonId(practiceLessons) {
  const max = practiceLessons
    .map((l) => parseInt(l.id.replace(/^pl-/, ''), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0);
  return `pl-${String(max + 1).padStart(3, '0')}`;
}

export default function LessonEditor({ mode }) {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const basePath = useBasePath('/advisor', '/app/advisor');
  const { lessons: practiceLessons, add, update, writeError } = usePracticeContent();

  // Resolve the source lesson by mode.
  //   fork   — must be a base lesson (cannot fork a fork in this prototype)
  //   edit   — must be a practice lesson (cannot edit StewardHouse base content)
  //   author — no source; user composes from a blank form
  const sourceLesson = useMemo(() => {
    if (mode === 'fork') {
      return getLessonById(lessonId) || null;
    }
    if (mode === 'edit') {
      const lesson = findLesson(lessonId, practiceLessons);
      const isPractice = lesson && (lesson.kind === 'fork' || lesson.kind === 'authored');
      return isPractice ? lesson : null;
    }
    return null;
  }, [mode, lessonId, practiceLessons]);

  // Hooks run unconditionally — initialize from source or defaults.
  const [title, setTitle] = useState(sourceLesson?.title ?? '');
  const [minutes, setMinutes] = useState(String(sourceLesson?.minutes ?? 5));
  const [scope, setScope] = useState(sourceLesson?.scope ?? 'all');
  const [category, setCategory] = useState(sourceLesson?.category ?? 'primer');
  const [summary, setSummary] = useState(sourceLesson?.summary ?? '');
  // Shared label-id wiring for the two SegmentedControl fields. FormField's
  // cloneElement guard skips wrapped controls, so we plumb labelledby manually.
  const scopeLabelId = useId();
  const categoryLabelId = useId();
  // ADV-041 — id for the field-level minutes error, used for aria-describedby
  // on the input. Mirrors bundle 5's Documentation section-error a11y pattern
  // (role="alert" + muted-italic typography). canSave/disabled logic is
  // unchanged — this is purely additive feedback.
  const minutesErrorId = useId();
  const titleErrorId = useId(); // Title-field error id — mirrors the ADV-041 minutes pattern.

  // Redirect if a source was required but missing.
  if ((mode === 'fork' || mode === 'edit') && !sourceLesson) {
    return <Navigate to={`${basePath}/curriculum`} replace />;
  }

  const trimmedTitle = title.trim();
  const minutesNum = Number(minutes);
  const titleValid = trimmedTitle.length > 0;
  const minutesValid = Number.isFinite(minutesNum) && minutesNum >= 1;
  const canSave = titleValid && minutesValid;

  const handleSaveWith = async (targetStatus) => {
    if (!canSave) return;
    const today = todayIso();
    const afterSave = (publishedId) => {
      if (targetStatus === 'draft') {
        navigate(`${basePath}/curriculum/drafts`);
      } else {
        navigate(`${basePath}/curriculum/${publishedId}`);
      }
    };
    // P-4: all three branches AWAIT, and navigate only on success.
    //
    // The two `add` branches additionally navigate to the id the SERVER
    // returned, not the client-minted one. `nextPracticeLessonId()` produces a
    // local id (pl-00N) which practice-content.js:136 discards for
    // crypto.randomUUID(), so `afterSave(newId)` sent the advisor to a route
    // LessonDetail could not resolve and <Navigate replace/> bounced them back
    // to the library. The context already returned the saved server object
    // (PracticeContentContext.jsx:66) and the caller was throwing it away.
    //
    // The `edit` branch had a different fault with the same shape: its id was
    // already correct (the lesson exists), but `update` is async and was
    // un-awaited, so a failed PUT still navigated and showed stale content with
    // no error. Not in the original filing; found by reading all three branches.
    //
    // add()/update() return null on failure and set writeError, which now
    // renders below. Returning early leaves the advisor on the form with their
    // input intact.
    if (mode === 'fork') {
      const saved = await add({
        id: nextPracticeLessonId(practiceLessons),
        kind: 'fork',
        baseId: sourceLesson.id,
        status: targetStatus,
        title: trimmedTitle,
        minutes: minutesNum,
        scope,
        category,
        summary: summary.trim(),
        createdAt: today,
        updatedAt: today,
      });
      if (!saved) return;
      afterSave(saved.id);
    } else if (mode === 'edit') {
      const saved = await update(sourceLesson.id, {
        title: trimmedTitle,
        minutes: minutesNum,
        scope,
        category,
        summary: summary.trim(),
        status: targetStatus,
      });
      if (!saved) return;
      afterSave(sourceLesson.id);
    } else if (mode === 'author') {
      const saved = await add({
        id: nextPracticeLessonId(practiceLessons),
        kind: 'authored',
        baseId: null,
        status: targetStatus,
        title: trimmedTitle,
        minutes: minutesNum,
        scope,
        category,
        summary: summary.trim(),
        createdAt: today,
        updatedAt: today,
      });
      if (!saved) return;
      afterSave(saved.id);
    }
  };

  const handleCancel = () => {
    if (sourceLesson) {
      navigate(`${basePath}/curriculum/${sourceLesson.id}`);
    } else {
      navigate(`${basePath}/curriculum`);
    }
  };

  const eyebrow =
    mode === 'fork' ? 'Tailor lesson'
    : mode === 'edit' ? 'Edit lesson'
    : 'Curriculum library';
  const headingText =
    mode === 'fork' ? `Tailoring: ${sourceLesson.title}`
    : mode === 'edit' ? `Editing: ${sourceLesson.title}`
    : 'New lesson';
  const breadcrumbTail =
    mode === 'fork' ? 'Tailor'
    : mode === 'edit' ? 'Edit'
    : 'New';
  const editingDraft = mode === 'edit' && sourceLesson?.status === 'draft';
  const primaryLabel =
    mode === 'fork' ? 'Save tailored version'
    : mode === 'author' ? 'Save lesson'
    : editingDraft ? 'Publish'
    : 'Save changes';
  const showSaveAsDraft = mode === 'fork' || mode === 'author' || editingDraft;
  const invalidReason = !titleValid ? 'Title is required.' : !minutesValid ? 'Length must be one minute or more.' : '';

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
        <Link to={`${basePath}/curriculum`} style={{ color: 'var(--sh-text-muted)', textDecoration: 'none' }}>
          Curriculum library
        </Link>
        {sourceLesson && (
          <>
            {' · '}
            <Link to={`${basePath}/curriculum/${sourceLesson.id}`} style={{ color: 'var(--sh-text-muted)', textDecoration: 'none' }}>
              {sourceLesson.title}
            </Link>
          </>
        )}
        {' · '}
        <span>{breadcrumbTail}</span>
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
          {eyebrow}
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: 'var(--sh-text-primary)',
          marginBottom: 'var(--sh-space-2)',
          lineHeight: 1.3,
        }}>
          {headingText}
        </h1>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-muted)',
          fontStyle: 'italic',
          lineHeight: 1.55,
          maxWidth: '640px',
        }}>
          Forks, authored lessons, and drafts in this prototype are session-only — they will not survive a page refresh.
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
              aria-invalid={!titleValid}
              aria-describedby={!titleValid ? titleErrorId : undefined}
              style={inputStyle}
            />
            {!titleValid && (
              <p id={titleErrorId} role="alert" style={{
                fontSize: 'var(--sh-text-xs)',
                color: 'var(--sh-text-muted)',
                fontStyle: 'italic',
                marginTop: 'var(--sh-space-2)',
              }}>
                Title is required.
              </p>
            )}
          </FormField>

          <FormField label="Length (minutes)">
            <input
              type="number"
              min={1}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              aria-invalid={!minutesValid}
              aria-describedby={!minutesValid ? minutesErrorId : undefined}
              style={{ ...inputStyle, width: '120px' }}
            />
            {!minutesValid && (
              <p id={minutesErrorId} role="alert" style={{
                fontSize: 'var(--sh-text-xs)',
                color: 'var(--sh-text-muted)',
                fontStyle: 'italic',
                marginTop: 'var(--sh-space-2)',
              }}>
                Length must be one minute or more.
              </p>
            )}
          </FormField>

          <FormField label="Scope" labelId={scopeLabelId}>
            <SegmentedControl
              options={SCOPE_OPTIONS}
              value={scope}
              onChange={setScope}
              ariaLabelledBy={scopeLabelId}
            />
          </FormField>

          <FormField label="Category" labelId={categoryLabelId}>
            <SegmentedControl
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={setCategory}
              ariaLabelledBy={categoryLabelId}
            />
          </FormField>

          <FormField label="Summary">
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One or two sentences describing what the lesson covers."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
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
          {/* P-4: server-write failures were silent here. With the advisor
              demo_gate at 0 every curriculum write 403s, and the editor gave no
              indication at all. This is DISTINCT from the invalidReason span
              below, which is client-side field validation; writeError carries
              what the server said. */}
          {writeError && (
            <span role="alert" style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-bronze-deep)',
              lineHeight: 1.5,
              overflowWrap: 'break-word',
            }}>
              {writeError}
            </span>
          )}
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
          {showSaveAsDraft && (
            <Button variant="secondary" onClick={() => handleSaveWith('draft')} disabled={!canSave}>
              Save as draft
            </Button>
          )}
          <Button variant="primary" onClick={() => handleSaveWith('published')} disabled={!canSave}>
            {primaryLabel}
          </Button>
        </div>
      </Card>
    </main>
  );
}

// Local form helpers — duplication of Pipeline.jsx's inline controls, conscious
// per the plan. If a third consumer appears, extract then; not before.

// Mirrors DocCreate.jsx's FormField. Same guard semantics — clone aria onto
// the first native input/textarea/select child; pass everything else through.
// Scope/Category here render <SegmentedControl> which is intentionally NOT
// auto-wired (not a native form control); see HOLD report for the proposed
// labelledby pattern for SegmentedControl.
const NATIVE_FORM_TAGS = new Set(['input', 'textarea', 'select']);

function FormField({ label, required, children, labelId: labelIdProp }) {
  const generatedId = useId();
  const labelId = labelIdProp ?? generatedId;
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

// ariaLabelledBy threads the visible <FormField> label into a programmatic
// group name on the segmented buttons. Behavior is single-select (pick-one),
// but we intentionally keep aria-pressed for now — converting to radiogroup
// semantics would change SR keyboard nav (a separate finding; see commit body).
function SegmentedControl({ options, value, onChange, ariaLabelledBy }) {
  return (
    <div
      role={ariaLabelledBy ? 'group' : undefined}
      aria-labelledby={ariaLabelledBy}
      style={{ display: 'inline-flex', gap: 'var(--sh-space-1)' }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={selected}
            style={{
              background: selected ? 'var(--sh-bronze-tint)' : 'transparent',
              color: selected ? 'var(--sh-bronze-deep)' : 'var(--sh-text-secondary)',
              border: selected ? '1px solid transparent' : 'var(--sh-border-thin)',
              padding: '6px 14px',
              borderRadius: 'var(--sh-radius-full)',
              fontSize: 'var(--sh-text-xs)',
              fontFamily: 'inherit',
              fontWeight: 500,
              letterSpacing: '0.02em',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
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
