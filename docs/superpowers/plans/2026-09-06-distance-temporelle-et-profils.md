# Distance temporelle et profils

Commentaires utilisateur du 6 septembre 2026 : afficher tous les voisins sans pagination, les placer selon leur éloignement temporel, ouvrir un onglet Profil pour expliquer chaque personne.

## Contrat retenu

- Conserver le filtre « Même période », le parcours, les transitions, les preuves et les comparaisons. Supprimer la pagination et son paramètre actif ; les anciennes URL avec `page` restent ouvrables.
- Classer les voisins datés par écart entre leur passage et le repère choisi, avec des couronnes d'écart croissant. Prendre le passage documenté le plus proche lorsqu'une personne en a plusieurs. L'écart ne constitue pas une preuve de rencontre.
- Employer la période de référence existante lorsqu'elle est exploitable, sinon l'année de l'instantané, explicitement affichée et modifiable. Le paramètre `year` partage ce choix. Aucune date de naissance ou borne manquante ne devient une date de passage.
- Isoler les dates inconnues dans une zone hors de l'échelle temporelle. Le parcours conservé reste identifiable. Tous les nœuds sont rendus ; zoom, déplacement, sélection et liste donnent accès aux réseaux denses.
- Profil par défaut pour les personnes, Connexions pour les institutions. Présenter une synthèse et des repères issus des relations sourcées du corpus complet, indépendamment des filtres du graphe. Conserver dates imprécises et bornes ouvertes ; aucune fonction n'est déclarée actuelle par inférence. Un clic sur une preuve ouvre Sources.

## Travail et validation

- [x] Reproduire les deux URL à 1982 × 1103 : Assas limité à 14 nœuds sur 69, absence de Profil pour Albane Gaillot.
- [x] Vérifier les échecs des parcours attendus avant implémentation.
- [x] Implémenter et tester le classement temporel, les dates inconnues et le contrat d'URL ; retirer le code actif de pagination.
- [x] Implémenter et tester le profil sourcé, sa sélection par défaut et son indépendance des filtres.
- [x] Vérifier les parcours existants, les grands réseaux, les transitions et le recentrage ; inspecter ordinateur et mobile.
- [x] Documenter le résultat et les limites ; préparer le checkpoint local après les contrôles. Pas de push ni de déploiement.
