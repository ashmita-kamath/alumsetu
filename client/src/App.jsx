import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";

/**
 * Root Application Component.
 *
 * – BrowserRouter enables HTML5 client-side routing.
 * – AuthProvider makes the logged-in user available to every page
 *   through the useAuth() hook. It sits inside the router so auth
 *   code can use navigation hooks if needed.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
