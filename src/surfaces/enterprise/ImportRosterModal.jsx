import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Modal } from '../../components/Modal.jsx';
import { Button } from '../../components/Button.jsx';
import { parseRoster, suggestMapping, toPayloadRows, MAX_IMPORT_ROWS, SHAPE_SPLIT, SHAPE_SINGLE, SHAPE_KEYS } from './shared/parseRoster.js';
import SegmentedControl from '../../components/SegmentedControl.jsx';
import { readRosterFile, fileFromDrop, ACCEPT_ATTR } from './shared/readRosterFile.js';

// Roster import, client half (roster-import arc). Authenticated tree only, the
// same gating as AddAthleteModal: EnterpriseRoster renders it behind
// isAuthenticated and the endpoint is E11-gated behind that.
//
// TWO-PHASE, WHICH NOTHING ELSE IN THIS TREE DOES. Every other write here is
// one form and one submit. Paste-then-map-then-confirm needs an intermediate
// state because the operator cannot say which column is which until the paste
// has been read. The phases live as a `step` inside ONE modal rather than as
// stacked modals: it is one task, the operator can move backwards through it
// without losing work, and a modal stack would pull in ModalStackContext for
// nothing. Every step's state is kept on the way forward and on the way back,
// so a rejected import can be repaired by changing the mapping OR the paste
// without re-pasting.
//
// IT NEVER GUESSES A MAPPING. suggestMapping pre-selects a DEFAULT from the
// header labels, and the operator sees every dropdown for the declared shape
// with a live example drawn from their own first data row before anything is
// submitted. Submit stays disabled until all of them are chosen.
//
// THE OPERATOR DECLARES THE NAME SHAPE. A toggle above the dropdowns switches
// the target set between (First name, Last name, Email) and (Name, Email).
// Nothing is inferred from the header or from which fields happen to be
// mapped, and NO SPLITTER EXISTS at any layer: a single Name cell is stored
// exactly as written, and two halves are joined server-side. The shape is a UI
// declaration only and is never transmitted; the endpoint keys its own
// allowlist on which keys a row actually carries.
//
// C-1 DISCARD is structural here rather than enforced: only the mapped columns
// are ever read, so a roster's Sport / Class / Jersey columns are not dropped
// so much as never carried. The endpoint rejects them if they ever arrive.
//
// NO PREVIEW GRID, deliberately. A columns-by-rows preview is the obvious way
// to show a parsed paste and it is the wrong one at 320px wide, where the modal
// body is about 262px: any real roster overflows and the operator scrolls a
// grid sideways to answer a question the dropdowns answer directly. The live
// example under each select is the same information without the overflow.
//
// THREE EQUAL WAYS IN (INPUT SHAPE AMENDED 2026-08-27): drop a file, pick a
// file, or paste. All three end at the same place, a string in `text`, which
// the existing parser consumes unchanged.
//
// MOBILE IS AN APP, NOT A NARROW DESKTOP WINDOW. Drag-and-drop does not exist
// on touch, so on touch the drop zone is NOT rendered at all: it is not
// de-emphasised, it is absent, because a target you cannot drag onto is
// furniture. The picker becomes the primary control, a full-width size="lg"
// button held to the §7 44px standard, sitting near the top where a thumb
// reaches it. Paste moves BELOW it behind a disclosure, because pasting
// hundreds of rows on a phone is not a real workflow and should not be the
// first thing the screen offers. The switch is a CAPABILITY query,
// (hover: none) and (pointer: coarse), not a width breakpoint: a narrow desktop
// window can still drag, and a large tablet still cannot.

const STEP_PASTE = 'paste';
const STEP_MAP = 'map';

// Shape-dependent, so the example never contradicts the toggle the operator
// just set. Tab-separated, because that is what a spreadsheet range copy
// produces and the sniffer will read it as such.
const PASTE_PLACEHOLDERS = {
  [SHAPE_SPLIT]: 'First Name\tLast Name\tEmail\nMarcus\tThompson\tmarcus@school.edu',
  [SHAPE_SINGLE]: 'Full Name\tEmail\nMarcus Thompson\tmarcus@school.edu',
};

// Target LABELS. The key order per shape lives in SHAPE_KEYS (parseRoster.js),
// which is the single source the reset sites, allMapped and toPayloadRows all
// follow; this map only supplies the visible label for each key.
const FIELD_LABELS = {
  firstName: 'First name',
  lastName: 'Last name',
  name: 'Name',
  email: 'Email',
};

const SHAPE_OPTIONS = [
  { value: SHAPE_SPLIT, label: 'First and last name' },
  { value: SHAPE_SINGLE, label: 'One name column' },
];

// An all-null mapping for a shape, used at every reset site.
const emptyMapping = (shape) => Object.fromEntries(SHAPE_KEYS[shape].map((k) => [k, null]));

export default function ImportRosterModal({ isOpen, onClose, onStage, writeError, clearWriteError }) {
  const [step, setStep] = useState(STEP_PASTE);
  const [text, setText] = useState('');
  const [hasHeader, setHasHeader] = useState(true);
  const [shape, setShape] = useState(SHAPE_SPLIT);
  const [mapping, setMapping] = useState(() => emptyMapping(SHAPE_SPLIT));
  const [fileName, setFileName] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [fileNotes, setFileNotes] = useState([]);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const fileInputRef = useRef(null);
  // dragenter/dragleave fire for EVERY child element under the pointer, so a
  // boolean flickers off the moment the cursor crosses the zone's own text. A
  // depth counter is the standard fix: only the outermost leave clears it.
  const dragDepth = useRef(0);

  // CAPABILITY, not width. Read once on open; a device does not grow a mouse
  // mid-session, and re-querying on resize would flip the layout when a
  // desktop window is merely narrowed.
  const [isTouch] = useState(() => (
    typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(hover: none) and (pointer: coarse)').matches
  ));

  useEffect(() => {
    if (isOpen) {
      setStep(STEP_PASTE);
      setText('');
      setHasHeader(true);
      setShape(SHAPE_SPLIT);
      setMapping(emptyMapping(SHAPE_SPLIT));
      setFileName(null);
      setFileError(null);
      setFileNotes([]);
      setReading(false);
      setDragging(false);
      dragDepth.current = 0;
      setShowPaste(false);
      clearWriteError();
    }
  }, [isOpen, clearWriteError]);

  // A file dropped ANYWHERE other than the zone would otherwise make the
  // browser navigate away from the app and open it, losing the operator's work
  // with no warning. Suppressed for as long as the modal is open, and only
  // then, so the rest of the app keeps default behaviour.
  useEffect(() => {
    if (!isOpen) return undefined;
    const swallow = (e) => { e.preventDefault(); };
    window.addEventListener('dragover', swallow);
    window.addEventListener('drop', swallow);
    return () => {
      window.removeEventListener('dragover', swallow);
      window.removeEventListener('drop', swallow);
    };
  }, [isOpen]);

  // Re-parsed whenever the paste or the header toggle changes, so flipping
  // "First row is a header" re-reads immediately rather than on a re-submit.
  const parsed = useMemo(
    () => (text.trim() === '' ? null : parseRoster(text, { hasHeader })),
    [text, hasHeader],
  );

  const rowCount = parsed ? parsed.rows.length : 0;
  const overCap = rowCount > MAX_IMPORT_ROWS;

  // The single funnel every input path ends in: a File becomes a string, and
  // that string becomes `text`, which is exactly what a paste sets. Nothing
  // downstream can tell the two apart.
  const acceptFile = useCallback(async (file) => {
    setFileError(null);
    setFileNotes([]);
    setReading(true);
    const result = await readRosterFile(file);
    setReading(false);
    if (!result.ok) {
      setFileError(result.error);
      setFileName(null);
      return;
    }
    setFileName(file.name);
    setFileNotes(result.notes || []);
    setText(result.text);
    setShowPaste(false);
  }, []);

  const onDragEnter = (e) => {
    e.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  // Without preventDefault on dragover the drop event never fires at all: the
  // default action is "this element is not a drop target".
  const onDragOver = (e) => { e.preventDefault(); };
  const onDrop = (e) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const picked = fileFromDrop(e.dataTransfer);
    if (picked.error) { setFileError(picked.error); setFileName(null); return; }
    acceptFile(picked.file);
  };

  const handleRead = () => {
    if (!parsed || rowCount === 0) return;
    setMapping(suggestMapping(parsed.header, shape));
    clearWriteError();
    setStep(STEP_MAP);
  };

  // FLIP BEHAVIOUR, chosen deliberately: the EMAIL choice is PRESERVED and the
  // name target(s) are CLEARED. Email is the one target both shapes share, and
  // it means the same column either way, so discarding it would throw away work
  // the flip did not invalidate. The name targets cannot transfer without
  // inferring something: carrying a single Name column over to First name would
  // assert the cell holds a first name, and carrying First name over to Name
  // would assert a half is the whole. Both are the guess this arc refuses, so
  // the operator re-chooses. suggestMapping is deliberately NOT re-run on flip:
  // a flip is the operator correcting an assumption, and re-proposing from the
  // same heuristic they just overrode is the wrong response to a correction.
  const onShapeChange = (next) => {
    if (next === shape) return;
    setShape(next);
    setMapping({ ...emptyMapping(next), email: mapping.email });
  };

  const targetKeys = SHAPE_KEYS[shape];
  const chosen = targetKeys.map((k) => mapping[k]).filter((v) => v != null);
  const duplicateColumn = new Set(chosen).size !== chosen.length;
  const allMapped = chosen.length === targetKeys.length;
  const canSubmit = allMapped && !duplicateColumn && !overCap && rowCount > 0;

  // REVIEW BEFORE SAVE (ruled 2026-08-27). This no longer writes anything. The
  // mapped rows are STAGED into provider state as uncommitted rows and the modal
  // closes, putting the operator in the roster table where the review happens.
  // The save is theirs to make from the review bar; nothing reaches D1 until
  // they press it, and the import endpoint's rejected[] surfaces there instead.
  const handleSubmit = () => {
    if (!canSubmit) return;
    clearWriteError();
    onStage(toPayloadRows(parsed.rows, mapping, shape));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import roster">
      {step === STEP_PASTE && (
        <>
          <p style={leadStyle}>
            {isTouch
              ? 'Choose a roster file from your device. CSV, Excel and plain text all work.'
              : 'Drop a roster file here, choose one from your drive, or paste the rows. CSV, TSV, plain text and Excel all work.'}
          </p>

          {/* Shared by both layouts and never visible: the visible controls
              below drive it. */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ATTR}
            onChange={(e) => {
              const f = e.target.files && e.target.files[0];
              // Cleared first so re-picking the SAME file fires change again.
              e.target.value = '';
              if (f) acceptFile(f);
            }}
            style={hiddenInputStyle}
            tabIndex={-1}
            aria-hidden="true"
          />

          {isTouch ? (
            /* TOUCH: the picker IS the interface. Full-width, size="lg" (the
               §7 touch-primary size, held to 44px), directly under the lead.
               No drop zone: it would be inert furniture. */
            <Button
              variant="primary"
              size="lg"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={touchPickerStyle}
            >
              {reading ? 'Reading…' : 'Choose a file'}
            </Button>
          ) : (
            <div
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (fileInputRef.current) fileInputRef.current.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Drop a roster file here, or choose one from your drive"
              style={dragging ? dropZoneActiveStyle : dropZoneStyle}
            >
              <p style={dropHeadStyle}>
                {reading ? 'Reading…' : dragging ? 'Drop to read it' : 'Drop a roster file here'}
              </p>
              <p style={dropSubStyle}>or click to choose one from your drive</p>
            </div>
          )}

          {fileName && !fileError && (
            <p style={fileNameStyle}>Read <strong style={lineRefStyle}>{fileName}</strong>.</p>
          )}
          {fileError && <p style={warnStyle}>{fileError}</p>}
          {fileNotes.map((n, i) => <p key={i} style={noteStyle}>{n}</p>)}

          {/* PASTE. Collapsed below the picker on touch, open beneath the drop
              zone on pointer. An equal path, not a fallback, but not the first
              thing a phone should offer. */}
          {isTouch && !showPaste && (
            <button type="button" onClick={() => setShowPaste(true)} style={disclosureStyle}>
              Or paste rows instead
            </button>
          )}
          {(!isTouch || showPaste) && (
            <>
              {isTouch && <p style={labelStyle}>Paste rows</p>}
              <textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setFileName(null); setFileNotes([]); setFileError(null); }}
                placeholder={PASTE_PLACEHOLDERS[shape]}
                rows={isTouch ? 6 : 10}
                style={textareaStyle}
                aria-label="Paste roster rows"
              />
            </>
          )}

          {parsed && (
            <p style={metaStyle}>
              {rowCount} row{rowCount === 1 ? '' : 's'} read, {parsed.delimiterName}-separated
              {parsed.blankLines > 0 && `, ${parsed.blankLines} blank line${parsed.blankLines === 1 ? '' : 's'} skipped`}.
            </p>
          )}
          <div style={footerStyle}>
            <Button variant="ghost" size={isTouch ? 'lg' : 'sm'} onClick={onClose}>Cancel</Button>
            <Button variant="primary" size={isTouch ? 'lg' : 'sm'} onClick={handleRead} disabled={rowCount === 0 || reading}>Continue</Button>
          </div>
        </>
      )}

      {step === STEP_MAP && parsed && (
        <>
          <p style={leadStyle}>
            {rowCount} row{rowCount === 1 ? '' : 's'}, {parsed.delimiterName}-separated. Confirm
            which column holds each field.
          </p>

          <label style={checkLabelStyle}>
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => { setHasHeader(e.target.checked); setMapping(emptyMapping(shape)); }}
              style={checkboxStyle}
            />
            <span>The first row is a header, not an athlete</span>
          </label>

          {/* SHAPE TOGGLE. The operator DECLARES how their file holds names; the
              importer never infers it from the header, and no splitter exists
              behind either choice. Sits ABOVE the dropdowns because it decides
              which dropdowns there are. */}
          <div style={fieldBlockStyle}>
            <p id="import-shape-label" style={labelStyle}>How does this file hold names?</p>
            <SegmentedControl
              options={SHAPE_OPTIONS}
              value={shape}
              onChange={onShapeChange}
              ariaLabelledBy="import-shape-label"
            />
            <p style={exampleStyle}>
              {shape === SHAPE_SINGLE
                ? 'One column holds the whole name. It is stored exactly as written.'
                : 'Two columns, joined with a single space when the athlete is saved.'}
            </p>
          </div>

          {targetKeys.map((key) => {
            const f = { key, label: FIELD_LABELS[key] };
            const idx = mapping[f.key];
            const example = idx != null && parsed.rows[0] ? parsed.rows[0].fields[idx] : '';
            return (
              <div key={f.key} style={fieldBlockStyle}>
                <label style={labelStyle} htmlFor={`map-${f.key}`}>
                  {f.label}<span style={requiredStyle}> *</span>
                </label>
                <select
                  id={`map-${f.key}`}
                  value={idx == null ? '' : String(idx)}
                  onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value === '' ? null : Number(e.target.value) }))}
                  style={selectStyle}
                >
                  <option value="">Choose a column…</option>
                  {parsed.header.map((h, i) => (
                    <option key={i} value={i}>{h === '' ? `Column ${i + 1}` : h}</option>
                  ))}
                </select>
                <p style={exampleStyle}>
                  {idx == null
                    ? 'Not chosen yet.'
                    : (example === '' ? 'First row is empty in this column.' : `First row: ${example}`)}
                </p>
              </div>
            );
          })}

          {duplicateColumn && (
            <p style={warnStyle}>Each field needs its own column. Two fields are pointing at the same one.</p>
          )}

          {parsed.ragged.length > 0 && (
            <p style={warnStyle}>
              {parsed.ragged.length} row{parsed.ragged.length === 1 ? ' has' : 's have'} a different
              number of columns than the header (line{parsed.ragged.length === 1 ? '' : 's'}{' '}
              {parsed.ragged.slice(0, 10).map((r) => r.line).join(', ')}
              {parsed.ragged.length > 10 && `, and ${parsed.ragged.length - 10} more`}).
              Nothing was dropped, but a missing field will be refused on import.
            </p>
          )}

          {overCap && (
            <p style={warnStyle}>
              {rowCount} rows is over the {MAX_IMPORT_ROWS}-row limit for one import.
              Split the roster and import it in parts.
            </p>
          )}

          {writeError && <p style={errorStyle}>{writeError}</p>}

          <div style={footerStyle}>
            <Button variant="ghost" size="sm" onClick={() => setStep(STEP_PASTE)}>Back</Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!canSubmit}>
              {`Review ${rowCount} athlete${rowCount === 1 ? '' : 's'}`}
            </Button>
          </div>
        </>
      )}

    </Modal>
  );
}

// Visually hidden rather than display:none: a display:none input cannot be
// clicked programmatically in some engines.
const hiddenInputStyle = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  opacity: 0,
  pointerEvents: 'none',
};

// TOUCH PICKER. Full width of the modal body, which at a 320px viewport is
// about 262px (panel min(600, 100vw-32) = 288, less 12.8px body padding each
// side). size="lg" carries the §7 44px minHeight, so this clears the locked
// tap-target standard with the whole row as the target.
const touchPickerStyle = {
  width: '100%',
  justifyContent: 'center',
  marginBottom: 'var(--sh-space-4)',
};

const dropZoneBase = {
  border: '1px dashed var(--sh-card-border)',
  borderRadius: 'var(--sh-radius-md)',
  padding: 'var(--sh-space-6) var(--sh-space-4)',
  textAlign: 'center',
  cursor: 'pointer',
  marginBottom: 'var(--sh-space-4)',
  transition: 'background 120ms ease, border-color 120ms ease',
};

const dropZoneStyle = { ...dropZoneBase, background: 'var(--sh-bg-tint)' };

// Hover state on drag. Bronze border + a slightly stronger tint: the same
// accent the rest of the surface uses for an active affordance, so it reads as
// armed rather than as an error.
const dropZoneActiveStyle = {
  ...dropZoneBase,
  background: 'var(--sh-card)',
  borderColor: 'var(--sh-bronze)',
  borderStyle: 'solid',
};

const dropHeadStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  fontWeight: 500,
  margin: 0,
};

const dropSubStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  marginTop: 'var(--sh-space-1)',
  marginBottom: 0,
};

const fileNameStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  marginTop: 0,
  marginBottom: 'var(--sh-space-3)',
  overflowWrap: 'anywhere',
};

const noteStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  lineHeight: 1.5,
  marginTop: 0,
  marginBottom: 'var(--sh-space-3)',
  overflowWrap: 'anywhere',
};

// Text-button disclosure. 44px minHeight so the touch-only control clears the
// §7 standard even though it is not a Button.
const disclosureStyle = {
  display: 'block',
  width: '100%',
  minHeight: '44px',
  background: 'none',
  border: 'none',
  padding: 'var(--sh-space-2) 0',
  fontFamily: 'inherit',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-bronze-deep)',
  textAlign: 'left',
  cursor: 'pointer',
};

const leadStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 0,
  marginBottom: 'var(--sh-space-4)',
};

const textareaStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 'var(--sh-space-3)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  background: 'var(--sh-card)',
  resize: 'vertical',
};

const metaStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  marginTop: 'var(--sh-space-2)',
  marginBottom: 0,
};

const fieldBlockStyle = { marginBottom: 'var(--sh-space-4)' };

const labelStyle = {
  display: 'block',
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 500,
  marginBottom: 'var(--sh-space-2)',
};

const requiredStyle = { color: 'var(--sh-bronze)' };

const selectStyle = {
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

const exampleStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  marginTop: 'var(--sh-space-1)',
  marginBottom: 0,
  overflowWrap: 'anywhere',
};

const checkLabelStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--sh-space-2)',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.5,
  cursor: 'pointer',
  marginBottom: 'var(--sh-space-4)',
};

const checkboxStyle = {
  marginTop: '3px',
  accentColor: 'var(--sh-bronze)',
  flexShrink: 0,
  cursor: 'pointer',
};

const warnStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-warning-text)',
  lineHeight: 1.6,
  padding: 'var(--sh-space-3) var(--sh-space-4)',
  background: 'var(--sh-warning-bg)',
  border: '1px solid var(--sh-warning-border)',
  borderRadius: 'var(--sh-radius-md)',
  marginTop: 0,
  marginBottom: 'var(--sh-space-3)',
  overflowWrap: 'anywhere',
};

const errorStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-bronze-deep)',
  marginBottom: 'var(--sh-space-3)',
  overflowWrap: 'anywhere',
};

const lineRefStyle = { color: 'var(--sh-text-body)', fontWeight: 500 };

const footerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  gap: 'var(--sh-space-2)',
  marginTop: 'var(--sh-space-5)',
  paddingTop: 'var(--sh-space-4)',
  borderTop: 'var(--sh-border-thin)',
};
