# L'Auberge Boischatel - Site Web Officiel

## 🏠 Vue d'ensemble

Site web officiel de **L'Auberge Boischatel**, une résidence privée pour aînés certifiée RPA située à Boischatel, Québec. Le site incarne notre mission : **Innovation bienveillante au service de la vie quotidienne**.

- **Version actuelle** : V6.0 - Dashboards Complets + API CRUD
- **Technologies** : Hono + Firebase Auth + Supabase PostgreSQL + TypeScript + Vite
- **Statut** : ✅ Fonctionnel - Dashboards intégrés
- **Dernière mise à jour** : 22 février 2025

## ⚙️ Installation & build

1. Installer les dépendances (obligatoire avant tout build) :
   ```bash
   npm install
   ```
2. Démarrer en local :
   ```bash
   npm run dev
   ```
3. Build de production Cloudflare Pages :
   ```bash
   npm run build
   ```

> Vite et Wrangler sont installés via `npm install` ; sans cette étape, la commande de build échoue ("vite: command not found").

## 🔗 Liens publics

- **Production (Cloudflare Pages)** : https://auberge-boischatel.pages.dev/
- **Domaine personnalisé** : https://aubergeboischatel.com
- **Dernier déploiement prévisualisation** : https://03d7ec48.auberge-boischatel.pages.dev/

### 🔗 Liens directs des dashboards (aperçus accessibles sans connexion)
- **Portail Client** : https://auberge-boischatel.pages.dev/client/dashboard (ou https://aubergeboischatel.com/client/dashboard)
- **Portail Employé** : https://auberge-boischatel.pages.dev/staff/dashboard (ou https://aubergeboischatel.com/staff/dashboard)
- Les deux pages affichent un aperçu statique immédiat (hero + cartes) même sans authentification, puis se remplacent par le contenu dynamique dès qu'une session Firebase valide est détectée.

### 🎆 Améliorations Version 6.0 (Dashboards Complets)
- **3 Dashboards dynamiques** : Client, Staff, Admin avec interfaces interactives
- **4 Modules API CRUD** : Residents, Documents, Logs, Users (24 endpoints)
- **Authentification complète** : Firebase Auth + Supabase PostgreSQL sync
- **Autorisations par rôle** : CLIENT, EMPLOYEE, ADMIN avec permissions granulaires
- **4 Nouvelles tables SQL** : documents, activity_logs, resident_observations, notifications
- **Documentation exhaustive** : README-API-DASHBOARDS.md (17,700 caractères)

### 🖥️ Portails client et employé (aperçu sans connexion)
- Les pages `/client/dashboard` et `/staff/dashboard` affichent maintenant un hero descriptif, des cartes de fonctionnalités et des CTA tant que la session n'est pas chargée.
- Objectif : éviter les écrans vides lorsque les scripts ne sont pas encore prêts ou que l'utilisateur n'est pas authentifié.
- Dès qu'une session valide est détectée, le contenu dynamique remplace automatiquement l'aperçu statique.

## 🎨 Identité Visuelle

### Palette de Couleurs
- **Bleu-gris moderne** : `#5A7D8C` (couleur principale)
- **Vert sauge** : `#A9C7B5` (accents et détails)
- **Crème** : `#F5F4F2` (fond principal)
- **Anthracite** : `#1F1F1F` (textes foncés)
- **Cuivre/Or** : `#C9A472` (accents chaleureux)

### Typographie
- **Titres (Serif)** : Lora - élégant et lisible
- **Corps (Sans-serif)** : Inter - moderne et accessible

### Style
Élégant, lumineux, moderne, chaleureux, victorien revisité. Design épuré favorisant l'accessibilité pour les aînés et les familles.

## 🎯 Valeurs & Positionnement

**Mission centrale** : Innovation bienveillante au service de la vie quotidienne

**Valeurs fondamentales** :
- ❤️ **Bienveillance** - Écoute, respect et empathie
- 💡 **Innovation** - Technologies au service du confort
- 🛡️ **Sécurité** - Conformité RPA exemplaire
- 🌱 **Fraîcheur** - Jeune équipe dynamique
- 👁️ **Vision** - Amélioration continue

**Caractéristiques** :
- 38 unités à taille humaine
- Architecture victorienne modernisée
- Jeunes propriétaires passionnés
- Sécurité incendie exemplaire
- Conformité RPA Québec 100%

## 📄 Structure du Site (10 Sections)

### 1. **Accueil** (`#accueil`)
- **Hero 4K full-width** : Photo golden hour spectaculaire (5056x3392px) + bloc verre dépoli
- Logo 3D animé (GLB) avec fallback statique si WebGL indisponible
- Badge cuivre : "Sécurité augmentée pour la RPA"
- CTA : "Voir le plan 3D de l’Auberge" + "Accéder aux alertes en temps réel"
- Pitch : sécurité, surveillance intelligente, assistance IA pour l’équipe et les familles
- Animation fade-in douce au chargement

### 2. **Mission & Valeurs** (`#mission`)
- Vision du bien-vieillir
- 5 valeurs fondamentales (cartes avec icônes)
- Texte sur l'approche innovante et humaine

### 3. **À Propos** (`#apropos`)
- Jeune équipe de propriétaires
- Stats : 38 unités, 24/7 assistance, 100% conforme
- Engagement moderne et humain

### 4. **Sécurité & Conformité** (`#securite`)
- Sécurité incendie exemplaire
- Conformité RPA Québec
- Sécurité quotidienne 24/7
- Technologies innovantes
- 4 cartes détaillées avec listes

### 5. **Chambres & Services** (`#chambres`)
- Chambre standard (caractéristiques)
- Services inclus (repas, ménage, buanderie, etc.)
- Espaces communs (salons, jardins, terrasses)
- CTAs vers contact et galerie

### 6. **Activités & Milieu de Vie** (`#activites`)
- 6 types d'activités :
  - Musique & spectacles
  - Arts & créativité
  - Activités physiques
  - Jeux & loisirs
  - Événements spéciaux
  - Nature & jardinage

### 7. **Repas & Menus** (`#repas`)
- Cuisine savoureuse et équilibrée
- 3 repas par jour, frais et locaux
- Adaptation aux besoins spéciaux
- 4 caractéristiques mises en avant

### 8. **Visite Virtuelle 3D** (`#visite3d`) 🆕
- Viewer Three.js pleine largeur avec bouton **Plein écran** et fond immersif
- Intégration Polycam 3D interactive
- 3 caractéristiques mises en avant :
  - Navigation 360° libre
  - Mesures réelles et dimensions exactes
  - Compatible multi-dispositifs
- Iframe responsive avec aspect-ratio 16:9 et fallback texte si WebGL indisponible
- Permet aux familles d'explorer à distance

### 9. **Galerie** (`#galerie`)
- 6 images professionnelles :
  - Façade victorienne
  - Salle à manger lumineuse
  - Chambres privées confortables
  - Jardins paysagers
  - Terrasse couverte
  - Vue nocturne chaleureuse

### 10. **Contact** (`#contact`)
- Formulaire de contact fonctionnel
- Coordonnées complètes
- Carte Google Maps interactive
- CTA : "Planifier votre visite"

## 🔗 URLs & Accès

### Développement
**URL Sandbox** : https://3000-itkihyuo86hjc47kqshqg-6532622b.e2b.dev

### Production
**URL de production** : *À déployer sur Cloudflare Pages*
- Domaine prévu : `auberge-boischatel.pages.dev`
- Domaine personnalisé : `aubergeboischatel.com` (optionnel)

### API

#### **API Publiques**
- `GET /api/contact` - Récupérer les coordonnées
- `POST /api/contact` - Soumettre formulaire
- `GET /api/dbTest` - Test connexion base de données

#### **API Authentifiées (JWT Bearer Token)**
- **Residents** : `/api/residents` (GET, POST, PUT, DELETE, observations)
- **Documents** : `/api/documents` (GET, POST, PUT, DELETE, filtres)
- **Logs** : `/api/logs` (GET, POST, par résident)
- **Users** : `/api/users` (GET, PUT, liens, stats)

Voir `README-API-DASHBOARDS.md` pour documentation complète.

## 📊 Architecture Technique

### Structure des fichiers
```
webapp/
├── src/
│   ├── index.tsx                   # Application Hono principale
│   ├── lib/
│   │   ├── db.ts                  # PostgreSQL connection pool
│   │   ├── firebaseAdmin.ts       # Firebase Admin SDK
│   │   └── firebase.config.ts     # Firebase client config
│   └── routes/
│       ├── auth.ts                # Authentification
│       ├── residents.ts           # CRUD résidents (10,958 bytes)
│       ├── documents.ts           # Gestion documents (9,029 bytes)
│       ├── logs.ts                # Journaux activités (3,840 bytes)
│       ├── users.ts               # Admin utilisateurs (8,811 bytes)
│       └── dbTest.ts              # Test connexion DB
├── public/
│   └── static/
│       ├── images/                # 8 images (8.9 MB total)
│       ├── client-dashboard.js    # Dashboard CLIENT (10,075 bytes)
│       ├── staff-dashboard.js     # Dashboard STAFF (13,150 bytes)
│       ├── auth.js                # Gestionnaire auth client (12,603 bytes)
│       └── enhanced-styles.css    # Styles (8 KB)
├── dist/                          # Build output (1,108.80 KB)
├── schema-dashboard-extensions.sql # 4 nouvelles tables (6,739 bytes)
├── README-AUTH.md                 # Guide config Firebase+Supabase (11,937 bytes)
├── README-API-DASHBOARDS.md       # Guide API complet (17,700 bytes)
├── IMPLEMENTATION-COMPLETE.md     # Rapport final (9,703 bytes)
├── ecosystem.config.cjs           # PM2 configuration
├── vite.config.ts                 # Vite build config
├── wrangler.jsonc                 # Cloudflare config
├── package.json                   # Dependencies
└── README.md                      # Ce fichier
```

### Technologies
- **Framework Backend** : Hono 4.0+ (edge-optimized)
- **Runtime** : Cloudflare Workers/Pages
- **Build Tool** : Vite 6.4+
- **Type System** : TypeScript 5+
- **Déploiement** : Wrangler CLI
- **Dev Server** : PM2 (sandbox), Wrangler Pages Dev (local)

### Bundle Size
- **Worker bundle** : 1,108.80 KB (637 modules transformés)
- **Images totales** : 8.9 MB (servies via CDN)
- **CSS externe** : 8 KB
- **Routes API** : ~32,000 caractères (4 fichiers)
- **Dashboards JS** : ~23,000 caractères (2 fichiers)
- **Documentation** : ~57,000 caractères (3 fichiers)

## 🚀 Commandes Utiles

### Développement (Sandbox)
```bash
# Build le projet
npm run build

# Démarrer avec PM2
pm2 start ecosystem.config.cjs

# Redémarrer après changements
pm2 restart auberge-boischatel

# Voir les logs
pm2 logs auberge-boischatel --nostream

# Tester l'accès
curl http://localhost:3000
```

### Développement (Local Machine)
```bash
# Mode développement avec hot reload
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview
```

### Nettoyage
```bash
# Nettoyer le port 3000
npm run clean-port

# Ou manuellement
fuser -k 3000/tcp
```

### Git
```bash
# Voir le statut
npm run git:status

# Commit rapide
npm run git:commit "message"

# Log condensé
npm run git:log
```

## 📞 Informations de Contact

- **Adresse** : 5424 Avenue Royale, Boischatel, QC G0A 1H0
- **Téléphone** : 418-822-0347
- **Email** : admin@aubergeboischatel.com
- **Heures** : Lun-Ven 9h-17h, Weekend sur rendez-vous

## ✅ Fonctionnalités Actuelles

### Complétées
- ✅ Navigation fixe avec 9 sections
- ✅ Hero moderne avec 2 CTAs
- ✅ Section Mission & Valeurs (5 cartes)
- ✅ Section À Propos (stats inclus)
- ✅ Section Sécurité & Conformité (4 cartes détaillées)
- ✅ Section Chambres & Services (3 types)
- ✅ Section Activités (6 catégories)
- ✅ Section Repas & Menus (4 caractéristiques)
- ✅ Galerie d'images (6 photos hover effect)
- ✅ Formulaire de contact fonctionnel
- ✅ Carte Google Maps interactive
- ✅ Footer complet avec liens
- ✅ Design responsive (mobile, tablet, desktop)
- ✅ Logo transparent (PNG avec canal alpha)
- ✅ Images locales servies depuis /static/
- ✅ Animations CSS élégantes
- ✅ Accessibilité (focus, contrast, reduced-motion)
- ✅ Smooth scroll navigation
- ✅ SEO meta tags + Open Graph

### À Améliorer (Optionnel)
- 🔄 Intégrer vrai numéro de téléphone
- 🔄 Connecter formulaire à SendGrid/Mailgun
- 🔄 Ajouter témoignages de familles (si disponibles)
- 🔄 Ajouter section FAQ (si nécessaire)
- 🔄 Menu mobile hamburger pour petits écrans
- 🔄 Lightbox pour galerie d'images
- 🔄 Vidéo de présentation (si disponible)

## 🌐 Déploiement Cloudflare Pages

### Prérequis
1. Appeler `setup_cloudflare_api_key` pour configuration API
2. Gérer `cloudflare_project_name` via `meta_info`

### Commandes de déploiement
```bash
# Build de production
npm run build

# Créer projet Cloudflare Pages
npx wrangler pages project create auberge-boischatel \
  --production-branch main \
  --compatibility-date 2024-01-01

# Déployer
npm run deploy:prod

# Vérifier
curl https://auberge-boischatel.pages.dev
```

### Variables d'environnement
Aucune variable secrète requise pour l'instant (contact form TODO).

## 📝 Tone Rédactionnel

- **Chaleureux** et humain
- **Professionnel** sans être distant
- **Apaisant** et rassurant
- **Moderne** et accessible
- **Clair** et direct

**Éviter** : Jargon médical complexe, ton infantilisant, promesses exagérées.

## 🎨 Guidelines Design

### Principes
- Espaces aérés et respirants
- Contrastes suffisants pour lisibilité
- Icônes simples et reconnaissables
- Images lumineuses et accueillantes
- Hiérarchie typographique claire

### Responsive
- **Mobile** : Single column, navigation simplifiée
- **Tablet** : 2 colonnes pour certaines grilles
- **Desktop** : Full layout avec grilles 2-3 colonnes

### Accessibilité
- Contraste WCAG AA minimum
- Focus indicators visibles
- Texte alt pour toutes les images
- Support reduced-motion
- Support high-contrast mode

## 🔐 Sécurité & Conformité

Le site met en avant :
- Certification RPA Québec à jour
- Système incendie exemplaire (gicleurs, détecteurs, alarmes)
- Surveillance 24/7
- Technologies modernes et sécurisées
- Personnel formé selon normes provinciales
- Conformité totale Loi services de santé Québec

## 📦 Backups Disponibles

- **V3 Transparent Logo** : https://www.genspark.ai/api/files/s/6UAb4erJ
- **V5 Pre-Dashboards** : https://www.genspark.ai/api/files/s/PSnSckaR (Firebase Auth + Supabase intégré)
- **V6 Dashboards Complets** : https://www.genspark.ai/api/files/s/RisyUtoi (API CRUD + 3 dashboards + build réussi)

## 👥 Équipe & Contribution

**Propriété** : Mathieu Chamberland (jeune entrepreneur, investisseur immobilier)
**Email professionnel** : admin@aubergeboischatel.com
**GitHub** : *À configurer avec setup_github_environment*

## 📈 Prochaines Étapes Recommandées

### **Priorité Immédiate (Configuration)**
1. **Exécuter schéma SQL** - Copier `schema-dashboard-extensions.sql` dans Supabase SQL Editor
2. **Tester API** - Suivre guide `README-API-DASHBOARDS.md` (scénarios 1-6)
3. **Créer utilisateurs test** - CLIENT, EMPLOYEE, ADMIN
4. **Lier users à résidents** - Utiliser endpoint `/api/users/:id/link-resident`
5. **Tester dashboards** - Vérifier `/client/dashboard`, `/staff/dashboard`, `/admin/dashboard`

### **Priorité Haute (Développement)**
1. **Upload fichiers réel** - Implémenter R2 Storage pour documents
2. **Page /staff/residents** - Interface CRUD complète résidents
3. **Notifications temps réel** - WebSockets ou polling pour familles
4. **Calendrier activités** - Événements, rendez-vous médicaux
5. **Rapports automatiques** - Génération PDF mensuels

### **Priorité Moyenne (Production)**
1. **Déploiement production** - Cloudflare Pages avec variables env
2. **Domaine personnalisé** - `aubergeboischatel.com`
3. **Email service** - SendGrid/Mailgun pour formulaire
4. **Analytics** - Google Analytics / Cloudflare Analytics
5. **SEO** - Optimiser recherche locale

### **Priorité Basse (Améliorations)**
1. **Dashboard analytique ADMIN** - Graphiques, tendances
2. **Témoignages familles** - Section dédiée
3. **Multi-langue** - Support EN/FR
4. **Export données** - CSV, Excel

## 📄 Licence

© 2025 L'Auberge Boischatel. Tous droits réservés.

---

**Site créé avec innovation bienveillante** ❤️💡🛡️
