# L'Auberge Boischatel - Site Web Officiel

## 🏡 À Propos

Site web de la résidence pour aînés L'Auberge Boischatel située au 5424 Avenue Royale, Boischatel, QC.

**Directrice**: Noémie Gamache  
**Propriétaire**: Mathieu Chamberland  
**Email**: admin@aubergeboischatel.com

## 🚀 Démarrage Rapide

### Installation
```bash
cd /home/user/webapp
npm install
```

### Développement Local
```bash
# Build le projet
npm run build

# Démarrer avec PM2 (recommandé pour sandbox)
pm2 start ecosystem.config.cjs

# Tester
curl http://localhost:3000

# Voir les logs
pm2 logs auberge-boischatel --nostream
```

### Déploiement Cloudflare Pages

```bash
# 1. Setup Cloudflare API Key
setup_cloudflare_api_key

# 2. Build
npm run build

# 3. Créer projet Cloudflare
npx wrangler pages project create auberge-boischatel --production-branch main

# 4. Déployer
npm run deploy:prod
```

## 📁 Structure

```
webapp/
├── src/
│   └── index.tsx           # Application Hono principale
├── public/
│   └── static/             # Assets statiques
├── wrangler.jsonc          # Config Cloudflare
├── vite.config.ts          # Config Vite
├── ecosystem.config.cjs    # Config PM2
└── package.json
```

## ✨ Fonctionnalités

- ✅ Design split-screen moderne inspiré des mockups
- ✅ Palette de couleurs authentique (#2B4A6B, #F5F1E8, #C9A472)
- ✅ Typographie élégante (Playfair Display + Inter)
- ✅ Hero section avec photo directrice
- ✅ Galerie photo optimisée (9 images)
- ✅ Formulaire de contact avec API
- ✅ 6 valeurs fondamentales
- ✅ Section À Propos
- ✅ Responsive mobile-first
- ✅ SEO optimisé
- ✅ Performance optimale

## 📞 Contact

**Email**: admin@aubergeboischatel.com  
**Adresse**: 5424 Avenue Royale, Boischatel, QC G0A 1H0

## 🎨 Design System

**Palette de Couleurs**:
- Primary Navy: `#2B4A6B`
- Accent Blue: `#1C3654`
- Cream: `#F5F1E8`
- Warm Beige: `#D4C4A8`
- Gold: `#C9A472`

**Typographie**:
- Serif: Playfair Display (titres)
- Sans-serif: Inter (corps de texte)

## 📝 Scripts NPM

- `npm run build` - Build production
- `npm run dev` - Développement Vite
- `npm run dev:sandbox` - Développement Wrangler
- `npm run deploy:prod` - Déploiement Cloudflare
- `npm run clean-port` - Nettoyer le port 3000
- `npm run test` - Tester localhost
- `npm run git:init` - Init git repo
- `npm run git:status` - Statut git

## 👥 Équipe

**Noémie Gamache** - Directrice  
**Mathieu Chamberland** - Propriétaire & Développeur

---

© 2025 L'Auberge Boischatel - Tous droits réservés
