import { IntakeProvider, buildInitialStateFromServer } from '../../contexts/IntakeContext.jsx';
import { useAppIdentity } from '../../contexts/AppIdentityContext.jsx';

// Replaces the static <IntakeProvider initialState={AUTHENTICATED_EMPTY_STATE}>
// wrap at the /app/individual/* route. Reads the intake data AppShell already
// fetched (via /api/me, once, on mount — no second network call here) and
// merges it over the empty defaults before seeding IntakeProvider. This is
// the read side of intake persistence; the write side is the new
// POST /api/intake endpoint (see functions/api/intake.js), wired into
// Questions.jsx in the next slice.
export default function AuthenticatedIntakeProvider({ children }) {
  const { identity } = useAppIdentity();
  const initialState = buildInitialStateFromServer(identity?.intake ?? null);
  return <IntakeProvider initialState={initialState}>{children}</IntakeProvider>;
}
