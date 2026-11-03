-- AlumSetu starter data
-- Run AFTER schema.sql. Safe to run more than once.
-- Admin accounts are created separately by the auth seed script (passwords must be bcrypt-hashed).

-- Institutions: government technical institutions in Rajasthan
INSERT INTO institutions (name, city, district) VALUES
  ('MBM University (MBM Engineering College)', 'Jodhpur', 'Jodhpur'),
  ('Government Engineering College, Ajmer', 'Ajmer', 'Ajmer'),
  ('Government Mahila Engineering College, Ajmer', 'Ajmer', 'Ajmer'),
  ('Government Engineering College, Bikaner', 'Bikaner', 'Bikaner'),
  ('Government Engineering College, Bharatpur', 'Bharatpur', 'Bharatpur'),
  ('Government Engineering College, Banswara', 'Banswara', 'Banswara'),
  ('Government Engineering College, Jhalawar', 'Jhalawar', 'Jhalawar'),
  ('University College of Engineering, Kota (RTU)', 'Kota', 'Kota'),
  ('College of Technology and Engineering, Udaipur', 'Udaipur', 'Udaipur'),
  ('Government Polytechnic College, Jaipur', 'Jaipur', 'Jaipur'),
  ('Government Women Polytechnic College, Jaipur', 'Jaipur', 'Jaipur'),
  ('Government Polytechnic College, Jodhpur', 'Jodhpur', 'Jodhpur')
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
