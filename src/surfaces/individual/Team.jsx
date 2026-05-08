import { useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Tag } from '../../components/Tag.jsx';
import { SAMPLE_GRANTS, SAMPLE_EVENTS, ROLES } from '../../data/teamData.js';

export default function Team() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAccess, setShowAccess] = useState(false);
  const [reminded, setReminded] = useState({});

  const grants = SAMPLE_GRANTS;
  const today = new Date();

  const pendingReports = grants.filter(g => g.report?.status === 'pending');
  const pendingPayments = grants.filter(g => g.commitment?.nextDate);
  const pendingAcks = grants.filter(g => g.ack === 'pending');
  const pendingAgreements = grants.filter(g => g.agreement === 'sent' || g.agreement === 'draft');
  const pastDueReports = pendingReports.filter(g => new Date(g.report.due) < today).length;
  const pastDuePayments = pendingPayments.filter(g => new Date(g.commitment.nextDate) < today).length;
  const pastDueAcks = pendingAcks.length;

  const remind = (id, type) => {
    const key = `${type}-${id}`;
    setReminded(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setReminded(prev => ({ ...prev, [key]: false }));
    }, 2500);
  };

  if (showAccess) {
    return <AccessControl onBack={() => setShowAccess(false)} />;
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reports', label: 'Reports', count: pendingReports.length, pastDue: pastDueReports },
    { id: 'payments', label: 'Payments', count: pendingPayments.length, pastDue: pastDuePayments },
    { id: 'acks', label: 'Acknowledgments', count: pendingAcks.length, pastDue: pastDueAcks },
    { id: 'agreements', label: 'Agreements', count: pendingAgreements.length },
    { id: 'calendar', label: 'Calendar' },
  ];

  return (
    <main style={{
      maxWidth: '880px',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--sh-space-4)',
      }}>
        <div>
          <p style={{
            fontSize: '10px',
            color: 'var(--sh-bronze)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 600,
            marginBottom: '4px',
          }}>
            Team Workspace
          </p>
          <p style={{
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-text-secondary)',
          }}>
            Grants management & operations
          </p>
        </div>
        <button
          onClick={() => setShowAccess(true)}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--sh-radius-full)',
            border: '1px solid var(--sh-bronze)',
            cursor: 'pointer',
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-bronze-deep)',
            fontWeight: 600,
            background: 'transparent',
            fontFamily: 'inherit',
          }}
        >
          Access Control
        </button>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: '4px',
        overflowX: 'auto',
        marginBottom: 'var(--sh-space-5)',
        paddingBottom: '4px',
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--sh-radius-full)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: activeTab === t.id ? 'var(--sh-bronze)' : 'var(--sh-card)',
              color: activeTab === t.id ? '#FFFFFF' : 'var(--sh-text-body)',
              fontSize: 'var(--sh-text-xs)',
              fontWeight: 600,
              border: `1px solid ${activeTab === t.id ? 'var(--sh-bronze)' : 'var(--sh-card-border)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'inherit',
              transition: 'all 150ms ease',
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{
                background: activeTab === t.id ? 'rgba(255,255,255,0.3)' :
                            t.pastDue > 0 ? '#F8D7CC' : 'var(--sh-bronze-tint)',
                color: t.pastDue > 0 ? '#A03C18' : 'var(--sh-bronze-deep)',
                borderRadius: 'var(--sh-radius-full)',
                padding: '2px 7px',
                fontSize: '10px',
                fontWeight: 700,
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <Overview
          pendingReports={pendingReports}
          pendingPayments={pendingPayments}
          pendingAcks={pendingAcks}
          pendingAgreements={pendingAgreements}
          pastDueReports={pastDueReports}
          pastDuePayments={pastDuePayments}
          pastDueAcks={pastDueAcks}
          grants={grants}
        />
      )}

      {activeTab === 'reports' && (
        <ReportsTab pending={pendingReports} reminded={reminded} remind={remind} today={today} />
      )}

      {activeTab === 'payments' && (
        <PaymentsTab pending={pendingPayments} reminded={reminded} remind={remind} today={today} />
      )}

      {activeTab === 'acks' && (
        <AcksTab pending={pendingAcks} reminded={reminded} remind={remind} />
      )}

      {activeTab === 'agreements' && <AgreementsTab pending={pendingAgreements} />}

      {activeTab === 'calendar' && <CalendarTab />}
    </main>
  );
}

function Overview({ pendingReports, pendingPayments, pendingAcks, pendingAgreements, pastDueReports, pastDuePayments, pastDueAcks, grants }) {
  const stats = [
    { n: pendingReports.length, l: 'Pending reports', accent: pendingReports.length > 0, pd: pastDueReports },
    { n: pendingPayments.length, l: 'Upcoming payments', accent: pendingPayments.length > 0, pd: pastDuePayments },
    { n: pendingAcks.length, l: 'Missing acknowledgments', accent: pendingAcks.length > 0, alert: true, pd: pastDueAcks },
    { n: pendingAgreements.length, l: 'Open agreements', accent: pendingAgreements.length > 0, pd: 0 },
  ];

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--sh-space-2)',
        marginBottom: 'var(--sh-space-5)',
      }}>
        {stats.map((item, i) => (
          <Card key={i} padding="md">
            <p style={{
              fontFamily: 'var(--sh-font-serif)',
              fontSize: 'var(--sh-text-2xl)',
              color: item.alert && item.accent ? '#A03C18' :
                     item.accent ? 'var(--sh-bronze-deep)' :
                     'var(--sh-text-primary)',
              lineHeight: 1,
              marginBottom: '4px',
            }}>
              {item.n}
            </p>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
            }}>
              {item.l}
            </p>
            {item.pd > 0 && (
              <p style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#A03C18',
                marginTop: '4px',
              }}>
                {item.pd} past due
              </p>
            )}
          </Card>
        ))}
      </div>

      <p style={{
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--sh-text-primary)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: 'var(--sh-space-2)',
      }}>
        Active grants
      </p>
      {grants.map(gr => (
        <div key={gr.id} style={{
          background: 'var(--sh-card)',
          borderRadius: 'var(--sh-radius-md)',
          padding: 'var(--sh-space-3) var(--sh-space-3)',
          border: 'var(--sh-border-thin)',
          marginBottom: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <p style={{
              fontSize: 'var(--sh-text-sm)',
              fontWeight: 600,
              color: 'var(--sh-text-primary)',
            }}>
              {gr.org}
            </p>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
            }}>
              {gr.type} · {gr.vehicle === 'daf' ? 'DAF' : gr.vehicle === 'community' ? 'Community Foundation' : 'Personal'}
              {gr.commitment ? ` · Year ${gr.commitment.paid + 1} of ${gr.commitment.total}` : ''}
            </p>
          </div>
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-md)',
            color: 'var(--sh-bronze-deep)',
          }}>
            ${gr.amount.toLocaleString()}
          </p>
        </div>
      ))}
    </>
  );
}

function ItemRow({ children, isPastDue }) {
  return (
    <div style={{
      background: 'var(--sh-card)',
      borderRadius: 'var(--sh-radius-md)',
      padding: 'var(--sh-space-3) var(--sh-space-3)',
      border: `1px solid ${isPastDue ? '#E8B6A1' : 'var(--sh-card-border)'}`,
      marginBottom: 'var(--sh-space-2)',
    }}>
      {children}
    </div>
  );
}

function RemindButton({ wasReminded, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: 'var(--sh-radius-full)',
        background: wasReminded ? 'var(--sh-bronze-tint)' : 'var(--sh-bg-tint)',
        cursor: 'pointer',
        fontSize: 'var(--sh-text-xs)',
        fontWeight: 600,
        color: wasReminded ? 'var(--sh-bronze-deep)' : 'var(--sh-text-primary)',
        transition: 'all 200ms ease',
        border: 'none',
        fontFamily: 'inherit',
      }}
    >
      {wasReminded ? 'Sent ✓' : 'Remind'}
    </button>
  );
}

function ReportsTab({ pending, reminded, remind, today }) {
  if (pending.length === 0) {
    return <EmptyTab text="No pending reports" />;
  }
  return pending.map(gr => {
    const isPastDue = new Date(gr.report.due) < today;
    return (
      <ItemRow key={gr.id} isPastDue={isPastDue}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 'var(--sh-text-sm)', fontWeight: 600, color: 'var(--sh-text-primary)' }}>{gr.org}</p>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: isPastDue ? '#A03C18' : 'var(--sh-text-muted)',
              fontWeight: isPastDue ? 600 : 400,
              marginTop: '4px',
            }}>
              {isPastDue ? 'Past due' : 'Due'}: {gr.report.due}
            </p>
          </div>
          <p style={{ fontSize: 'var(--sh-text-sm)', fontWeight: 600, color: 'var(--sh-bronze-deep)' }}>
            ${gr.amount.toLocaleString()}
          </p>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'var(--sh-space-2)',
        }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {isPastDue && <Tag tone="warning">Past due</Tag>}
            <Tag>Pending</Tag>
          </div>
          <RemindButton wasReminded={reminded[`report-${gr.id}`]} onClick={() => remind(gr.id, 'report')} />
        </div>
      </ItemRow>
    );
  });
}

function PaymentsTab({ pending, reminded, remind, today }) {
  if (pending.length === 0) {
    return <EmptyTab text="No upcoming payments" />;
  }
  return pending.map(gr => {
    const isPastDue = new Date(gr.commitment.nextDate) < today;
    return (
      <ItemRow key={gr.id} isPastDue={isPastDue}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 'var(--sh-text-sm)', fontWeight: 600, color: 'var(--sh-text-primary)' }}>{gr.org}</p>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: isPastDue ? '#A03C18' : 'var(--sh-text-muted)',
              fontWeight: isPastDue ? 600 : 400,
              marginTop: '4px',
            }}>
              {isPastDue ? 'Past due' : 'Due'}: {gr.commitment.nextDate} · ${gr.amount.toLocaleString()}
            </p>
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'var(--sh-space-2)',
          flexWrap: 'wrap',
          gap: '4px',
        }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <Tag tone="bronze">Year {gr.commitment.paid + 1} of {gr.commitment.total}</Tag>
            <Tag>{gr.vehicle === 'daf' ? 'Via DAF' : 'Personal'}</Tag>
            {isPastDue && <Tag tone="warning">Past due</Tag>}
          </div>
          <RemindButton wasReminded={reminded[`payment-${gr.id}`]} onClick={() => remind(gr.id, 'payment')} />
        </div>
      </ItemRow>
    );
  });
}

function AcksTab({ pending, reminded, remind }) {
  if (pending.length === 0) {
    return <EmptyTab text="All payment acknowledgments received" />;
  }
  return pending.map(gr => (
    <ItemRow key={gr.id} isPastDue>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 'var(--sh-text-sm)', fontWeight: 600, color: 'var(--sh-text-primary)' }}>{gr.org}</p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: '#A03C18',
            fontWeight: 600,
            marginTop: '4px',
          }}>
            Payment acknowledgment needed for ${gr.amount.toLocaleString()} gift
          </p>
        </div>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'var(--sh-space-2)',
      }}>
        <Tag tone="warning">Missing</Tag>
        <RemindButton wasReminded={reminded[`ack-${gr.id}`]} onClick={() => remind(gr.id, 'ack')} />
      </div>
    </ItemRow>
  ));
}

function AgreementsTab({ pending }) {
  if (pending.length === 0) {
    return <EmptyTab text="No open agreements" />;
  }
  return pending.map(gr => (
    <ItemRow key={gr.id}>
      <p style={{ fontSize: 'var(--sh-text-sm)', fontWeight: 600, color: 'var(--sh-text-primary)' }}>{gr.org}</p>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        marginTop: '4px',
        marginBottom: '8px',
      }}>
        Status: {gr.agreement}
      </p>
      <Tag>{gr.agreement === 'sent' ? 'Awaiting signature' : 'Draft'}</Tag>
    </ItemRow>
  ));
}

function CalendarTab() {
  return SAMPLE_EVENTS.map(ev => {
    const [day, month] = ev.date.split(' ');
    return (
      <div key={ev.id} style={{
        display: 'flex',
        gap: 'var(--sh-space-3)',
        marginBottom: 'var(--sh-space-3)',
        alignItems: 'flex-start',
      }}>
        <div style={{ width: '52px', textAlign: 'center', flexShrink: 0 }}>
          <p style={{
            fontFamily: 'var(--sh-font-serif)',
            fontSize: 'var(--sh-text-md)',
            fontWeight: 700,
            color: 'var(--sh-text-primary)',
            lineHeight: 1,
          }}>
            {day}
          </p>
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
            marginTop: '2px',
          }}>
            {month}
          </p>
        </div>
        <div style={{
          flex: 1,
          background: 'var(--sh-card)',
          borderRadius: 'var(--sh-radius-md)',
          padding: 'var(--sh-space-2) var(--sh-space-3)',
          border: 'var(--sh-border-thin)',
        }}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-body)',
            marginBottom: '4px',
          }}>
            {ev.title}
          </p>
          <Tag tone={ev.type === 'payment' || ev.type === 'visit' ? 'bronze' : 'default'}>
            {ev.type}
          </Tag>
        </div>
      </div>
    );
  });
}

function EmptyTab({ text }) {
  return (
    <div style={{
      textAlign: 'center',
      paddingTop: 'var(--sh-space-8)',
      color: 'var(--sh-text-muted)',
      fontSize: 'var(--sh-text-sm)',
    }}>
      {text}
    </div>
  );
}

function AccessControl({ onBack }) {
  const teamMembers = [
    { name: 'Jordan', role: 'manager', active: true },
    { name: 'Sarah', role: 'financial', active: true },
  ];

  return (
    <main style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <button
        onClick={onBack}
        style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-muted)',
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          padding: 0,
          fontFamily: 'inherit',
          marginBottom: 'var(--sh-space-3)',
        }}
      >
        ← Back to Workspace
      </button>
      <p style={{
        fontSize: '10px',
        color: 'var(--sh-bronze)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
        marginBottom: '4px',
      }}>
        Access Control
      </p>
      <h2 style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-xl)',
        color: 'var(--sh-text-primary)',
        fontWeight: 400,
        marginBottom: 'var(--sh-space-2)',
      }}>
        Your team
      </h2>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-secondary)',
        lineHeight: 1.55,
        marginBottom: 'var(--sh-space-5)',
      }}>
        You control who sees what. Each person only accesses what their role requires.
      </p>

      {teamMembers.map((m, i) => {
        const role = ROLES.find(r => r.id === m.role);
        return (
          <Card key={i} padding="lg" style={{ marginBottom: 'var(--sh-space-3)' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--sh-space-2)',
            }}>
              <p style={{
                fontSize: 'var(--sh-text-base)',
                fontWeight: 600,
                color: 'var(--sh-text-primary)',
              }}>
                {m.name}
              </p>
              <Tag tone="bronze">{role?.label || m.role}</Tag>
            </div>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-secondary)',
              lineHeight: 1.5,
              marginBottom: '4px',
            }}>
              <strong style={{ color: 'var(--sh-text-primary)' }}>Can see:</strong> {role?.sees}
            </p>
            <p style={{
              fontSize: 'var(--sh-text-xs)',
              color: 'var(--sh-text-muted)',
              lineHeight: 1.5,
            }}>
              <strong style={{ color: 'var(--sh-text-primary)' }}>Cannot see:</strong> {role?.notSees}
            </p>
          </Card>
        );
      })}

      <Button variant="secondary" style={{ width: '100%', marginTop: 'var(--sh-space-3)' }}>
        Invite a team member
      </Button>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        textAlign: 'center',
        marginTop: 'var(--sh-space-2)',
      }}>
        Invite by email with role assignment — coming in the full release
      </p>
    </main>
  );
}
