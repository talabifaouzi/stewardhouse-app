import { useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { advisorPracticeProfile, stages } from '../../data/clients.js';
import { useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';

// Practice identity is editable inline through the same fold-in seam the
// Chrome + PracticeHome heading read from — on save, we PUT
// /api/practice-profile then call updatePracticeProfile on the context so
// downstream consumers (Chrome header, PracticeHome heading) reflect
// immediately without a /api/me refetch. Demo tree renders the form
// identically but saves LOCAL-only (no fetch fires; matches provider
// discipline — every mutation guarded by if (!isAuthenticated) before
// any network call).
//
// Namespace risk (see functions/api/practice-profile.js docblock): the
// save PUT is allowlisted to {practiceName, advisorTitle, practiceFocus}
// only — demo_gate can NEVER be written from this UI, no matter what a
// caller does with the DevTools console. Fixture fallback fires ONLY on
// the demo tree (isAuthenticated === false); on auth an absent field
// renders as its neutral empty state (never Morgan's fixture).

export default function PracticeSettings() {
  const appIdentity = useOptionalAppIdentity();
  const isAuthenticated = !!appIdentity;
  const identity = appIdentity?.identity ?? null;
  const practiceProfile = identity?.advisor?.practiceProfile ?? null;
  const updatePracticeProfile = appIdentity?.updatePracticeProfile;

  const serverPracticeName = practiceProfile?.practiceName ?? '';
  const serverAdvisorTitle = practiceProfile?.advisorTitle ?? '';
  const serverPracticeFocus = practiceProfile?.practiceFocus ?? '';

  // Session-only overrides used ONLY on the demo tree. On demo, save applies
  // drafts here so the visible values reflect the edit in-session (resets on
  // refresh — matches the provider demo discipline: sync-local, zero fetch,
  // no persistence). On the authenticated tree these stay null and the
  // display reads through to server state (updated via context write-through).
  const [demoOverrides, setDemoOverrides] = useState({
    practiceName: null, advisorTitle: null, practiceFocus: null,
  });

  const displayPracticeName = isAuthenticated
    ? serverPracticeName
    : (demoOverrides.practiceName ?? (serverPracticeName || advisorPracticeProfile.practiceName));
  const displayAdvisorTitle = isAuthenticated
    ? serverAdvisorTitle
    : (demoOverrides.advisorTitle ?? (serverAdvisorTitle || advisorPracticeProfile.advisorTitle));
  const displayPracticeFocus = isAuthenticated
    ? serverPracticeFocus
    : (demoOverrides.practiceFocus ?? (serverPracticeFocus || advisorPracticeProfile.practiceFocus));
  const advisorName = identity?.displayName
    ?? (isAuthenticated ? '' : advisorPracticeProfile.advisorName);

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(displayPracticeName);
  const [draftTitle, setDraftTitle] = useState(displayAdvisorTitle);
  const [draftFocus, setDraftFocus] = useState(displayPracticeFocus);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const openEdit = () => {
    setDraftName(displayPracticeName);
    setDraftTitle(displayAdvisorTitle);
    setDraftFocus(displayPracticeFocus);
    setSaveError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setSaveError(null);
    setEditing(false);
  };

  const save = async () => {
    setSaveError(null);
    // Demo tree: NO fetch. Apply drafts to demoOverrides so the visible
    // values reflect the edit in-session. Refresh drops them back to
    // fixture — matches provider demo discipline (sync-local, zero fetch,
    // no persistence).
    if (!isAuthenticated) {
      setDemoOverrides({
        practiceName: draftName,
        advisorTitle: draftTitle,
        practiceFocus: draftFocus,
      });
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/practice-profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practiceName: draftName,
          advisorTitle: draftTitle,
          practiceFocus: draftFocus,
        }),
      });
      if (!res.ok) {
        let msg = 'Could not save.';
        try { const b = await res.json(); if (b?.error) msg = b.error; } catch {}
        throw new Error(msg);
      }
      const profile = await res.json();
      if (updatePracticeProfile) updatePracticeProfile(profile);
      setEditing(false);
    } catch (err) {
      setSaveError(err.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{
      maxWidth: '880px',
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
          Settings
        </p>
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: 'var(--sh-text-primary)',
        }}>
          Practice settings
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-5)' }}>
        <Card>
          <div style={identityHeaderStyle}>
            <SectionLabel>Practice identity</SectionLabel>
            {!editing && (
              <Button variant="ghost" size="sm" onClick={openEdit}>
                Edit
              </Button>
            )}
          </div>

          {editing ? (
            <>
              <EditRow
                label="Practice name"
                value={draftName}
                onChange={setDraftName}
                placeholder="What your practice is called"
              />
              <DisplayRow label="Principal advisor" value={advisorName} />
              <EditRow
                label="Title"
                value={draftTitle}
                onChange={setDraftTitle}
                placeholder="How you sign your work"
              />
              <EditRow
                label="Practice focus"
                value={draftFocus}
                onChange={setDraftFocus}
                placeholder="A short line about who you work with"
                last
              />

              {saveError && (
                <p role="alert" style={{
                  marginTop: 'var(--sh-space-3)',
                  fontSize: 'var(--sh-text-sm)',
                  color: 'var(--sh-text-error, var(--sh-text-secondary))',
                }}>
                  {saveError}
                </p>
              )}

              <div style={editActionsStyle}>
                <Button variant="ghost" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DisplayRow label="Practice name" value={displayPracticeName} />
              <DisplayRow label="Principal advisor" value={advisorName} />
              <DisplayRow label="Title" value={displayAdvisorTitle} />
              <DisplayRow label="Practice focus" value={displayPracticeFocus} last />
            </>
          )}
        </Card>

        <Card>
          <SectionLabel>Stage labels</SectionLabel>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-muted)',
            marginBottom: 'var(--sh-space-4)',
          }}>
            Rename if your practice uses different stage language. Renaming applies across your roster.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {stages.map((stage, i) => (
              <DisplayRow
                key={stage}
                label={`Stage ${i + 1}`}
                value={stage}
                last={i === stages.length - 1}
                action={<Button variant="ghost" size="sm">Rename</Button>}
              />
            ))}
          </div>
        </Card>

        <Card>
          <SectionLabel>Working preferences</SectionLabel>
          <DisplayRow label="Default session length" value="45 minutes" />
          <DisplayRow label="Time zone" value="America/New_York" />
          <DisplayRow label="Notification preferences" value="Quiet by default" last />
        </Card>

        <Card tint>
          <SectionLabel>Boundaries (read-only)</SectionLabel>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            lineHeight: 1.6,
            marginBottom: 'var(--sh-space-3)',
          }}>
            StewardHouse is a structural platform. It does not provide advisory acts (specific recommendations
            on giving), fiduciary execution (custody, payment, transfers), or financial, legal, or compliance advice.
            These boundaries apply across all surfaces and cannot be configured.
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            fontStyle: 'italic',
          }}>
            Path B boundary · v1.0
          </p>
        </Card>
      </div>
    </main>
  );
}

const identityHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 'var(--sh-space-3)',
  marginBottom: 'var(--sh-space-2)',
  flexWrap: 'wrap',
};

const editActionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--sh-space-2)',
  marginTop: 'var(--sh-space-4)',
  flexWrap: 'wrap',
};

const rowBaseStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--sh-space-4)',
  padding: 'var(--sh-space-3) 0',
  flexWrap: 'wrap',
};

function DisplayRow({ label, value, last, action }) {
  return (
    <div style={{
      ...rowBaseStyle,
      borderBottom: last ? 'none' : 'var(--sh-border-divider)',
    }}>
      <div style={{ minWidth: '160px' }}>
        <p style={rowLabelStyle}>{label}</p>
      </div>
      <p style={{
        flex: 1,
        minWidth: '180px',
        fontSize: 'var(--sh-text-sm)',
        color: value ? 'var(--sh-text-primary)' : 'var(--sh-text-muted)',
        fontStyle: value ? 'normal' : 'italic',
      }}>
        {value || 'Not set'}
      </p>
      {action}
    </div>
  );
}

function EditRow({ label, value, onChange, placeholder, last }) {
  return (
    <div style={{
      ...rowBaseStyle,
      borderBottom: last ? 'none' : 'var(--sh-border-divider)',
    }}>
      <div style={{ minWidth: '160px' }}>
        <label style={rowLabelStyle}>{label}</label>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          minWidth: '180px',
          padding: 'var(--sh-space-2) var(--sh-space-3)',
          border: 'var(--sh-border-thin)',
          borderRadius: 'var(--sh-radius-md)',
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-primary)',
          background: 'var(--sh-card)',
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
}

const rowLabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 'var(--sh-space-half)',
};
