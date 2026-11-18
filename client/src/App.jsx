import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import AppRoutes from "./routes/AppRoutes";

/**
 * Root Application Component.
 *
 * – BrowserRouter enables HTML5 client-side routing.
 * – AuthProvider makes the logged-in user available to every page
 *   through the useAuth() hook. It sits inside the router so auth
 *   code can use navigation hooks if needed.
 * – ToastProvider shows short success/error pop-ups (useToast()).
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
