# Database tuning (Phase 5)

**Goal:** keep the main pages fast once AlumSetu has thousands of users, not just the demo data.

## How we tested
1. Loaded a local PostgreSQL 16 database with fake data: 8,000 alumni, 11,000 students, 30,000 mentorship requests, 30,000 forum posts, 120,000 comments, 3,000 events, 5,000 jobs and 50,000 applications.
2. Ran each main API query with `EXPLAIN ANALYZE` and noted the time.
3. Added the indexes in `database/migrations/002_indexes.sql`, then ran the same queries again.
4. Ran the full test suite on a fresh database built from `schema.sql`: 68 pass, 0 fail.

## Results

| Query (API endpoint) | Before | After |
|---|---|---|
| Forum list with comment counts (`GET /posts`) | 122 ms | 0.3 ms |
| Forum search (`GET /posts?search=`) | 53 ms | 0.3 ms |
| Comments on a post (`GET /posts/:id`) | 7.7 ms | 0.1 ms |
| Deleting a user (cascades to their rows) | 44 ms | 4.7 ms |
| My mentorship requests (`GET /mentorship`) | 3.6 ms | 0.2 ms |
| My registered events (`GET /me/registrations`) | 2.1 ms | 0.2 ms |
| My job applications (`GET /applications/my`) | 2.9 ms | 0.2 ms |
| Directory skill filter (`GET /alumni?skill_id=`) | 5.7 ms | 2.7 ms |
| Admin queues (verifications, reports) | 0.8–1 ms | 0.06 ms |

Queries that were already fast (event list, job list, duplicate checks) stayed fast.

## Why these indexes
- **Comment counts and lists:** the forum list counts comments for every post. Without an index on `forum_comments (post_id)` PostgreSQL scanned all comments for each post.
- **Foreign keys:** PostgreSQL does not index foreign keys automatically. Deleting a user has to find their posts, comments, reports, jobs and so on, so we indexed those columns.
- **"My ..." pages:** indexes on `(student_id, created_at)` and similar give a student's own rows, already in date order.
- **Contains search:** `ILIKE '%text%'` cannot use a normal index. The `pg_trgm` extension splits text into 3-letter pieces so a GIN index can find matches.
- **Admin queues:** `(status, date)` indexes return pending items in order without scanning the whole table.

## Applying it
- **Existing database (Neon):** open the SQL Editor, paste `database/migrations/002_indexes.sql`, and Run. It is safe to run more than once.
- **New database:** `schema.sql` already includes the same indexes.
