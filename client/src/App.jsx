import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";

/**
 * Root Application Component.
 *
 * Wraps the application tree in BrowserRouter to enable HTML5 client-side routing.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

