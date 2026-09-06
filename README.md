# Civigraph

**Explorer les relations documentées de la vie politique française.**

V0 locale, construite à partir du mini PRD « Cartographie interactive du pouvoir politique français ». Le périmètre initial était un prototype de 30 à 50 personnes avec les neuf fonctions d'exploration. L'instantané initial contient **40 personnes, 297 entités et 717 déclarations Wikidata**, importées le 6 septembre 2026.

L’enrichissement depuis douze institutions porte le corpus à **492 personnes, 2 394 entités et 7 568 déclarations** : Wikidata, mandats de l’Assemblée nationale, activités HATVP via Integrity Watch France et compositions officielles. Les 797 déclarations de la version précédente restent conservées. [Couverture avant/après](docs/data-coverage.md).

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
| Afficher les sources | Déclaration Wikidata et révision à l'import, ou document officiel avec page/article ; rôles et périodes disponibles |
| Comparer deux personnes | Deux sélecteurs de personnes distinctes et filtres partagés |
| Voir les relations communes | Entités communes et preuves de chaque côté, avec périodes distinctes |
| Partager une vue | URL comprenant point de départ, centre actif, parcours, sélection, filtres, période, comparaison et mode liste |

Toutes les entités du réseau filtré sont affichées sans pagination. Les voisins aux dates exploitables occupent des couronnes d’écart croissant avec la période de référence : jusqu’à 5 ans, de 5 à 20 ans, de 20 à 50 ans, puis au-delà. Le passage documenté le plus proche détermine la couronne. Les dates inconnues sont regroupées à droite, hors de l’échelle temporelle ; le parcours reste à gauche. Le repère reprend la période choisie ou, à défaut, l’année de l’instantané. Une année personnalisée peut être saisie et partagée avec le paramètre `year`. Les anciennes URL paginées ouvrent le réseau complet.

Le cadrage initial inclut tous les nœuds. Pour les réseaux denses, les noms se révèlent au zoom, au survol ou à la sélection ; le nœud actif reste identifiable. La distance décrit un écart entre périodes, sans démontrer une rencontre ou une proximité personnelle.

La carte et la comparaison partagent des disques à monogramme pour les personnes et des pictogrammes par type d’entité. Les noms affichés gardent une taille de 12,5 à 14 pixels CSS, sur deux lignes au maximum. Leur placement privilégie le centre, la sélection et le parcours ; masquer une étiquette ne retire jamais un nœud. Ouvrir une fiche conserve le zoom et la zone observée. « Lire les distances » précise la légende ; la taille du centre indique uniquement son rôle dans l’exploration.

Les personnes s’ouvrent sur **Profil** : une présentation et des repères de fonctions, formations et activités, issus du corpus complet et reliés à leurs preuves. Ce profil reste indépendant des filtres du graphe ; **Connexions** et **Sources** permettent de poursuivre l’exploration. Les institutions conservent Connexions comme onglet initial.

**Parcours** ordonne les passages datés et réserve une section aux événements sans dates exploitables. Les activités simultanées et les passages distincts dans une même institution restent séparés ; seules les preuves d’un fait strictement identique sont regroupées.

**Comparer** propose une carte où chaque personne est reliée aux entités communes, avec les cartes sourcées en alternative. Les bilans temporels comptent les paires de déclarations et leurs différents statuts, sans attribuer une simultanéité à tout le groupe. **Chemins** cherche au maximum trois parcours institutionnels de quatre segments, déterministes, sans cycle et avec toutes les preuves. La recherche est bornée à 20 000 traversées de voisinages et trois arrivées par sommet ; une limite atteinte est signalée. Les fonctions sans contexte institutionnel sont exclues. Ce mode reste en **Toutes périodes**, sans inférer une rencontre ni une coexistence globale. `comparisonMode=paths` et `comparisonView=cards` sont distincts du paramètre historique `mode=graph|list`.

Le mode **Liste** permet d'explorer les relations au clavier et offre une alternative au canvas. Le graphe prend en charge zoom, déplacement, recentrage et sélection des liens. Sur petit écran, glisser pour parcourir le réseau ; le bouton de recentrage fournit une vue d'ensemble.

**Agrandir la carte** garde les filtres, la sélection et le parcours. Le bouton de réduction ou Échap ferme cette vue ; le focus revient au déclencheur. **Mes explorations** enregistre jusqu’à 50 vues nommées sur cet appareil, dans ce navigateur. Une vue peut être restaurée ou supprimée ; les erreurs de stockage et les entités disparues sont signalées, sans remplacer des sauvegardes illisibles. Effacer les données du navigateur efface aussi ces vues.

Le bouton de téléchargement de la carte crée un **PNG du cadrage courant** : titre, noms complets du réseau, catégories, filtre et repère temporels, date du corpus, légende des symboles, limites et URL. Le diagramme utilise des monogrammes et pictogrammes ; les photos sourcées restent dans les fiches. Des entités peuvent être hors champ selon le cadrage. Une transition ou des symboles encore en chargement doivent terminer avant l’export. Aucun fichier n’est envoyé vers un service externe.

Développer une entité la place au centre et affiche ses relations directes. Les étapes parcourues et leurs liens documentés restent visibles, selon les filtres actifs. Par exemple, depuis Bernard Cazeneuve, développer « Conseiller régional » garde Bernard relié à cette fonction et ouvre ses autres voisins. Le point de départ reste accessible dans la barre latérale ; revenir à une étape replie les étapes suivantes. Le paramètre `focus` de l'URL mémorise le centre indépendamment de la fiche sélectionnée ; les anciennes URL prennent la dernière entité développée comme centre. La préférence système de réduction des animations est respectée.

Depuis une personne, développer une institution, une entreprise ou une école propose ses passages documentés. **Même période** affiche les liens dont le chevauchement est établi, ou les participants d'une même composition officielle. **Autres personnes liées — dates insuffisantes** propose séparément les personnes dont la présence sur cette période reste incertaine, avec leur preuve. **Explorer toute sa carrière** quitte explicitement le repère temporel en conservant le parcours. **Toutes les périodes** rend aussi accessibles les dates absentes ou insuffisantes. Les fonctions génériques sans contexte institutionnel restent de simples intitulés et ne déclenchent pas ce mode.

Exemple : Emmanuel Macron → Commission Attali ouvre la composition initiale de 2007. Choisir **2010 · Seconde mission** change les participants affichés et le rôle de Macron. Chaque participant permet de poursuivre l'exploration ; le repère temporel reste actif jusqu'au changement de période ou au retour au point de départ. Le graphe, la liste et les fiches partagent ce filtre. Les paramètres `time=all|same` et `period=<identifiant du lien de référence>` le conservent dans le partage et l'historique. La comparaison entre personnes reste en toutes périodes.

Un lien vers `127.0.0.1` fonctionne sur l'ordinateur qui héberge l'application. Le partage à distance nécessite un hébergement séparé. **Cette livraison ne déploie rien et ne pousse rien sur GitHub.**

## Ce que les liens signifient

Les **déclarations Wikidata** ne sont pas vérifiées indépendamment par Civigraph. Les compléments proviennent de compositions officielles, des mandats publiés par l’Assemblée nationale et d’activités publiques déclarées à la HATVP. Integrity Watch France distribue ces dernières ; leurs fichiers HATVP d’origine et dates de dépôt restent accessibles. Cliquer sur un trait ou sur l'icône de source permet de consulter sa provenance.

- 594 des 4 699 déclarations Wikidata comportent au moins une URL de référence externe. Les autres sont explicitement signalées comme déclarations à recouper ; certaines citent une publication sans URL directe. Les 2 869 déclarations supplémentaires renvoient à une source publique avec leur mandat, rubrique, page ou article.
- Une date de fin manquante ne signifie jamais « en poste ». Une date à la précision de l'année n'est pas transformée en date au jour près.
- Deux plages qui partagent seulement une année frontière ne suffisent pas à établir un chevauchement. Une composition officielle atteste un groupe à un repère donné, sans inventer de durée individuelle entre deux compositions.
- La comparaison révèle une entité ou une fonction commune, sans inférer une rencontre, une collaboration ou une proximité personnelle.
- Les fonctions génériques sont contextualisées par l'organisme ou le territoire lorsque la déclaration le précise. « Président · Renaissance » ne devient pas la même entité que la présidence d'un autre organisme.
- Le corpus est éditorial, exploratoire, non exhaustif et non représentatif. L'absence d'un résultat ne démontre pas l'absence de lien.

Voir [la provenance et les règles de transformation](docs/sources.md).

## Actualiser le corpus

```sh
npm run data:import
npm run data:import:attali
npm run data:discover
npm run data:import:network
npm run data:import:assembly
npm run data:import:integrity
node scripts/audit-data.mjs
npm test
npm run build
```

`scripts/people.json` définit les 40 articles français utilisés pour identifier les personnes. L'import résout leurs QID, collecte cinq propriétés, récupère les libellés des entités liées et conserve les preuves et précisions temporelles. Il écrit le snapshot seulement après une collecte complète et ses vérifications. En cas d'échec, le snapshot antérieur reste utilisable.

Le complément suit le même import avec les cinq noms de `scripts/people-attali.json`, écrit dans `src/data/attali-wikidata.json` et ne remplace pas l'instantané initial. Les participations officielles sont maintenues séparément dans `src/data/attali-participations.json`, avec la date de vérification, le rôle et la provenance. Leur mise à jour nécessite de vérifier les documents cités.

`data:discover` conserve les requêtes institution → personnes et leur plafond dans `network-discovery.json`. `data:import:network` récupère les parcours des 447 QID retenus. L’import de l’Assemblée utilise leurs identifiants P4123 ; celui d’Integrity Watch utilise P4703, vérifie l’identité du déclarant et l’UUID du document original, puis applique exclusivement les correspondances relues de `organization-aliases.json`. Les organismes non rapprochés et les mandats rejetés sont consignés dans les manifestes.

Pour reprendre les imports officiels à partir des réponses locales, ajouter `-- --cached` aux commandes `data:import:assembly` et `data:import:integrity` ; `data:discover` accepte aussi ce mode. Les caches doivent déjà exister. L’audit de couverture utilise Node.js 24 pour lire le module temporel TypeScript. Un import peut modifier le corpus : relire les manifestes, régénérer l’audit et vérifier les écarts avant de retenir un nouvel instantané.

Les réponses brutes sont conservées localement sous `.cache/`, ignoré par Git. `src/lib/dataset.ts` fusionne les compléments par identifiant en préservant les déclarations initiales. Les corrections explicites de libellé ont leur source dans `entity-corrections.json`. L'interface utilise exclusivement ces instantanés : aucun appel à Wikidata ni aucune ressource tierce pendant l'exploration. Les liens de source s'ouvrent seulement à la demande de l'utilisateur.

## Structure

```text
src/app/                 Page Next.js, styles et métadonnées
src/components/          Exploration, graphe, recherche, fiches, comparaison
src/lib/graph.ts         Recherche, sous-graphe, comparaison, contrat d'URL
src/lib/temporal.ts      Chevauchements selon la précision des dates
src/lib/graph-layout.ts  Couronnes temporelles, dates inconnues et placement
src/lib/profile.ts       Repères biographiques sourcés
src/lib/dataset.ts       Fusion du corpus et des participations officielles
src/lib/presentation.ts  Libellés, catégories et affichage des dates
src/lib/types.ts         Contrat du corpus et de la vue
src/data/graph.json      Instantané Wikidata sourcé
src/data/attali-*.json    Complément Wikidata et compositions officielles
scripts/                 Sélection et import reproductible
tests/                   Parcours navigateur ordinateur et mobile
docs/                    Périmètre, provenance et preuves de vérification
```

### Portraits et images d’entités

Les 810 vignettes de cette livraison (332 portraits, 478 illustrations d’entités) sont dans `public/images/entities/`. Les attributions, licences, sources Commons, empreintes et associations par identifiant figurent dans `src/data/entity-images.json`. `entity-images-manifest.json` décrit la couverture et les 65 candidates non retenues. L’absence de vignette garde les initiales ; une fonction générique ne reçoit pas la photo d’un titulaire supposé.

L’import facultatif `node scripts/import-images.mjs` reconfirme les associations publiques sur Wikidata, lit les licences Commons et récupère uniquement des images fixes de taille bornée. Il conserve sa progression sous `.cache/entity-images/`. `--cached` reprend sans réseau, `--refresh` relit les métadonnées publiques et `--limit=N` permet un lot réduit. Les trois caches d’import Wikidata doivent exister. Les fichiers ne sont pas modifiés par cet import : Sharp, déjà fourni avec Next.js, lit seulement leurs dimensions réelles. Aucun nettoyage automatique des anciennes images n’est effectué.

Les licences retenues sont CC BY, CC BY-SA, CC0 et des statuts de domaine public explicitement indiqués par Commons. Les notices avec attribution inexploitable, litige signalé, marque Flickr PDM ou format non retenu sont laissées de côté. Les alternatives relues par nom et identité sont consignées dans `scripts/image-overrides.json`. Chaque vignette propose **Crédit de l’image** ; les sources et licences restent accessibles au clavier et dans les notices serveur. Les recadrages d’affichage conservent la licence de l’image. Voir les [règles de réutilisation de Commons](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia). La navigation ne contacte aucun hébergeur d’images tiers.

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

### Notices documentaires et publication

Les notices `/entite/[identifiant canonique]` et `/methode` sont rendues sur le serveur et restent lisibles sans JavaScript. Une entité inconnue renvoie HTTP 404. Les liens « Explorer ce réseau » retrouvent la carte sans confondre une notice avec ses multiples états de filtrage.

L’indexation est **désactivée par défaut**. `.env.example` documente `CIVIGRAPH_INDEXING=false` et `CIVIGRAPH_SITE_URL` vide. Pour une publication expressément autorisée, définir `CIVIGRAPH_INDEXING=true` et `CIVIGRAPH_SITE_URL` avec l’origine HTTPS du domaine effectivement retenu, sans chemin, identifiants ni paramètres. Aucune adresse de production n’est prédéfinie. Le développement et les environnements de prévisualisation identifiés restent en `noindex` ; laisser le drapeau désactivé sur toute autre prévisualisation.

Après activation, seules la méthode et les notices éligibles émettent une URL canonique, les métadonnées de partage et `index, follow`. Une notice éligible possède un nom, une source et au moins une relation ; les personnes appartiennent au corpus et les institutions ont un contexte explicite. Les intitulés de fonctions génériques restent exclus du sitemap. L’explorateur, ses filtres et les comparaisons restent en `noindex`. Sans activation valide, le sitemap est vide et `robots.txt` interdit l’exploration.

`node scripts/verify-publication.mjs`, après un build, vérifie le HTML et le sitemap sur une instance locale temporaire au port 4301. Le domaine réservé `example.org` sert uniquement de fixture de test ; aucune publication ni requête vers ce domaine n’est effectuée. Le script ferme uniquement son propre serveur.

Cette livraison enrichit la V0 avec l’exploration complète, les comparaisons et chemins sourcés, les parcours chronologiques, les notices documentaires, les sauvegardes locales et l’export PNG. La couverture demeure limitée aux personnes et organismes sélectionnés ; elle ne constitue pas un annuaire exhaustif. La couverture générale des cabinets, les comptes et une API professionnelle restent hors de cette livraison. Aucun score de proximité ni causalité n’est déduit.

Les données structurées de Wikidata sont sous [CC0](https://www.wikidata.org/wiki/Wikidata:Licensing). Les documents officiels conservent leurs conditions de réutilisation ; ils sont référencés sans être redistribués. Les polices DM Sans et Manrope sont distribuées localement via Fontsource sous SIL OFL ; leurs licences sont incluses dans les dépendances. Les images gardent leurs licences et crédits propres, distincts de la licence des données Wikidata.
