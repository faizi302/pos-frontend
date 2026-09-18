// =====================================================
// PERMISSION HELPERS
// -----------------------------------------------------
// The frontend must never assume a logged-in user can do
// everything. These helpers read user.role.permissions and
// user.role.slug. They only control the UI — the backend is
// always the real authorization boundary.
// =====================================================

/**
 * Returns the flat array of permission names for a user, e.g.
 * ["users.read", "businesses.create", ...]
 */
export function getPermissionNames(user) {
  const permissions = user?.role?.permissions;
  if (!Array.isArray(permissions)) return [];

  return permissions.map((p) => (typeof p === "string" ? p : p.name)).filter(Boolean);
}

/** True if the user has this exact permission. */
export function hasPermission(user, permission) {
  if (!permission) return true; // no permission required
  if (!user) return false;
  return getPermissionNames(user).includes(permission);
}

/** True if the user has at least one of the given permissions. */
export function hasAnyPermission(user, permissionList = []) {
  if (!permissionList.length) return true;
  if (!user) return false;
  const owned = getPermissionNames(user);
  return permissionList.some((p) => owned.includes(p));
}

/** True if the user has every one of the given permissions. */
export function hasAllPermissions(user, permissionList = []) {
  if (!permissionList.length) return true;
  if (!user) return false;
  const owned = getPermissionNames(user);
  return permissionList.every((p) => owned.includes(p));
}

/** True if the user's role slug matches (e.g. "super-admin"). */
export function hasRole(user, slug) {
  return user?.role?.slug === slug;
}

export function isSuperAdmin(user) {
  return hasRole(user, "super-admin");
}
