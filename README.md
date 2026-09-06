# Civigraph

**Explorer les relations documentées de la vie politique française.**

V0 locale, construite à partir du mini PRD « Cartographie interactive du pouvoir politique français ». Le périmètre choisi est un prototype de 30 à 50 personnes avec les neuf fonctions d'exploration. L'instantané initial contient **40 personnes, 297 entités et 717 déclarations Wikidata**, importées le 6 septembre 2026.

## Démarrer

Node.js 20.9 ou supérieur ; Node.js 24 conseillé. Les versions des dépendances sont verrouillées dans `package-lock.json`.

```sh
npm ci
npm run dev
```

Ouvrir [Civigraph en local](http://127.0.0.1:4300). Aucune clé API, base de données ou configuration de compte n'est nécessaire.

Pour utiliser le build de production :

```sh
npm run build
npm run start
```

Les commandes écoutent uniquement sur l'interface locale, port 4300. Arrêter le serveur avec Ctrl+C lorsqu'il est lancé dans un terminal. Sur une autre instance, modifier le port avec les options CLI de Next.js.

## Explorer

| Fonction du PRD | Dans la V0 |
| --- | --- |
| Rechercher une personne | Recherche tolérant casse et accents ; personnes et entités connexes, dont ENA et Sciences Po |
| Afficher son réseau | Graphe réel du corpus, point de départ explicite, compteurs de la vue |
| Étendre le réseau | Sélection par clic ; double-clic ou « Développer ce réseau » pour centrer cette entité avec une transition animée et ouvrir ses voisins ; retour par le parcours |
| Filtrer les relations | Formations, fonctions, partis et statuts, parcours professionnel, organisations |
| Voir une fiche | Personnes, écoles, fonctions, partis et organisations ; connexions navigables |
| Afficher les sources | Déclaration originale, révision à l'import, périodes et références disponibles |
| Comparer deux personnes | Deux sélecteurs de personnes distinctes et filtres partagés |
| Voir les relations communes | Entités communes et preuves de chaque côté, avec périodes distinctes |
| Partager une vue | URL comprenant point de départ, centre actif, parcours, sélection, filtres, comparaison et mode liste |

Le mode **Liste** permet d'explorer les relations au clavier et offre une alternative au canvas. Le graphe prend en charge zoom, déplacement, recentrage et sélection des liens. Sur petit écran, glisser pour parcourir le réseau ; le bouton de recentrage fournit une vue d'ensemble.

Développer une entité la place au centre et affiche ses relations directes. Les étapes parcourues et leurs liens documentés restent visibles, selon les filtres actifs. Par exemple, depuis Bernard Cazeneuve, développer « Conseiller régional » garde Bernard relié à cette fonction et ouvre ses autres voisins. Le point de départ reste accessible dans la barre latérale ; revenir à une étape replie les étapes suivantes. Le paramètre `focus` de l'URL mémorise le centre indépendamment de la fiche sélectionnée ; les anciennes URL prennent la dernière entité développée comme centre. La préférence système de réduction des animations est respectée.

Un lien vers `127.0.0.1` fonctionne sur l'ordinateur qui héberge l'application. Le partage à distance nécessite un hébergement séparé. **Cette livraison ne déploie rien et ne pousse rien sur GitHub.**

## Ce que les liens signifient

Les données sont des **déclarations Wikidata**, pas des faits vérifiés indépendamment par Civigraph. Cliquer sur un trait ou sur l'icône de source permet de consulter sa provenance.

- 111 des 717 déclarations comportent au moins une URL de référence externe dans cet instantané. Les autres sont explicitement signalées comme déclarations à recouper ; certaines citent une publication sans URL directe.
- Une date de fin manquante ne signifie jamais « en poste ». Une date à la précision de l'année n'est pas transformée en date au jour près.
- La comparaison révèle une entité ou une fonction commune, sans inférer une rencontre, une collaboration ou une proximité personnelle.
- Les fonctions génériques sont contextualisées par l'organisme ou le territoire lorsque la déclaration le précise. « Président · Renaissance » ne devient pas la même entité que la présidence d'un autre organisme.
- Le corpus est éditorial, exploratoire, non exhaustif et non représentatif. L'absence d'un résultat ne démontre pas l'absence de lien.

Voir [la provenance et les règles de transformation](docs/sources.md).

## Actualiser le corpus

```sh
npm run data:import
npm test
npm run build
```

`scripts/people.json` définit les 40 articles français utilisés pour identifier les personnes. L'import résout leurs QID, collecte cinq propriétés, récupère les libellés des entités liées et conserve les preuves et précisions temporelles. Il écrit le snapshot seulement après une collecte complète et ses vérifications. En cas d'échec, le snapshot antérieur reste utilisable.

Les réponses brutes sont conservées localement dans `.cache/wikidata/` et ignorées par Git. `src/data/graph.json` est le snapshot versionné. L'interface utilise exclusivement cet instantané : aucun appel à Wikidata ni aucune ressource tierce pendant l'exploration. Les liens de source s'ouvrent seulement à la demande de l'utilisateur.

## Structure

```text
src/app/                 Page Next.js, styles et métadonnées
src/components/          Exploration, graphe, recherche, fiches, comparaison
src/lib/graph.ts         Recherche, sous-graphe, comparaison, contrat d'URL
src/lib/presentation.ts  Libellés, catégories et affichage des dates
src/lib/types.ts         Contrat du corpus et de la vue
src/data/graph.json      Instantané Wikidata sourcé
scripts/                 Sélection et import reproductible
tests/                   Parcours navigateur ordinateur et mobile
docs/                    Périmètre, provenance et preuves de vérification
```

Next.js, React et TypeScript structurent l'application. Cytoscape est chargé à la demande pour le canvas. Le domaine du graphe est indépendant du navigateur et testé sur des cas explicites. Le snapshot versionné permet une V0 autonome ; Neo4j, PostgreSQL et un service d'ingestion séparé n'ont pas été ajoutés artificiellement à ce prototype.

## Vérifier

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Les tests navigateur utilisent Google Chrome installé localement. Playwright lance le serveur de production si le port 4300 est libre ; il réutilise l'instance existante en local. Fermer une ancienne instance avant de tester un nouveau build. Les captures et traces de diagnostic sont écrites dans `test-results/`, ignoré par Git.

La vérification porte sur les neuf fonctions, les cas vides, les paramètres invalides, les références, la copie/restauration des URL, le retour navigateur et l'absence d'appels réseau tiers pendant le parcours initial. Voir [le compte rendu](docs/verification.md).

## Suite du PRD

La V1 à 500–2 000 personnes et les données parlementaires ne font pas partie du périmètre choisi. Timeline interactive, HATVP, cabinets, scores de proximité, comptes, exports et API professionnelle restent des étapes ultérieures. La V0 n'affiche ni score ni causalité déduite.

Les données structurées de Wikidata sont sous [CC0](https://www.wikidata.org/wiki/Wikidata:Licensing). Les polices DM Sans et Manrope sont distribuées localement via Fontsource sous SIL OFL ; leurs licences sont incluses dans les dépendances. Aucune photographie distante n'est utilisée.
