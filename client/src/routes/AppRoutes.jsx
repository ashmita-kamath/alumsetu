import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute, { GuestRoute } from "./ProtectedRoute";
import Home from "../pages/Home";
import AlumniDirectory from "../pages/AlumniDirectory";
import AlumniProfile from "../pages/AlumniProfile";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/dashboard/Dashboard";
import EditProfile from "../pages/EditProfile";
import MyRequests from "../pages/mentorship/MyRequests";
import IncomingRequests from "../pages/mentorship/IncomingRequests";
import ForumList from "../pages/forum/ForumList";
import NewPost from "../pages/forum/NewPost";
import PostDetail from "../pages/forum/PostDetail";
import EventsList from "../pages/events/EventsList";
import EventDetail from "../pages/events/EventDetail";
import CreateEvent from "../pages/events/CreateEvent";
import MyRegistrations from "../pages/events/MyRegistrations";
import JobsList from "../pages/jobs/JobsList";
import JobDetail from "../pages/jobs/JobDetail";
import PostJob from "../pages/jobs/PostJob";
import MyApplications from "../pages/jobs/MyApplications";
import NotFound from "../pages/NotFound";

/**
 * Top-level route configuration for AlumSetu.
 *
 * All pages are nested inside MainLayout so that the sticky Navbar
 * and responsive Footer are consistently rendered.
 *
 * Route groups:
 * - Public:     / (landing)
 * - Guest only: /login, /register (logged-in users go to /dashboard)
 * - Any logged-in user: /dashboard, /alumni, /alumni/:userId, /forum, /forum/new, /forum/:id,
 *   /events, /events/:id, /jobs, /jobs/:id
 * - Alumni and admins: /events/new (the page also checks the alumnus is verified)
 * - Students and alumni: /events/my
 * - Students and alumni: /profile/edit (admins have no profile)
 * - Students only: /mentorship/requests, /applications
 * - Alumni only:   /mentorship/incoming, /jobs/new (the page also checks verification)
 * - *  → 404 fallback page
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />

        <Route element={<GuestRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="alumni" element={<AlumniDirectory />} />
          <Route path="alumni/:userId" element={<AlumniProfile />} />
          <Route path="forum" element={<ForumList />} />
          <Route path="forum/new" element={<NewPost />} />
          <Route path="forum/:id" element={<PostDetail />} />
          <Route path="events" element={<EventsList />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="jobs" element={<JobsList />} />
          <Route path="jobs/:id" element={<JobDetail />} />
        </Route>

        <Route element={<ProtectedRoute roles={["student", "alumni"]} />}>
          <Route path="profile/edit" element={<EditProfile />} />
        </Route>

        <Route element={<ProtectedRoute roles={["alumni", "admin"]} />}>
          <Route path="events/new" element={<CreateEvent />} />
        </Route>

        <Route element={<ProtectedRoute roles={["student", "alumni"]} />}>
          <Route path="events/my" element={<MyRegistrations />} />
        </Route>

        <Route element={<ProtectedRoute roles={["student"]} />}>
          <Route path="mentorship/requests" element={<MyRequests />} />
          <Route path="applications" element={<MyApplications />} />
        </Route>

        <Route element={<ProtectedRoute roles={["alumni"]} />}>
          <Route path="mentorship/incoming" element={<IncomingRequests />} />
          <Route path="jobs/new" element={<PostJob />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
