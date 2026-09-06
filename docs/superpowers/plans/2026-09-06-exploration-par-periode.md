# Exploration des institutions par période

Périmètre autorisé : depuis une personne, ouvrir une institution au centre, retrouver les autres personnalités documentées à la même période, modifier la période et consulter toutes les périodes. Généraliser aux écoles, entreprises et organisations ; conserver les sources, le parcours, la liste et les URL.

## Données

- Garder le snapshot des 40 personnes initiales intact.
- Import complémentaire reproductible des parcours Wikidata de Jacques Attali, Franco Bassanini, Mario Monti, Ana Palacio et Evelyne Gebhardt.
- Ajouter séparément une sélection de participations à la commission Attali : nominations publiées en 2007 et composition du rapport de 2010, avec rôle, repère temporel et source primaire.
- Une composition attestée n'est pas transformée en intervalle individuel continu. Les éventuelles auditions restent distinctes d'une appartenance. Le corpus demeure une sélection, pas une liste exhaustive de la commission.

## Comportement

- Ajouter un repère de période et le mode `same` / `all` dans l'URL.
- À l'ouverture d'une institution depuis une personne, proposer ses passages datés et activer le filtre si un passage exploitable existe. Plusieurs passages restent sélectionnables.
- Conserver le contexte temporel en poursuivant vers une personne ; revenir au point de départ rétablit toutes les périodes.
- Le filtre strict retient les chevauchements établis ou une même composition explicitement sourcée. Dates absentes, bornes ouvertes et simples chevauchements possibles sont signalés ; ils restent consultables en toutes périodes.
- Une fonction générique ne devient pas une institution commune. Préserver les contextes institutionnels existants.
- Aligner le canvas, la liste, la fiche, les compteurs et le partage ; la comparaison conserve explicitement son périmètre toutes périodes.

## Vérification

- Tests de périodes : dates exactes, précision annuelle/mensuelle, frontières, points datés, bornes manquantes, dates invalides, compositions documentées.
- Tests de navigation, de restauration URL, de fusion du corpus et de provenance officielle.
- Parcours Chrome desktop et mobile : Attali 2007/2010, toutes périodes, participants cliquables, sources, institution non datée, retour/partage et absence de régression du recentrage animé.
- Build, lint, types et inspection visuelle. Commit local après vérification ; aucune publication distante.

## Réalisation

Implémentation et vérification locales terminées le 6 septembre 2026. 37 tests unitaires et 27 parcours Chrome réussis, avec 3 cas propres au bureau ignorés sur mobile. Sources et limites dans `docs/sources.md`, résultats détaillés dans `docs/verification.md`.
