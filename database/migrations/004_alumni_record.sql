-- AlumSetu: fuller alumni record (problem statement: "employment status, contact
-- details, educational and professional achievements, and areas of expertise").
-- Safe to run more than once. Run it on Neon in the SQL Editor.
-- Fresh databases get the same columns from schema.sql.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_status') THEN
    CREATE TYPE employment_status AS ENUM ('employed', 'self_employed', 'higher_studies', 'seeking', 'other');
  END IF;
END $$;

ALTER TABLE alumni_profiles
  ADD COLUMN IF NOT EXISTS employment_status employment_status,
  ADD COLUMN IF NOT EXISTS bio               TEXT,
  ADD COLUMN IF NOT EXISTS achievements      TEXT,
  ADD COLUMN IF NOT EXISTS phone             VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_alumni_employment ON alumni_profiles (employment_status);

COMMIT;
