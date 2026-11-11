-- AlumSetu SAMPLE data, for development and demos only. All people below are fictional.
-- Run AFTER schema.sql and seed.sql. Safe to run more than once.
-- These accounts cannot log in (their password_hash is not a real hash).

CREATE TABLE IF NOT EXISTS _sample_alumni (
  email TEXT, full_name TEXT, institution TEXT, branch TEXT, graduation_year SMALLINT,
  company TEXT, job_title TEXT, industry TEXT, location TEXT,
  verified BOOLEAN, mentoring BOOLEAN, skills TEXT[]
);
TRUNCATE _sample_alumni;

INSERT INTO _sample_alumni VALUES
  ('rahul.meena@sample.alumsetu.dev', 'Rahul Meena', 'Government Engineering College, Ajmer', 'CSE', 2021,
   'Infosys', 'Data Engineer', 'IT Services', 'Jaipur', TRUE, TRUE, ARRAY['Python','SQL','PostgreSQL','Data Analysis']),
  ('priya.sharma@sample.alumsetu.dev', 'Priya Sharma', 'MBM University (MBM Engineering College)', 'CSE', 2019,
   'Flipkart', 'Senior Software Engineer', 'E-commerce', 'Bengaluru', TRUE, TRUE, ARRAY['Java','Data Structures & Algorithms','Cloud Computing','AWS']),
  ('arjun.rathore@sample.alumsetu.dev', 'Arjun Rathore', 'University College of Engineering, Kota (RTU)', 'ECE', 2020,
   'Texas Instruments', 'Hardware Design Engineer', 'Semiconductors', 'Bengaluru', TRUE, TRUE, ARRAY['VLSI','Embedded Systems','C++','MATLAB']),
  ('neha.choudhary@sample.alumsetu.dev', 'Neha Choudhary', 'Government Mahila Engineering College, Ajmer', 'IT', 2022,
   'Zomato', 'Frontend Developer', 'Food Tech', 'Gurugram', TRUE, TRUE, ARRAY['JavaScript','React','HTML/CSS','UI/UX Design']),
  ('vikram.singh@sample.alumsetu.dev', 'Vikram Singh', 'Government Engineering College, Bikaner', 'Civil', 2018,
   'L&T Construction', 'Project Engineer', 'Infrastructure', 'Jaipur', TRUE, FALSE, ARRAY['AutoCAD','Civil Engineering Design','Project Management']),
  ('ananya.jain@sample.alumsetu.dev', 'Ananya Jain', 'College of Technology and Engineering, Udaipur', 'CSE', 2023,
   'Amazon', 'Machine Learning Engineer', 'E-commerce', 'Hyderabad', TRUE, TRUE, ARRAY['Python','Machine Learning','Deep Learning','AWS']),
  ('mohit.gurjar@sample.alumsetu.dev', 'Mohit Gurjar', 'Government Polytechnic College, Jaipur', 'Mechanical', 2017,
   'Maruti Suzuki', 'Production Supervisor', 'Automotive', 'Manesar', FALSE, TRUE, ARRAY['SolidWorks','AutoCAD','Project Management']),
  ('sana.khan@sample.alumsetu.dev', 'Sana Khan', 'Government Engineering College, Bharatpur', 'CSE', 2021,
   'Razorpay', 'Backend Engineer', 'Fintech', 'Bengaluru', FALSE, TRUE, ARRAY['Node.js','Express','PostgreSQL','Docker']);

INSERT INTO users (email, password_hash, full_name, role, status)
SELECT email, '!sample-account-cannot-log-in', full_name, 'alumni', 'active' FROM _sample_alumni
ON CONFLICT (email) DO NOTHING;

INSERT INTO alumni_profiles (user_id, institution_id, branch, graduation_year, current_company, job_title,
                             industry, location, is_verified, available_for_mentoring)
SELECT u.id, i.id, s.branch, s.graduation_year, s.company, s.job_title, s.industry, s.location, s.verified, s.mentoring
FROM _sample_alumni s
JOIN users u ON u.email = s.email
JOIN institutions i ON i.name = s.institution
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id)
SELECT u.id, sk.id
FROM _sample_alumni s
JOIN users u ON u.email = s.email
CROSS JOIN LATERAL unnest(s.skills) AS skill_name
JOIN skills sk ON sk.name = skill_name
ON CONFLICT DO NOTHING;

DROP TABLE _sample_alumni;
