# Enrichissement des institutions — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Permettre de poursuivre l'exploration grâce aux participants des institutions, à leurs parcours et à des sources parlementaires et documentaires datées.

**Architecture:** Conserver les instantanés initiaux et ajouter des compléments versionnés. Découvrir des personnes par recherche inverse dans douze institutions, importer leurs déclarations Wikidata, puis rapprocher les identifiants des données de l'Assemblée nationale. Les dates insuffisantes sont consultables dans une section distincte sans modifier le sens de « Même période ».

**Tech Stack:** Next.js / React / TypeScript / Cytoscape ; scripts Node.js ; Vitest et Playwright ; corpus JSON autonome.

**Spec:** Proposition approuvée dans la conversation le 6 septembre 2026 : navigation avec dates inconnues, recherche des participants par institution, import parlementaire, enrichissement ciblé des entreprises et formations. Le présent document fixe les détails réversibles de cette première livraison.

## Contraintes

- Douze points d'entrée existants : Areva, Rothschild & Cie, NM Rothschild & Sons, Inspection générale des finances, French-American Foundation, Commission Attali, ENA, Sciences Po Paris, HEC Paris, École polytechnique, Paris-Nanterre, Paris-Panthéon-Assas.
- Sélection publique et non exhaustive : pour les grandes écoles/universités, parcours politiques français ; pour les organisations, profils publics reliés disposant d'une notice française. Plafond par institution documenté dans le manifeste d'import.
- Aucun appel réseau lors de l'exploration. Les imports s'exécutent séparément, conservent leur provenance et n'écrasent le résultat qu'après validation.
- Les 797 liens antérieurs restent préservés. Identifiants d'origine et correspondances explicites ; aucune fusion sur le seul nom.
- Ne déduire aucune date, présence contemporaine ou rencontre d'une donnée absente. Les compositions ponctuelles ne deviennent pas des durées continues.
- Périmètre local. Pas de push, déploiement, nouveau service hébergé ou compte externe.

## 1. Données et imports

**Fichiers :** `scripts/institutions.json`, `scripts/discover-institutions.mjs`, `scripts/import-wikidata.mjs`, `scripts/import-assembly.mjs`, `scripts/lib/assembly.mjs`, `src/data/network-wikidata.json`, `src/data/assembly.json`, `src/data/institution-participations.json`, `src/lib/dataset.ts`, tests d'import.

**Interfaces :** les compléments utilisent `GraphData`. Les liens officiels portent `evidence`, `role`, `start`/`end` ou `pointInTime`, et `cohort` seulement pour une composition effectivement documentée. Les identifiants parlementaires sont rapprochés des identifiants externes Wikidata ; les correspondances absentes sont signalées dans le rapport d'import.

- [x] Examiner les formats réels et sauvegarder les réponses brutes dans `.cache/`, ignoré par Git.
- [x] Tester la conversion parlementaire sur un extrait réel : conserver les dates au jour près, la référence de mandat et l'organe ; ne jamais fermer artificiellement une borne ouverte.

```js
expect(relation.start).toEqual({ value: mandate.mandature?.datePriseFonction ?? mandate.dateDebut, precision: 11 });
expect(relation.end).toBeUndefined(); // mandat dont la source n'indique aucune fin
expect(relation.evidence.locator).toContain(mandate.uid);
```

- [x] Implémenter une recherche inverse bornée et reproductible ; conserver la requête, les candidats et les limites dans un manifeste.
- [x] Importer les parcours des personnes retenues et les mandats parlementaires rapprochés par identifiant.
- [x] Ajouter des participations ciblées vérifiées dans les documents officiels d'entreprises et de formations, avec page/article et date de consultation.
- [x] Fusionner les compléments sans remplacer les déclarations initiales ; mesurer nouveaux participants, connexions et couverture temporelle par institution.

## 2. Continuité de l'exploration

**Fichiers :** `src/lib/graph.ts`, `src/components/PeriodControls.tsx`, `src/components/Explorer.tsx`, `src/components/DetailPanel.tsx`, `src/app/globals.css`, tests du domaine et tests navigateur.

**Interfaces :** une fonction de domaine retourne les voisins dont les relations avec le centre sont `unknown` ou `possible` selon `comparePeriods`. Elle exclut les personnes déjà présentes sur la période et les relations assurément extérieures. La section dépliable affiche le lien, sa date disponible et sa preuve ; les actions de sélection et d'exploration réutilisent le parcours existant. Une action « Explorer toute sa carrière » remet `temporal: 'all'` et `period: null` pour la personnalité sélectionnée.

- [x] Écrire et observer les échecs des tests : voisin non daté accessible, voisin extérieur exclu, catégories respectées, aucune fausse présence dans le graphe strict.

```ts
expect(getVisibleGraph(data, strictView).relations).not.toContain(undated);
expect(getUncertainConnections(data, strictView).map(item => item.entity.id)).toContain(undated.source);
expect(getUncertainConnections(data, strictView).map(item => item.entity.id)).not.toContain(outside.source);
```

- [x] Ajouter la section « Autres personnes liées — dates insuffisantes », les preuves et l'accès explicite à la carrière complète.
- [x] Préserver partage, retour navigateur, catégories, transitions, liste et comparaison. Ajuster l'espace du canvas si le panneau de continuation grandit ; limiter la hauteur de la liste de suggestions et garder toutes les entrées consultables.

## 3. Validation et livraison

**Fichiers :** tests de corpus/continuité, `tests/enrichment.spec.ts`, `README.md`, `docs/sources.md`, `docs/verification.md`.

- [x] Tester les invariants des jeux fusionnés et documenter le nombre de voisins avant/après pour les douze institutions.
- [x] Vérifier Areva depuis la période d'Édouard Philippe, les écoles, les mandats parlementaires, les liens non datés, la sortie vers une carrière complète et la restauration d'URL.
- [x] Exécuter `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, puis les parcours Playwright sur le build servi.
- [x] Inspecter les captures ordinateur et mobile, y compris un réseau plus dense ; corriger les défauts observés.
- [x] Actualiser la provenance, les limites et les preuves. Reconstruire et relancer l’aperçu local. Le commit de checkpoint suit les contrôles terminés.

## Décisions prises pendant l’implémentation

- Suggestion utilisateur intégrée : Integrity Watch France comme distributeur des déclarations HATVP. Premier lot de 17 activités pour 11 personnes, après contrôle des identifiants P4703 et des documents originaux ; 175 intitulés d’organismes restent à rapprocher. Aucun rattachement approximatif par nom.
- Le format réel de l’Assemblée comporte une date personnelle de prise de fonction distincte du début de législature. Le test de remplacement d’Édouard Philippe impose le 23 mars 2012. Deux mandats incohérents d’Olivier Becht sont écartés avec leur motif.
- Les compositions ponctuelles ajoutent les participations au directoire d’Areva attestées au 31 décembre 2009 et quatre noms de la sortie de l’ENA de 2004, sans inventer de durée individuelle.
- Le volume obtenu demande des pages de 12 voisins au-delà de 24 voisins supplémentaires. Le parcours est conservé sur chaque page ; la liste reste intégrale. L’URL et la sélection mémorisent la page.
- L’inspection mobile a conduit à adapter la hauteur du canvas et le recentrage aux libellés. Les longs noms d’organes parlementaires emploient leur abréviation officielle dans le graphe ; les fiches gardent le nom complet.
- Résultat : 492 personnes, 2 394 entités et 7 568 déclarations ; 51 tests unitaires et 35 parcours navigateur réussis. Après la dernière correction de libellés : nouveau build, tests unitaires et 8 parcours ciblés réussis. Détails dans docs/verification.md.
