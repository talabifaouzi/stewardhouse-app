# Discover surface spec

FT-ruled 2026-08-17. What a funder DOES on Discover, as distinct from what an
org record CONTAINS.

## Why this doc exists

`docs/propublica-spike-findings.md` and its eight rulings (`9738b79`, at `:730`
onward) describe the RECORD. Nothing described the SURFACE. Two of those rulings
changed what Discover can be and neither was followed through to the page:
ruling 2 (`:735`) killed StewardHouse-assigned causes as an org-record field, so
cause filtering on the org side is gone, and the ProPublica route is reduced to
a link-out with the ingest built on IRS bulk data, which carries no keyword
search.

This spec existed only in conversation. That is the same gap that blocked
Operations criterion 3 until the derived-boolean ruling was written down: an
implementer reading the repo found a prohibition, found nothing describing what
to build instead, and correctly stopped.

## The four facets

Four selectable filters the funder combines. **Nothing scored, nothing ranked,
no computed cutoff.**

### 1. Geography, state and city

Source: BMF `CITY` and `STATE` (`propublica-spike-findings.md:390`).

**PREFILLED from the funder's GPS**, visibly set, clearable in one action, with
copy naming where the value came from.

**Ruled NOT us-filtering** because it reflects the funder's own stated choice
back to them and is reversible in one click. The distinction from a
StewardHouse-chosen default is the visibility and the reversibility together:
a prefill the funder cannot see or cannot clear would be us deciding.

### 2. Revenue band

Source: BMF `REVENUE_AMT` (`:393`).

Five bands: under 350K, 350K to 1M, 1M to 5M, 5M to 10M, 10M+. Each carries
descriptive copy.

**Ruled ALLOWED because a band is a StewardHouse-defined CATEGORY, not a claim
about any organization.** The category exists before any org is placed in it,
and placement is arithmetic on a filed figure rather than an assessment.

**Orgs with no filed figure are a SELECTABLE group, never silently sorted into
the bottom band.** Absent is not zero, and folding it into the lowest band would
assert a fact the record does not carry.

**The card names the field as TOTAL REVENUE PER IRS FILING, never budget.**
Revenue includes program fees and investment income. Conflating revenue with
budget is a known vendor error in this space and is the error this naming rule
exists to prevent.

### 3. Recognition era

Source: BMF `RULING` (`:391`). **Labeled recognition, never age.**

**Shipped knowing it is approximate.** `RULING` is IRS recognition, not
founding, and it can be reissued: the spike found Burlington Little League
returning `ruling_date = 2026-02-01` while its sibling Vermont affiliates return
`1967-01-01` for the same group ruling (`:516-518`).

Real founding year is `FormationYr` in the 990 XML, present on 92% of full-990
filers and on ZERO 990-EZ and 990-PF filings (`:459`, `:467`, `:510`); 990-N
filers supply no XML at all (`:469`). **FT ruled the XML pipeline KEY follow-on
work, not optional.**

### 4. NTEE: DEFERRED

BMF carries `NTEE_CD` only (`:393`). Ruling 2 requires the code AND its verbatim
IRS label with provenance, and the spike did not establish a parseable source
for those labels. It records the adjacent BMF code-table information sheets as
unparseable by the available tooling (`:655-657`) and the meaning of the fourth
character in 4-character codes as undetermined (`:659-660`).

Deferred until the verbatim label source is identified. Two shape facts to carry
forward: 18% of a 500-record sample had no NTEE code at all (`:680`), and NTEE
assigns exactly one code per org (`:707`).

## Results

**Alphabetical.** No computed order of any kind.

**The count LEADS, and the cut is stated at the same visual weight as the
results, not as a footnote.** A funder must be able to see what they are looking
at and what was excluded without hunting for it.

**Revenue band and recognition era open EMPTY. Geography opens PREFILLED.**

## Set membership: the load-bearing judgment

**Membership is AUTHORED when no fact about the record explains why one org is
here and another is not.**

**Alphabetical-first-N passes.** The rule is statable and the funder can work
around it.

**A curated N fails.** The selection is StewardHouse's judgment about which orgs
deserve to appear, which is §7's evaluative-recommendation line and Path B's.

**Every mechanical rule has a systematic effect, including alphabetical.** Sorting
A to Z and cutting at N systematically favours orgs whose legal names start with
early letters. That is not the test. **What matters is that the funder is told
the rule**, which is why the cut is stated at the same weight as the results
rather than buried.

## What this replaces, and why each is gone

Six things in the current page do not survive.

| Removed | Why |
|---|---|
| The weighted score (`Discover.jsx:43-52`) | §7 no-scoring. A numeric affinity between funder and org |
| The `score > 0` cutoff (`:52`) | §7. A cutoff is a judgment even with no number shown. It is also the ONLY thing filtering the catalog today |
| The descending sort (`:52`) | §7 no-ranking |
| Three-bucket grouping, established / community / emerging (`:54-55`, `:227`) | An evaluative classification of organizations BY StewardHouse, forbidden by §7 independently of ruling 3 killing `cat` for lack of a source. Its copy in `orgsData.js:51-64` is the proof: "Deep track records", "Trust you can't buy", "New organizations doing bold work. Your support helps them grow", the last of which also prescribes |
| Org-side causes as a filterable field | Ruling 2 (`:735`). Cause filtering moves to the funder's own GPS |
| Matched-cause tags (`Discover.jsx:417`) | Same field, same ruling |

**Also to be removed with them:** `CAT_META` (`orgsData.js:51-64`) is orphaned,
since its only consumers are `Discover.jsx:9` and `:227`. `scoreOrg`, an
exported org-ranking function commented "Higher = better match" that carried
the same weights and had zero consumers, was DELETED separately once this spec
recorded it: it sat in the fixture module and would have survived any removal
confined to `Discover.jsx`.

**Two copy sites assert what the removed mechanism did**, and are wrong the
moment it is gone. `IndividualSurface.jsx:395-400`, the Home card, promises
results "matched to" the funder's first intake cause. `Discover.jsx:99-109`, the
authenticated-tree caveat, attributes the page's state to live data pending,
which is the wrong cause: the organizing mechanism is removed on principle and
connecting IRS data would not restore it.

## The dependency, stated plainly

**The facets need BMF ingest.** Ruling 7 (`:759`) defers the bulk XML route and
leaves it unscoped until ruling 5 resolves. **Ruling 5 (`:745`) is UNRESOLVED**
and has no counsel to route it to; it blocks any persisted copy of ProPublica
data, and its standard applies to Candid for the same reason.

**The removal and the facet build must ship together, or Discover has no
organizing principle in the interim.** Removing the score, the cutoff and the
sort with nothing in their place leaves all 17 fixture orgs in arbitrary order
behind a cause gate that no longer filters, under copy that describes a matching
page. That is not a reduced surface; it is an incoherent one.

**The tension this creates is real and belongs to FT, not to a slice.** The §7
violation is live on a real surface today and does not wait on IRS work, while
the replacement waits on an ingest that waits on an unresolved terms question.
The narrower alternative, removing the mechanism and letting Discover be
explicitly unavailable rather than silently arbitrary, is the shape P-5 and the
feedback removal both took.
