# Données, provenance et limites

## Source primaire de l'import

La V0 importe les données structurées de [Wikidata](https://www.wikidata.org/wiki/Wikidata:Data_access) par l'API `wbgetentities`. Wikidata est la source immédiate des déclarations du graphe ; ce n'est pas une validation indépendante de leur vérité. Les références secondaires ou officielles renseignées par ses contributeurs restent accessibles.

Les 40 personnes initiales sont résolues à partir des titres d'articles français de `scripts/people.json`. Le complément `scripts/people-attali.json` ajoute cinq parcours selon la même procédure. Aucun profil privé, lien familial, relation personnelle ou score d'influence n'est collecté. Les descriptions des fiches sont les descriptions du snapshot Wikidata, en français lorsqu'elles sont disponibles.

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
- Chaque lien Wikidata dispose d'une URL de déclaration et d'une URL de révision de l'entité au moment de l'import. Les participations officielles décrites ci-dessous ont une provenance documentaire distincte et aucune fausse URL de déclaration ou révision Wikidata.
- Les références conservent leurs identifiants, URL P854, publications P248, imports P143 et dates de consultation P813 lorsqu'elles existent. L'interface expose les URL et les publications ; les imports depuis une autre édition Wikimedia ne sont pas présentés comme validation indépendante.

Les URL sont récupérées depuis Wikidata et limitées aux protocoles HTTP(S). Elles ne sont pas vérifiées en continu : une source historique peut être devenue indisponible. Les snapshots ne se rafraîchissent pas automatiquement.

## Exploration par période

Un lien de référence porte la période choisie. Lors d'un pivot depuis une personne, les passages datés de cette personne dans l'institution sont proposés, du plus ancien au plus récent. Le premier est choisi en l'absence de repère antérieur compatible. Les catégories masquées ne suppriment pas ce repère ; elles continuent à filtrer les liens affichés.

Le mode « Même période » accepte les intervalles dont le chevauchement est établi à la précision des sources. Une année ou un mois représente une plage d'incertitude pour chaque borne. Par exemple, 2007–2008 et 2008–2010 peuvent se croiser en 2008, mais ne le prouvent pas ; ils restent accessibles en toutes périodes avec les cas incertains. Deux dates ponctuelles connues uniquement à l'année ne prouvent pas davantage une date commune.

Une même composition officielle peut établir la participation au même groupe même si seule son année est connue. Ce critère exige un identifiant de composition partagé, la même institution et une provenance officielle pour les deux liens. Il ne s'applique pas à deux institutions distinctes ni à des déclarations Wikidata indépendantes.

Un début seul, une fin seule, une date invalide ou une précision inférieure à l'année ne suffit pas à déduire une présence sur une période. Sans passage exploitable pour la personne d'entrée, le mode toutes périodes reste actif et l'interface explique la limite. Les institutions, entreprises, écoles, partis et fonctions contextualisées utilisent ces règles ; un intitulé générique de fonction ne devient pas un groupe de personnes ayant travaillé ensemble.

Le filtre s'applique au graphe, à la liste, aux fiches et aux compteurs. Les étapes du parcours sont conservées ; leurs liens restent soumis aux filtres. Il se conserve en poursuivant vers une personne et dans l'URL, puis se réinitialise au point de départ. La comparaison entre deux personnes utilise toutes les périodes et présente les preuves de chaque côté.

## Commission Attali : complément vérifié le 6 septembre 2026

`src/data/attali-participations.json` contient une sélection non exhaustive de personnalités ayant un parcours politique, y compris des participants européens à cette commission française. Elle ajoute dix participations réparties entre deux compositions, sans remplacer la déclaration Wikidata non datée de Macron.

| Repère | Personnes retenues | Provenance primaire |
| --- | --- | --- |
| Composition initiale, 27 août 2007 | Jacques Attali, président ; Emmanuel Macron, rapporteur général adjoint ; Franco Bassanini, Mario Monti, Ana Palacio et Evelyne Gebhardt, membres | [Décret du 27 août 2007, article 2](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000428428) |
| Seconde mission, 2010 | Jacques Attali, président ; Emmanuel Macron, Franco Bassanini et Evelyne Gebhardt, membres | [Rapport « Une ambition pour dix ans »](https://www.vie-publique.fr/files/rapport/pdf/104000541.pdf), pages imprimées 3 et 211–213 |

La nomination de Macron comme membre et la fin des fonctions d'Ana Palacio figurent également dans le [décret du 4 mars 2010, article 1](https://www.legifrance.gouv.fr/loda/id/LEGITEXT000021936107). Ce décret sert de recoupement du changement de composition ; il n'est pas transformé en intervalle individuel pour tous les participants. Mario Monti figure parmi les personnes auditionnées dans le rapport de 2010, page 207, et n'est donc pas ajouté comme membre de la composition de 2010.

La date du décret de 2007 est un repère de composition, pas une date de rencontre. Le rapport de 2010 est conservé avec une précision annuelle ; aucune continuité individuelle entre les deux éditions n'est inférée. Les liens PDF utilisent la page du fichier, supérieure d'une unité au numéro imprimé dans ce rapport. Les fiches indiquent explicitement le numéro imprimé.

Les parcours Wikidata de Jacques Attali, Franco Bassanini, Mario Monti, Ana Palacio et Evelyne Gebhardt sont importés séparément afin de permettre l'exploration depuis leurs fiches. Le corpus fusionné comporte 45 personnes, 346 entités et 797 liens : 787 déclarations Wikidata, dont 117 avec URL de référence externe, et 10 participations officielles. Les trois jeux sont fusionnés par identifiant ; les déclarations initiales gardent la priorité et leur provenance d'origine.

## Sélection et attribution

Le corpus initial comprend 40 personnalités de plusieurs générations et courants politiques ; cette sélection éditoriale n'est ni un classement, ni une mesure de représentativité. Les données sont accessibles sans compte. Les visites et explorations ne sont pas enregistrées par l'application ; la vue est portée par l'URL.

L'import est reproductible, mais les données Wikidata sont évolutives : un nouvel import peut changer les effectifs, dates ou références. `meta.fetchedAt` indique le moment de la collecte, tandis que les révisions identifient les versions effectivement utilisées.
