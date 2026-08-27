import { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/Modal.jsx';
import { Button } from '../../components/Button.jsx';
import { parseRoster, suggestMapping, toPayloadRows, MAX_IMPORT_ROWS } from './shared/parseRoster.js';

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
// header labels, and the operator sees all three dropdowns with a live example
// drawn from their own first data row before anything is submitted. Submit
// stays disabled until all three are chosen.
//
// C-1 DISCARD is structural here rather than enforced: only the three mapped
// columns are ever read, so a roster's Sport / Class / Jersey columns are not
// dropped so much as never carried. The endpoint rejects them if they ever
// arrive.
//
// NO PREVIEW GRID, deliberately. A columns-by-rows preview is the obvious way
// to show a parsed paste and it is the wrong one at 320px wide, where the modal
// body is about 262px: any real roster overflows and the operator scrolls a
// grid sideways to answer a question the dropdowns answer directly. The live
// example under each select is the same information without the overflow.

const STEP_PASTE = 'paste';
const STEP_MAP = 'map';
const STEP_DONE = 'done';

const FIELDS = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'email', label: 'Email' },
];

export default function ImportRosterModal({ isOpen, onClose, onImport, writeError, clearWriteError }) {
  const [step, setStep] = useState(STEP_PASTE);
  const [text, setText] = useState('');
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState({ firstName: null, lastName: null, email: null });
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep(STEP_PASTE);
      setText('');
      setHasHeader(true);
      setMapping({ firstName: null, lastName: null, email: null });
      setSubmitting(false);
      setOutcome(null);
      clearWriteError();
    }
  }, [isOpen, clearWriteError]);

  // Re-parsed whenever the paste or the header toggle changes, so flipping
  // "First row is a header" re-reads immediately rather than on a re-submit.
  const parsed = useMemo(
    () => (text.trim() === '' ? null : parseRoster(text, { hasHeader })),
    [text, hasHeader],
  );

  const rowCount = parsed ? parsed.rows.length : 0;
  const overCap = rowCount > MAX_IMPORT_ROWS;

  const handleRead = () => {
    if (!parsed || rowCount === 0) return;
    setMapping(suggestMapping(parsed.header));
    clearWriteError();
    setStep(STEP_MAP);
  };

  const chosen = FIELDS.map((f) => mapping[f.key]).filter((v) => v != null);
  const duplicateColumn = new Set(chosen).size !== chosen.length;
  const allMapped = chosen.length === FIELDS.length;
  const canSubmit = allMapped && !duplicateColumn && !overCap && rowCount > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    clearWriteError();
    const result = await onImport(toPayloadRows(parsed.rows, mapping));
    setSubmitting(false);
    if (!result) return;                       // network-level failure; writeError renders below
    setOutcome(result);
    if (result.ok) setStep(STEP_DONE);
    else setStep(STEP_DONE);                   // rejections render in the same place
  };

  // The client did the parsing, so the client owns mapping the endpoint's
  // array indices back to the operator's pasted lines.
  const lineFor = (index) => (parsed && parsed.rows[index] ? parsed.rows[index].line : null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import roster">
      {step === STEP_PASTE && (
        <>
          <p style={leadStyle}>
            Copy the rows from your spreadsheet and paste them below. Tab-separated and
            comma-separated both work; you&rsquo;ll choose which column is which on the next step.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'First Name\tLast Name\tEmail\nMarcus\tThompson\tmarcus@school.edu'}
            rows={10}
            style={textareaStyle}
            aria-label="Paste roster rows"
          />
          {parsed && (
            <p style={metaStyle}>
              {rowCount} row{rowCount === 1 ? '' : 's'} read, {parsed.delimiterName}-separated
              {parsed.blankLines > 0 && `, ${parsed.blankLines} blank line${parsed.blankLines === 1 ? '' : 's'} skipped`}.
            </p>
          )}
          <div style={footerStyle}>
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleRead} disabled={rowCount === 0}>Continue</Button>
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
              onChange={(e) => { setHasHeader(e.target.checked); setMapping({ firstName: null, lastName: null, email: null }); }}
              style={checkboxStyle}
            />
            <span>The first row is a header, not an athlete</span>
          </label>

          {FIELDS.map((f) => {
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
              {submitting ? 'Importing…' : `Import ${rowCount} athlete${rowCount === 1 ? '' : 's'}`}
            </Button>
          </div>
        </>
      )}

      {step === STEP_DONE && outcome && outcome.ok && (
        <>
          <p style={leadStyle}>
            {outcome.imported} athlete{outcome.imported === 1 ? '' : 's'} imported. They sit at
            &ldquo;Not yet invited&rdquo; until you invite them.
          </p>

          {outcome.matches && outcome.matches.onRoster.length > 0 && (
            <div style={noticeStyle}>
              <p style={noticeHeadStyle}>Some rows look like athletes already on your roster</p>
              <ul style={listStyle}>
                {outcome.matches.onRoster.slice(0, 25).map((m, i) => (
                  <li key={i} style={listItemStyle}>
                    Line {lineFor(m.index)} shares {m.matchedOn === 'email' ? 'an email' : 'a name'} with {m.athleteName}
                  </li>
                ))}
              </ul>
              {outcome.matches.onRoster.length > 25 && (
                <p style={noticeFootStyle}>and {outcome.matches.onRoster.length - 25} more.</p>
              )}
              <p style={noticeFootStyle}>
                They were imported. Two athletes can share a name or an address, so this is
                shown rather than decided.
              </p>
            </div>
          )}

          {outcome.matches && outcome.matches.withinPaste.length > 0 && (
            <div style={noticeStyle}>
              <p style={noticeHeadStyle}>Some pasted rows repeat each other</p>
              <ul style={listStyle}>
                {outcome.matches.withinPaste.slice(0, 25).map((m, i) => (
                  <li key={i} style={listItemStyle}>
                    Lines {m.indexes.map(lineFor).join(', ')} share {m.matchedOn === 'email' ? 'an email' : 'a name'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={footerStyle}>
            <Button variant="primary" size="sm" onClick={onClose}>Done</Button>
          </div>
        </>
      )}

      {step === STEP_DONE && outcome && !outcome.ok && (
        <>
          <p style={errorLeadStyle}>{writeError || 'No athletes were imported.'}</p>
          {outcome.rejected && outcome.rejected.length > 0 && (
            <ul style={listStyle}>
              {outcome.rejected.slice(0, 50).map((r, i) => (
                <li key={i} style={listItemStyle}>
                  <strong style={lineRefStyle}>Line {lineFor(r.index)}</strong>: {r.reason}
                </li>
              ))}
              {outcome.rejected.length > 50 && (
                <li style={listItemStyle}>and {outcome.rejected.length - 50} more.</li>
              )}
            </ul>
          )}
          <div style={footerStyle}>
            <Button variant="ghost" size="sm" onClick={() => setStep(STEP_PASTE)}>Edit paste</Button>
            <Button variant="primary" size="sm" onClick={() => setStep(STEP_MAP)}>Change mapping</Button>
          </div>
        </>
      )}
    </Modal>
  );
}

const leadStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  marginTop: 0,
  marginBottom: 'var(--sh-space-4)',
};

const errorLeadStyle = { ...leadStyle, color: 'var(--sh-bronze-deep)' };

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

const noticeStyle = {
  marginBottom: 'var(--sh-space-4)',
  padding: 'var(--sh-space-3) var(--sh-space-4)',
  background: 'var(--sh-bg-tint)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
};

const noticeHeadStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  fontWeight: 500,
  marginTop: 0,
  marginBottom: 'var(--sh-space-2)',
};

const noticeFootStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  lineHeight: 1.5,
  marginTop: 'var(--sh-space-2)',
  marginBottom: 0,
};

const listStyle = {
  margin: 0,
  paddingLeft: 'var(--sh-space-4)',
  listStyle: 'disc',
};

const listItemStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
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
