# Régression de survol de l’atlas — 8 septembre 2026

Deux problèmes distincts affectaient le survol. Le dernier défaut reproduit avec
la souris venait de `z-index-compare: manual` sur les nœuds : les liens ajoutés
après eux pouvaient prendre la priorité dans la détection du pointeur. Les
cartouches ayant un `z-index` supérieur répondaient, mais les petits points
déclenchaient un événement sur un lien. L’ordre automatique remet tous les
nœuds au-dessus des liens et conserve les cartouches au-dessus des autres points.

Le test navigateur utilise maintenant `page.mouse.move` sur des centres de
points visibles, sans déclencher `mouseover` directement. Il vérifie la
prévisualisation de six points et d’un cartouche, à la vue initiale, après un
clic de sélection puis après un zoom. Il exige aussi zéro recalcul de style
pendant le survol (hors notifications natives de chargement d’image
`:backgrounding`), la fermeture à la sortie, le retour sur le même point et la
conservation de la sélection. La sortie directe du canvas émet un `mouseout`
sur le graphe, distinct de celui d’un nœud ; les deux sont désormais traités.
Il échouait sur le premier point avant la correction de l’ordre des éléments.
Le parcours passe sur l’aperçu de production local à 1 440 × 1 000 et
1 982 × 1 103 : 18 survols de points et 3 survols de cartouches par fenêtre,
avec sortie et retour du pointeur à chaque étape.

Le survol recalculait le voisinage, les classes de tous les points et traits,
les badges et les cartouches. L’atténuation du reste du réseau ajoutée au
redesign rendait ce travail particulièrement coûteux. La correction préalable
de la comparaison des opacités supprimait des écritures inutiles, mais ne
supprimait pas ce recalcul global.

Le survol dessine désormais le point, son nom et ses connexions directes dans
un canvas superposé indépendant. Le reste du réseau est atténué dans cette
couche, sans modifier les styles ni déplacer les cartouches du graphe principal.
La couche ignore les événements de pointeur et disparaît à la sortie, au
déplacement, au redimensionnement ou au changement de sélection. Le clic
conserve la fiche et les commandes de voisinage. Une tolérance relative de 1e-9 évite
aussi un redimensionnement de tout le corpus sur un simple arrondi du zoom.

## Mesure préalable du coût du dessin

Même navigateur intégré, même viewport 1280 × 720 et même corpus complet :
2 581 entités, 5 976 connexions. Aperçu de diagnostic Next en développement,
après chargement du graphe ; ce ne sont pas des mesures de FPS.
Une interface temporaire déclenchait huit survols Cytoscape, attendait deux
callbacks d’animation par survol et comptait les événements de style.
Ce protocole contournait la détection du pointeur et ne pouvait donc pas valider
le fonctionnement réel de la souris. Le test ci-dessus couvre ce défaut.

| Mesure | Avant | Après |
| --- | ---: | ---: |
| Survol + deux callbacks, médiane | 407 ms | 4 ms |
| Maximum des huit survols | 458 ms | 7 ms |
| Événements de style pendant les huit survols et sorties | 137 592 | 0 |

Une première tentative ne modifiant que le point survolé restait à 85 ms :
le canvas principal devait encore se redessiner. La couche indépendante
conserve le retour visuel sans cette invalidation. Le cache de viewport et le regroupement des styles
de zoom n’ont pas donné de gain suffisamment convaincant et ont été retirés.
Des pauses peuvent encore se produire au changement réel de zoom ; le gain
ci-dessus concerne le survol signalé par l’utilisateur.

L’instrumentation temporaire a été retirée de l’application. Le test navigateur
se trouve dans `tests/system-performance.spec.ts`. Les tests
unitaires couvrent la lecture du voisinage sans mutation, les opacités inchangées
et l’arrondi d’un zoom réciproque.
