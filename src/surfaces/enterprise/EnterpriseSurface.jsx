import { useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Chrome from '../../components/Chrome.jsx';
import UserProfile from '../../components/UserProfile.jsx';
import ContactsDirectory from '../../components/ContactsDirectory.jsx';
import ComposeMessage from '../../components/ComposeMessage.jsx';
import { contacts } from '../../data/enterpriseFixtures.js';

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

export default function EnterpriseSurface() {
  const location = useLocation();
  const path = location.pathname;
  const activeNav =
    path.includes('/roster') ? 'roster' :
    path.includes('/reports') ? 'reports' :
    path.includes('/compliance') ? 'compliance' :
    path.includes('/program') ? 'program' :
    path.includes('/setup') ? 'setup' :
    'home';

  const [activeContact, setActiveContact] = useState(null);
  const [showContactsDirectory, setShowContactsDirectory] = useState(false);
  const [composingTo, setComposingTo] = useState(null);

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

      {/* Chrome-level modals */}
      <UserProfile
        isOpen={activeContact !== null}
        onClose={() => setActiveContact(null)}
        contact={activeContact}
        onSendMessage={(c) => {
          setActiveContact(null);
          setComposingTo({ name: c.name, email: c.email });
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

      <ComposeMessage
        isOpen={composingTo !== null}
        onClose={() => setComposingTo(null)}
        recipient={composingTo}
      />
    </div>
  );
}
