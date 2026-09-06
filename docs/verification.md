# Vérification de la V0 — 6 septembre 2026

Application testée en build de production local sur `http://127.0.0.1:4300`, avec Node.js 24.18.0 et Chrome installé sous Windows.

## Validation initiale

| Contrôle | Résultat observé |
| --- | --- |
| `npm run lint` | Réussi, aucune erreur ni avertissement ESLint |
| `npm run typecheck` | Réussi |
| `npm test` | 16 tests réussis dans 3 fichiers |
| `npm run build` | Compilation de production Next.js réussie |
| `npm run test:e2e` | 16 parcours réussis, 8 scénarios sur ordinateur et sur mobile |
| Double-clic réel sur le nœud ENA | Extension confirmée dans l'URL et le graphe |
| Aperçu de production | HTTP 200 ; journal d'erreurs du serveur vide |

Les avertissements `NO_COLOR` / `FORCE_COLOR` du lanceur Playwright concernent uniquement la sortie du terminal. Aucun `pageerror` ni appel HTTP à un domaine tiers pendant le parcours initial testé.

## Parcours navigateur

Les tests couvrent :

1. Réseau initial et preuve du lien Macron–ENA : déclaration Wikidata, révision et période 2002–2004.
2. Recherche « edouard philippe », accents omis, absence de résultat et retour navigateur.
3. Désactivation de toutes les catégories, état vide puis restauration.
4. Clic réel sur un nœud du canvas et extension de son réseau.
5. Comparaison Macron–Philippe : trois points communs dans le corpus, les six preuves correspondantes et leur filtrage.
6. Copie effective dans le presse-papiers et rechargement d'une URL contenant sélection, extensions, filtres et mode liste.
7. Récupération après paramètres inconnus, absence de débordement horizontal et fermeture au clavier de la méthode.
8. Restauration d'une comparaison partagée et retour vers un graphe partageable depuis une entité commune.

## Vérification visuelle

Captures inspectées à 1440 × 1000 et 390 × 844 pixels CSS. Les vues d'exploration et de comparaison ont été examinées sur ordinateur et mobile. Les corrections observées portent sur les tailles de texte, le contraste et la position des libellés du graphe.

Le graphe mobile s'ouvre avec un zoom lisible et se déplace horizontalement : des nœuds peuvent être hors du cadre, comme dans une carte. Le contrôle de recentrage affiche la vue d'ensemble et le mode Liste permet la consultation sans manipulation du canvas. La fiche est placée sous le graphe sur mobile. Les textes de l'interface ne débordent pas horizontalement.

Les captures et traces sont des fichiers locaux de QA dans `test-results/` et `.working/`, ignorés par Git. Il ne s'agit pas d'un audit d'accessibilité complet ou d'une validation sur appareils physiques. Firefox et Safari n'ont pas été testés.

## Corpus et provenance

- 40 personnes sélectionnées, 297 entités et 717 déclarations.
- Identifiants uniques, extrémités présentes et URL de déclaration/révision pour chaque lien.
- Recherche par noms courts ENA et Sciences Po vérifiée par un test de régression.
- Précision temporelle préservée ; une fin absente n'est pas interprétée comme une fonction actuelle.
- 111 déclarations possèdent une URL de référence externe ; les autres restent marquées comme déclarations à recouper.

La présence des références et des révisions est validée. La véracité indépendante des 717 déclarations, la disponibilité durable des sites référencés et la représentativité du corpus ne sont pas établies par ces tests.

## État de livraison

V0 locale avec les neuf fonctions retenues. Documentation d'installation, d'import et de provenance présente. Aucun push, déploiement, compte ou hébergement externe créé. La V1 et ses 500–2 000 personnes restent hors périmètre.

## Recentrage animé — complément du 6 septembre 2026

Développer une entité déplace désormais cette entité au centre avec une transition de 620 ms, affiche ses voisins directs et conserve les étapes précédentes avec leurs liens documentés. Le centre (`focus`) est distinct du point de départ (`root`) et de la fiche sélectionnée. Le parcours permet le retour à une étape antérieure ; les anciennes URL déduisent le centre de la dernière extension.

| Contrôle après modification | Résultat observé |
| --- | --- |
| `npm test` | 20 tests réussis dans 3 fichiers : voisinage du centre, maintien du chemin, retour et contrat d'URL compris |
| `npm run lint` et `npm run typecheck` | Réussis |
| `npm run build` | Build de production Next.js réussi |
| `npx playwright test` | 20 parcours réussis : 11 sur ordinateur, 9 sur mobile ; les 2 cas réservés à l'ordinateur sont explicitement ignorés dans le projet mobile |
| Bernard Cazeneuve → Conseiller régional | Même instance Cytoscape, même nœud et même lien conservés ; positions intermédiaires mesurées ; arrivée au centre et trois voisins distincts |
| Retour pendant la transition, double-clic | Aucun retrait retardé du réseau restauré ; exploration encore utilisable |
| Retour/avance navigateur, rechargement et ancienne URL | Centre restauré |
| Préférence de réduction des animations | Position finale appliquée sans animation sur ordinateur et mobile |

Inspection des captures avant, pendant et après le mouvement à **1982 × 1103**, soit le format du commentaire utilisateur. La vue finale contient Conseiller régional au centre, Bernard Cazeneuve, Jean-Pierre Raffarin et Ségolène Royal autour, avec leurs trois liens. Aucun `pageerror` dans le parcours animé testé. Inspection complémentaire à **390 × 844** : les quatre nœuds et leurs libellés tiennent dans le cadre grâce à une disposition plus compacte des petits réseaux. Les grands réseaux mobiles restent déplaçables comme précédemment.

Captures locales dans `.working/pivot-motion-*.png` et `test-results/pivot-*.png`, ignorées par Git. Aperçu local reconstruit et relancé sur le port 4300 ; aucune publication distante effectuée.
