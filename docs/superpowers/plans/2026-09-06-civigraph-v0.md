# Civigraph V0 Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task, directly in the current task. Steps use checkbox syntax for tracking.

**Goal:** Livrer localement les neuf fonctions du PRD sur un corpus Wikidata de 40 personnes.

**Architecture:** Next.js client application around a deterministic graph domain module and a committed JSON snapshot. A reproducible importer retains statement provenance and temporal precision. Cytoscape renders the graph; a semantic list provides keyboard access to the same relationships.

**Tech Stack:** Next.js 16, React, TypeScript, Cytoscape, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-06-civigraph-v0-design.md`

## Global Constraints

- 30 à 50 personnes et les neuf fonctions du mini PRD.
- Chaque relation conserve identifiant de déclaration, propriété, date de début/fin avec précision si disponible, URL Wikidata et références présentes.
- Une déclaration sans date de fin n'est pas présentée comme actuelle.
- Aucun push ou déploiement demandé.

### Task 1: Sourced corpus and graph domain

Files: `package.json`, `tsconfig.json`, `scripts/import-wikidata.mjs`, `scripts/people.json`, `src/data/graph.json`, `src/lib/types.ts`, `src/lib/graph.ts`, `src/lib/graph.test.ts`, `src/lib/dataset.test.ts`.

Interfaces: `searchEntities(data, query, peopleOnly?)` returns matching entities; `getVisibleGraph(data, state)` returns nodes and relations around expanded entities respecting categories; `getCommonConnections(data, leftId, rightId, categories)` returns shared targets with each person's evidence; `parseView(search, data)` and `serializeView(state)` round-trip a validated `ViewState`.

- [x] Install the pinned available Next/React/Cytoscape runtime and test dependencies using a workspace npm cache.
- [x] Write failing behavior tests using a small hand-derived corpus: accent-insensitive search, category removal, one-hop extension, shared target evidence, invalid URL fallback, empty filters and round-trip state.
- [x] Run `npm test -- --run` and observe missing behavior, then implement the graph domain to pass those contracts.
- [x] Resolve 40 French Wikipedia titles via Wikidata and save the imported statement snapshot plus source revisions. Retain only the five specified properties and non-deprecated entity-valued statements.
- [x] Validate unique IDs, source endpoints, source URLs, dates, referenced nodes, and the 30–50 person constraint.

### Task 2: Full exploration experience

Files: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/components/Explorer.tsx`, `GraphCanvas.tsx`, `EntitySearch.tsx`, `DetailPanel.tsx`, `Comparison.tsx`, `src/lib/presentation.ts`.

Consumes: domain functions and immutable `GraphData`. Produces: the French UI at `/`, with validated query string state and real node/edge interactions.

- [x] Build the responsive shell with search, category filters, real corpus counts and a visible prototype label.
- [x] Render a bounded, legible graph. Selecting a node exposes its fiche; expanding it adds its adjacent entities. Selecting an edge exposes its relation and statement references.
- [x] Add keyboard-usable relation list, focus states, semantic form labels, Escape dismissal and mobile panel toggles.
- [x] Add two-person comparison and common connections with both evidence lists; support no-result cases.
- [x] Synchronize view state with browser history, generate a share URL and supply a copy fallback when clipboard permission is unavailable.
- [x] Add method/source explanation with corpus date, exact coverage, uncertainty labels and V0 limits.

### Task 3: Verification and local delivery

Files: `tests/explorer.spec.ts`, `playwright.config.ts`, `README.md`, `docs/verification.md`.

- [x] Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`; repair failures at their source.
- [x] Start the app on an available loopback port. Exercise search, source edge, extension, category removal, comparison, share reload, back navigation and mobile layout with Playwright.
- [x] Inspect desktop and mobile screenshots and fix observed layout issues.
- [x] Record actual commands, results, corpus integrity and remaining scope limits. Document install/start/import procedures and the V1 boundary.
- [x] Review the diff and repository status. Leave the running local preview and a concise delivery handoff; a local checkpoint commit is permitted after checks.
