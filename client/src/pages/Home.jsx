import { Link } from "react-router-dom";
import { Card } from "../components/ui";

/**
 * Landing page — the first thing a visitor sees.
 *
 * STRUCTURE
 * 1. Hero section: one-sentence tagline about AlumSetu + a CTA button.
 * 2. Three feature cards explaining the platform's pillars:
 *    Connect (directory + AI mentor suggestions),
 *    Engage  (mentorship, forum, events),
 *    Grow    (jobs and referrals).
 * 3. A final call-to-action asking visitors to register.
 *
 * WHY NO STATE / API CALLS?
 * This page is fully static — there's nothing to fetch.
 * It's pure JSX + Tailwind classes, so it loads instantly.
 */

const features = [
  {
    title: "Connect",
    description:
      "Browse a searchable alumni directory and get AI-powered mentor suggestions matched to your skills and career goals.",
    icon: (
      <svg className="h-8 w-8 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    title: "Engage",
    description:
      "Request mentorship from verified alumni, discuss careers and academics in the forum, and join events like webinars and meetups.",
    icon: (
      <svg className="h-8 w-8 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  {
    title: "Grow",
    description:
      "Discover job openings, internships, and referral opportunities posted by verified alumni from Rajasthan's technical colleges.",
    icon: (
      <svg className="h-8 w-8 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Bridging Students and Alumni of Rajasthan's Technical Colleges
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            AlumSetu connects you with verified alumni for mentorship, career guidance, and opportunities — all in one place.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-block rounded-lg bg-orange px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-orange/90"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          What AlumSetu Offers
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="flex flex-col items-start gap-3">
              {f.icon}
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-body">
                {f.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to Connect?
          </h2>
          <p className="mt-3 text-gray-300">
            Create your free account and start exploring the alumni network.
          </p>
          <Link
            to="/register"
            className="mt-6 inline-block rounded-lg bg-orange px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-orange/90"
          >
            Register Now
          </Link>
        </div>
      </section>
    </>
  );
}
