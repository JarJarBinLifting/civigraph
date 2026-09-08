# SEO de Civigraph

## Politique publiée le 8 septembre 2026

- Domaine canonique : `https://civigraph.org`.
- L’accueil sans paramètres est indexable, avec un titre descriptif, une meta description, une URL canonique, des métadonnées Open Graph et un objet JSON-LD `WebSite`.
- Les notices documentaires et la méthode restent indexables selon les critères du corpus. Les descriptions des notices précisent le nom, les informations disponibles et la présence de sources.
- Toute URL d’exploration avec paramètres reste en `noindex, follow`, sans canonique concurrente.
- Les ressources de rendu sont accessibles aux robots. Les pages inconnues renvoient HTTP 404.
- Le sitemap ne contient que des URL canoniques sans paramètres, uniques : 1 911 à cette livraison. Il est déclaré dans `robots.txt`.
- Aucun classement, lien personnel ou statut officiel n’est ajouté aux données structurées.

## Moteurs de recherche

La propriété Google Search Console `sc-domain:civigraph.org` a été validée par un TXT DNS. La propriété Bing `https://civigraph.org/` a été validée par un CNAME DNS en mode DNS uniquement. Conserver ces enregistrements, qui sont indépendants du déploiement Worker.

Le sitemap `https://civigraph.org/sitemap.xml` a été soumis aux deux moteurs le 8 septembre 2026. Google confirme « Traitement du sitemap réussi » et 1 911 pages découvertes. Bing confirme « Success », environ 1,9 k URL découvertes, zéro erreur et zéro avertissement. Son premier état « Processing » et le premier message transitoire de récupération côté Google ont été remplacés par ces résultats réussis.

La soumission et la découverte ne signifient pas que les URL sont déjà indexées. Les moteurs décident du crawl et de l’indexation ; aucune garantie de délai ou de classement n’est donnée.

## Validation

- 162 tests passent ; compilation Next.js et OpenNext réussie ; vérification TypeScript de la compilation réussie.
- Lint sans erreur ; avertissement du point d’entrée de redirection corrigé puis fichier revérifié.
- `node scripts/verify-seo.mjs` passe sur le runtime Cloudflare local et sur le site public : quatre pages indexables, trois vues paramétrées exclues, JSON-LD du site, robots, 404 et sitemap.
- L’accueil publié a été contrôlé visuellement : carte affichée et nouveau titre SEO présent. Ce contrôle ne constitue pas un audit mobile complet.
- Version Worker publiée : `bd5f5187-5a57-4c8c-8702-1ea877ebc042`.

## Redirection préparée, non activée

`cloudflare/worker.mjs` prépare des redirections HTTP et www vers HTTPS sans www, avec conservation du chemin et des paramètres. Le point d’entrée actif reste `.open-next/worker.js` et la seule route configurée est `civigraph.org`. L’ajout de `www.civigraph.org` attend l’autorisation explicite demandée par la vérification automatique des autorisations. Trois variantes de redirection et le passage direct du domaine canonique et de localhost ont été testés isolément.

Références : [sitemaps Google](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [consignes noindex](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) et [sitemaps Bing](https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed).
