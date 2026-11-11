import { useParams } from "react-router-dom";

/**
 * Placeholder page for an individual Alumni Profile.
 * Will be fully built in Phase 2 (feat/ui-directory).
 *
 * It extracts `userId` from the URL via useParams() so that
 * dynamic routing `/alumni/:userId` works cleanly.
 */
export default function AlumniProfile() {
  const { userId } = useParams();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Alumni Profile</h1>
      <p className="mt-2 text-body">Viewing profile for user ID: {userId}</p>
      <p className="mt-1 text-sm text-body/70">Full profile details coming soon.</p>
    </div>
  );
}
