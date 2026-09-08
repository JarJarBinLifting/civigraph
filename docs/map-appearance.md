# Finition de la carte — 8 septembre 2026

Changements locaux limités au rendu : cercles fins pour les personnes, institutions légèrement plus grandes, contours de sélection nets et halos adaptés à la forme. Les fonds et contours au repos sont adoucis ; les couleurs de catégorie sont renforcées dans le voisinage exploré. Les données, sources et positions mémorisées du système restent inchangées.

Les connexions utilisent des traits plus fins. Les petites sélections du système (80 entités maximum) ont des courbes légères ; le corpus entier conserve des traits droits. La vue centrée conserve les courbes séparant ses déclarations parallèles.

Le zoom et les recadrages du système durent 280 ms ; les changements de réseau centré durent 320 ms. Le réglage `prefers-reduced-motion` désactive ces mouvements. Les animations de caméra ne s'accumulent pas et sont interrompues quand on reprend le graphe à la main. La sélection dans la carte des institutions ne recrée plus le moteur de rendu.

## Vérifications

- `npm test -- --maxWorkers=2` : 27 fichiers, 129 tests réussis.
- Build Next.js isolé dans `.working/map-polish-build` : réussi, compilation TypeScript et génération des pages comprises.
- ESLint ciblé sur les cinq fichiers de rendu modifiés ou ajoutés : réussi.
- Parcours visuels dans le navigateur intégré : vue générale, recherche d'Amélie de Montchalin, zoom, rapprochement, filtre Formations, vue centrée et retour Système, institutions et voisinage isolé.
- Inspection à 390 × 844 : carte visible et commandes disponibles ; largeur du document de 390 px, sans débordement horizontal. Format du navigateur restauré ensuite.
- Aucun nouveau test de performance chiffré ni audit complet d'accessibilité. Le réglage de réduction des animations a été vérifié dans le code, sans émulation du système d'exploitation.

Prévisualisation initiale du worktree sur `http://127.0.0.1:4313/`. Les modifications présentes avant cette intervention sont conservées.

## Intégration sur main

Les finitions sont intégrées avec les améliorations du placement des noms, les lectures Groupes/Individus, les perspectives thématiques et les commandes regroupées. Les appartenances politiques restent disponibles dans les fiches et sont renforcées sur les entités explorées.

Un clic dans le fond ferme la fiche, retire la sélection et quitte le voisinage isolé sans réinitialiser le zoom ni les filtres. Le lien partagé ne réintroduit pas de sélection après ce clic.

- Version fusionnée : 136 tests réussis dans 28 fichiers ; ESLint ciblé et build de production Next.js, TypeScript compris, réussis.
- Vérification visuelle sur la version de production locale : ensemble, sélection, voisinage isolé, désélection et perspective Formation.
- Zoom mesuré avant et après la désélection du voisinage isolé : `0.12593833453714967`, inchangé ; aucune entité mise en évidence après le clic, fiche fermée et paramètres de filtres conservés.
