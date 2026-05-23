import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Chrome from '../../components/Chrome.jsx';
import { PracticeContentProvider } from '../../contexts/PracticeContentContext.jsx';
import { advisorPracticeProfile } from '../../data/clients.js';

import PracticeHome from './PracticeHome.jsx';
import ClientRoster from './ClientRoster.jsx';
import ClientWorkspace from './ClientWorkspace.jsx';
import CurriculumLibrary from './CurriculumLibrary.jsx';
import LessonDetail from './LessonDetail.jsx';
import LessonEditor from './LessonEditor.jsx';
import CohortSpace from './CohortSpace.jsx';
import Pipeline from './Pipeline.jsx';
import Documentation from './Documentation.jsx';
import PracticeSettings from './PracticeSettings.jsx';

const NAV_ITEMS = [
  { key: 'home', label: 'Practice', path: '/advisor' },
  { key: 'roster', label: 'Clients', path: '/advisor/clients' },
  { key: 'curriculum', label: 'Curriculum', path: '/advisor/curriculum' },
  { key: 'cohorts', label: 'Cohorts', path: '/advisor/cohorts' },
  { key: 'pipeline', label: 'Pipeline', path: '/advisor/pipeline' },
  { key: 'docs', label: 'Documentation', path: '/advisor/docs' },
  { key: 'settings', label: 'Settings', path: '/advisor/settings' },
];

export default function AdvisorSurface() {
  const location = useLocation();
  const path = location.pathname;
  const activeNav =
    path.includes('/clients') ? 'roster' :
    path.includes('/curriculum') ? 'curriculum' :
    path.includes('/cohorts') ? 'cohorts' :
    path.includes('/pipeline') ? 'pipeline' :
    path.includes('/docs') ? 'docs' :
    path.includes('/settings') ? 'settings' :
    'home';

  return (
    <PracticeContentProvider>
      <div style={{
        minHeight: '100vh',
        background: 'var(--sh-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Chrome
          surface="advisor"
          userName={advisorPracticeProfile.advisorName}
          userRole={advisorPracticeProfile.advisorTitle}
          navItems={NAV_ITEMS}
          activeNav={activeNav}
        />

        <div style={{ flex: 1 }}>
          <Routes>
            <Route index element={<PracticeHome />} />
            <Route path="clients" element={<ClientRoster />} />
            <Route path="clients/:clientId" element={<ClientWorkspace />} />
            <Route path="curriculum" element={<CurriculumLibrary />} />
            <Route path="curriculum/new" element={<LessonEditor mode="author" />} />
            <Route path="curriculum/:lessonId" element={<LessonDetail />} />
            <Route path="curriculum/:lessonId/fork" element={<LessonEditor mode="fork" />} />
            <Route path="curriculum/:lessonId/edit" element={<LessonEditor mode="edit" />} />
            <Route path="cohorts" element={<CohortSpace />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="docs" element={<Documentation />} />
            <Route path="settings" element={<PracticeSettings />} />
            <Route path="*" element={<Navigate to="/advisor" replace />} />
          </Routes>
        </div>
      </div>
    </PracticeContentProvider>
  );
}
