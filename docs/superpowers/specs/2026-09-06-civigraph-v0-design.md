# Civigraph V0

## Périmètre convenu

Le propriétaire a choisi le 6 septembre 2026 la V0 complète : 30 à 50 personnes et les neuf fonctions du mini PRD. Le document joint est une source de besoins produit, pas une autorisation de publication ou de configuration de comptes. Développement et vérification locaux ; aucun push ou déploiement demandé.

## Expérience

Une application française de cartographie des relations institutionnelles et professionnelles. Un bandeau de recherche permet d'entrer par une personne ou une organisation. Le graphe occupe l'espace central, les catégories et parcours se trouvent à gauche, la fiche et les preuves à droite. Les nœuds sont sélectionnables et extensibles ; les lignes ouvrent leur explication et leurs sources. Un mode liste donne une alternative accessible au canvas. La comparaison affiche les intermédiaires communs et les deux relations justificatives, sans inférer une rencontre ou une proximité personnelle. Les vues partagées encodent sélection, entités développées, filtres et comparaison.

Direction visuelle : papier clair, encre sombre, accent vert sapin, typographie éditoriale pour les titres, couleurs limitées aux catégories, graphe aéré. Mobile : recherche et graphe restent utilisables, panneaux secondaires accessibles explicitement.

## Architecture

Next.js App Router, TypeScript et React ; Cytoscape pour le graphe. CSS natif avec variables de design pour éviter une couche inutile. Snapshot JSON local et versionné, import reproductible depuis l'API Wikidata. Le moteur de recherche, sous-graphe et comparaison est pur et partagé par les composants. Aucun service distant nécessaire pour explorer après installation. FastAPI/NestJS, Neo4j et PostgreSQL restent des options de V1 : aucune infrastructure factice dans cette V0.

## Contrat de données

40 personnes publiques identifiées par leur article français. Importer uniquement P69 (formation), P39 (fonction), P102 (parti), P108 (employeur), P463 (organisation). Exclure les déclarations dépréciées, valeurs inconnues et auto-liens. Entités connexes identifiées par QID. Chaque relation conserve identifiant de déclaration, propriété, date de début/fin avec précision si disponible, URL Wikidata et références présentes. Afficher explicitement les déclarations sans référence externe et les dates absentes. Un lien décrit une déclaration Wikidata, pas un fait vérifié indépendamment. Les intitulés de fonctions sont distincts des institutions. Aucune affiliation privée ou relation personnelle n'est inférée.

Le snapshot expose date d'import, révisions, provenance, licence CC0, effectifs réels et limites de couverture. Le corpus est exploratoire, non exhaustif, sans prétention de représentativité politique. Une déclaration sans date de fin n'est pas présentée comme actuelle.

## Réussite vérifiable

1. Recherche tolérant accents et casse, y compris hors corpus avec état vide.
2. Réseau réel de la sélection.
3. Extension par clic explicite et navigation réversible.
4. Filtres formation/fonctions/partis/emplois/organisations appliqués aux liens.
5. Fiches de personnes et d'organisations.
6. Sources consultables pour chaque relation, limites visibles.
7. Sélection de deux personnes distinctes.
8. Relations communes accompagnées de leurs deux preuves, état vide honnête.
9. URL restaurable avec validation des paramètres et navigation précédent/suivant.

Contrôles : tests du moteur, intégrité du corpus, lint/typecheck/build, parcours navigateur desktop/mobile, liens sources, partage/rechargement et filtres/extension/comparaison.
