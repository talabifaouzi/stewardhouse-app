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

export default function ExclusionDetail({ isOpen, onClose, exclusion, onSave, hasOverride }) {
  const [mode, setMode] = useState('view');
  const [reasonDraft, setReasonDraft] = useState('');
  const [connectionDraft, setConnectionDraft] = useState('');
  const [connectionDetailDraft, setConnectionDetailDraft] = useState('');

  useEffect(() => {
    if (isOpen && exclusion) {
      setMode('view');
      setReasonDraft(exclusion.reason);
      setConnectionDraft(exclusion.connection);
      setConnectionDetailDraft(exclusion.connectionDetail);
    }
  }, [isOpen, exclusion]);

  if (!exclusion) return null;

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

      {/* Footer */}
      <div style={footerStyle}>
        {!isEdit && hasOverride && (
          <span style={editedIndicatorStyle}>Edited this session</span>
        )}
        <div style={footerButtonsStyle}>
          {isEdit ? (
            <>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={saveEdit}>Save changes</Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={startEdit}>Edit</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

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
