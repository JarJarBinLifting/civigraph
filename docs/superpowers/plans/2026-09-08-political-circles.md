# Cercles politiques et parcours entre milieux

**Objectif et spécification acceptée :** montrer les institutions communes à des personnes de partis différents, et les personnes présentes dans plusieurs milieux. Chaque passage conserve son rôle, sa période et sa preuve ; aucune relation personnelle ni mesure d'influence n'est inférée.

**Architecture :** deux lectures dans Explorer réutilisent le corpus filtré et les composants de preuve. Une classification éditoriale explicite par identifiant distingue administration, cabinets, entreprises, médias et cercles ; les partis et formations sont reconnus par leurs relations. Les compositions Young Leaders publiées par la French-American Foundation enrichissent le corpus selon le format existant.

**Contraintes :** préserver les modifications étrangères à cette tâche. Le périmètre initial était local ; le propriétaire a ensuite autorisé le déploiement et le push le 8 septembre 2026 (voir `docs/political-circles.md`). Les appartenances politiques historiques sont explicitement distinguées d'une contemporanéité établie. Une organisation non classée reste non classée. Aucune classification par sous-chaîne du nom.

## Exécution directe

- [x] Tester puis implémenter `src/lib/network-insights.ts` : au moins deux personnes et deux partis distincts, exclusion des statuts et groupes parlementaires, preuve des quatre périodes communes pour la lecture contemporaine, dédoublonnage des passages et milieux. Tests de non-inférence pour les dates absentes et les changements de parti.
- [x] Enrichir `src/data/institution-participations.json` avec des promotions vérifiées et documenter le périmètre ; classer les institutions du corpus dans `src/data/institution-milieus.json`.
- [x] Intégrer `NetworkInsights.tsx`, la lecture des milieux dans `PersonProfile.tsx`, les paramètres URL dans `types.ts` et `graph.ts`, les entrées dans `Explorer.tsx` et `SystemExplorer.tsx`. Afficher les preuves des passages et des partis, une recherche, la pagination et le retour à la carte.
- [x] Vérifier les cas réels, les liens partageables et les filtres ; exécuter tests, lint, typage, build, puis parcours navigateur ordinateur/mobile avec captures. Régénérer la disposition si le corpus change sa topologie.

Vérifications prévues : `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, puis Playwright sur un serveur de ce worktree distinct du serveur utilisateur.
