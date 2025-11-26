# SOMMAIRE-PROJET / PROJECT OVERVIEW

Document de référence rapide pour tout nouvel intervenant. English notes are provided under each bullet when helpful.

## 1. Vue d'ensemble / Overview & URLs
- Résidence privée pour aînés (RPA) à Boischatel, QC. Mission : sécurité augmentée et assistance IA pour les résidents et le personnel.
- URLs publiques :
  - Production Cloudflare Pages : https://auberge-boischatel.pages.dev/
  - Domaine personnalisé : https://aubergeboischatel.com/
  - Dashboards (aperçu statique visible sans connexion) :
    - Client : `/client/dashboard`
    - Employé : `/staff/dashboard`
- Latest updates focus on the homepage hero, 3D logo + immersive viewer, and pre-login dashboard previews.

## 2. Stack technique / Tech Stack
- Front & serverless renderer : Hono + Vite (TypeScript).
- Hosting : Cloudflare Pages/Workers; `dist/_worker.js` is the SSR bundle.
- Auth & data : Firebase Auth (client) + Supabase PostgreSQL (via REST in `src/routes`).
- 3D : Three.js viewer (`public/static/3d-viewer.js`) loading GLB/GLTF, fullscreen support.
- Styling : Tailwind-like utilities for dashboards; landing page uses handcrafted CSS + inline styles.

## 3. Configuration / Env
- Variables injectées via Vite (`import.meta.env`) et Wrangler. Voir `wrangler.jsonc` et `GUIDE-CONFIGURATION-PRODUCTION.md` pour la liste complète (Firebase, Supabase, secrets API).
- Local : `npm run dev` (Vite) ou `npx wrangler pages dev ./dist --compatibility-date=2023-12-01` après build.
- Toujours ajouter les secrets via l’interface Cloudflare/Wrangler (pas d’env en clair dans le repo).

## 4. Déploiement / Deployment
- Build : `npm install` puis `npm run build` (génère `dist/_worker.js`).
- Preview local Pages : `npm run build && npx wrangler pages dev ./dist`.
- Problèmes connus : le build échoue si `npm install` n’a pas été exécuté (vite absent). Some features rely on WebGL; fallbacks exist.

## 5. Fonctionnalités clés / Features
- Landing page riche : hero sécurité/IA avec logo 3D GLB (fallback statique), CTA vers plan 3D et alertes.
- Section “Visite 3D” pleine largeur avec bouton Plein écran + message de secours si WebGL indisponible.
- Dashboards Client/Employé : aperçu statique (hero + cartes) en pré-login; contenu dynamique via Firebase une fois authentifié.
- API REST Hono : auth, résidents, documents, logs, users, dbTest, contact.

## 6. Modifications récentes / Recent Changes
- Hero modernisé avec logo 3D animé et double CTA.
- Viewer 3D étendu (plein écran, full-width, fallback WebGL).
- Aperçus statiques ajoutés aux dashboards client et employé + liens directs dans la navigation et le README.
- Documentation enrichie (install, liens publics, changelog quotidien).

## 7. Tâches futures / Backlog
- Approfondir les interactions 3D (hotspots, mesures guidées, modal plein écran dédié si besoin).
- Ajouter des tests automatiques (unitaires/integ) et un workflow CI (ESLint/Prettier + `npm run build`).
- Harmoniser le design des dashboards avec la charte (glassmorphism + cartes cohérentes) et mutualiser les styles.
- Durcir la sécurité API (rate limiting, logs structurés, masking PII) et compléter la doc OpenAPI.

## 8. Commandes utiles / Useful Commands
- Dev : `npm run dev`
- Build : `npm run build`
- Lint (à ajouter) : `npm run lint` quand ESLint sera configuré.
- Wrangler preview : `npx wrangler pages dev ./dist`
- Conversion 3D (existant) : scripts dans `public/static/` pour charger GLB/GLTF.

## 9. Architecture rapide / File Map
- `src/index.tsx` : entrée Hono + markup complet de la landing et des dashboards statiques.
- `src/routes/*.ts` : API REST (auth, residents, documents, logs, users, dbTest).
- `public/static/3d-viewer.js` : viewer Three.js, auto-rotation, glow, resize, fullscreen helper.
- `public/static/models/logo-3d.glb` : logo 3D.
- `public/static/client-dashboard.js` / `staff-dashboard.js` : rendu dynamique des dashboards après login.

## 10. Notes pour agents IA / Tips for AI Contributors
- Pas de Next.js : c’est Hono + Vite; ne pas ajouter de frameworks lourds inutilement.
- Éviter les pages vides : conserver l’aperçu statique des dashboards si les scripts/auth ne chargent pas.
- Ne pas exposer de secrets; utiliser les variables d’environnement Cloudflare/Firebase/Supabase.
- Garder les textes en français par défaut; ajouter l’anglais en complément si nécessaire.
- Respecter les CTAs existants et le flux fullscreen du viewer 3D; privilégier la cohérence des styles.
