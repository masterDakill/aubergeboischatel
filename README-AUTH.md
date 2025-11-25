# 🔐 Guide d'Installation - Authentification Firebase + PostgreSQL

**L'Auberge Boischatel - Plateforme Client/Employé**

Ce guide vous explique comment configurer l'authentification complète avec Firebase Auth + PostgreSQL pour gérer 100 clients et 30 employés.

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation Firebase](#installation-firebase)
3. [Configuration PostgreSQL](#configuration-postgresql)
4. [Variables d'Environnement](#variables-denvironnement)
5. [Déploiement Vercel](#déploiement-vercel)
6. [Configuration DNS GoDaddy](#configuration-dns-godaddy)
7. [Tests & Validation](#tests--validation)

---

## 🔧 Prérequis

- Node.js 18+ installé
- Compte Firebase (gratuit)
- Compte Supabase/Neon/Railway (PostgreSQL)
- Compte Vercel (gratuit)
- Domaine GoDaddy : `aubergeboischatel.com`

---

## 🔥 Installation Firebase

### Étape 1 : Créer un Projet Firebase

1. Aller sur : https://console.firebase.google.com
2. Cliquer sur **"Ajouter un projet"**
3. Nom du projet : `auberge-boischatel`
4. Désactiver Google Analytics (optionnel)
5. Cliquer sur **"Créer le projet"**

### Étape 2 : Activer Authentication

1. Dans le menu de gauche → **Authentication**
2. Cliquer sur **"Commencer"**
3. Activer **"Email/Password"**
4. **Important** : Activer aussi **"Lien de connexion email"** pour reset mot de passe

### Étape 3 : Obtenir les Clés Client

1. Project Settings (⚙️ en haut à gauche) → **"Général"**
2. Scroll vers le bas → **"Vos applications"**
3. Cliquer sur l'icône **Web** (`</>`)
4. Surnom de l'application : `Auberge Boischatel Web`
5. Copier les valeurs dans `.env.local` :

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=auberge-boischatel.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=auberge-boischatel
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=auberge-boischatel.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc...
```

### Étape 4 : Générer la Clé Admin (Server-Side)

1. Project Settings → **"Comptes de service"**
2. Cliquer sur **"Générer une nouvelle clé privée"**
3. Un fichier JSON sera téléchargé
4. Ouvrir le JSON et copier :
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

**⚠️ IMPORTANT** : Pour `FIREBASE_ADMIN_PRIVATE_KEY`, gardez les `\n` dans la chaîne :

```bash
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...\n-----END PRIVATE KEY-----\n"
```

---

## 🗄️ Configuration PostgreSQL

### Option A : Supabase (Recommandé)

1. Aller sur : https://supabase.com/dashboard
2. Cliquer sur **"New Project"**
3. Organization : Créer ou sélectionner
4. Project name : `auberge-boischatel`
5. Database Password : **Choisir un mot de passe fort** (noter quelque part !)
6. Region : `East US (North Virginia)`
7. Cliquer sur **"Create new project"** (attendre 2-3 minutes)

### Récupérer la Connection String

1. Settings (⚙️ en bas à gauche) → **Database**
2. Scroll vers **"Connection string"**
3. Sélectionner **"URI"** (pas "Session mode")
4. Copier l'URL et remplacer `[YOUR-PASSWORD]` par votre mot de passe :

```bash
DATABASE_URL=postgresql://postgres:YOUR-PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

### Exécuter le Schema SQL

1. Dans Supabase → SQL Editor
2. Créer une nouvelle query
3. Copier tout le contenu de `database/schema.sql`
4. Cliquer sur **"Run"** (▶️)
5. Vérifier qu'il n'y a pas d'erreurs

**OU via CLI** :

```bash
psql postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres < database/schema.sql
```

---

### Option B : Neon (Alternative)

1. Aller sur : https://neon.tech
2. Sign up with GitHub
3. Create Project : `auberge-boischatel`
4. Copier la **Connection String** :

```bash
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb
```

5. Installer Neon CLI (optionnel) :

```bash
npm i -g neonctl
neonctl sql-editor
# Coller le contenu de schema.sql
```

---

## 🌍 Variables d'Environnement

### 1. Fichier Local (.env.local)

Copier `.env.example` vers `.env.local` :

```bash
cp .env.example .env.local
```

Remplir **TOUTES** les valeurs (voir sections Firebase + PostgreSQL ci-dessus).

### 2. Vérifier les Variables

```bash
# Vérifier que toutes les variables sont définies
grep -v '^#' .env.local | grep -v '^$' | wc -l
# Devrait afficher au moins 15-20 lignes
```

---

## 🚀 Déploiement Vercel

### Étape 1 : Installer Vercel CLI

```bash
npm install -g vercel
vercel login
```

### Étape 2 : Déployer depuis le Projet

```bash
cd /home/user/webapp
vercel
```

Répondre aux questions :

```
? Set up and deploy "~/webapp"? [Y/n] Y
? Which scope do you want to deploy to? Your Personal Account
? Link to existing project? [y/N] N
? What's your project's name? auberge-boischatel
? In which directory is your code located? ./
? Want to modify these settings? [y/N] N
```

### Étape 3 : Configurer les Variables d'Environnement

**Option A : Via Dashboard** (Recommandé)

1. Aller sur : https://vercel.com/dashboard
2. Sélectionner le projet **auberge-boischatel**
3. Settings → **Environment Variables**
4. Ajouter **TOUTES** les variables de `.env.local` :

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSy...` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `auberge-boischatel.firebaseapp.com` | Production, Preview, Development |
| ... | ... | ... |
| `DATABASE_URL` | `postgresql://...` | Production |

**Option B : Via CLI**

```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
# Coller la valeur quand demandé

vercel env add FIREBASE_ADMIN_PRIVATE_KEY production
# Pour la private key, coller en une seule ligne avec \n
```

### Étape 4 : Redéployer

```bash
vercel --prod
```

Vercel vous donnera une URL :

```
✅ Production: https://auberge-boischatel.vercel.app
```

---

## 🌐 Configuration DNS GoDaddy

### Étape 1 : Ajouter le Domaine dans Vercel

1. Vercel Dashboard → **Settings** → **Domains**
2. Cliquer sur **"Add"**
3. Entrer : `aubergeboischatel.com`
4. Vercel affichera les DNS à configurer

### Étape 2 : Configurer GoDaddy DNS

1. Aller sur : https://dcc.godaddy.com/manage/dns
2. Sélectionner `aubergeboischatel.com`
3. Modifier les records DNS :

**A) Pour `www.aubergeboischatel.com`** :

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | cname.vercel-dns.com | 600 |

**B) Pour le domaine racine `aubergeboischatel.com`** :

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 600 |

(Valeur IP fournie par Vercel - vérifier dans Vercel Dashboard)

### Étape 3 : Vérifier la Configuration

Attendre 5-10 minutes, puis :

```bash
# Vérifier DNS
nslookup aubergeboischatel.com
nslookup www.aubergeboischatel.com

# Tester HTTPS
curl -I https://aubergeboischatel.com
curl -I https://www.aubergeboischatel.com
```

---

## ✅ Tests & Validation

### Test 1 : Firebase Auth

```bash
# Test que Firebase répond
curl https://auberge-boischatel.firebaseapp.com
```

### Test 2 : PostgreSQL

```bash
# Via psql
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
# Devrait afficher au moins 2 (admin + employee)
```

### Test 3 : API Backend

```bash
# Test sync user endpoint
curl -X POST https://aubergeboischatel.com/api/auth/syncUser \
  -H "Content-Type: application/json" \
  -d '{"idToken": "test-token"}'

# Devrait retourner une erreur d'auth (normal si token invalide)
```

### Test 4 : Frontend

1. Ouvrir : https://aubergeboischatel.com
2. Cliquer sur **"Connexion"**
3. Essayer de créer un compte test
4. Vérifier que Firebase envoie un email de vérification

---

## 🔒 Sécurité Post-Installation

### 1. Règles Firebase Security

Dans Firebase Console → Authentication → **Settings** :

- ✅ Activer **"Email enumeration protection"**
- ✅ Désactiver **"Create new user by admin only"** (pour permettre inscription clients)
- ✅ Configurer **"Authorized domains"** : `aubergeboischatel.com`

### 2. Règles RLS PostgreSQL

Les règles Row Level Security sont déjà configurées dans `schema.sql`.

Vérifier qu'elles sont actives :

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

### 3. Rate Limiting (Optionnel)

Installer Vercel Edge Middleware pour rate limiting :

```bash
npm install @vercel/edge
```

Créer `middleware.ts` (voir documentation Vercel).

---

## 📊 Monitoring & Logs

### Logs Vercel

```bash
vercel logs auberge-boischatel --follow
```

### Logs Firebase

Firebase Console → **Authentication** → **Users** : voir les inscriptions

### Logs PostgreSQL

Supabase → **Table Editor** → `activity_logs` : voir toutes les actions

---

## 🆘 Troubleshooting

### Erreur : "Firebase config is invalid"

- Vérifier que toutes les variables `NEXT_PUBLIC_FIREBASE_*` sont définies
- Redéployer : `vercel --prod`

### Erreur : "Cannot connect to PostgreSQL"

- Vérifier que `DATABASE_URL` est correcte
- Tester : `psql $DATABASE_URL -c "SELECT 1;"`
- Vérifier IP whitelist (Supabase : Settings → Database → IP Allow List)

### Erreur : "Vercel deployment failed"

- Vérifier logs : `vercel logs`
- Vérifier build : `npm run build` en local
- Vérifier que `vercel.json` est correct

---

## 📚 Ressources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🎯 Prochaines Étapes

Maintenant que l'infrastructure est en place :

1. ✅ Créer les pages `/client/dashboard` et `/staff/dashboard`
2. ✅ Implémenter le modal de login dans le header
3. ✅ Créer le panneau admin `/admin/users` pour gérer les comptes
4. ✅ Tester avec des vrais utilisateurs

---

**Support** : Contacter Mathieu Chamberland - mathieu@aubergeboischatel.com

**Dernière mise à jour** : 2025-01-25
