import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './surfaces/landing/Landing.jsx';
import IndividualSurface from './surfaces/individual/IndividualSurface.jsx';
import EnterpriseSurface from './surfaces/enterprise/EnterpriseSurface.jsx';
import AdvisorSurface from './surfaces/advisor/AdvisorSurface.jsx';
import OperationsSurface from './surfaces/operations/OperationsSurface.jsx';
import SignIn from './surfaces/auth/SignIn.jsx';
import AppEntry from './surfaces/auth/AppEntry.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/individual/*" element={<IndividualSurface />} />
      <Route path="/enterprise/*" element={<EnterpriseSurface />} />
      <Route path="/advisor/*" element={<AdvisorSurface />} />
      <Route path="/operations/*" element={<OperationsSurface />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/app/*" element={<AppEntry />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
