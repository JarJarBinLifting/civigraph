# Civigraph — thème bleu moderne

Date : 7 septembre 2026. Périmètre : intégration locale de la direction 1 affinée et approuvée, dans le produit existant.

## Référence et preuves

- Source visuelle : `C:/Users/Asol/.codex/generated_images/01a07b40-e167-7c61-b231-d299b8643667/exec-debd8b25-8bd5-4983-bc0d-7f86f641fb99.png` (1487 × 1058 px).
- Application : `http://127.0.0.1:4300/`, réseau Emmanuel Macron, toutes les périodes, année repère 2026, 17 entités et 19 liens, fiche fermée.
- Capture finale de production après correction du cadrage et de la légende : `.working/blue-theme/desktop-final.png` (1440 × 1024 px).
- Comparaison réunissant référence et capture : `.working/blue-theme/comparison-final.png`.
- Comparaisons détaillées : `.working/blue-theme/compare-typography.png` et `.working/blue-theme/compare-graph.png`.
- Autres états : `.working/blue-theme/desktop-initial.png`, `desktop-refined.png`, `comparison.png`, `mobile.png` et `mobile-full.png`.
- Ces preuves sont locales, dans le répertoire de travail ignoré par Git.

Viewport bureau demandé : 1440 × 1024 CSS px. Le navigateur rapporte 1440 × 1025 avec sa densité fractionnaire. La capture du navigateur intégré contient une zone peinte de 1263 × 898 px et une marge blanche technique. Une copie recadrée et ramenée à 1440 × 1024 sert à la comparaison ; la capture originale est conservée. La référence est ramenée à la même taille. Le script `.working/blue-theme/compare.py` documente cette normalisation. Les différences d’anticrénelage ne sont pas interprétées comme des différences de police.

## Comparaison et corrections

1. **[P2, corrigé et recapturé] Typographie du graphe.** Le mode compact s’activait sur un graphe large mais peu haut, tronquant des noms visibles en entier dans la référence. Le mode compact dépend maintenant de la largeur ; la largeur de texte disponible augmente sur bureau. La mesure et le rendu utilisent DM Sans et attendent le chargement de la police. La comparaison détaillée confirme la lecture des noms longs.
2. **[P2, corrigé et vérifié dans le navigateur] Graisse des étiquettes.** Cytoscape rejetait une graisse intermédiaire de 650. La mesure et le rendu partagent désormais 600 pour les étiquettes prioritaires et 500 pour les autres. Les journaux de la version compilée ne contiennent plus cet avertissement.
3. **[P2, corrigé et recapturé] Graphe trop aplati sur écran large.** La comparaison complète montrait des secteurs plus étirés horizontalement que la référence. Le facteur horizontal des petits réseaux est plafonné à 1,8. Un essai à 1,5 créait une collision dans le test de viewport 1376 × 448 ; le réglage retenu passe les tests de séparation. La comparaison finale montre un réseau moins étiré. Les différences de géométrie liées aux données temporelles réelles sont attendues.
4. **[P2, corrigé et recapturé] Légende des affiliations.** Le titre de secteur se trouvait entre les nœuds orange. Son ancrage et celui de la mention des dates inconnues passent sous la zone des affiliations. Les captures finales bureau et mobile confirment la séparation des textes et des symboles.

## Surfaces de fidélité

- **Polices et hiérarchie :** Manrope pour les titres, DM Sans pour l’interface et les étiquettes. Titre principal sans empattements, graisse modérée, texte secondaire moins dominant. Les noms du graphe utilisent les mêmes métriques au placement et à l’affichage. Les captures détaillées vérifient la hiérarchie et les retours à la ligne.
- **Espacement et composition :** en-tête bleu nuit, barre de recherche aérée, surface blanche sans carte englobante, commandes discrètes et chronologie séparée. Le cadrage dynamique respecte les positions temporelles réelles ; il ne reprend pas les coordonnées fictives de la maquette. La comparaison finale confirme le cadrage corrigé et la légende dégagée. Aucun P0/P1/P2 visuel restant identifié dans les états vérifiés.
- **Couleurs :** bleu principal `#083577`, encre `#102a50`, en-tête `#062653`, fond blanc, accents français bleu `#1747a6` et rouge `#ed3345`. Les couleurs de catégories restent distinctes pour conserver leur sens. Fiches, comparaison, pages documentaires, export PNG et favicon reprennent la palette.
- **Images et icônes :** symboles de graphe existants conservés ; icône de marque Waypoints issue de Lucide. Aucun contenu illustratif fictif ajouté. Les formes et les couleurs continuent de distinguer les types d’entités. La silhouette de marque est une correspondance de bibliothèque, pas une reproduction exacte du dessin généré.
- **Texte et données :** relations, dates et sources conservées. Les avertissements sur les limites des liens restent visibles. Les mentions « Maquette » du visuel ne sont pas ajoutées au produit. Les libellés de réseau et de source proviennent des données réelles.

## Vérification fonctionnelle

- Bureau : ouverture de fiche, filtres, retour au réseau complet, fermeture des filtres avec Échap et restitution du focus.
- Comparaison Macron / Attali : graphe affiché, 4 entités communes et 12 déclarations.
- Mobile : viewport demandé 390 × 844, pas de débordement horizontal observé ; filtres et vue Liste utilisables ; 19 relations affichées.
- Export PNG depuis la version compilée : confirmation de succès affichée.
- Zoom et recentrage : commandes exécutées dans le navigateur sans erreur.
- Dernière version de production : arbre accessible présent, réseau 17/19 et titre correct ; aucun journal d’erreur observé. Avertissement préexistant de Cytoscape sur la sensibilité de la molette toujours présent.
- `npm test` : 21 fichiers, 91 tests réussis après le dernier ajustement.
- `npm run build` : réussi après le dernier ajustement et le favicon.
- `npm run lint` : réussi.
- `git diff --check` : aucune erreur de whitespace ; avertissements locaux de conversion LF/CRLF.

## Limites et suite

Les vues denses et mobiles peuvent abréger ou masquer des étiquettes selon le placement anti-collision existant ; les noms complets restent accessibles dans la fiche et la liste. Tous les états possibles et tous les parcours de l’application n’ont pas fait l’objet d’un test navigateur exhaustif. Aucun push ni déploiement effectué.

La capture a temporairement échoué avec « Unable to capture screenshot ». Après remise au premier plan et actualisation du rendu, les captures finales ont réussi. La comparaison complète et les deux comparaisons détaillées ont été régénérées et inspectées ensemble avec la référence. La capture mobile finale est `.working/blue-theme/mobile-final.png`. Le contrôle mobile final mesure 390 CSS px de largeur et 390 px de largeur de document ; aucun débordement horizontal ni journal d’erreur observé.

## Checklist finale

- [x] Intégrer la palette, la typographie et les styles du graphe.
- [x] Vérifier les interactions principales sur bureau et mobile.
- [x] Compiler et tester la dernière version.
- [x] Recapturer le cadrage et la légende finaux puis comparer à nouveau la référence.

final result: passed
