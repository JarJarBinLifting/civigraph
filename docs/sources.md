# Données, provenance et limites

## Source primaire de l'import

La V0 importe les données structurées de [Wikidata](https://www.wikidata.org/wiki/Wikidata:Data_access) par l'API `wbgetentities`. Wikidata est la source immédiate des déclarations du graphe ; ce n'est pas une validation indépendante de leur vérité. Les références secondaires ou officielles renseignées par ses contributeurs restent accessibles.

Les 40 personnes initiales sont résolues à partir des titres d'articles français de `scripts/people.json`. Le complément `scripts/people-attali.json` ajoute cinq parcours selon la même procédure. Une recherche inverse dans douze institutions ajoute 447 personnes et leurs parcours. Les données distribuées dans le graphe se limitent aux parcours publics ; aucune activité de conjoint, rémunération, patrimoine ou relation personnelle n’est importée depuis Integrity Watch. Les descriptions des fiches proviennent du snapshot Wikidata, en français lorsqu'elles sont disponibles.

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

Un lien de référence porte la période choisie. Lors d'un pivot depuis une personne, les passages datés de cette personne dans l'institution sont proposés, du plus ancien au plus récent. Sans repère antérieur compatible, une composition officielle de cette personne est privilégiée, sinon son premier passage daté. Les catégories masquées ne suppriment pas ce repère ; elles continuent à filtrer les liens affichés.

Le mode « Même période » accepte les intervalles dont le chevauchement est établi à la précision des sources. Une année ou un mois représente une plage d'incertitude pour chaque borne. Par exemple, 2007–2008 et 2008–2010 peuvent se croiser en 2008, mais ne le prouvent pas ; ils restent accessibles en toutes périodes avec les cas incertains. Deux dates ponctuelles connues uniquement à l'année ne prouvent pas davantage une date commune.

Une même composition officielle peut établir la participation au même groupe même si seule son année est connue. Ce critère exige un identifiant de composition partagé, la même institution et une provenance officielle pour les deux liens. Il ne s'applique pas à deux institutions distinctes ni à des déclarations Wikidata indépendantes.

Un début seul, une fin seule, une date invalide ou une précision inférieure à l'année ne suffit pas à déduire une présence sur une période. Sans passage exploitable pour la personne d'entrée, le mode toutes périodes reste actif et l'interface explique la limite. Les institutions, entreprises, écoles, partis et fonctions contextualisées utilisent ces règles ; un intitulé générique de fonction ne devient pas un groupe de personnes ayant travaillé ensemble.

Le filtre s'applique au graphe, à la liste, aux fiches et aux compteurs. Les étapes du parcours sont conservées ; leurs liens restent soumis aux filtres. Il se conserve en poursuivant vers une personne et dans l'URL, puis se réinitialise au point de départ. La comparaison entre deux personnes utilise toutes les périodes et présente les preuves de chaque côté.

La section dépliable « Autres personnes liées — dates insuffisantes » expose les personnes aux dates inconnues ou au chevauchement incertain. Elle exclut les personnes déjà attestées dans la vue et celles dont toutes les dates sont extérieures. Chaque déclaration garde sa preuve ; une sélection ne transforme pas le lien en co-présence. « Explorer toute sa carrière » conserve le parcours et remet `time=all`, sans repère de période. Les grands réseaux sont paginés visuellement, avec toutes leurs déclarations disponibles en liste ; les compteurs du réseau portent sur l’ensemble filtré.

## Commission Attali : complément vérifié le 6 septembre 2026

`src/data/attali-participations.json` contient une sélection non exhaustive de personnalités ayant un parcours politique, y compris des participants européens à cette commission française. Elle ajoute dix participations réparties entre deux compositions, sans remplacer la déclaration Wikidata non datée de Macron.

| Repère | Personnes retenues | Provenance primaire |
| --- | --- | --- |
| Composition initiale, 27 août 2007 | Jacques Attali, président ; Emmanuel Macron, rapporteur général adjoint ; Franco Bassanini, Mario Monti, Ana Palacio et Evelyne Gebhardt, membres | [Décret du 27 août 2007, article 2](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000428428) |
| Seconde mission, 2010 | Jacques Attali, président ; Emmanuel Macron, Franco Bassanini et Evelyne Gebhardt, membres | [Rapport « Une ambition pour dix ans »](https://www.vie-publique.fr/files/rapport/pdf/104000541.pdf), pages imprimées 3 et 211–213 |

La nomination de Macron comme membre et la fin des fonctions d'Ana Palacio figurent également dans le [décret du 4 mars 2010, article 1](https://www.legifrance.gouv.fr/loda/id/LEGITEXT000021936107). Ce décret sert de recoupement du changement de composition ; il n'est pas transformé en intervalle individuel pour tous les participants. Mario Monti figure parmi les personnes auditionnées dans le rapport de 2010, page 207, et n'est donc pas ajouté comme membre de la composition de 2010.

La date du décret de 2007 est un repère de composition, pas une date de rencontre. Le rapport de 2010 est conservé avec une précision annuelle ; aucune continuité individuelle entre les deux éditions n'est inférée. Les liens PDF utilisent la page du fichier, supérieure d'une unité au numéro imprimé dans ce rapport. Les fiches indiquent explicitement le numéro imprimé.

Les parcours Wikidata de Jacques Attali, Franco Bassanini, Mario Monti, Ana Palacio et Evelyne Gebhardt sont importés séparément afin de permettre l'exploration depuis leurs fiches. Avant l’enrichissement suivant, ce lot portait le corpus à 45 personnes, 346 entités et 797 liens : 787 déclarations Wikidata et 10 participations officielles. Ces déclarations gardent la priorité et leur provenance d'origine.

## Recherche inverse dans douze institutions

`scripts/institutions.json` fixe les points d’entrée : Areva, deux entités Rothschild distinctes, IGF, French-American Foundation, commission Attali et six écoles/universités. Les requêtes SPARQL cherchent des personnes reliées par les propriétés autorisées, avec une notice française. Pour les écoles, les profils ont la nationalité française et une déclaration d’affiliation politique dans Wikidata. Ce critère ne prétend pas définir exhaustivement la profession politique.

Chaque requête est ordonnée par identifiant et plafonnée à 60 résultats. Le manifeste `network-discovery.json` conserve requête, URL, personnes retenues et présence du plafond. Les profils trouvés dans plusieurs institutions ne sont importés qu’une fois. Leurs parcours complets pour les cinq propriétés retenues peuvent relier d’autres institutions, d’où des effectifs finaux supérieurs à 60 à certaines écoles. Ce classement technique n’est ni un classement d’importance ni un échantillonnage représentatif.

Le corpus résultant compte **492 personnes, 2 394 entités et 7 568 déclarations**. Voir les [effectifs et dates par institution](data-coverage.md). Un même passage peut être documenté par plusieurs sources : les compteurs de déclarations ne dédupliquent pas les faits supposés équivalents.

## Assemblée nationale

Source : [Historique des députés](https://data.assemblee-nationale.fr/acteurs/historique-des-deputes), archive JSON des acteurs, mandats et organes depuis la XIe législature. Les identifiants Wikidata [P4123](https://www.wikidata.org/wiki/Property:P4123) sont rapprochés des acteurs `PA`. 119 personnes sont présentes dans l’archive ; 11 identifiants recherchés en sont absents. Aucun rapprochement par homonymie n’est effectué.

2 836 mandats sont retenus : Assemblée, commissions, missions, délégations, offices et groupes. Les rattachements financiers à des partis (`PARPOL`) sont exclus ; un groupe parlementaire garde son identité propre. Les organes sont identifiés par leur code `PO`, avec leur source officielle et sans fausse page Wikidata.

Le champ officiel `libelleAbrege` sert à afficher les intitulés longs dans le graphe. Le nom complet, l'identifiant et les preuves restent disponibles dans les fiches et la liste.

La date individuelle `mandature.datePriseFonction` prime sur `dateDebut`. Exemple : le mandat PM545051 d’Édouard Philippe commence personnellement le 23 mars 2012, tandis que `dateDebut` porte le début de la législature en 2007. Une fin absente reste inconnue. Deux mandats d’Olivier Becht aux dates inversées dans l’archive sont écartés et recensés dans `assembly-import.json` ; aucune correction de date n’est inventée.

## HATVP via Integrity Watch France

[Integrity Watch France](https://www.integritywatch.fr/) est réutilisé comme distributeur des déclarations publiques de la [HATVP](https://www.hatvp.fr/open-data/). L’export actif utilisé est **20260905_210004**, identifié par son manifeste public ; les dates de dépôt et de publication des déclarations sont distinctes de cette date d’export. `integrity-watch-import.json` conserve les URL d’export, leurs empreintes SHA-256, l’identifiant de chaque déclaration et l’empreinte de son fichier HATVP original.

Le rapprochement utilise l’identifiant [P4703](https://www.wikidata.org/wiki/Property:P4703), puis contrôle nom, prénom, date de naissance et date de dépôt pour relier le corps de déclaration à l’index public. L’UUID est vérifié dans le XML original HATVP. Cela contrôle le rattachement des documents, sans constituer une vérification indépendante de toutes les activités déclarées.

29 déclarants du corpus ont une déclaration complète ainsi rapprochée. Le premier lot publie **17 activités concernant 11 personnes**, uniquement dans des organismes explicitement identifiés par les correspondances relues de `scripts/organization-aliases.json`. Les **175 autres intitulés** sont consignés pour examen ; aucun nom ressemblant n’est fusionné automatiquement.

Seules deux rubriques sont retenues : activités professionnelles des cinq dernières années et participations aux organes dirigeants. Conjoints, collaborateurs, patrimoine, participations financières et rémunérations ne sont pas distribués dans Civigraph. Les instantanés bruts locaux de l’export public restent dans `.cache/`, exclu de Git. Un rôle de professeur à HEC ne devient pas une scolarité à HEC ; une activité auprès d’un parti ne devient pas une adhésion inférée.

Les identifiants de relation utilisent l’UUID et le contenu du passage ; des copies identiques sont dédupliquées. Les déclarations d’autres sources restent distinctes. Les dates au mois près restent au mois près, et `conservee` n’est jamais traduit en « toujours en cours » à la date actuelle. Chaque preuve cite la HATVP, son fichier original, Integrity Watch, l’intitulé déclaré, le dépôt et l’export.

## Repères officiels ciblés et correction de nom

`institution-participations.json` ajoute six participations ponctuelles :

- **Areva au 31 décembre 2009** : Anne Lauvergeon et Gérald Arbola, membres du directoire dans le [Document de référence 2009](https://cdn.orano.group/arevasa/Finance/docs/dorref2009/Doc%20de%20ref%202009_vdef2_vFR_08042010.pdf), pages imprimées 200–201 (pages PDF 202–203). Cette sélection rend ces personnes accessibles sur le passage documenté d’Édouard Philippe, sans affirmer une rencontre.
- **ENA, sortie du 31 mars 2004** : Emmanuel Macron, Sébastien Proto, Julien Aubert et Olivier Becht, dans l’[arrêté du 9 avril 2004](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000437029). Le repère porte sur la sortie commune ; aucun classement ni durée individuelle n’est reconstruit.

Le nom de Philippe Sanmarco diverge du libellé français du snapshot Wikidata. `entity-corrections.json` applique une correction explicite depuis sa [notice de l’Assemblée nationale](https://www2.assemblee-nationale.fr/sycomore/fiche/%28num_dept%29/6275), également liée dans sa fiche. Son QID et ses déclarations sont conservés. L’examen des 447 noms importés face aux titres des notices françaises a permis d’isoler ce cas ; il ne valide pas toutes les biographies.

## Sélection et attribution

Le corpus initial comprend 40 personnalités de plusieurs générations et courants politiques ; cette sélection éditoriale n'est ni un classement, ni une mesure de représentativité. Les données sont accessibles sans compte. Les visites et explorations ne sont pas enregistrées par l'application ; la vue est portée par l'URL.

L'import est reproductible, mais les données Wikidata sont évolutives : un nouvel import peut changer les effectifs, dates ou références. `meta.fetchedAt` indique le moment de la collecte, tandis que les révisions identifient les versions effectivement utilisées.
