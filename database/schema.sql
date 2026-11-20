-- AlumSetu database schema (PostgreSQL)
-- Stage 1 design. Tables are created in dependency order.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- fast ILIKE '%text%' search

CREATE TYPE user_role        AS ENUM ('student', 'alumni', 'admin');
CREATE TYPE account_status   AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE request_status   AS ENUM ('pending', 'accepted', 'declined', 'completed');
CREATE TYPE review_status    AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE event_type       AS ENUM ('meetup', 'webinar', 'panel', 'career_session');
CREATE TYPE event_mode       AS ENUM ('online', 'offline');
CREATE TYPE job_type         AS ENUM ('job', 'internship', 'referral');
CREATE TYPE application_status AS ENUM ('applied', 'shortlisted', 'rejected', 'selected');
CREATE TYPE employment_status  AS ENUM ('employed', 'self_employed', 'higher_studies', 'seeking', 'other');

-- 1. Institutions (colleges under the Technical Education Department)
CREATE TABLE institutions (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL UNIQUE,
    city        VARCHAR(100) NOT NULL,
    district    VARCHAR(100)
);

-- 2. Users (every account: student, alumni, admin)
CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,
    full_name      VARCHAR(150) NOT NULL,
    role           user_role NOT NULL,
    status         account_status NOT NULL DEFAULT 'pending',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Student profile (1 : 1 with users)
CREATE TABLE student_profiles (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    institution_id      INT NOT NULL REFERENCES institutions(id),
    branch              VARCHAR(100) NOT NULL,
    enrollment_year     SMALLINT NOT NULL,
    expected_grad_year  SMALLINT NOT NULL,
    career_goal         VARCHAR(200),
    bio                 TEXT
);

-- 4. Alumni profile (1 : 1 with users)
CREATE TABLE alumni_profiles (
    user_id                 UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    institution_id          INT NOT NULL REFERENCES institutions(id),
    branch                  VARCHAR(100) NOT NULL,
    graduation_year         SMALLINT NOT NULL,
    current_company         VARCHAR(150),
    job_title               VARCHAR(150),
    industry                VARCHAR(100),
    location                VARCHAR(100),
    linkedin_url            TEXT,
    employment_status       employment_status,
    bio                     TEXT,
    achievements            TEXT,          -- awards, projects, certifications, higher studies
    phone                   VARCHAR(20),   -- contact number; only the alumnus and admins see it
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    available_for_mentoring BOOLEAN NOT NULL DEFAULT TRUE
);

-- 5. Skills master list
CREATE TABLE skills (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(80) NOT NULL UNIQUE
);

-- 6. User <-> Skill (many : many)
CREATE TABLE user_skills (
    user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id  INT  REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, skill_id)
);

-- 7. Alumni verification (fake-profile prevention)
CREATE TABLE verification_requests (
    id            SERIAL PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_url  TEXT NOT NULL,
    status        review_status NOT NULL DEFAULT 'pending',
    reviewed_by   UUID REFERENCES users(id),
    remarks       TEXT,
    submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at   TIMESTAMPTZ
);

-- 8. Mentorship requests (student -> alumni)
CREATE TABLE mentorship_requests (
    id            SERIAL PRIMARY KEY,
    student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alumni_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message       TEXT,
    match_score   NUMERIC(4,3),
    status        request_status NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at  TIMESTAMPTZ,
    CHECK (student_id <> alumni_id)
);

-- 9. Forum posts
CREATE TABLE forum_posts (
    id          SERIAL PRIMARY KEY,
    author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    body        TEXT NOT NULL,
    category    VARCHAR(50) NOT NULL DEFAULT 'general',
    is_flagged  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Forum comments
CREATE TABLE forum_comments (
    id          SERIAL PRIMARY KEY,
    post_id     INT  NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    is_flagged  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Content reports (users report harmful posts/comments)
CREATE TABLE content_reports (
    id           SERIAL PRIMARY KEY,
    reporter_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id      INT REFERENCES forum_posts(id) ON DELETE CASCADE,
    comment_id   INT REFERENCES forum_comments(id) ON DELETE CASCADE,
    reason       VARCHAR(200) NOT NULL,
    status       review_status NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

-- 12. Events (meetups, webinars, panels, career sessions)
CREATE TABLE events (
    id             SERIAL PRIMARY KEY,
    organizer_id   UUID NOT NULL REFERENCES users(id),
    title          VARCHAR(200) NOT NULL,
    description    TEXT,
    type           event_type NOT NULL,
    mode           event_mode NOT NULL,
    venue_or_link  TEXT NOT NULL,
    start_time     TIMESTAMPTZ NOT NULL,
    capacity       INT CHECK (capacity > 0),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Event registrations (users <-> events, many : many)
CREATE TABLE event_registrations (
    event_id       INT  REFERENCES events(id) ON DELETE CASCADE,
    user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    registered_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    attended       BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (event_id, user_id)
);

-- 14. Jobs / internships / referrals (posted by alumni)
CREATE TABLE jobs (
    id           SERIAL PRIMARY KEY,
    posted_by    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        VARCHAR(150) NOT NULL,
    company      VARCHAR(150) NOT NULL,
    type         job_type NOT NULL,
    location     VARCHAR(100),
    description  TEXT,
    deadline     DATE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Job applications (students apply to jobs)
CREATE TABLE job_applications (
    id          SERIAL PRIMARY KEY,
    job_id      INT  NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_url  TEXT,
    status      application_status NOT NULL DEFAULT 'applied',
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (job_id, student_id)
);

-- Indexes for common searches
CREATE INDEX idx_alumni_company  ON alumni_profiles (current_company);
CREATE INDEX idx_alumni_branch   ON alumni_profiles (branch, graduation_year);
CREATE INDEX idx_alumni_employment ON alumni_profiles (employment_status);
CREATE INDEX idx_mentor_alumni   ON mentorship_requests (alumni_id, status);
CREATE INDEX idx_posts_created   ON forum_posts (created_at DESC);
CREATE INDEX idx_events_start    ON events (start_time);

-- Performance indexes (same as database/migrations/002_indexes.sql)

-- Directory search: name, company, job title
CREATE INDEX IF NOT EXISTS idx_users_name_trgm        ON users USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_alumni_company_trgm    ON alumni_profiles USING gin (current_company gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_alumni_title_trgm      ON alumni_profiles USING gin (job_title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_role_status      ON users (role, status);

-- Directory skill filter and skill lookups
CREATE INDEX IF NOT EXISTS idx_user_skills_skill      ON user_skills (skill_id, user_id);
CREATE INDEX IF NOT EXISTS idx_skills_lower_name      ON skills (lower(name));

-- Mentorship: a student's own requests, newest first
CREATE INDEX IF NOT EXISTS idx_mentor_student         ON mentorship_requests (student_id, created_at DESC);

-- Forum: comment counts and comment lists per post, search, author deletes
CREATE INDEX IF NOT EXISTS idx_comments_post          ON forum_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_author        ON forum_comments (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_author           ON forum_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_title_trgm       ON forum_posts USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_body_trgm        ON forum_posts USING gin (body gin_trgm_ops);

-- Reports and verification queues (admin panel)
CREATE INDEX IF NOT EXISTS idx_reports_status         ON content_reports (status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_post           ON content_reports (post_id);
CREATE INDEX IF NOT EXISTS idx_reports_comment        ON content_reports (comment_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter       ON content_reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_verif_status           ON verification_requests (status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_verif_user             ON verification_requests (user_id);

-- Events: organiser's events, a user's registrations
CREATE INDEX IF NOT EXISTS idx_events_organizer       ON events (organizer_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user     ON event_registrations (user_id);

-- Jobs: newest first, search, poster's jobs, a student's applications
CREATE INDEX IF NOT EXISTS idx_jobs_created           ON jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_poster            ON jobs (posted_by);
CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm        ON jobs USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_company_trgm      ON jobs USING gin (company gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_applications_student   ON job_applications (student_id, applied_at DESC);
