# 🔐 Guide d'Authentification - L'Auberge Boischatel

Ce guide explique comment configurer et tester l'authentification Firebase + Supabase PostgreSQL intégrée dans le projet.

---

## 📁 Fichiers créés/modifiés

### **Fichiers créés :**

1. **`src/lib/db.ts`** - PostgreSQL connection pool (Supabase)
2. **`src/lib/firebaseAdmin.ts`** - Firebase Admin SDK pour vérification tokens côté serveur
3. **`src/lib/firebase.config.ts`** - Configuration Firebase client + helper pour injection env vars
4. **`src/routes/auth.ts`** - Routes API `/api/auth/syncUser` et `/api/auth/me`
5. **`src/routes/dbTest.ts`** - Route API `/api/dbTest` pour tester connexion DB
6. **`public/static/auth.js`** - Gestionnaire d'authentification client (Firebase Auth)

### **Fichiers modifiés :**

1. **`src/index.tsx`** :
   - Import des routes auth et dbTest
   - Ajout LoginModal HTML avec onglets (Connexion / Créer un compte)
   - Injection scripts Firebase SDK (app-compat + auth-compat)
   - Injection script d'environnement `window.ENV`
   - Ajout routes `/client/dashboard` et `/staff/dashboard`

2. **`.env.local`** - Déjà configuré avec template complet

---

## ⚙️ Configuration initiale

### **Étape 1 : Firebase Project**

1. Aller sur https://console.firebase.google.com/
2. Cliquer **"Ajouter un projet"**
3. Nom du projet : `auberge-boischatel`
4. Désactiver Google Analytics (optionnel)
5. Créer le projet

#### **A. Activer Authentication Email/Password**

1. Menu latéral → **Authentication**
2. Cliquer **"Commencer"**
3. Onglet **"Sign-in method"**
4. Activer **"Email/Mot de passe"**
5. Sauvegarder

#### **B. Obtenir les clés client (Frontend)**

1. Icône engrenage ⚙️ → **Paramètres du projet**
2. Section **"Vos applications"** → Cliquer icône **Web** `</>`
3. Nom de l'app : `auberge-boischatel-web`
4. Cliquer **"Enregistrer l'app"**
5. Copier les valeurs dans `.env.local` :

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=auberge-boischatel.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=auberge-boischatel
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=auberge-boischatel.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123
```

#### **C. Obtenir les clés Service Account (Backend)**

1. Paramètres du projet → Onglet **"Comptes de service"**
2. Cliquer **"Générer une nouvelle clé privée"**
3. Télécharger le fichier JSON
4. Extraire et copier dans `.env.local` :

```bash
FIREBASE_ADMIN_PROJECT_ID=auberge-boischatel
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@auberge-boischatel.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...\n-----END PRIVATE KEY-----\n"
```

**⚠️ IMPORTANT** : Le `private_key` doit conserver les `\n` (retours à la ligne).

---

### **Étape 2 : Supabase PostgreSQL**

1. Aller sur https://supabase.com/
2. Créer un compte (GitHub recommandé)
3. Cliquer **"New project"**
4. Organization : Créer `auberge-boischatel`
5. Nom du projet : `auberge-boischatel-production`
6. Database Password : **Générer automatiquement** (copier le mot de passe !)
7. Region : **Canada (Central)** (plus proche de Québec)
8. Pricing Plan : **Free**
9. Créer le projet (attendre 1-2 minutes)

#### **A. Obtenir DATABASE_URL**

1. Menu latéral → **Settings** → **Database**
2. Section **"Connection string"**
3. Mode : **URI**
4. Copier l'URL :

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

5. **Remplacer `[YOUR-PASSWORD]`** par le mot de passe copié à l'étape de création
6. Coller dans `.env.local`

#### **B. Exécuter le schéma SQL**

1. Menu latéral → **SQL Editor**
2. Cliquer **"+ New query"**
3. Copier-coller le schéma SQL suivant :

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

-- Create indexes for performance
create index if not exists idx_users_firebase_uid on users(firebase_uid);
create index if not exists idx_users_email on users(email);
create index if not exists idx_user_resident_links_user_id on user_resident_links(user_id);
create index if not exists idx_user_resident_links_resident_id on user_resident_links(resident_id);
```

4. Cliquer **"Run"** (en bas à droite)
5. Vérifier : **"Success. No rows returned"**

#### **C. Vérifier les tables créées**

1. Menu latéral → **Table Editor**
2. Vérifier présence de 3 tables :
   - ✅ `users`
   - ✅ `residents`
   - ✅ `user_resident_links`

---

## 🧪 Tests

### **Test 1 : Connexion Database**

```bash
# Terminal
cd /home/user/webapp
npm run build
pm2 start ecosystem.config.cjs

# Test API
curl http://localhost:3000/api/dbTest
```

**Résultat attendu :**
```json
{
  "success": true,
  "timestamp": "2025-01-15T14:23:45.123Z",
  "message": "Database connection successful",
  "database": "Connected"
}
```

**Si erreur** : Vérifier `DATABASE_URL` dans `.env.local`

---

### **Test 2 : Créer un compte utilisateur**

1. Ouvrir http://localhost:3000
2. Cliquer bouton **"Connexion"** dans le header
3. Cliquer onglet **"Créer un compte"**
4. Entrer :
   - Email : `test@aubergeboischatel.com`
   - Mot de passe : `Test123!`
   - Confirmer : `Test123!`
5. Cliquer **"Créer un compte"**

**Résultat attendu :**
- Modal se ferme
- Redirection vers `/client/dashboard`
- Message : "Espace Client - L'Auberge Boischatel"

---

### **Test 3 : Vérifier user dans PostgreSQL**

#### **Via Supabase Dashboard :**

1. Menu latéral → **Table Editor**
2. Sélectionner table **`users`**
3. Vérifier présence d'une ligne avec :
   - `email` = test@aubergeboischatel.com
   - `role` = CLIENT
   - `active` = true
   - `firebase_uid` = (valeur Firebase)

#### **Via SQL Editor :**

```sql
SELECT * FROM users WHERE email = 'test@aubergeboischatel.com';
```

---

### **Test 4 : Connexion avec compte existant**

1. Se déconnecter (menu utilisateur → Déconnexion)
2. Cliquer **"Connexion"**
3. Onglet **"Connexion"**
4. Entrer credentials du compte créé
5. Cliquer **"Se connecter"**

**Résultat attendu :**
- Redirection vers `/client/dashboard`
- Menu utilisateur affiche initiale + nom

---

### **Test 5 : API /api/auth/me**

```bash
# 1. Login via browser (étape précédente)

# 2. Obtenir ID token (console browser) :
firebase.auth().currentUser.getIdToken().then(console.log)

# 3. Copier le token et tester :
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

**Résultat attendu :**
```json
{
  "id": "uuid...",
  "email": "test@aubergeboischatel.com",
  "first_name": "test",
  "last_name": "",
  "phone": null,
  "role": "CLIENT",
  "active": true,
  "created_at": "2025-01-15T...",
  "last_login": "2025-01-15T...",
  "residents": []
}
```

---

## 🚀 Déploiement Vercel

### **Étape 1 : Variables d'environnement Vercel**

1. Dashboard Vercel → Projet → **Settings** → **Environment Variables**
2. Ajouter **TOUTES** les variables de `.env.local` :

**Obligatoires :**
- `DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

**Pour chaque variable :**
- Nom : (copier exactement)
- Value : (copier valeur de `.env.local`)
- Environments : **Production**, **Preview**, **Development**

3. Cliquer **"Save"** pour chaque variable

---

### **Étape 2 : Déployer**

```bash
# Commit et push
git add .
git commit -m "feat: Add Firebase Auth + Supabase PostgreSQL integration"
git push origin main
```

**Vercel déploiera automatiquement** si projet lié à GitHub.

---

### **Étape 3 : Tester en production**

1. Ouvrir `https://your-project.vercel.app`
2. Tester `/api/dbTest`
3. Créer compte test
4. Vérifier user dans Supabase

---

## 🎯 Architecture

### **Flow d'authentification :**

```
1. User clique "Connexion" → LoginModal s'ouvre
2. User entre email/password → Firebase Auth (client-side)
3. Firebase retourne idToken → Envoyé à /api/auth/syncUser
4. Backend vérifie token (Firebase Admin) → Valide
5. Backend cherche user dans PostgreSQL (firebase_uid)
   - Si inexistant → Créer avec role CLIENT par défaut
   - Si existe → Update last_login
6. Backend retourne user data → Frontend
7. Frontend affiche menu utilisateur + redirige selon role
```

### **Rôles et redirections :**

| Role | Redirection après login | Accès |
|------|------------------------|-------|
| CLIENT | `/client/dashboard` | Voir résidents liés, documents partagés |
| EMPLOYEE | `/staff/dashboard` | Gestion résidents, horaires, rapports |
| ADMIN | `/staff/dashboard` | Toutes fonctionnalités + gestion utilisateurs |

---

## 🐛 Troubleshooting

### **Erreur : "Database connection failed"**

**Cause** : `DATABASE_URL` invalide ou Supabase non configuré

**Solution** :
1. Vérifier `DATABASE_URL` dans `.env.local`
2. Tester connexion avec `psql` :
   ```bash
   psql "postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres" -c "\dt"
   ```
3. Vérifier tables existent

---

### **Erreur : "Firebase initialization error"**

**Cause** : Clés Firebase manquantes ou invalides

**Solution** :
1. Vérifier toutes variables `NEXT_PUBLIC_FIREBASE_*` dans `.env.local`
2. Tester dans console browser :
   ```javascript
   console.log(window.ENV)
   ```
3. Vérifier injection script dans HTML

---

### **Erreur : "Token verification error"**

**Cause** : Service Account Firebase mal configuré

**Solution** :
1. Vérifier `FIREBASE_ADMIN_PRIVATE_KEY` contient bien `\n`
2. Télécharger nouveau Service Account JSON
3. Copier exactement les valeurs

---

### **Erreur : "User not found in database"**

**Cause** : User existe dans Firebase mais pas dans PostgreSQL

**Solution** :
1. Appeler manuellement `/api/auth/syncUser` avec idToken
2. Vérifier table `users` dans Supabase
3. Vérifier logs backend (PM2 logs)

---

## 📚 Ressources

- **Firebase Console** : https://console.firebase.google.com/
- **Supabase Dashboard** : https://supabase.com/dashboard
- **Vercel Dashboard** : https://vercel.com/dashboard
- **Firebase Auth Docs** : https://firebase.google.com/docs/auth
- **Supabase Docs** : https://supabase.com/docs

---

## ✅ Checklist finale

- [ ] Firebase project créé et Auth activé
- [ ] Clés Firebase copiées dans `.env.local`
- [ ] Supabase project créé et schema.sql exécuté
- [ ] DATABASE_URL ajouté à `.env.local`
- [ ] `/api/dbTest` retourne success
- [ ] Compte test créé via UI
- [ ] User visible dans table Supabase `users`
- [ ] Login/logout fonctionnels
- [ ] Redirections selon role fonctionnelles
- [ ] Variables env ajoutées dans Vercel
- [ ] Déploiement production réussi

---

**Projet prêt pour développement des portails Client et Employé !** 🎉
