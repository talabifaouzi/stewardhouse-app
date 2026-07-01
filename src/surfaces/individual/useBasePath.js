import { useBasePath as sharedUseBasePath } from '../../contexts/AppIdentityContext.jsx';

// Thin no-arg delegate around the shared parameterized useBasePath in
// AppIdentityContext.jsx (§6.11 Advisor path-fix slice extraction).
// Individual's 10 consumer files import from './useBasePath.js' and call
// zero-arg useBasePath() — that public surface is preserved here. Advisor
// imports the shared parameterized version directly from AppIdentityContext.

export function useBasePath() {
  return sharedUseBasePath('/individual', '/app/individual');
}
