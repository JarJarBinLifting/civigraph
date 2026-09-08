# Presets d’exploration — 8 septembre 2026

Quatre entrées sont proposées au-dessus de l’explorateur : personnalité, école ou organisation, comparaison de deux parcours et exemples. Le contrat retenu est une question, une vue cadrée et une action pour poursuivre, sans paragraphe explicatif ajouté.

- Une personnalité ouvre son voisinage en vue Centrée. « Comparer ce parcours » préremplit le premier choix.
- Une école ou organisation ouvre ses connexions. « Explorer un parcours » limite la recherche aux personnes liées à cette entité dans le corpus.
- Une comparaison demande deux personnes distinctes puis affiche leurs points communs et les preuves existantes.
- Les trois exemples sont Emmanuel Macron, l’ENA et la comparaison Emmanuel Macron–Jacques Attali. Ils utilisent les entités et les déclarations du corpus, sans ajout de données.

Chaque ouverture repart avec toutes les catégories, toutes les périodes, un seul centre, aucun lien sélectionné et un nouveau cadrage. La fiche reste fermée à l’ouverture pour laisser la carte visible. Les réglages de perspective et de période sont accessibles sous « Ajuster la vue » ; les commandes Graphe/Liste, agrandissement et sources restent disponibles.

Le paramètre `preset=person|institution|comparison` conserve la question dans les URL et les explorations enregistrées. La question est dérivée des entités ; elle disparaît si la navigation ne correspond plus à ce preset. Les anciennes URL conservent leur comportement.

## Recette initiale

- 123 tests unitaires réussis, dont 11 nouveaux cas sur les presets : liens et sauvegardes, états incompatibles, exemples avec résultats réels, absence d’entité et comparaison avec soi-même.
- Lint et compilation de production avec contrôle TypeScript réussis. Build isolé dans `.working/presets-build`.
- Parcours vérifiés dans le navigateur intégré : exemples, recherche de personnalité au clavier, ENA → Jacques Attali, personnalité → comparaison, choix de deux personnes distinctes, cas sans résultat, retour arrière, rechargement de l’institution et de la comparaison, lien de partage et ouverture des réglages.
- Inspection visuelle à 390 × 844 et 1018 × 1103 ; aucun débordement horizontal de la page aux deux tailles. Les tests Playwright CLI n’ont pas été exécutés.

Cette recette initiale a été réalisée sur le port 4301, avant autorisation de release et de push.

## Release locale et préparation de la publication

Les presets sont intégrés sur `origin/main` à partir de `1f59c8b61b7138f7f7c89b5e2a6bfbbcf9e1b784`, en conservant la carte système complète et le focus explicite déjà publiés. L’intégration utilise le worktree `.working/exploration-presets-release` ; les modifications du checkout initial et de l’autre worktree sont préservées.

- 129 tests réussis dans 27 fichiers ; lint réussi.
- Compilation de production, contrôle TypeScript et génération des pages réussis avec `npm run build -- --webpack`. Webpack permet la compilation malgré la limite de Turbopack avec la jonction de dépendances partagées sous Windows. Build : `U-rr11HrFSkUB5UqToumD`.
- Release locale servie sur `http://127.0.0.1:4300/` depuis ce worktree ; réponse HTTP 200. L’aperçu sur 4301 reste disponible.
- Vérification navigateur de la carte système, des exemples, du parcours personnalité vers la comparaison Macron–Attali et de ses quatre points communs, puis de l’ENA. Inspection visuelle sur bureau et à 390 × 844 ; aucun débordement horizontal de la page mobile ni erreur console observée.

La publication autorisée cible `origin/main` du dépôt `JarJarBinLifting/civigraph`.
