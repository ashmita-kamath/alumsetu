# AlumSetu Build Roadmap (Stage 2)

**Goal:** live website by **25 Nov**. The Stage 2 evaluation window is 26 Nov to 4 Dec and our slot could be on the first day.
Desktop and mobile apps are a bonus, built only after the website is stable.

Every endpoint referenced below is defined in [`API.md`](API.md). Database tables are in [`../database/schema.sql`](../database/schema.sql).

## Ownership

| Member | Owns (writes the code) | Also does |
|---|---|---|
| **Siddhanth S Shiraguppi** | All pages and UI components, API integration on the frontend, desktop and mobile packaging | Reviews frontend-facing PRs, UI testing |
| **Ashmita Kamath** | Database, profiles, lookups, directory, AI matching, mentorship, forum, events, jobs APIs | Keeps `API.md` up to date, reviews backend PRs |
| **Dhanishtha** | Auth (register, login, JWT, role middleware), uploads, alumni verification, moderation and reports, admin APIs, automated tests, deployment | Reviews security of every PR |

## Git rules

1. Everyone commits **from their own GitHub account**.
2. Nobody pushes to `main`. Work on a branch, open a pull request, get **one review** from a teammate, then merge.
3. One branch per feature: `feat/<area>-<thing>`, for example `feat/ui-login`, `feat/api-directory`, `feat/auth-jwt`.
4. Small commits with clear messages: `add alumni filter query`, not `update`.
5. Before starting work: `git checkout main`, then `git pull`, then create the branch.
6. If you used AI to write code, you must be able to explain every line in the Stage 2 code defense.

## Definition of done (for any feature)
- Works against the real database, not dummy data.
- Permissions enforced on the **backend**, not just hidden buttons.
- Errors use the format in `API.md`.
- Has at least one automated test (backend) or has been clicked through on mobile and desktop widths (frontend).
- Merged into `main` through a reviewed PR.

---

## Phase 0: Foundation · 3–5 Nov

| Member | Tasks | Branch |
|---|---|---|
| Siddhanth | Install Tailwind and React Router. Set up folders (`components/`, `pages/`, `layouts/`, `services/`, `context/`). Build Navbar, Footer, Button, Input, Card, Modal. Build the landing page. Create `services/api.js` that reads `VITE_API_URL` and attaches the token. | `feat/ui-foundation` |
| Ashmita | Create the Supabase project, run `schema.sql`. Add `pg` connection pool (`server/src/config/db.js`). Write `database/seed.sql` with institutions, skills and an admin account. Add `app.js` and route folder structure. | `feat/db-setup` |
| Dhanishtha | Add Jest + Supertest to the server. Write the `validate(schema)` Zod middleware and the error helper (`AppError`) matching the `API.md` error format. Add `.github/pull_request_template.md`. Turn on branch protection for `main`. | `feat/quality-setup` |

## Phase 1: Auth and profiles · 5–8 Nov

| Member | Tasks | Branch |
|---|---|---|
| Siddhanth | Register page (with student/alumni choice), login page, `AuthContext` that stores the token, protected routes by role, student and alumni dashboard shells, profile edit page with skill picker. | `feat/ui-auth`, `feat/ui-profile` |
| Ashmita | `GET/PUT /profiles/me`, `GET /profiles/:userId`, `GET/POST /institutions`, `GET/POST /skills`. | `feat/api-profiles` |
| Dhanishtha | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, bcrypt hashing, JWT signing, `requireAuth` and `requireRole(...)` middleware, tests for wrong password, duplicate email, expired token, wrong role. | `feat/auth-jwt` |

## Phase 2: Directory and AI matching · 8–12 Nov

| Member | Tasks | Branch |
|---|---|---|
| Siddhanth | Alumni directory page with search, filters and pagination; alumni profile page with verified badge; "Suggested mentors" section on the student dashboard showing score and reasons. | `feat/ui-directory`, `feat/ui-matches` |
| Ashmita | `GET /alumni` with all filters, `GET /alumni/:userId`, `GET /matches` (Jaccard + TF-IDF + branch, top 5 with reasons). Unit tests for the scoring function. | `feat/api-directory`, `feat/ai-matching` |
| Dhanishtha | `POST /uploads` (Supabase Storage), `POST /verification`, `GET /verification/me`. Tests that unverified alumni never appear in matches. | `feat/uploads`, `feat/verification-submit` |

## Phase 3: Mentorship, forum and moderation · 12–16 Nov

| Member | Tasks | Branch |
|---|---|---|
| Siddhanth | "Request mentorship" modal, student "My requests" page, alumni "Incoming requests" page with Accept/Decline. Forum list, post page with comments, new-post form, Report button. | `feat/ui-mentorship`, `feat/ui-forum` |
| Ashmita | All mentorship endpoints with status rules. All forum post and comment endpoints. | `feat/api-mentorship`, `feat/api-forum` |
| Dhanishtha | Moderation filter service (bad-words list) used by forum endpoints. `POST /reports`, `GET/PATCH /admin/reports`. Tests for blocked content and hidden posts. | `feat/moderation` |

## Phase 4: Events and jobs · 16–19 Nov

| Member | Tasks | Branch |
|---|---|---|
| Siddhanth | Events list and detail pages, create-event form, Register button, "My registrations". Jobs list and detail pages, post-job form, Apply flow with resume upload, "My applications", applicant list for alumni. | `feat/ui-events`, `feat/ui-jobs` |
| Ashmita | All event and registration endpoints. All job and application endpoints. | `feat/api-events`, `feat/api-jobs` |
| Dhanishtha | Tests: duplicate registration, full event, past event, duplicate application, unverified alumni cannot post. | `feat/tests-events-jobs` |

## Phase 5: Admin panel · 19–21 Nov

| Member | Tasks | Branch |
|---|---|---|
| Siddhanth | Admin dashboard (stats cards), verification queue with document preview and Approve/Reject, reports queue, user management, institution management. | `feat/ui-admin` |
| Ashmita | Help wire admin data; add database indexes after checking slow queries; refresh `API.md`. | `feat/db-tuning` |
| Dhanishtha | `GET/PATCH /admin/verifications`, `GET /admin/stats`, `GET/PATCH /admin/users`. | `feat/admin-api` |

## Phase 6: Integration and testing · 21–23 Nov

All three run these flows end to end and fix what breaks:
1. Student registers, logs in, completes profile.
2. Alumnus registers, uploads proof, admin approves, badge appears.
3. Student searches directory, sees mentor suggestions, sends request, alumnus accepts.
4. Alumnus creates event, student registers.
5. Alumnus posts job, student applies, alumnus shortlists.
6. Student posts in forum, another user reports it, admin hides it.

## Phase 7: Website deployment · 23–25 Nov

| Member | Tasks |
|---|---|
| Siddhanth | Deploy `client` to Vercel, set `VITE_API_URL`, test on phone and laptop. |
| Ashmita | Deploy `server` to Render, set `DATABASE_URL`, check CORS, run seed on production DB, create demo accounts for all 3 roles. |
| Dhanishtha | Production secrets, Supabase Storage policies, run the smoke-test checklist, write `docs/DEPLOYMENT.md`. |

## Phase 8: Desktop and mobile apps (bonus) · 25 Nov onward

Same React app, packaged:
- **Desktop (macOS, Windows):** Tauri 2. GitHub Actions builds both installers.
- **Android:** Capacitor, debug APK.
- **iOS:** Capacitor, runs in the Xcode simulator (real-device distribution needs a paid Apple developer account).

| Member | Tasks |
|---|---|
| Siddhanth | Add Tauri and Capacitor, icons, splash screen, fix layout issues. |
| Ashmita | Make sure the API accepts requests from the app origins (CORS), test login from the apps. |
| Dhanishtha | GitHub Actions workflow for desktop builds, attach builds to a GitHub Release, write install steps. |

## Phase 9: Demo prep · before our slot

| Member | Presents |
|---|---|
| Siddhanth | Live product walkthrough and UI |
| Ashmita | Architecture, database, APIs, AI matching |
| Dhanishtha | Auth, verification, moderation, testing, deployment |
