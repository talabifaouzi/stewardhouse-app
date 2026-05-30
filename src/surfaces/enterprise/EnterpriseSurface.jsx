import { useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Chrome from '../../components/Chrome.jsx';
import UserProfile from '../../components/UserProfile.jsx';
import ContactsDirectory from '../../components/ContactsDirectory.jsx';
import { CommsProvider, useComms } from '../../contexts/CommsContext.jsx';
import { contacts, INST_PROFILES, CURRENT_USER, athletes } from '../../data/enterpriseFixtures.js';

import EnterpriseOverview from './EnterpriseOverview.jsx';
import EnterpriseRoster from './EnterpriseRoster.jsx';
import EnterpriseReports from './EnterpriseReports.jsx';
import EnterpriseCompliance from './EnterpriseCompliance.jsx';
import EnterpriseProgram from './EnterpriseProgram.jsx';
import EnterpriseSetup from './EnterpriseSetup.jsx';

const NAV_ITEMS = [
  { key: 'home', label: 'Overview', path: '/enterprise' },
  { key: 'roster', label: 'Roster', path: '/enterprise/roster' },
  { key: 'reports', label: 'Reports', path: '/enterprise/reports' },
  { key: 'compliance', label: 'Compliance', path: '/enterprise/compliance' },
  { key: 'program', label: 'Program', path: '/enterprise/program' },
  { key: 'setup', label: 'Setup', path: '/enterprise/setup' },
];

const diane = contacts.find((c) => c.id === 'diane');

// Cohort context surfaced in Chrome subtitle: "Cooper State University · 2026–2027"
const _instProfile = INST_PROFILES[0];
const _dateRange = (_instProfile.contract.split(' — ')[1] || '');
const _years = _dateRange.match(/\d{4}/g);
const _yearRange = _years && _years.length >= 2 ? `${_years[0]}–${_years[1]}` : '';
const cohortLabel = `${_instProfile.name} · ${_yearRange}`;

// Recipients list for ComposeMessage autocomplete — 21 entries (16 athletes + 5 contacts).
const recipientsList = [
  ...athletes.map((a) => ({ name: a.name, email: a.email })),
  ...contacts.map((c) => ({ name: c.name, email: c.email })),
];

export default function EnterpriseSurface() {
  return (
    <CommsProvider currentUser={CURRENT_USER} recipients={recipientsList}>
      <EnterpriseSurfaceInner />
    </CommsProvider>
  );
}

function EnterpriseSurfaceInner() {
  const location = useLocation();
  const path = location.pathname;
  const activeNav =
    path.includes('/roster') ? 'roster' :
    path.includes('/reports') ? 'reports' :
    path.includes('/compliance') ? 'compliance' :
    path.includes('/program') ? 'program' :
    path.includes('/setup') ? 'setup' :
    'home';

  const { openCompose } = useComms();
  const [activeContact, setActiveContact] = useState(null);
  const [showContactsDirectory, setShowContactsDirectory] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--sh-bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Chrome
        surface="enterprise"
        userName="Diane Okonkwo"
        userRole="Athletic Department"
        navItems={NAV_ITEMS}
        activeNav={activeNav}
        onUserClick={() => setActiveContact(diane)}
        onContactsClick={() => setShowContactsDirectory(true)}
        surfaceContext={cohortLabel}
      />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route index element={<EnterpriseOverview />} />
          <Route path="roster" element={<EnterpriseRoster />} />
          <Route path="reports/*" element={<EnterpriseReports />} />
          <Route path="compliance" element={<EnterpriseCompliance />} />
          <Route path="program" element={<EnterpriseProgram />} />
          <Route path="setup" element={<EnterpriseSetup />} />
          <Route path="*" element={<Navigate to="/enterprise" replace />} />
        </Routes>
      </div>

      {/* Chrome-level modals — ComposeMessage rendered by CommsProvider */}
      <UserProfile
        isOpen={activeContact !== null}
        onClose={() => setActiveContact(null)}
        contact={activeContact}
        onSendMessage={(c) => {
          setActiveContact(null);
          openCompose(c);
        }}
      />

      <ContactsDirectory
        isOpen={showContactsDirectory}
        onClose={() => setShowContactsDirectory(false)}
        contacts={contacts}
        onContactClick={(c) => {
          setShowContactsDirectory(false);
          setActiveContact(c);
        }}
      />
    </div>
  );
}
