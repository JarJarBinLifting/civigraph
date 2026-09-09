# Ajouts européens et parlementaires — 9 septembre 2026

16 personnes ajoutées : les six personnalités européennes et les dix personnalités parlementaires de la sélection validée. Aucun ajout du troisième lot territorial. Le corpus passe de 553 à 569 personnes, de 2 589 à 2 653 entités et de 8 055 à 8 522 déclarations.

123 déclarations Wikidata et 344 déclarations officielles supplémentaires : 330 mandats, commissions et groupes de l’Assemblée pour huit députés, puis 14 attestations pour six eurodéputés et deux sénateurs. Les déclarations ne sont pas des faits indépendants ; elles peuvent documenter le même mandat. Les groupes européens sont des appartenances parlementaires, pas des partis nationaux.

| Personne | Identifiant | Wikidata | Déclarations officielles | Portrait | Source de contrôle |
| --- | --- | ---: | ---: | --- | --- |
| Manon Aubry | Q59601214 | 10 | 2 | Oui | [Source parlementaire](https://www.europarl.europa.eu/meps/en/full-list/all) |
| François-Xavier Bellamy | Q15724624 | 15 | 2 | Non | [Source parlementaire](https://www.europarl.europa.eu/meps/en/full-list/all) |
| Valérie Hayer | Q63764512 | 7 | 2 | Oui | [Source parlementaire](https://www.europarl.europa.eu/meps/en/full-list/all) |
| Marie Toussaint | Q63347906 | 7 | 2 | Non | [Source parlementaire](https://www.europarl.europa.eu/meps/en/full-list/all) |
| David Cormand | Q23058507 | 7 | 2 | Oui | [Source parlementaire](https://www.europarl.europa.eu/meps/en/full-list/all) |
| Younous Omarjee | Q2542770 | 8 | 2 | Oui | [Source parlementaire](https://www.europarl.europa.eu/meps/en/full-list/all) |
| Sandrine Rousseau | Q21013136 | 7 | 65 | Oui | [Source parlementaire](https://www.assemblee-nationale.fr/dyn/deputes/PA795076) |
| Clémentine Autain | Q2980738 | 9 | 57 | Oui | [Source parlementaire](https://www.assemblee-nationale.fr/dyn/deputes/PA588884) |
| Danièle Obono | Q30335340 | 5 | 80 | Oui | [Source parlementaire](https://www.assemblee-nationale.fr/dyn/deputes/PA721960) |
| Sébastien Delogu | Q112640278 | 5 | 46 | Oui | [Source parlementaire](https://www.assemblee-nationale.fr/dyn/deputes/PA793464) |
| Sébastien Chenu | Q21294609 | 12 | 19 | Non | [Source parlementaire](https://www.assemblee-nationale.fr/dyn/deputes/PA720468) |
| Jean-Philippe Tanguy | Q46138822 | 4 | 17 | Oui | [Source parlementaire](https://www.assemblee-nationale.fr/dyn/deputes/PA795778) |
| Laure Lavalette | Q112308110 | 8 | 14 | Oui | [Source parlementaire](https://www.assemblee-nationale.fr/dyn/deputes/PA795912) |
| Aurélien Pradié | Q30351657 | 9 | 32 | Oui | [Source parlementaire](https://www.assemblee-nationale.fr/dyn/deputes/PA720100) |
| Ian Brossat | Q3147241 | 6 | 1 | Oui | [Source parlementaire](https://www.senat.fr/senateur/brossat_ian21088q.html) |
| Pierre Ouzoulias | Q41025869 | 4 | 1 | Oui | [Source parlementaire](https://www.senat.fr/senateur/ouzoulias_pierre19593h.html) |

## Sources et limites

Les parcours Wikidata conservent les identifiants des déclarations, les révisions, les références et la précision des dates. Les biographies restent partielles : une école commune ne prouve ni une même promotion ni une rencontre. Une date manquante reste inconnue.

Les huit identifiants Assemblée (P4123) ont tous été rapprochés dans l’archive officielle téléchargée le 9 septembre ; aucun mandat de ce lot n’a été rejeté. Les attestations européennes et sénatoriales sont des observations au 9 septembre, sans début ni fin de mandat déduits. La liste officielle du Parlement européen confirme les six personnes et leurs groupes ; les notices du Sénat confirment Ian Brossat et Pierre Ouzoulias. Ces sources ne valident pas automatiquement les autres déclarations Wikidata.

13 portraits Commons ont passé les contrôles de licence, d’attribution et de fichier. Les images proposées pour François-Xavier Bellamy, Marie Toussaint et Sébastien Chenu n’ont pas été retenues par le contrôle automatique : le repli visuel existant reste utilisé. Voir le manifeste expansion-images-manifest.json.

## Reproduction

- npm run data:import:expansion : sélection Wikidata, archive Assemblée et reconstruction des attestations éditoriales.
- node scripts/import-images.mjs --expansion : portraits de ce lot uniquement.
- npm run data:layout : géométrie de la carte correspondant au corpus complet.
- npx tsx scripts/audit-data.mjs : compteurs globaux.

La reconstruction des attestations conserve la date de vérification du fichier scripts/expansion-official-roster.json ; seule une nouvelle consultation des sources autorise sa modification. Les anciens snapshots restent inchangés. Les nouveaux fichiers sont fusionnés au chargement sans appel externe pendant la navigation.
