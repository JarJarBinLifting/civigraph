# System / Centered Graph Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for this coupled integration.

**Goal:** Integrate the approved system and centered views into the current Civigraph explorer with shared selection, filters, periods, sources and shareable state.

**Architecture:** Keep Cytoscape for rendering. Add fCoSE for whole-corpus placement. Ship generated positions with a SHA-256 topology signature for immediate loading; use a Web Worker if that signature no longer matches, and cache positions while exploring. A pure system projection owns category/period filtering and preserves every declaration. The existing detail panel owns provenance; the existing centered renderer retains its temporal layout. Camera receipts restore each view when returning.

**Tech Stack:** Next.js 16.3.4, React 19.2.8, Cytoscape 3.34.2, cytoscape-fcose 2.2.0 (MIT).

**Spec:** Approved conversation: two modes of one explorer; global polycentric topology inspired by the supplied Obsidian reference; preserve selection, categories, period and prior framing. Inspect and match the changed site before implementation.

## Constraints

- Existing white / navy / semantic-category design; no wholesale dark-theme replacement.
- Use the merged application corpus (over 2,300 entities), not the smaller mockup snapshot.
- Layout positions do not assert political proximity, influence or temporal distance.
- Source declarations must remain reachable, including parallel statements.
- Keep existing mockups. Initial implementation was local; the owner subsequently authorized push and deployment on 7 September 2026.

## Tasks

- [x] Research primary GitHub repositories and inspect the live current site.
- [x] Write failing tests for system projection, temporal/category filtering, view switching and URL round trips.
- [x] Implement projection and state contracts, add fCoSE and worker with cancellation / error handling.
- [x] Integrate SystemGraphCanvas, shared mode selector, existing evidence panel, matching style, both camera receipts, accessible list fallback and export context.
- [x] Run focused tests, full unit suite, typecheck, lint and build. Inspect the rendered site and test switches, selection, filters, periods, sources and mobile behavior.
- [x] Record research choice and actual validation; hand off local working application.

## Repository research (7 September 2026)

- [Cytoscape.js](https://github.com/cytoscape/cytoscape.js): existing renderer and interaction model.
- [fCoSE](https://github.com/iVis-at-Bilkent/cytoscape.js-fcose): Cytoscape extension providing force-directed placement, incremental refinement and position constraints; MIT. Chosen to extend the installed engine.
- [Sigma.js](https://github.com/jacomyal/sigma.js) / [Graphology](https://github.com/graphology/graphology): WebGL graph rendering and graph model; suitable alternative for substantially larger graphs but would introduce a second renderer / graph API here.
- [React Force Graph](https://github.com/vasturiano/react-force-graph): 2D/3D force-graph components; attractive for a future physics/3D exploration, but not necessary to deliver the two approved 2D views.

No claims of performance superiority without measurement on this application's corpus.

## Delivered behavior

- The free home opens in System; existing entity URLs retain Centered. The perspective is encoded in shared and saved URLs.
- System includes the merged corpus: 2,394 entities, 5,599 unique connections and 7,568 source declarations. Categories and documented-period matching use the existing rules.
- Selection, one- or two-step neighborhood highlighting, zoom, node dragging, approach, source inspection, and return to centered exploration share the current atlas UI.
- Both camera receipts were verified across a round trip. The example system camera returned to zoom 0.2414930302042563 and pan (424.5539273861607, 255.92421463963584); the centered SVG transform also matched before and after.
- The legacy ENA URL preserved `education`, `time=same`, `period=ena-senghor-2004-Q3052772` and reference year 2001 between perspectives. The official Attali report link remained selected when switching.
- The system list is paginated by 100 declarations. Verified 1–100 then 101–200 out of 1,094 education declarations.
- PNG export was opened and visually inspected. It includes the graph, filters, snapshot date, legend, interpretation limits and view URL. The export guard now ignores Cytoscape's spurious pending-image state for plain points with no background image.
- Mobile checked at 390 × 844: no horizontal overflow; perspective controls, time filters, canvas tools and evidence panel remain reachable.

## Geometry maintenance and local preview

Run `npm run data:layout` after changing the corpus topology. This uses the same dataset merger and fCoSE implementation as the worker, then writes `src/data/system-layout.json`. A test checks that the snapshot matches the complete current corpus; the browser independently validates its signature and every coordinate before using it. Node labels, source additions on an existing pair and other non-topological updates do not invalidate geometry.

Runtime fCoSE on this machine varied from about 7 to 27 seconds, so it is a fallback rather than the initial path for the shipped corpus. No sources or political relationships are inferred by the layout.

The local validation build is isolated from the existing application on port 4300:

```powershell
$env:CIVIGRAPH_BUILD_DIR='.working/system-next-final'
npm run build
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 4343
```

Only the task's temporary development/earlier validation servers were stopped. The mockups, existing application and unrelated user files remain. No commit, push or deployment was performed.

## Final verification

- `npm test -- --maxWorkers=2`: 24 files, 99 tests passed.
- `npm run lint`: passed.
- Isolated `npm run build`: passed, including TypeScript and page generation.
- `git diff --check`: passed. Next-generated changes to `tsconfig.json` and `next-env.d.ts` were restored to their original contents after validation.
- Final production browser receipt: `layoutSource=snapshot`, coordinate loading/validation 81 ms, 2,394 nodes and 5,599 connections; no browser errors. This timing excludes page loading and canvas rendering.
- Runtime snapshot is approximately 94 KB before compression. Slow client-side fCoSE is reserved for a topology mismatch; the current corpus loads the checked snapshot.
- Preview remains running at http://127.0.0.1:4343/ with the final build.

## Publication follow-up

The owner authorized push and deployment after reviewing the local implementation. The feature is prepared for `JarJarBinLifting/civigraph`, branch `main`, with the existing 99-test, lint, build and browser validation. Mockups and generated agent-guidance files remain outside this feature commit.
