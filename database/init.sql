-- CyberLens Database Schema
-- PostgreSQL Initialization Script

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE upload_status AS ENUM ('pending', 'parsing', 'parsed', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE investigation_status AS ENUM ('in_progress', 'completed', 'reviewed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recommendation_priority AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recommendation_status AS ENUM ('open', 'in_progress', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role user_role DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_owner ON projects(owner_id);

-- ============================================================
-- UPLOADS
-- ============================================================

CREATE TABLE IF NOT EXISTS uploads (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT,
    status upload_status DEFAULT 'pending',
    total_events INTEGER DEFAULT 0,
    parsed_events INTEGER DEFAULT 0,
    error_message VARCHAR(2000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_uploads_project ON uploads(project_id);
CREATE INDEX idx_uploads_user ON uploads(user_id);

-- ============================================================
-- LOG ENTRIES
-- ============================================================

CREATE TABLE IF NOT EXISTS log_entries (
    id SERIAL PRIMARY KEY,
    upload_id INTEGER NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    raw_content TEXT NOT NULL,
    parsed_data JSONB,
    line_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_log_entries_upload ON log_entries(upload_id);
CREATE INDEX idx_log_entries_project ON log_entries(project_id);

-- ============================================================
-- NORMALIZED EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS normalized_events (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    upload_id INTEGER NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    log_entry_id INTEGER REFERENCES log_entries(id) ON DELETE SET NULL,
    event_id VARCHAR(100),
    event_name VARCHAR(500),
    timestamp TIMESTAMP NOT NULL,
    source_type VARCHAR(50),
    source_name VARCHAR(255),
    computer_name VARCHAR(255),
    user_name VARCHAR(255),
    ip_address VARCHAR(45),
    process_name VARCHAR(500),
    process_id INTEGER,
    parent_process VARCHAR(500),
    command_line TEXT,
    file_path VARCHAR(1000),
    registry_key VARCHAR(1000),
    network_connection JSONB,
    severity VARCHAR(20) DEFAULT 'info',
    mitre_technique_id VARCHAR(50),
    mitre_technique_name VARCHAR(500),
    raw_data JSONB,
    hash_value VARCHAR(64),
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_normalized_events_project ON normalized_events(project_id);
CREATE INDEX idx_normalized_events_upload ON normalized_events(upload_id);
CREATE INDEX idx_normalized_events_timestamp ON normalized_events(timestamp);
CREATE INDEX idx_normalized_events_computer ON normalized_events(computer_name);
CREATE INDEX idx_normalized_events_user ON normalized_events(user_name);
CREATE INDEX idx_normalized_events_ip ON normalized_events(ip_address);
CREATE INDEX idx_normalized_events_severity ON normalized_events(severity);

-- ============================================================
-- INVESTIGATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS investigations (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    status investigation_status DEFAULT 'in_progress',
    attack_type VARCHAR(255),
    attack_score INTEGER,
    summary TEXT,
    timeline JSONB,
    evidence JSONB,
    affected_systems JSONB,
    mitre_mapping JSONB,
    recommendations JSONB,
    confidence_score INTEGER,
    raw_llm_response JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_investigations_project ON investigations(project_id);
CREATE INDEX idx_investigations_user ON investigations(user_id);
CREATE INDEX idx_investigations_status ON investigations(status);

-- ============================================================
-- REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    investigation_id INTEGER NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    report_type VARCHAR(50) DEFAULT 'full',
    executive_summary TEXT,
    technical_summary TEXT,
    timeline JSONB,
    evidence JSONB,
    affected_systems JSONB,
    mitre_techniques JSONB,
    recommendations JSONB,
    pdf_path VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_investigation ON reports(investigation_id);
CREATE INDEX idx_reports_project ON reports(project_id);

-- ============================================================
-- RECOMMENDATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    investigation_id INTEGER NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority recommendation_priority DEFAULT 'medium',
    category VARCHAR(100),
    affected_systems VARCHAR(1000),
    status recommendation_status DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_investigation ON recommendations(investigation_id);
CREATE INDEX idx_recommendations_project ON recommendations(project_id);

-- ============================================================
-- CHAT HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    investigation_id INTEGER NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_history_investigation ON chat_history(investigation_id);
CREATE INDEX idx_chat_history_project ON chat_history(project_id);

-- ============================================================
-- SEED DATA: Default Admin User (password: admin123)
-- ============================================================

INSERT INTO users (email, username, hashed_password, full_name, role, is_active)
VALUES (
    'admin@cyberlens.io',
    'admin',
    crypt('admin123', gen_salt('bf')),
    'Administrator',
    'admin',
    TRUE
) ON CONFLICT (username) DO NOTHING;

INSERT INTO users (email, username, hashed_password, full_name, role, is_active)
VALUES (
    'analyst@cyberlens.io',
    'analyst',
    crypt('analyst123', gen_salt('bf')),
    'Security Analyst',
    'analyst',
    TRUE
) ON CONFLICT (username) DO NOTHING;

INSERT INTO users (email, username, hashed_password, full_name, role, is_active)
VALUES (
    'viewer@cyberlens.io',
    'viewer',
    crypt('viewer123', gen_salt('bf')),
    'Read Only User',
    'viewer',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- SEED DATA: Demo Project
-- ============================================================

INSERT INTO projects (name, description, owner_id, status)
SELECT 'Demo Investigation', 'Sample project for evaluating CyberLens capabilities', id, 'active'
FROM users WHERE username = 'admin'
AND NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Demo Investigation');
