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
  ('mohit.gurjar@sample.alumsetu.dev', 'Mohit Gurjar', 'Government Ram Chandra Khaitan Polytechnic College, Jaipur', 'Mechanical', 2017,
   'Maruti Suzuki', 'Production Supervisor', 'Automotive', 'Manesar', FALSE, TRUE, ARRAY['SolidWorks','AutoCAD','Project Management']),
  ('sana.khan@sample.alumsetu.dev', 'Sana Khan', 'Government Engineering College, Bharatpur', 'CSE', 2021,
   'Razorpay', 'Backend Engineer', 'Fintech', 'Bengaluru', FALSE, TRUE, ARRAY['Node.js','Express','PostgreSQL','Docker']);

-- Two polytechnic alumni who are not in a regular job, so the alumni
-- database shows every kind of employment status.
INSERT INTO _sample_alumni VALUES
  ('kavya.meena@sample.alumsetu.dev', 'Kavya Meena', 'Government Women Polytechnic College, Jaipur', 'ECE', 2020,
   'IIT Jodhpur', 'M.Tech student (VLSI Design)', 'Higher Education', 'Jodhpur', TRUE, TRUE, ARRAY['VLSI','Embedded Systems','Higher Studies (GATE/GRE)']),
  ('rohit.saini@sample.alumsetu.dev', 'Rohit Saini', 'Government Polytechnic College, Jodhpur', 'Mechanical', 2016,
   'Saini Precision Works', 'Founder', 'Manufacturing', 'Jodhpur', TRUE, TRUE, ARRAY['AutoCAD','SolidWorks','Entrepreneurship']);

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

-- Employment status, About and achievements (the fuller alumni record).
-- Only fills empty fields, so it never overwrites what someone typed.
UPDATE alumni_profiles ap
SET employment_status = v.status::employment_status,
    bio = COALESCE(ap.bio, v.bio),
    achievements = COALESCE(ap.achievements, v.achievements)
FROM (VALUES
  ('rahul.meena@sample.alumsetu.dev', 'employed', 'I build data pipelines for banking clients. Happy to help with SQL, Python and data engineering interviews.', 'Infosys Rise Award 2023; Google Data Analytics certificate'),
  ('priya.sharma@sample.alumsetu.dev', 'employed', 'Backend engineer working on large-scale systems. I mentor students preparing for product-company interviews.', 'Gold medal, CSE 2019; spoke at JSFoo 2024'),
  ('arjun.rathore@sample.alumsetu.dev', 'employed', 'Chip designer. Ask me about VLSI careers and GATE ECE.', 'GATE ECE 2020, AIR 312'),
  ('neha.choudhary@sample.alumsetu.dev', 'employed', NULL, NULL),
  ('vikram.singh@sample.alumsetu.dev', 'employed', 'Site and project engineering on metro and highway projects.', NULL),
  ('ananya.jain@sample.alumsetu.dev', 'employed', NULL, 'Smart India Hackathon 2022 winner'),
  ('mohit.gurjar@sample.alumsetu.dev', 'employed', NULL, NULL),
  ('sana.khan@sample.alumsetu.dev', 'seeking', 'Backend developer, currently looking for my next role.', NULL),
  ('kavya.meena@sample.alumsetu.dev', 'higher_studies', 'Did my diploma, then B.Tech through lateral entry; now doing M.Tech at IIT Jodhpur.', 'GATE ECE 2023, AIR 540'),
  ('rohit.saini@sample.alumsetu.dev', 'self_employed', 'Started a CNC machining workshop after my diploma. Ask me about starting a small manufacturing business.', 'MSME Udyam registered; employs 12 people')
) AS v(email, status, bio, achievements)
JOIN users u ON u.email = v.email
WHERE ap.user_id = u.id AND ap.employment_status IS NULL;

DROP TABLE _sample_alumni;
