# Sources et actualisation du socle 2026

La liste du 8 septembre 2026 couvre les 36 membres du gouvernement, les 11 présidences des groupes de l’Assemblée nationale, les 7 présidences nommées dans la liste du Sénat et les responsables principaux de 13 formations. Les deux coprésidents de Place publique sont inclus. La présidence RDPI est non renseignée et reste explicitement non résolue.

Les formations retenues sont RN, Renaissance, LFI, PS, LR, Les Écologistes, PCF, MoDem, Horizons, UDI, Place publique, UDR et Reconquête. Cette liste éditoriale n’est ni un classement ni un recensement de toutes les formations, de leurs bureaux exécutifs, des parlementaires ou des élus locaux. Les personnalités historiques déjà présentes restent conservées.

## Provenance et rapprochement

Chaque fonction dans `scripts/people-2026.json` conserve son organisation, son rôle, sa source et la date de vérification commune. Les pages institutionnelles et les sites des formations attestent la fonction qu’ils présentent lors de la consultation ; ils ne valident pas tous les éléments du parcours Wikidata. Les sources évolutives doivent être relues avant de changer cette date.

Les QID ont été résolus à partir des articles français, avec vérification des libellés et des descriptions de personnes. Les imports suivants utilisent ces identifiants relus et refusent les entités non humaines. Sabrina Roubache est rapprochée de Sabrina Agresti-Roubache ; les graphies Nuñez et Le Hénanff sont conservées. Le document de la Conférence des présidents écrit « Etic Ciotti » : le rapprochement avec Éric Ciotti est recoupé avec sa [fiche de député](https://www2.assemblee-nationale.fr/deputes/fiche/OMC_PA330240) et le site de l’UDR. Les présidences des groupes suivent l’ordre de la liste des groupes de l’Assemblée.

Les fonctions sont enregistrées comme attestations ponctuelles au 8 septembre, sans inventer de date de nomination ou de fin. Les partis utilisent leurs QID et les groupes de l’Assemblée leurs identifiants AN existants ; un groupe parlementaire n’est pas fusionné avec un parti. Le gouvernement forme une organisation commune, sans lien personnel présumé entre ministres.

Les sources Wikidata conservent déclaration, révision à l’import, références et précision des dates. Les anciens instantanés et leurs déclarations gardent la priorité en cas d’identifiant déjà présent. Aucun nouveau mandat de l’Assemblée ni nouvelle déclaration HATVP n’a été collecté par cet import. Les parcours ne sont ni exhaustifs ni garantis à jour dans toutes leurs fonctions.

## Reproduire

1. Relire les sources du manifeste ; modifier ensemble la sélection, les rôles et la date de vérification. Consigner les postes non résolus.
2. `npm run data:import:current` collecte les parcours et reconstruit les attestations. Une résolution incomplète ne remplace pas le snapshot Wikidata.
3. `npm run data:audit:current` contrôle la couverture de chaque personne et régénère le rapport.
4. `npm run data:layout` régénère la disposition du corpus fusionné.
5. Exécuter les tests, le contrôle TypeScript et le build ; vérifier la recherche et les sources dans le navigateur.

Les données brutes Wikidata sont conservées dans `.cache/wikidata-current/`. Le rapport `data-coverage.md` décrit le corpus fusionné ; `current-coverage.md` détaille cette extension. `node scripts/audit-data.mjs` régénère le rapport global.
