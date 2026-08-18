import { Card } from '../../components/Card.jsx';

// Discover, unavailable state. The browsable surface was REMOVED, not disabled,
// and `Discover.jsx` is deleted rather than emptied so the rebuild starts from
// the spec instead of from what was there.
//
// WHY IT WENT. It computed a weighted score per org (cause overlap x3, geo
// match +2, National +1), cut the catalog at score > 0, and sorted descending,
// which §7 forbids outright. The cutoff also leaked: the National bonus applied
// unconditionally, so 7 of the 17 orgs cleared it for any cause selection with
// zero cause overlap. Results were then grouped into three buckets whose copy
// asserted that some organizations have "Trust you can't buy" and that others
// are "doing bold work" whose growth the funder's support helps, which is
// recommendation rather than exposure and fails the Path B test.
//
// The replacement is specified at `docs/discover-surface-spec.md`: four
// combinable facets, nothing scored, alphabetical results with the count
// leading. It needs BMF ingest. FT ruled removal NOW rather than coupling the
// two, following P-5 (`eb75092`) and the feedback removal (`fbc1a9a`), both of
// which removed rather than waited.
//
// TREE-INVARIANT BY DESIGN. This renders identically on the demo and
// authenticated trees: no isAuthenticated branch, no useFixtureIsolated() call.
// The reason the surface is gone has nothing to do with whose data it would
// show. The old authenticated-only caveat ("illustrative while live nonprofit
// data is being connected") is retired with the page rather than moved here,
// because it named live-data-pending as the limitation, which was the wrong
// cause even before this slice.
//
// THE COPY IS CONSTRAINED, and the constraints are the point. No date, because
// the chain runs through an ingest this project has not scheduled. Nothing that
// implies a catalog exists behind this page. And it says plainly that what was
// here was illustrative, which a funder who used the old page is owed.

export default function DiscoverUnavailable() {
  return (
    <main style={mainStyle}>
      <p style={eyebrowStyle}>Discover</p>
      <h1 style={titleStyle}>The organization directory is being rebuilt</h1>

      <Card>
        <p style={bodyStyle}>
          It will be built on IRS filings, so what you see will come from the
          public record rather than from anything we assembled. You will be able
          to narrow by location, by the size of an organization's filed revenue,
          and by when the IRS recognized it.
        </p>
        <p style={bodyStyle}>
          There is nothing to browse here yet.
        </p>
        <p style={lastBodyStyle}>
          What used to be on this page was a small illustrative set, not live
          nonprofit data.
        </p>
      </Card>
    </main>
  );
}

// Layout mirrors RecordKeeping's absent state (720px cap, same padding triple)
// so this sits at the same measure as its sibling sub-screens.
const mainStyle = {
  maxWidth: '720px',
  margin: '0 auto',
  padding: 'var(--sh-space-8) var(--sh-space-8) var(--sh-space-16)',
};

const eyebrowStyle = {
  fontSize: '10px',
  color: 'var(--sh-bronze)',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontWeight: 600,
  marginBottom: 'var(--sh-space-2)',
};

const titleStyle = {
  fontFamily: 'var(--sh-font-serif)',
  fontSize: 'var(--sh-text-2xl)',
  color: 'var(--sh-text-primary)',
  fontWeight: 400,
  marginBottom: 'var(--sh-space-5)',
};

const bodyStyle = {
  fontSize: 'var(--sh-text-md)',
  color: 'var(--sh-text-body)',
  lineHeight: 1.6,
  marginBottom: 'var(--sh-space-4)',
};

const lastBodyStyle = {
  ...bodyStyle,
  color: 'var(--sh-text-secondary)',
  marginBottom: 0,
};
