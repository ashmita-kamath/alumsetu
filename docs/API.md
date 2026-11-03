# AlumSetu API Contract

This file is the single source of truth for how the frontend and backend talk to each other.
Frontend and backend must both follow it exactly. If an endpoint needs to change, change this file in the same pull request.

- **Base URL (local):** `http://localhost:5000/api`
- **Base URL (production):** set in `client/.env` as `VITE_API_URL`
- **Format:** JSON in, JSON out (except file upload, which is `multipart/form-data`)
- **Owner column:** who writes the backend code for that endpoint

---

## 1. Conventions

### Authentication
Protected endpoints need this header:
```
Authorization: Bearer <token>
```
The token is a JWT returned by register/login. Payload: `{ "id": "<uuid>", "role": "student|alumni|admin" }`, expiry 7 days.

### Error format (every error, every endpoint)
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Email is required", "details": [] } }
```

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body or query fails Zod validation (`details` lists the fields) |
| 401 | `UNAUTHORIZED` | Missing, invalid or expired token; wrong password |
| 403 | `FORBIDDEN` | Logged in, but role or ownership not allowed (also: unverified alumni, suspended user) |
| 404 | `NOT_FOUND` | Record does not exist |
| 409 | `CONFLICT` | Duplicate (email taken, already applied, already registered, active request exists) |
| 422 | `CONTENT_BLOCKED` | Moderation filter rejected the text |
| 500 | `INTERNAL_ERROR` | Anything unexpected (message is generic; details go to the logs only) |

### Pagination
List endpoints accept `?page=1&limit=20` (max `limit` 50) and return:
```json
{ "items": [], "page": 1, "limit": 20, "total": 134 }
```

### Rules for every response
- Never return `password_hash`.
- Dates are ISO strings (`2026-11-20T10:00:00.000Z`).
- IDs: users are UUID strings; everything else is an integer.

---

## 2. Shared objects

**User**
```json
{ "id": "uuid", "email": "a@b.com", "full_name": "Asha Rao", "role": "student", "status": "active", "created_at": "..." }
```

**AlumniCard** (used in directory, matches, profile view)
```json
{
  "user_id": "uuid",
  "full_name": "Rahul Meena",
  "institution": { "id": 3, "name": "Govt. Engineering College, Ajmer" },
  "branch": "CSE",
  "graduation_year": 2021,
  "current_company": "Infosys",
  "job_title": "Data Engineer",
  "industry": "IT Services",
  "location": "Jaipur",
  "is_verified": true,
  "available_for_mentoring": true,
  "skills": [{ "id": 4, "name": "Python" }]
}
```

---

## 3. Endpoints

### Health
| Method | Path | Auth | Owner |
|---|---|---|---|
| GET | `/health` | none | done |

### Auth: owner Dhanishtha
| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/auth/register` | none | `{ email, password (min 8), full_name, role: "student" \| "alumni" }` | `201 { token, user }` |
| POST | `/auth/login` | none | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | any | | `{ user }` |

- Admin accounts cannot self-register; they are created by seed script.
- New accounts get `status: "active"`. Alumni start with `is_verified: false` until an admin approves them.
- Suspended users get `403` on login.

### Profiles: owner Ashmita
| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/profiles/me` | any | | `{ user, profile, skills }` |
| PUT | `/profiles/me` | student, alumni | see below | `{ user, profile, skills }` |
| GET | `/profiles/:userId` | any | | `{ user, profile, skills }` (no email unless it's you or admin) |

PUT body for a **student**:
```json
{ "full_name": "...", "institution_id": 3, "branch": "CSE", "enrollment_year": 2024,
  "expected_grad_year": 2028, "career_goal": "data engineer", "bio": "...", "skill_ids": [1, 4, 9] }
```
PUT body for an **alumnus**:
```json
{ "full_name": "...", "institution_id": 3, "branch": "CSE", "graduation_year": 2021,
  "current_company": "Infosys", "job_title": "Data Engineer", "industry": "IT Services",
  "location": "Jaipur", "linkedin_url": "https://...", "available_for_mentoring": true, "skill_ids": [4, 9] }
```
`PUT` creates the profile if it does not exist yet (upsert). `is_verified` can never be set here.

### Lookups: owner Ashmita
| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/institutions` | none | | `[ { id, name, city, district } ]` |
| POST | `/institutions` | admin | `{ name, city, district }` | `201 { institution }` |
| GET | `/skills?search=py` | none | | `[ { id, name } ]` |
| POST | `/skills` | any | `{ name }` | `201 { skill }` (returns the existing one if the name already exists) |

### Alumni directory: owner Ashmita
| Method | Path | Auth | Returns |
|---|---|---|---|
| GET | `/alumni` | any | paginated `AlumniCard` list |
| GET | `/alumni/:userId` | any | `AlumniCard` + `bio`, `linkedin_url` |

Query filters for `GET /alumni` (all optional, combine freely):
`search` (name, company or job title), `institution_id`, `branch`, `graduation_year`, `company`, `skill_id`, `verified=true`, `mentoring=true`, `sort=name|graduation_year`, `page`, `limit`.

### AI mentor matching: owner Ashmita
| Method | Path | Auth | Returns |
|---|---|---|---|
| GET | `/matches?limit=5` | student | list below |

```json
[
  {
    "alumni": { "...AlumniCard": "..." },
    "score": 0.58,
    "breakdown": { "skill_overlap": 0.4, "goal_similarity": 0.8, "same_branch": 1 },
    "shared_skills": ["SQL", "Python"],
    "reasons": ["2 shared skills: SQL, Python", "Similar career goal", "Same branch (CSE)"]
  }
]
```
- `score = 0.6 × skill_overlap + 0.3 × goal_similarity + 0.1 × same_branch`, between 0 and 1.
- Only alumni with `is_verified = true` and `available_for_mentoring = true`.
- Students with no skills and no career goal get `[]` with `200`. The UI shows "complete your profile".

### Mentorship: owner Ashmita
| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/mentorship` | student | `{ alumni_id, message }` | `201 { request }` |
| GET | `/mentorship?status=pending` | student, alumni | | requests I sent (student) or received (alumni), each with the other person's name |
| PATCH | `/mentorship/:id` | see rules | `{ status }` | `{ request }` |

Rules:
- Target must be a verified alumnus available for mentoring, otherwise `403`.
- `409` if a `pending` or `accepted` request already exists between the same pair.
- `match_score` is calculated by the server, not sent by the client.
- Only the receiving alumnus can set `accepted` / `declined` (from `pending`).
- Either side can set `completed` (from `accepted`).

### Forum: owner Ashmita (moderation filter: Dhanishtha)
| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/posts?category=&search=` | any | | paginated posts `{ id, title, body, category, author: { id, full_name, role }, comment_count, created_at }` |
| POST | `/posts` | any | `{ title, body, category }` | `201 { post }` |
| GET | `/posts/:id` | any | | `{ post, comments: [...] }` |
| PATCH | `/posts/:id` | author | `{ title?, body?, category? }` | `{ post }` |
| DELETE | `/posts/:id` | author, admin | | `204` |
| POST | `/posts/:id/comments` | any | `{ body }` | `201 { comment }` |
| DELETE | `/comments/:id` | author, admin | | `204` |

- `category` is one of `general`, `careers`, `academics`, `placements`.
- Text goes through the moderation filter first; a blocked post returns `422 CONTENT_BLOCKED`.
- Posts and comments with `is_flagged = true` are hidden from everyone except admins.

### Reports and moderation: owner Dhanishtha
| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/reports` | any | `{ post_id \| comment_id, reason }` | `201 { report }` |
| GET | `/admin/reports?status=pending` | admin | | paginated reports with the reported text |
| PATCH | `/admin/reports/:id` | admin | `{ status: "approved" \| "rejected" }` | `{ report }` |

`approved` means the report is valid, so the post or comment gets `is_flagged = true` (hidden). `rejected` leaves it visible.

### Events: owner Ashmita
| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/events?when=upcoming\|past&type=` | any | | paginated events with `registered_count` |
| POST | `/events` | verified alumni, admin | `{ title, description, type, mode, venue_or_link, start_time, capacity? }` | `201 { event }` |
| GET | `/events/:id` | any | | `{ event, registered_count, is_registered }` |
| PATCH | `/events/:id` | organizer, admin | any event field | `{ event }` |
| DELETE | `/events/:id` | organizer, admin | | `204` |
| POST | `/events/:id/register` | student, alumni | | `201` |
| DELETE | `/events/:id/register` | registered user | | `204` |
| GET | `/events/:id/registrations` | organizer, admin | | `[ { user, registered_at, attended } ]` |
| GET | `/me/registrations` | any | | events I registered for |

- `type`: `meetup`, `webinar`, `panel`, `career_session`. `mode`: `online`, `offline`.
- `409` if already registered or the event is full; `400` if the event is in the past.

### Jobs and applications: owner Ashmita
| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/jobs?type=&search=&location=` | any | | paginated jobs with poster name |
| POST | `/jobs` | verified alumni | `{ title, company, type, location, description, deadline }` | `201 { job }` |
| GET | `/jobs/:id` | any | | `{ job, has_applied }` |
| DELETE | `/jobs/:id` | poster, admin | | `204` |
| POST | `/jobs/:id/apply` | student | `{ resume_url }` | `201 { application }` |
| GET | `/jobs/:id/applications` | poster | | applications with student name |
| GET | `/applications/my` | student | | my applications with job title and status |
| PATCH | `/applications/:id` | job poster | `{ status: "shortlisted" \| "rejected" \| "selected" }` | `{ application }` |

- `type`: `job`, `internship`, `referral`.
- `409` if already applied; `400` if past `deadline`.

### File upload: owner Dhanishtha
| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/uploads` | any | multipart: `file`, `kind: "verification" \| "resume"` | `201 { url }` |

PDF, JPG or PNG only, max 5 MB. Stored on Cloudinary; verification files are uploaded as private (authenticated) assets and admins get a time-limited signed link.

### Alumni verification: owner Dhanishtha
| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/verification` | alumni | `{ document_url }` | `201 { request }` |
| GET | `/verification/me` | alumni | | latest request or `null` |
| GET | `/admin/verifications?status=pending` | admin | | paginated requests with alumni name and a signed document link |
| PATCH | `/admin/verifications/:id` | admin | `{ status: "approved" \| "rejected", remarks? }` | `{ request }` |

`approved` sets `alumni_profiles.is_verified = true`. A rejected alumnus can submit again.

### Admin: owner Dhanishtha
| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/admin/stats` | admin | | `{ students, alumni, verified_alumni, pending_verifications, pending_reports, mentorships, events, jobs }` |
| GET | `/admin/users?role=&status=&search=` | admin | | paginated users |
| PATCH | `/admin/users/:id` | admin | `{ status: "active" \| "suspended" }` | `{ user }` |

---

## 4. Permission summary

| Action | Student | Alumni (unverified) | Alumni (verified) | Admin |
|---|---|---|---|---|
| Browse directory, forum, events, jobs | yes | yes | yes | yes |
| Get mentor matches, request mentorship, apply to jobs | yes | no | no | no |
| Accept mentees, post jobs, create events | no | no | yes | events only |
| Post and comment in forum, report content | yes | yes | yes | yes |
| Verify alumni, review reports, manage users and institutions | no | no | no | yes |
