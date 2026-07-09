import { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { SectionLabel } from './SectionLabel.jsx';

// Excluded-organization detail modal with view/edit toggle.
//
// Draft state is held locally and seeded from the exclusion prop whenever
// the modal opens (or a different exclusion is selected). View mode renders
// the draft values, which means post-save values stay visible without
// requiring the parent to update its activeExclusion reference.
//
// Edits are session-only; the parent holds an overrides map and merges at
// render time. Refresh clears overrides.

// onRemove (E-Write-4, auth-only): when wired (Compliance, authenticated tree),
// the footer carries a destructive "Remove from list" action that opens a nested
// confirm modal (E-Write-2 idiom; the removal is recorded in the audit log).
// writeError surfaces in the confirm modal. Demo tree: no onRemove → the
// existing session-edit flow (Edit button) renders unchanged, byte-identical.
export default function ExclusionDetail({ isOpen, onClose, exclusion, onSave, hasOverride, onRemove, writeError, clearWriteError }) {
  const [mode, setMode] = useState('view');
  const [reasonDraft, setReasonDraft] = useState('');
  const [connectionDraft, setConnectionDraft] = useState('');
  const [connectionDetailDraft, setConnectionDetailDraft] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (isOpen && exclusion) {
      setMode('view');
      setReasonDraft(exclusion.reason);
      setConnectionDraft(exclusion.connection);
      setConnectionDetailDraft(exclusion.connectionDetail);
      setConfirmOpen(false);
      setRemoving(false);
      if (clearWriteError) clearWriteError();
    }
  }, [isOpen, exclusion, clearWriteError]);

  if (!exclusion) return null;

  const handleConfirmRemove = async () => {
    if (removing) return;
    setRemoving(true);
    if (clearWriteError) clearWriteError();
    const ok = await onRemove(exclusion.id);
    if (ok) {
      setConfirmOpen(false);
      onClose();
    } else {
      setRemoving(false);   // writeError surfaces in the confirm modal
    }
  };

  const startEdit = () => setMode('edit');

  const cancelEdit = () => {
    setReasonDraft(exclusion.reason);
    setConnectionDraft(exclusion.connection);
    setConnectionDetailDraft(exclusion.connectionDetail);
    setMode('view');
  };

  const saveEdit = () => {
    onSave({
      ...exclusion,
      reason: reasonDraft,
      connection: connectionDraft,
      connectionDetail: connectionDetailDraft,
    });
    setMode('view');
  };

  const isEdit = mode === 'edit';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={exclusion.name}>
      <p style={einStyle}>EIN: {exclusion.ein}</p>

      <div style={sectionsStyle}>
        {/* Reason */}
        <div>
          <SectionLabel>Reason</SectionLabel>
          {isEdit ? (
            <input
              type="text"
              value={reasonDraft}
              onChange={(e) => setReasonDraft(e.target.value)}
              style={inputStyle}
            />
          ) : (
            <span style={reasonBadgeStyle}>{reasonDraft}</span>
          )}
        </div>

        {/* Connection */}
        <div>
          <SectionLabel>Connection</SectionLabel>
          {isEdit ? (
            <input
              type="text"
              value={connectionDraft}
              onChange={(e) => setConnectionDraft(e.target.value)}
              style={inputStyle}
            />
          ) : (
            <p style={connectionValueStyle}>{connectionDraft}</p>
          )}
        </div>

        {/* Connection detail */}
        <div>
          <SectionLabel>Detail</SectionLabel>
          {isEdit ? (
            <textarea
              value={connectionDetailDraft}
              onChange={(e) => setConnectionDetailDraft(e.target.value)}
              rows={5}
              style={textareaStyle}
            />
          ) : (
            <p style={detailStyle}>{connectionDetailDraft}</p>
          )}
        </div>
      </div>

      {/* Footer. Auth tree (onRemove): destructive "Remove from list" only (no
          edit per Q1). Demo tree: the existing session Edit flow, unchanged. */}
      <div style={footerStyle}>
        {!isEdit && hasOverride && (
          <span style={editedIndicatorStyle}>Edited this session</span>
        )}
        <div style={footerButtonsStyle}>
          {onRemove ? (
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>Remove from list</Button>
          ) : isEdit ? (
            <>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={saveEdit}>Save changes</Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={startEdit}>Edit</Button>
          )}
        </div>
      </div>

      {/* Nested confirm modal (E-Write-4 removal). */}
      {onRemove && (
        <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Remove exclusion">
          <p style={confirmBodyStyle}>
            Remove {exclusion.name} from the exclusion list? This is recorded in the audit log and cannot be undone.
          </p>
          {writeError && <p style={confirmErrorStyle}>{writeError}</p>}
          <div style={confirmFooterStyle}>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleConfirmRemove} disabled={removing}>
              {removing ? 'Removing…' : 'Remove exclusion'}
            </Button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

const confirmBodyStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.65,
  marginTop: 0,
  marginBottom: 'var(--sh-space-4)',
};

const confirmErrorStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-bronze-deep)',
  marginBottom: 'var(--sh-space-3)',
};

const confirmFooterStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--sh-space-2)',
  marginTop: 'var(--sh-space-4)',
  paddingTop: 'var(--sh-space-4)',
  borderTop: 'var(--sh-border-thin)',
};

const einStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  letterSpacing: '0.02em',
  marginTop: 'calc(var(--sh-space-1) * -1)',
  marginBottom: 'var(--sh-space-4)',
};

const sectionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sh-space-4)',
};

const reasonBadgeStyle = {
  display: 'inline-block',
  marginTop: 'var(--sh-space-2)',
  padding: '4px 12px',
  borderRadius: 'var(--sh-radius-full)',
  fontSize: 'var(--sh-text-xs)',
  fontWeight: 500,
  letterSpacing: '0.04em',
  background: 'var(--sh-bronze-tint)',
  color: 'var(--sh-bronze-deep)',
};

const connectionValueStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  marginTop: 'var(--sh-space-2)',
  lineHeight: 1.5,
};

const detailStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  marginTop: 'var(--sh-space-2)',
  lineHeight: 1.65,
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  marginTop: 'var(--sh-space-2)',
  padding: 'var(--sh-space-3)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  fontFamily: 'inherit',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  background: 'var(--sh-card)',
};

const textareaStyle = {
  ...inputStyleBase(),
  resize: 'vertical',
  lineHeight: 1.6,
};

function inputStyleBase() {
  return {
    width: '100%',
    boxSizing: 'border-box',
    marginTop: 'var(--sh-space-2)',
    padding: 'var(--sh-space-3)',
    border: 'var(--sh-border-thin)',
    borderRadius: 'var(--sh-radius-md)',
    fontFamily: 'inherit',
    fontSize: 'var(--sh-text-sm)',
    color: 'var(--sh-text-body)',
    background: 'var(--sh-card)',
  };
}

const footerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--sh-space-3)',
  marginTop: 'var(--sh-space-5)',
  paddingTop: 'var(--sh-space-4)',
  borderTop: 'var(--sh-border-thin)',
};

const footerButtonsStyle = {
  display: 'flex',
  gap: 'var(--sh-space-2)',
  marginLeft: 'auto',
};

const editedIndicatorStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  fontStyle: 'italic',
};
