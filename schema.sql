-- ============================================================================
-- JobHub — Database Schema
-- ----------------------------------------------------------------------------
-- PostgreSQL 16 schema for the JobHub full-stack job board platform.
--
-- This script is idempotent and self-contained. It creates the full relational
-- model (users, jobs, applications), all indexes and foreign keys, and inserts
-- a small set of seed data for local development and demo purposes.
--
-- Column names mirror the Sequelize models exactly:
--   * Default (camelCase) timestamps: "createdAt", "updatedAt"
--   * Foreign keys follow Sequelize's association convention: "userId", "jobId"
--   * Snake_case attributes defined in the models: is_active, salary_min,
--     salary_max, cover_letter
--
-- Seed users share the password: password123  (bcrypt, 10 rounds)
--
-- Usage:
--   psql "$DATABASE_URL" -f schema.sql
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
-- pgcrypto provides gen_random_uuid() for server-side UUID generation, matching
-- the Sequelize DataTypes.UUIDV4 default on each primary key.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enumerated types
-- ----------------------------------------------------------------------------
-- Mirrors DataTypes.ENUM('employer', 'candidate') on the User model.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
        CREATE TYPE enum_users_role AS ENUM ('employer', 'candidate');
    END IF;
END$$;

-- Application lifecycle states reviewed by the employer.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_applications_status') THEN
        CREATE TYPE enum_applications_status AS ENUM ('pending', 'reviewed', 'accepted', 'rejected');
    END IF;
END$$;

-- ----------------------------------------------------------------------------
-- Table: users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255)        NOT NULL UNIQUE,
    password    VARCHAR(255)        NOT NULL,
    role        enum_users_role     NOT NULL DEFAULT 'candidate',
    "createdAt" TIMESTAMPTZ         NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ         NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Table: jobs
-- ----------------------------------------------------------------------------
-- Soft delete is implemented via is_active (the API flips it to false on
-- "delete" and filters every public query by is_active = true).
CREATE TABLE IF NOT EXISTS jobs (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255)    NOT NULL,
    description TEXT            NOT NULL,
    company     VARCHAR(255)    NOT NULL,
    location    VARCHAR(255),
    salary_min  INTEGER,
    salary_max  INTEGER,
    is_active   BOOLEAN         NOT NULL DEFAULT true,
    "userId"    UUID            NOT NULL,
    "createdAt" TIMESTAMPTZ     NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT fk_jobs_user
        FOREIGN KEY ("userId")
        REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    -- Guard against inverted salary ranges at the database level.
    CONSTRAINT chk_jobs_salary_range
        CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
);

-- ----------------------------------------------------------------------------
-- Table: applications  (new in this project)
-- ----------------------------------------------------------------------------
-- A candidate applies to a job with a cover letter. A candidate may apply to a
-- given job only once, enforced by the unique (userId, jobId) constraint.
CREATE TABLE IF NOT EXISTS applications (
    id           UUID                       PRIMARY KEY DEFAULT gen_random_uuid(),
    cover_letter TEXT                       NOT NULL,
    status       enum_applications_status   NOT NULL DEFAULT 'pending',
    "userId"     UUID                       NOT NULL,
    "jobId"      UUID                       NOT NULL,
    "createdAt"  TIMESTAMPTZ                NOT NULL DEFAULT now(),
    "updatedAt"  TIMESTAMPTZ                NOT NULL DEFAULT now(),

    CONSTRAINT fk_applications_user
        FOREIGN KEY ("userId")
        REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_applications_job
        FOREIGN KEY ("jobId")
        REFERENCES jobs (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT uq_applications_user_job
        UNIQUE ("userId", "jobId")
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
-- The public job feed filters on is_active and orders by "createdAt" DESC.
-- A partial composite index serves that exact access pattern efficiently.
CREATE INDEX IF NOT EXISTS idx_jobs_active_created
    ON jobs (is_active, "createdAt" DESC);

-- Foreign-key lookup: list all jobs posted by a given employer.
CREATE INDEX IF NOT EXISTS idx_jobs_user
    ON jobs ("userId");

-- Case-insensitive keyword search (Op.iLike) on title and company.
-- GIN trigram indexes accelerate '%term%' ILIKE queries.
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm
    ON jobs USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_jobs_company_trgm
    ON jobs USING gin (company gin_trgm_ops);

-- Application lookups: a candidate's own history, and an employer reviewing a
-- job's applications.
CREATE INDEX IF NOT EXISTS idx_applications_user
    ON applications ("userId");

CREATE INDEX IF NOT EXISTS idx_applications_job
    ON applications ("jobId");

CREATE INDEX IF NOT EXISTS idx_applications_status
    ON applications (status);

-- ----------------------------------------------------------------------------
-- Trigger: keep "updatedAt" current on UPDATE
-- ----------------------------------------------------------------------------
-- Sequelize manages timestamps from the application layer, but maintaining the
-- column in-database keeps raw SQL writes (and the seed data below) consistent.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON jobs;
CREATE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_applications_updated_at ON applications;
CREATE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Seed data
-- ----------------------------------------------------------------------------
-- All seed users share the password: password123  (bcrypt, 10 rounds).
-- Fixed UUIDs are used so jobs and applications can reference users
-- deterministically. ON CONFLICT keeps the script safe to re-run.
-- ============================================================================

-- Users: two employers, two candidates -----------------------------------------
INSERT INTO users (id, email, password, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'employer@acme.com',
     '$2b$10$c97g2OESZq5eXjHM0WjGcuHcwLNIe/QjsJzhbhP/ZU5wc6LPT9O/G', 'employer'),
    ('22222222-2222-2222-2222-222222222222', 'hr@globex.com',
     '$2b$10$c97g2OESZq5eXjHM0WjGcuHcwLNIe/QjsJzhbhP/ZU5wc6LPT9O/G', 'employer'),
    ('33333333-3333-3333-3333-333333333333', 'candidate@example.com',
     '$2b$10$ds6BLZglaxciac2.MhdRGe.rSTEb4uoSHbvHPjwJbu1xTCyJevQ3O', 'candidate'),
    ('44444444-4444-4444-4444-444444444444', 'jane.dev@example.com',
     '$2b$10$ds6BLZglaxciac2.MhdRGe.rSTEb4uoSHbvHPjwJbu1xTCyJevQ3O', 'candidate')
ON CONFLICT (id) DO NOTHING;

-- Jobs: posted by the two employers --------------------------------------------
INSERT INTO jobs (id, title, description, company, location, salary_min, salary_max, is_active, "userId") VALUES
    ('aaaaaaa1-0000-0000-0000-000000000001',
     'Backend Developer (Node.js)',
     'Build and maintain REST APIs with Node.js, Express, and PostgreSQL. Experience with Docker and CI/CD pipelines is a strong plus.',
     'Acme Corp', 'Prague, Czech Republic', 45000, 65000, true,
     '11111111-1111-1111-1111-111111111111'),

    ('aaaaaaa1-0000-0000-0000-000000000002',
     'Full-Stack Engineer',
     'Work across a React frontend and a Node.js backend. You will own features end to end, from database schema to deployed UI.',
     'Acme Corp', 'Remote (EU)', 50000, 70000, true,
     '11111111-1111-1111-1111-111111111111'),

    ('aaaaaaa1-0000-0000-0000-000000000003',
     'Junior Frontend Developer',
     'Join our team building modern web interfaces with React and Tailwind CSS. Great opportunity for recent graduates.',
     'Globex', 'Brno, Czech Republic', 30000, 42000, true,
     '22222222-2222-2222-2222-222222222222'),

    ('aaaaaaa1-0000-0000-0000-000000000004',
     'DevOps Engineer',
     'Manage containerized deployments, GitHub Actions pipelines, and cloud infrastructure. Kubernetes experience appreciated.',
     'Globex', 'Vienna, Austria', 55000, 80000, true,
     '22222222-2222-2222-2222-222222222222'),

    ('aaaaaaa1-0000-0000-0000-000000000005',
     'Database Administrator',
     'Own our PostgreSQL fleet: performance tuning, indexing strategy, backups, and high availability.',
     'Acme Corp', 'Prague, Czech Republic', 48000, 68000, false,
     '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Applications: candidates applying to jobs ------------------------------------
INSERT INTO applications (id, cover_letter, status, "userId", "jobId") VALUES
    ('bbbbbbb1-0000-0000-0000-000000000001',
     'I have three years of experience building Node.js REST APIs and would love to contribute to your backend team.',
     'pending',
     '33333333-3333-3333-3333-333333333333',
     'aaaaaaa1-0000-0000-0000-000000000001'),

    ('bbbbbbb1-0000-0000-0000-000000000002',
     'As a full-stack engineer comfortable with React and Node.js, I am excited about owning features end to end.',
     'reviewed',
     '33333333-3333-3333-3333-333333333333',
     'aaaaaaa1-0000-0000-0000-000000000002'),

    ('bbbbbbb1-0000-0000-0000-000000000003',
     'I am a recent graduate passionate about frontend development with React and Tailwind. Eager to learn and grow.',
     'accepted',
     '44444444-4444-4444-4444-444444444444',
     'aaaaaaa1-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================================
-- End of schema.sql
-- ============================================================================