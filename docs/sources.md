# Données, provenance et limites

## Source primaire de l'import

La V0 importe les données structurées de [Wikidata](https://www.wikidata.org/wiki/Wikidata:Data_access) par l'API `wbgetentities`. Wikidata est la source immédiate des déclarations du graphe ; ce n'est pas une validation indépendante de leur vérité. Les références secondaires ou officielles renseignées par ses contributeurs restent accessibles.

Les 40 personnes sont résolues à partir des titres d'articles français de `scripts/people.json`. Aucun profil privé, lien familial, relation personnelle ou score d'influence n'est collecté. Les descriptions des fiches sont les descriptions françaises du snapshot Wikidata.

## Propriétés retenues

| Propriété | Relation présentée | Traitement |
| --- | --- | --- |
| [P69](https://www.wikidata.org/wiki/Property:P69) | Formation | Établissement fréquenté, avec les dates disponibles |
| [P39](https://www.wikidata.org/wiki/Property:P39) | Fonction | Intitulé de fonction distinct d'une institution ; contexte conservé |
| [P102](https://www.wikidata.org/wiki/Property:P102) | Affiliation politique | Partis et statuts, dont le statut indépendant |
| [P108](https://www.wikidata.org/wiki/Property:P108) | Employeur | Organisation employeuse déclarée |
| [P463](https://www.wikidata.org/wiki/Property:P463) | Organisation | Appartenance à une organisation déclarée |

Les déclarations au rang `deprecated`, les valeurs inconnues/absentes et les auto-liens sont exclus. Des déclarations multiples entre deux entités sont conservées : elles peuvent décrire des mandats et des périodes différents. Le compteur « liens » compte ces déclarations, tandis que « entités liées » déduplique leurs extrémités.

## Fonctions contextualisées

P39 peut pointer vers une fonction générique. L'import conserve les qualificatifs institutionnels ou territoriaux P2389, P1001 et P642. Si l'un est présent, l'entité de fonction reçoit une clé composée du QID et des qualificatifs ; son libellé ajoute le contexte. Le QID original et les identifiants/révisions des contextes sont conservés. Cette transformation ne crée pas de nouvelle relation factuelle : elle distingue les extrémités de déclarations existantes.

Exemple dans cet instantané : la fonction de président associée à Emmanuel Macron et qualifiée par Renaissance est séparée d'une présidence rattachée à un autre organisme. La comparaison exige alors une même fonction avec un même contexte pour la compter comme entité commune.

Les fonctions non contextualisées restent des intitulés de fonctions. Partager cet intitulé ne démontre pas avoir exercé dans le même organisme ou à la même période ; l'interface le rappelle.

## Temps et preuves

- P580 et P582 fournissent le début et la fin ; P585 fournit une date ponctuelle si disponible.
- La précision Wikidata est conservée. Une année seule est affichée comme telle ; aucun mois ou jour n'est inventé.
- L'absence de fin est affichée « fin non renseignée », jamais « aujourd'hui » ou « en cours ».
- L'identifiant exact de déclaration est préservé, y compris les anciennes variations de casse des GUID.
- Chaque lien dispose d'une URL de déclaration et d'une URL de révision de l'entité au moment de l'import.
- Les références conservent leurs identifiants, URL P854, publications P248, imports P143 et dates de consultation P813 lorsqu'elles existent. L'interface expose les URL et les publications ; les imports depuis une autre édition Wikimedia ne sont pas présentés comme validation indépendante.

Les URL sont récupérées depuis Wikidata et limitées aux protocoles HTTP(S). Elles ne sont pas vérifiées en continu : une source historique peut être devenue indisponible. Les snapshots ne se rafraîchissent pas automatiquement.

## Sélection et attribution

Le corpus initial comprend 40 personnalités de plusieurs générations et courants politiques ; cette sélection éditoriale n'est ni un classement, ni une mesure de représentativité. Les données sont accessibles sans compte. Les visites et explorations ne sont pas enregistrées par l'application ; la vue est portée par l'URL.

L'import est reproductible, mais les données Wikidata sont évolutives : un nouvel import peut changer les effectifs, dates ou références. `meta.fetchedAt` indique le moment de la collecte, tandis que les révisions identifient les versions effectivement utilisées.
