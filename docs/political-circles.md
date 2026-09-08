# Cercles entre partis et parcours entre milieux

Dans Explorer, **Cercles entre partis** recherche des institutions partagées par au moins deux personnes distinctes, avec des appartenances à des partis différents. Les passages respectent les catégories et périodes de la carte ; les partis sont recherchés dans l'ensemble du corpus. Les groupes parlementaires et le statut indépendant sont exclus de cette lecture : elle utilise les relations P102 du corpus Wikidata, avec leurs limites de référencement.

Le mode **Au cours des carrières** ne signifie pas que les personnes représentaient ces partis lors de leur passage. Le mode **Au même moment, dates établies** exige une intersection temporelle certaine commune aux deux passages et aux deux appartenances politiques. Une composition commune à la précision annuelle peut aussi établir ce rapprochement si les deux appartenances couvrent toute la période possible. Une fin manquante ne signifie pas « encore membre ». Cette règle conservatrice peut écarter des cas réels dont les dates sont incomplètes. Les partis successifs ou alliés ne sont pas fusionnés et ne sont pas qualifiés d'opposants.

Chaque paire donne accès aux quatre déclarations qui fondent le résultat. Les sources supplémentaires des deux personnes restent accessibles. Les nombres de personnes et de paires ne sont pas multipliés par les sources répétées. La pagination ne tronque pas le corpus.

**Parcours entre milieux** classe explicitement certaines institutions et fonctions du corpus : haute administration, cabinets, entreprises, médias, cercles et commissions. Les relations de formation et d'appartenance à un parti identifient les deux autres milieux. Le fichier `src/data/institution-milieus.json` est une sélection éditoriale révisable, pas une nomenclature officielle ou exhaustive. Une entité non classée reste signalée comme telle. Une école ne démontre pas un emploi dans l'administration. Les milieux sont comptés une seule fois par personne ; plusieurs passages dans une banque ne créent pas plusieurs milieux. La fiche personnelle utilise l'ensemble du parcours, tandis que l'exploration respecte les filtres actifs.

## Enrichissement vérifié le 8 septembre 2026

Source primaire : [annuaire Young Leaders de la French-American Foundation France](https://www.french-american.org/programmes-et-evenements/young-leaders/), rubriques annuelles consultées le 8 septembre 2026.

| Promotion | Personnes déjà présentes dans le corpus |
| --- | --- |
| 1982 | Alain Juppé |
| 1996 | François Hollande, Pierre Moscovici, Anne Lauvergeon |
| 2006 | Najat Vallaud-Belkacem, Laurent Wauquiez |
| 2011 | Édouard Philippe |
| 2012 | Emmanuel Macron, Fleur Pellerin, Cédric Villani |

Ces dix participations sont ajoutées aux déclarations existantes. Les promotions sont distinctes, la précision reste annuelle et aucune période individuelle n'est reconstituée. La participation au programme ne devient pas une adhésion à la Fondation ou la preuve d'une rencontre. Les nouvelles compositions portent leur propre date de vérification ; les anciennes conservent la leur. Le terme technique `official` désigne ici une source primaire publiée par l'organisme lui-même, pas une administration publique.

Les liens partageables conservent `systemLens=circles|milieus`, `circleTiming=all|contemporary`, l'institution ou la personne sélectionnée et les filtres de la carte. La recherche textuelle et la pagination sont locales à l'écran.

## Vérifications locales

- 151 tests unitaires réussis ; lint et build de production réussis, avec contrôle TypeScript.
- 18 parcours navigateur ciblés réussis sur Chrome ordinateur/mobile : dix nouveaux cas (sources, filtres, navigation, restauration, méthode sans JavaScript) et huit cas voisins de lecture du système. Les deux derniers cas ont été rejoués après correction des sélecteurs et du compteur ancien du test : le corpus avait déjà 83 personnes communes entre ENA et Sciences Po, contre 80 attendues.
- Captures des détails de cercle et de parcours contrôlées sur les deux formats. La navigation des nouvelles lectures est placée au-dessus du contenu pour éviter les recouvrements.
- Couverture et disposition recalculées : 8 045 déclarations, 5 978 connexions, 2 581 entités et 547 personnes. Les nouvelles classifications sont partielles et ne modifient pas les faits sources.

La recette initiale a été réalisée sur le build de ce worktree au port 4317, distinct de l'autre aperçu local.

## Livraison autorisée le 8 septembre 2026

Après autorisation de déploiement et de push, la release locale du port 4300 a été remplacée par le build validé `iofN3r-JUz1DpfZsd3h9n`, servi depuis ce worktree. La réponse HTTP 200 contient cet identifiant et la nouvelle lecture. Les dix tests des nouvelles fonctionnalités ont été rejoués sur cette release, sur ordinateur et mobile : tous réussissent. Les captures de cercle sur ordinateur et de parcours sur mobile ont également été contrôlées.

La publication du code cible `JarJarBinLifting/civigraph`, branche `main`. Ce déploiement reste local ; aucun hébergement distant n'est configuré dans le projet. Les fichiers de travail préexistants `.mockups/`, `AGENTS.md` et `CLAUDE.md` restent hors du commit.
