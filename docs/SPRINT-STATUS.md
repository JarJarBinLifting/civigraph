# Sprint Civigraph — point de reprise

## Périmètre et état de départ

6 septembre 2026. Dépôt local `JarJarBinLifting/civigraph`, branche `main`, HEAD initial `1c008cd82cb4c64010c54f9698c2ecd9d6cfdfb8`. Un seul worktree, aucun changement local initial. Node 24.18.0, npm 11.16.0, dépendances déjà installées. Aucun push ni déploiement autorisé.

Le cahier des charges fourni est exécuté par lots, dans cet ordre :

1. Baseline, mesures, index du graphe si justifié, caméra, lisibilité, agrandissement et dialogues.
2. Carte de comparaison sourcée, puis chemins institutionnels bornés et partageables.
3. Parcours chronologique dans les profils.
4. Pages documentaires, méthode et indexation explicitement désactivée par défaut.
5. Sauvegardes locales puis export PNG, après stabilisation des priorités.
6. Images et portraits locaux, avec provenance, auteur et licence explicite lorsque disponibles.

Les sources, identifiants, précisions temporelles, réseau complet et ancienne navigation restent les invariants de chaque lot. Les contrôles utilisent les versions verrouillées et Chrome déjà installé. Le quota restant n'est pas connu en direct.

## Dernier lot stable

Lot 1 implémenté et vérifié : index partagé, recherche normalisée une fois, chronologie linéaire, séparation pan/zoom, voisinage inspecté, labels prioritaires, carte agrandie et confinement du focus. Aucune donnée source modifiée.

## Vérification et mesures

- Baseline : `npm run lint`, `npm run typecheck`, `npm test` (53 tests / 10 fichiers), `npm run build` réussis ; `npm run test:e2e` : 39 réussis, 3 cas bureau ignorés sur mobile, 1,2 min.
- Nouveau build de baseline `LeDGn0Gsk1TtQTh9YKvyE`, servi par le processus lancé dans `.working/sprint/server.pid`.
- Avant : page initiale 532 133 octets transférés (gzip), 6 240 472 octets décodés ; graphe prêt en 940 ms (une navigation locale, 1440 × 1000). Pas de requête tierce, pas de pageerror ni de débordement dans les 5 captures.
- Caméra ENA, Chrome 1982 × 1103 : 120 déplacements synchrones, 1 699 ms, 44 760 événements de style ; Assas : 1 047 ms, 26 040 événements. Les 123/69 nœuds restent présents.
- Sélecteurs, médiane de 5 × 200 appels Node 24 : réseau 0,351 ms, comparaison 0,387 ms, recherche « em » 39,613 ms, chronologie 0,311 ms. Le script de mesure a terminé et écrit ses résultats mais dépassé le délai Vitest par défaut (41,5 s pour le tout) ; délai ajusté pour ce script de mesure uniquement.
- Régressions observées avant correctif : 3/3 nouveaux tests échouent pour recalcul de styles lors du pan, agrandissement absent et sortie du focus avec Maj+Tab. La baseline préexistante reste verte.
- Après lot 1 : lint, typecheck, build réussis ; 54 tests unitaires ; suite Chrome complète 45 réussis / 3 ignorés, 47,6 s. Les identités, pivots rapides, retour pendant animation, anciennes URL, périodes et réseaux complets passent.
- Même mesure Node après : réseau 0,058 ms, comparaison 0,0084 ms, recherche 0,612 ms, chronologie 0,122 ms. Même mesure Chrome ENA : 120 déplacements en 0,3 ms, aucun événement de style (mesure synchrone du gestionnaire, pas le temps complet de rendu). Taille transférée initiale pratiquement inchangée : 532 173 octets ; le transfert du corpus complet reste une limite documentée.
- Captures après inspectées à 1440 × 1000, 1982 × 1103 et 390 × 844. Vérification supplémentaire : sélection réelle d'Albane Gaillot, 69 nœuds conservés, 2 nœuds du voisinage mis en évidence, 67 atténués. Source mobile lisible dans la carte agrandie et bouton de fermeture toujours accessible après défilement. Compression du panneau mobile observée puis corrigée.
- Serveur existant sur `127.0.0.1:4300` : Civigraph répond HTTP 200. Son identité sera contrôlée avant remplacement ; ne pas arrêter un processus inconnu.
- Captures et mesures du sprint : `.working/sprint/` (artefacts locaux ignorés par Git).
- Les processus Node enfants sont bloqués dans le bac à sable Windows (`spawn EPERM`) ; utiliser l'exécution autorisée hors bac à sable pour les commandes concernées.

## Fichiers et limites

- Fichiers du lot 1 : `src/lib/graph-index.ts`, `graph.ts`, `graph-layout.ts`, `profile.ts`, `focus.ts`, `graph.test.ts` ; `Explorer.tsx`, `GraphCanvas.tsx`, `DetailPanel.tsx`, `Modal.tsx`, `globals.css` ; `tests/sprint-exploration.spec.ts`.
- Captures avant produites dans `.working/sprint/before-*.png` ; ENA inspectée. Captures après et mesures comparatives à réaliser après reconstruction.
- Les photos feront l'objet d'un import facultatif ; la navigation restera autonome et les attributions ne seront pas assimilées à la licence CC0 du corpus Wikidata.

## Prochaine action précise

Lot 2A : ajouter une carte comparative avec A à gauche, B à droite, entités communes au milieu, sélection et preuves de chaque côté. Conserver les cartes accessibles et le contrat d'URL. Ensuite seulement, ouvrir le lot 2B.
