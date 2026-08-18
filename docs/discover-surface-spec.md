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

**MEASURED 2026-08-18, and the BMF cannot carry this facet.** `REVENUE_AMT` is
blank on 569,235 of 1,957,340 rows and filed as exactly zero on 825,946 more,
so **71% of the national file has no usable figure**. The five bands do not
divide the remainder either: of the 1,388,105 that filed something, 84.2% fall
in "under 350K" and 59.5% filed exactly zero. **The financial facts moved to the
990 XML**, which is why FT reversed ruling 7 the same day. See the financial
section below and `propublica-spike-findings.md` ruling 7. This band definition
and its naming rule stand; what changed is the source it reads.

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

## Financial fields, from the 990 XML

FT-ruled 2026-08-18, after the route was measured. Four rulings. The
measurements behind them are in `propublica-spike-findings.md` ruling 7.

### 1. Mission uses MissionDesc

**`MissionDesc`, not `ActivityOrMissionDesc`.** This is a DECISION rather than
a detail: both are present on 7,155 of 7,180 full 990s and **they disagree on
2,325 of them, 32.5%**. `MissionDesc` is the organization's own statement of
purpose in the standard field. Recorded so the other one is not picked later by
someone who finds it first and has no way to know a choice was made.

### 2. Which year: most recent TAX year

**Most recent TAX year per EIN, never most recent submission.** Batches are
organized by submission date, not tax year, so one batch already spans four tax
years (2022 through 2025) and 501 of 11,738 EINs in it appear more than once,
up to four times. **The card names the tax year**, not when the filing arrived.
A funder reading a figure needs to know which year it describes; the submission
date describes our pipeline, not the organization.

### 3. Element stability across years is UNMEASURED

**A known unknown, deferred rather than answered.** Documents carry a
`returnVersion` attribute and the measurement covered ONE batch of ONE year.
Whether the element names hold across 2022 to 2026 is **not established**. v1
loads one year, so the question does not bite yet. **It bites on any multi-year
ingest**, which is exactly where a silent mapping failure would produce missing
figures rather than an error.

### 4. The sparse card is not a deficient card

**Roughly half of organizations file a 990-N and produce no XML at all**:
975,549 of the 1,957,340 in the BMF, 49.8%, with 829,302 filing one in 2023 or
later.

**Their card must NOT render empty financial fields or dashes.** It states what
the filing type MEANS: this organization files a 990-N postcard, gross receipts
under $50,000, and the IRS collects no financial detail at that size. **That is
a complete card about a small organization, not an incomplete card about an
unknown one.**

**The reasoning, which is the same one this project has spent its slices
applying.** Filling the gap would make StewardHouse assert what the federal
record does not contain. Dashes and empty fields imply a missing value where
there is no value to miss, which is the defect pattern behind the Discover
removal, the feedback removal and the gift-counter honesty work.

**The surface-level consequence.** The asymmetry between the two card shapes is
only a problem if a funder meets both without explanation. **So the surface says
up front that roughly half of US nonprofits file a postcard rather than a full
return.** Said once, at the top, it makes the sparse card legible as a fact
about small organizations rather than as a failure of the product.

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

**The facets need BMF ingest, and that is the WHOLE of the blocker.** The four
facets read BMF `CITY`, `STATE`, `REVENUE_AMT` and `RULING`. IRS bulk files are
federal government works carrying no terms encumbrance, which ruling 1 recorded
from the start.

**No terms question stands in the way, and an earlier version of this section
said one did.** It described the facets as waiting on an ingest that waited on
an unresolved terms question. That was wrong on both halves. Ruling 5 RESOLVED
on 2026-08-17, ProPublica confirming the API serves public IRS data that may be
stored and used freely; and BMF ingest was never inside ruling 5's scope
anyway, since that ruling gated a persisted copy of PROPUBLICA data
specifically. Ruling 7's deferral condition is met and the bulk XML route is
unblocked, still unscoped.

**What actually blocks the facets is the ingest itself: there is no scheduled
process in this project, and never has been.** Every write path shipped so far
is request-driven, a funder or an operator pressing a control. A monthly BMF
refresh is a different shape of thing, with a schedule, a failure mode nobody
is watching, and a staleness question of its own. That is the work, and naming
it is more useful than naming a permission that was already granted.

**The removal already shipped SEPARATELY, at `65f2a28`.** An earlier version of
this section argued the removal and the facet build had to ship together, on
the grounds that removal alone leaves the page incoherent. FT ruled otherwise
and the page is now explicitly unavailable rather than silently arbitrary,
which is the shape P-5 and the feedback removal both took.
