-- ============================================
-- SCHÉMA SQL - Extensions Dashboards Complets
-- L'Auberge Boischatel
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- Extension pour types de données avancés
create extension if not exists "pgcrypto";

-- ============================================
-- TABLE: documents
-- Stockage des documents liés aux résidents
-- ============================================

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid references residents(id) on delete cascade,
  title text not null,
  file_url text not null,
  file_type text, -- pdf, jpg, png, doc, etc.
  file_size_kb integer,
  uploaded_by uuid references users(id),
  visible_to_client boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index pour performance
create index if not exists idx_documents_resident_id on documents(resident_id);
create index if not exists idx_documents_uploaded_by on documents(uploaded_by);
create index if not exists idx_documents_created_at on documents(created_at desc);

-- ============================================
-- TABLE: activity_logs
-- Journal d'activités système et utilisateur
-- ============================================

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  resident_id uuid references residents(id) on delete set null,
  action text not null, -- 'created_resident', 'uploaded_document', 'login', etc.
  details text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default now()
);

-- Index pour performance
create index if not exists idx_activity_logs_user_id on activity_logs(user_id);
create index if not exists idx_activity_logs_resident_id on activity_logs(resident_id);
create index if not exists idx_activity_logs_created_at on activity_logs(created_at desc);
create index if not exists idx_activity_logs_action on activity_logs(action);

-- ============================================
-- TABLE: resident_observations
-- Notes quotidiennes des employés sur résidents
-- ============================================

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

-- Index pour performance
create index if not exists idx_observations_resident_id on resident_observations(resident_id);
create index if not exists idx_observations_author_id on resident_observations(author_id);
create index if not exists idx_observations_created_at on resident_observations(created_at desc);
create index if not exists idx_observations_type on resident_observations(observation_type);

-- ============================================
-- TABLE: notifications
-- Système de notifications pour familles
-- ============================================

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

-- Index pour performance
create index if not exists idx_notifications_recipient on notifications(recipient_user_id);
create index if not exists idx_notifications_resident_id on notifications(resident_id);
create index if not exists idx_notifications_read_at on notifications(read_at);
create index if not exists idx_notifications_created_at on notifications(created_at desc);

-- ============================================
-- TRIGGERS pour updated_at automatique
-- ============================================

-- Fonction trigger pour updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Appliquer aux tables avec updated_at
drop trigger if exists update_documents_updated_at on documents;
create trigger update_documents_updated_at
  before update on documents
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_observations_updated_at on resident_observations;
create trigger update_observations_updated_at
  before update on resident_observations
  for each row
  execute function update_updated_at_column();

-- ============================================
-- DONNÉES DE TEST (optionnel)
-- ============================================

-- Insérer un document test (décommenter si besoin)
-- INSERT INTO documents (resident_id, title, file_url, file_type, visible_to_client)
-- SELECT 
--   id,
--   'Rapport médical - Janvier 2025',
--   'https://example.com/rapport-medical-janvier.pdf',
--   'pdf',
--   true
-- FROM residents
-- LIMIT 1;

-- Insérer une observation test
-- INSERT INTO resident_observations (resident_id, author_id, observation_type, title, content, severity)
-- SELECT 
--   r.id,
--   u.id,
--   'HEALTH',
--   'Consultation infirmière',
--   'Pression artérielle normale. Bonne humeur ce matin.',
--   'INFO'
-- FROM residents r, users u
-- WHERE u.role = 'EMPLOYEE'
-- LIMIT 1;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Liste des tables créées
select table_name 
from information_schema.tables 
where table_schema = 'public' 
  and table_name in ('documents', 'activity_logs', 'resident_observations', 'notifications')
order by table_name;

-- Compter les tables existantes
select 
  'users' as table_name, count(*) as rows from users
union all
select 'residents', count(*) from residents
union all
select 'user_resident_links', count(*) from user_resident_links
union all
select 'documents', count(*) from documents
union all
select 'activity_logs', count(*) from activity_logs
union all
select 'resident_observations', count(*) from resident_observations
union all
select 'notifications', count(*) from notifications;
