-- AlumSetu: performance indexes (Phase 5, feat/db-tuning)
-- Safe to run more than once. Run it on Neon in the SQL Editor.
-- Fresh databases get these automatically from schema.sql.

-- Fast "contains" search (ILIKE '%text%') needs trigram indexes.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

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

ANALYZE;
