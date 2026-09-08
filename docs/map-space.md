# Interface centrée sur la carte — 8 septembre 2026

La navigation et les actions de sauvegarde/partage tiennent dans la première barre. La recherche, les catégories et les filtres occupent la seconde. La carte remplit le reste de la fenêtre ; ses options d’affichage et ses outils d’exploration s’ouvrent à la demande.

- Les points de départ sont accessibles dans la recherche vide et dans le panneau Explorer.
- Affichage regroupe Graphe/Liste, Système/Centrée et Groupes/Individus ; le mode actif reste visible.
- Explorer donne accès aux exemples, aux points communs, à l’index des institutions, à la méthode et au corpus.
- La période se règle dans Filtres. Une période active reste indiquée sur la carte, avec le nombre de filtres actifs dans le bouton.
- Légende et aide rassemble les conventions de lecture, les couleurs et la recherche des appartenances politiques.
- Le cadrage initial exploite le nouvel espace. Un redimensionnement recadre la vue d’ensemble ; il conserve le zoom choisi par l’utilisateur lors d’une exploration.
- La liste, les comparaisons, les index et les fiches gardent leur propre défilement. Sur mobile, les catégories défilent horizontalement et les commandes restent accessibles.

## Validation

- Lint réussi, 27 fichiers / 129 tests unitaires réussis, build Next.js de production avec Webpack réussi (TypeScript compris).
- Parcours réels dans le navigateur intégré : affichage Liste puis Individus ; Formation ; recherche Sciences Po et ouverture de fiche ; période 2007–2013 et indicateur persistant ; exemple ENA ; comparaison Macron/Attali ; index des institutions ; mode agrandi, retour par Échap et restauration du focus.
- Zoom conservé à l’identique lors de la sortie du mode agrandi après un zoom utilisateur.
- Contrôle visuel ordinateur et mobile à 390 × 844, sans débordement horizontal de la page.
- À viewport identique d’environ 1280 × 720 : hauteur de la zone graphique passée de 269 à 561 px ; hauteur du canvas passée de 209 à 431 px. La zone graphique représente environ 78 % de la hauteur de fenêtre.
- Captures et mesures locales dans `../map-space-qa/` depuis ce dossier de travail : `before.png`, `after-desktop.png`, `after-mobile.png`, `before-metrics.json`, `after-metrics.json`.

Le serveur local du port 4300 utilise cette version. Aucun push ni déploiement distant. L’export PNG et un audit complet d’accessibilité n’ont pas été rejoués ; les vérifications ci-dessus ne les remplacent pas.

Travail isolé sur `codex/map-space`, basé sur `8b83e8b`, pour préserver le dossier principal et les autres branches.
