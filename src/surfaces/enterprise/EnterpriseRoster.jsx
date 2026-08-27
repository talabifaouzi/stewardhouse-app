import { useState } from 'react';
import { Card } from '../../components/Card.jsx';
import StatTile from '../../components/StatTile.jsx';
import FilteredAthletesModal from '../../components/FilteredAthletesModal.jsx';
import AthleteProfile from '../../components/AthleteProfile.jsx';
import DataTable from '../../components/DataTable.jsx';
import { Button } from '../../components/Button.jsx';
import { Modal } from '../../components/Modal.jsx';
import { useComms } from '../../contexts/CommsContext.jsx';
import { useAthletes } from '../../contexts/AthletesContext.jsx';
import { useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { useInstitutionEyebrow } from './shared/useInstitutionEyebrow.js';
import { formatDate } from '../../utils/formatDate.js';
import { computeStats } from './shared/enterpriseStats.js';
import RateDisclosure from './shared/RateDisclosure.jsx';
import { statusFor, STATUS_ORDER, accessLabel, ACCESS_ORDER, YEAR_ORDER } from './shared/athleteStatus.js';
import { CATEGORY_CONFIG, buildModalTitle } from './shared/categoryFilters.js';
import AddAthleteModal from './AddAthleteModal.jsx';
import ImportRosterModal from './ImportRosterModal.jsx';

// sortValue makes a column sortable; its absence makes it not (DataTable's
// opt-in contract). Gifts and Last Active deliberately have none: nothing writes
// either column, so every value is identical and a sort affordance on them would
// assert there is something to sort (SORTING RULED 2026-08-27).
//
// Dates sort on the raw ISO string, not the rendered short form: ISO is
// lexicographically ordered and "3/4/26" is not. A date is null unless the
// corresponding boolean says it happened, which matches what the cell renders.
const ROSTER_COLUMNS = [
  { key: 'name',       label: 'Name',        render: (a) => a.name,   sortValue: (a) => a.name },
  { key: 'sport',      label: 'Sport',       render: (a) => a.sport,  sortValue: (a) => a.sport ?? null },
  { key: 'year',       label: 'Year',        render: (a) => a.year,   sortValue: (a) => YEAR_ORDER[a.year] ?? null },
  { key: 'status',     label: 'Status',      render: (a) => statusFor(a), sortValue: (a) => STATUS_ORDER[statusFor(a)] ?? null },
  { key: 'gps',        label: 'GPS',         render: (a) => (a.gpsCompleted ? formatDate(a.gpsDate) : '—'), sortValue: (a) => (a.gpsCompleted ? (a.gpsDate ?? null) : null) },
  { key: 'lessons',    label: 'Lessons',     render: (a) => a.lessons, sortValue: (a) => a.lessons },
  { key: 'gifts',      label: 'Gifts',       render: (a) => a.gifts },
  { key: 'lastActive', label: 'Last Active', render: (a) => a.lastActive },
  { key: 'certified',  label: 'Certified',   render: (a) => (a.certified ? formatDate(a.certDate) : '—'), sortValue: (a) => (a.certified ? (a.certDate ?? null) : null) },
];

// Access column (C-3b) — claim/consent state, plain text. AUTHENTICATED-ONLY:
// `claimed` is a live boolean present only on /api/me roster elements; the demo
// fixtures don't carry it, so surfacing this on the demo tree would falsely
// read every demonstrative athlete as "Unclaimed" (a false live-signal, against
// the demonstrative/LIVE honesty boundary). Inserted after Status on the auth
// tree only; the demo tree renders ROSTER_COLUMNS byte-identical.
const ACCESS_COLUMN = {
  key: 'access',
  label: 'Access',
  render: (a) => accessLabel(a),
  sortValue: (a) => ACCESS_ORDER[accessLabel(a)] ?? null,
};

// FORK 3 (P-2): athlete.gifts_count is written by no path, so every auth cell
// would read a frozen 0 — a measurement that was never taken. The column is
// KEPT (its return is a live-data question, not a schema one) and rendered as
// the table's existing "—" convention, explained by one caption under the
// table rather than repeated down every row. Gated on isAuthenticated, not
// consentAware: the counter is unsourced for every athlete, claimed or not.
const AUTH_GIFTS_COLUMN = { key: 'gifts', label: 'Gifts', render: () => '—' };
// The default when no column is chosen, and the tiebreak when one is. Both are
// module constants so their identity is stable across renders and DataTable's
// sort memo is not invalidated every frame.
const DEFAULT_ROSTER_SORT = (a, b) => {
  const p = (STATUS_ORDER[statusFor(a)] ?? 0) - (STATUS_ORDER[statusFor(b)] ?? 0);
  return p !== 0 ? p : a.name.localeCompare(b.name);
};
const ROSTER_TIEBREAK = (a, b) => a.name.localeCompare(b.name);
const AUTH_ROSTER_COLUMNS = [
  ...ROSTER_COLUMNS.slice(0, 4),   // through Status
  ACCESS_COLUMN,
  ...ROSTER_COLUMNS.slice(4).map((c) => (c.key === 'gifts' ? AUTH_GIFTS_COLUMN : c)),
];

export default function EnterpriseRoster() {
  const eyebrow = useInstitutionEyebrow();
  const { openCompose } = useComms();
  const {
    athletes, add, update, remove,
    stageImport, discardStaged, dropStaged, saveStaged, removeMany,
    writeError, clearWriteError,
  } = useAthletes();
  // Roster-add affordance is authenticated-only — the demo tree renders
  // byte-identical (no CTA, no modal). Gate on identity presence.
  const isAuthenticated = !!useOptionalAppIdentity();
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeAthlete, setActiveAthlete] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  // Selection is a Set of athlete IDS, never indices, so it survives a re-sort.
  const [selected, setSelected] = useState(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // The import endpoint's per-row rejected[] and its likely-match report used to
  // render in the modal. The save moved here, so they render here: PARTIAL
  // FAILURE RULED requires every rejected row to be named, and the indices are
  // positions in the staged list, which is exactly what is on screen.
  const [saveOutcome, setSaveOutcome] = useState(null);

  const staged = athletes.filter((a) => a.uncommitted);

  // MIXED SELECTION RULED: a progressed athlete gets no checkbox, ever.
  // Removable at all means Pending, in one of two senses: a STAGED row, which is
  // dropped from memory, or a SAVED Pending athlete, which is hard-deleted.
  const kindOf = (a) => {
    if (a.uncommitted) return 'staged';
    return statusFor(a) === 'Not yet invited' ? 'saved' : null;
  };

  // Selection can outlive the rows it names (a save replaces staged ids, a
  // delete removes them), so everything below is derived from the CURRENT
  // roster rather than from the Set's size.
  const selectedRows = athletes.filter((a) => selected.has(a.id) && kindOf(a));
  const selectedCount = selectedRows.length;
  const selectedKind = selectedCount > 0 ? kindOf(selectedRows[0]) : null;

  // THE MIXING RULE, enforced by the checkbox's existence rather than by a
  // refusal. Once a kind is chosen, only that kind stays selectable, so the two
  // operations can never end up in one gesture. The ruling's own reasoning is
  // the argument: refusing after the operator has built a selection is worse
  // than a checkbox that never appears.
  const isRemovable = (a) => {
    const k = kindOf(a);
    if (!k) return false;
    return selectedKind === null || k === selectedKind;
  };

  const stats = computeStats(athletes);
  const { tot, certD, stalled, onTrack, notStarted, activelyProgressingPct, consentAware, rateActive, rateBaseTotal } = stats;
  // Sorting moved INTO DataTable (SORTING RULED 2026-08-27): it owns the chosen
  // column, and DEFAULT_ROSTER_SORT is what it falls back to when none is
  // chosen. Keeping the sort here as well would mean two orderings racing, and
  // the operator's choice losing to whichever ran last.

  // Access column is authenticated-only (see AUTH_ROSTER_COLUMNS docblock);
  // the demo tree keeps the 9-column set byte-identical.
  const rosterColumns = isAuthenticated ? AUTH_ROSTER_COLUMNS : ROSTER_COLUMNS;
  const rosterMinWidth = isAuthenticated ? '960px' : '880px';

  const config = activeCategory ? CATEGORY_CONFIG[activeCategory] : null;
  const filteredAthletes = config ? athletes.filter(config.filter) : [];
  const modalTitle = buildModalTitle(config, filteredAthletes, activeCategory);

  return (
    <main style={mainStyle}>
      {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
      <h1 style={titleStyle}>Roster</h1>

      {/* Stat grid — each tile drills into a filtered athlete list */}
      <div style={statGridStyle}>
        <StatTile label="Athletes" value={tot} onClick={() => setActiveCategory('all')} />
        <StatTile
          label="Actively progressing"
          value={onTrack}
          sublabel={consentAware
            ? (activelyProgressingPct == null ? 'Not tracked' : `${rateActive} of ${rateBaseTotal} tracked`)
            : `${activelyProgressingPct}% of program`}
          onClick={() => setActiveCategory('actively-progressing')}
        />
        <StatTile label="Certified" value={certD} onClick={() => setActiveCategory('certified')} />
        <StatTile label="Not yet active" value={stalled} onClick={() => setActiveCategory('not-yet-active')} />
        <StatTile label="Invited" value={notStarted} onClick={() => setActiveCategory('invited')} />
      </div>
      <RateDisclosure stats={stats} />

      {/* REVIEW BAR. Sits OUTSIDE the table's horizontal scroll container, so
          the save and discard controls stay reachable at any viewport width even
          when the leading checkbox column has scrolled out of view. */}
      {isAuthenticated && staged.length > 0 && (
        <div style={reviewBarStyle}>
          <p style={reviewTextStyle}>
            <strong>{staged.length} row{staged.length === 1 ? '' : 's'} ready to save.</strong>{' '}
            Nothing has been saved yet. Check them below and remove any that are wrong.
          </p>
          <div style={reviewActionsStyle}>
            <Button variant="ghost" size="lg" onClick={() => { discardStaged(); setSelected(new Set()); }} disabled={busy}>
              Discard
            </Button>
            <Button
              variant="primary"
              size="lg"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const result = await saveStaged();
                setBusy(false);
                setSaveOutcome(result);
              }}
            >
              {busy ? 'Saving…' : `Save ${staged.length} athlete${staged.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      )}

      {/* SAVE OUTCOME. A rejection names EVERY bad row by the staged athlete it
          refers to; the staged rows are still on screen and still editable, so
          the repair is to remove them and save again. */}
      {isAuthenticated && saveOutcome && !saveOutcome.ok && saveOutcome.rejected.length > 0 && (
        <div style={rejectedBoxStyle}>
          <p style={reviewTextStyle}>Nothing was saved. These rows were refused:</p>
          <ul style={rejectedListStyle}>
            {saveOutcome.rejected.slice(0, 50).map((r, i) => (
              <li key={i} style={rejectedItemStyle}>
                <strong>{staged[r.index] ? staged[r.index].name : `Row ${r.index + 1}`}</strong>: {r.reason}
              </li>
            ))}
            {saveOutcome.rejected.length > 50 && (
              <li style={rejectedItemStyle}>and {saveOutcome.rejected.length - 50} more.</li>
            )}
          </ul>
        </div>
      )}

      {isAuthenticated && saveOutcome && saveOutcome.ok && saveOutcome.matches
        && (saveOutcome.matches.onRoster.length > 0 || saveOutcome.matches.withinPaste.length > 0) && (
        <div style={matchBoxStyle}>
          <p style={reviewTextStyle}>
            Saved. {saveOutcome.matches.onRoster.length > 0 && `${saveOutcome.matches.onRoster.length} row(s) share a name or an email with someone already on the roster. `}
            {saveOutcome.matches.withinPaste.length > 0 && `${saveOutcome.matches.withinPaste.length} set(s) of imported rows repeat each other. `}
            They were all imported: two athletes can share a name or an address, so this is shown rather than decided.
          </p>
          <div style={reviewActionsStyle}>
            <Button variant="ghost" size="lg" onClick={() => setSaveOutcome(null)}>Dismiss</Button>
          </div>
        </div>
      )}

      {/* SELECTION BAR, outside the scroll container for the same reason. */}
      {isAuthenticated && selectedCount > 0 && (
        <div style={selectionBarStyle}>
          <p style={reviewTextStyle}>
            {selectedCount} selected
            {selectedKind === 'staged' && ' from this import'}
          </p>
          <div style={reviewActionsStyle}>
            <Button variant="ghost" size="lg" onClick={() => setSelected(new Set())} disabled={busy}>Clear</Button>
            <Button
              variant="secondary"
              size="lg"
              disabled={busy}
              onClick={() => {
                // A staged row has never been written, so dropping it is not a
                // delete and asks no confirmation: the operator is editing a
                // list they are still assembling. A saved row is a hard delete
                // with no undo, so that one confirms.
                if (selectedKind === 'staged') {
                  selectedRows.forEach((a) => dropStaged(a.id));
                  setSelected(new Set());
                } else {
                  setConfirmOpen(true);
                }
              }}
            >
              Remove {selectedCount}
            </Button>
          </div>
        </div>
      )}

      {/* Add-athlete CTA — authenticated tree only, when the roster is
          non-empty (the empty state carries its own affordance below). */}
      {isAuthenticated && athletes.length > 0 && (
        <div style={addRowStyle}>
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>Import roster</Button>
          <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>Add athlete</Button>
        </div>
      )}

      {/* Roster table — rows clickable, opens profile directly. Empty until
          athletes enroll via the roster-add write path (slim-seed ruling). */}
      <Card>
        {athletes.length > 0 ? (
          <>
            <DataTable
              columns={rosterColumns}
              data={athletes}
              rowKey={(a) => a.id}
              minWidth={rosterMinWidth}
              onRowClick={setActiveAthlete}
              rowAriaLabel={(a) => `View ${a.name}'s profile`}
              defaultSort={DEFAULT_ROSTER_SORT}
              tiebreak={ROSTER_TIEBREAK}
              rowState={isAuthenticated ? ((a) => (a.uncommitted ? 'uncommitted' : null)) : undefined}
              selectable={isAuthenticated ? isRemovable : undefined}
              selectedKeys={selected}
              onSelectionChange={isAuthenticated ? setSelected : undefined}
            />
            {/* FORK 3 caption — explains the "—" in the Gifts column so the dash
                reads as unsourced rather than ambiguous. Same string shipped in
                PhilanthropicReadiness Stage 4. Auth tree only. */}
            {isAuthenticated && (
              <p style={giftNoteStyle}>Gift-making is not tracked in this prototype.</p>
            )}
          </>
        ) : (
          <div style={emptyBlockStyle}>
            <p style={emptyStateStyle}>No athletes enrolled yet.</p>
            {isAuthenticated && (
              <div style={emptyActionsStyle}>
                <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>Import roster</Button>
                <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>Add the first athlete</Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* CONFIRM, NAMING THE COUNT. A hard delete has no undo and no stub left
          behind, so the count is in the button as well as the copy: an operator
          who mis-clicked "select all" sees the number before it happens, not
          after. */}
      {isAuthenticated && (
        <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Remove athletes">
          <p style={confirmTextStyle}>
            Remove {selectedCount} athlete{selectedCount === 1 ? '' : 's'} from the roster?
            {' '}They have not been invited yet, so nothing is kept: their records are deleted
            outright and this cannot be undone.
          </p>
          {writeError && <p style={confirmErrorStyle}>{writeError}</p>}
          <div style={confirmActionsStyle}>
            <Button variant="ghost" size="lg" onClick={() => setConfirmOpen(false)} disabled={busy}>Cancel</Button>
            <Button
              variant="primary"
              size="lg"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const result = await removeMany(selectedRows.map((a) => a.id));
                setBusy(false);
                if (result.ok) { setSelected(new Set()); setConfirmOpen(false); }
              }}
            >
              {busy ? 'Removing…' : `Remove ${selectedCount}`}
            </Button>
          </div>
        </Modal>
      )}

      {/* Roster import — authenticated tree only, same gate as the add form. */}
      {isAuthenticated && (
        <ImportRosterModal
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
          onStage={stageImport}
          writeError={writeError}
          clearWriteError={clearWriteError}
        />
      )}

      {/* Roster-add form — authenticated tree only. */}
      {isAuthenticated && (
        <AddAthleteModal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          onAdd={add}
          writeError={writeError}
          clearWriteError={clearWriteError}
        />
      )}

      {/* Drill-down: stat tile → filtered list → profile (stacks) */}
      <FilteredAthletesModal
        isOpen={activeCategory !== null}
        onClose={() => setActiveCategory(null)}
        title={modalTitle}
        athletes={filteredAthletes}
        onAthleteClick={setActiveAthlete}
      />

      {/* Profile: opened from filtered modal OR directly from table row.
          Remove-from-roster (anonymize) is authenticated-only. */}
      <AthleteProfile
        isOpen={activeAthlete !== null}
        // Derive the LIVE element by id so a milestone save (provider
        // write-through replaces the row) refreshes the open profile.
        athlete={activeAthlete ? (athletes.find((a) => a.id === activeAthlete.id) ?? activeAthlete) : null}
        onClose={() => setActiveAthlete(null)}
        onSendReminder={(a) => openCompose({ name: a.name, email: a.email }, 'Reminder')}
        onRemove={isAuthenticated ? remove : undefined}
        onUpdate={isAuthenticated ? update : undefined}
        writeError={writeError}
        clearWriteError={clearWriteError}
      />
    </main>
  );
}

const mainStyle = {
  maxWidth: 'var(--sh-content-max)',
  margin: '0 auto',
  padding: 'var(--sh-space-10) clamp(var(--sh-space-3), 4vw, var(--sh-space-8)) var(--sh-space-16)',
};

const eyebrowStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 'var(--sh-space-2)',
};

const titleStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-2xl)',
  color: 'var(--sh-text-primary)',
  marginBottom: 'var(--sh-space-6)',
};

const statGridStyle = {
  display: 'grid',
  // Floor wrapped in min() per 88e07ea: identical at or above 180px, and below
  // it the track shrinks to fit rather than overflowing the page sideways.
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
  gap: 'var(--sh-space-4)',
  marginBottom: 'var(--sh-space-6)',
};

// Quiet empty-state line when the roster carries no athletes (auth tree).
const emptyStateStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-secondary)',
  lineHeight: 1.6,
  padding: 'var(--sh-space-2) 0',
};

// Empty-state block: line + "Add the first athlete" affordance (auth tree).
const emptyBlockStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 'var(--sh-space-3)',
  padding: 'var(--sh-space-2) 0',
};

// FORK 3 caption under the roster table (auth tree) — the muted xs disclosure
// idiom shared with RateDisclosure.
const giftNoteStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  lineHeight: 1.55,
  letterSpacing: '0.02em',
  marginTop: 'var(--sh-space-3)',
};

// Right-aligned "Add athlete" CTA row above a populated roster (auth tree).
// flexWrap + gap so the two CTAs stack rather than overflow on a narrow
// viewport. Authenticated tree only, so the demo tree is unaffected.
const addRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: 'var(--sh-space-2)',
  marginBottom: 'var(--sh-space-4)',
};

// The review and selection bars sit OUTSIDE the table's overflow-x container,
// so their controls never scroll away with the checkbox column. Both use
// size="lg" buttons, the §7 touch-primary size held to 44px, and wrap.
const barBase = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--sh-space-3)',
  padding: 'var(--sh-space-3) var(--sh-space-4)',
  borderRadius: 'var(--sh-radius-md)',
  marginBottom: 'var(--sh-space-4)',
};

const reviewBarStyle = {
  ...barBase,
  background: 'var(--sh-bg-tint)',
  border: '1px solid var(--sh-bronze)',
};

const selectionBarStyle = {
  ...barBase,
  background: 'var(--sh-card)',
  border: 'var(--sh-border-default)',
};

const reviewTextStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.5,
  margin: 0,
  flex: '1 1 12rem',
};

const reviewActionsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--sh-space-2)',
};

const rejectedBoxStyle = {
  ...barBase,
  display: 'block',
  background: 'var(--sh-warning-bg)',
  border: '1px solid var(--sh-warning-border)',
};

const matchBoxStyle = {
  ...barBase,
  background: 'var(--sh-bg-tint)',
  border: 'var(--sh-border-thin)',
};

const rejectedListStyle = {
  margin: 'var(--sh-space-2) 0 0',
  paddingLeft: 'var(--sh-space-4)',
  listStyle: 'disc',
};

const rejectedItemStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-warning-text)',
  lineHeight: 1.6,
  overflowWrap: 'anywhere',
};

const confirmTextStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.6,
  marginTop: 0,
  marginBottom: 'var(--sh-space-4)',
};

const confirmErrorStyle = {
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-bronze-deep)',
  marginBottom: 'var(--sh-space-3)',
  overflowWrap: 'anywhere',
};

const confirmActionsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: 'var(--sh-space-2)',
  marginTop: 'var(--sh-space-5)',
  paddingTop: 'var(--sh-space-4)',
  borderTop: 'var(--sh-border-thin)',
};

const emptyActionsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 'var(--sh-space-2)',
};

