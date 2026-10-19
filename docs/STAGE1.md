# AlumSetu — Stage 1: Ideation, Architecture & Database Design

**Course:** Advanced Programming (AP) + Data Engineering (DE) — Two-Stage Capstone
**Team:** Ashmita Kamath, Sid, Dhani
**Problem source:** Smart India Hackathon 2024 — "Intelligent platform to interconnect Alumni and Students", Technical Education Department, Govt. of Rajasthan (Center for Electronic Governance). Category: Software, Smart Education.

---

## 1. Problem Statement

Technical colleges under the Government of Rajasthan have no central system for alumni data. Because of this:

- **No central record.** Alumni contact details, specialisations and career paths are scattered or lost after graduation.
- **No structured interaction.** Students have no organised way to get mentorship or real-world experience from alumni.
- **No guidance.** Many students lack clarity about career paths, and the alumni who could guide them are unreachable.
- **Trust issues.** Open platforms suffer from fake profiles and inappropriate content.

## 2. Proposed Solution

**AlumSetu** ("setu" = bridge) is a web platform that connects current students with verified alumni of the same institutions. It provides a central alumni database, AI-suggested mentor matches, a discussion forum, events (meetups, webinars, panels), and a jobs and referrals board, with admin verification to keep profiles genuine.

## 3. Users and Roles

| Role | What they can do |
|---|---|
| **Student** | Build profile, search alumni, get mentor suggestions, send mentorship requests, post in forum, register for events, apply to jobs |
| **Alumni** | Build profile, get verified, accept or decline mentorship, post jobs and referrals, host events, post in forum |
| **Admin** (department/college) | Verify alumni, manage institutions, moderate reported content, view platform statistics |

## 4. Feature Breakdown

### Core (MVP, Stage 2 target)
1. **Authentication and role-based access:** sign up, login (JWT), roles: student, alumni, admin.
2. **Profiles:** education, branch, batch, current company, job title, skills.
3. **Alumni directory:** search and filter by institution, branch, batch, company, industry and skill.
4. **AI mentor matching:** suggests the best alumni for each student, using skill overlap and career-goal similarity.
5. **Mentorship programme:** student sends a request, alumnus accepts or declines, and the status is tracked.
6. **Discussion forum:** posts and comments by category (careers, academics, placements).
7. **Events:** alumni meetups, online webinars, panel discussions and career sessions, with registration and capacity limits.
8. **Jobs and referrals board:** alumni post openings, students apply, and the poster tracks applicants.
9. **Fake-profile prevention:** alumni upload proof (degree or ID) and an admin approves them before a verified badge appears.
10. **Content moderation:** automatic profanity and toxicity filter on posts and comments, plus a "Report" button and an admin review queue.

### Stretch (if time permits)
- AI FAQ chatbot for navigating the site
- Real-time chat between mentor and mentee
- Email notifications
- Analytics dashboard for the department (alumni by company, branch and location)

### Out of scope (and why)
- **Blockchain identity:** the brief allows "blockchain *or any authenticated technique*". Admin document verification plus email verification solves fake profiles with much lower cost and complexity.

## 5. End Goal

**A responsive website**, usable on desktop and mobile browsers, deployed live on the cloud.

## 6. Tech Stack and Justification

| Layer | Technology | Why |
|---|---|---|
| Frontend | **React (Vite)** + React Router | Component-based UI; many pages share cards and forms; fast dev server; team already knows JavaScript |
| Styling | **Tailwind CSS** | Quick, consistent, responsive styling without writing large CSS files |
| Backend | **Node.js + Express** | Same language (JavaScript) on frontend and backend; simple REST APIs; huge ecosystem (auth, validation, logging) |
| Database | **PostgreSQL** (hosted on Supabase) | Data is highly relational (users ↔ mentorships ↔ events ↔ jobs); needs foreign keys, joins and constraints; free managed hosting |
| Auth | **JWT + bcrypt** | Stateless login; passwords stored only as hashes; role is carried in the token for authorisation checks |
| Validation | **Zod** | Validates every request body before it reaches the database |
| Logging | **Winston + Morgan** | Request logs and error logs (needed for production best practices) |
| AI matching | Skill-overlap (Jaccard) + TF-IDF similarity of career goal and job title | Explainable, fast, and needs no paid API; can be upgraded to embeddings later |
| Moderation | `bad-words` filter (+ optional Perspective API) | Blocks abusive text before it is saved |
| File uploads | Supabase Storage | Stores verification documents and resumes |
| Hosting | **Vercel** (frontend), **Render** (backend), **Supabase** (DB) | Free tiers, GitHub auto-deploy, satisfies live cloud deployment |
| Version control | **Git + GitHub** | Branch per feature, pull requests, clear commit history |

### Architecture

```
[ React app on Vercel ]
        |  HTTPS (REST + JWT)
        v
[ Express API on Render ] -- routes -> controllers -> services
        |   - auth middleware (verify JWT, check role)
        |   - validation (Zod)
        |   - error handler + logger (Winston)
        |   - matching service (AI)
        |   - moderation service
        v
[ PostgreSQL on Supabase ]   [ Supabase Storage: documents, resumes ]
```

## 7. Database Design

- **Type:** relational (SQL, PostgreSQL). 15 tables, normalised to 3NF.
- **Diagram:** see `docs/er-diagram.png`. **Full SQL:** see `database/schema.sql`.

| Table | Purpose | Key relationships |
|---|---|---|
| users | Every account | Parent of almost everything |
| institutions | Colleges | 1 : N with student and alumni profiles |
| student_profiles / alumni_profiles | Role-specific details | 1 : 1 with users (shared primary key) |
| skills, user_skills | Skill tags | M : N between users and skills |
| verification_requests | Alumni proof documents | N : 1 users; reviewed_by → admin user |
| mentorship_requests | Student → alumni requests | Two FKs to users (student_id, alumni_id) |
| forum_posts, forum_comments | Forum | Post 1 : N comments |
| content_reports | Reported content | Points to a post or a comment |
| events, event_registrations | Events and sign-ups | M : N between users and events |
| jobs, job_applications | Jobs board | Job 1 : N applications; UNIQUE (job, student) |

**Design decisions**
- Single `users` table with a `role` enum keeps login and authorisation in one place, with profile details split into separate tables.
- Junction tables (`user_skills`, `event_registrations`) use composite primary keys, which also prevent duplicates.
- `CHECK` constraints stop invalid data (a user cannot mentor themselves; a report must point to something).
- Indexes on company, branch and batch, and on event dates, keep directory search fast.

## 8. AI Matching Logic (simple, explainable)

```
score(student, alumni) = 0.6 × skill_overlap + 0.3 × goal_similarity + 0.1 × same_branch

skill_overlap   = |common skills| / |all skills of both|        (Jaccard)
goal_similarity = TF-IDF cosine(student.career_goal, alumni.job_title + industry)
same_branch     = 1 if same branch else 0
```
The top 5 verified, available alumni are shown as "Suggested mentors", with the reason ("3 shared skills: React, SQL, Python").

## 9. Team Roles

| Member | Responsibility |
|---|---|
| **Ashmita Kamath** | Team lead · backend APIs · database · AI matching |
| **Sid** | Frontend: React pages, UI components, responsive design |
| **Dhani** | Auth and admin panel · moderation · deployment · documentation and testing |

## 10. Timeline

| Dates | Milestone |
|---|---|
| 13–24 Oct | **Stage 1:** idea, architecture, ER diagram, repo setup |
| 25 Oct – 2 Nov | Database live on Supabase; auth and profiles API; login and profile pages |
| 3–12 Nov | Directory, mentorship, AI matching |
| 13–20 Nov | Forum and moderation, events, jobs board, admin panel |
| 21–25 Nov | Logging, error handling, testing, cloud deployment |
| 26 Nov – 4 Dec | **Stage 2:** final presentation and live demo |
