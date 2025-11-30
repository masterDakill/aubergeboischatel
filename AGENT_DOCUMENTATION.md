# Documentation Technique - L'Auberge Boischatel

## Vue d'ensemble du projet

**L'Auberge Boischatel** est une application web complète pour une résidence pour personnes âgées (RPA) située à Boischatel, Québec. Le projet comprend un site vitrine public, un système d'authentification multi-rôles, et des dashboards privés pour les clients (familles) et le personnel.

---

## Architecture Technique

### Stack Technologique

| Composant | Technologie |
|-----------|-------------|
| **Framework Backend** | Hono.js (TypeScript) |
| **Hébergement** | Cloudflare Pages + Workers |
| **Base de données** | PostgreSQL (Neon serverless) |
| **Authentification** | Firebase Auth |
| **Build Tool** | Vite |
| **3D Rendering** | Three.js |
| **Styling** | CSS custom + Tailwind (dashboards) |

### Structure des fichiers

```
aubergeboischatel/
├── src/
│   ├── index.tsx           # Point d'entrée principal (routes + HTML)
│   ├── routes/
│   │   ├── auth.ts         # Routes authentification
│   │   ├── residents.ts    # CRUD résidents
│   │   ├── documents.ts    # Gestion documents
│   │   └── logs.ts         # Activity logs
│   ├── lib/
│   │   ├── db.ts           # Connexion PostgreSQL
│   │   └── firebaseAdmin.ts # Firebase Admin SDK
│   ├── middleware/
│   │   └── auth.ts         # Middleware authentification
│   └── config/
│       ├── media.ts        # Mapping des médias (codes)
│       └── business.ts     # Informations entreprise
├── public/
│   └── static/
│       ├── images/         # Photos du site
│       ├── models/         # Modèles 3D (.glb)
│       ├── 3d-viewer.js    # Viewer Three.js custom
│       ├── auth.js         # Logique auth frontend
│       ├── client-dashboard.js  # Dashboard famille
│       └── staff-dashboard.js   # Dashboard employé
├── wrangler.toml           # Config Cloudflare
└── package.json
```

---

## Système d'Authentification

### Rôles utilisateurs

| Rôle | Description | Accès |
|------|-------------|-------|
| `CLIENT` | Famille d'un résident | Dashboard client, documents partagés |
| `EMPLOYEE` | Personnel de l'Auberge | Dashboard staff, gestion résidents |
| `ADMIN` | Administrateur | Tout + panneau admin |

### Flux d'authentification

```
1. Utilisateur clique "Connexion" sur le site
2. Modal Firebase Auth s'ouvre (email/password ou Google)
3. Firebase retourne un ID Token
4. Frontend envoie le token à /api/auth/me
5. Backend vérifie le token avec Firebase Admin SDK
6. Backend récupère l'utilisateur dans PostgreSQL
7. Redirection vers le dashboard approprié selon le rôle
```

### Points d'entrée

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil publique |
| `/client/dashboard` | Dashboard famille (CLIENT) |
| `/staff/dashboard` | Dashboard employé (EMPLOYEE/ADMIN) |
| `/admin/dashboard` | Panneau admin (ADMIN uniquement) |

---

## API Endpoints

### Authentification

```
POST /api/auth/register
Body: { email, password, first_name, last_name }
Response: { user, token }

GET /api/auth/me
Headers: Authorization: Bearer <idToken>
Response: { id, email, role, first_name, last_name, residents[] }
```

### Résidents (Staff uniquement)

```
GET /api/residents
→ Liste tous les résidents actifs

GET /api/residents/:id
→ Détails d'un résident + liens familiaux

POST /api/residents
Body: {
  full_name: string (required),
  room_number: string (required),
  date_of_birth?: string,
  admission_date?: string,
  medical_notes?: string,
  emergency_contact_name?: string,
  emergency_contact_phone?: string
}

PUT /api/residents/:id
Body: { ...champs à modifier }

DELETE /api/residents/:id (ADMIN only)
→ Soft delete (active = false)
```

### Observations

```
GET /api/residents/:id/observations
→ Liste observations (filtrées pour CLIENT)

POST /api/residents/:id/observations
Body: {
  observation_type: 'general' | 'medical' | 'behavior' | 'nutrition' | 'mobility' | 'social' | 'incident',
  title: string,
  content: string,
  severity?: 'INFO' | 'WARNING' | 'URGENT',
  visible_to_family?: boolean
}
```

### Documents

```
GET /api/documents
→ Liste documents (filtrés selon rôle)

POST /api/documents
Content-Type: multipart/form-data
Body: {
  resident_id: string,
  title: string,
  document_type: 'medical' | 'administrative' | 'financial' | 'other',
  file: File,
  share_with_family?: boolean
}
```

### Logs d'activité

```
GET /api/logs?limit=10
→ Dernières activités

POST /api/logs
Body: {
  action: string,
  details: string,
  resident_id?: string
}
```

---

## Base de données

### Schéma PostgreSQL

```sql
-- Utilisateurs
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'CLIENT', -- CLIENT, EMPLOYEE, ADMIN
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Résidents
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  room_number VARCHAR(10),
  date_of_birth DATE,
  admission_date DATE,
  medical_notes TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lien utilisateur-résident (familles)
CREATE TABLE user_resident_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  resident_id UUID REFERENCES residents(id),
  relation VARCHAR(100), -- 'Fils', 'Fille', 'Conjoint', etc.
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, resident_id)
);

-- Observations
CREATE TABLE resident_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES residents(id),
  author_id UUID REFERENCES users(id),
  observation_type VARCHAR(50), -- general, medical, behavior, etc.
  title VARCHAR(255),
  content TEXT,
  severity VARCHAR(20) DEFAULT 'INFO', -- INFO, WARNING, URGENT
  visible_to_family BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES residents(id),
  uploaded_by UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  document_type VARCHAR(50),
  file_url TEXT,
  file_type VARCHAR(20),
  share_with_family BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Logs d'activité
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  resident_id UUID REFERENCES residents(id),
  action VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Système de Médias (Codes)

Le projet utilise un système de codes pour référencer les médias de façon centralisée.

### Codes disponibles

| Code | Section | Description |
|------|---------|-------------|
| H1 | Hero | Image façade golden hour |
| M1 | Mission | Logo 3D (.glb) |
| C1, C2, C3 | Chambres | Photos chambres |
| R1 | Repas | Salle à manger |
| V1 | Visite 3D | Modèle Polycam (.glb) |
| G1-G20 | Galerie | Photos galerie |
| EXT1-EXT5 | Extérieurs | Vues extérieures |

### Utilisation

```typescript
import { getMediaPath, hasMedia } from './config/media'

// Obtenir le chemin
const heroImage = getMediaPath('H1') // '/static/images/facade-golden-hour.jpg'

// Vérifier si le média existe
if (hasMedia('C2')) {
  // Afficher l'image
}
```

---

## Viewer 3D (Three.js)

### Classe `Advanced3DViewer`

```javascript
new Advanced3DViewer(containerId, modelPath, options)
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoRotate` | boolean | true | Rotation automatique |
| `autoRotateSpeed` | number | 2.0 | Vitesse de rotation |
| `cameraControls` | boolean | true | Contrôles orbit |
| `glow` | boolean | true | Effet de glow |
| `glowIntensity` | number | 0.3 | Intensité du glow |
| `glowColor` | hex | 0xC9A472 | Couleur du glow |
| `backgroundColor` | hex | 0xF5F4F2 | Fond de la scène |
| `transparentBackground` | boolean | false | Fond transparent |
| `interactive` | boolean | true | Effets au clic (étincelles) |
| `minZoom` | number | 2 | Zoom minimum |
| `maxZoom` | number | 8 | Zoom maximum |

### Exemple d'utilisation

```javascript
// Logo 3D avec effets interactifs
new Advanced3DViewer('logo-3d-viewer', '/static/models/logo-3d.glb', {
  autoRotate: true,
  autoRotateSpeed: 2.0,
  glow: true,
  glowIntensity: 0.5,
  glowColor: 0xC9A472,
  transparentBackground: true,
  interactive: true // Étincelles au clic
});

// Visite 3D Polycam (sans effets)
new Advanced3DViewer('advanced-3d-viewer', '/static/models/auberge-3d.glb', {
  autoRotate: true,
  autoRotateSpeed: 1.0,
  glow: false,
  backgroundColor: 0x1a1a1a,
  interactive: false
});
```

### Effets interactifs

- **Clic sur le modèle**: Explosion d'étincelles dorées
- **Rotation complète (360°)**: Effet d'illumination en anneau
- **Pulse**: Animation de scale temporaire

---

## Dashboards

### Dashboard Client (Famille)

**URL**: `/client/dashboard`

**Fonctionnalités**:
- Voir les résidents liés au compte
- Consulter les documents partagés
- Voir les détails d'un résident (modal)
- Télécharger les documents
- Contacter l'Auberge (email/téléphone)

**Classe JS**: `ClientDashboard`

### Dashboard Staff (Employé)

**URL**: `/staff/dashboard`

**Fonctionnalités**:
- Statistiques (résidents actifs, observations du jour)
- Liste des résidents avec recherche
- Créer/modifier un résident (modal)
- Voir les détails d'un résident (modal)
- Ajouter une observation (modal)
- Téléverser un document (modal)
- Voir l'activité récente

**Classe JS**: `StaffDashboard`

### Méthodes principales

```javascript
// Staff Dashboard
staffDashboard.showAddResidentModal()     // Nouveau résident
staffDashboard.editResident(id)           // Modifier résident
staffDashboard.viewResident(id)           // Voir détails
staffDashboard.addObservation(id)         // Ajouter observation
staffDashboard.showObservationsModal()    // Modal observations
staffDashboard.showUploadDocumentModal(id) // Upload document
staffDashboard.filterResidents()          // Filtrer la liste

// Client Dashboard
clientDashboard.viewResidentDetails(id)   // Voir détails résident
clientDashboard.getResidentDocuments(id)  // Documents du résident
```

---

## Variables d'environnement

### Cloudflare Workers (wrangler.toml)

```toml
[vars]
FIREBASE_PROJECT_ID = "auberge-boischatel"

[[d1_databases]]
binding = "DB"
database_name = "auberge-boischatel-db"
database_id = "..."
```

### Secrets (wrangler secret)

```bash
wrangler secret put FIREBASE_CLIENT_EMAIL
wrangler secret put FIREBASE_PRIVATE_KEY
wrangler secret put DATABASE_URL  # Neon PostgreSQL
```

---

## Déploiement

### Build

```bash
npm run build
# Output: dist/
```

### Déploiement Cloudflare

```bash
npx wrangler pages deploy dist --project-name=auberge-boischatel
```

### URLs

| Environnement | URL |
|---------------|-----|
| Production | https://auberge-boischatel-3o0.pages.dev |
| Preview | https://<commit-hash>.auberge-boischatel-3o0.pages.dev |

---

## Informations Business

```typescript
// src/config/business.ts
export const BUSINESS_INFO = {
  name: "L'Auberge Boischatel",
  legalName: "9566-9562 QUÉBEC INC.",
  neq: "1179abordenave952",
  address: {
    street: "5420-5424 Avenue Royale",
    city: "Boischatel",
    province: "QC",
    postalCode: "G0A 1H0"
  },
  phone: "418-822-0347",
  email: "contact@aubergeboischatel.com",
  units: 38,
  certification: "RPA Québec"
}
```

---

## Optimisations Performance

### Chargement différé

Les scripts lourds (Three.js, particles.js) sont chargés après le rendu initial:

```javascript
// Chargé après window.onload
function loadDeferredScripts() {
  // 1. particles.js
  // 2. Three.js (après 100ms)
  // 3. OrbitControls
  // 4. GLTFLoader
  // 5. 3d-viewer.js
}
```

### Preload

```html
<link rel="preload" href="/static/images/facade-golden-hour-4k.jpg" as="image" fetchpriority="high">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://unpkg.com">
```

### Particles.js optimisé

- 30 particules (au lieu de 50+)
- Animations désactivées
- Interactivité désactivée
- Retina detect désactivé

---

## Palette de couleurs

```css
:root {
  --cream: #F5F4F2;        /* Fond principal */
  --charcoal: #2C3E50;     /* Texte principal */
  --slate: #5A7D8C;        /* Texte secondaire */
  --sage: #A9C7B5;         /* Accent vert */
  --copper: #C9A472;       /* Accent doré */
  --soft-white: #FAFAFA;   /* Cartes */
}
```

---

## Commandes utiles

```bash
# Développement
npm run dev

# Build
npm run build

# Déploiement
npx wrangler pages deploy dist --project-name=auberge-boischatel

# Logs Cloudflare
npx wrangler pages deployment tail

# Secrets
npx wrangler secret put <SECRET_NAME>
npx wrangler secret list
```

---

## Contacts

- **Projet**: L'Auberge Boischatel
- **Adresse**: 5420-5424 Avenue Royale, Boischatel, QC G0A 1H0
- **Téléphone**: 418-822-0347
- **Email**: contact@aubergeboischatel.com
