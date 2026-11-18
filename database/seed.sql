-- AlumSetu starter data
-- Run AFTER schema.sql. Safe to run more than once.
-- Admin accounts are created separately by the auth seed script (passwords must be bcrypt-hashed).

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

-- Skills: common technical and career skills
INSERT INTO skills (name) VALUES
  ('Python'), ('Java'), ('C++'), ('JavaScript'), ('TypeScript'),
  ('React'), ('Node.js'), ('Express'), ('HTML/CSS'), ('SQL'),
  ('PostgreSQL'), ('MongoDB'), ('Data Structures & Algorithms'), ('Machine Learning'), ('Deep Learning'),
  ('Data Analysis'), ('Power BI'), ('Excel'), ('Cloud Computing'), ('AWS'),
  ('Docker'), ('Git'), ('Linux'), ('Cybersecurity'), ('Android Development'),
  ('UI/UX Design'), ('Embedded Systems'), ('IoT'), ('VLSI'), ('AutoCAD'),
  ('SolidWorks'), ('MATLAB'), ('Civil Engineering Design'), ('Project Management'), ('Communication'),
  ('Public Speaking'), ('Competitive Programming'), ('Interview Preparation'), ('Higher Studies (GATE/GRE)'), ('Entrepreneurship')
ON CONFLICT (name) DO NOTHING;
