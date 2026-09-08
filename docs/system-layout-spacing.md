# Aération de la carte système — 8 septembre 2026

## Modification locale

Le calcul fCoSE réserve un encombrement plus grand aux nœuds très connectés et normalise l'attraction des connexions entre pôles. Les nœuds à un seul voisin conservent une liaison courte avec celui-ci.

Une passe bornée de séparation écarte ensuite les pôles d'au moins 12 voisins dont les zones se recouvrent. Elle utilise uniquement le nombre de voisins et la géométrie, sans regrouper les entités par parti, formation ou autre interprétation. Les voisins suivent le déplacement de leurs pôles documentés ; lorsqu'ils en ont plusieurs, leur déplacement est la moyenne de ceux-ci. Les déclarations et connexions ne sont ni ajoutées ni retirées.

La même fonction est utilisée lors de la génération des positions livrées et dans le worker de secours. Les positions précalculées de l'ensemble des 2 394 entités ont été régénérées en environ 5 secondes. Le chargement habituel continue à utiliser ces positions précalculées.

## Comparaison géométrique

Mesure sur les mêmes 2 394 entités et 5 599 connexions, avec toutes les coordonnées ajustées dans un rectangle de 1 100 × 600 unités écran. Il s'agit d'une mesure calculée des positions, et non d'une capture à ces dimensions.

| Mesure | Avant | Après |
| --- | ---: | ---: |
| Écart minimal entre les 20 nœuds les plus connectés | 1,8 px | environ 40 px |
| Médiane de leur distance au pôle le plus proche parmi ces 20 | environ 12 px | environ 49 px |
| Médiane de la distance au voisin géométrique le plus proche, toutes entités | 4,83 px | 4,31 px |

Le gain concerne la séparation des pôles et de leurs voisinages. Il ne constitue pas une suppression de tous les chevauchements : la densité des petits nœuds reste élevée en vue générale, et leur espacement médian après ajustement global diminue légèrement. La typographie, les symboles, les couleurs, le placement des noms et les contrôles ne sont pas modifiés par ce travail.

## Vérification

- Nouveau test de séparation vu en échec avec deux pôles confondus, puis réussi. Il couvre le déplacement des voisins, les personnes partagées, les connexions dans les deux sens, la conservation des entrées et les entités isolées.
- Nouveau contrôle de la géométrie livrée vu en échec sur l'ancien instantané (écart de 1,8 px), puis réussi sur le nouveau. Le cadrage est normalisé pour qu'un simple agrandissement de toutes les coordonnées ne puisse pas satisfaire le contrôle.
- Suite unitaire : 27 fichiers, 126 tests réussis.
- Lint réussi. Build Next de production isolé dans `.working/layout-spacing-build` réussi, vérification TypeScript comprise.
- Navigateur intégré : carte générale, zoom, retour au cadrage précédent, recherche Sciences Po, fiche et approche du voisinage inspectés. Captures avant/après conservées dans le dossier de visualisations de la tâche.
- Le contrôle automatique a refusé le changement de dimensions du navigateur : vérification limitée aux dimensions disponibles, sans validation mobile dédiée. La suite Playwright n'a pas été exécutée.

Travail dans le worktree `3111/Politigraph`, avec aperçu local sur le port 4311. Aucun push ni déploiement externe. Les modifications préexistantes de l'interface sont conservées.
