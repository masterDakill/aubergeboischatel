/**
 * Script pour créer les données de démonstration
 * Exécuter avec: node scripts/setup-demo-data.mjs
 */

const DATABASE_URL = "postgresql://neondb_owner:npg_oS06JUwOVKER@ep-weathered-firefly-ad5p3fgc.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function runSQL(sql) {
  // Parse connection string
  const url = new URL(DATABASE_URL);
  const host = url.hostname;
  const database = url.pathname.slice(1);
  const user = url.username;
  const password = url.password;

  // Neon HTTP API endpoint
  const apiUrl = `https://${host}/sql`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${password}`,
      'Neon-Connection-String': DATABASE_URL,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL Error: ${response.status} - ${text}`);
  }

  return response.json();
}

async function main() {
  console.log('🚀 Configuration des données de démonstration...\n');

  // 1. Vérifier les tables existantes
  console.log('📋 Vérification des tables...');
  try {
    const tables = await runSQL(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('Tables existantes:', tables);
  } catch (err) {
    console.log('Note: Utilisation de la méthode alternative...');
  }

  // 2. Créer les résidents
  console.log('\n👴 Création des résidents de démonstration...');

  const residentsSQL = `
    INSERT INTO residents (id, full_name, room_number, date_of_birth, admission_date, medical_notes, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, active, created_at, updated_at)
    VALUES
      (gen_random_uuid(), 'Marie Dubois', '101A', '1942-03-18', '2023-08-12', 'Mobilité réduite, suivi nutrition', 'Paul Dubois', '418-555-1010', 'Fils', true, NOW(), NOW()),
      (gen_random_uuid(), 'Jean Martin', '205B', '1938-11-02', '2022-03-04', 'Problèmes cardiaques mineurs', 'Sophie Martin', '581-555-2050', 'Fille', true, NOW(), NOW()),
      (gen_random_uuid(), 'Claire Bouchard', '308C', '1946-01-22', '2024-01-15', 'Alzheimer léger', 'Marc Bouchard', '418-555-3081', 'Fils', true, NOW(), NOW())
    ON CONFLICT DO NOTHING;
  `;

  // On va utiliser la librairie postgres pour Neon
  console.log('\n📌 SQL à exécuter dans Neon Console (https://console.neon.tech):');
  console.log('─'.repeat(60));
  console.log(`
-- ============================================
-- DONNÉES DE DÉMONSTRATION - L'Auberge Boischatel
-- Exécuter dans Neon SQL Editor
-- ============================================

-- 1. CRÉER LES TABLES (si pas encore fait)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'CLIENT' CHECK (role IN ('CLIENT', 'EMPLOYEE', 'ADMIN')),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(200) NOT NULL,
  room_number VARCHAR(20),
  date_of_birth DATE,
  admission_date DATE DEFAULT CURRENT_DATE,
  medical_notes TEXT,
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_resident_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  relation VARCHAR(100),
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, resident_id)
);

CREATE TABLE IF NOT EXISTS resident_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  observation_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'URGENT')),
  visible_to_family BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  resident_id UUID REFERENCES residents(id),
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  file_path TEXT,
  file_type VARCHAR(50),
  document_type VARCHAR(50),
  file_size_kb INTEGER,
  visible_to_client BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. CRÉER LES RÉSIDENTS DE DÉMONSTRATION
-- ============================================

INSERT INTO residents (full_name, room_number, date_of_birth, admission_date, medical_notes, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, active)
VALUES
  ('Marie Dubois', '101A', '1942-03-18', '2023-08-12', 'Mobilité réduite, suivi nutrition', 'Paul Dubois', '418-555-1010', 'Fils', true),
  ('Jean Martin', '205B', '1938-11-02', '2022-03-04', 'Problèmes cardiaques mineurs', 'Sophie Martin', '581-555-2050', 'Fille', true),
  ('Claire Bouchard', '308C', '1946-01-22', '2024-01-15', 'Alzheimer léger', 'Marc Bouchard', '418-555-3081', 'Fils', true)
ON CONFLICT DO NOTHING;

-- 3. VÉRIFICATION
-- ============================================

SELECT 'Résidents créés:' as info, count(*) as count FROM residents;
SELECT id, full_name, room_number FROM residents;
  `);
  console.log('─'.repeat(60));

  console.log(`
╔════════════════════════════════════════════════════════════╗
║  ÉTAPES SUIVANTES                                          ║
╠════════════════════════════════════════════════════════════╣
║  1. Va sur https://console.neon.tech                       ║
║  2. Sélectionne le projet "Dshboard_auberge"               ║
║  3. Clique sur "SQL Editor"                                ║
║  4. Copie-colle le SQL ci-dessus et exécute                ║
║                                                            ║
║  Ensuite, crée les utilisateurs Firebase:                  ║
║  - employe.demo@auberge.com / Auberge123!                  ║
║  - famille.demo@auberge.com / Famille123!                  ║
║                                                            ║
║  Puis ajoute-les dans la table users avec leur UID         ║
╚════════════════════════════════════════════════════════════╝
  `);
}

main().catch(console.error);
