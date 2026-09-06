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

## Exploration par période — complément du 6 septembre 2026

Depuis Macron, développer la commission Attali ouvre une sélection de six participations de la composition initiale de 2007. Le repère de 2010 affiche quatre participations documentées dans le rapport de cette année. Macron reste connecté et son rôle change selon la source. Les cinq personnalités ajoutées ont également des parcours Wikidata navigables. Le corpus complété comporte **45 personnes, 346 entités et 797 liens**, dont 10 participations officielles.

| Contrôle sur le build final | Résultat observé |
| --- | --- |
| `npm test` | 37 tests réussis dans 6 fichiers |
| `npm run lint` et `npm run typecheck` | Réussis sans erreur |
| `npm run build` | Build de production Next.js réussi |
| `npx playwright test` | 27 parcours réussis en 26,2 secondes : 15 sur ordinateur et 12 sur mobile ; 3 cas d'animation/navigation propres au bureau explicitement ignorés sur mobile |
| Macron → Attali, 2007 / 2010 | 7 nœuds et 6 liens, puis 5 nœuds et 4 liens ; rôles et sources concordants dans la fiche et la liste |
| Toutes les périodes | 11 déclarations accessibles, y compris la déclaration Wikidata initiale sans période |
| Provenance officielle | Décret de 2007 ou rapport de 2010 ; lien vers la page du PDF, numéro imprimé et rôle ; aucune fausse révision Wikidata |
| Poursuite vers Evelyne Gebhardt | Personnalité au centre, période conservée et autres parcours accessibles en toutes périodes |
| Écoles, entreprises et dates absentes | ENA : passage 2002–2004 ; Rothschild & Cie : 2008–2012 ; French-American Foundation : absence de période exploitable expliquée |
| Partage, rechargement, retour et avance | Période et choix même/toutes périodes restaurés |
| Animation au moment où apparaît le contrôle temporel | Même instance Cytoscape, même nœud Attali, positions intermédiaires mesurées et lien officiel avec Macron conservé |
| Intégrité du corpus | Identifiants uniques, extrémités présentes, liens Wikidata et révisions valides ; les 717 déclarations initiales restent inchangées |

Les tests temporels couvrent les intervalles exacts, les précisions annuelles et mensuelles, les années frontières, les dates ponctuelles, les bornes absentes, les dates invalides et les compositions officiellement sourcées. Une année commune incertaine n'est pas transformée en rencontre, ni une fin absente en fonction toujours exercée.

Inspection visuelle à **1982 × 1103** et **390 × 844** : contrôles temporels, participants, rôles et présentation des preuves. Une première capture mobile montrait le libellé du participant du bas sous les commandes. Un espace dédié aux commandes et une hauteur adaptée au panneau temporel corrigent le chevauchement ; un contrôle géométrique du navigateur vérifie désormais que les libellés précèdent la zone d'aide. Captures finales `test-results/periods-*.png`, ignorées par Git.

Aucun `pageerror` sur les parcours initial et Attali vérifiés ; aucune requête vers un domaine tiers pendant l'exploration initiale. Journal d'erreurs du serveur vide après les tests. Aperçu de production reconstruit et relancé sur le port 4300. Aucun push ni déploiement distant.

Limites : la sélection Attali n'est pas l'ensemble des membres ; les deux compositions ne documentent pas une présence individuelle continue de 2007 à 2010. Les autres institutions utilisent leurs dates disponibles, avec une couverture variable. Les contrôles automatisés ne vérifient pas indépendamment toutes les déclarations Wikidata, ni la disponibilité future des sources. Les navigateurs et appareils physiques non testés restent ceux signalés plus haut.
