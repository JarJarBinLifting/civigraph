# Vérification de la V0 — 6 septembre 2026

Application testée en build de production local sur `http://127.0.0.1:4300`, avec Node.js 24.18.0 et Chrome installé sous Windows.

## Résultats

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
