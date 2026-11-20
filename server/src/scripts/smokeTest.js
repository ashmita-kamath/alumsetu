// Smoke test for a deployed AlumSetu API.
// Runs the 6 end-to-end flows from docs/ROADMAP.md (Phase 6) against a real server,
// using the demo accounts from `npm run create-demo-users`, then cleans up after itself.
//
// Usage (from server/):
//   API_URL=https://alumsetu-api.onrender.com/api DEMO_PASSWORD='...' npm run smoke-test
// Optional:
//   SITE_URL=https://your-site.vercel.app   also checks CORS for the website
//   DEMO_STUDENT_EMAIL / DEMO_ALUMNI_EMAIL / DEMO_ADMIN_EMAIL if you changed them
//
// It only creates test rows (titles start with "[smoke]") and deletes them at the end.

const API = (process.env.API_URL || "http://localhost:5050/api").replace(/\/+$/, "");
const PASSWORD = process.env.DEMO_PASSWORD;
const SITE = process.env.SITE_URL?.replace(/\/+$/, "");
const EMAILS = {
  student: process.env.DEMO_STUDENT_EMAIL || "demo.student@alumsetu.in",
  alumni: process.env.DEMO_ALUMNI_EMAIL || "demo.alumni@alumsetu.in",
  admin: process.env.DEMO_ADMIN_EMAIL || "demo.admin@alumsetu.in",
};

if (!PASSWORD) {
  console.error("Set DEMO_PASSWORD (the password used with create-demo-users).");
  process.exit(1);
}

let passed = 0;
let failed = 0;
let skipped = 0;
const cleanup = [];

async function call(method, path, { as, body, form, headers = {} } = {}) {
  const opts = { method, headers: { ...headers } };
  if (as) opts.headers.Authorization = `Bearer ${as.token}`;
  if (form) opts.body = form;
  else if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(API + path, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}

function expect(cond, message, detail) {
  if (!cond) {
    const err = new Error(message);
    err.detail = detail;
    throw err;
  }
}

async function step(name, fn) {
  try {
    const note = await fn();
    if (note === "skip") return;
    passed += 1;
    console.log(`  ✓ ${name}${note ? `  (${note})` : ""}`);
  } catch (err) {
    failed += 1;
    console.log(`  ✗ ${name}: ${err.message}`);
    if (err.detail) console.log(`      ${JSON.stringify(err.detail).slice(0, 300)}`);
  }
}

function skip(name, why) {
  skipped += 1;
  console.log(`  – ${name}: skipped (${why})`);
  return "skip";
}

async function wakeUp() {
  // Render's free plan sleeps; the first request can take up to a minute.
  const until = Date.now() + 120_000;
  while (Date.now() < until) {
    try {
      const r = await call("GET", "/health");
      if (r.status === 200) return r;
    } catch { /* still waking up */ }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`No response from ${API}/health after 2 minutes`);
}

const users = {};
const futureDate = (days) => new Date(Date.now() + days * 86400000);
const tag = `[smoke] ${new Date().toISOString().slice(0, 16)}`;

console.log(`AlumSetu smoke test → ${API}\n`);

console.log("Setup");
await step("server is up and connected to the database", async () => {
  const r = await wakeUp();
  expect(r.data?.database === "connected", "database is not connected", r.data);
});
for (const role of ["student", "alumni", "admin"]) {
  await step(`${role} demo account can log in`, async () => {
    const r = await call("POST", "/auth/login", { body: { email: EMAILS[role], password: PASSWORD } });
    expect(r.status === 200 && r.data?.token, `login failed (${r.status})`, r.data);
    expect(r.data.user.role === role, `account has role ${r.data.user.role}`);
    users[role] = { token: r.data.token, id: r.data.user.id };
  });
}
if (!users.student || !users.alumni || !users.admin) {
  console.log("\nCannot continue without all three logins. Run `npm run create-demo-users` first.");
  process.exit(1);
}
if (SITE) {
  await step("CORS allows the website", async () => {
    const r = await fetch(`${API}/alumni`, {
      method: "OPTIONS",
      headers: { Origin: SITE, "Access-Control-Request-Method": "GET" },
    });
    expect(r.headers.get("access-control-allow-origin") === SITE, "website origin is not allowed; check CLIENT_URL on Render", {
      got: r.headers.get("access-control-allow-origin"),
    });
  });
  await step("CORS blocks other websites", async () => {
    const r = await fetch(`${API}/alumni`, {
      method: "OPTIONS",
      headers: { Origin: "https://not-our-site.example", "Access-Control-Request-Method": "GET" },
    });
    expect(!r.headers.get("access-control-allow-origin"), "any website is allowed; set CLIENT_URL on Render");
  });
}
await step("test-only X-Dev-User-Id header is ignored", async () => {
  const r = await call("GET", "/profiles/me", { headers: { "X-Dev-User-Id": users.admin.id } });
  expect(r.status === 401, `expected 401, got ${r.status} (is NODE_ENV=production set?)`);
});

console.log("\n1. Student logs in and has a profile");
await step("GET /auth/me", async () => {
  const r = await call("GET", "/auth/me", { as: users.student });
  expect(r.status === 200, `status ${r.status}`, r.data);
});
await step("GET /profiles/me returns the student profile with skills", async () => {
  const r = await call("GET", "/profiles/me", { as: users.student });
  expect(r.status === 200 && r.data, `status ${r.status}`, r.data);
  return `${(r.data.profile?.skills || r.data.skills || []).length} skills`;
});

console.log("\n2. Alumni verification (uploads)");
let uploadsWork = true;
const tinyPdf = () =>
  new Blob([Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n")], {
    type: "application/pdf",
  });
await step("alumni uploads a verification document as a PRIVATE file", async () => {
  const form = new FormData();
  form.append("kind", "verification");
  form.append("file", tinyPdf(), "proof.pdf");
  const r = await call("POST", "/uploads", { as: users.alumni, form });
  if (r.status === 500 && /not configured/i.test(r.data?.error?.message || "")) {
    uploadsWork = false;
    return skip("verification upload", "CLOUDINARY_URL is not set on Render");
  }
  expect(r.status === 201 && r.data?.url, `status ${r.status}`, r.data);
  expect(r.data.url.includes("/image/authenticated/"), "file was not stored privately", r.data);
  const open = await fetch(r.data.url);
  expect(open.status !== 200, "the private file opens without a signed link");
  return "plain link is blocked";
});
await step("student uploads a resume", async () => {
  if (!uploadsWork) return skip("resume upload", "CLOUDINARY_URL is not set on Render");
  const form = new FormData();
  form.append("kind", "resume");
  form.append("file", tinyPdf(), "resume.pdf");
  const r = await call("POST", "/uploads", { as: users.student, form });
  expect(r.status === 201 && r.data?.url, `status ${r.status}`, r.data);
});
await step("admin can open the verification queue", async () => {
  const r = await call("GET", "/admin/verifications?status=pending", { as: users.admin });
  expect(r.status === 200, `status ${r.status}`, r.data);
});

console.log("\n3. Directory, AI matching and mentorship");
await step("student searches the alumni directory", async () => {
  const r = await call("GET", "/alumni?limit=5", { as: users.student });
  expect(r.status === 200 && Array.isArray(r.data?.items), `status ${r.status}`, r.data);
  return `${r.data.total ?? r.data.items.length} alumni`;
});
await step("student gets AI mentor suggestions", async () => {
  const r = await call("GET", "/matches", { as: users.student });
  const list = Array.isArray(r.data) ? r.data : r.data?.items;
  expect(r.status === 200 && Array.isArray(list) && list.length > 0, "no suggestions", r.data);
  return `top: ${list[0].alumni?.full_name}, score ${list[0].score}`;
});
await step("student requests the demo mentor, mentor accepts and completes", async () => {
  let r = await call("POST", "/mentorship", {
    as: users.student,
    body: { alumni_id: users.alumni.id, message: `${tag} mentorship check` },
  });
  let request = r.data?.request;
  if (r.status === 409) {
    const list = await call("GET", "/mentorship", { as: users.student });
    const items = Array.isArray(list.data) ? list.data : list.data?.items || [];
    request = items.find((m) => ["pending", "accepted"].includes(m.status) && (m.alumni?.user_id || m.alumni_id || m.other_user?.id) === users.alumni.id)
      || items.find((m) => ["pending", "accepted"].includes(m.status));
  } else {
    expect(r.status === 201 && request, `request failed (${r.status})`, r.data);
    expect(request.match_score !== undefined, "no match score saved", request);
  }
  expect(request, "could not find the open request");
  if (request.status === "pending") {
    r = await call("PATCH", `/mentorship/${request.id}`, { as: users.alumni, body: { status: "accepted" } });
    expect(r.status === 200, `accept failed (${r.status})`, r.data);
  }
  r = await call("PATCH", `/mentorship/${request.id}`, { as: users.alumni, body: { status: "completed" } });
  expect(r.status === 200, `complete failed (${r.status})`, r.data);
});

console.log("\n4. Events");
await step("alumni creates an event, student registers, then cancels", async () => {
  let r = await call("POST", "/events", {
    as: users.alumni,
    body: {
      title: `${tag} event`, type: "webinar", mode: "online",
      venue_or_link: "https://meet.example.com/smoke", start_time: futureDate(7).toISOString(), capacity: 5,
    },
  });
  expect(r.status === 201 && r.data?.event?.id, `create failed (${r.status})`, r.data);
  const id = r.data.event.id;
  cleanup.push(() => call("DELETE", `/events/${id}`, { as: users.alumni }));
  r = await call("POST", `/events/${id}/register`, { as: users.student });
  expect(r.status === 201, `register failed (${r.status})`, r.data);
  r = await call("GET", `/events/${id}/registrations`, { as: users.alumni });
  expect(r.status === 200, `organiser list failed (${r.status})`, r.data);
  r = await call("DELETE", `/events/${id}/register`, { as: users.student });
  expect(r.status === 204, `cancel failed (${r.status})`, r.data);
});

console.log("\n5. Jobs");
await step("alumni posts a job, student applies, alumni shortlists", async () => {
  let r = await call("POST", "/jobs", {
    as: users.alumni,
    body: { title: `${tag} job`, company: "Smoke Test Ltd", type: "internship", location: "Jaipur" },
  });
  expect(r.status === 201 && r.data?.job?.id, `post failed (${r.status})`, r.data);
  const id = r.data.job.id;
  cleanup.push(() => call("DELETE", `/jobs/${id}`, { as: users.alumni }));
  r = await call("POST", `/jobs/${id}/apply`, { as: users.student, body: {} });
  expect(r.status === 201 && r.data?.application?.id, `apply failed (${r.status})`, r.data);
  r = await call("PATCH", `/applications/${r.data.application.id}`, { as: users.alumni, body: { status: "shortlisted" } });
  expect(r.status === 200, `shortlist failed (${r.status})`, r.data);
  r = await call("GET", "/applications/my", { as: users.student });
  expect(r.status === 200, `my applications failed (${r.status})`, r.data);
});

console.log("\n6. Forum moderation");
await step("student posts, alumni reports it, admin hides it", async () => {
  let r = await call("POST", "/posts", {
    as: users.student,
    body: { title: `${tag} post`, body: "Checking the report and moderation flow.", category: "general" },
  });
  expect(r.status === 201 && r.data?.post?.id, `post failed (${r.status})`, r.data);
  const id = r.data.post.id;
  cleanup.push(() => call("DELETE", `/posts/${id}`, { as: users.admin }));
  r = await call("POST", "/reports", { as: users.alumni, body: { post_id: id, reason: "smoke test report" } });
  expect(r.status === 201 && r.data?.report?.id, `report failed (${r.status})`, r.data);
  r = await call("PATCH", `/admin/reports/${r.data.report.id}`, { as: users.admin, body: { status: "approved" } });
  expect(r.status === 200, `admin review failed (${r.status})`, r.data);
  r = await call("GET", `/posts/${id}`, { as: users.student });
  expect(r.status === 404, `hidden post is still visible to users (${r.status})`);
  r = await call("GET", `/posts/${id}`, { as: users.admin });
  expect(r.status === 200, `admin cannot see the hidden post (${r.status})`);
});
await step("admin dashboard stats", async () => {
  const r = await call("GET", "/admin/stats", { as: users.admin });
  expect(r.status === 200 && typeof r.data?.students === "number", `status ${r.status}`, r.data);
});

console.log("\nCleaning up test data");
for (const undo of cleanup.reverse()) {
  try { await undo(); } catch { /* best effort */ }
}

console.log(`\nResult: ${passed} passed, ${failed} failed, ${skipped} skipped`);
process.exitCode = failed ? 1 : 0;
