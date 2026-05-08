import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Chrome from '../../components/Chrome.jsx';
import { Card } from '../../components/Card.jsx';
import { Tag } from '../../components/Tag.jsx';
import { SectionLabel } from '../../components/SectionLabel.jsx';
import { useIntake } from '../../contexts/IntakeContext.jsx';
import {
  fundingSpotlight,
  microLearning,
  visibilityInsights,
} from '../../data/individualProfile.js';
import { CAUSES } from '../../data/intakeData.js';

// Onboarding flow
import Letter from './Letter.jsx';
import Privacy from './Privacy.jsx';
import Questions from './Questions.jsx';
import GPSReveal from './GPSReveal.jsx';

// Dashboard tabs
import PlanTab from './PlanTab.jsx';
import HistoryTab from './HistoryTab.jsx';
import DiscoverTab from './DiscoverTab.jsx';
import LearnTab from './LearnTab.jsx';
import TeamWorkspace from './TeamWorkspace.jsx';

const NAV_ITEMS = [
  { key: 'home', label: 'Home', path: '/individual' },
  { key: 'plan', label: 'Giving plan', path: '/individual/plan' },
  { key: 'discover', label: 'Discover', path: '/individual/discover' },
  { key: 'learn', label: 'Learn', path: '/individual/learn' },
  { key: 'history', label: 'History', path: '/individual/history' },
  { key: 'team', label: 'Team', path: '/individual/team' },
];

export default function IndividualSurface() {
  return (
    <Routes>
      {/* Onboarding flow — chrome-less, full-screen */}
      <Route path="welcome" element={<Letter />} />
      <Route path="privacy" element={<Privacy />} />
      <Route path="questions" element={<Questions />} />
      <Route path="reveal" element={<GPSReveal />} />

      {/* Dashboard — wrapped in chrome */}
      <Route path="*" element={<DashboardLayout />} />
    </Routes>
  );
}

function DashboardLayout() {
  const location = useLocation();
  const path = location.pathname;

  const activeNav =
    path.includes('/plan') ? 'plan' :
    path.includes('/discover') ? 'discover' :
    path.includes('/learn') ? 'learn' :
    path.includes('/history') ? 'history' :
    path.includes('/team') ? 'team' :
    'home';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--sh-bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Chrome
        surface="individual"
        userName="Marcus Thompson"
        userRole="Member · Athletics"
        navItems={NAV_ITEMS}
        activeNav={activeNav}
      />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route index element={<IndividualHome />} />
          <Route path="plan" element={<PlanTab />} />
          <Route path="discover" element={<DiscoverTab />} />
          <Route path="learn" element={<LearnTab />} />
          <Route path="history" element={<HistoryTab />} />
          <Route path="team" element={<TeamWorkspace />} />
          <Route path="*" element={<Navigate to="/individual" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function IndividualHome() {
  const navigate = useNavigate();
  const [showAllGifts, setShowAllGifts] = useState(false);
  const { answers, gifts, givingStyle, worldLabel, resetIntake } = useIntake();

  const total = gifts.reduce((sum, g) => sum + g.amount, 0);
  const orgCount = new Set(gifts.map(g => g.org)).size;
  const hasGifts = gifts.length > 0;
  const visibility = visibilityInsights[answers.visibility] || visibilityInsights.private;
  const visibleGifts = showAllGifts ? gifts : gifts.slice(0, 3);

  const causeLabels = (answers.causes || []).map(id => {
    const found = CAUSES.find(c => c.id === id);
    return found ? { id, label: found.label } : { id, label: id };
  });

  const paths = [];
  paths.push({
    title: 'Read your giving plan',
    desc: 'Your full plan in your own words. Read it, share it, or keep it close.',
    action: () => navigate('/individual/plan'),
    tone: 'reflect',
  });

  if (hasGifts) {
    paths.push({
      title: 'See your giving picture',
      desc: `$${total.toLocaleString()} given to ${orgCount} ${orgCount === 1 ? 'organization' : 'organizations'}. Here's where you are.`,
      action: () => navigate('/individual/history'),
      tone: 'reflect',
    });
  }

  paths.push({
    title: 'Learn something new',
    desc: 'A quick lesson on giving smarter. 2–4 minutes, no homework.',
    action: () => navigate('/individual/learn'),
    tone: 'learn',
  });

  paths.push({
    title: 'Explore organizations',
    desc: `See what's out there — matched to ${causeLabels[0]?.label?.toLowerCase() || 'what you care about'}.`,
    action: () => navigate('/individual/discover'),
    tone: 'act',
  });

  const restartOnboarding = () => {
    resetIntake();
    navigate('/individual/welcome');
  };

  return (
    <main style={{
      maxWidth: '880px',
      margin: '0 auto',
      padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
    }}>
      {/* Identity anchor */}
      <Card style={{ marginBottom: 'var(--sh-space-3)' }}>
        <p style={{
          fontSize: '10px',
          color: 'var(--sh-bronze)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 600,
          marginBottom: 'var(--sh-space-2)',
        }}>
          {worldLabel}
        </p>
        <div style={{
          display: 'inline-block',
          padding: '5px 14px',
          borderRadius: 'var(--sh-radius-full)',
          background: 'var(--sh-bronze-tint)',
          color: 'var(--sh-bronze-deep)',
          fontSize: 'var(--sh-text-xs)',
          fontWeight: 600,
          marginBottom: 'var(--sh-space-3)',
          letterSpacing: '0.02em',
        }}>
          {givingStyle || 'Intentional Giver'}
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: 'var(--sh-space-3)',
        }}>
          {causeLabels.map(c => (
            <Tag key={c.id}>{c.label}</Tag>
          ))}
        </div>
        {answers.geoDetail && (
          <p style={{
            fontSize: 'var(--sh-text-xs)',
            color: 'var(--sh-text-muted)',
          }}>
            {answers.geoDetail}
          </p>
        )}
      </Card>

      {/* Living pulse stats */}
      {hasGifts ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 'var(--sh-space-2)',
          marginBottom: 'var(--sh-space-3)',
        }}>
          <PulseCard
            value={`$${total.toLocaleString()}`}
            label="Given this year"
            primary
          />
          <PulseCard
            value={orgCount}
            label={orgCount === 1 ? 'Organization' : 'Organizations'}
          />
          <PulseCard
            value={gifts.length}
            label={gifts.length === 1 ? 'Gift logged' : 'Gifts logged'}
          />
        </div>
      ) : (
        <Card tint style={{ marginBottom: 'var(--sh-space-3)' }}>
          <p style={{
            fontSize: 'var(--sh-text-sm)',
            color: 'var(--sh-text-secondary)',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}>
            Your giving picture starts here. When you log your first gift, it'll begin tracking your year.
          </p>
        </Card>
      )}

      {/* Giving history preview */}
      {hasGifts && (
        <div style={{ marginBottom: 'var(--sh-space-5)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--sh-space-2)',
          }}>
            <SectionLabel>Recent gifts</SectionLabel>
            <button
              onClick={() => navigate('/individual/history')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--sh-bronze)',
                fontSize: 'var(--sh-text-xs)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              View all →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {visibleGifts.map(g => (
              <GiftRow key={g.id} gift={g} />
            ))}
          </div>
        </div>
      )}

      {/* Paths forward */}
      <div style={{ marginBottom: 'var(--sh-space-5)' }}>
        <SectionLabel>When you're ready</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sh-space-2)' }}>
          {paths.map((p, i) => (
            <PathCard key={i} path={p} />
          ))}
        </div>
      </div>

      {/* Worth knowing */}
      <Card tint style={{ marginBottom: 'var(--sh-space-3)' }}>
        <p style={{
          fontSize: '10px',
          color: 'var(--sh-bronze)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          marginBottom: 'var(--sh-space-2)',
        }}>
          Worth knowing
        </p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-body)',
          lineHeight: 1.6,
        }}>
          {microLearning}
        </p>
      </Card>

      {/* Visibility insight */}
      <Card style={{ marginBottom: 'var(--sh-space-3)' }}>
        <p style={{
          fontSize: '10px',
          color: 'var(--sh-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          marginBottom: 'var(--sh-space-2)',
        }}>
          {visibility.title}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-body)',
          lineHeight: 1.6,
        }}>
          {visibility.text}
        </p>
      </Card>

      {/* Funding spotlight */}
      <Card style={{
        marginBottom: 'var(--sh-space-3)',
        borderTop: '2px solid var(--sh-bronze)',
      }}>
        <p style={{
          fontSize: '10px',
          color: 'var(--sh-bronze-deep)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          marginBottom: 'var(--sh-space-2)',
        }}>
          Funding spotlight
        </p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-body)',
          lineHeight: 1.6,
          marginBottom: 'var(--sh-space-2)',
        }}>
          {fundingSpotlight.text}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
          fontStyle: 'italic',
        }}>
          Source:{' '}
          <a
            href={fundingSpotlight.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--sh-bronze)',
              textDecoration: 'underline',
            }}
          >
            {fundingSpotlight.source}
          </a>
        </p>
      </Card>

      {/* Gentle close */}
      <p style={{
        textAlign: 'center',
        fontSize: 'var(--sh-text-sm)',
        color: 'var(--sh-text-muted)',
        fontStyle: 'italic',
        marginTop: 'var(--sh-space-6)',
        marginBottom: 'var(--sh-space-4)',
      }}>
        No rush. Your giving plan is here whenever you need it.
      </p>

      {/* Demo viewer entry */}
      <p style={{
        textAlign: 'center',
        marginTop: 'var(--sh-space-4)',
      }}>
        <button
          onClick={restartOnboarding}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--sh-text-muted)',
            fontSize: 'var(--sh-text-xs)',
            fontStyle: 'italic',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          See the new-user onboarding flow →
        </button>
      </p>
    </main>
  );
}

function PulseCard({ value, label, primary }) {
  if (primary) {
    return (
      <div style={{
        background: 'var(--sh-bronze)',
        borderRadius: 'var(--sh-radius-lg)',
        padding: 'var(--sh-space-4)',
      }}>
        <p style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-2xl)',
          color: '#FFFFFF',
          fontWeight: 400,
          marginBottom: '2px',
        }}>
          {value}
        </p>
        <p style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.75)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 500,
        }}>
          {label}
        </p>
      </div>
    );
  }

  return (
    <Card padding="sm">
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-2xl)',
        color: 'var(--sh-text-primary)',
        marginBottom: '2px',
      }}>
        {value}
      </p>
      <p style={{
        fontSize: '10px',
        color: 'var(--sh-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 500,
      }}>
        {label}
      </p>
    </Card>
  );
}

function GiftRow({ gift }) {
  const meta = [];
  if (gift.type && gift.type !== 'unrestricted') meta.push(gift.type);
  if (gift.vehicle && gift.vehicle !== 'personal') {
    meta.push(gift.vehicle === 'daf' ? 'DAF' : 'Community Foundation');
  }
  if (gift.recurring) meta.push('Recurring');
  const metaString = [gift.date, ...meta].join(' · ');

  return (
    <div style={{
      background: 'var(--sh-card)',
      border: 'var(--sh-border-thin)',
      borderRadius: 'var(--sh-radius-md)',
      padding: 'var(--sh-space-3) var(--sh-space-4)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 'var(--sh-space-3)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-primary)',
          fontWeight: 500,
          marginBottom: '2px',
        }}>
          {gift.org}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-muted)',
        }}>
          {metaString}
        </p>
      </div>
      <p style={{
        fontFamily: 'var(--sh-font-serif)',
        fontSize: 'var(--sh-text-lg)',
        color: 'var(--sh-bronze-deep)',
        fontWeight: 400,
      }}>
        ${gift.amount.toLocaleString()}
      </p>
    </div>
  );
}

function PathCard({ path }) {
  const [hovered, setHovered] = useState(false);

  const toneColors = {
    reflect: { bg: 'var(--sh-bg-tint)', border: 'var(--sh-card-border)' },
    learn: { bg: '#FBF5E5', border: '#E8DDB8' },
    act: { bg: 'var(--sh-bronze-tint)', border: 'var(--sh-bronze-border)' },
  };
  const tone = toneColors[path.tone] || toneColors.reflect;

  return (
    <div
      onClick={path.action}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: tone.bg,
        border: `1px solid ${hovered ? 'var(--sh-bronze)' : tone.border}`,
        borderRadius: 'var(--sh-radius-lg)',
        padding: 'var(--sh-space-4) var(--sh-space-5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--sh-space-4)',
        cursor: 'pointer',
        transition: 'all 180ms ease',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hovered ? '0 4px 12px rgba(60, 50, 30, 0.05)' : 'none',
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-primary)',
          fontWeight: 500,
          marginBottom: '2px',
        }}>
          {path.title}
        </p>
        <p style={{
          fontSize: 'var(--sh-text-xs)',
          color: 'var(--sh-text-secondary)',
          lineHeight: 1.5,
        }}>
          {path.desc}
        </p>
      </div>
      <span style={{
        fontSize: 'var(--sh-text-md)',
        color: 'var(--sh-bronze)',
        transform: hovered ? 'translateX(2px)' : 'translateX(0)',
        transition: 'transform 180ms ease',
      }}>
        →
      </span>
    </div>
  );
}
