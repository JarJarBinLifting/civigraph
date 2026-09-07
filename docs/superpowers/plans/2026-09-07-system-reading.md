# System reading implementation plan

> Historical implementation stage. The default bounded institutional overview described here is superseded by [the full system map](2026-09-07-global-system-map.md). Current delivery and verification are recorded in [system-reading.md](../../system-reading.md).

> **For agentic workers:** Use superpowers:executing-plans for direct execution in this workspace. Implementation is authorized in the current conversation.

**Goal:** Make systemic relationships discoverable through institutions, multiple-person common connections, a matrix, progressive evidence and reversible navigation.

**Architecture:** Derive institutional participation once from the already filtered system relations. Count distinct people, retain every source statement, and reuse temporal comparison and RelationEvidence. Add a SystemExplorer coordinator alongside the existing raw SystemGraphCanvas, with explicit levels and serializable selection. Keep the centered explorer and its chronology intact.

**Tech Stack:** Existing Next.js 16.3.4 / React / TypeScript / Cytoscape / Vitest. No new dependencies.

**Spec:** User-approved recommendations in the previous turn; current screenshots and notes in `.working/audit-system-2026-09-07/`.

## Global constraints

- Local implementation only. Preserve unrelated mockups and guidance. No push or deployment.
- Institutional connections mean shared documented people, not influence, meetings or simultaneous presence.
- Exclude generic office titles from institutional aggregation; contextual offices remain inspectable.
- Categories and existing documented-period rules apply before aggregation. Missing dates never imply current or overlapping tenure.
- Disclose any display limit and make all results available through search/pagination. Keep map/list alternatives and labeled keyboard controls.

## Tasks

- [x] 1. Add `src/lib/system-analysis.ts` and tests. `institutionParticipation(graph)` returns institutional records with distinct person → source statements; `sharedInstitutions(records, people, threshold)` returns all/at-least-two intersections; `institutionBridges(records)` returns pairs with distinct people; `passageOverlap` reuses comparePeriods for evidence summaries. Test duplicate statements, reversed directions, excluded generic roles, empty filters, missing dates and disjoint periods.
- [x] 2. Extend `ViewState` and parse/serialize with `systemLens`, `group`, `commonThreshold`, `commonDisplay`, `institution`, `bridge`. Validate IDs and preserve saved/share state. Example: `parseView(serializeView({...base, group:['a','b'], systemLens:'common'}), fixture)` must restore exactly the valid group and lens.
- [x] 3. Add `SystemExplorer`, `InstitutionOverview`, `CommonInstitutions`, and `AnalysisGraph`. Default system overview has a bounded, disclosed institutional map, searchable complete index and weighted bridges. Opening an institution reveals participants and source-backed bridges; opening a bridge reveals people and both passages. Group selection supports map/matrix and progressive evidence.
- [x] 4. Integrate in `Explorer`, retain raw graph under Entités, expose group selection from entity search and selected person, keep search in enlarged mode, show categories and temporal scope. Add isolation and camera undo to `SystemGraphCanvas`; show current zoom and retain geometry.
- [x] 5. Add focused browser coverage for group → common → matrix → evidence, institution → bridge → passages, URL restoration, empty categories and enlarged/mobile navigation. Run unit suite, lint, typecheck/build and inspect screenshots with the browser. Review changes and record actual verification.

## Validation commands

```powershell
npm test -- src/lib/system-analysis.test.ts src/lib/system-graph.test.ts
npm test -- --maxWorkers=2
npm run lint
npm run typecheck
npm run build
```

Browser checks use the existing localhost server and CUA. Browser regression specs live in `tests/system-reading.spec.ts`. Existing raw-renderer tests explicitly select `systemLens=entities` so they continue to test their original contract.

## Delivery receipt

Implemented and verified locally on 7 September 2026. Unit suite: 25 files / 112 tests passed. Lint and TypeScript passed. Final isolated Next build passed. Browser checks through CUA covered institutions, bridge evidence, group selection, all/two thresholds, matrix sources, URL reload, temporal filtering, mobile containment, enlarged search, camera undo and isolation. Regression specs were added; the Playwright CLI suite was not run in this task. See `docs/system-reading.md`.
