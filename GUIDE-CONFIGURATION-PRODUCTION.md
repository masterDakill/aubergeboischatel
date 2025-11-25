# 🚀 GUIDE CONFIGURATION PRODUCTION - L'Auberge Boischatel

## ✅ ÉTAT ACTUEL

### **Ce qui fonctionne MAINTENANT** :
- ✅ Site web : https://auberge-boischatel.pages.dev/
- ✅ Page d'accueil (Hero, Mission, Services, Galerie, Contact)
- ✅ API publique : `/api/contact`
- ✅ Dashboards (pages accessibles, mais auth non configurée)
- ✅ GitHub : https://github.com/masterDakill/aubergeboischatel
- ✅ Cloudflare Pages : Déployé et actif

### **Ce qui nécessite configuration** :
- ⏳ Firebase Authentication (pour login/signup)
- ⏳ Supabase PostgreSQL (pour données utilisateurs/résidents)
- ⏳ Variables d'environnement Cloudflare (pour connecter tout)

---

## 📋 PLAN DE CONFIGURATION (60 minutes total)

1. **Firebase** (20 min) - Authentification utilisateurs
2. **Supabase** (15 min) - Base de données
3. **Cloudflare Variables** (10 min) - Connexion services
4. **Tests** (15 min) - Vérification complète

---

## 🔥 ÉTAPE 1 : CONFIGURATION FIREBASE (20 minutes)

### **1.1 Créer le projet Firebase**

1. **Ouvrir** : https://console.firebase.google.com/
2. **Cliquer** : "Ajouter un projet" ou "Create a project"
3. **Nom du projet** : `auberge-boischatel`
4. **Google Analytics** : Désactiver (pas nécessaire pour l'instant)
5. **Cliquer** : "Créer le projet"
6. **Attendre** : ~1 minute (création automatique)

---

### **1.2 Activer Authentication Email/Password**

1. **Dans le projet Firebase** → Menu latéral gauche → **"Authentication"**
2. **Cliquer** : "Commencer" (Get started)
3. **Onglet** : "Sign-in method"
4. **Cliquer** : "Email/Mot de passe" (Email/Password)
5. **Activer** : Premier toggle (Email/Password)
6. **Ne PAS activer** : "Email link (passwordless sign-in)" (laisser désactivé)
7. **Cliquer** : "Enregistrer" ou "Save"

---

### **1.3 Obtenir les clés FRONTEND (Web App)**

1. **Icône engrenage ⚙️** (en haut à gauche) → "Paramètres du projet" (Project settings)
2. **Section** : "Vos applications" (Your apps)
3. **Cliquer** : Icône **Web** `</>`
4. **Nom de l'app** : `auberge-boischatel-web`
5. **NE PAS cocher** : "Also set up Firebase Hosting" (laisser décoché)
6. **Cliquer** : "Enregistrer l'app" (Register app)
7. **Copier** les valeurs affichées dans ce format :

```javascript
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSy...",                          // ← COPIER
  authDomain: "auberge-boischatel.firebaseapp.com",
  projectId: "auberge-boischatel",
  storageBucket: "auberge-boischatel.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

**📝 NOTER CES 6 VALEURS** (on les utilisera à l'étape 3)

---

### **1.4 Obtenir les clés BACKEND (Service Account)**

1. **Toujours dans Paramètres du projet** → Onglet **"Comptes de service"** (Service accounts)
2. **Scroller vers le bas** → Section "SDK Admin Firebase"
3. **Cliquer** : "Générer une nouvelle clé privée" (Generate new private key)
4. **Confirmer** : "Générer la clé" (popup confirmation)
5. **Fichier JSON téléchargé** → Ouvrir avec éditeur texte
6. **Copier** ces 3 valeurs du JSON :

```json
{
  "project_id": "auberge-boischatel",           // ← COPIER
  "client_email": "firebase-adminsdk-xxxxx@auberge-boischatel.iam.gserviceaccount.com",  // ← COPIER
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"  // ← COPIER TOUT (avec \n)
}
```

**📝 NOTER CES 3 VALEURS** (on les utilisera à l'étape 3)

---

## 🗄️ ÉTAPE 2 : CONFIGURATION SUPABASE (15 minutes)

### **2.1 Créer le projet Supabase**

1. **Ouvrir** : https://supabase.com/
2. **Se connecter** : Avec GitHub (recommandé) ou email
3. **Cliquer** : "New project"
4. **Organization** : Créer "auberge-boischatel" (si première fois)
5. **Project name** : `auberge-boischatel-production`
6. **Database Password** : Cliquer "Generate a password"
7. **📝 COPIER LE MOT DE PASSE** (très important !) → Coller dans un fichier texte temporaire
8. **Region** : **Canada (Central)** (le plus proche de Québec)
9. **Pricing Plan** : **Free** (suffisant pour démarrer)
10. **Cliquer** : "Create new project"
11. **Attendre** : 1-2 minutes (création database)

---

### **2.2 Obtenir DATABASE_URL**

1. **Menu latéral** → **Settings** (icône engrenage en bas)
2. **Cliquer** : **Database** (dans le menu Settings)
3. **Scroller** → Section **"Connection string"**
4. **Sélectionner** : Mode **"URI"** (pas "Transaction" ni "Session")
5. **Copier** l'URL qui ressemble à :

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ca-central-1.pooler.supabase.com:6543/postgres
```

6. **IMPORTANT** : Remplacer `[YOUR-PASSWORD]` par le mot de passe copié à l'étape 2.1.7
7. **L'URL finale** doit ressembler à :

```
postgresql://postgres.abcdefghijk:Tp9x!K2mL@aws-0-ca-central-1.pooler.supabase.com:6543/postgres
```

**📝 NOTER CETTE URL COMPLÈTE** (on l'utilisera à l'étape 3)

---

### **2.3 Exécuter le schéma SQL**

1. **Menu latéral** → **SQL Editor** (icône </>)
2. **Cliquer** : "+ New query"
3. **Copier-coller** le contenu du fichier `schema-dashboard-extensions.sql` du projet
4. **OU copier ce SQL** :

```sql
create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text unique not null,
  email text unique not null,
  first_name text,
  last_name text,
  phone text,
  role text not null check (role in ('CLIENT', 'EMPLOYEE', 'ADMIN')),
  active boolean default true,
  created_at timestamp with time zone default now(),
  last_login timestamp with time zone
);

create table if not exists residents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  room_number text,
  admission_date date default current_date,
  date_of_birth date,
  medical_notes text,
  emergency_contact_name text,
  emergency_contact_phone text,
  active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists user_resident_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  resident_id uuid references residents(id) on delete cascade,
  relation text not null,
  is_primary_contact boolean default false,
  created_at timestamp with time zone default now(),
  constraint unique_user_resident unique (user_id, resident_id)
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid references residents(id) on delete cascade,
  title text not null,
  file_url text not null,
  file_type text,
  file_size_kb integer,
  uploaded_by uuid references users(id),
  visible_to_client boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  resident_id uuid references residents(id) on delete set null,
  action text not null,
  details text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default now()
);

create table if not exists resident_observations (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid references residents(id) on delete cascade not null,
  author_id uuid references users(id) on delete set null not null,
  observation_type text check (observation_type in ('MEAL', 'MEDICATION', 'ACTIVITY', 'INCIDENT', 'HEALTH', 'GENERAL')),
  title text not null,
  content text not null,
  severity text check (severity in ('INFO', 'WARNING', 'URGENT')),
  visible_to_family boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references users(id) on delete cascade not null,
  resident_id uuid references residents(id) on delete cascade,
  title text not null,
  message text not null,
  notification_type text check (notification_type in ('INFO', 'ALERT', 'DOCUMENT', 'EVENT')),
  read_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_users_firebase_uid on users(firebase_uid);
create index if not exists idx_users_email on users(email);
create index if not exists idx_user_resident_links_user_id on user_resident_links(user_id);
create index if not exists idx_user_resident_links_resident_id on user_resident_links(resident_id);
create index if not exists idx_documents_resident_id on documents(resident_id);
create index if not exists idx_documents_uploaded_by on documents(uploaded_by);
create index if not exists idx_activity_logs_user_id on activity_logs(user_id);
create index if not exists idx_activity_logs_resident_id on activity_logs(resident_id);
create index if not exists idx_observations_resident_id on resident_observations(resident_id);
create index if not exists idx_observations_author_id on resident_observations(author_id);
create index if not exists idx_notifications_recipient on notifications(recipient_user_id);
```

5. **Cliquer** : "Run" (en bas à droite)
6. **Vérifier** : Message "Success. No rows returned" apparaît

---

### **2.4 Vérifier les tables créées**

1. **Menu latéral** → **Table Editor**
2. **Vérifier** présence de **7 tables** :
   - ✅ `users`
   - ✅ `residents`
   - ✅ `user_resident_links`
   - ✅ `documents`
   - ✅ `activity_logs`
   - ✅ `resident_observations`
   - ✅ `notifications`

---

## ☁️ ÉTAPE 3 : CONFIGURER VARIABLES CLOUDFLARE (10 minutes)

### **3.1 Accéder au Dashboard Cloudflare**

1. **Ouvrir** : https://dash.cloudflare.com/
2. **Se connecter** avec ton compte Cloudflare
3. **Menu latéral** → **Pages**
4. **Cliquer** sur le projet : **auberge-boischatel**
5. **Onglet** : **Settings**
6. **Scroller** → Section **"Environment variables"**

---

### **3.2 Ajouter les 10 variables d'environnement**

Pour **CHAQUE variable** ci-dessous :
- Cliquer **"Add variable"**
- Entrer **Variable name** (exactement comme écrit)
- Entrer **Value** (ta valeur de Firebase/Supabase)
- **Environment** : Cocher **Production**, **Preview**, **Development** (les 3)
- Cliquer **"Save"**

#### **Variables Firebase (Frontend) - 6 variables**

| Variable name | Value | Source |
|---------------|-------|--------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSy...` | Firebase Étape 1.3 → apiKey |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `auberge-boischatel.firebaseapp.com` | Firebase Étape 1.3 → authDomain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `auberge-boischatel` | Firebase Étape 1.3 → projectId |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `auberge-boischatel.appspot.com` | Firebase Étape 1.3 → storageBucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` | Firebase Étape 1.3 → messagingSenderId |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123456789012:web:abc123def456` | Firebase Étape 1.3 → appId |

#### **Variables Firebase (Backend) - 3 variables**

| Variable name | Value | Source |
|---------------|-------|--------|
| `FIREBASE_ADMIN_PROJECT_ID` | `auberge-boischatel` | Firebase Étape 1.4 → project_id |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@...iam.gserviceaccount.com` | Firebase Étape 1.4 → client_email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n` | Firebase Étape 1.4 → private_key |

**⚠️ IMPORTANT pour PRIVATE_KEY** :
- Copier TOUTE la clé avec les `\n` (retours à la ligne)
- Ne PAS supprimer les `\n`
- Exemple correct : `-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...\n-----END PRIVATE KEY-----\n`

#### **Variable Supabase - 1 variable**

| Variable name | Value | Source |
|---------------|-------|--------|
| `DATABASE_URL` | `postgresql://postgres...` | Supabase Étape 2.2 → URL complète avec mot de passe |

---

### **3.3 Redéployer automatiquement**

Après avoir ajouté toutes les variables :
1. Cloudflare **redéploie automatiquement** (prend ~30 secondes)
2. **OU** cliquer **"Create deployment"** si rien ne se passe

---

## ✅ ÉTAPE 4 : TESTS (15 minutes)

### **Test 1 : Connexion Database**

```bash
curl https://auberge-boischatel.pages.dev/api/dbTest
```

**✅ Résultat attendu** :
```json
{
  "success": true,
  "timestamp": "2025-11-25T...",
  "message": "Database connection successful"
}
```

**❌ Si erreur** : Vérifier DATABASE_URL dans Cloudflare

---

### **Test 2 : Créer un compte utilisateur**

1. **Ouvrir** : https://auberge-boischatel.pages.dev/
2. **Cliquer** : Bouton "Connexion" (header)
3. **Onglet** : "Créer un compte"
4. **Entrer** :
   - Email : `mathieu@aubergeboischatel.com`
   - Mot de passe : `Auberge2025!`
   - Confirmer : `Auberge2025!`
5. **Cliquer** : "Créer un compte"

**✅ Résultat attendu** :
- Modal se ferme
- Redirection vers `/client/dashboard`
- Dashboard affiche "Bonjour, Mathieu"

---

### **Test 3 : Vérifier dans Supabase**

1. **Supabase Dashboard** → **Table Editor** → Table **users**
2. **Vérifier** ligne avec :
   - email = `mathieu@aubergeboischatel.com`
   - role = `CLIENT`
   - active = `true`

---

### **Test 4 : Connexion**

1. Se déconnecter (menu utilisateur → Déconnexion)
2. Cliquer "Connexion"
3. Entrer credentials du compte créé
4. Vérifier redirection dashboard client

---

## 🎉 FÉLICITATIONS !

Si tous les tests passent, ton système est **100% fonctionnel** !

---

## 📞 BESOIN D'AIDE ?

### **Erreurs courantes** :

**"Database connection failed"**
→ Vérifier DATABASE_URL dans Cloudflare (mot de passe correct ?)

**"Firebase initialization error"**
→ Vérifier les 6 variables NEXT_PUBLIC_FIREBASE_* dans Cloudflare

**"Token verification error"**
→ Vérifier FIREBASE_ADMIN_PRIVATE_KEY (avec \n ?)

---

## 📚 PROCHAINES ÉTAPES

Après configuration complète :

1. **Créer utilisateurs test** :
   - 1 EMPLOYEE (pour tester dashboard staff)
   - 1 ADMIN (pour tester dashboard admin)

2. **Créer résidents test** via API

3. **Lier utilisateurs à résidents**

4. **Tester toutes les fonctionnalités**

---

**Guide complet disponible dans `README-API-DASHBOARDS.md` !**
