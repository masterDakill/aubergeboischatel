# Sommaire du Projet - L'Auberge Boischatel

> Document de référence pour la continuité du développement avec d'autres agents IA (OpenAI Codex, Claude, etc.)

**Dernière mise à jour** : 2025-11-26
**Auteur** : Claude Code (Anthropic)

---

## 1. Vue d'ensemble du projet

### Description
Site web vitrine pour **L'Auberge Boischatel**, une résidence pour personnes âgées située à Boischatel, Québec.

### URLs
- **Production** : https://auberge-boischatel-3o0.pages.dev
- **GitHub** : https://github.com/masterDakill/aubergeboischatel
- **Domaine personnalisé** : Configuré via GoDaddy (à lier à Cloudflare)

---

## 2. Stack Technique

| Composant | Technologie |
|-----------|-------------|
| **Framework** | Hono.js (server-side rendering) |
| **Build** | Vite 6.4 |
| **Hébergement** | Cloudflare Pages (Workers) |
| **Base de données** | Supabase PostgreSQL |
| **Authentification** | Firebase Authentication |
| **3D Viewer** | Three.js + GLTFLoader |
| **Langage** | TypeScript |

### Fichiers clés
```
aubergeboischatel/
├── src/
│   └── index.tsx          # Page principale (HTML + CSS + JS inline)
├── public/
│   └── static/
│       ├── 3d-viewer.js   # Composant Advanced3DViewer (Three.js)
│       └── models/
│           └── auberge-3d.glb  # Modèle 3D Polycam (10MB, avec textures)
├── dist/                   # Build output (Cloudflare Workers)
├── vite.config.ts          # Configuration Vite + env vars
├── .env                    # Variables d'environnement (NE PAS COMMIT)
└── wrangler.toml           # Configuration Cloudflare
```

---

## 3. Configuration Environnement

### Variables d'environnement (.env)
```bash
# Supabase (PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.bysfzdegeokdnzerwuvp.supabase.co:5432/postgres
SUPABASE_URL=https://bysfzdegeokdnzerwuvp.supabase.co

# Firebase Authentication
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDtwLAkFjBViJKsyrlbDlS9wESGSxish3o
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=aubergewebsite.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aubergewebsite
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=aubergewebsite.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=882019826712
NEXT_PUBLIC_FIREBASE_APP_ID=1:882019826712:web:b92d67d9e54e5ba422176d
```

### Injection des variables (vite.config.ts)
Les variables Firebase sont injectées au build via `loadEnv` et `define` dans Vite :
```typescript
define: {
  'process.env.NEXT_PUBLIC_FIREBASE_API_KEY': JSON.stringify(env.NEXT_PUBLIC_FIREBASE_API_KEY),
  // ... autres variables
}
```

---

## 4. Déploiement

### Méthode actuelle : Wrangler CLI
```bash
npm run build
npx wrangler pages deploy dist --project-name=auberge-boischatel
```

### Problème connu
- Le projet Cloudflare `aubergewebsite` (connecté à GitHub) a un **build token cassé**
- Les déploiements automatiques via GitHub ne fonctionnent pas
- **Solution temporaire** : Déployer manuellement avec Wrangler
- **Solution future** : Supprimer `aubergewebsite`, connecter GitHub à `auberge-boischatel`

---

## 5. Fonctionnalités du Site

### Sections de la page
1. **Hero** - Image de fond avec titre et CTA
2. **Services** - Grille de services offerts
3. **Chambres** - Types de chambres disponibles
4. **Repas** - Information sur la cuisine
5. **Visite 3D** - Viewer Three.js avec modèle Polycam (pleine largeur)
6. **Témoignages** - Avis des résidents
7. **Contact** - Coordonnées et carte Google Maps
8. **Annuaire téléphonique** - Cartes des postes internes (section #phone-diagram)

### Viewer 3D (Advanced3DViewer)
- **Fichier** : `public/static/3d-viewer.js`
- **Modèle** : `public/static/models/auberge-3d.glb`
- **Fonctionnalités** :
  - Auto-rotation
  - Contrôles orbitaux (drag pour tourner, scroll pour zoom)
  - Mode plein écran
  - Chargement avec indicateur de progression

#### Initialisation actuelle (src/index.tsx:3558)
```javascript
const viewer = new Advanced3DViewer('advanced-3d-viewer', '/static/models/auberge-3d.glb', {
    autoRotate: true,
    autoRotateSpeed: 1.5,
    cameraControls: true,
    glow: false,  // Désactivé pour afficher les textures Polycam
    backgroundColor: 0x1a1a1a
});
```

---

## 6. Modifications Récentes (Session 2025-11-26)

### Corrections effectuées

| Modification | Description |
|--------------|-------------|
| **Firebase config** | Variables d'environnement injectées via Vite `define` |
| **Three.js CDN** | Changé de cdnjs vers unpkg (cdnjs ne chargeait pas) |
| **Textures 3D** | Désactivé `glow: true` qui écrasait les textures du modèle |
| **Layout téléphone** | Cartes téléphoniques déplacées sous Contact (section #phone-diagram) |
| **Bouton lien** | "Voir les postes internes" lie maintenant à #phone-diagram |
| **Viewer 3D** | Remplacé iframe Polycam par viewer Three.js pleine largeur |

### Commits récents
```
3486774 fix: Désactiver effet glow pour afficher les textures Polycam
9bf8c2c docs: Session summary pour prochain agent
4f50991 feat: Polycam pleine largeur + Mode Plein Écran + Anti-redirect
25a7d05 refactor: Fusion modèle 3D dans section Polycam avec fond noir
```

---

## 7. Tâches Futures (Backlog)

### Priorité haute
- [ ] Connecter le domaine GoDaddy à Cloudflare Pages
- [ ] Résoudre le problème de build token Cloudflare pour déploiements automatiques
- [ ] Implémenter l'authentification Firebase (login admin)

### Fonctionnalités 3D demandées
- [ ] **Mode Wireframe/Plan** : Toggle entre textures et wireframe
- [ ] **Clipping par étage** : Couper le modèle à différentes hauteurs pour simuler les étages
- [ ] **Mode LIDAR** : Nécessiterait un export PLY de Polycam (fichier volumineux)

### Améliorations
- [ ] Optimiser le modèle 3D (actuellement 10MB)
- [ ] Ajouter lazy loading pour le viewer 3D
- [ ] Formulaire de contact fonctionnel
- [ ] Système de réservation de visites

---

## 8. Commandes Utiles

```bash
# Installation
npm install

# Développement local
npm run dev

# Build production
npm run build

# Déploiement Cloudflare
npx wrangler pages deploy dist --project-name=auberge-boischatel

# Conversion OBJ vers GLB (pour nouveaux modèles Polycam)
npx obj2gltf -i model.obj -o model.glb
```

---

## 9. Architecture du Code (src/index.tsx)

Le fichier principal est un **monolithe** avec HTML, CSS et JS inline :

```
Lignes 1-50      : Imports et configuration Hono
Lignes 50-500    : CSS (variables, animations, responsive)
Lignes 500-3000  : HTML (sections du site)
Lignes 3000-3200 : Scripts CDN (Three.js, Firebase, FontAwesome)
Lignes 3200-3700 : JavaScript (viewer 3D, plein écran, navigation)
```

### Points d'attention
- Le CSS utilise des **CSS Variables** pour les couleurs (`--copper`, `--dark-teal`, etc.)
- Le JavaScript est dans une balise `<script>` à la fin du body
- Three.js est chargé via CDN unpkg (pas npm)

---

## 10. Contacts et Ressources

- **Firebase Console** : https://console.firebase.google.com/project/aubergewebsite
- **Supabase Dashboard** : https://supabase.com/dashboard/project/bysfzdegeokdnzerwuvp
- **Cloudflare Dashboard** : https://dash.cloudflare.com (projet: auberge-boischatel-3o0)
- **Polycam** : Scans 3D du bâtiment

---

## 11. Notes pour Agents IA

### Contexte important
1. Le site est une **SPA server-side rendered** avec Hono.js
2. Tout le HTML/CSS/JS est dans `src/index.tsx` (pas de composants React séparés)
3. Les assets statiques vont dans `public/static/`
4. Le build génère `dist/_worker.js` pour Cloudflare Workers

### Pièges à éviter
- Ne pas utiliser `process.env` côté client sans `define` dans Vite
- Le modèle 3D doit avoir `glow: false` pour afficher ses textures
- Three.js doit être chargé depuis unpkg, pas cdnjs
- Les déploiements GitHub automatiques sont cassés, utiliser Wrangler

### Pour continuer le développement
1. Lire ce fichier en premier
2. Lire `src/index.tsx` pour comprendre la structure
3. Lire `public/static/3d-viewer.js` pour le composant 3D
4. Tester localement avec `npm run dev`
5. Déployer avec `npx wrangler pages deploy dist --project-name=auberge-boischatel`
