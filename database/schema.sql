-- =============================================================================
-- L'Auberge Boischatel - PostgreSQL Database Schema
-- =============================================================================
-- Optimized for: Supabase, Neon, Railway
-- Compatible with: PostgreSQL 14+
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLE: users (Clients + Employees + Admins)
-- =============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('CLIENT', 'EMPLOYEE', 'ADMIN')) DEFAULT 'CLIENT',
  active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT phone_format CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$')
);

-- Indexes for performance
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Comment
COMMENT ON TABLE users IS 'All users: clients (family members), employees (staff), and admins';
COMMENT ON COLUMN users.role IS 'USER_ROLE: CLIENT for family, EMPLOYEE for staff, ADMIN for management';

-- =============================================================================
-- TABLE: residents (Résidents de l'Auberge)
-- =============================================================================
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  room_number TEXT,
  admission_date DATE DEFAULT CURRENT_DATE,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'OTHER')),
  medical_notes TEXT,
  dietary_restrictions TEXT,
  mobility_level TEXT CHECK (mobility_level IN ('INDEPENDENT', 'ASSISTED', 'WHEELCHAIR', 'BEDRIDDEN')),
  
  -- Emergency contacts
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  
  -- Status
  active BOOLEAN DEFAULT true,
  discharge_date DATE,
  discharge_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_admission CHECK (admission_date <= CURRENT_DATE),
  CONSTRAINT valid_discharge CHECK (discharge_date IS NULL OR discharge_date >= admission_date),
  CONSTRAINT valid_birth_date CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE)
);

-- Indexes
CREATE INDEX idx_residents_room_number ON residents(room_number);
CREATE INDEX idx_residents_active ON residents(active);
CREATE INDEX idx_residents_admission_date ON residents(admission_date DESC);
CREATE INDEX idx_residents_full_name ON residents(full_name);

-- Full-text search index
CREATE INDEX idx_residents_search ON residents USING gin(to_tsvector('french', full_name));

COMMENT ON TABLE residents IS 'Residents of L''Auberge Boischatel';

-- =============================================================================
-- TABLE: user_resident_links (Association Clients ↔ Résidents)
-- =============================================================================
CREATE TABLE user_resident_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  relation TEXT NOT NULL, -- 'fils', 'fille', 'conjoint', 'proche aidant', 'tuteur', 'autre'
  is_primary_contact BOOLEAN DEFAULT false,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_user_resident UNIQUE (user_id, resident_id),
  CONSTRAINT valid_relation CHECK (relation IN (
    'fils', 'fille', 'conjoint', 'parent', 
    'proche aidant', 'tuteur', 'ami', 'autre'
  ))
);

-- Indexes
CREATE INDEX idx_links_user_id ON user_resident_links(user_id);
CREATE INDEX idx_links_resident_id ON user_resident_links(resident_id);
CREATE INDEX idx_links_primary ON user_resident_links(is_primary_contact) WHERE is_primary_contact = true;

COMMENT ON TABLE user_resident_links IS 'Links between client users and residents (family relationships)';

-- =============================================================================
-- TABLE: documents (Documents partagés)
-- =============================================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'image', 'doc', 'xlsx', 'other'
  file_size_bytes BIGINT,
  mime_type TEXT,
  
  -- Access control
  uploaded_by UUID REFERENCES users(id),
  visible_to_client BOOLEAN DEFAULT false,
  visible_to_staff BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_file_type CHECK (file_type IN ('pdf', 'image', 'doc', 'xlsx', 'other')),
  CONSTRAINT valid_file_size CHECK (file_size_bytes IS NULL OR file_size_bytes > 0)
);

-- Indexes
CREATE INDEX idx_documents_resident_id ON documents(resident_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_visible_client ON documents(visible_to_client) WHERE visible_to_client = true;
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

COMMENT ON TABLE documents IS 'Documents shared between staff and clients';

-- =============================================================================
-- TABLE: activity_logs (Logs d'activité)
-- =============================================================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'view_document', 'update_profile', etc.
  resource_type TEXT, -- 'document', 'resident', 'user', etc.
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_action CHECK (action IN (
    'login', 'logout', 'signup', 
    'view_document', 'upload_document', 'delete_document',
    'view_resident', 'update_resident', 
    'update_profile', 'change_password',
    'admin_action'
  ))
);

-- Indexes
CREATE INDEX idx_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_logs_action ON activity_logs(action);
CREATE INDEX idx_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_logs_resource ON activity_logs(resource_type, resource_id) WHERE resource_id IS NOT NULL;

-- Partitioning by month for better performance (optional for large datasets)
-- CREATE TABLE activity_logs_2025_01 PARTITION OF activity_logs
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

COMMENT ON TABLE activity_logs IS 'Audit trail of all user actions';

-- =============================================================================
-- TABLE: notifications (Notifications système)
-- =============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'alert', 'success')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read, created_at DESC) WHERE read = false;

COMMENT ON TABLE notifications IS 'In-app notifications for users';

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_residents_updated_at BEFORE UPDATE ON residents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Log user login activity
CREATE OR REPLACE FUNCTION log_user_login()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action = 'login' THEN
    UPDATE users SET last_login = now() WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_user_login
AFTER INSERT ON activity_logs
FOR EACH ROW WHEN (NEW.action = 'login')
EXECUTE FUNCTION log_user_login();

-- Function: Ensure only one primary contact per resident
CREATE OR REPLACE FUNCTION enforce_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary_contact = true THEN
    UPDATE user_resident_links 
    SET is_primary_contact = false 
    WHERE resident_id = NEW.resident_id 
      AND user_id != NEW.user_id 
      AND is_primary_contact = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_primary_contact
BEFORE INSERT OR UPDATE ON user_resident_links
FOR EACH ROW
EXECUTE FUNCTION enforce_single_primary_contact();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - Supabase Security
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_resident_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (examples - customize based on your needs)

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = firebase_uid);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE firebase_uid = auth.uid()::text 
      AND role = 'ADMIN'
    )
  );

-- Clients can view residents they are linked to
CREATE POLICY "Clients view linked residents" ON residents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_resident_links url
      JOIN users u ON u.id = url.user_id
      WHERE u.firebase_uid = auth.uid()::text
      AND url.resident_id = residents.id
    )
  );

-- Staff can view all residents
CREATE POLICY "Staff view all residents" ON residents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE firebase_uid = auth.uid()::text
      AND role IN ('EMPLOYEE', 'ADMIN')
    )
  );

-- =============================================================================
-- SAMPLE DATA (Development/Testing)
-- =============================================================================

-- Insert admin user
INSERT INTO users (firebase_uid, email, first_name, last_name, role, email_verified) VALUES
  ('admin-uid-001', 'admin@aubergeboischatel.com', 'Mathieu', 'Chamberland', 'ADMIN', true)
ON CONFLICT (firebase_uid) DO NOTHING;

-- Insert employee
INSERT INTO users (firebase_uid, email, first_name, last_name, role, email_verified) VALUES
  ('employee-uid-001', 'noemie@aubergeboischatel.com', 'Noémie', 'Gamache', 'EMPLOYEE', true)
ON CONFLICT (firebase_uid) DO NOTHING;

-- Insert sample residents
INSERT INTO residents (full_name, room_number, admission_date, date_of_birth, gender) VALUES
  ('Jean Tremblay', '101', '2024-01-15', '1945-06-12', 'M'),
  ('Marie Bouchard', '102', '2024-03-20', '1948-09-25', 'F'),
  ('Claude Gagnon', '103', '2024-06-10', '1942-11-30', 'M')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Analyze tables for query optimization
ANALYZE users;
ANALYZE residents;
ANALYZE user_resident_links;
ANALYZE documents;
ANALYZE activity_logs;
ANALYZE notifications;

-- =============================================================================
-- GRANTS (if using custom roles)
-- =============================================================================

-- GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON residents TO authenticated;
-- GRANT SELECT, INSERT ON activity_logs TO authenticated;

-- =============================================================================
-- SCHEMA COMPLETE
-- =============================================================================

SELECT 'L''Auberge Boischatel database schema created successfully!' AS status;
