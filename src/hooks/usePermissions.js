import { useSelector } from "react-redux";

import { selectCurrentUser } from "@/features/auth/authSlice";

import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  hasRole,
  isSuperAdmin,
} from "@/utils/permissions";

export function usePermissions() {
  const user = useSelector(selectCurrentUser);

  // Get role slug from the populated Role object
  const role = user?.role?.slug || null;

  return {
    user,
    role,

    can: (permission) => hasPermission(user, permission),

    canAny: (permissionList) =>
      hasAnyPermission(user, permissionList),

    canAll: (permissionList) =>
      hasAllPermissions(user, permissionList),

    isRole: (slug) =>
      hasRole(user, slug),

    isSuperAdmin: isSuperAdmin(user),
  };
}