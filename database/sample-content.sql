-- AlumSetu SAMPLE events, jobs and forum posts, for development and demos only. All content is fictional.
-- Run AFTER sample-data.sql and sample-students.sql. Safe to run more than once
-- (it only adds rows when a row with the same title does not exist yet).

-- Events (dates are relative to today, so they always show as upcoming or past correctly)
INSERT INTO events (organizer_id, title, description, type, mode, venue_or_link, start_time, capacity)
SELECT u.id, v.title, v.description, v.type::event_type, v.mode::event_mode, v.venue_or_link, now() + v.starts_in, v.capacity
FROM (VALUES
  ('rahul.meena@sample.alumsetu.dev', 'Breaking into Data Engineering',
   'How I moved from campus to a data engineering role, and what to learn first.',
   'webinar', 'online', 'https://meet.example.com/data-eng', interval '5 days', 100),
  ('priya.sharma@sample.alumsetu.dev', 'Product Company Interview Prep',
   'DSA, system design basics and mock interview tips from a Flipkart engineer.',
   'career_session', 'online', 'https://meet.example.com/interview-prep', interval '9 days', 60),
  ('vikram.singh@sample.alumsetu.dev', 'Bengaluru Alumni Meetup',
   'An evening meetup for alumni and final-year students in Bengaluru.',
   'meetup', 'offline', 'Rangoli Metro Art Center, MG Road, Bengaluru', interval '14 days', 40),
  ('arjun.rathore@sample.alumsetu.dev', 'Careers in VLSI: Panel Discussion',
   'Three alumni from semiconductor companies on getting into chip design.',
   'panel', 'online', 'https://meet.example.com/vlsi-panel', interval '-10 days', NULL)
) AS v(email, title, description, type, mode, venue_or_link, starts_in, capacity)
JOIN users u ON u.email = v.email
WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.title = v.title);

-- Jobs and referrals (posted by verified alumni)
INSERT INTO jobs (posted_by, title, company, type, location, description, deadline)
SELECT u.id, v.title, v.company, v.type::job_type, v.location, v.description, CURRENT_DATE + v.days_left
FROM (VALUES
  ('rahul.meena@sample.alumsetu.dev', 'Data Engineering Intern', 'Infosys', 'internship', 'Bengaluru',
   'Six-month internship working with SQL, Python and data pipelines.', 20),
  ('priya.sharma@sample.alumsetu.dev', 'SDE-1 Referral', 'Flipkart', 'referral', 'Bengaluru',
   'I can refer 2023-2025 graduates with strong DSA. Share your resume link.', 15),
  ('ananya.jain@sample.alumsetu.dev', 'ML Engineer Intern', 'Amazon', 'internship', 'Hyderabad',
   'Summer internship for students comfortable with Python and machine learning basics.', 25),
  ('neha.choudhary@sample.alumsetu.dev', 'Frontend Developer', 'Zomato', 'job', 'Gurugram',
   'Full-time role for React developers with 0-2 years of experience.', 30)
) AS v(email, title, company, type, location, description, days_left)
JOIN users u ON u.email = v.email
WHERE NOT EXISTS (SELECT 1 FROM jobs j WHERE j.title = v.title AND j.company = v.company);

-- Forum posts
INSERT INTO forum_posts (author_id, title, body, category)
SELECT u.id, v.title, v.body, v.category
FROM (VALUES
  ('kavya.student@sample.alumsetu.dev', 'Which skills matter most for a data engineering internship?',
   'I know Python and SQL. Should I learn Spark or cloud tools next?', 'careers'),
  ('priya.sharma@sample.alumsetu.dev', 'My placement preparation timeline',
   'Start DSA in 2nd year, build two solid projects in 3rd year, and practise mock interviews before placements.', 'placements'),
  ('dev.student@sample.alumsetu.dev', 'Good resources for digital electronics?',
   'Looking for books or courses that helped you with VLSI basics.', 'academics')
) AS v(email, title, body, category)
JOIN users u ON u.email = v.email
WHERE NOT EXISTS (SELECT 1 FROM forum_posts p WHERE p.title = v.title);

INSERT INTO forum_comments (post_id, author_id, body)
SELECT p.id, u.id, 'Learn one cloud platform (AWS is a good start) and build one end-to-end pipeline project.'
FROM forum_posts p JOIN users u ON u.email = 'rahul.meena@sample.alumsetu.dev'
WHERE p.title = 'Which skills matter most for a data engineering internship?'
  AND NOT EXISTS (SELECT 1 FROM forum_comments c WHERE c.post_id = p.id AND c.author_id = u.id);

SELECT (SELECT count(*) FROM events) AS events, (SELECT count(*) FROM jobs) AS jobs, (SELECT count(*) FROM forum_posts) AS posts;
