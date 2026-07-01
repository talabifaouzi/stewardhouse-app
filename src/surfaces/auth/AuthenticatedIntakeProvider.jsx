import { IntakeProvider, buildInitialStateFromServer, buildInitialGiftsFromServer } from '../../contexts/IntakeContext.jsx';
import { useAppIdentity } from '../../contexts/AppIdentityContext.jsx';

// Replaces the static <IntakeProvider initialState={AUTHENTICATED_EMPTY_STATE}>
// wrap at the /app/individual/* route. Reads intake answers AND gifts that
// AppShell already fetched (via /api/me, once, on mount — no second network
// call here) and seeds IntakeProvider with both. This is the read side of
// intake + gift persistence; the write sides are POST /api/intake (wired
// into Questions.jsx) and POST /api/gifts (wired into GiveScreen.jsx).
export default function AuthenticatedIntakeProvider({ children }) {
  const { identity } = useAppIdentity();
  const baseState = buildInitialStateFromServer(identity?.intake ?? null);
  const initialState = {
    ...baseState,
    gifts: buildInitialGiftsFromServer(identity?.gifts ?? []),
  };
  return <IntakeProvider initialState={initialState}>{children}</IntakeProvider>;
}
