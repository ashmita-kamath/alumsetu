// What the AlumSetu help assistant knows.
//
// Each topic has:
//   questions  different ways people ask it (the assistant compares the user's
//              message with these using TF-IDF, so more phrasings = better matching)
//   answer     a string, or { student, alumni, admin, guest, default } when the
//              answer depends on who is asking
//   links      pages to open: { label, to }, or { student: [...], ... } per role
//   action     optional live data to add: "mentors" | "events" | "jobs"
//
// Keep answers short: one or two sentences, then a link.

export const TOPICS = [
  {
    id: "greeting",
    questions: ["hi", "hello", "hey", "namaste", "good morning", "good evening", "hii there"],
    answer: "Hello! I can help you find mentors, events, jobs and your way around AlumSetu. What would you like to do?",
  },
  {
    id: "thanks",
    questions: ["thanks", "thank you", "thank you so much", "great thanks", "ok thanks", "dhanyavaad"],
    answer: "You're welcome! Ask me anything else about AlumSetu.",
  },
  {
    id: "about",
    questions: ["what is alumsetu", "what is this website", "what can i do here", "how does this platform work", "about alumsetu", "who made this"],
    answer:
      "AlumSetu connects students and alumni of Rajasthan's government technical colleges. Students get mentors, career guidance, events and job referrals from verified alumni.",
    links: [{ label: "Home", to: "/" }],
  },
  {
    id: "register",
    questions: ["how do i sign up", "create an account", "register", "how to join", "make new account", "sign up as alumni", "sign up as student"],
    answer: {
      guest: "Click Sign up, choose Student or Alumni, and enter your name, email and a password. Then fill in your profile.",
      default: "You already have an account. You can update your details on your profile page.",
    },
    links: { guest: [{ label: "Sign up", to: "/register" }], default: [{ label: "Edit profile", to: "/profile/edit" }] },
  },
  {
    id: "login",
    questions: ["how do i log in", "login", "sign in", "cannot log in", "forgot password", "login problem", "reset my password"],
    answer:
      "Log in with the email and password you signed up with. If your account was suspended, you'll see a message; contact your college's admin. Password reset by email isn't available yet, so ask an admin for help.",
    links: [{ label: "Log in", to: "/login" }],
  },
  {
    id: "profile",
    questions: ["edit my profile", "update profile", "change my details", "add skills", "complete my profile", "change my college", "update my company"],
    answer: {
      student: "Open Edit profile to add your college, branch, career goal and skills. Your skills and goal are used to suggest mentors.",
      alumni: "Open Edit profile to add your company, job title, employment status, achievements and skills, so students can find you.",
      admin: "Admin accounts don't have a profile.",
      guest: "Log in first, then open Edit profile from the menu.",
    },
    links: { student: [{ label: "Edit profile", to: "/profile/edit" }], alumni: [{ label: "Edit profile", to: "/profile/edit" }], guest: [{ label: "Log in", to: "/login" }] },
  },
  {
    id: "find-mentor",
    questions: [
      "find a mentor", "suggest a mentor", "who can mentor me", "recommend alumni for me", "mentor suggestions",
      "i need guidance from a senior", "connect me with alumni", "which alumni should i contact", "best mentor for me",
    ],
    answer: {
      student: "Here are alumni who match your skills and career goal. Open a profile and send a mentorship request.",
      alumni: "Mentor suggestions are for students. As an alumnus, you'll see students' requests under Mentorship requests.",
      admin: "Mentor suggestions are shown to students on their dashboard.",
      guest: "Log in as a student to get mentor suggestions based on your skills and career goal.",
    },
    links: {
      student: [{ label: "Browse all alumni", to: "/alumni" }],
      alumni: [{ label: "Mentorship requests", to: "/mentorship/incoming" }],
      guest: [{ label: "Log in", to: "/login" }],
    },
    action: "mentors",
  },
  {
    id: "mentorship-request",
    questions: [
      "how do i request mentorship", "send mentorship request", "status of my mentorship request", "my requests",
      "did the alumni accept my request", "cancel mentorship request", "how does mentorship work",
    ],
    answer: {
      student: "Open an alumnus's profile and click Request mentorship with a short message. Track the status (pending, accepted, declined) in My requests.",
      alumni: "Students' requests appear under Mentorship requests, where you can accept or decline them.",
      default: "Students send mentorship requests to verified alumni, and the alumnus accepts or declines.",
    },
    links: {
      student: [{ label: "My requests", to: "/mentorship/requests" }, { label: "Alumni directory", to: "/alumni" }],
      alumni: [{ label: "Mentorship requests", to: "/mentorship/incoming" }],
    },
  },
  {
    id: "directory",
    questions: ["search alumni", "alumni directory", "find alumni from my college", "alumni working at a company", "filter alumni by branch", "find seniors from my branch", "alumni list"],
    answer: "The alumni directory lets you search by name, college, branch, batch, company and skill. Tick Verified to see only checked profiles.",
    links: { default: [{ label: "Alumni directory", to: "/alumni" }], guest: [{ label: "Log in to search", to: "/login" }] },
  },
  {
    id: "verification",
    questions: [
      "how do i get verified", "verified badge", "upload proof", "verification document", "why am i not verified",
      "my verification was rejected", "fake profiles", "how do you stop fake alumni",
    ],
    answer: {
      alumni:
        "On your dashboard, upload your degree certificate, alumni ID or final-year marksheet. An admin checks it and the Verified badge appears. Only verified alumni appear in mentor suggestions and can post jobs and events.",
      admin: "Pending proofs are in the Verifications queue. Approve, or reject with a reason the alumnus will see.",
      default: "Every alumnus uploads proof of graduation, and an admin checks it before the Verified badge appears. This keeps fake profiles out.",
    },
    links: { alumni: [{ label: "Dashboard", to: "/dashboard" }], admin: [{ label: "Verifications", to: "/admin/verifications" }] },
  },
  {
    id: "events",
    questions: [
      "upcoming events", "any webinars", "alumni meetup", "panel discussion", "career guidance session",
      "how do i register for an event", "events this week", "online sessions",
    ],
    answer: {
      default: "Here are the next events. Open one to register; seats are limited.",
      guest: "Alumni host meetups, webinars, panels and career guidance sessions. Log in to see and register for them.",
    },
    links: { default: [{ label: "All events", to: "/events" }], guest: [{ label: "Log in", to: "/login" }] },
    action: "events",
  },
  {
    id: "host-event",
    questions: ["create an event", "host a webinar", "organise a meetup", "how do i post an event", "schedule a session for students"],
    answer: {
      alumni: "Verified alumni can create events: choose the type (meetup, webinar, panel or career session), date, place or link, and seats.",
      admin: "Admins can create events for any college.",
      default: "Verified alumni and admins create events.",
    },
    links: { alumni: [{ label: "Create event", to: "/events/new" }], admin: [{ label: "Create event", to: "/events/new" }] },
  },
  {
    id: "jobs",
    questions: [
      "job openings", "internships", "placement help", "referrals", "any jobs for freshers", "how do i apply for a job",
      "latest jobs", "placement assistance", "internship for second year",
    ],
    answer: {
      default: "Here are the latest openings posted by alumni. Open one to read the details.",
      student: "Here are the latest openings posted by alumni. Open one and click Apply (you can attach a resume). Track your applications in My applications.",
      guest: "Alumni post jobs, internships and referrals. Log in to see and apply.",
    },
    links: {
      default: [{ label: "All jobs", to: "/jobs" }],
      student: [{ label: "All jobs", to: "/jobs" }, { label: "My applications", to: "/applications" }],
      guest: [{ label: "Log in", to: "/login" }],
    },
    action: "jobs",
  },
  {
    id: "post-job",
    questions: ["post a job", "share a referral", "post an internship", "hire students", "how do i see applicants", "shortlist applicants"],
    answer: {
      alumni: "Verified alumni can post jobs, internships and referrals. Open your job to see applicants and shortlist, select or reject them.",
      default: "Verified alumni post jobs, internships and referrals.",
    },
    links: { alumni: [{ label: "Post a job", to: "/jobs/new" }] },
  },
  {
    id: "forum",
    questions: [
      "discussion forum", "ask a question", "academic doubt", "study help", "academic support", "post in forum",
      "ask seniors about placements", "how to start a discussion", "help with my doubts", "doubt in a subject",
    ],
    answer: "Use the forum to ask questions about careers, academics and placements. Alumni and students can reply.",
    links: { default: [{ label: "Forum", to: "/forum" }, { label: "New post", to: "/forum/new" }], guest: [{ label: "Log in", to: "/login" }] },
  },
  {
    id: "report",
    questions: ["report a post", "abusive comment", "inappropriate content", "someone is harassing me", "spam in forum", "offensive language"],
    answer:
      "Abusive language is blocked automatically. If you still see something wrong, open it and click Report. An admin will review it and can hide it.",
    links: { default: [{ label: "Forum", to: "/forum" }], admin: [{ label: "Reports queue", to: "/admin/reports" }] },
  },
  {
    id: "career-guidance",
    questions: [
      "career guidance", "which career should i choose", "i am confused about my career", "how to prepare for placements",
      "higher studies or job", "gate or job", "how to get an internship", "guidance for my future",
      "how to become a software engineer", "how to become a data scientist", "what skills should i learn", "career path after diploma",
    ],
    answer: {
      student:
        "Talk to someone who's been there: request mentorship from a matching alumnus, join a career guidance session, or ask in the forum's careers section. Adding a career goal to your profile improves your mentor suggestions.",
      default: "Students get career guidance from alumni through mentorship, career sessions and the forum.",
    },
    links: {
      student: [{ label: "Dashboard", to: "/dashboard" }, { label: "Events", to: "/events" }, { label: "Forum", to: "/forum" }],
      default: [{ label: "Forum", to: "/forum" }],
    },
  },
  {
    id: "colleges",
    questions: ["which colleges are included", "my college is not listed", "my college is missing", "add my college", "is my polytechnic here", "college list"],
    answer: {
      admin: "You can add a college under Colleges in the admin menu.",
      default:
        "AlumSetu covers the government engineering colleges and polytechnics under Rajasthan's Department of Technical Education. If yours is missing, ask your college admin to add it.",
    },
    links: { admin: [{ label: "Colleges", to: "/admin/institutions" }] },
  },
  {
    id: "privacy",
    questions: ["who can see my email", "is my phone number public", "privacy", "my personal information", "delete my account", "who sees my documents"],
    answer:
      "Your email and phone number are only visible to you and the admins. Verification documents are private: only admins can open them, through a link that expires after 10 minutes. To delete your account, contact an admin.",
  },
];

// Shown when the assistant isn't sure, and as starting suggestions
export const SUGGESTIONS = {
  student: ["Suggest a mentor", "Upcoming events", "Latest jobs", "How do I edit my profile?"],
  alumni: ["How do I get verified?", "Post a job", "Create an event", "Mentorship requests"],
  admin: ["Verification queue", "Reported content", "Add a college", "Upcoming events"],
  guest: ["What is AlumSetu?", "How do I sign up?", "How do you stop fake profiles?", "Which colleges are included?"],
};
