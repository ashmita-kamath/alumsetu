-- AlumSetu SAMPLE students, for development and demos only. All people below are fictional.
-- Run AFTER schema.sql, seed.sql and sample-data.sql. Safe to run more than once.
-- These accounts cannot log in (their password_hash is not a real hash).

CREATE TABLE IF NOT EXISTS _sample_students (
  email TEXT, full_name TEXT, institution TEXT, branch TEXT,
  enrollment_year SMALLINT, expected_grad_year SMALLINT, career_goal TEXT, skills TEXT[]
);
TRUNCATE _sample_students;

INSERT INTO _sample_students VALUES
  ('kavya.student@sample.alumsetu.dev', 'Kavya Soni', 'Government Engineering College, Ajmer', 'CSE', 2024, 2028,
   'I want to become a data engineer', ARRAY['Python','SQL','React']),
  ('dev.student@sample.alumsetu.dev', 'Dev Parihar', 'University College of Engineering, Kota (RTU)', 'ECE', 2023, 2027,
   'Chip design and embedded hardware', ARRAY['C++','MATLAB']),
  ('isha.student@sample.alumsetu.dev', 'Isha Bhati', 'MBM University (MBM Engineering College)', 'CSE', 2025, 2029,
   NULL, ARRAY[]::TEXT[]);

INSERT INTO users (email, password_hash, full_name, role, status)
SELECT email, '!sample-account-cannot-log-in', full_name, 'student', 'active' FROM _sample_students
ON CONFLICT (email) DO NOTHING;

INSERT INTO student_profiles (user_id, institution_id, branch, enrollment_year, expected_grad_year, career_goal)
SELECT u.id, i.id, s.branch, s.enrollment_year, s.expected_grad_year, s.career_goal
FROM _sample_students s
JOIN users u ON u.email = s.email
JOIN institutions i ON i.name = s.institution
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id)
SELECT u.id, sk.id
FROM _sample_students s
JOIN users u ON u.email = s.email
CROSS JOIN LATERAL unnest(s.skills) AS skill_name
JOIN skills sk ON sk.name = skill_name
ON CONFLICT DO NOTHING;

DROP TABLE _sample_students;

-- Handy for testing GET /api/matches?student_id=... during development:
SELECT u.id AS student_id, u.full_name FROM users u WHERE u.email LIKE '%.student@sample.alumsetu.dev' ORDER BY u.full_name;
