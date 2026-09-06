# Vérification de la V0 — 6 septembre 2026

Application testée en build de production local sur `http://127.0.0.1:4300`, avec Node.js 24.18.0 et Chrome installé sous Windows.

Les sections ci-dessous conservent les résultats de chaque livraison. Les chiffres et comportements antérieurs sont historiques ; l'état enrichi est décrit dans la dernière section.

## Validation initiale

| Contrôle | Résultat observé |
| --- | --- |
| `npm run lint` | Réussi, aucune erreur ni avertissement ESLint |
| `npm run typecheck` | Réussi |
| `npm test` | 16 tests réussis dans 3 fichiers |
| `npm run build` | Compilation de production Next.js réussie |
| `npm run test:e2e` | 16 parcours réussis, 8 scénarios sur ordinateur et sur mobile |
| Double-clic réel sur le nœud ENA | Extension confirmée dans l'URL et le graphe |
| Aperçu de production | HTTP 200 ; journal d'erreurs du serveur vide |

Les avertissements `NO_COLOR` / `FORCE_COLOR` du lanceur Playwright concernent uniquement la sortie du terminal. Aucun `pageerror` ni appel HTTP à un domaine tiers pendant le parcours initial testé.

## Parcours navigateur

Les tests couvrent :

1. Réseau initial et preuve du lien Macron–ENA : déclaration Wikidata, révision et période 2002–2004.
2. Recherche « edouard philippe », accents omis, absence de résultat et retour navigateur.
3. Désactivation de toutes les catégories, état vide puis restauration.
4. Clic réel sur un nœud du canvas et extension de son réseau.
5. Comparaison Macron–Philippe : trois points communs dans le corpus, les six preuves correspondantes et leur filtrage.
6. Copie effective dans le presse-papiers et rechargement d'une URL contenant sélection, extensions, filtres et mode liste.
7. Récupération après paramètres inconnus, absence de débordement horizontal et fermeture au clavier de la méthode.
8. Restauration d'une comparaison partagée et retour vers un graphe partageable depuis une entité commune.

## Vérification visuelle

Captures inspectées à 1440 × 1000 et 390 × 844 pixels CSS. Les vues d'exploration et de comparaison ont été examinées sur ordinateur et mobile. Les corrections observées portent sur les tailles de texte, le contraste et la position des libellés du graphe.

Le graphe mobile s'ouvre avec un zoom lisible et se déplace horizontalement : des nœuds peuvent être hors du cadre, comme dans une carte. Le contrôle de recentrage affiche la vue d'ensemble et le mode Liste permet la consultation sans manipulation du canvas. La fiche est placée sous le graphe sur mobile. Les textes de l'interface ne débordent pas horizontalement.

Les captures et traces sont des fichiers locaux de QA dans `test-results/` et `.working/`, ignorés par Git. Il ne s'agit pas d'un audit d'accessibilité complet ou d'une validation sur appareils physiques. Firefox et Safari n'ont pas été testés.

## Corpus et provenance

- 40 personnes sélectionnées, 297 entités et 717 déclarations.
- Identifiants uniques, extrémités présentes et URL de déclaration/révision pour chaque lien.
- Recherche par noms courts ENA et Sciences Po vérifiée par un test de régression.
- Précision temporelle préservée ; une fin absente n'est pas interprétée comme une fonction actuelle.
- 111 déclarations possèdent une URL de référence externe ; les autres restent marquées comme déclarations à recouper.

La présence des références et des révisions est validée. La véracité indépendante des 717 déclarations, la disponibilité durable des sites référencés et la représentativité du corpus ne sont pas établies par ces tests.

## État de livraison

V0 locale avec les neuf fonctions retenues. Documentation d'installation, d'import et de provenance présente. Aucun push, déploiement, compte ou hébergement externe créé. La V1 et ses 500–2 000 personnes restent hors périmètre.

## Recentrage animé — complément du 6 septembre 2026

Développer une entité déplace désormais cette entité au centre avec une transition de 620 ms, affiche ses voisins directs et conserve les étapes précédentes avec leurs liens documentés. Le centre (`focus`) est distinct du point de départ (`root`) et de la fiche sélectionnée. Le parcours permet le retour à une étape antérieure ; les anciennes URL déduisent le centre de la dernière extension.

| Contrôle après modification | Résultat observé |
| --- | --- |
| `npm test` | 20 tests réussis dans 3 fichiers : voisinage du centre, maintien du chemin, retour et contrat d'URL compris |
| `npm run lint` et `npm run typecheck` | Réussis |
| `npm run build` | Build de production Next.js réussi |
| `npx playwright test` | 20 parcours réussis : 11 sur ordinateur, 9 sur mobile ; les 2 cas réservés à l'ordinateur sont explicitement ignorés dans le projet mobile |
| Bernard Cazeneuve → Conseiller régional | Même instance Cytoscape, même nœud et même lien conservés ; positions intermédiaires mesurées ; arrivée au centre et trois voisins distincts |
| Retour pendant la transition, double-clic | Aucun retrait retardé du réseau restauré ; exploration encore utilisable |
| Retour/avance navigateur, rechargement et ancienne URL | Centre restauré |
| Préférence de réduction des animations | Position finale appliquée sans animation sur ordinateur et mobile |

Inspection des captures avant, pendant et après le mouvement à **1982 × 1103**, soit le format du commentaire utilisateur. La vue finale contient Conseiller régional au centre, Bernard Cazeneuve, Jean-Pierre Raffarin et Ségolène Royal autour, avec leurs trois liens. Aucun `pageerror` dans le parcours animé testé. Inspection complémentaire à **390 × 844** : les quatre nœuds et leurs libellés tiennent dans le cadre grâce à une disposition plus compacte des petits réseaux. Les grands réseaux mobiles restent déplaçables comme précédemment.

Captures locales dans `.working/pivot-motion-*.png` et `test-results/pivot-*.png`, ignorées par Git. Aperçu local reconstruit et relancé sur le port 4300 ; aucune publication distante effectuée.

## Exploration par période — complément du 6 septembre 2026

Depuis Macron, développer la commission Attali ouvre une sélection de six participations de la composition initiale de 2007. Le repère de 2010 affiche quatre participations documentées dans le rapport de cette année. Macron reste connecté et son rôle change selon la source. Les cinq personnalités ajoutées ont également des parcours Wikidata navigables. Le corpus complété comporte **45 personnes, 346 entités et 797 liens**, dont 10 participations officielles.

| Contrôle sur le build final | Résultat observé |
| --- | --- |
| `npm test` | 37 tests réussis dans 6 fichiers |
| `npm run lint` et `npm run typecheck` | Réussis sans erreur |
| `npm run build` | Build de production Next.js réussi |
| `npx playwright test` | 27 parcours réussis en 26,2 secondes : 15 sur ordinateur et 12 sur mobile ; 3 cas d'animation/navigation propres au bureau explicitement ignorés sur mobile |
| Macron → Attali, 2007 / 2010 | 7 nœuds et 6 liens, puis 5 nœuds et 4 liens ; rôles et sources concordants dans la fiche et la liste |
| Toutes les périodes | 11 déclarations accessibles, y compris la déclaration Wikidata initiale sans période |
| Provenance officielle | Décret de 2007 ou rapport de 2010 ; lien vers la page du PDF, numéro imprimé et rôle ; aucune fausse révision Wikidata |
| Poursuite vers Evelyne Gebhardt | Personnalité au centre, période conservée et autres parcours accessibles en toutes périodes |
| Écoles, entreprises et dates absentes | ENA : passage 2002–2004 ; Rothschild & Cie : 2008–2012 ; French-American Foundation : absence de période exploitable expliquée |
| Partage, rechargement, retour et avance | Période et choix même/toutes périodes restaurés |
| Animation au moment où apparaît le contrôle temporel | Même instance Cytoscape, même nœud Attali, positions intermédiaires mesurées et lien officiel avec Macron conservé |
| Intégrité du corpus | Identifiants uniques, extrémités présentes, liens Wikidata et révisions valides ; les 717 déclarations initiales restent inchangées |

Les tests temporels couvrent les intervalles exacts, les précisions annuelles et mensuelles, les années frontières, les dates ponctuelles, les bornes absentes, les dates invalides et les compositions officiellement sourcées. Une année commune incertaine n'est pas transformée en rencontre, ni une fin absente en fonction toujours exercée.

Inspection visuelle à **1982 × 1103** et **390 × 844** : contrôles temporels, participants, rôles et présentation des preuves. Une première capture mobile montrait le libellé du participant du bas sous les commandes. Un espace dédié aux commandes et une hauteur adaptée au panneau temporel corrigent le chevauchement ; un contrôle géométrique du navigateur vérifie désormais que les libellés précèdent la zone d'aide. Captures finales `test-results/periods-*.png`, ignorées par Git.

Aucun `pageerror` sur les parcours initial et Attali vérifiés ; aucune requête vers un domaine tiers pendant l'exploration initiale. Journal d'erreurs du serveur vide après les tests. Aperçu de production reconstruit et relancé sur le port 4300. Aucun push ni déploiement distant.

Limites : la sélection Attali n'est pas l'ensemble des membres ; les deux compositions ne documentent pas une présence individuelle continue de 2007 à 2010. Les autres institutions utilisent leurs dates disponibles, avec une couverture variable. Les contrôles automatisés ne vérifient pas indépendamment toutes les déclarations Wikidata, ni la disponibilité future des sources. Les navigateurs et appareils physiques non testés restent ceux signalés plus haut.

## Enrichissement des institutions — complément du 6 septembre 2026

Le corpus comporte **492 personnes, 2 394 entités et 7 568 déclarations**, dont 4 699 déclarations Wikidata, 2 836 mandats de l'Assemblée nationale, 17 activités HATVP distribuées par Integrity Watch France et 16 participations dans des compositions officielles. Les 797 déclarations antérieures sont préservées. Le nombre de déclarations avec une période utilisable passe de 496 à 4 766 ; ces compteurs n'assimilent pas plusieurs sources d'un même fait à des faits indépendants. Le détail par institution figure dans [data-coverage.md](data-coverage.md).

| Contrôle après enrichissement | Résultat observé |
| --- | --- |
| `npm test` | 51 tests réussis dans 9 fichiers |
| `npm run lint`, `npm run typecheck` | Réussis ; contrôle TypeScript également exécuté dans le build final |
| `npm run build` | Build de production Next.js réussi |
| `npm run test:e2e` | 35 parcours réussis sur ordinateur et mobile ; 3 scénarios réservés à l'ordinateur explicitement ignorés sur mobile |
| Après l'ajustement des libellés parlementaires | Nouveau build et 51 tests unitaires réussis ; les 8 parcours d'enrichissement repassent sur ordinateur et mobile, dont le maintien du nom complet en fiche |
| Mélenchon → Philippe → Areva, période de Philippe | Anne Lauvergeon et Gérald Arbola présents grâce au directoire attesté au 31 décembre 2009 ; trois personnes supplémentaires accessibles avec leurs dates insuffisantes, sans co-présence affirmée |
| Félicité Herzog depuis la section des dates insuffisantes | Carrière complète ouverte ; suppression du filtre temporel ; retour et rechargement vérifiés |
| ENA | Composition officielle de la promotion Senghor de 2004 ; 123 entités en toutes périodes, accessibles par pages de 12 voisins et en liste intégrale ; page partagée et rechargée |
| Assemblée nationale | 119 personnes rapprochées par P4123 ; mandat individuel, organe, rôle et dates conservés ; pour les remplacements, priorité à la date personnelle de prise de fonction |
| Integrity Watch / HATVP | 29 déclarants rapprochés par P4703 ; contrôle du nom, prénom, date de naissance et de l'UUID dans le XML original ; 17 activités importées pour 11 personnes |
| Preuve HATVP dans la fiche | Enseignement et recherche de Jean-Noël Barrot auprès d'HEC, janvier 2020–juillet 2022 ; URL du XML original, précision mensuelle et provenance visibles |
| Intégrité et couverture | Identifiants uniques, extrémités présentes, invariants temporels et compteurs concordants ; 15 780 URL contrôlées syntaxiquement, toutes HTTP(S) |

Inspection visuelle à **1982 × 1103**, **1440 × 1000** et **390 × 844** : Areva avec continuation dépliée, réseau dense de l'ENA, fiche HATVP et organes parlementaires. La pagination limite les grands voisinages sans retirer les données de la liste ou de la fiche. Le canvas mobile conserve une hauteur suffisante sous les contrôles temporels ; son zoom lisible peut laisser des nœuds hors champ, accessibles par déplacement ou recentrage. Le recentrage tient compte des libellés. Les intitulés longs d'organes parlementaires utilisent leur libellé abrégé officiel dans le graphe ; le nom complet reste dans la fiche. Captures locales `test-results/enrichment-*.png`, ignorées par Git.

Les reprises d'import depuis les fichiers bruts en cache ont été exécutées pour l'Assemblée et Integrity Watch. Les deux mandats parlementaires aux dates inversées dans la source sont écartés avec leur motif dans le manifeste. Les 175 intitulés d'organismes HATVP sans correspondance validée restent dans le rapport d'import et ne créent pas de liens. Un libellé Wikidata incorrect de Philippe Sanmarco est corrigé à partir de sa fiche officielle Sycomore, avec la provenance de la correction.

Aucun `pageerror` dans les parcours initial et Areva vérifiés ; aucune requête vers un domaine tiers pendant l'exploration initiale. L'aperçu utilise les instantanés locaux. Aucun push ni déploiement distant.

Limites : recherche inverse plafonnée à 60 profils par institution, corpus non exhaustif et non représentatif. Les 17 activités HATVP constituent un premier lot limité aux organismes explicitement identifiés, pas l'ensemble des déclarations d'intérêts. Une présence attestée en 2009 ou une promotion de 2004 ne crée pas une durée individuelle continue. Les données sans fin ne prouvent pas une activité actuelle. La véracité indépendante de toutes les déclarations Wikidata et la disponibilité future des sources ne sont pas garanties par les tests. Les limites de navigateurs et d'appareils signalées plus haut demeurent.

## Réseau complet par distance temporelle et Profil — 6 septembre 2026

Les deux commentaires ont été reproduits sur leurs URL, à 1982 × 1103 : Assas affichait 14 nœuds sur 69 ; la fiche d'Albane Gaillot s'ouvrait sur Connexions et n'avait pas de Profil. Deux tests navigateur ont constaté ces comportements avant l'implémentation.

Le réseau filtré est maintenant rendu intégralement. Les périodes exploitables déterminent des couronnes d'écart croissant ; les périodes inconnues sont placées dans une zone distincte, hors échelle. La référence reprend la période sélectionnée ou l'année de l'instantané, explicitement affichée et modifiable. Le champ `year` conserve cette personnalisation ; le code, les contrôles et le paramètre actif de pagination sont retirés.

Le Profil s'ouvre par défaut pour une personne. Il présente une synthèse et une sélection de repères issus des déclarations du corpus complet, indépendamment des filtres du graphe. Les preuves ouvrent Sources ; le retour vers Profil et Connexions fonctionne. Les institutions gardent Connexions comme onglet initial.

| Contrôle | Résultat observé |
| --- | --- |
| Domaine et corpus | 53 tests réussis dans 10 fichiers ; les 2 tests du profil sont également repassés après l'ajustement de son texte |
| TypeScript, lint et compilation | Réussis ; TypeScript est également exécuté par le build final |
| Suite navigateur complète | 39 parcours réussis, 3 cas réservés à l'ordinateur explicitement ignorés sur mobile |
| Après le dernier ajustement des noms au faible zoom | Lint et build réussis ; 10 parcours ciblés repassés sur ordinateur et mobile : réseau complet, Profil, sélection réelle, pivot, URL anciennes et périodes Attali |
| Assas | 69 nœuds et 70 liens rendus ; 2026 puis 2000 comme année repère ; rechargement restauré |
| Sens des distances | Gabriel Attal (2008–2010) plus proche du repère 2026 qu'Abel Mestre (1998–2004) ; ordre inversé avec le repère 2000. La fin seule de Nicole Belloubet reste hors échelle |
| Sélection dans les dates inconnues | Clic réel sur le nœud d'Albane Gaillot dans le réseau complet ; Profil ouvert puis pivot, avec Lecornu et Assas conservés dans le parcours |
| Profil | Fonction parlementaire datée 2017–2022 et études à Assas sans date inventée ; preuve Wikidata accessible ; mêmes repères lorsque toutes les catégories du graphe sont masquées |
| Réseaux denses | ENA : 123 entités et 130 déclarations, conservées après rechargement et disponibles en liste |
| Navigation antérieure | Comparaison, preuves, partage, retour/avance, transitions de 620 ms, réduction des animations et recentrage vérifiés |

Les captures ont été inspectées à 1982 × 1103, 1440 × 1000 et 390 × 844. Le cadrage utilise les positions de destination et les libellés pour conserver tous les nœuds à l'ouverture. Un échec de clic sur mobile, dû à l'ancien zoom minimal qui plaçait l'ENA hors champ, a été corrigé et le test est repassé. Les noms trop rapprochés au faible zoom s'affichent progressivement au zoom, au survol ou à la sélection ; le centre conserve une taille lisible. Le mode Liste permet une consultation complète au clavier. Captures locales dans `test-results/chronology-assas-*.png`, `profile-albane-*.png` et `enrichment-dense-*.png`.

Le corpus et ses données sources n'ont pas été modifiés. Le Profil n'est pas une biographie vérifiée auprès de nouvelles sources et ne prétend pas être exhaustif. Les couronnes représentent des plages d'écart, pas une échelle métrique continue ni une preuve de rencontre. Les dates manquantes restent manquantes. Journal d'erreurs du serveur vide après la suite complète ; aucun push ni déploiement distant.

## Sprint priorisé, comparaison, parcours et images — 6 septembre 2026

Les lots 1 à 5 et l’ajout demandé de photos sont livrés localement. La carte bénéficie d’un index réutilisable, d’une caméra sans recalcul des styles lors du déplacement, de libellés prioritaires, de l’accentuation du voisinage inspecté et d’un mode agrandi conservant l’instance Cytoscape. La comparaison possède sa carte et ses preuves des deux côtés, ainsi que des chemins institutionnels bornés. Le Profil propose un Parcours sourcé. Des notices serveur et une page de méthode préparent la publication. Des explorations nommées se sauvegardent localement et la carte s’exporte réellement en PNG.

Le dépôt était propre sur `main`, commit `1c008cd82cb4c64010c54f9698c2ecd9d6cfdfb8`. La baseline a réussi : lint, typecheck, 53 tests unitaires, build et 39 scénarios Chrome, avec 3 exclusions mobiles déjà présentes. Les nouveaux comportements pertinents ont d’abord été observés en échec dans leurs tests, puis corrigés. Le détail des lots, fichiers, commandes, échecs de préparation et commits se trouve dans [SPRINT-STATUS.md](SPRINT-STATUS.md). Les instantanés de relations existants et leurs preuves restent inchangés ; aucun reset, installation de dépendances, push ou déploiement.

| Contrôle final | Résultat réel |
| --- | --- |
| `npm run lint` | Réussi |
| `npm run typecheck` | Réussi |
| `npm test` | 72 tests réussis dans 17 fichiers, 2,16 s |
| `npm run build` | Réussi ; build `npGfydTW87YmjNK7UholU` |
| `npm run test:e2e` | 65 réussis, 3 scénarios réservés au bureau ignorés sur mobile, 1,0 min ; nouveau build servi avant le lancement des tests |
| Navigation et temps | Réseaux complets, anciennes URL, retour/avance, pivots rapides, retour pendant animation, dates inconnues et réduction des animations conservés |
| Comparaison | Carte, cartes alternatives, preuves gauche/droite, statuts des paires de déclarations, filtres, institution pivot et restauration d’URL sur bureau/mobile |
| Chemins | Fixtures de bornage, cycles, directions, déduplication et filtres ; scénario réel Macron → Marine Le Pen, quatre segments maximum, preuves et partage |
| Parcours | Dates partielles, activités concomitantes, passages répétés, preuves parallèles, événements sans dates et indépendance vis-à-vis des filtres |
| Notices et méthode | HTML lisible sans JavaScript, personnes et institutions canoniques, liens sources réels, inconnue en HTTP 404, noindex par défaut |
| `node scripts/verify-publication.mjs` | Sur serveur temporaire local avec activation explicite : deux pages `index, follow`, canonical/OG vers `https://example.org`, graphe `noindex`, inconnue 404 ; sitemap 1 780 URL documentaires uniques, aucune URL locale ou combinatoire ; zéro requête tierce ; serveur temporaire arrêté |
| Sauvegardes | Création, restauration, suppression ciblée, état d’URL complet, stockage corrompu/indisponible et entité disparue ; contrôle clavier bureau/mobile |
| PNG | Deux téléchargements réels vérifiés et inspectés ; carte, guides, noms, catégories, périodes, corpus, limites, URL et crédits d’images présents |
| Images | 810 fichiers locaux, 31 494 788 octets : 332 portraits et 478 illustrations ; 810 SHA-256 valides, 810 décodages Chrome réussis, aucune différence de dimensions ; repli sur initiales testé |
| Cinq vues finales | Aucun débordement horizontal, erreur console/page ou appel réseau tiers ; ENA 123 nœuds/130 déclarations et Assas 69/70 |

### Mesures comparables et limites

Dans Chrome, au format 1982 × 1103, 120 déplacements synchrones de caméra sur l’ENA prenaient 1 699 ms et déclenchaient 44 760 événements de style avant correction. La même instrumentation finale prend 0,3 ms et ne déclenche plus d’événement de style. Sur Assas : 1 047 ms et 26 040 événements avant, 0,4 ms et zéro événement après. Ces nombres mesurent le gestionnaire synchrone, pas le temps de peinture complet ni la fréquence d’images.

Médiane de cinq séries de 200 appels dans Node 24, avant/après l’index : sélection du réseau 0,351/0,058 ms, points communs 0,387/0,0084 ms, recherche « em » 39,613/0,612 ms, chronologie 0,311/0,122 ms. Les mesures détaillées sont conservées sous `.working/sprint/`.

La page initiale transférait 532 133 octets gzip pour 6 240 472 octets décodés. Avec l’intégration finale illustrée, elle transfère 614 003 octets pour 6 668 998 décodés, d’après Navigation Timing à 1440 × 1000. Le graphe est prêt en 494 ms contre 940 ms dans les navigations locales échantillonnées ; ce sont des observations uniques, pas une comparaison statistique. Le corpus complet reste envoyé au client et les métadonnées d’images augmentent ce payload. Aucun gain réseau ni résultat sur un appareil mobile réel n’est revendiqué.

### Captures et fichiers inspectés

Les cinq captures `.working/sprint/final-initial-desktop.png`, `final-initial-mobile.png`, `final-ena-dense.png`, `final-assas-dense.png` et `final-assas-mobile.png` ont été produites et inspectées après la recette complète. Viewports : 1440 × 1000, 390 × 844 et 1982 × 1103. La capture mobile inclut le défilement vertical de la fiche et des sources. Les mesures correspondantes sont dans `final-browser.json`.

Les captures des comparaisons, chemins, Parcours, notices, sauvegardes et crédits des images sont également conservées dans `.working/sprint/lot2a-*`, `lot2b-*`, `lot3-*`, `lot4-*`, `lot5a-*` et `images-portrait-*`. Les PNG exportés finaux ont été ouverts et inspectés : `lot5b-export-desktop.png`, 1 361 × 1 852 et 349 024 octets ; `lot5b-export-mobile.png`, 1 296 × 2 236 et 370 064 octets. Les captures et mesures locales sont ignorées par Git ; les tests qui produisent les preuves des comportements restent versionnés.

Les images proviennent d’associations publiques Wikidata/Commons, vérifiées par identifiant ; licences, auteur, attribution, source et empreinte du fichier sont conservés. Les fonctions génériques ne reçoivent pas d’illustration institutionnelle supposée. Sur 875 candidates, 63 ont été exclues par le contrôle de licence/attribution/statut et deux GIF n’ont pas été retenus. La reprise `--cached` n’a aucun accès réseau ; les deux fichiers non téléchargés y sont signalés absents du cache. Les images ont leur propre licence, distincte de CC0 pour les données Wikidata. La navigation sert exclusivement des fichiers locaux ; l’import reste facultatif.

Les chemins sont limités à trois résultats, quatre segments et 20 000 traversées de voisinage ; ils n’établissent pas que tout un chemin existait à une même date. Les noms denses nécessitent le zoom ou la sélection et restent intégralement disponibles dans Liste. Les PNG reproduisent le cadrage courant de l’explorateur, avec une limite explicite de 16 000 pixels de hauteur. Les sauvegardes sont propres au navigateur et à son origine. La couverture du corpus et des photos reste partielle ; les sources ne sont pas toutes vérifiées indépendamment. Les tests utilisent Chrome local, pas Firefox/Safari ni un téléphone physique. Tous les contrôles finaux demandés ont pu être exécutés. L’instance locale reste non indexable ; aucun domaine de production n’est configuré et rien n’a été publié.
