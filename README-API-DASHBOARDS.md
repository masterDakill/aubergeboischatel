# 📡 API & Dashboards Complets - L'Auberge Boischatel

Guide complet des nouvelles API et dashboards interactifs implémentés.

---

## 🎯 Vue d'ensemble

Ce document décrit l'implémentation complète de :
- **3 Dashboards dynamiques** (Client, Staff, Admin)
- **4 Modules API CRUD** (Residents, Documents, Logs, Users)
- **Authentification & Autorisations** basées sur les rôles

---

## 📁 Fichiers créés/modifiés

### **Nouveaux fichiers créés :**

#### **SQL**
- `schema-dashboard-extensions.sql` - Schéma SQL pour 4 nouvelles tables (documents, activity_logs, resident_observations, notifications)

#### **Routes API (Backend)**
- `src/routes/residents.ts` - CRUD résidents + observations
- `src/routes/documents.ts` - Gestion documents + upload
- `src/routes/logs.ts` - Journaux d'activités
- `src/routes/users.ts` - Gestion utilisateurs (Admin)

#### **Dashboards (Frontend)**
- `public/static/client-dashboard.js` - Dashboard famille/clients
- `public/static/staff-dashboard.js` - Dashboard employés

#### **Modifiés**
- `src/index.tsx` - Imports routes API + dashboards dynamiques remplacés

---

## 🗄️ Nouvelles Tables SQL

### **1. documents**
Stockage des fichiers liés aux résidents.

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  resident_id UUID REFERENCES residents(id),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size_kb INTEGER,
  uploaded_by UUID REFERENCES users(id),
  visible_to_client BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **2. activity_logs**
Historique complet des actions système.

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  resident_id UUID REFERENCES residents(id),
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP
);
```

### **3. resident_observations**
Notes quotidiennes des employés sur les résidents.

```sql
CREATE TABLE resident_observations (
  id UUID PRIMARY KEY,
  resident_id UUID REFERENCES residents(id) NOT NULL,
  author_id UUID REFERENCES users(id) NOT NULL,
  observation_type TEXT CHECK (observation_type IN ('MEAL', 'MEDICATION', 'ACTIVITY', 'INCIDENT', 'HEALTH', 'GENERAL')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('INFO', 'WARNING', 'URGENT')),
  visible_to_family BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **4. notifications**
Système de notifications pour familles.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  recipient_user_id UUID REFERENCES users(id) NOT NULL,
  resident_id UUID REFERENCES residents(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT CHECK (notification_type IN ('INFO', 'ALERT', 'DOCUMENT', 'EVENT')),
  read_at TIMESTAMP,
  created_at TIMESTAMP
);
```

---

## 🔗 API Endpoints

### **Authentication Middleware**

Toutes les routes API (sauf auth) nécessitent un token Firebase :

```bash
Authorization: Bearer <idToken>
```

Obtenir le token :
```javascript
firebase.auth().currentUser.getIdToken().then(console.log)
```

---

### **1️⃣ API Residents** (`/api/residents`)

#### **GET /api/residents**
Liste tous les résidents (STAFF uniquement).

```bash
curl -X GET http://localhost:3000/api/residents \
  -H "Authorization: Bearer <TOKEN>"
```

**Response:**
```json
[
  {
    "id": "uuid...",
    "full_name": "Jean Tremblay",
    "room_number": "102",
    "admission_date": "2024-01-15",
    "date_of_birth": "1950-06-20",
    "emergency_contact_name": "Marie Tremblay",
    "emergency_contact_phone": "418-555-1234",
    "active": true,
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

---

#### **GET /api/residents/:id**
Détails d'un résident spécifique.

```bash
curl -X GET http://localhost:3000/api/residents/<RESIDENT_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

**Response (STAFF):**
```json
{
  "id": "uuid...",
  "full_name": "Jean Tremblay",
  "room_number": "102",
  "linked_users": [
    {
      "user_id": "uuid...",
      "relation": "Fils",
      "is_primary": true
    }
  ],
  ...
}
```

---

#### **POST /api/residents**
Créer un nouveau résident (STAFF uniquement).

```bash
curl -X POST http://localhost:3000/api/residents \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Marie Bouchard",
    "room_number": "214",
    "date_of_birth": "1948-03-12",
    "admission_date": "2025-01-20",
    "emergency_contact_name": "Pierre Bouchard",
    "emergency_contact_phone": "418-555-5678",
    "medical_notes": "Diabète de type 2"
  }'
```

**Response:**
```json
{
  "id": "uuid...",
  "full_name": "Marie Bouchard",
  "room_number": "214",
  ...
}
```

---

#### **PUT /api/residents/:id**
Mettre à jour un résident (STAFF uniquement).

```bash
curl -X PUT http://localhost:3000/api/residents/<RESIDENT_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "room_number": "215",
    "emergency_contact_phone": "418-555-9999"
  }'
```

---

#### **DELETE /api/residents/:id**
Désactiver un résident (ADMIN uniquement - soft delete).

```bash
curl -X DELETE http://localhost:3000/api/residents/<RESIDENT_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

#### **GET /api/residents/:id/observations**
Obtenir les observations d'un résident.

```bash
curl -X GET http://localhost:3000/api/residents/<RESIDENT_ID>/observations \
  -H "Authorization: Bearer <TOKEN>"
```

**Response:**
```json
[
  {
    "id": "uuid...",
    "observation_type": "HEALTH",
    "title": "Consultation infirmière",
    "content": "Pression artérielle normale. Bonne humeur.",
    "severity": "INFO",
    "visible_to_family": true,
    "created_at": "2025-01-20T08:30:00Z",
    "author_name": "Sophie Gagnon"
  }
]
```

---

#### **POST /api/residents/:id/observations**
Ajouter une observation (STAFF uniquement).

```bash
curl -X POST http://localhost:3000/api/residents/<RESIDENT_ID>/observations \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "observation_type": "MEAL",
    "title": "Repas du midi",
    "content": "Bon appétit. A tout mangé.",
    "severity": "INFO",
    "visible_to_family": false
  }'
```

---

### **2️⃣ API Documents** (`/api/documents`)

#### **GET /api/documents**
Liste documents (STAFF: tous, CLIENT: visibles uniquement).

```bash
# Tous les documents
curl -X GET http://localhost:3000/api/documents \
  -H "Authorization: Bearer <TOKEN>"

# Documents d'un résident spécifique
curl -X GET "http://localhost:3000/api/documents?resident_id=<RESIDENT_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response:**
```json
[
  {
    "id": "uuid...",
    "resident_id": "uuid...",
    "title": "Rapport médical - Janvier 2025",
    "file_url": "https://example.com/document.pdf",
    "file_type": "pdf",
    "file_size_kb": 245,
    "visible_to_client": true,
    "created_at": "2025-01-15T10:00:00Z",
    "resident_name": "Jean Tremblay",
    "room_number": "102",
    "uploaded_by_name": "Sophie Gagnon"
  }
]
```

---

#### **POST /api/documents**
Uploader un document (STAFF uniquement).

```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "resident_id": "<RESIDENT_ID>",
    "title": "Résultats analyses sanguines",
    "file_url": "https://storage.example.com/analyses-jan2025.pdf",
    "file_type": "pdf",
    "file_size_kb": 180,
    "visible_to_client": true
  }'
```

**Note:** Crée automatiquement notifications pour les familles liées si `visible_to_client = true`.

---

#### **PUT /api/documents/:id**
Modifier un document (STAFF uniquement).

```bash
curl -X PUT http://localhost:3000/api/documents/<DOC_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nouveau titre",
    "visible_to_client": false
  }'
```

---

#### **DELETE /api/documents/:id**
Supprimer un document (ADMIN uniquement).

```bash
curl -X DELETE http://localhost:3000/api/documents/<DOC_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

### **3️⃣ API Logs** (`/api/logs`)

#### **GET /api/logs**
Liste journaux d'activités (STAFF uniquement).

```bash
curl -X GET "http://localhost:3000/api/logs?limit=20&offset=0" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response:**
```json
[
  {
    "id": "uuid...",
    "action": "created_resident",
    "details": "Résident créé: Marie Bouchard - Chambre 214",
    "created_at": "2025-01-20T10:15:00Z",
    "user_name": "Sophie Gagnon",
    "resident_name": "Marie Bouchard"
  }
]
```

---

#### **POST /api/logs**
Créer un log manuel.

```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "custom_action",
    "details": "Action personnalisée effectuée",
    "resident_id": "<RESIDENT_ID>"
  }'
```

---

#### **GET /api/logs/resident/:resident_id**
Logs spécifiques à un résident (STAFF uniquement).

```bash
curl -X GET http://localhost:3000/api/logs/resident/<RESIDENT_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

### **4️⃣ API Users** (`/api/users`)

#### **GET /api/users**
Liste tous les utilisateurs (ADMIN uniquement).

```bash
# Tous les utilisateurs
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <TOKEN>"

# Filtrer par rôle
curl -X GET "http://localhost:3000/api/users?role=CLIENT" \
  -H "Authorization: Bearer <TOKEN>"

# Filtrer actifs/inactifs
curl -X GET "http://localhost:3000/api/users?active=true" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response:**
```json
[
  {
    "id": "uuid...",
    "firebase_uid": "...",
    "email": "mathieu@aubergeboischatel.com",
    "first_name": "Mathieu",
    "last_name": "Chamberland",
    "phone": "418-555-0000",
    "role": "CLIENT",
    "active": true,
    "created_at": "2025-01-15T10:00:00Z",
    "last_login": "2025-01-20T09:00:00Z",
    "linked_residents_count": 2
  }
]
```

---

#### **GET /api/users/:id**
Détails utilisateur avec résidents liés (ADMIN).

```bash
curl -X GET http://localhost:3000/api/users/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

**Response:**
```json
{
  "id": "uuid...",
  "email": "mathieu@aubergeboischatel.com",
  ...
  "linked_residents": [
    {
      "resident_id": "uuid...",
      "resident_name": "Jean Tremblay",
      "room_number": "102",
      "relation": "Fils",
      "is_primary": true
    }
  ]
}
```

---

#### **PUT /api/users/:id**
Modifier utilisateur (ADMIN uniquement).

```bash
curl -X PUT http://localhost:3000/api/users/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Nouveau Prénom",
    "role": "EMPLOYEE",
    "active": true
  }'
```

---

#### **POST /api/users/:user_id/link-resident**
Lier utilisateur à résident (ADMIN uniquement).

```bash
curl -X POST http://localhost:3000/api/users/<USER_ID>/link-resident \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "resident_id": "<RESIDENT_ID>",
    "relation": "Fille",
    "is_primary_contact": true
  }'
```

---

#### **DELETE /api/users/:user_id/link-resident/:resident_id**
Supprimer lien (ADMIN uniquement).

```bash
curl -X DELETE http://localhost:3000/api/users/<USER_ID>/link-resident/<RESIDENT_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

#### **GET /api/users/stats/summary**
Statistiques utilisateurs (ADMIN uniquement).

```bash
curl -X GET http://localhost:3000/api/users/stats/summary \
  -H "Authorization: Bearer <TOKEN>"
```

**Response:**
```json
{
  "clients_count": 25,
  "employees_count": 8,
  "admins_count": 2,
  "active_count": 33,
  "inactive_count": 2,
  "active_last_week": 28
}
```

---

## 🖥️ Dashboards

### **1. Client Dashboard** (`/client/dashboard`)

**URL:** http://localhost:3000/client/dashboard

**Fonctionnalités:**
- ✅ Affiche les résidents liés à l'utilisateur
- ✅ Liste des documents partagés avec dates
- ✅ Cartes résidents avec détails (chambre, relation, contact urgence)
- ✅ Téléchargement direct des documents
- ✅ Icônes dynamiques selon type de fichier
- ✅ Vérifie authentification + redirection automatique

**Script:** `public/static/client-dashboard.js`

---

### **2. Staff Dashboard** (`/staff/dashboard`)

**URL:** http://localhost:3000/staff/dashboard

**Fonctionnalités:**
- ✅ Statistiques en temps réel (résidents actifs, observations)
- ✅ Liste complète résidents (nom, chambre, admission, contact)
- ✅ Journaux d'activités récents
- ✅ Actions rapides (gérer résidents, ajouter observations)
- ✅ Badge ADMIN si rôle administrateur
- ✅ Vérification rôle EMPLOYEE/ADMIN obligatoire

**Script:** `public/static/staff-dashboard.js`

---

### **3. Admin Dashboard** (`/admin/dashboard`)

**URL:** http://localhost:3000/admin/dashboard

**Fonctionnalités:**
- ✅ Vue d'ensemble système (stats globales)
- ✅ Sections :
  - Gestion utilisateurs (rôles, permissions)
  - Supervision résidents
  - Liens famille ↔ résidents
  - Journaux système
  - Documents globaux
  - Paramètres système
- ✅ Design sombre avec accents rouges (ADMIN)
- ✅ Accès restreint rôle ADMIN uniquement

**Script:** HTML intégré dans `src/index.tsx`

---

## 🔐 Autorisations par Rôle

| Rôle | Endpoints accessibles |
|------|----------------------|
| **CLIENT** | `/api/auth/*`, `/api/documents` (visibles), `/api/residents/:id` (liés) |
| **EMPLOYEE** | CLIENT + `/api/residents/*`, `/api/documents/*`, `/api/logs/*`, observations |
| **ADMIN** | EMPLOYEE + `/api/users/*`, DELETE endpoints, liens utilisateurs-résidents |

---

## 🧪 Scénarios de Test Complets

### **Scénario 1: Créer un Résident (EMPLOYEE)**

```bash
# 1. Login en tant qu'employé
firebase.auth().signInWithEmailAndPassword('employee@aubergeboischatel.com', 'password')

# 2. Obtenir token
TOKEN=$(firebase.auth().currentUser.getIdToken())

# 3. Créer résident
curl -X POST http://localhost:3000/api/residents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Résident",
    "room_number": "301",
    "date_of_birth": "1955-05-15",
    "emergency_contact_name": "Contact Test",
    "emergency_contact_phone": "418-555-9999"
  }'

# 4. Vérifier dans Supabase Table Editor (residents)
```

---

### **Scénario 2: Uploader Document + Notifier Famille (STAFF)**

```bash
# 1. Créer document visible aux familles
curl -X POST http://localhost:3000/api/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resident_id": "<RESIDENT_ID>",
    "title": "Rapport mensuel",
    "file_url": "https://example.com/rapport.pdf",
    "file_type": "pdf",
    "visible_to_client": true
  }'

# 2. Vérifier notifications créées
# SELECT * FROM notifications WHERE resident_id = '<RESIDENT_ID>';
```

---

### **Scénario 3: Lier Utilisateur à Résident (ADMIN)**

```bash
# 1. Login admin
firebase.auth().signInWithEmailAndPassword('admin@aubergeboischatel.com', 'password')

# 2. Obtenir USER_ID et RESIDENT_ID
curl -X GET http://localhost:3000/api/users | jq '.[0].id'
curl -X GET http://localhost:3000/api/residents | jq '.[0].id'

# 3. Créer lien
curl -X POST http://localhost:3000/api/users/<USER_ID>/link-resident \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resident_id": "<RESIDENT_ID>",
    "relation": "Fils",
    "is_primary_contact": true
  }'

# 4. Vérifier dans Supabase
# SELECT * FROM user_resident_links;
```

---

### **Scénario 4: Dashboard Client Complet**

```bash
# 1. Créer compte CLIENT
firebase.auth().createUserWithEmailAndPassword('famille@test.com', 'password')

# 2. Lier à un résident (via ADMIN)
# (voir Scénario 3)

# 3. Ouvrir dashboard
http://localhost:3000/client/dashboard

# 4. Vérifier :
# - Carte résident affichée avec nom, chambre, relation
# - Documents listés avec dates
# - Téléchargement documents fonctionne
```

---

## 📊 Monitoring & Logs

### **Vérifier Logs d'Activités**

```bash
# Tous les logs récents
curl -X GET "http://localhost:3000/api/logs?limit=50" \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | {action, details, created_at, user_name}'

# Logs d'un résident spécifique
curl -X GET http://localhost:3000/api/logs/resident/<RESIDENT_ID> \
  -H "Authorization: Bearer $TOKEN"
```

---

## ⚠️ Troubleshooting

### **Erreur: "Forbidden: Staff role required"**
- Vérifier rôle utilisateur dans table `users`
- Mettre à jour : `UPDATE users SET role = 'EMPLOYEE' WHERE email = 'user@example.com'`

### **Erreur: "User not found in database"**
- Appeler `/api/auth/syncUser` avec idToken pour créer user PostgreSQL

### **Dashboard vide (pas de résidents affichés)**
- Vérifier liens dans `user_resident_links` table
- Utiliser endpoint ADMIN `/api/users/:id/link-resident` pour créer liens

### **Documents non visibles pour CLIENT**
- Vérifier `visible_to_client = true` dans table `documents`
- Confirmer lien utilisateur-résident existe

---

## 🚀 Prochaines Étapes

1. **Implémenter upload réel de fichiers** (R2 Storage)
2. **Ajouter page `/staff/residents` complète** (CRUD avec interface)
3. **Système de notifications en temps réel** (WebSockets ou Polling)
4. **Calendrier d'activités** (événements, rendez-vous médicaux)
5. **Rapports automatiques** (génération PDF)
6. **Dashboard analytique ADMIN** (graphiques, tendances)

---

## 📚 Ressources

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Firebase Console**: https://console.firebase.google.com/
- **Hono Docs**: https://hono.dev/
- **README Auth**: `README-AUTH.md`

---

**Projet prêt pour développement avancé des portails !** 🎉
