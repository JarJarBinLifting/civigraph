# Optimisation du graphe système — 7 septembre 2026

## Comportement livré

- Pendant le déplacement, le zoom et le glissement d'un point, le moteur conserve la scène en cache. Le placement des noms reprend après 120 ms sans mouvement.
- Un déplacement seul ne réécrit plus les tailles de tous les points et traits. Les labels cachés ne reçoivent plus de styles à chaque passage.
- Les collisions entre labels et obstacles utilisent une grille spatiale. Le système examine au plus 160 candidats ordinaires et conserve un plafond de 60 labels (30 en petite largeur), avec priorité aux noms essentiels. Les candidats sont répartis dans l'espace pour ne pas consacrer tout le budget au centre dense.
- Les événements de survol sont regroupés ; seuls les styles de surbrillance qui changent sont appliqués. Les relations et index filtrés sont réutilisés quand la sélection change.
- Un export PNG force la mise à jour finale des labels avant de capturer la carte.
- Les positions précalculées, les déclarations, les filtres et les preuves restent inchangés. Aucun moteur ni dépendance ajouté.

## Mesure comparative

Deux builds de production locaux, Chrome headless, viewport 1440 × 1000, même machine, exécutés successivement. Corpus identique : 2 394 entités et 5 599 connexions.

```powershell
node scripts/measure-system-performance.mjs http://127.0.0.1:4343 http://127.0.0.1:4346
```

| Mesure | Avant, port 4343 | Après, port 4346 |
| --- | ---: | ---: |
| Déplacement programmatique + deux callbacks d'animation, médiane de 24 essais | 453 ms | 4,2 ms |
| Même déplacement, 95e percentile | 519,8 ms | 64,6 ms |
| Survol + deux callbacks d'animation, médiane de 12 essais | 281,2 ms | 126,1 ms |
| Même survol, 95e percentile | 294,4 ms | 185,5 ms |
| Tâches longues pendant cinq gestes de molette puis un déplacement de souris en 12 étapes | 36 | 16 |
| Durée cumulée de ces tâches longues | 5 478 ms | 1 433 ms |
| Plus longue tâche du scénario | 303 ms | 159 ms |

Le temps cumulé des tâches longues diminue de 74 % sur ce scénario, et la médiane du survol de 55 %. Les callbacks d'animation headless ne constituent pas une mesure de fréquence d'affichage ni une garantie de 60 FPS. Les timings dépendent du matériel ; des pauses subsistent, notamment à la fin d'un zoom et lors du premier changement de surbrillance.

Le test déterministe de huit translations successives comptait 83 096 événements de style avant correction, contre zéro pendant le geste après correction. Les positions et tailles des points restent identiques.

## Validation

- `npm test -- --maxWorkers=2` : 105 tests réussis, 24 fichiers.
- `npm run lint`, `npm run typecheck` et build Next de production isolé : réussis.
- `tests/system-performance.spec.ts` : quatre scénarios réussis sur desktop et mobile, soit huit tests. Déplacement, survol rapide, retour à la sélection, labels après zoom, caméra après changement de perspective, deux étapes, filtres et export PNG.
- Contrôle élargi avec `tests/atlas.spec.ts` : 19 tests réussis sur 20. L'échec de cadrage desktop à 1982 × 1103 est préexistant : occupation de 0,613146 pour un seuil de 0,65, valeur strictement identique sur l'ancien build. Les autres tests de labels des vues centrée et comparaison passent.
- Inspection visuelle de la vue générale, de la sélection Macron et du mobile 390 × 844 : réalisée. Aucune erreur JavaScript ni débordement horizontal détecté.
- Les changements de configuration générés par les builds isolés ont été retirés ; les fichiers utilisateur préexistants sont conservés.

À la fin de la recette initiale, la prévisualisation optimisée était disponible sur le port 4346, avec le build `.working/system-perf-verified`, et aucun push n'avait été réalisé. Les serveurs intermédiaires 4344 et 4345 ont été arrêtés. L'ancienne prévisualisation 4343 reste disponible pour comparaison.

## Déploiement local autorisé

Le serveur habituel a été reconstruit dans `.next` puis relancé avec `npm run start` sur `http://127.0.0.1:4300`. Build : `IN1Bsb5e5BdbahItlOL5w`. Les quatre tests desktop de `tests/system-performance.spec.ts` ont été exécutés sur ce serveur et passent, y compris les filtres et l'export PNG. La prévisualisation 4346 reste accessible. La publication Git demandée cible `origin/main` du dépôt `JarJarBinLifting/civigraph` ; aucun hébergement externe n'est déployé.
