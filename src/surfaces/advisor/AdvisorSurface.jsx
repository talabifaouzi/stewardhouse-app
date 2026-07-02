import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Chrome from '../../components/Chrome.jsx';
import { PracticeContentProvider } from '../../contexts/PracticeContentContext.jsx';
import { DocumentationProvider } from '../../contexts/DocumentationContext.jsx';
import { CohortsProvider } from '../../contexts/CohortsContext.jsx';
import { ClientsProvider } from '../../contexts/ClientsContext.jsx';
import { useBasePath, useOptionalAppIdentity } from '../../contexts/AppIdentityContext.jsx';
import { advisorPracticeProfile } from '../../data/clients.js';

import PracticeHome from './PracticeHome.jsx';
import ClientRoster from './ClientRoster.jsx';
import ClientWorkspace from './ClientWorkspace.jsx';
import CurriculumLibrary from './CurriculumLibrary.jsx';
import LessonDetail from './LessonDetail.jsx';
import LessonEditor from './LessonEditor.jsx';
import DraftsList from './DraftsList.jsx';
import CohortSpace from './CohortSpace.jsx';
import CohortDetail from './CohortDetail.jsx';
import Pipeline from './Pipeline.jsx';
import Documentation from './Documentation.jsx';
import DocCreate from './DocCreate.jsx';
import DocDetail from './DocDetail.jsx';
import PracticeSettings from './PracticeSettings.jsx';

function getNavItems(basePath) {
  return [
    { key: 'home', label: 'Practice', path: basePath },
    { key: 'roster', label: 'Clients', path: `${basePath}/clients` },
    { key: 'curriculum', label: 'Curriculum', path: `${basePath}/curriculum` },
    { key: 'cohorts', label: 'Cohorts', path: `${basePath}/cohorts` },
    { key: 'pipeline', label: 'Pipeline', path: `${basePath}/pipeline` },
    { key: 'docs', label: 'Documentation', path: `${basePath}/docs` },
    { key: 'settings', label: 'Settings', path: `${basePath}/settings` },
  ];
}

export default function AdvisorSurface() {
  const location = useLocation();
  const basePath = useBasePath('/advisor', '/app/advisor');
  const navItems = getNavItems(basePath);
  const path = location.pathname;
  const activeNav =
    path.includes('/clients') ? 'roster' :
    path.includes('/curriculum') ? 'curriculum' :
    path.includes('/cohorts') ? 'cohorts' :
    path.includes('/pipeline') ? 'pipeline' :
    path.includes('/docs') ? 'docs' :
    path.includes('/settings') ? 'settings' :
    'home';

  // Chrome identity + provider seeding both derive from appIdentity here.
  // Public demo tree: appIdentity is null (no AppIdentityProvider
  // ancestor), so advisorData is null, initialState resolves to undefined,
  // and the two providers seed from their own fixture defaults
  // (practiceContentSeed + structuredClone(seedCategories)).
  // Authenticated tree (/app/advisor/*): appIdentity carries Morgan's
  // real identity + advisor payload from AppShell's single /api/me fetch,
  // and the same providers below get initialState arrays so consumers via
  // usePracticeContent() / useDocumentation() see the server data.
  //
  // The `?? undefined` is deliberate: a null initialState would still fall
  // through to the fixture default via each provider's own `?? seed`
  // guard, but undefined keeps the "prop not passed" semantics clean and
  // matches how the demo tree renders identically to before.
  //
  // Chrome identity swap mirrors IndividualSurface's pattern:
  // AppIdentityContext.identity.displayName + extensions.advisor.advisorTitle,
  // falling back to the fixture advisorPracticeProfile.
  const appIdentity = useOptionalAppIdentity();
  const advisorData = appIdentity?.identity?.advisor ?? null;
  const authenticatedName = appIdentity?.identity?.displayName ?? null;
  const authenticatedTitle = advisorData?.practiceProfile?.advisorTitle ?? null;
  const userName = authenticatedName ?? advisorPracticeProfile.advisorName;
  const userRole = authenticatedTitle ?? advisorPracticeProfile.advisorTitle;

  // Cohorts + clients providers land on this surface too (slice 2 fold-in):
  //  - Cohorts: seed from identity.advisor.cohorts on auth (Morgan's 2
  //    cohorts w/ memberIds:[] per Q7 gate), fixture on demo. Same shape
  //    as the other two providers above.
  //  - Clients: Q7-gated — authenticated initialState is ALWAYS []
  //    (no server client rows until write endpoints open). Demo tree
  //    falls through to fixture via `?? undefined`. Distinguishes trees
  //    by presence-of-advisorData rather than a specific field.
  return (
    <PracticeContentProvider initialState={advisorData?.practiceLessons ?? undefined}>
      <DocumentationProvider initialState={advisorData?.docCategories ?? undefined}>
       <CohortsProvider initialState={advisorData?.cohorts ?? undefined}>
        <ClientsProvider initialState={advisorData ? [] : undefined}>
        <div style={{
          minHeight: '100vh',
          background: 'var(--sh-bg)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Chrome
            surface="advisor"
            userName={userName}
            userRole={userRole}
            navItems={navItems}
            activeNav={activeNav}
          />

          <div style={{ flex: 1 }}>
            <Routes>
              <Route index element={<PracticeHome />} />
              <Route path="clients" element={<ClientRoster />} />
              <Route path="clients/:clientId" element={<ClientWorkspace />} />
              <Route path="curriculum" element={<CurriculumLibrary />} />
              <Route path="curriculum/new" element={<LessonEditor mode="author" />} />
              <Route path="curriculum/drafts" element={<DraftsList />} />
              <Route path="curriculum/:lessonId" element={<LessonDetail />} />
              <Route path="curriculum/:lessonId/fork" element={<LessonEditor mode="fork" />} />
              <Route path="curriculum/:lessonId/edit" element={<LessonEditor mode="edit" />} />
              <Route path="cohorts" element={<CohortSpace />} />
              <Route path="cohorts/:cohortId" element={<CohortDetail />} />
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="docs" element={<Documentation />} />
              <Route path="docs/new" element={<DocCreate />} />
              <Route path="docs/:docId" element={<DocDetail />} />
              <Route path="settings" element={<PracticeSettings />} />
              <Route path="*" element={<Navigate to={basePath} replace />} />
            </Routes>
          </div>
        </div>
        </ClientsProvider>
       </CohortsProvider>
      </DocumentationProvider>
    </PracticeContentProvider>
  );
}
