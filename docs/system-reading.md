# Lecture du système — livraison locale du 7 septembre 2026

## Comportement actuel

La perspective Système s’ouvre sur **Ensemble → Groupes**, avec le réseau complet : 2 394 entités, 5 599 connexions et 7 568 déclarations dans le corpus livré. Aucune limite de douze institutions n’est appliquée à cette carte. Les petits établissements et les parcours entre plusieurs institutions restent présents ; leur emplacement graphique ne constitue pas une preuve de proximité personnelle.

- Six périmètres sont disponibles : Ensemble, Politique, Formation, Professionnel, Organisations et Fonctions publiques. Ils s’intersectent avec les catégories et les filtres temporels existants. Formation contient 735 entités et 1 084 connexions sans filtre supplémentaire.
- **Groupes / Individus** change la lecture de la même scène sans déplacer les nœuds ni modifier le cadrage. Les institutions constituent les repères du placement ; une personne reliée à plusieurs institutions reste représentée une seule fois, entre ses repères. Le survol et le clic simple conservent le reste du réseau visible. Seul le double-clic sur un nœud active son focus et atténue les autres parcours ; un clic dans le fond ou une nouvelle sélection simple l’annule. L’isolation masque temporairement le reste sans déplacer les nœuds et restaure exactement la caméra précédente à sa fermeture.
- La recherche, le zoom, le retour au cadrage précédent, la miniature et la carte agrandie sont conservés. Les positions et caméras sont mémorisées par système pendant la session. Les paramètres de système, lecture, sélection, groupe, seuil, matrice, institution et connexion sont restaurés depuis l’URL ; les caméras ne sont pas enregistrées dans le lien partagé.
- La couleur d’une personne représente ses affiliations politiques documentées. Les affiliations multiples restent visibles en secteurs ; le gris signifie qu’aucune affiliation n’est documentée dans l’index. Les couleurs servent d’identifiants, sans échelle idéologique ni prétention à reproduire les couleurs officielles. La légende complète est consultable et recherchable. Une affiliation historique n’est pas présentée comme actuelle.
- Une fiche d’école ou d’organisation présente les personnes, leurs affiliations, les dates et les déclarations sourcées. La recherche et la pagination donnent accès à tous les participants. La comparaison distingue **même institution**, **chevauchement daté** et **même promotion explicitement documentée**. Une liste de membres ou des dates communes ne suffisent pas à établir une promotion ou une rencontre.
- **Points communs** et **Index des institutions** restent des outils secondaires. Les intersections comptent des personnes distinctes tout en conservant leurs déclarations. Le groupe peut être comparé selon « À au moins deux » ou « À tout le groupe », avec carte ou matrice et ouverture des sources. Les limites de pagination de ces outils ne limitent pas la carte principale.

## Contrats et limites des données

`src/lib/system-reading.ts` porte les systèmes, l’index politique, le placement complet et les distinctions de preuve. `src/lib/system-analysis.ts` conserve les agrégations institutionnelles. `SystemExplorer` coordonne la scène et les outils secondaires ; `SystemGraphCanvas` gère le rendu et les caméras ; `SystemEvidence` et `PoliticalLegend` exposent les preuves et couleurs. Les exports reprennent le périmètre et la légende politiques.

Les relations et déclarations du corpus sont conservées ; aucune relation de rencontre, d’influence ou de proximité politique n’est ajoutée à partir du placement. Les dates inconnues restent inconnues. Les couleurs politiques résument des affiliations documentées, dont certaines historiques ; les sources détaillées permettent de les interpréter.

La catégorie source `office`, affichée sous « Fonctions publiques », contient aussi certaines responsabilités professionnelles. Le schéma ne permet pas de séparer systématiquement public et privé : cette limite est signalée dans l’interface. « Professionnel » correspond aux relations d’emploi explicitement classées `employment`.

## Vérification effective

- `npm test -- --maxWorkers=2` : **26 fichiers, 118 tests réussis**. Un premier passage exécuté pendant le build avait dépassé le délai du test des images ; la relance seule passe intégralement.
- `npm run lint` : réussi. `npm run build` : réussi, compilation TypeScript et génération des pages comprises.
- `git diff --check` : réussi.
- Vérifications dans le navigateur intégré : réseau complet et six systèmes ; stabilité des positions et du cadrage entre Groupes et Individus ; fiche ENA avec 120 personnes et 64 affiliations ; comparaison Macron / Fekl sans même promotion documentée ; comparaison Macron / Sébastien Proto avec Promotion Senghor et lien officiel Légifrance ; période 2002–2004 puis retour à toutes les périodes ; zoom et retour ; isolation et restauration exacte de la caméra ; filtres vides puis restauration.
- Groupe Macron, Attali, Fekl : six institutions communes à au moins deux, trois à tous ; matrice avec ouverture des preuves ; rechargement de l’URL conservant groupe, seuil et matrice.
- Inspection desktop, carte agrandie et mobile à **390 × 844** : carte et recherche utilisables, matrice défilant dans sa propre zone, aucun débordement horizontal de la page. L’override de viewport a été retiré après vérification. Le dernier chargement du réseau complet ne présente pas d’erreur JavaScript observée.

Les scénarios `tests/system-network.spec.ts` et `tests/system-reading.spec.ts` documentent les régressions navigateur. **La suite Playwright CLI n’a pas été exécutée** ; les parcours ci-dessus ont été réalisés avec CUA. Aucun audit exhaustif lecteur d’écran ou WCAG n’est revendiqué.

## Livraison

Après l’ajustement du focus par double-clic : lint et vérification TypeScript réussis. Vérification navigateur sur Inspection générale des finances, système Professionnel : clic simple avec les nœuds et noms autour visibles ; double-clic activant l’atténuation ; clic dans le fond rétablissant la carte.

Choisir un résultat dans la recherche principale ou celle de la carte agrandie active aussi ce focus, y compris après avoir effacé puis recherché la même entité. Vérifié avec Renaissance par clic et Emmanuel Macron par Entrée, puis clic simple sur le nœud rétablissant le contexte. Lint et TypeScript réussis après cet ajout.

Release locale autorisée et vérifiée le 7 septembre 2026 : [http://127.0.0.1:4300/](http://127.0.0.1:4300/), build de production `2c_tGegkiaWca8rxxTwA0`, servi avec `npm run start` depuis le worktree `af21/Politigraph`. Le port 4300 était libre avant le démarrage. Le réseau initial complet et le focus par recherche ont été vérifiés sur ce build. La suite finale passe à 118 tests ; compilation TypeScript, build et lint réussis.

La publication Git demandée cible `origin/main` du dépôt `JarJarBinLifting/civigraph`. Le checkout d’origine, ses changements non commitées et les fichiers de consignes générés sont préservés hors du commit. Aucun corpus ni document source n’a été modifié, aucun hébergement externe n’est déployé. La prévisualisation de développement reste disponible sur [4311](http://127.0.0.1:4311/).

Le plan initial `docs/superpowers/plans/2026-09-07-system-reading.md` décrit l’étape précédente centrée sur un index institutionnel. Le présent comportement remplace son ouverture sur une carte limitée ; voir le plan de réalisation `2026-09-07-global-system-map.md`.
