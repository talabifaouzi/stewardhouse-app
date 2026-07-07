import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { Icon } from '../../components/Icon.jsx';
import { formatSessionDate, stages } from '../../data/clients.js';
import { useBasePath } from '../../contexts/AppIdentityContext.jsx';
import { useClients } from '../../contexts/ClientsContext.jsx';

// Phase 1 scope: athletes only. We filter by sport instead of sector.
const sports = ['All', 'Basketball', 'Football', 'Soccer', 'Track and Field'];

// URL is the source of truth for filter state (ADV-015, ports Operations
// slice 5's pattern — see IndividualsDirectory for the original):
//   ?q=text         search-input value (debounced URL writes)
//   ?stage=Active   one-of stages list (case-sensitive literal label, C-α)
//   ?sport=Soccer   one-of sports list (case-sensitive literal label, C-α)
// Default values ("All" / "") are omitted from the URL so a clean default
// roster reads as /advisor/clients (no param cruft). Unknown values are
// silently dropped — shareable URLs shouldn't shout at typos.
const Q_DEBOUNCE_MS = 250;
const STAGE_OPTIONS = ['All', ...stages];

function parseSingleSelect(raw, validValues, defaultValue) {
  if (raw === null) return defaultValue;
  return validValues.includes(raw) ? raw : defaultValue;
}

// R1 initials algorithm: first grapheme of first token + first grapheme of
// last token, uppercase; single-token names take the first two graphemes.
// Uses `Array.from` so multi-code-unit graphemes (e.g. accented chars) are
// not split mid-surrogate.
function deriveInitials(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return '';
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 1) {
    return Array.from(tokens[0]).slice(0, 2).join('').toUpperCase();
  }
  const first = Array.from(tokens[0])[0] ?? '';
  const last = Array.from(tokens[tokens.length - 1])[0] ?? '';
  return (first + last).toUpperCase();
}

// R6 sort: primary next_session_date ascending (null / absent dates LAST),
// secondary alphabetical by name as tiebreak. No stage in the ordering.
function sortRoster(list) {
  const copy = [...list];
  copy.sort((a, b) => {
    const ad = a?.nextSession || null;
    const bd = b?.nextSession || null;
    if (ad && bd) {
      if (ad < bd) return -1;
      if (ad > bd) return 1;
    } else if (ad && !bd) return -1;
    else if (!ad && bd) return 1;
    return (a?.name || '').localeCompare(b?.name || '');
  });
  return copy;
}

export default function ClientRoster() {
  const { clients, add } = useClients();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-derived state — re-read on every render so back/forward + direct
  // paste both flow through naturally.
  const qFromUrl = searchParams.get('q') ?? '';
  const activeStage = parseSingleSelect(searchParams.get('stage'), STAGE_OPTIONS, 'All');
  const activeSport = parseSingleSelect(searchParams.get('sport'), sports, 'All');

  // Local input shadows the URL q so typing stays responsive while we
  // debounce the URL writes. URL changes (back/forward, direct paste)
  // sync down via this effect.
  const [qInput, setQInput] = useState(qFromUrl);
  useEffect(() => { setQInput(qFromUrl); }, [qFromUrl]);

  const debounceRef = useRef(null);
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function writeParam(name, value, isDefault) {
    setSearchParams((prev) => {
      const np = new URLSearchParams(prev);
      if (isDefault) np.delete(name);
      else np.set(name, value);
      return np;
    }, { replace: true });
  }

  function onQueryChange(next) {
    setQInput(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      writeParam('q', next, next === '');
    }, Q_DEBOUNCE_MS);
  }

  function onStageChange(next) {
    writeParam('stage', next, next === 'All');
  }

  function onSportChange(next) {
    writeParam('sport', next, next === 'All');
  }

  const filtered = sortRoster(clients.filter(c => {
    if (activeStage !== 'All' && c.stage !== activeStage) return false;
    if (activeSport !== 'All' && c.sport !== activeSport) return false;
    if (qFromUrl && !c.name.toLowerCase().includes(qFromUrl.toLowerCase())) return false;
    return true;
  }));

  // New-client inline form (Documentation add-section precedent).
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInitials, setNewInitials] = useState('');
  const [initialsTouched, setInitialsTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const derivedInitials = deriveInitials(newName);
  const displayInitials = initialsTouched ? newInitials : derivedInitials;

  const openAddClient = () => {
    setNewName(''); setNewInitials(''); setInitialsTouched(false);
    setSaveError(''); setIsAddingClient(true);
  };
  const cancelAddClient = () => {
    setNewName(''); setNewInitials(''); setInitialsTouched(false);
    setSaveError(''); setIsAddingClient(false);
  };
  const onNameChange = (v) => {
    setNewName(v);
    if (!initialsTouched) setNewInitials(deriveInitials(v));
  };
  const onInitialsChange = (v) => {
    setNewInitials(v.toUpperCase());
    setInitialsTouched(true);
  };
  const saveClient = async () => {
    const name = newName.trim();
    if (!name) { setSaveError('Name is required.'); return; }
    setSaving(true);
    setSaveError('');
    // R1: only name + initials are submitted. Stage defaults server-side to
    // 'New' when key is omitted. No sport/level/etc — filled through use later.
    const payload = { name, initials: displayInitials || null };
    const result = await add(payload);
    setSaving(false);
    if (!result) { setSaveError('Could not save. Please try again.'); return; }
    cancelAddClient();
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
          Roster
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 'var(--sh-space-4)',
          flexWrap: 'wrap',
        }}>
          <h1 style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-2xl)',
            color: 'var(--sh-text-primary)',
          }}>
            Clients
          </h1>
          {!isAddingClient && (
            <button
              type="button"
              onClick={openAddClient}
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
              New client
            </button>
          )}
        </div>
      </div>

      {isAddingClient && (
        <Card style={{ marginBottom: 'var(--sh-space-6)' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-4)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-1)' }}>
              <label htmlFor="new-client-name" style={fieldLabelStyle}>Name</label>
              <input
                id="new-client-name"
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Client name"
                style={fieldInputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-1)', maxWidth: '160px' }}>
              <label htmlFor="new-client-initials" style={fieldLabelStyle}>Initials</label>
              <input
                id="new-client-initials"
                type="text"
                value={displayInitials}
                onChange={(e) => onInitialsChange(e.target.value)}
                placeholder="—"
                maxLength={4}
                style={{ ...fieldInputStyle, textAlign: 'center', letterSpacing: '0.04em', fontWeight: 500 }}
              />
            </div>
            {saveError && (
              <p role="alert" style={{
                fontSize: 'var(--sh-text-xs)',
                color: 'var(--sh-text-muted)',
                fontStyle: 'italic',
              }}>{saveError}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sh-space-2)', flexWrap: 'wrap' }}>
              <Button variant="ghost" onClick={cancelAddClient} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={saveClient} disabled={saving || !newName.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card padding="sm" style={{ marginBottom: 'var(--sh-space-6)' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--sh-space-4)',
          alignItems: 'center',
          padding: 'var(--sh-space-2)',
        }}>
          <input
            type="text"
            placeholder="Search by name"
            aria-label="Search clients by name"
            value={qInput}
            onChange={(e) => onQueryChange(e.target.value)}
            style={{
              padding: 'var(--sh-space-2) var(--sh-space-3)',
              border: 'var(--sh-border-thin)',
              borderRadius: 'var(--sh-radius-md)',
              fontSize: 'var(--sh-text-sm)',
              minWidth: '200px',
              flex: 1,
              background: 'var(--sh-card)',
            }}
          />
          <FilterGroup
            label="Stage"
            options={STAGE_OPTIONS}
            value={activeStage}
            onChange={onStageChange}
          />
          <FilterGroup
            label="Sport"
            options={sports}
            value={activeSport}
            onChange={onSportChange}
          />
        </div>
      </Card>

      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-muted)',
        marginBottom: 'var(--sh-space-4)',
      }}>
        Showing {filtered.length} of {clients.length} clients
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sh-space-2)',
      }}>
        {clients.length === 0 ? (
          <Card tint>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-muted)',
              textAlign: 'center',
              padding: 'var(--sh-space-6)',
              fontStyle: 'italic',
            }}>
              Your clients will appear here.
            </p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card tint>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              color: 'var(--sh-text-muted)',
              textAlign: 'center',
              padding: 'var(--sh-space-6)',
            }}>
              No clients match the current filters.
            </p>
          </Card>
        ) : (
          filtered.map(client => (
            <ClientRow key={client.id} client={client} />
          ))
        )}
      </div>
    </main>
  );
}

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sh-space-2)' }}>
      <span style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginRight: 'var(--sh-space-1)',
      }}>{label}</span>
      <div style={{ display: 'flex', gap: 'var(--sh-space-1)', flexWrap: 'wrap' }}>
        {options.map(opt => {
          const isActive = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              style={{
                padding: '5px 11px',
                border: '1px solid',
                borderColor: isActive ? 'var(--sh-bronze)' : 'var(--sh-card-border)',
                borderRadius: 'var(--sh-radius-full)',
                background: isActive ? 'var(--sh-bronze-tint)' : 'var(--sh-card)',
                color: isActive ? 'var(--sh-text-primary)' : 'var(--sh-text-secondary)',
                fontSize: 'var(--sh-text-xs)',
                fontWeight: isActive ? 500 : 400,
                cursor: 'pointer',
                transition: 'all var(--sh-transition-fast)',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClientRow({ client }) {
  const basePath = useBasePath('/advisor', '/app/advisor');
  return (
    <Link
      to={`${basePath}/clients/${client.id}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        background: 'var(--sh-card)',
        border: 'var(--sh-border-thin)',
        borderRadius: 'var(--sh-radius-lg)',
        padding: 'var(--sh-space-4) var(--sh-space-5)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sh-space-5)',
        transition: 'all var(--sh-transition-fast)',
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'var(--sh-bronze-tint)',
        color: 'var(--sh-bronze-deep)',
        fontSize: 'var(--sh-text-sm)',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        letterSpacing: '0.04em',
      }}>
        {client.initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--sh-space-3)',
          marginBottom: 'var(--sh-space-half)',
        }}>
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-text-primary)',
          }}>
            {client.name}
          </p>
          <StageBadge stage={client.stage} />
        </div>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          marginBottom: 'var(--sh-space-1)',
        }}>
          {client.sport} · {client.level} · started {client.relationshipStartedYear}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-secondary)',
          lineHeight: 1.5,
          maxWidth: '720px',
        }}>
          {client.summary}
        </p>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 'var(--sh-space-half)',
        minWidth: '120px',
      }}>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Next session
        </p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-primary)',
        }}>
          {formatSessionDate(client.nextSession)}
        </p>
      </div>
    </Link>
  );
}

function StageBadge({ stage }) {
  const colors = {
    New:    { bg: 'var(--sh-divider)',     text: 'var(--sh-text-secondary)' },
    Active: { bg: 'var(--sh-bronze-tint)', text: 'var(--sh-bronze-deep)' },
    Mature: { bg: 'var(--sh-card-border)', text: 'var(--sh-text-body)' },
    Sunset: { bg: 'var(--sh-bg-tint)',     text: 'var(--sh-text-muted)' },
  };
  const c = colors[stage] || colors.Active;
  return (
    <span style={{
      // ADV-006 F1 ruling: was '10px' — nearest token (+1px nudge).
      fontSize: 'var(--sh-text-xs)',
      padding: 'var(--sh-space-half) var(--sh-space-2)',
      borderRadius: 'var(--sh-radius-full)',
      background: c.bg,
      color: c.text,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontWeight: 500,
    }}>
      {stage}
    </span>
  );
}

const fieldLabelStyle = {
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const fieldInputStyle = {
  padding: 'var(--sh-space-2) var(--sh-space-3)',
  border: 'var(--sh-border-thin)',
  borderRadius: 'var(--sh-radius-md)',
  fontSize: 'var(--sh-text-sm)',
  color: 'var(--sh-text-primary)',
  background: 'var(--sh-card)',
  fontFamily: 'inherit',
};
