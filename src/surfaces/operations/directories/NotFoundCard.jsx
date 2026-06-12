import { Card } from '../../../components/Card.jsx';
import BackLink from '../../../components/BackLink.jsx';

// Shared "Record not found" content-card used by every detail page in the
// detail-routes arc. Extracted in slice 2 (same threshold-on-second-use logic
// that gave us sourceAccents.js): InstitutionDetail had it inlined in slice 1;
// AdvisorPracticeDetail needs it; OrganizationDetail and IndividualDetail in
// slices 3–4 will need it too. Each caller passes its own dirPath + dirLabel
// so the back-link points to the right directory.
//
// Not a full-page 404 — a content-area card, consistent with the bundle-3
// "no fake affordance" discipline. Plain language; no icons; no "coming soon"
// promise; no "go home" button.

const MONO_ID_STYLE = {
  fontFamily: 'var(--sh-font-mono)',
  fontSize: 'var(--sh-text-xs)',
  color: 'var(--sh-text-muted)',
};

export default function NotFoundCard({ kind, id, dirPath, dirLabel }) {
  return (
    <main style={{
      maxWidth: 'var(--sh-content-max)',
      margin: '0 auto',
      padding: 'var(--sh-space-10) var(--sh-space-8) var(--sh-space-16)',
    }}>
      <BackLink to={dirPath} label={dirLabel} />
      <Card>
        <p style={{
          fontFamily: 'var(--sh-font-serif)',
          fontSize: 'var(--sh-text-xl)',
          color: 'var(--sh-text-primary)',
          margin: 0,
          marginBottom: 'var(--sh-space-3)',
        }}>
          Record not found.
        </p>
        <p style={{
          fontSize: 'var(--sh-text-sm)',
          color: 'var(--sh-text-secondary)',
          margin: 0,
          marginBottom: 'var(--sh-space-4)',
          lineHeight: 1.5,
        }}>
          The id <span style={MONO_ID_STYLE}>"{id}"</span> doesn't match any {kind} on file.
        </p>
      </Card>
    </main>
  );
}
