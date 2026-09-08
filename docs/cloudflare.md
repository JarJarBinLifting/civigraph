# Déployer Civigraph sur Cloudflare

Le Worker `civigraph` sert `https://civigraph.org` avec l’adaptateur OpenNext. Le compte et le domaine personnalisé sont définis dans `wrangler.jsonc`. Les pages dynamiques et les paramètres de la carte sont conservés.

## Construire et vérifier (PowerShell)

```powershell
npm ci
npm test
npm run lint
$env:CIVIGRAPH_SITE_URL='https://civigraph.org'
$env:CIVIGRAPH_INDEXING='true'
Remove-Item Env:CIVIGRAPH_BUILD_DIR -ErrorAction SilentlyContinue
npm run build:cloudflare
npx wrangler deploy --dry-run
npm run preview:cloudflare -- --port 8787
```

OpenNext exige le répertoire de compilation standard `.next`. Le serveur de développement Next.js 16 utilise `.next/dev`. Les fichiers `.open-next` et `.wrangler` sont ignorés par Git et les outils de validation du code source.

## Publier une version vérifiée

Après autorisation de publication, depuis un terminal authentifié avec Wrangler :

```powershell
npm run deploy:cloudflare
```

Cette commande publie le dernier artefact `.open-next` : reconstruire après toute modification. Elle raccorde aussi le domaine personnalisé défini dans la configuration. Aucun push Git n’est nécessaire pour cette publication directe.

Vérifier ensuite l’accueil, une URL de carte avec paramètres, `/entite/Q3052772`, `/methode`, `/robots.txt`, `/sitemap.xml` et une véritable 404. Contrôler aussi la navigation et le rendu dans un navigateur.

L’indexation de production inclut l’accueil sans paramètres, les notices documentaires éligibles et la méthode ; les états de carte avec paramètres restent en `noindex`. Aucune soumission à un moteur de recherche n’est effectuée automatiquement par le déploiement. Le développement via `npm run dev` reste non indexable. `node scripts/verify-seo.mjs https://civigraph.org` vérifie le HTML, les robots et le sitemap de production.

Documentation : [Next.js sur Cloudflare](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) et [OpenNext](https://opennext.js.org/cloudflare/get-started).

## Livraison du 8 septembre 2026

- Version Worker : `8e1295e9-9636-4f12-96f7-7ce6c8bc20a3`.
- Base Git : `fcbc7352119564e828cd0555bf4021a8eb978b8f`, avec la configuration Cloudflare locale ajoutée pour cette publication directe.
- Validation : 160 tests, lint, TypeScript, compilation OpenNext et simulation de déploiement réussis.
- Production : accueil, notice, méthode, robots et sitemap en HTTP 200 ; identifiant inconnu en HTTP 404. Canonicals vérifiées sur `civigraph.org`.
- Navigateur : carte globale visible, restauration du lien centré sur Sciences Po Paris et ouverture de sa notice vérifiées ; aucune erreur console relevée dans ce parcours. Pas d’audit mobile complet lors de ce déploiement.
- Parité vérifiée sur le fichier JavaScript `/_next/static/chunks/3450qyhportkm.js` : SHA-256 `6f7927041946fafd1fabaaa08dc3bc1deab43dbcadc09584ba7f578ca097e745`, identique entre artefact local et réponse publique.
- Domaine raccordé : `civigraph.org`. `www.civigraph.org` n’est pas configuré par cette livraison.
