# 📋 Checklist de Déploiement - L'Auberge Boischatel

**Version 2.0 - Auth + PostgreSQL**

---

## ✅ Phase 1 : Infrastructure (Semaine 1)

### Jour 1-2 : Comptes & Services

- [ ] Créer compte Vercel → https://vercel.com/signup
- [ ] Créer compte Firebase → https://console.firebase.google.com
- [ ] Créer compte Supabase → https://supabase.com/dashboard
- [ ] Connecter GitHub repo au projet

### Jour 3-4 : Configuration Firebase

- [ ] Créer projet Firebase "auberge-boischatel"
- [ ] Activer Authentication → Email/Password
- [ ] Copier clés client (Web app) vers `.env.local`
- [ ] Générer clé Admin (Service Account JSON)
- [ ] Copier clés admin vers `.env.local`

### Jour 5-7 : Configuration PostgreSQL

- [ ] Créer projet Supabase "auberge-boischatel"
- [ ] Noter le mot de passe database (⚠️ **IMPORTANT**)
- [ ] Copier CONNECTION STRING vers `.env.local`
- [ ] Exécuter `database/schema.sql` dans SQL Editor
- [ ] Vérifier que les 6 tables sont créées
- [ ] Vérifier que les données de test sont insérées

---

## ✅ Phase 2 : Variables d'Environnement (Jour 8)

### Local Development

```bash
# 1. Copier le template
cp .env.example .env.local

# 2. Remplir TOUTES les variables
nano .env.local

# 3. Vérifier
grep -v '^#' .env.local | grep -v '^$'
```

### Variables Critiques à Vérifier

- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` (commence par `AIzaSy`)
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` (finit par `.firebaseapp.com`)
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY` (garde les `\n` !)
- [ ] `DATABASE_URL` (commence par `postgresql://`)
- [ ] Tester connexion DB : `psql $DATABASE_URL -c "SELECT 1;"`

---

## ✅ Phase 3 : Installation Dépendances (Jour 9)

```bash
cd /home/user/webapp

# Installer nouvelles dépendances
npm install firebase firebase-admin pg

# Vérifier package.json
npm list firebase
npm list firebase-admin
npm list pg
```

---

## ✅ Phase 4 : Déploiement Vercel (Jour 10-11)

### Première Déploiement

```bash
# 1. Login Vercel
vercel login

# 2. Déployer (test)
vercel

# 3. Tester preview URL
curl -I https://auberge-boischatel-xxxxx.vercel.app
```

### Variables d'Environnement Vercel

Via Dashboard (https://vercel.com/dashboard) :

- [ ] Ajouter `NEXT_PUBLIC_FIREBASE_API_KEY` → Production
- [ ] Ajouter `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` → Production
- [ ] Ajouter `NEXT_PUBLIC_FIREBASE_PROJECT_ID` → Production
- [ ] Ajouter `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` → Production
- [ ] Ajouter `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` → Production
- [ ] Ajouter `NEXT_PUBLIC_FIREBASE_APP_ID` → Production
- [ ] Ajouter `FIREBASE_ADMIN_PROJECT_ID` → Production
- [ ] Ajouter `FIREBASE_ADMIN_CLIENT_EMAIL` → Production
- [ ] Ajouter `FIREBASE_ADMIN_PRIVATE_KEY` → Production
- [ ] Ajouter `DATABASE_URL` → Production

### Déploiement Production

```bash
# Redéployer avec les variables
vercel --prod

# Noter l'URL de production
# https://auberge-boischatel.vercel.app
```

---

## ✅ Phase 5 : Configuration DNS GoDaddy (Jour 12)

### GoDaddy DNS Settings

Aller sur : https://dcc.godaddy.com/manage/dns → `aubergeboischatel.com`

**Record CNAME (www)** :

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | cname.vercel-dns.com | 600 |

**Record A (root)** :

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 600 |

(Vérifier l'IP dans Vercel Dashboard → Domains)

### Vercel Domain Setup

1. Vercel Dashboard → Settings → **Domains**
2. Add Domain : `aubergeboischatel.com`
3. Add Domain : `www.aubergeboischatel.com`
4. Attendre propagation DNS (5-30 minutes)

### Vérification DNS

```bash
# Vérifier DNS propagation
nslookup aubergeboischatel.com
nslookup www.aubergeboischatel.com

# Tester HTTPS
curl -I https://aubergeboischatel.com
curl -I https://www.aubergeboischatel.com
```

---

## ✅ Phase 6 : Tests Fonctionnels (Jour 13-14)

### Test 1 : Site Statique

- [ ] Ouvrir https://aubergeboischatel.com
- [ ] Vérifier que le site charge
- [ ] Tester navigation (menu 5 liens)
- [ ] Vérifier bouton "Connexion" visible
- [ ] Tester responsive mobile

### Test 2 : Firebase Auth (Frontend)

- [ ] Cliquer sur "Connexion"
- [ ] Alert "Authentification Firebase à venir!" apparaît
- [ ] Pas d'erreurs dans Console navigateur (F12)
- [ ] Vérifier Network tab : pas de 500 errors

### Test 3 : API Backend (Créer ensuite)

```bash
# Test syncUser endpoint
curl -X POST https://aubergeboischatel.com/api/auth/syncUser \
  -H "Content-Type: application/json" \
  -d '{"idToken": "test"}'

# Devrait retourner erreur auth (normal)
```

### Test 4 : PostgreSQL

```bash
# Vérifier données
psql $DATABASE_URL -c "SELECT email, role FROM users;"

# Devrait afficher:
# admin@aubergeboischatel.com | ADMIN
# noemie@aubergeboischatel.com | EMPLOYEE
```

---

## ✅ Phase 7 : Sécurité Post-Déploiement (Jour 15)

### Firebase Security Rules

Firebase Console → Authentication → **Settings** :

- [ ] Activer "Email enumeration protection"
- [ ] Authorized domains : `aubergeboischatel.com`, `vercel.app`
- [ ] Password policy : Minimum 8 caractères

### Supabase Security

Supabase Dashboard → Settings → **Database** :

- [ ] IP Allow List : Ajouter IP de Vercel (ou `0.0.0.0/0`)
- [ ] SSL Mode : `require`
- [ ] Connection Pooler : Activer (pour scalabilité)

### Vercel Security Headers

Vérifier `vercel.json` contient :

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

---

## ✅ Phase 8 : Monitoring & Logs (Jour 16-17)

### Setup Monitoring

- [ ] Vercel Analytics : Activer dans Dashboard
- [ ] Firebase Usage : Vérifier quotas (10k MAU gratuit)
- [ ] Supabase Usage : Vérifier quotas (500 MB gratuit)

### Logs Access

```bash
# Logs Vercel (temps réel)
vercel logs auberge-boischatel --follow

# Logs Firebase
# Firebase Console → Authentication → Users

# Logs PostgreSQL
# Supabase → Table Editor → activity_logs
```

---

## ✅ Phase 9 : Backup & Recovery (Jour 18)

### Backup PostgreSQL

```bash
# Backup manuel
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Backup automatique (Supabase)
# Settings → Database → Point-in-time Recovery (PITR)
```

### Backup Firebase

- [ ] Firebase Console → Authentication → Export users
- [ ] Télécharger JSON avec tous les utilisateurs
- [ ] Stocker dans `/mnt/aidrive/backups/`

### Backup Code

```bash
# Git commit tout
cd /home/user/webapp
git add .
git commit -m "Production ready - Phase 9 complete"
git push origin main

# Tag version
git tag v2.0.0-auth
git push origin v2.0.0-auth
```

---

## ✅ Phase 10 : Documentation Finale (Jour 19-20)

### Créer Documentation

- [ ] Documenter les rôles (CLIENT, EMPLOYEE, ADMIN)
- [ ] Créer guide utilisateur client
- [ ] Créer guide utilisateur employé
- [ ] Créer guide admin (gestion des comptes)

### Fichiers à Créer

```bash
docs/
├── USER-GUIDE-CLIENT.md
├── USER-GUIDE-EMPLOYEE.md
├── ADMIN-GUIDE.md
└── API-DOCUMENTATION.md
```

---

## 🎯 Validation Finale

### Checklist Complète

- [ ] ✅ Site accessible sur `aubergeboischatel.com` + HTTPS
- [ ] ✅ DNS GoDaddy configuré correctement
- [ ] ✅ Firebase Auth actif (test inscription/login)
- [ ] ✅ PostgreSQL connecté (6 tables créées)
- [ ] ✅ Variables d'environnement définies (Vercel + Local)
- [ ] ✅ Backup automatique configuré
- [ ] ✅ Monitoring actif (Vercel Analytics)
- [ ] ✅ Logs accessibles (Vercel + Firebase + Supabase)
- [ ] ✅ Sécurité renforcée (RLS + headers + rate limiting)
- [ ] ✅ Documentation complète

---

## 📞 Support

**Contact** : Mathieu Chamberland  
**Email** : admin@aubergeboischatel.com  
**Téléphone** : 418-822-0347

---

## 📊 Statistiques Capacité

| Ressource | Gratuit | Limite | Évolution |
|-----------|---------|--------|-----------|
| **Firebase Auth** | 10,000 MAU | Illimité | Passer à Blaze Plan si >10k |
| **Supabase DB** | 500 MB | 2 GB | Passer à Pro ($25/mois) |
| **Vercel Bandwidth** | 100 GB/mois | Illimité | Passer à Pro ($20/mois) |

**Capacité actuelle** : 100 clients + 30 employés = **130 utilisateurs actifs**

✅ **Largement sous les limites gratuites !**

---

**Dernière mise à jour** : 2025-01-25  
**Version** : 2.0.0-auth
