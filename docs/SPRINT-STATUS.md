# Sprint Civigraph — point de reprise

## Périmètre et état de départ

6 septembre 2026. Dépôt local `JarJarBinLifting/civigraph`, branche `main`, HEAD initial `1c008cd82cb4c64010c54f9698c2ecd9d6cfdfb8`. Un seul worktree, aucun changement local initial. Node 24.18.0, npm 11.16.0, dépendances déjà installées. Aucun push ni déploiement autorisé.

Le cahier des charges fourni est exécuté par lots, dans cet ordre :

1. Baseline, mesures, index du graphe si justifié, caméra, lisibilité, agrandissement et dialogues.
2. Carte de comparaison sourcée, puis chemins institutionnels bornés et partageables.
3. Parcours chronologique dans les profils.
4. Pages documentaires, méthode et indexation explicitement désactivée par défaut.
5. Sauvegardes locales puis export PNG, après stabilisation des priorités.
6. Images et portraits locaux, avec provenance, auteur et licence explicite lorsque disponibles.

Les sources, identifiants, précisions temporelles, réseau complet et ancienne navigation restent les invariants de chaque lot. Les contrôles utilisent les versions verrouillées et Chrome déjà installé. Le quota restant n'est pas connu en direct.

## Dernier lot stable

Lots 1, 2A, 2B, 3 et 4 implémentés et vérifiés. Commits locaux : lot 1 `9ef08eb`, lot 2A `c5a6a8b`, lot 2B `b991949`, lot 3 `dfa242e`. Aucune donnée source modifiée.

## Vérification et mesures

- Baseline : `npm run lint`, `npm run typecheck`, `npm test` (53 tests / 10 fichiers), `npm run build` réussis ; `npm run test:e2e` : 39 réussis, 3 cas bureau ignorés sur mobile, 1,2 min.
- Nouveau build de baseline `LeDGn0Gsk1TtQTh9YKvyE`, servi par le processus lancé dans `.working/sprint/server.pid`.
- Avant : page initiale 532 133 octets transférés (gzip), 6 240 472 octets décodés ; graphe prêt en 940 ms (une navigation locale, 1440 × 1000). Pas de requête tierce, pas de pageerror ni de débordement dans les 5 captures.
- Caméra ENA, Chrome 1982 × 1103 : 120 déplacements synchrones, 1 699 ms, 44 760 événements de style ; Assas : 1 047 ms, 26 040 événements. Les 123/69 nœuds restent présents.
- Sélecteurs, médiane de 5 × 200 appels Node 24 : réseau 0,351 ms, comparaison 0,387 ms, recherche « em » 39,613 ms, chronologie 0,311 ms. Le script de mesure a terminé et écrit ses résultats mais dépassé le délai Vitest par défaut (41,5 s pour le tout) ; délai ajusté pour ce script de mesure uniquement.
- Régressions observées avant correctif : 3/3 nouveaux tests échouent pour recalcul de styles lors du pan, agrandissement absent et sortie du focus avec Maj+Tab. La baseline préexistante reste verte.
- Après lot 1 : lint, typecheck, build réussis ; 54 tests unitaires ; suite Chrome complète 45 réussis / 3 ignorés, 47,6 s. Les identités, pivots rapides, retour pendant animation, anciennes URL, périodes et réseaux complets passent.
- Même mesure Node après : réseau 0,058 ms, comparaison 0,0084 ms, recherche 0,612 ms, chronologie 0,122 ms. Même mesure Chrome ENA : 120 déplacements en 0,3 ms, aucun événement de style (mesure synchrone du gestionnaire, pas le temps complet de rendu). Taille transférée initiale pratiquement inchangée : 532 173 octets ; le transfert du corpus complet reste une limite documentée.
- Captures après inspectées à 1440 × 1000, 1982 × 1103 et 390 × 844. Vérification supplémentaire : sélection réelle d'Albane Gaillot, 69 nœuds conservés, 2 nœuds du voisinage mis en évidence, 67 atténués. Source mobile lisible dans la carte agrandie et bouton de fermeture toujours accessible après défilement. Compression du panneau mobile observée puis corrigée.
- Serveur existant sur `127.0.0.1:4300` : Civigraph répond HTTP 200. Son identité sera contrôlée avant remplacement ; ne pas arrêter un processus inconnu.
- Captures et mesures du sprint : `.working/sprint/` (artefacts locaux ignorés par Git).
- Les processus Node enfants sont bloqués dans le bac à sable Windows (`spawn EPERM`) ; utiliser l'exécution autorisée hors bac à sable pour les commandes concernées.

## Fichiers et limites

- Fichiers du lot 1 : `src/lib/graph-index.ts`, `graph.ts`, `graph-layout.ts`, `profile.ts`, `focus.ts`, `graph.test.ts` ; `Explorer.tsx`, `GraphCanvas.tsx`, `DetailPanel.tsx`, `Modal.tsx`, `globals.css` ; `tests/sprint-exploration.spec.ts`.
- Captures avant produites dans `.working/sprint/before-*.png` ; ENA inspectée. Captures après et mesures comparatives à réaliser après reconstruction.
- Les photos feront l'objet d'un import facultatif ; la navigation restera autonome et les attributions ne seront pas assimilées à la licence CC0 du corpus Wikidata.

## Prochaine action précise

Lot 5A : sauvegardes nommées locales, versionnées et restaurables selon le contrat d’URL ; traiter stockage indisponible, contenu corrompu et entités disparues avant l’export PNG.

## Lot 2A — vérification

- Test navigateur ajouté avant la carte : échec attendu, élément absent. Deux tests unitaires avant calcul des périodes : échecs attendus, puis réussite.
- `npm run lint`, `npm run typecheck`, build : réussis. Tests ciblés comparaison/graphe/périodes : 25 réussis.
- Chrome : 6 parcours de comparaison réussis (nouveau scénario et deux scénarios existants, ordinateur/mobile) ; après adaptation mobile, les 2 nouveaux parcours repassent.
- Cartes existantes conservées avec toutes leurs preuves ; paramètre `comparisonView=cards` restauré après rechargement, sélection par `selected`. Le paramètre `mode` de l'explorateur reste distinct.
- Captures `.working/sprint/lot2a-*.png`, détails de la carte inspectés sur ordinateur et mobile. Sources à gauche et à droite, navigation vers ENA, filtres et absence de débordement vérifiés.
- Fichiers : `ComparisonGraph.tsx`, `Comparison.tsx`, `Explorer.tsx`, `comparison.ts`, `comparison.test.ts`, `graph.ts`, `types.ts`, `globals.css`, `tests/comparison-map.spec.ts`.
- Limite assumée : les bilans comptent les comparaisons de déclarations, pas des rencontres ni des personnes supplémentaires. Un intitulé générique est identifié séparément d'une institution.

## Lot 2B — vérification

- Moteur BFS sur l'index : 3 résultats maximum, 4 segments maximum, 20 000 traversées de voisinages maximum et 3 arrivées par sommet ; voisinages mis en cache pendant la recherche. Ordre canonique stable, pas de cycle ni de multiplication des chemins par leurs déclarations parallèles.
- Les chemins alternent personnes et institutions documentées ; fonctions sans contexte et relations personne/personne exclues. Sources conservées dans leur direction d'origine ; limite de travail atteinte signalée.
- 5 tests nouveaux observés en échec avant implémentation, puis réussis. 23 tests ciblés chemins/comparaison/graphe réussis ; lint, typecheck et build réussis.
- Chrome : 4 scénarios chemins réussis sur ordinateur/mobile ; cas réel indirect Macron → Marine Le Pen à 4 segments, sources et exploration d'une institution vérifiés. Carte comparative également revérifiée sur les deux formats.
- Le premier scénario de filtre vide construisait deux paramètres `categories` ; fixture corrigée pour remplacer le paramètre, sans modifier le comportement de l'application.
- Captures `.working/sprint/lot2b-path-*.png` inspectées. Fichiers : `paths.ts`, `paths.test.ts`, `InstitutionPaths.tsx`, `Comparison.tsx`, `Explorer.tsx`, `graph.ts`, `types.ts`, `globals.css`, `tests/paths.spec.ts`.
- Partage : `comparisonMode=paths`, indépendant de `mode=graph|list` ; anciennes URL préservées. Toutes périodes explicite, aucune simultanéité globale inférée.

## Lot 3 — vérification

- Vue « Parcours » dans Profil, ordre chronologique des dates disponibles et section distincte sans dates exploitables. Plusieurs passages et activités concomitantes restent séparés. Seuls les faits strictement identiques (cible, catégorie, formulation, rôle et période avec précision) regroupent leurs sources.
- Test ajouté et observé en échec avant implémentation, puis réussi : passages répétés, preuves parallèles, début seul, fin seule et précision mensuelle. Tests profil/temps : 10 réussis ; lint, typecheck et build réussis.
- Chrome : 6 parcours profil/chronologie réussis, puis 2 parcours ciblés pour captures lisibles du panneau. Source, retour à Parcours, catégories du graphe toutes masquées et pivot vers Assas vérifiés sur les deux formats.
- Captures pertinentes inspectées : `.working/sprint/lot3-profile-*.png`, `lot3-undated-*.png`. La première capture d'un élément dépassant son conteneur défilant était inutilisable et a été remplacée par celles des panneaux réellement visibles.
- Fichiers : `profile.ts`, `profile.test.ts`, `temporal.ts` (export du calcul des bornes, sans changement de logique), `PersonProfile.tsx`, `DetailPanel.tsx`, `globals.css`, `tests/career.spec.ts`.

## Lot 4 — vérification

- Notices serveur par identifiant canonique, relations et sources complètes, parcours personnel et méthode avec nombres recalculés. Lien depuis la fiche de l’explorateur. Identifiant inconnu : vraie réponse 404.
- Tests de configuration observés en échec avant implémentation puis 2 réussis. Test navigateur initial : 404 attendue avant création de la route ; après implémentation, les 2 scénarios sans JavaScript passent (ordinateur/mobile). Lint, typecheck et build réussis après adoption des liens Next vers la racine.
- Métadonnées réellement émises avec le drapeau activé sur un serveur local temporaire : 2 notices/méthode en `index, follow`, canonicals vers le domaine réservé de test, graphe en `noindex`, inconnue en 404. Sitemap : 1 780 URL documentaires uniques, aucune URL locale ou état combinatoire ; aucune requête tierce. Le serveur de test est arrêté après contrôle. L’instance usuelle reste non indexable.
- Le premier contrôle de sitemap cherchait `?` dans tout le XML (y compris son en-tête) ; corrigé pour vérifier les URL uniquement. Aucun comportement produit modifié pour contourner ce contrôle.
- Captures des sources inspectées : `.working/sprint/lot4-entity-{desktop,mobile}.png` ; captures du haut de notice ajoutées au scénario final du lot.
- Fichiers : `publication.ts`, `publication.test.ts`, routes `entite/[id]`, `methode`, `robots.ts`, `sitemap.ts`, `not-found.tsx`, `DocumentLayout.tsx`, liens `Explorer.tsx`/`DetailPanel.tsx`, `globals.css`, `.env.example`, `README.md`, `tests/documents.spec.ts`, `scripts/verify-publication.mjs`.
- Aucune publication effectuée. Domaine de production non configuré ; variable désactivée par défaut. Les notices non éligibles restent consultables mais non indexables.
- Contrôle d’intégration avant bonus : lint, typecheck, 64 tests unitaires / 13 fichiers réussis ; build `n2PmhO9rxZh5ygczafoxK` ; suite Chrome complète 55 réussis, 3 scénarios bureau ignorés sur mobile, 55,8 s. Sources et notices d’institution vérifiées sans JavaScript ; aucune erreur de page, requête tierce ou débordement mesuré.
