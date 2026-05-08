import { useState } from 'react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Tag } from '../../components/Tag.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';

const ROLES = [
  {
    id: 'advisor',
    label: 'Philanthropic Advisor',
    sees: 'Your plan, your giving history, organizations you save, and lesson progress',
    notSees: 'Your private notes, financial account details, or anything you mark personal',
  },
  {
    id: 'manager',
    label: 'Business Manager',
    sees: 'Giving totals, vehicle breakdown, and tax-relevant records (CPA-ready exports)',
    notSees: 'Your personal reflections, plan narrative, or organizations you\'re privately considering',
  },
  {
    id: 'financial',
    label: 'Financial Advisor / CPA',
    sees: 'Annual giving summaries, gift records, vehicle allocations, and tax exports',
    notSees: 'Your plan narrative, lesson activity, or selective relationships',
  },
  {
    id: 'family',
    label: 'Family Member',
    sees: 'Whatever you choose to share — fully customizable',
    notSees: 'Anything you mark private',
  },
  {
    id: 'guardian',
    label: 'Parent / Guardian',
    sees: 'Plan and giving activity (when authority is shared)',
    notSees: 'Your private notes',
  },
];

const SAMPLE_ACTIVITY = [
  { who: 'Jordan', role: 'manager', action: 'reviewed your 2026 summary', when: '2 days ago' },
  { who: 'Sarah', role: 'financial', action: 'pulled CPA export for Q3', when: 'last week' },
  { who: 'Jordan', role: 'manager', action: 'flagged a recurring gift for renewal', when: 'last week' },
];

export default function TeamWorkspace() {
  const { answers: a } = useIntake();
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Jordan Reeves', role: 'manager', email: 'jordan@example.com', active: true },
    { id: 2, name: 'Sarah Chen', role: 'financial', email: 'sarah@example.com', active: true },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'manager' });

  const removeMember = (id) => {
    if (window.confirm('Remove this team member? They\'ll lose access immediately.')) {
      setTeamMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  const addMember = () => {
    if (!newMember.name.trim() || !newMember.email.trim()) return;
    setTeamMembers(prev => [
      ...prev,
      { id: Date.now(), ...newMember, active: false },
    ]);
    setNewMember({ name: '', email: '', role: 'manager' });
    setShowAddForm(false);
  };

  const isCollaborative = a.authority === 'guardian' || a.authority === 'team' || a.authority === 'family_input';

  return (
    <main style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-6) var(--sh-space-16)',
    }}>
      <p style={{
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-bronze)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
        marginBottom: 'var(--sh-space-2)',
      }}>
        Team Workspace
      </p>
      <h1 style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        marginBottom: 'var(--sh-space-2)',
        fontWeight: 400,
      }}>
        Who can see what
      </h1>
      <p style={{
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-secondary)',
        marginBottom: 'var(--sh-space-6)',
        lineHeight: 1.6,
      }}>
        You control access. Each person on your team only sees what their role requires. Your plan stays yours — they help with the parts they're hired to handle.
      </p>

      {/* Authority context */}
      {!isCollaborative && (
        <Card tint padding="md" style={{ marginBottom: 'var(--sh-space-4)' }}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-body)',
            lineHeight: 1.6,
          }}>
            <span style={{ fontWeight: 600, color: 'var(--sh-text-primary)' }}>You make your own decisions.</span>{' '}
            That's what your plan reflects. The team workspace is here in case that ever changes — or if you choose to invite a CPA, advisor, or family member to help with logistics.
          </p>
        </Card>
      )}

      {/* Team members */}
      <p style={{
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--sh-text-primary)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 'var(--sh-space-3)',
      }}>
        Your team ({teamMembers.length})
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-2)', marginBottom: 'var(--sh-space-4)' }}>
        {teamMembers.map(member => {
          const role = ROLES.find(r => r.id === member.role);
          return (
            <Card key={member.id} padding="md">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 'var(--sh-space-3)',
                marginBottom: 'var(--sh-space-2)',
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: 'var(--sh-text-base)',
                    fontWeight: 600,
                    color: 'var(--sh-text-primary)',
                    marginBottom: '2px',
                  }}>
                    {member.name}
                  </p>
                  <p style={{
                    fontSize: 'var(--sh-text-xs)',
                    color: 'var(--sh-text-muted)',
                  }}>
                    {member.email}
                  </p>
                </div>
                <Tag accent>{role?.label || member.role}</Tag>
              </div>
              <div style={{
                paddingTop: 'var(--sh-space-2)',
                borderTop: 'var(--sh-border-divider)',
                marginTop: 'var(--sh-space-2)',
              }}>
                <p style={{
                  fontSize: '10px',
                  color: 'var(--sh-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                  marginBottom: '2px',
                }}>
                  Can see
                </p>
                <p style={{
                  fontSize: 'var(--sh-text-xs)',
                  color: 'var(--sh-text-body)',
                  lineHeight: 1.55,
                  marginBottom: 'var(--sh-space-2)',
                }}>
                  {role?.sees}
                </p>
                <p style={{
                  fontSize: '10px',
                  color: 'var(--sh-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                  marginBottom: '2px',
                }}>
                  Cannot see
                </p>
                <p style={{
                  fontSize: 'var(--sh-text-xs)',
                  color: 'var(--sh-text-body)',
                  lineHeight: 1.55,
                  marginBottom: 'var(--sh-space-3)',
                }}>
                  {role?.notSees}
                </p>
                <div style={{ display: 'flex', gap: 'var(--sh-space-2)' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => alert(`Message ${member.name} (coming soon)`)}
                  >
                    Send message
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMember(member.id)}
                    style={{ color: 'var(--sh-text-muted)' }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add member */}
      {!showAddForm ? (
        <Button
          variant="secondary"
          onClick={() => setShowAddForm(true)}
          style={{ width: '100%', marginBottom: 'var(--sh-space-5)' }}
        >
          + Invite a team member
        </Button>
      ) : (
        <Card padding="lg" style={{ marginBottom: 'var(--sh-space-5)' }}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            fontWeight: 600,
            color: 'var(--sh-text-primary)',
            marginBottom: 'var(--sh-space-3)',
          }}>
            Invite a team member
          </p>
          <input
            value={newMember.name}
            onChange={e => setNewMember({ ...newMember, name: e.target.value })}
            placeholder="Full name"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--sh-radius-md)',
              border: '2px solid var(--sh-card-border)',
              fontSize: 'var(--sh-text-sm)',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
              background: 'var(--sh-bg)',
              marginBottom: 'var(--sh-space-2)',
            }}
          />
          <input
            type="email"
            value={newMember.email}
            onChange={e => setNewMember({ ...newMember, email: e.target.value })}
            placeholder="Email"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--sh-radius-md)',
              border: '2px solid var(--sh-card-border)',
              fontSize: 'var(--sh-text-sm)',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
              background: 'var(--sh-bg)',
              marginBottom: 'var(--sh-space-2)',
            }}
          />
          <select
            value={newMember.role}
            onChange={e => setNewMember({ ...newMember, role: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--sh-radius-md)',
              border: '2px solid var(--sh-card-border)',
              fontSize: 'var(--sh-text-sm)',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
              background: 'var(--sh-bg)',
              marginBottom: 'var(--sh-space-3)',
            }}
          >
            {ROLES.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 'var(--sh-space-2)' }}>
            <Button variant="primary" size="sm" onClick={addMember} style={{ flex: 1 }}>
              Send invite
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowAddForm(false); setNewMember({ name: '', email: '', role: 'manager' }); }}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Activity log */}
      <p style={{
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--sh-text-primary)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 'var(--sh-space-3)',
      }}>
        Recent team activity
      </p>
      <Card padding="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-3)' }}>
          {SAMPLE_ACTIVITY.map((item, i) => (
            <div
              key={i}
              style={{
                paddingBottom: i < SAMPLE_ACTIVITY.length - 1 ? 'var(--sh-space-3)' : 0,
                borderBottom: i < SAMPLE_ACTIVITY.length - 1 ? 'var(--sh-border-divider)' : 'none',
              }}
            >
              <p style={{
                fontSize: 'var(--sh-text-sm)',
                color: 'var(--sh-text-body)',
                lineHeight: 1.5,
                marginBottom: '2px',
              }}>
                <span style={{ fontWeight: 600, color: 'var(--sh-text-primary)' }}>
                  {item.who}
                </span>
                {' '}{item.action}
              </p>
              <p style={{
                fontSize: 'var(--sh-text-xs)',
                color: 'var(--sh-text-muted)',
              }}>
                {item.when}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <p style={{
        textAlign: 'center',
        fontSize: 'var(--sh-text-xs)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        marginTop: 'var(--sh-space-6)',
      }}>
        Team access can be revoked at any time. They'll lose visibility immediately.
      </p>
    </main>
  );
}
