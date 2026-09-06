# Sprint Civigraph — point de reprise

## Chantier actuel — atlas éditorial (6 septembre 2026)

Départ propre sur `main`, commit `a524da6`. Le premier sprint ci-dessous est conservé. Les fonctions, photos locales dans les fiches, données et contrats d’URL restent disponibles. Aucun import, changement de dépendances ou envoi distant prévu.

- **Passe A, stable** : composition compacte autour d’une scène plus généreuse, cadrage de toute son étendue, couronnes lisibles, monogrammes et pictogrammes, traits de même qualité pour les dates connues/inconnues, retrait de la boussole décorative.
- **Passe B, stable** : noms en pixels CSS, choix déterministe des étiquettes et anti-collision, stabilité aux seuils de zoom, sélection persistante et caméra préservée à l’ouverture d’une fiche.
- **Passe C, stable** : même vocabulaire dans la comparaison et les chemins, mobile/clavier, réduction des animations, légendes PNG et socle complet vérifiés.

**Dernier état stable : A, B et C terminées le 7 septembre 2026.** Serveur local `http://127.0.0.1:4300`, build `1QvhUFFiACaSBoD_0h50s`. Lint, typecheck, build, 77 tests unitaires et 77 scénarios navigateur réussis ; 3 exclusions mobiles antérieures conservées. Aucune passe restante. Pour reprendre une modification : partir de cet état, reproduire le défaut sur une des URL documentées ci-dessous et lancer les tests concernés. Aucun push ni déploiement.

Avant modification : application existante active, build `npGfydTW87YmjNK7UholU`. Cinq captures réelles `atlas-before-*.png` produites dans `.working/sprint/`, petite vue, ENA dense et mobile inspectés. Mesures `atlas-before-browser.json` : ENA 123/130 et Assas 69/70, aucun appel tiers/erreur/débordement ; 120 pans ENA 0,4 ms et aucun événement de style. La baseline complète du même commit a passé les 72 tests unitaires et 65 scénarios Chrome du sprint précédent.

Observation : noms réduits à quelques pixels, cadrage symétrique autour du centre malgré une zone inconnue asymétrique, nombreux panneaux avant le graphe. Prochaine action : reproduire le défaut de cadrage par un test navigateur, puis réaliser et vérifier la passe A. Pas de quota restant supposé.

Passe A vérifiée : les quatre nouveaux scénarios ont échoué sur le build précédent (cadrage déséquilibré et opacité différente), puis passent. Dix scénarios existants chronologie/profil/dialogues passent également. Le critère de remplissage du nouveau test tient compte de l’axe limitant (largeur ou hauteur), sans relâcher l’intégralité ni l’équilibre du réseau. Lint réussi ; typage de forme Cytoscape corrigé, build et contrôle TypeScript réussis (`ICWjzzgVS9wNPc2If_BDf`). Captures `atlas-a-*` réellement inspectées, titres mobiles recadrés après observation ; aucune erreur console, requête tierce ou entité perdue. Aucun changement de placement temporel ni de corpus. Fichiers : `GraphCanvas.tsx`, `Explorer.tsx`, `ChronologyControls.tsx`, `graph-theme.ts`, `globals.css`, `tests/atlas.spec.ts`.

Prochaine action : tests de noms lisibles sur ENA et de sélection sans recadrage, puis algorithme simple de placement d’étiquettes en coordonnées affichées. Les fonctions et captures du premier sprint restent conservées.

Passe B vérifiée le 7 septembre : cinq tests purs de géométrie/hystérésis et deux tests de placement temporel réussis. Les quatre premiers tests de noms avaient échoué avant implémentation ; le navigateur montrait un seul nom sur ENA et un recadrage à l’ouverture de la fiche. Vingt scénarios navigateur de la passe B et des fichiers précédents passent, puis les deux contrôles de sélection repassent avec un clic réel dans le champ ; deux tests d’animation restent réservés au bureau. Les tests antérieurs de pivots sont inchangés. Les petits réseaux conservent leur centre au milieu de la caméra ; les aperçus denses cadrent toute leur étendue. Les labels s’adaptent au cadrage, sans réduire le réseau pour un nom périphérique. Noms affichés à 12,5–14 pixels CSS, deux lignes maximum, positions choisies parmi quatre côtés, priorité persistante et seuils d’entrée/sortie distincts. Les noms hors champ se recalculent une fois à la fin du pan (100 ms), jamais sur chacun de ses événements. Une translation synchrone conserve zéro écriture de style. Build `BMxY6Srf1uJ7-JM034RL8` réussi ; captures `atlas-b-*` inspectées sur bureau/mobile et réseau dense. Mesure locale ENA au zoom 0,42 : 39 noms sur bureau ; sur mobile, la proportion de nœuds nommés dans le champ augmente (le zoom réduit naturellement leur nombre visible). Deux fixtures nouvelles ont été affinées pour tenir compte du champ de caméra et effectuer un vrai clic ; aucune garantie existante retirée. Fichiers supplémentaires : `graph-labels.ts`, `graph-labels.test.ts` ; `GraphCanvas.tsx` et `tests/atlas.spec.ts` adaptés. Passe A : commit `8922868`.

Prochaine action : réutiliser les symboles et le placement de noms dans la comparaison, harmoniser les étapes HTML des chemins et l’export avec la scène réelle, puis lancer le socle final et inspecter les captures.

Passe C — intégration en recette : thème et placement des noms partagés avec la comparaison, géométrie gauche/entités communes/droite conservée, étapes des chemins illustrées et commandes tactiles de 44 px. Avant correction, deux dézooms réduisaient les noms à 8,97 px sur bureau et 7,80 px sur mobile ; les deux nouveaux scénarios échouaient. Après correction, les 18 scénarios ciblés atlas/comparaison/chemins/PNG passent. Les images locales restent dans les fiches ; la légende exportée décrit les symboles réellement dessinés, sans crédit de photos absentes de la carte. L’inspection a révélé des légendes temporelles effacées dans le PNG par leur contour papier : les deux tests de pixels échouaient (zéro pixel d’encre), puis passent après conservation de `paint-order` et `vector-effect` dans la copie SVG. Atténuation des noms comparés corrigée après capture. Lint, typecheck et 6 tests unitaires ciblés réussis ; dernier build `Lz5cEpqre21NXgphHvqho`, serveur identifié au port 4300. Passe B : commit `c3ec639`.

Prochaine action : socle complet, captures finales aux mêmes URL et dimensions, inspection des inconnues, du clavier et des PNG, contrôle du diff puis commit local de la passe C. Les captures et mesures restent dans `.working/sprint/`.

Recette complète intermédiaire : 77 tests unitaires, lint et typecheck réussis ; 73 scénarios navigateur réussis, 3 ignorés sur mobile et 2 régressions mobiles détectées. Le canvas Areva était descendu à 346 px au lieu du minimum garanti (> 430 px), et l’aide gestuelle d’Attali était masquée. Les tests existants sont conservés ; hauteur de scène rétablie et pied de carte réservé aux commandes et à l’aide. Ces corrections doivent repasser les parcours mobiles et le socle final avant de déclarer C terminée.

Passe C finalisée : les 14 parcours mobiles ciblés repassent (3 exclusions antérieures). Un dernier chevauchement constaté sur Assas mobile, entre le nom de l’étape Lecornu et le centre, a été reproduit par un test navigateur en échec. Les étiquettes peuvent maintenant glisser le long du bord de la fenêtre, et la légende du parcours conserve un écart lisible en pixels CSS. Les nœuds restent à leur position temporelle ; les deux contrôles bureau/mobile passent, ainsi que 18 scénarios ciblés de pivots/atlas/PNG (2 exclusions mobiles). Aucun test antérieur de périodes, réseau complet ou pivots modifié.

Recette finale sur le build indiqué en tête : `npm run lint` et `npm run typecheck` réussis ; `npm test` : **77/77 dans 18 fichiers, 2,64 s** ; `npm run build` réussi ; `npm run test:e2e` : **77 réussis, 3 ignorés sur 80, 1,2 min**. Aucun échec restant. Le serveur a été relancé après identification de notre processus, avant les tests. Corpus, photos locales, dépendances verrouillées et contrats d’URL inchangés.

Fichiers C : `ComparisonGraph.tsx`, `InstitutionPaths.tsx`, `ChronologyControls.tsx`, `GraphCanvas.tsx`, `graph-theme.ts`, `graph-labels.ts`, `graph-export.ts`, `export-png.ts`, `globals.css`, `graph-export.test.ts`, `tests/atlas.spec.ts`, `tests/export.spec.ts`, `README.md`, ce statut et `docs/verification.md`. Le test du reçu PNG décrit désormais les symboles réellement exportés ; les tests des licences des photos présentes dans les fiches restent intacts.

Captures finales aux mêmes URL et dimensions que les cinq vues de départ : `atlas-final-initial-{desktop,mobile}.png`, `atlas-final-ena-dense.png`, `atlas-final-assas-{dense,mobile}.png`, toutes inspectées. Vues supplémentaires inspectées : sélection Albane Gaillot dans les inconnues, ENA au zoom 0,42, comparaison et chemin indirect avec preuve ouverte. Dossier `.working/sprint/` ; mesures `atlas-final-browser.json` et `atlas-final-details.json`. Aucun débordement horizontal, erreur console/page ni requête tierce dans les 13 états relevés. ENA : 123 nœuds/130 déclarations ; Assas : 69/70. Au zoom 0,42, 39 noms affichés sur bureau et 9 sur mobile, à 12,5–14 pixels CSS ; les nœuds hors champ restent présents. PNG réellement exportés et inspectés : bureau 1 428 × 1 548, 229 402 octets ; mobile 1 296 × 2 115, 251 950 octets.

Mesure comparable de 120 pans synchrones, Chrome local, 1982 × 1103 : ENA 0,4 ms avant / 0,6 ms après ; Assas 0,7 / 0,6 ms ; aucun événement de style dans les deux versions. Pas de gain de fréquence d’images revendiqué : ce contrôle mesure le gestionnaire synchrone, pas la peinture complète. Le corpus complet reste transmis au client (614 011 octets transférés pour la page initiale finale). Limites : Chrome émulé, pas de téléphone physique ni Firefox/Safari ; le zoom ou Liste reste nécessaire pour tous les noms denses. Tous les contrôles disponibles demandés ont été exécutés.

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

Lots 1, 2A, 2B, 3, 4, 5A, 5B et images locales implémentés et vérifiés. Commits locaux : lot 1 `9ef08eb`, lot 2A `c5a6a8b`, lot 2B `b991949`, lot 3 `dfa242e`, lot 4 `11cb517`, lot 5A `ffba96f`, lot 5B `61a3eb0`. Les images et la recette finale sont enregistrées avec ce point de reprise. Aucune relation ni donnée source existante modifiée ; seuls les deux instantanés d’images sont ajoutés.

Socle final : lint, typecheck, build et 72 tests unitaires réussis ; Chrome : 65 réussis, les 3 scénarios réservés au bureau restent ignorés sur mobile. Build `npGfydTW87YmjNK7UholU`, servi localement sur `http://127.0.0.1:4300`. Le journal détaillé est dans la dernière section de `docs/verification.md`.

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
- Captures avant produites dans `.working/sprint/before-*.png` ; ENA inspectée. Captures finales `.working/sprint/final-*.png` produites et inspectées, avec mesures dans `final-browser.json`.
- Photos importées facultativement ; navigation autonome. Les attributions et licences d’images sont conservées séparément de la licence CC0 du corpus Wikidata.

## Prochaine action précise

Ouvrir `http://127.0.0.1:4300` pour la revue du produit livré. Aucun lot du cahier des charges ne reste à entreprendre. Pour une prochaine intervention de performance, mesurer séparément désérialisation/hydratation et transfert du corpus complet avant de choisir une réduction du payload. Si le serveur est arrêté, lancer `npm run start` pour servir le build vérifié ; reconstruire après toute modification du code. L’indexation, le push et le déploiement restent désactivés et hors de cette livraison.

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

## Lot 5A — sauvegardes locales

- Trois tests unitaires en échec avant implémentation, puis réussis : contrat d’URL complet, suppression ciblée, stockage indisponible/corrompu/d’une version inconnue, point de départ disparu et restauration partielle signalée. Le scénario navigateur initial échoue sur le bouton absent.
- Sauvegardes nommées dans `civigraph.saved-views.v1`, 50 vues maximum sans écrasement automatique. Aucune écriture de remplacement si le contenu est illisible. La restauration remplace l’état complet pour ne pas conserver le mode d’une comparaison précédente.
- Lint, typecheck et build réussis. Huit scénarios Chrome passent, dont sauvegarde/restauration/suppression et clavier sur ordinateur/mobile. Le sélecteur d’erreur du test de corruption ciblait aussi l’annonceur Next ; limité au dialogue sans changement produit. Recontrôle : les 4 scénarios de sauvegarde passent, 4,7 s.
- Captures `.working/sprint/lot5a-saved-{desktop,mobile}.png` inspectées ; aucun débordement horizontal mesuré. Fichiers : `saved-views.ts`, `saved-views.test.ts`, `SavedExplorations.tsx`, `Explorer.tsx`, `globals.css`, `tests/saved-views.spec.ts`.
- Limites explicites : sauvegardes propres au navigateur et à l’origine, supprimées si ses données sont effacées ; une URL de partage peut être conservée ailleurs. Lot 4 enregistré dans le commit local `11cb517`.

## Lot 5B — export PNG

- Test unitaire du contexte et scénario navigateur observés en échec avant implémentation, puis réussis. Export de la vue Cytoscape cadrée et des guides temporels, avec titre, noms, compteurs du réseau filtré, catégories, filtre temporel distinct du repère, date du corpus, légende, limites et URL de la vue.
- Deux fichiers PNG effectivement téléchargés et inspectés sur ordinateur/mobile : `.working/sprint/lot5b-export-{desktop,mobile}.png`. Signature, taille et dimensions vérifiées, URL et carte conservées. Liste complète des noms ajoutée pour accompagner les libellés compacts sur mobile ; libellés de couronne déplacés après observation d’une collision avec ENA.
- Lint, typecheck, build et 4 tests unitaires ciblés réussis. Une incompatibilité de typage Cytoscape pour le contrôle d’animation a été corrigée avec son sélecteur `:animated`. L’export indique d’attendre si une transition est encore en cours.
- Fichiers : `graph-export.ts`, `graph-export.test.ts`, `export-png.ts`, `GraphCanvas.tsx`, `Explorer.tsx`, `globals.css`, `tests/export.spec.ts`. Le lot 5A est conservé dans le commit local `ffba96f`.
- Après ajustement : build réussi, 8 scénarios PNG/exploration/clavier réussis sur ordinateur/mobile, 11,1 s. Les PNG finaux incluent aussi les noms complets du réseau. Aucun changement du corpus ni des positions de nœuds.

## Images locales — intégration

- 875 candidates issues des associations P18/P154 publiques ; identité reconfirmée sur Wikidata avant la lecture des titres dans Commons. La première requête avait été refusée par la revue automatique (titre issu du cache local) ; après vérification de sa publication sur Wikidata, la même lecture a été autorisée.
- Import facultatif et reprenable `node scripts/import-images.mjs` ; mode `--cached` sans réseau. 810 images importées : 332 portraits et 478 illustrations d’entités, 31 494 788 octets. 63 candidates non retenues pour licence/attribution/statut non validé, 2 pour format raster non retenu. Les fonctions génériques n’héritent pas de la photo d’une personne ou d’un organisme supposé.
- Une alternative explicitement sourcée et sous CC BY-SA 4.0 est retenue pour Macron, le fichier P18 utilisant une marque Flickr PDM. Portrait, auteur, attribution demandée, licence, lien Commons et date photographique disponible restent distincts des faits biographiques.
- Les licences Commons retournent souvent une URL sans slash final : cas reproduit par un test, puis normalisé. Trois tests de licence passent. Contrôle SHA-256, chemins locaux et rattachement des 810 fichiers au corpus réussis ; aucune relation ou source du graphe remplacée.
- Avatars dans les fiches, recherche, corpus et comparaison ; images sur les nœuds d’exploration et les personnes comparées ; notices sans JavaScript illustrées. Initiales en cas de vignette absente. Les PNG incluent les crédits et les liens de licence de leurs images.
- Lint, typecheck, build réussis ; 5 tests unitaires ciblés réussis. Dix parcours Chrome images/repli/notices/comparaison/PNG réussis sur ordinateur/mobile, 11 s. Captures des crédits inspectées ; le long crédit se consulte dans sa zone défilante.
- Un démarrage Playwright a chevauché la fin du build ; les tests ont bien exercé les nouvelles images, puis son serveur temporaire a été fermé. Le serveur persistant du sprint a été relancé après vérification du port libre. Pour le socle final, attendre explicitement la fin du build avant Chrome.
- Contrôle exhaustif Chrome : les 810 fichiers se décodent, mais 809 dimensions annoncées par l’API différaient des vignettes servies. L’import lit désormais les dimensions réelles avec Sharp déjà présent dans Next.js, sans transformer les fichiers. Reprise `--cached` effectuée ; second contrôle : 810 décodées, zéro échec, zéro différence de dimensions.
- Dernier socle unitaire : lint et typecheck réussis, 72 tests dans 17 fichiers réussis. Captures de l’ensemble illustré inspectées en bureau, mobile et ENA dense. Réseaux toujours complets : ENA 123/130, Assas 69/70 ; aucun débordement, erreur de page ou appel tiers dans les 5 parcours. L’aide gestuelle mobile est déplacée au-dessus des commandes après observation d’un chevauchement avec le bouton PNG.
- Lot 5B conservé dans `61a3eb0`. Les fichiers d’images et leurs deux manifestes, `scripts/import-images.mjs`, `scripts/lib/image-license.mjs`, `scripts/image-overrides.json`, composants d’avatar/crédit et leurs intégrations sont inclus dans le point de reprise final.

## Recette finale — 6 septembre 2026

- `npm run lint`, `npm run typecheck`, `npm test` : réussis, 72 tests dans 17 fichiers (2,16 s). `npm run build` : réussi, build `npGfydTW87YmjNK7UholU` terminé avant le lancement de Chrome. `npm run test:e2e` : 65 réussis, 3 ignorés, 1,0 min. Aucun test préexistant supprimé ni garantie temporelle affaiblie.
- `node scripts/verify-publication.mjs` repassé sur ce build : deux pages documentaires `index, follow` avec canonical et Open Graph corrects sur le domaine réservé de fixture `https://example.org`, graphe `noindex`, inconnue 404, sitemap de 1 780 URL uniques sans URL locale ni paramètres. Zéro requête tierce. Serveur temporaire arrêté ; aucune publication.
- `node .working/sprint/capture.mjs final` : les cinq captures finales sont produites et inspectées (initial bureau/mobile, ENA dense, Assas dense/mobile). Aucune erreur console ou de page, aucun appel tiers ni débordement horizontal. ENA conserve 123 nœuds/130 déclarations ; Assas 69/70.
- Mesure finale ENA, Chrome 1982 × 1103 : 120 déplacements synchrones en 0,3 ms, zéro événement de style ; Assas 0,4 ms, zéro événement. Il s’agit du coût synchrone du gestionnaire, pas d’un FPS. Page initiale 1440 × 1000 : 614 003 octets transférés (gzip), 6 668 998 décodés ; graphe prêt en 494 ms sur une navigation locale isolée. Le transfert complet reste une limite, augmentée par les métadonnées des images ; aucun gain réseau revendiqué.
- PNG réellement téléchargés puis inspectés avec images et crédits : `lot5b-export-desktop.png` (1 361 × 1 852, 349 024 octets) et `lot5b-export-mobile.png` (1 296 × 2 236, 370 064 octets). Captures des cartes comparatives, notices et crédits également inspectées.
- Intégrité des 810 fichiers : identifiants et SHA-256 contrôlés ; décodage Chrome réussi pour tous, aucune différence de dimensions (`image-integrity.json`). Couverture photographique partielle : 332 portraits et 478 illustrations. 65 candidates non importées ; lors de la reprise sans réseau, les deux GIF non retenus sont signalés absents du cache de fichiers.
- Limites : contrôles dans Chrome local, sans Firefox/Safari ni téléphone physique ; zoom nécessaire pour lire tous les noms des réseaux denses, avec Liste en alternative ; PNG du cadrage d’exploration actuel, limité à 16 000 pixels de hauteur ; chemins bornés en toutes périodes ; sources du corpus non vérifiées indépendamment dans leur ensemble. Aucun contrôle final demandé omis, aucun lot laissé en cours. Aucun push ni déploiement.
