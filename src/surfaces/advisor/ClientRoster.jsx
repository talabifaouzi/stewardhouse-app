import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/Card.jsx';
import { clients, stages } from '../../data/clients.js';

// Phase 1 scope: athletes only. We filter by sport instead of sector.
const sports = ['All', 'Basketball', 'Football', 'Soccer', 'Track and Field'];

export default function ClientRoster() {
  const [searchParams] = useSearchParams();
  const initialStage = searchParams.get('stage');
  const [activeStage, setActiveStage] = useState(
    initialStage ? initialStage.charAt(0).toUpperCase() + initialStage.slice(1) : 'All'
  );
  const [activeSport, setActiveSport] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = clients.filter(c => {
    if (activeStage !== 'All' && c.stage !== activeStage) return false;
    if (activeSport !== 'All' && c.sport !== activeSport) return false;
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

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
        <h1 style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: 'var(--sh-text-primary)',
        }}>
          Clients
        </h1>
      </div>

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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            options={['All', ...stages]}
            value={activeStage}
            onChange={setActiveStage}
          />
          <FilterGroup
            label="Sport"
            options={sports}
            value={activeSport}
            onChange={setActiveSport}
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
        {filtered.map(client => (
          <ClientRow key={client.id} client={client} />
        ))}
        {filtered.length === 0 && (
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
  return (
    <Link
      to={`/advisor/clients/${client.id}`}
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
          {client.nextSession}
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
