# Stage 1 Review: Likely Questions and Answers

**Q1. Why this problem?**
Students in Rajasthan's technical colleges have no structured way to reach alumni. Alumni data is scattered, so mentorship and referrals depend on luck. It is a real SIH 2024 problem from the Government of Rajasthan.

**Q2. How is this different from LinkedIn?**
It is institution-specific and verified. Only real alumni of these colleges are approved by an admin. It also has built-in mentorship tracking, college events and AI suggestions aimed at students, not general networking.

**Q3. Why PostgreSQL and not MongoDB?**
Our data is highly relational: users link to mentorships, events, jobs and applications. We need joins, foreign keys and constraints (for example, a student cannot apply twice to the same job), and SQL handles all of this naturally.

**Q4. Why one users table instead of separate students and alumni tables?**
Login and authorisation stay in one place. Role-specific data lives in `student_profiles` and `alumni_profiles` (1:1 relationships), so there are no empty columns.

**Q5. What normal form is the schema in?**
3NF. Skills are in their own table with a junction table, institutions are separate, and no column depends on a non-key column.

**Q6. How does the AI matching work?**
It gives each student–alumni pair a weighted score: 60% skill overlap (Jaccard), 30% similarity between the student's career goal and the alumnus's job title and industry (TF-IDF cosine), and 10% for the same branch. The top 5 matches are shown with the reason.

**Q7. How do you stop fake profiles? The brief mentions blockchain.**
The brief allows "blockchain *or any authenticated technique*". We use email verification plus admin approval of uploaded proof (degree or ID). Unverified alumni cannot mentor or post jobs. This is simpler and more practical than blockchain for this scale.

**Q8. How do you handle inappropriate content?**
An automatic word filter runs on every post and comment before it is saved, and users can report content. Reports go to an admin queue, and flagged items are hidden.

**Q9. How will you do authentication and authorisation?**
Passwords are hashed with bcrypt. Login returns a JWT that contains the user's id and role. Middleware checks the token on every protected route, and a `requireRole('admin')` style check guards role-specific actions.

**Q10. Where will it be deployed?**
The React app on Vercel, the Express API on Render, and the database and file storage on Supabase. All three have free tiers and auto-deploy from GitHub.

**Q11. How will you handle errors and logging?**
A central Express error handler returns clean JSON errors. Winston logs errors and important events, and Morgan logs every request. Both are already set up in the repo.

**Q12. Who is doing what?**
Ashmita: backend, database and AI matching. Siddhanth S Shiraguppi: the React frontend. Dhanishtha: auth, admin panel, moderation, deployment and docs.

**Q13. What if you run out of time?**
Features are prioritised. The core MVP is auth, profiles, directory, mentorship, events and jobs. The chatbot and real-time chat are stretch goals.
