import { usePermissions } from "@/hooks/usePermissions";
import Forbidden from "@/pages/errors/Forbidden";

/**
 * Wrap a route element to require a permission (or any-of a list).
 * Usage: <PermissionRoute permission="businesses.create"><CreateBusiness /></PermissionRoute>
 */
export default function PermissionRoute({ permission, anyOf, children }) {
  const { can, canAny } = usePermissions();

  const allowed = anyOf ? canAny(anyOf) : can(permission);

  if (!allowed) {
    return <Forbidden />;
  }

  return children;
}
