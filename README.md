# L'Auberge Boischatel - Site Web Officiel

## 🏠 Vue d'ensemble

Site web officiel de **L'Auberge Boischatel**, une résidence privée pour aînés certifiée RPA située à Boischatel, Québec. Le site incarne notre mission : **Innovation bienveillante au service de la vie quotidienne**.

- **Version actuelle** : V4 - Innovation Bienveillante
- **Technologies** : Hono + Cloudflare Pages + TypeScript + Vite
- **Statut** : ✅ Fonctionnel en développement
- **Dernière mise à jour** : 25 novembre 2025

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

## 📄 Structure du Site (9 Sections)

### 1. **Accueil** (`#accueil`)
- Hero split-screen moderne
- Badge "Résidence Certifiée RPA"
- CTA : "Planifier une visite" + "Voir les chambres"
- Tagline : Innovation bienveillante

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

### 8. **Galerie** (`#galerie`)
- 6 images professionnelles :
  - Façade victorienne
  - Salle à manger lumineuse
  - Chambres privées confortables
  - Jardins paysagers
  - Terrasse couverte
  - Vue nocturne chaleureuse

### 9. **Contact** (`#contact`)
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
- `GET /api/contact` - Récupérer les coordonnées
- `POST /api/contact` - Soumettre formulaire

## 📊 Architecture Technique

### Structure des fichiers
```
webapp/
├── src/
│   └── index.tsx           # Application Hono principale (55 KB)
├── public/
│   └── static/
│       ├── images/         # 8 images (8.9 MB total)
│       │   ├── logo.png (405 KB - transparent)
│       │   ├── hero-mockup.png (68 KB)
│       │   ├── facade.jpg (1.1 MB)
│       │   ├── salle-manger.png (2.1 MB)
│       │   ├── chambre.png (2.3 MB)
│       │   ├── jardin.jpg (1.4 MB)
│       │   ├── galerie.jpg (1.3 MB)
│       │   └── vue-nocturne.jpg (305 KB)
│       └── enhanced-styles.css (8 KB)
├── dist/                   # Build output (82.67 KB)
├── ecosystem.config.cjs    # PM2 configuration
├── vite.config.ts          # Vite build config
├── wrangler.jsonc          # Cloudflare config
├── package.json            # Dependencies
└── README.md               # Ce fichier
```

### Technologies
- **Framework Backend** : Hono 4.0+ (edge-optimized)
- **Runtime** : Cloudflare Workers/Pages
- **Build Tool** : Vite 6.4+
- **Type System** : TypeScript 5+
- **Déploiement** : Wrangler CLI
- **Dev Server** : PM2 (sandbox), Wrangler Pages Dev (local)

### Bundle Size
- **Worker bundle** : 82.67 KB (excellent pour Cloudflare)
- **Images totales** : 8.9 MB (servies via CDN)
- **CSS externe** : 8 KB

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
- **Téléphone** : 418-XXX-XXXX (à mettre à jour avec le vrai numéro)
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
- **V4 Innovation Bienveillante** : *Généré automatiquement*

## 👥 Équipe & Contribution

**Propriété** : Mathieu Chamberland (jeune entrepreneur, investisseur immobilier)
**Email professionnel** : admin@aubergeboischatel.com
**GitHub** : *À configurer avec setup_github_environment*

## 📈 Prochaines Étapes Recommandées

1. **Déploiement production** - Mettre en ligne sur Cloudflare Pages
2. **Domaine personnalisé** - Configurer `aubergeboischatel.com`
3. **Email service** - Intégrer SendGrid/Mailgun pour formulaire
4. **Téléphone réel** - Remplacer 418-XXX-XXXX
5. **Analytics** - Ajouter Google Analytics / Cloudflare Analytics
6. **Témoignages** - Collecter et ajouter témoignages de familles
7. **Photos professionnelles** - Session photo supplémentaire si besoin
8. **SEO** - Optimiser pour recherche locale Boischatel/Québec

## 📄 Licence

© 2025 L'Auberge Boischatel. Tous droits réservés.

---

**Site créé avec innovation bienveillante** ❤️💡🛡️
