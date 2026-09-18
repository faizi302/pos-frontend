import { Navigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import Forbidden from "@/pages/errors/Forbidden";

// =====================================================
// ADMIN ONLY ROUTE
// =====================================================
//
// Restricts a route to users whose role is exactly "admin".
// Used for pages that only Admins should access
// (e.g. creating managers, certain business settings).
//
// Super Admin and Manager will see the Forbidden page.
// Unauthenticated users are sent to /login.
// =====================================================

export default function AdminOnlyRoute({ children }) {
  const { user, role } = usePermissions();

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role can come as a string or as an object with .slug
  const roleSlug =
    typeof role === "string"
      ? role
      : role?.slug ?? user?.role?.slug ?? user?.role;

  if (roleSlug !== "admin") {
    return <Forbidden />;
    // or: return <Navigate to="/forbidden" replace />;
  }

  return children;
}