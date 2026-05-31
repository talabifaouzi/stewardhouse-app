# Unified data layer

Adapter-over-existing layer that normalizes the three customer surfaces' fixtures (Individual, Advisor, Enterprise) into seven unified entity shapes plus a synthetic seed for population realism. Operations reads from this layer; customer surfaces are NOT migrated and not touched.

## What this layer is

- **Adapters** (slices 2–4): pure functions that read each source surface's fixtures and return arrays of unified entities. Each record is tagged with `sourceSurface`.
- **Synthetic seed** (slice 5): hand-authored institutions, advisor practices, and individuals that populate Operations alongside the real adapter output. Records carry `sourceSurface: 'synthetic'`.
- **Assemble + read API** (slice 6): combines adapter output + synthetic seed into a single in-memory store with thin query helpers (`personsBy`, `countBy`, `byId`, etc.).
- **Operations Overview rewire** (slice 7): replaces hardcoded stat literals on `/operations` with derived counts.

## What is DEFERRED

- **Same-person dedup across surfaces** (Marcus c-001 in Individual + Advisor and id:1 in Enterprise → THREE Person records under unified, no merging). See discovery doc section 7.
- **Stage / cohort taxonomy normalization** — advisor `New/Active/Mature/Sunset` and enterprise `active/inactive/invited` pass through as-is. Both "cohort" concepts (advisor issue-area vs enterprise program-year) remain as two unified Cohort records, distinguishable by `sourceSurface`.

## What is ALLOWED

- **Inter-entity FK pointers** between distinct entities (per ER-pointer decision 2026-05-31): `AdvisorPractice.leadPersonId`, `Institution.partnerAdvisorPracticeId`, `Institution.staffPersonIds`, `ProgramParticipation.personId` + `contextId`, `Gift.giverPersonId` + `recipientOrgId`. These are explicit authored pointers between different entities, NOT same-person identity resolution.

## See also

- `docs/operations-current-state-2026-05-31.md` — Operations surface inventory + assessment (why this layer exists).
- `docs/cross-surface-data-model-discovery-2026-05-31.md` — full data-shape mapping, conflict catalog, locked decisions, proposed model design baseline.
