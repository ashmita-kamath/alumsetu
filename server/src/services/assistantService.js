// The AlumSetu help assistant: answers common questions and points people to
// the right page. No paid AI API; it uses the same TF-IDF + cosine similarity
// as mentor matching (services/matching/textSimilarity.js).
//
// HOW IT ANSWERS
// 1. Clean the message into words (lowercase, drop filler words, "jobs" → "job",
//    a few Hindi words → English).
// 2. Compare it with every way of asking each topic in data/assistantFaq.js.
//    The topic with the most similar phrasing wins.
// 3. If nothing is similar enough, say so and suggest what it can help with.
// 4. Some topics add live data: the student's top mentor matches, the next
//    events or the newest jobs.
// The answer and links depend on who is asking (student, alumni, admin, guest).

import { TOPICS, SUGGESTIONS } from "../data/assistantFaq.js";
import { tfidfVectors, cosineSimilarity } from "./matching/textSimilarity.js";
import { checkText } from "./moderationService.js";
import { getMentorMatches } from "./matchingService.js";
import { listEvents } from "./eventService.js";
import { listJobs } from "./jobService.js";

// Below this similarity the assistant says it isn't sure instead of guessing.
export const MIN_SCORE = 0.3;

const FILLER = new Set([
  "a", "an", "the", "is", "are", "am", "was", "be", "to", "of", "in", "on", "for", "at", "by", "and", "or",
  "i", "me", "my", "we", "our", "you", "your", "it", "this", "that", "do", "does", "can", "could", "would",
  "should", "please", "pls", "plz", "tell", "about", "there", "any", "some", "with", "from", "so", "much",
  "what", "who", "how", "where", "when", "which", "why", "want", "need", "get", "know", "someone", "anyone",
  "kya", "hai", "mujhe", "kaise", "ka", "ki", "ke", "koi",
]);

const SAME_AS = {
  jobs: "job", naukri: "job", opening: "job", openings: "job", vacancy: "job", vacancies: "job",
  internships: "internship", mentors: "mentor", mentoring: "mentor", mentorship: "mentor", guru: "mentor",
  seniors: "alumni", senior: "alumni", alumnus: "alumni", alum: "alumni",
  events: "event", webinars: "webinar", meetups: "meetup", sessions: "session",
  signup: "register", "sign-up": "register", login: "log", signin: "log",
  verify: "verified", verification: "verified", badge: "verified",
  college: "college", colleges: "college", polytechnic: "college", institute: "college",
};

export function words(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !FILLER.has(w))
    .map((w) => SAME_AS[w] || (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w));
}

// Every phrasing, remembered with the topic it belongs to.
const PHRASINGS = TOPICS.flatMap((topic) => topic.questions.map((question) => ({ topic, question })));

// Returns { topic, score } for the closest topic, or { topic: null, score }.
export function findTopic(message) {
  const vectors = tfidfVectors([...PHRASINGS.map((p) => p.question), message], words);
  const messageVector = vectors.at(-1);
  let best = { topic: null, score: 0 };
  PHRASINGS.forEach((p, i) => {
    const score = cosineSimilarity(messageVector, vectors[i]);
    if (score > best.score) best = { topic: p.topic, score };
  });
  return best.score >= MIN_SCORE ? best : { topic: null, score: best.score };
}

// Picks the version of an answer or link list for this kind of user.
function forRole(value, role) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" || Array.isArray(value)) return value;
  return value[role] ?? value.default;
}

const formatDate = (date) =>
  new Date(date).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

// Live data for topics that have an `action`. Guests get none (these pages need a login).
async function liveItems(action, user) {
  if (!user) return { items: [] };

  if (action === "mentors") {
    if (user.role !== "student") return { items: [] };
    const matches = await getMentorMatches(user.id, 3);
    if (matches.length === 0) {
      return {
        items: [],
        answer: "Add your skills and a career goal to your profile first; mentor suggestions are based on them.",
        links: [{ label: "Edit profile", to: "/profile/edit" }],
      };
    }
    return {
      items: matches.map((m) => ({
        title: m.alumni.full_name,
        subtitle: [[m.alumni.job_title, m.alumni.current_company].filter(Boolean).join(" at "), m.reasons[0]].filter(Boolean).join(" · "),
        to: `/alumni/${m.alumni.user_id}`,
      })),
    };
  }

  if (action === "events") {
    const { items } = await listEvents({ when: "upcoming", page: 1, limit: 3 });
    if (items.length === 0) return { items: [], answer: "There are no upcoming events right now. Check back soon." };
    return { items: items.map((e) => ({ title: e.title, subtitle: `${formatDate(e.start_time)} · ${e.mode}`, to: `/events/${e.id}` })) };
  }

  if (action === "jobs") {
    const { items } = await listJobs({ page: 1, limit: 3 });
    if (items.length === 0) return { items: [], answer: "There are no open jobs right now. Check back soon." };
    return {
      items: items.map((j) => ({ title: j.title, subtitle: [j.company, j.location].filter(Boolean).join(" · "), to: `/jobs/${j.id}` })),
    };
  }

  return { items: [] };
}

// user is null for visitors who aren't logged in.
export async function answer(message, user) {
  const role = user?.role || "guest";
  const suggestions = SUGGESTIONS[role];

  if (!checkText(message).allowed) {
    return { topic: null, answer: "Let's keep it friendly. Please ask your question without that language.", links: [], items: [], suggestions };
  }

  const { topic } = findTopic(message);
  if (!topic) {
    return {
      topic: null,
      answer: "Sorry, I'm not sure about that. Try one of these, or ask the community in the forum.",
      links: role === "guest" ? [] : [{ label: "Ask in the forum", to: "/forum/new" }],
      items: [],
      suggestions,
    };
  }

  const live = topic.action ? await liveItems(topic.action, user) : { items: [] };
  return {
    topic: topic.id,
    answer: live.answer || forRole(topic.answer, role),
    links: live.links || forRole(topic.links, role) || [],
    items: live.items,
    suggestions: [],
  };
}

export function welcome(user) {
  const role = user?.role || "guest";
  const name = user?.full_name?.split(" ")[0];
  return {
    answer: `Hi${name ? ` ${name}` : ""}! I'm the AlumSetu assistant. Ask me about mentors, events, jobs, verification or how to use the site.`,
    suggestions: SUGGESTIONS[role],
  };
}
