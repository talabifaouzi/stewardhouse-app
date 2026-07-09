import { useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Chrome from '../../components/Chrome.jsx';
import UserProfile from '../../components/UserProfile.jsx';
import ContactsDirectory from '../../components/ContactsDirectory.jsx';
import { CommsProvider, useComms } from '../../contexts/CommsContext.jsx';
import { AthletesProvider } from '../../contexts/AthletesContext.jsx';
import { WorkshopsProvider } from '../../contexts/WorkshopsContext.jsx';
import { ComplianceProvider } from '../../contexts/ComplianceContext.jsx';
import { useBasePath, useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { contacts, INST_PROFILES, CURRENT_USER, athletes } from '../../data/enterpriseFixtures.js';

import EnterpriseOverview from './EnterpriseOverview.jsx';
import EnterpriseRoster from './EnterpriseRoster.jsx';
import EnterpriseReports from './EnterpriseReports.jsx';
import EnterpriseCompliance from './EnterpriseCompliance.jsx';
import EnterpriseProgram from './EnterpriseProgram.jsx';
import EnterpriseSetup from './EnterpriseSetup.jsx';

function getNavItems(basePath) {
  return [
    { key: 'home', label: 'Overview', path: basePath },
    { key: 'roster', label: 'Roster', path: `${basePath}/roster` },
    { key: 'reports', label: 'Reports', path: `${basePath}/reports` },
    { key: 'compliance', label: 'Compliance', path: `${basePath}/compliance` },
    { key: 'program', label: 'Program', path: `${basePath}/program` },
    { key: 'setup', label: 'Setup', path: `${basePath}/setup` },
  ];
}

const diane = contacts.find((c) => c.id === 'diane');

// Chrome subtitle: "<institution> · <startYear>–<endYear>", parsed from a
// contract/term string. Shared by the demo-tree fixture derivation (below)
// and the authenticated-tree derivation in component scope — the auth tree
// passes enterprise.institutionName + enterprise.programTerm from /api/me.
function buildCohortLabel(name, term) {
  const dateRange = (term || '').split(' — ')[1] || '';
  const years = dateRange.match(/\d{4}/g);
  const yearRange = years && years.length >= 2 ? `${years[0]}–${years[1]}` : '';
  return `${name} · ${yearRange}`;
}

// Demo-tree subtitle (fixture): "Cooper State University · <years>".
const cohortLabel = buildCohortLabel(INST_PROFILES[0].name, INST_PROFILES[0].contract);

// ComposeMessage autocomplete recipients. Demo tree: 21 entries (16 athletes +
// 5 contacts). Authenticated tree: contacts only — the athlete roster is empty
// until the roster-add write path (slim-seed ruling), and contacts stay fixture
// for now (Compose is demonstrative per the scoping note; contacts-isolation
// deferred past 6a).
const contactsRecipients = contacts.map((c) => ({ name: c.name, email: c.email }));
const allRecipients = [
  ...athletes.map((a) => ({ name: a.name, email: a.email })),
  ...contactsRecipients,
];

export default function EnterpriseSurface() {
  // useOptionalAppIdentity in the OUTER component too: CommsProvider +
  // AthletesProvider both live here (above EnterpriseSurfaceInner), so the
  // identity/data swaps read identity at this level. Null on the public demo
  // tree.
  const appIdentity = useOptionalAppIdentity();
  const isAuthenticated = !!appIdentity;
  // Data-isolation gate keys on identity TYPE, never on whether server data
  // arrived (advisor defensive-seam lesson). On the authenticated tree
  // (RequireType('staff')) type is always 'staff'; the explicit check is
  // belt-and-braces against a future non-staff mount.
  const isStaff = appIdentity?.identity?.type === 'staff';
  // CommsProvider sender identity: real identity on the authenticated tree,
  // Diane fixture on the demo tree.
  const commsUser = isAuthenticated
    ? { name: appIdentity.identity?.displayName ?? '', email: appIdentity.identity?.email ?? '' }
    : CURRENT_USER;
  // Authenticated tree seeds the roster from the /api/me enterprise block
  // (empty [] until athletes are enrolled). Demo tree passes undefined → the
  // provider's fixture default. Keying on isStaff (identity type), not on
  // whether the roster array is present — the defensive-seam lesson.
  const rosterInitialState = isStaff ? (appIdentity?.identity?.enterprise?.athletes ?? []) : undefined;
  // Workshops fold-in seeds the same way (E-Write-3a): server array on the
  // authenticated staff tree (empty [] until scheduled), fixture default on the
  // demo tree. Keyed on isStaff (identity type), never on data — the
  // defensive-seam lesson.
  const workshopsInitialState = isStaff ? (appIdentity?.identity?.enterprise?.workshops ?? []) : undefined;
  // Compliance fold-in (E-Write-4): exclusions + audit from /api/me on the staff
  // tree, fixture default on demo. Keyed on isStaff (identity type), never on data.
  const complianceInitialState = isStaff
    ? {
        exclusions: appIdentity?.identity?.enterprise?.exclusions ?? [],
        audit: appIdentity?.identity?.enterprise?.complianceAudit ?? [],
      }
    : undefined;
  return (
    <CommsProvider currentUser={commsUser} recipients={isStaff ? contactsRecipients : allRecipients}>
      <AthletesProvider initialState={rosterInitialState}>
        <WorkshopsProvider initialState={workshopsInitialState}>
          <ComplianceProvider initialState={complianceInitialState}>
            <EnterpriseSurfaceInner />
          </ComplianceProvider>
        </WorkshopsProvider>
      </AthletesProvider>
    </CommsProvider>
  );
}

function EnterpriseSurfaceInner() {
  const location = useLocation();
  const basePath = useBasePath('/enterprise', '/app/enterprise');
  const navItems = getNavItems(basePath);
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

  // Chrome identity swap (E-Slice 5b), mirroring AdvisorSurface: fixture
  // fallback ONLY on the public demo tree; the authenticated tree renders
  // real identity (or '' / null), never Diane.
  const appIdentity = useOptionalAppIdentity();
  const isAuthenticated = !!appIdentity;
  const enterpriseIdentity = appIdentity?.identity?.enterprise ?? null;
  const authenticatedName = appIdentity?.identity?.displayName ?? null;
  const authenticatedRole = enterpriseIdentity?.roleTitle ?? null;
  const userName = authenticatedName ?? (isAuthenticated ? '' : CURRENT_USER.name);
  const userRole = authenticatedRole ?? (isAuthenticated ? null : CURRENT_USER.title);
  const surfaceContext = isAuthenticated
    ? (enterpriseIdentity?.institutionName
        ? buildCohortLabel(enterpriseIdentity.institutionName, enterpriseIdentity.programTerm)
        : null)
    : cohortLabel;
  // onUserClick target: real-identity contact on the auth tree (ruled),
  // Diane fixture on the demo tree — the fixture must never surface for a
  // real operator.
  const selfContact = isAuthenticated
    ? {
        name: authenticatedName,
        title: authenticatedRole,
        organization: enterpriseIdentity?.institutionName ?? null,
        email: appIdentity.identity?.email ?? null,
      }
    : diane;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--sh-bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Chrome
        surface="enterprise"
        userName={userName}
        userRole={userRole}
        navItems={navItems}
        activeNav={activeNav}
        onUserClick={() => setActiveContact(selfContact)}
        onContactsClick={() => setShowContactsDirectory(true)}
        surfaceContext={surfaceContext}
      />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route index element={<EnterpriseOverview />} />
          <Route path="roster" element={<EnterpriseRoster />} />
          <Route path="reports/*" element={<EnterpriseReports />} />
          <Route path="compliance" element={<EnterpriseCompliance />} />
          <Route path="program" element={<EnterpriseProgram />} />
          <Route path="setup" element={<EnterpriseSetup />} />
          <Route path="*" element={<Navigate to={basePath} replace />} />
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
