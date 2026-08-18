# ProPublica spike findings

Read-only reconnaissance, 2026-08-15. Repo `main` @ `eb75092`, clean.
No code written, no schema, no migration, no client, no ingest.

**Purpose.** The org card shape in `orgsData.js` was invented. This establishes
whether real data can fill it, before anything is designed against it.

**Method.** Live keyless calls to the ProPublica Nonprofit Explorer API (about
150 requests), plus the IRS auto-revocation list, the IRS EO BMF region-1
extract, and one IRS Form 990 XML batch, all downloaded and parsed locally in a
scratch directory outside the repo. Every empirical claim below is marked with
what was measured. Claims that could not be verified against a primary source
are marked **UNVERIFIED** and are not filled in from memory.

**A note on §7.** The three ruled sources are ProPublica (source 1), IRS bulk
data (source 2), and the org's own website (source 3), all required, none
substituting for another, provenance per field. This document reports which
source can reach which field. It proposes no mapping, no storage, and no build.

---

## Phase 1: repo reconnaissance

### 1. Org-level fields rendered on Discover

`src/surfaces/individual/Discover.jsx`. Every org field on the surface, with
its render site.

| Field | Render site | Source | Survived the defang |
|---|---|---|---|
| `name` | `:325` (saved list), `:392` (card title) | fixture | yes |
| `mission` | `:399` | fixture | yes |
| `geo` | `:418` as a `Tag`; also read for filtering at `:48-50` | fixture | yes |
| `causes` | via `matchedCauses` at `:350-352`, rendered as `Tag`s at `:417` | fixture, labels resolved from `CAUSES` | yes |
| `cat` | grouping key; `CAT_META[catKey]` at `:227` | fixture | yes |
| `extensions.individual.led` | `:431` "Leadership" | fixture | yes |
| `extensions.individual.years` | `:432` "Operating" | fixture | yes |
| `extensions.individual.demo` | `:433` "Who they serve" | fixture | yes |

**Not rendered on Discover:** `foundedYear`, `badge`, `ein`. `foundedYear` and
`badge` render only on the Operations tree (`OrganizationDetail.jsx:182,185`
and `:217,225`). `ein` renders nowhere for orgs.

**Source, precisely.** Discover reads `unified.orgs` filtered to
`sourceSurface === 'individual'` (`Discover.jsx:41`). That comes from
`src/data/unified/adapters/individual.js:160`, which maps the hardcoded `ORGS`
array in `src/data/orgsData.js`. **No D1, no derivation, no network.**

**Demo versus authenticated tree: identical.** `Discover.jsx:21` computes
`isAuthenticated`, but uses it only at `:99` for a notice. It does **not** gate
org content. The same 17 fixture orgs render to a signed-in pilot user as to a
demo visitor. This is deliberate and documented at `:13-20`: the comment rules
that an empty Discover teaches the pilot nothing, and explicitly instructs
against routing this through `useFixtureIsolated()`.

The five defanged fields (`ed`, `boardSize`, `budget`, `programs`,
`topFunders`) leave their removal comments in place at `Discover.jsx:428`,
`:435` and `:441`.

### 2. Org fixture record count and field list

**17 records.** Verified by importing the module.

Exact key list, identical across all 17 records (no record carries an extra or
missing key):

```
id, name, mission, causes, geo, cat, years, foundedYear, led, badge, demo
```

10 of the 17 carry more than one cause. That cardinality matters in Phase 3.

### 3. EIN and org identifiers

**No org record carries an EIN anywhere in the tree.**

- `src/data/orgsData.js` has no `ein` key at all (see the field list above).
- `src/data/unified/adapters/individual.js:163` sets `ein: null` with the
  comment "source has no EIN".
- `src/data/unified/types.js:153` declares `ein` as `string|null`.
- `src/surfaces/operations/directories/OrganizationsDirectory.jsx:26` records
  that `org.ein` is null for every record.

**Records are id-keyed, not EIN-keyed and not name-keyed.** The key is a
synthetic `org-{n}` derived from the fixture array position
(`adapters/individual.js:161`), matching the `'org-1'..'org-17'` ids the D1
seed uses.

EINs do exist elsewhere in the tree, on a **different entity**: the enterprise
exclusion fixtures carry six fabricated EINs (`enterpriseFixtures.js:543,549,
555,561,567,573`, e.g. `"04-9912345"`), surfaced at `ExclusionDetail.jsx:79`
and `EnterpriseCompliance.jsx:134`, and written through
`functions/api/exclusions.js`. Those are exclusion records, not org records.

### 4. D1 table for org data

**A table exists.** This is not a "none" answer.

- `migrations/0001_initial.sql:94-106` creates `org` with columns `id, name,
  ein, mission, causes, geo, cat, is_excluded_by_institution_ids,
  source_surface, extensions`.
- `migrations/0002_seed.sql:41` seeds **17 rows**.

Two facts about it that matter:

**(a) Nothing reads it.** A grep of `functions/` finds no SELECT, INSERT,
UPDATE or DELETE against `org`. The table is seeded and unread. Discover reads
the fixture, not D1.

**(b) The D1 seed still carries the five defanged fields.** The 2026-08-14
defang (`42851cd`) removed `ed`, `boardSize`, `budget`, `programs` and
`topFunders` from `orgsData.js` and from the adapter. It did **not** touch
`migrations/0002_seed.sql`, where each of `ed`, `boardSize`, `programs` and
`topFunders` still appears 17 times inside the `extensions` JSON, carrying
authored executive-director names, board counts, budget bands, program names
and funder lists. (`budget` appears 18 times; the extra is the funder's own
giving budget on a person row, the name collision documented at
`adapters/individual.js:180-183`.)

Nothing renders it today, because nothing reads the table. It is recorded here
as a finding, not a proposal.

### 5. Residual Candid references

File and line only.

```
migrations/0002_seed.sql:25
src/data/unified/adapters/individual.js:173
src/surfaces/operations/directories/OrganizationDetail.jsx:11
src/surfaces/operations/directories/OrganizationDetail.jsx:12
src/surfaces/operations/directories/OrganizationDetail.jsx:28
src/surfaces/operations/directories/OrganizationDetail.jsx:159
src/surfaces/operations/directories/OrganizationsDirectory.jsx:26
CLAUDE.md:91, 139, 197, 776, 791, 793, 794, 795
```

`OrganizationDetail.jsx` is the densest: its docblock describes the page as a
GuideStar-shaped profile flow, and `:28` names "Candid's leadership-demographics
section" as a future home for a field. The `docs/` matches for the string
"candid" are all the word "candidate" and are not references.

---

## Phase 2: source capability assessment

### 6. ProPublica Nonprofit Explorer API

Documentation: <https://projects.propublica.org/nonprofits/api>

**Endpoints.** Base `https://projects.propublica.org/nonprofits/api/v2`.

- `GET /search.json` with optional `q`, `page` (zero-indexed), `state[id]`,
  `ntee[id]` (1-10), `c_code[id]`, `output` (`flat` or `noorg`), `callback`.
- `GET /organizations/{ein}.json`, which takes no query parameters.

Both were called successfully. Exact calls used in this spike:

```
GET /v2/search.json?q={term}
GET /v2/search.json?q={term}&page={n}
GET /v2/search.json?q=little%20league%20baseball&state[id]=VT
GET /v2/organizations/{9-digit-ein}.json
```

**Authentication.** No API key is documented and none was used. Every call in
this spike was keyless and succeeded. No key was written anywhere.

**Rate limits.** The documentation states a limit only for PDF downloads:
"Note that these download links are rate limited." No JSON rate limit is
documented. Empirically about 150 keyless JSON calls at roughly 3 per second
completed with no throttling and no 429. Whether an undocumented ceiling exists
at sustained volume is **UNVERIFIED**.

One hard limit was found: the per-filing XML link exposed on ProPublica org
pages, `/nonprofits/download-xml?object_id={id}`, returned **403** to
programmatic fetch on 5 of 5 attempts.

**Terms of use.** `https://www.propublica.org/about/propublica-data-terms-of-use`
301-redirects to <https://projects.propublica.org/datastore/terms/>. Quoted:

- "If you use the data for publication, you must cite ProPublica."
- "You can't republish the raw data in its entirety or otherwise distribute the
  data (in whole or in part) on a stand-alone basis."
- "You can't charge people money to look at the data or sell advertising
  specifically against it."
- "You can't sub-license or resell the data to others."
- "You can't change the data except to update or correct it."

**AI and machine-learning use is not addressed** in the fetched text. Silence
is not permission, and this is the precise issue that deferred Candid.

**Caveat, and it is material.** The fetched page presented itself as a
historical snapshot covering 2013 to 2023. Whether these are the *current*
operative terms is **UNVERIFIED**. The quotes above should not be relied on
without confirmation.

**Backing sources and cadence.** The API documentation names three: the IRS EO
BMF, the IRS Annual Extract of Tax-Exempt Organization Financial Data, and Form
990 documents. Every organization response echoes this in its `data_source`
field. The documentation gives no recurring update cadence; its most recent
changelog entry is dated July 13, 2023.

**Filing-year lag, measured.** Across the large filers sampled,
`filings_with_data` (structured financials) ends at tax year **2023**, while
`filings_without_data` carries 2024 and 2025 as PDF-only entries. Structured
financial data therefore lags roughly two to three years as of August 2026.

**`formtype`** is documented as `0` = Form 990, `1` = Form 990-EZ, `2` =
Form 990-PF.

#### The organization response, as actually returned

`GET /v2/organizations/530196605.json` returns four top-level keys plus
`api_version`: `organization`, `filings_with_data`, `filings_without_data`,
`data_source`.

The `organization` object carries **35 keys**, identical in shape across all 14
records fetched:

```
id, ein, name, careofname, address, city, state, zipcode, exemption_number,
subsection_code, affiliation_code, classification_codes, ruling_date,
deductibility_code, foundation_code, activity_codes, organization_code,
exempt_organization_status_code, tax_period, asset_code, income_code,
filing_requirement_code, pf_filing_requirement_code, accounting_period,
asset_amount, income_amount, revenue_amount, ntee_code, sort_name,
created_at, updated_at, data_source, have_extracts, have_pdfs,
latest_object_id
```

`filings_with_data` entries carry 68 keys of line-item financials.
`filings_without_data` entries carry 5: `tax_prd`, `tax_prd_yr`, `formtype`,
`formtype_str`, `pdf_url`.

**There is no website field.** Not in the organization object, not in the
search result, not anywhere in the response. This is the single most
consequential absence for the ruled architecture, because source 3 (the org's
own site) has no entry point without a URL.

#### Field inventory across the sampled spread

14 organizations fetched, chosen to stress different shapes.

| EIN | Org | Shape | NTEE | Revenue | `filings_with_data` | Notable nulls |
|---|---|---|---|---|---|---|
| 53-0196605 | American National Red Cross | very large national | `P210` | 3.92B | 13 (2011-2023) | `careofname` |
| 36-3673599 | Feeding America | large national, food | `K310` | 5.00B | 12 (2012-2023) | `sort_name` |
| 04-2717782 | The Greater Boston Food Bank | mid-size regional, food | **null** | 179M | 13 (2011-2023) | `ntee_code`, `sort_name` |
| 26-1544963 | Khan Academy | education | `B99` | 117M | 14 (2010-2023) | `careofname`, `sort_name` |
| 04-3534407 | Year Up | economic mobility | `B41` | 136M | 13 (2011-2023) | `careofname`, `sort_name` |
| 94-6069890 | Sierra Club Foundation | environment | `C300` | 32M | 13 (2011-2023) | `careofname`, `sort_name` |
| 77-0485946 | Positive Coaching Alliance | sports | `B99` | 15M | 13 (2011-2023) | `sort_name` |
| 30-0212534 | Interfaith America | faith | `X90` | 37M | 13 (2011-2023) | `careofname`, `sort_name` |
| 94-1156481 | Glide Foundation | faith, food, housing | `X21` | 28M | 2 (2022-2023) | `careofname`, `sort_name` |
| 39-1496741 | Milwaukee Habitat for Humanity | housing, regional affiliate | `L20Z` | 23M | 13 (2011-2023) | `careofname`, `sort_name` |
| 03-0272056 | Little League, Georgia VT | small local | **null** | **0** | **0** | `ntee_code`, `latest_object_id` |
| 45-3505953 | Little League, Lyndonville VT | small local, 990-EZ | **null** | **0** | 9, all `formtype=1` | `ntee_code`, `latest_object_id` |
| 03-0358775 | Little League, Burlington VT | small local, 990-EZ | `N63` | **0** | 7, all `formtype=1` | `sort_name`, `latest_object_id` |
| 99-1924525 | Little League, Colchester VT | small local | **null** | **null** | **0** | `tax_period`, all three amounts, `ntee_code` |

`have_extracts` and `have_pdfs` were null on all 14. Note that no 990-N filer
appears with any structured filing at all: `filing_requirement_code = 2` on the
Little League records, with zero `filings_with_data`.

#### Four structural traps in the returned data

**(a) Zero is not absence, except when it is null.** Three of the four small
orgs return `revenue_amount = 0`, `asset_amount = 0`, `income_amount = 0`. The
fourth returns `null` for all three. A structural zero that reads as a real
zero is the same species of defect P-2 closed for `gifts_count`, where the fix
was to write NULL and render "Not tracked" rather than a frozen 0.

**(b) `name` is often the group-ruling parent, not the organization.** Eight
distinct Vermont Little Leagues all return `name = "Little League Baseball
Inc"`. What distinguishes them sits in `sort_name` (`"2450304 Georgia Ll"`,
`"Vermont Little League"`, `"2450409 Lyndon Youth Baseball Softb"`) or in the
search endpoint's `sub_name`. §7 requires names verbatim from records; it does
not say which field is the name.

**(c) `careofname` returns natural persons.** Observed values include
`"% JASON CHAGNON"`, `"% DEBORAH HARRIS"`, `"% JAMES C THOMPSON"`. The API
hands back named individuals attached to identifiable organizations, which is
adjacent to what the Discover defang removed.

**(d) Staleness is per record and visible.** `data_source` varied within one
result set across `current_2026_07_21`, `pre_2026_04_15`, `pre_2026_03_10`,
`pre_2025_07_23`, `pre_2024_05_21` and `pre_2026_02_19`. Two records fetched in
the same minute can be a year apart in freshness.

#### The status gate: measured, and it fails

This is the load-bearing question, so it was tested directly rather than
inferred.

**Step 1. The search endpoint carries no status at all.** `search.json` returns
14 keys: `ein, strein, name, sub_name, city, state, ntee_code, raw_ntee_code,
subseccd, has_subseccd, have_filings, have_extracts, have_pdfs, score`. There
is no status and no deductibility field. A search result cannot be gated
without a second per-EIN call.

**Step 2. The organization endpoint does carry them**,
`exempt_organization_status_code` and `deductibility_code`. Across a 50-org
sample: status was `1` in 48 and null in 2; deductibility was `1` in 45, `2` in
3, null in 2. The `2`s were 501(c)(4) and 501(c)(6) organizations, so
non-deductible entity types are in the corpus and are distinguishable, per EIN.

**Step 3. Those fields do not reflect revocation.** The IRS auto-revocation
list was downloaded and sampled for 501(c)(3) rows that were never reinstated,
five per posting year from 2019 through 2026, n=40.

```
posted 2019: 5 sampled, 5 still served by ProPublica, 0 404
posted 2020: 5 sampled, 4 still served,             1 404
posted 2021: 5 sampled, 5 still served,             0 404
posted 2022: 5 sampled, 5 still served,             0 404
posted 2023: 5 sampled, 5 still served,             0 404
posted 2024: 5 sampled, 5 still served,             0 404
posted 2025: 5 sampled, 5 still served,             0 404
posted 2026: 5 sampled, 5 still served,             0 404
```

**39 of 40 were still served. 31 of the 40 returned
`exempt_organization_status_code = 1` and `deductibility_code = 1`**, that is,
an affirmative statement that the organization is exempt and that
contributions to it are deductible, for organizations the IRS lists as
auto-revoked. The other 8 returned null for both.

A separate targeted sample of 8 recently-posted revocations returned 8 of 8
served, all with `status=1, deduct=1`, including records stamped with
ProPublica's freshest snapshot `current_2026_07_21`.

Worked example: **EIN 01-0281533, Green Valley Association**. IRS revoked
15-NOV-2025, posted 10-MAR-2026. ProPublica served it on 2026-08-15 with
`status=1`, `deduct=1`, `ntee=P820`.

**Step 4. The fault is retention, not the BMF.** The IRS EO BMF region-1
extract was downloaded and checked. Every one of five revoked EINs tested is
**absent** from the BMF. A control confirmed the method: Greater Boston Food
Bank (04-2717782) and Year Up (04-3534407) are both present.

So the chain is:

| Source | What it says about a revoked org |
|---|---|
| IRS EO BMF | correctly **removed** |
| IRS auto-revocation list | correctly **listed as revoked** |
| ProPublica | **served, `status=1`, `deductibility=1`** |

ProPublica retains BMF rows after the IRS drops them and continues to report
their last-known-good status. **This cannot be corrected by waiting for a
fresher ProPublica snapshot.**

**Answer to the status-gate question.** The IRS leg is not a follow-on. The
ProPublica status fields are not merely absent or stale, they are affirmatively
wrong in the one direction that matters, asserting deductibility for
organizations that have lost it.

### 7. IRS bulk data

Bulk downloads page:
<https://www.irs.gov/charities-non-profits/tax-exempt-organization-search-bulk-data-downloads>

| File | URL | Format | Cadence | Size (measured) |
|---|---|---|---|---|
| Auto-Revocation List | `https://apps.irs.gov/pub/epostcard/data-download-revocation.zip` | pipe-delimited text | "The data set files are updated monthly." | 47,524,171 B zipped; 148,204,804 B and **1,246,174 rows** unzipped |
| Publication 78 (deductibility) | `https://apps.irs.gov/pub/epostcard/data-download-pub78.zip` | pipe-delimited text | "The data set files are updated monthly." | 29,760,361 B zipped |
| Form 990-N (e-Postcard) | `https://apps.irs.gov/pub/epostcard/data-download-epostcard.zip` | pipe-delimited text | "The data set files are updated monthly." | not measured |
| EO BMF | `https://www.irs.gov/pub/irs-soi/eo1.csv` (also `eo2`, `eo3`, `eo4`, `eo_xx`, `eo_pr`) | CSV | see below | region 1 = 48,629,769 B |

EO BMF page:
<https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf>.
It states 1,957,340 records posted Aug 11 2026 but **states no recurring
cadence** in the fetched content. A search result asserted "monthly, on the 2nd
Tuesday of the month"; that is **UNVERIFIED** against the primary page.

**Which file serves the status gate.** Both, and they answer different
questions. The **BMF** answers "is this organization currently recognized",
by presence or absence, and it carries `DEDUCTIBILITY` and `STATUS` columns.
The **auto-revocation list** answers "was this organization revoked, when, and
was it reinstated". **Pub 78** answers "are contributions deductible" directly.
The empirical test above used BMF presence and the revocation list together;
whether the gate needs one, two or all three is a design question and is not
answered here.

**BMF columns, from the file header (28 columns):**

```
EIN, NAME, ICO, STREET, CITY, STATE, ZIP, GROUP, SUBSECTION, AFFILIATION,
CLASSIFICATION, RULING, DEDUCTIBILITY, FOUNDATION, ACTIVITY, ORGANIZATION,
STATUS, TAX_PERIOD, ASSET_CD, INCOME_CD, FILING_REQ_CD, PF_FILING_REQ_CD,
ACCT_PD, ASSET_AMT, INCOME_AMT, REVENUE_AMT, NTEE_CD, SORT_NAME
```

**There is no website column in the BMF either.**

**Auto-revocation list layout, 12 pipe-delimited fields**, as observed (these
field *names* are read off the data, not quoted from a spec, so treat the
naming as **UNVERIFIED** even though the positions are certain):

```
[1] EIN  [2] legal name  [3] dba  [4] street  [5] city  [6] state  [7] zip
[8] country  [9] subsection code  [10] revocation date
[11] revocation posting date  [12] exemption reinstatement date
```

**Code tables are UNVERIFIED.** The EO BMF information sheet exists at
<https://www.irs.gov/pub/irs-pdf/p5926.pdf> and
<https://www.irs.gov/pub/irs-soi/eo-info.pdf>, but the fetch tool could not
parse either (binary PDF). The meanings of `DEDUCTIBILITY`, `STATUS` and
`FILING_REQ_CD` values are therefore **not confirmed against primary source**.
Only observed values are reported here: deductibility `1` and `2`; status `1`
and null; filing requirement `0`, `1`, `2` and `6`, with `2` appearing on every
small Little League record that had no structured filings.

**Neither IRS page states whether revoked organizations are excluded from the
BMF.** That question was settled empirically instead, in §6 step 4: they are
absent.

### 8. Org website enrichment: what is mechanically involved

No design here, only what the mechanism requires.

**The URL is not in either structured source.** Not in ProPublica's 35-key
organization object, not in the BMF's 28 columns. It exists on the Form 990
itself, as the XML element `WebsiteAddressTxt`.

**Getting at that XML is bulk-only.** Two routes were tested and both
per-filing routes are closed:

- The historical per-filing S3 object,
  `https://s3.amazonaws.com/irs-form-990/{object_id}_public.xml`, returns
  **404** for all 5 object ids tested. Retired.
- ProPublica's `/nonprofits/download-xml?object_id={id}` returns **403** to
  programmatic fetch, 5 of 5.

The route that works is the IRS bulk distribution
(<https://www.irs.gov/charities-non-profits/form-990-series-downloads>):

- Per-year index CSV, e.g.
  `https://apps.irs.gov/pub/epostcard/990/xml/2026/index_2026.csv`, measured at
  **42,987,660 B**. Header: `RETURN_ID, FILING_TYPE, EIN, TAX_PERIOD, SUB_DATE,
  TAXPAYER_NAME, RETURN_TYPE, DLN, OBJECT_ID, XML_BATCH_ID`.
- Per-batch zip, e.g.
  `https://apps.irs.gov/pub/epostcard/990/xml/2026/2026_TEOS_XML_01A.zip`,
  measured at **71,497,607 B**, containing **12,245** XML files totalling
  371,552,883 B uncompressed.

So the lookup is EIN → `OBJECT_ID` → `XML_BATCH_ID` → download that batch →
extract that member. There is no observed way to fetch one organization's 990
XML over HTTP.

**What the XML actually contains, measured.** One batch, 409 filings sampled
across the archive:

| Return type | n | website present | of those, junk (`N/A`, `NONE`) | URL-shaped | mission text | `FormationYr` |
|---|---|---|---|---|---|---|
| 990 | 239 | 210 | 65 | **143 (60%)** | **239 (100%)** | 221 (92%) |
| 990-EZ | 126 | 97 | 33 | **62 (49%)** | **0 (0%)** | **0 (0%)** |
| 990-PF | 36 | 27 | 23 | **4 (11%)** | **0 (0%)** | **0 (0%)** |
| 990-T | 8 | 0 | 0 | 0 | 0 | 0 |

Two findings sit in that table.

**Mission narrative and formation year are Form-990-only.** They appear on
100% and 92% of full 990s and on **zero** 990-EZ and 990-PF filings. The small
and mid-size organizations, exactly the community and emerging tier the card is
built around, supply neither. 990-N filers supply nothing at all: no XML, no
financials.

**Website presence is not website usability.** Roughly a third of the
non-empty values are placeholders. Real extracted values look like
`www.marthaskayak.org`, `www.nvbirdalliance.org`, `odadee.org`,
`WWW.PIMAPAWSFORLIFE.ORG`, alongside `"N A"` and `"N/A"`. About four in ten
organizations have no usable URL in their filing, which means the source-3 leg
has no entry point for them.

**One extraction caution.** A naive first-match on `BusinessNameLine1Txt`
returns the *preparer's* firm in a meaningful fraction of filings (observed:
`BLANKENSHIP CPA GROUP PLLC`, `CITRIN COOPERMAN ADVISORS LLC`,
`ROTH & COMPANY LLP`). The filer name must be read from inside the `<Filer>`
block. Mission text is also frequently ALL CAPS in the XML.

**Once a URL exists**, reaching the org's own language is an ordinary HTTP
fetch of a third-party site, with the §7 obligations attached: the language
must be the org's own, refreshed quarterly, carrying an inline disclaimer.
Everything past that point (what to extract, how to store it, how to time the
refresh) is design and is out of scope here.

---

## Phase 3: gap analysis

### 9. Field-by-field matrix

Every field from Phase 1 item 1, plus the three that render off-Discover.
"P" = ProPublica, "IRS" = IRS bulk data or 990 XML, "SITE" = the org's own
website.

| Field | P | IRS | SITE | NONE | Notes |
|---|:--:|:--:|:--:|:--:|---|
| `ein` | yes | yes | | | Trivially available. Currently null on all 17 records. |
| `name` | yes | yes | yes | | Available from four fields that routinely disagree. See conflict list. |
| `mission` | **no** | partial | yes | | Absent from ProPublica JSON entirely. In 990 XML on 100% of 990s, **0% of 990-EZ and 990-PF**. |
| `geo` | yes | yes | | partial | City and state come back. The fixture's `'National'` and `'International'` values are **not derivable**: BMF carries one address. |
| `causes` | partial | partial | | **yes** | One NTEE code per org, null 18% of the time, and it does not partition to the 9 causes. See §4 below. |
| `cat` (established / community / emerging) | | | | **yes** | No source. Editorial classification. |
| `years` | | partial | | partial | Only as a derivation from a founding year, which see. |
| `foundedYear` | **no** | partial | yes | | `ruling_date` is **not** founding. `FormationYr` is 990-only: 92% / 0% / 0%. |
| `led` (Community-led / Nationally staffed) | | | | **yes** | No source. Authored structural descriptor. |
| `badge` (editorial one-liner) | | | | **yes** | No source. A one-line characterization of an organization. |
| `demo` (who they serve) | **no** | | partial | mostly | Sometimes inside 990 Part III prose or on the org's site, never as a field. |
| **status / deductibility gate** | **wrong** | **yes** | | | See §6. ProPublica asserts `status=1, deduct=1` for revoked orgs. |

On `ruling_date`. It is IRS recognition, not founding, and it can be reissued:
Burlington Little League returns `ruling_date = 2026-02-01`, while its sibling
Vermont affiliates return `1967-01-01` for the same group ruling. Using it as a
founding year would be wrong, not merely imprecise.

### 10. Fields no source can supply: honest-absence candidates

- **`cat`** (established / community / emerging), together with the `CAT_META`
  copy at `orgsData.js:43-56`.
- **`led`** (Community-led / Nationally staffed).
- **`badge`**, the editorial one-liner.
- **`demo`**, who they serve, as a field.
- **`causes` at the cardinality the card uses.** 10 of 17 records carry two
  causes; NTEE assigns exactly one code.
- **`geo` values `'National'` and `'International'`.**
- **`foundedYear` and `years` for any 990-EZ, 990-PF or 990-N filer**, which is
  a large share of the small and community-rooted organizations.
- **`mission` for any 990-EZ, 990-PF or 990-N filer**, unless source 3 reaches
  it, which requires a URL that four in ten filings do not usably carry.

Each of these is a field the current card renders. Under §7 (StewardHouse never
authors org-level content), a field with no source and a rendered value is
authored content. That is a finding, not a proposal.

### 11. Fields where sources may conflict

**Conflict resolution is an FT ruling, not an agent choice.** Listed, not
resolved.

- **`name`.** BMF `NAME` vs BMF `SORT_NAME` vs search `sub_name` vs 990 XML
  `BusinessNameLine1Txt` vs the name on the org's own site. Demonstrated to
  differ: eight organizations sharing `"Little League Baseball Inc"`.
- **`mission`.** 990 XML `ActivityOrMissionDesc` vs `MissionDesc` (two distinct
  fields, both present on full 990s) vs the org's site. Three candidates that
  can all disagree, and the two XML ones are frequently ALL CAPS.
- **Address and `geo`.** BMF address vs 990 XML address vs the org's site. The
  BMF address is often a care-of, sometimes a named individual.
- **Founding.** BMF `RULING` vs 990 XML `FormationYr`. Demonstrated to differ.
- **Status and deductibility.** ProPublica vs BMF presence vs the revocation
  list vs Pub 78. **Demonstrated to conflict, in the dangerous direction.**
- **Financials.** ProPublica `revenue_amount` (BMF-derived) vs the filing's
  own `totrevenue`. The unified adapter `runChecks` already track a divergence
  of this species (CLAUDE.md §4, "gift event-vs-field divergence").

**What per-field provenance would have to carry.** Given the above, a
provenance record cannot be a source name alone. To be honest about any single
field it would need at minimum: which of the three sources supplied this value;
which specific field within that source (`NAME` vs `SORT_NAME` is not a detail,
it is the whole question); the as-of date for that source, which varies per
record and not just per source; and, where sources disagreed, that a choice was
made. This is an observation about the size of the obligation, not a storage
design.

### 12. Freshness and staleness: open questions only

- ProPublica structured financials lag roughly two to three years (latest tax
  year 2023 as of August 2026). If the card shows any figure, does it show
  which year it is from?
- `data_source` varies **per record within one response set**, across at least
  six distinct snapshot stamps. Does §7's per-field provenance rule imply a
  per-field as-of date on the page?
- IRS revocation posting lags revocation itself. Observed: revoked 15-MAY-2026,
  posted 11-AUG-2026, about three months. Even a same-day IRS pull has a blind
  window. What is the posture toward that window?
- Three legs, three cadences: IRS monthly, org site quarterly per §7,
  ProPublica unstated. What does a page mean when its three halves are as-of
  different dates?
- The EO BMF cadence is **UNVERIFIED**.
- If bulk 990 XML is the only route to mission and website, refreshing means
  re-pulling a 43MB index and 71MB batches. At what frequency, and does
  anything expire in between?
- ProPublica retains organizations the BMF has dropped, indefinitely on the
  evidence here. If a gate is built on BMF presence, what happens to a record
  already surfaced when the org disappears from the next BMF?

---

## Forks for FT

Plain English, no recommendation, no presumed build decision.

**1. The status gate cannot follow later.** The evidence is 31 of 40 revoked
organizations returned by ProPublica as exempt and deductible, including at its
freshest snapshot. The fork: does the first usable version include the IRS
revocation leg, or does no organization surface at all until it does? There is
no third option in which ProPublica alone is safe.

**2. NTEE to the nine causes is an act of authorship.** See "Appendix: the
taxonomy question" below for how hard. The fork: accept a single NTEE-derived
cause and lose the multi-cause card that 10 of 17 records use; or treat
`causes` as honest-absence and let the funder's own GPS do the filtering; or
something else. A hand-built NTEE-to-cause table is StewardHouse classifying
organizations, which is the thing §7 forbids.

**3. Four rendered fields have no source at all**: `cat`, `led`, `badge`,
`demo`. The fork: remove them from the card, keep them as honest-absence, or
rule that some are structural scaffolding rather than authored content. `badge`
is the sharpest case, since it is a one-line characterization of an
organization written by StewardHouse.

**4. Which field is the name.** Group-ruling affiliates share one legal name
across eight distinct organizations. §7 requires names verbatim from records
but does not say which record field is the name. This needs a ruling before
anything renders a name.

**5. ProPublica's terms need the same look Candid was going to get.** They
forbid distributing the data "in whole or in part" on a stand-alone basis and
forbid changing it "except to update or correct it", and they are **silent on
AI and machine-learning use**, which is the exact issue that deferred Candid.
Silence is not consent. Separately, the page fetched presents as an archive
through 2023, so whether these are the current terms is unverified.

**6. Mission text does not exist for small filers.** 990-EZ and 990-PF carry no
mission narrative at all, and 990-N carries no filing. Combined with roughly
four in ten filings having no usable website URL, some organizations have no
mission text reachable from any of the three sources. The fork: are such
organizations surfaceable with no mission, or does a usable website become a
precondition for surfacing them?

**7. The 990 XML route is bulk-only.** No per-filing HTTP fetch exists on
either irs.gov or ProPublica. Reaching mission and website means a 43MB index
plus 71MB batch zips. There is no backend for org data today, and nothing reads
the `org` table that already exists. The fork is about where that work would
run, and it is a build decision, so it is left here.

**8. The D1 org seed still carries the defanged fields.** `migrations/
0002_seed.sql` retains authored executive-director names, board counts, budget
bands, program names and funder lists for all 17 records, inside `extensions`
JSON. Nothing reads the table, so nothing renders them. The fork: leave as
inert, or clean. Noted because the defang was understood to be complete.

---

## What could not be determined without building

- Whether ProPublica applies an undocumented rate limit to sustained JSON use.
  About 150 calls saw no throttling; that is not evidence about volume.
- Whether the current ProPublica terms of use differ from the archived page
  that the documented link redirects to.
- The IRS BMF code tables (`DEDUCTIBILITY`, `STATUS`, `FILING_REQ_CD`). Both
  information-sheet PDFs were unparseable by the available tooling. Only
  observed values are reported.
- The IRS EO BMF update cadence, from the primary page.
- The meaning of the fourth character in 4-character NTEE codes (`L20Z`,
  `B20B`, `P28Z`, `E20Z`). Not documented on the API page.
- Whether the 83% website-presence and 60% URL-shaped rates hold across the
  full archive. One batch of one year was sampled (409 filings of 12,245 in
  that batch).
- Whether `ActivityOrMissionDesc` and `MissionDesc` disagree in practice, and
  how often. Both were confirmed present on 100% of full 990s; their contents
  were not compared at scale.

---

## Appendix: the taxonomy question

Reported to establish difficulty. No mapping is proposed.

**Observed NTEE values across the spread and a 500-record search sample:**
`P210`, `K310`, `B99`, `B41`, `C300`, `X90`, `X21`, `L20Z`, `N63`, `Q330`,
`E220`, `P820`, `L82Z`, `B20B`, `P73`, `P28Z`, `A6C`, `A68`, `X99`, `Q12`,
`C600`, `C30`, `I83`, `C01`, `T20Z`, `D20`, `N32`, `K99`, `G11`, `E20Z`,
`P87`, `T03`, `B82`, `O20`, `T20I`, `B99Z`, `X21Z`.

**Shape.** In a 500-record sample: **18% have no NTEE code at all**. Codes are
3 characters (346) or 4 characters (64). 25 distinct major-group letters
appeared. `raw_ntee_code` was identical to `ntee_code` in every record
observed.

**How coarse or fine.** The mismatch runs in both directions at once, which is
what makes it hard rather than merely tedious.

*Many-to-one* in places: the whole `A` major group plausibly lands on Arts &
Culture.

*One-to-many* in others, and this is the blocking case. Major group `B`
(Education) contained all three of: **Khan Academy** (`B99`), which reads as
Education; **Positive Coaching Alliance** (`B99`), which is a sports
organization; and **Year Up** (`B41`), which reads as Economic Mobility. Three
StewardHouse causes inside one major group, and **two of them share the
identical code `B99`**. The letter does not determine the cause, and neither
does the full code.

**Where it is ambiguous.** `B99` is "Education N.E.C.", a residual bucket
holding organizations whose actual work spans several causes. `X21` (a
Protestant code) is carried by **Glide Foundation**, whose public work is food
and housing, so the code names the corporate form rather than the program. The
`P`, `K`, `L`, `E`, `C`, `N` and `X` groups all straddle StewardHouse cause
boundaries in the sample.

**Can one org map to several causes.** The card already does this: 10 of 17
fixture records carry two causes. **NTEE assigns exactly one code per
organization.** Going from one code to several causes cannot be a lookup. It
requires either a second signal or an authored judgment about what an
organization does.

**A further wrinkle.** ProPublica's own `ntee[id]` search filter accepts values
1 through 10, a coarser grouping than the 26 NTEE major groups. So the API's
filter granularity aligns with neither NTEE major groups nor the nine
StewardHouse causes.

**Difficulty, stated plainly.** This is not a mapping table that is merely long.
Three properties make it something other than a lookup: 18% of records have no
code; identical codes carry organizations belonging to different causes; and
the source is single-valued where the destination is multi-valued.

---

## FT rulings (2026-08-15)

Ruled by FT on the findings above. The eight rulings answer the eight forks one
to one, in order. The forks section is left exactly as it was written; it
records what was open, and this section records what was decided.

**1. Status gate.** The IRS revocation leg ships with the first org record, or
no org record surfaces. ProPublica alone is never sufficient. The IRS sources
are federal government works and carry no terms encumbrance, so this ruling
does not depend on ruling 5.

**2. NTEE.** No mapping table. Render the NTEE code and its verbatim IRS label,
with provenance. StewardHouse-assigned causes are dead as an org-record field.
Cause filtering moves to the funder's own GPS.

**3. `cat`, `led`, `badge`, `demo`.** Removed from the card shape, not rendered
as honest-absence. A field with no possible source is not absent.

**4. Name.** IRS legal name verbatim. The EIN renders alongside it where
group-ruling affiliates collide. No composed display name.

**5. ProPublica terms. RESOLVED 2026-08-17.** Andrea at ProPublica answered
directly: the data in the Nonprofit Explorer API is all public IRS data that
can be downloaded directly from the IRS, so StewardHouse may store or use it
however it sees fit.

**The reasoning is DURABLE, not permissive, and the distinction matters more
than the permission.** ProPublica is not granting a licence it would be free to
revoke; it is declining to claim rights it does not hold, because the
underlying records are public federal work. The AI and machine-learning silence
that made this ruling blocking stops mattering for the same reason: there is no
proprietary layer for the terms to have been silent about. An answer that
rested on goodwill would have needed re-asking; this one does not.

**What it does NOT do:** it does not touch ruling 1. ProPublica remains never
sufficient alone, for accuracy reasons that have nothing to do with terms.

**The Candid comparison now has an answer, written down rather than inferred.**
This ruling previously said whatever standard applied here also applied to
Candid, which was deferred over the same silence. It does NOT transfer.
ProPublica cleared because the data underneath it is public federal record.
Candid's is not: their corpus carries their own research and enrichment, so the
consent requirement in their terms is a claim about material they do hold.
Candid stays deferred on its own terms, and this ruling is not a precedent for
it.

**FRESHNESS, and it is NEW information the spike could not have found.** In the
same reply Andrea volunteered, unprompted, that the API is no longer in active
development and runs roughly a year behind ProPublica's own front end, because
it reads a table that was deprecated when they rebuilt their data structures.
Nothing in the API surface or its documentation says this, and no amount of
sampling would have established it.

**What it explains, and what it does not.** The spike found 39 of 40
IRS-auto-revoked organizations still served, 31 of them asserting
`status=1, deduct=1` (`:324-328`), and attributed it to retention: the fault
is retention, not the BMF (`:338`). A year of lag is a plausible ADDITIONAL or
ALTERNATIVE mechanism for the same observation, and it was not available to
the spike as a hypothesis. It does not settle the question, and one recorded
observation sits against a simple lag explanation: a targeted sample of eight
recent revocations came back with ProPublica's freshest snapshot stamp,
`current_2026_07_21` (`:330-332`). A stamp records when their copy refreshed,
not how current the table underneath it is, so the two can coexist. Recorded
as unresolved between the mechanisms rather than decided.

**Ruling 1 is UNCHANGED either way, and that is the load-bearing point.** A
year-stale deductibility assertion is exactly as wrong to an athlete deciding
where to give as a permanently stale one. The IRS revocation leg still ships
with the first org record or no org record surfaces.

**6. Mission text.** Orgs surface without it. Honest absence. A usable website
does not become a precondition for surfacing, because that rule would exclude
orgs in correlation with size.

**7. Bulk XML route.** Deferred, and unscoped until ruling 5 resolves.
**RULING 5 HAS NOW RESOLVED (2026-08-17), so the condition on this deferral is
met.** The route is unblocked and still unscoped; nothing about scoping it
happened automatically when the block lifted.

**And a correction that predates the resolution: BMF INGEST WAS NEVER BLOCKED
BY RULING 5.** Ruling 1 already recorded that the IRS sources are federal
government works carrying no terms encumbrance, and said in terms that it does
not depend on ruling 5. The four Discover facets read BMF `CITY`, `STATE`,
`REVENUE_AMT` and `RULING`, all of which sat outside the block the whole time.
Any line describing the ingest as waiting on a terms question was wrong when
written, not merely stale now. What ruling 5 gated was a persisted copy of
PROPUBLICA data specifically, which is a narrower thing than the ingest.

**8. D1 org seed defanged fields.** Clean, as its own slice, scheduled after
P-6.
