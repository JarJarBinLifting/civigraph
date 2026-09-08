# Équipes, promotions et explorations guidées

Les idées 1, 2, 3 et 8 sont accessibles par **Explorer → Équipes et promotions · visite guidée**. La comparaison propose aussi **Se sont-ils croisés ?**.

Une exploration conserve son groupe et son étape dans `journey` et `journeyStep`, y compris dans les sauvegardes locales. Les trois étapes exposent la composition sourcée, les passages ultérieurs datés, puis une comparaison de deux membres avec retour au groupe. L'exploration utilise les carrières complètes, indépendamment des filtres de la carte ; la comparaison réinitialise les filtres.

## Couverture initiale

- Cabinet de Pierre Moscovici : trois personnes sélectionnées parmi les quinze nommées dans l'article 1 de l'[arrêté du 28 juin 2012](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000026116374/).
- Cabinet d'Emmanuel Macron : les cinq personnes nommées dans l'article 1 de l'[arrêté du 1er septembre 2014](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000029422598). Ce texte n'est pas une liste exhaustive de toutes les équipes successives.
- Six promotions/programmes déjà sourcés : ENA Senghor et Young Leaders 1982, 1996, 2006, 2011, 2012. Certaines sélections ne contiennent qu'une personne ; la comparaison y reste indisponible.

Six nouvelles personnes, deux cabinets et dix relations sont ajoutés. Le ministre signataire possède un lien de rattachement distinct et n'est pas compté comme membre de son cabinet. Cédric O réutilise son identifiant Wikidata déjà présent dans le corpus. Les six autres identifiants locaux n'inventent pas de correspondance Wikidata. Alexis Kohler est identifié explicitement dans les deux arrêtés ; aucun rapprochement automatique par nom n'est effectué.

Les repères de nomination ne reconstruisent aucune durée. Un passage ultérieur doit avoir un début ou un point daté strictement postérieur à la dernière date possible du repère. Aucun poste actuel, première équipe de carrière, rencontre ou lien personnel n'est déduit. Les carrières ajoutées restent très partielles : le complément documente le passage de Kohler entre les deux cabinets et réutilise le parcours de Cédric O déjà présent.

## Sources et maintenance

`src/data/cabinet-rosters.json` conserve les nominations vérifiées le 8 septembre 2026. `src/data/guided-cohorts.json` classe explicitement les groupes ; les promotions ne sont jamais inférées d'une école ou d'années communes. Les déclarations officielles conservent leur document et leur article dans les fiches habituelles.

Après modification : `npx tsx scripts/audit-data.mjs`, `npm run data:layout`, `npm test`, `npm run build`. Les tests navigateur ciblés sont dans `tests/guided-networks.spec.ts`.

## Validation du 8 septembre 2026

156 tests métier passent ; compilation de production et lint passent. Huit scénarios navigateur (ordinateur/mobile) couvrent le menu, les trois étapes, les preuves, le partage, le retour sans rechargement, les groupes incomplets et les sauvegardes. Seize scénarios existants ciblés sur comparaison, sauvegardes et lectures de réseaux passent également. Prévisualisation isolée sur le port 4397 ; aucune publication distante.
