-- ONE-TIME switch of an EXISTING database from the Rajasthan college list to Bengaluru.
-- New databases don't need this: schema.sql + seed.sql already give the Bengaluru list.
--
-- What it does, in one transaction (all or nothing):
-- 1. Adds the Bengaluru colleges.
-- 2. Moves every profile at an old Rajasthan college to a Bengaluru college
--    (the fictional sample accounts get the same college as in sample-data.sql).
-- 3. Deletes the Rajasthan colleges, which no profile uses any more.
-- 4. Renames the Jaipur sample meetup and job location.
--
-- Run it once in the Neon SQL editor, after taking a backup (Neon: Branches → Create branch).

BEGIN;

-- Institutions: engineering colleges in Bengaluru (first launch city).
-- More cities will be added later; admins can also add colleges with POST /institutions.
INSERT INTO institutions (name, city, district) VALUES
  ('R. V. College of Engineering (RVCE)', 'Bengaluru', 'Bengaluru Urban'),
  ('B.M.S. College of Engineering (BMSCE)', 'Bengaluru', 'Bengaluru Urban'),
  ('PES University', 'Bengaluru', 'Bengaluru Urban'),
  ('M. S. Ramaiah Institute of Technology (MSRIT)', 'Bengaluru', 'Bengaluru Urban'),
  ('University Visvesvaraya College of Engineering (UVCE)', 'Bengaluru', 'Bengaluru Urban'),
  ('Bangalore Institute of Technology (BIT)', 'Bengaluru', 'Bengaluru Urban'),
  ('Dayananda Sagar College of Engineering (DSCE)', 'Bengaluru', 'Bengaluru Urban'),
  ('BNM Institute of Technology', 'Bengaluru', 'Bengaluru Urban'),
  ('Nitte Meenakshi Institute of Technology (NMIT)', 'Bengaluru', 'Bengaluru Urban'),
  ('CMR Institute of Technology (CMRIT)', 'Bengaluru', 'Bengaluru Urban'),
  ('New Horizon College of Engineering', 'Bengaluru', 'Bengaluru Urban'),
  ('Dr. Ambedkar Institute of Technology', 'Bengaluru', 'Bengaluru Urban'),
  ('Global Academy of Technology', 'Bengaluru', 'Bengaluru Urban'),
  ('JSS Academy of Technical Education, Bengaluru', 'Bengaluru', 'Bengaluru Urban'),
  ('REVA University', 'Bengaluru', 'Bengaluru Urban'),
  ('Acharya Institute of Technology', 'Bengaluru', 'Bengaluru Urban'),
  ('Atria Institute of Technology', 'Bengaluru', 'Bengaluru Urban'),
  ('International Institute of Information Technology Bangalore (IIIT-B)', 'Bengaluru', 'Bengaluru Urban'),
  ('CHRIST (Deemed to be University), School of Engineering and Technology', 'Bengaluru', 'Bengaluru Urban'),
  ('Sri Krishnarajendra Silver Jubilee Technological Institute (SKSJTI)', 'Bengaluru', 'Bengaluru Urban')
ON CONFLICT (name) DO NOTHING;

-- Old college → new college
CREATE TEMP TABLE _college_map (old_name TEXT, new_name TEXT) ON COMMIT DROP;
INSERT INTO _college_map VALUES
    ('Government Engineering College, Ajmer', 'R. V. College of Engineering (RVCE)'),
    ('MBM University (MBM Engineering College)', 'B.M.S. College of Engineering (BMSCE)'),
    ('University College of Engineering, Kota (RTU)', 'PES University'),
    ('Government Mahila Engineering College, Ajmer', 'M. S. Ramaiah Institute of Technology (MSRIT)'),
    ('Government Engineering College, Bikaner', 'University Visvesvaraya College of Engineering (UVCE)'),
    ('College of Technology and Engineering, Udaipur', 'Bangalore Institute of Technology (BIT)'),
    ('Government Polytechnic College, Jaipur', 'Sri Krishnarajendra Silver Jubilee Technological Institute (SKSJTI)'),
    ('Government Engineering College, Bharatpur', 'Dayananda Sagar College of Engineering (DSCE)'),
    ('Government Engineering College, Banswara', 'Global Academy of Technology'),
    ('Government Engineering College, Jhalawar', 'Atria Institute of Technology'),
    ('Government Women Polytechnic College, Jaipur', 'Sri Krishnarajendra Silver Jubilee Technological Institute (SKSJTI)'),
    ('Government Polytechnic College, Jodhpur', 'Sri Krishnarajendra Silver Jubilee Technological Institute (SKSJTI)');

UPDATE student_profiles p SET institution_id = n.id
  FROM _college_map m JOIN institutions o ON o.name = m.old_name JOIN institutions n ON n.name = m.new_name
 WHERE p.institution_id = o.id;

UPDATE alumni_profiles p SET institution_id = n.id
  FROM _college_map m JOIN institutions o ON o.name = m.old_name JOIN institutions n ON n.name = m.new_name
 WHERE p.institution_id = o.id;

DELETE FROM institutions WHERE name IN (SELECT old_name FROM _college_map);

UPDATE alumni_profiles SET location = 'Bengaluru'
 WHERE location = 'Jaipur' AND user_id IN (SELECT id FROM users WHERE email LIKE '%@sample.alumsetu.dev');
UPDATE events SET title = 'Bengaluru Alumni Meetup',
                  description = 'An evening meetup for alumni and final-year students in Bengaluru.',
                  venue_or_link = 'Rangoli Metro Art Center, MG Road, Bengaluru'
 WHERE title = 'Jaipur Alumni Meetup';
UPDATE jobs SET location = 'Bengaluru' WHERE title = 'Data Engineering Intern' AND company = 'Infosys' AND location = 'Jaipur';

COMMIT;
