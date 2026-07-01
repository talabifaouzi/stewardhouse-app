import { IntakeProvider, buildInitialStateFromServer, buildInitialGiftsFromServer, buildInitialScenariosFromServer } from '../../contexts/IntakeContext.jsx';
import { useAppIdentity } from '../../contexts/AppIdentityContext.jsx';

// Replaces the static <IntakeProvider initialState={AUTHENTICATED_EMPTY_STATE}>
// wrap at the /app/individual/* route. Reads intake answers, gifts, AND
// saved GivingModeler scenarios that AppShell already fetched (via /api/me,
// once, on mount — no second network call here) and seeds IntakeProvider
// with all three. This is the read side of intake + gift + scenario
// persistence; the write sides are POST /api/intake (Questions.jsx),
// POST /api/gifts (GiveScreen.jsx), and POST /api/scenarios (GivingModeler.jsx).
export default function AuthenticatedIntakeProvider({ children }) {
  const { identity } = useAppIdentity();
  const baseState = buildInitialStateFromServer(identity?.intake ?? null);
  const initialState = {
    ...baseState,
    gifts: buildInitialGiftsFromServer(identity?.gifts ?? []),
    scenarios: buildInitialScenariosFromServer(identity?.scenarios ?? []),
  };
  return <IntakeProvider initialState={initialState}>{children}</IntakeProvider>;
}
