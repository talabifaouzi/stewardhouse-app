import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './surfaces/landing/Landing.jsx';
import IndividualSurface from './surfaces/individual/IndividualSurface.jsx';
import EnterpriseSurface from './surfaces/enterprise/EnterpriseSurface.jsx';
import AdvisorSurface from './surfaces/advisor/AdvisorSurface.jsx';
import OperationsSurface from './surfaces/operations/OperationsSurface.jsx';
import SignIn from './surfaces/auth/SignIn.jsx';
import AppShell from './surfaces/auth/AppShell.jsx';
import AppDispatcher from './surfaces/auth/AppDispatcher.jsx';
import AuthenticatedIntakeProvider from './surfaces/auth/AuthenticatedIntakeProvider.jsx';
import { IntakeProvider } from './contexts/IntakeContext.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/individual/*"
        element={
          <IntakeProvider>
            <IndividualSurface />
          </IntakeProvider>
        }
      />
      <Route path="/enterprise/*" element={<EnterpriseSurface />} />
      <Route path="/advisor/*" element={<AdvisorSurface />} />
      <Route path="/operations/*" element={<OperationsSurface />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<AppDispatcher />} />
        <Route
          path="individual/*"
          element={
            <AuthenticatedIntakeProvider>
              <IndividualSurface />
            </AuthenticatedIntakeProvider>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
