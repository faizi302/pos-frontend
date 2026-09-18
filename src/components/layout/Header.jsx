import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Bell, Search, User, Settings, Palette, LogOut, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import Dropdown, { DropdownItem } from "@/components/ui/Dropdown";
import Avatar from "@/components/ui/Avatar";
import { usePermissions } from "@/hooks/usePermissions";
import { useLogoutMutation } from "@/features/auth/authApi";
import { useDispatch } from "react-redux";
import { clearCurrentUser } from "@/features/auth/authSlice";

function useBreadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return ["Dashboard"];
  return segments.map((s) =>
    s
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export default function Header({ onOpenMobileSidebar }) {
  const crumbs = useBreadcrumb();
  const { user } = usePermissions();
  const [logout, { isLoading }] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      // even if the backend call fails, clear local state so the UI is consistent
    } finally {
      dispatch(clearCurrentUser());
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-secondary bg-card/80 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="rounded-lg p-2 text-secondary hover:bg-muted-action md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <nav className="hidden items-center gap-1 text-xs text-secondary sm:flex">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {c}
              </span>
            ))}
          </nav>
          <h2 className="truncate text-sm font-semibold text-primary sm:text-base">
            {crumbs[crumbs.length - 1]}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            placeholder="Search..."
            aria-label="Search"
            className="h-9 w-56 rounded-lg border border-primary bg-surface pl-9 pr-3 text-sm text-primary
              placeholder:text-secondary outline-none focus:border-[var(--action-primary)]"
          />
        </div>

        <button
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-secondary hover:bg-muted-action"
        >
          <Bell className="h-5 w-5" />
        </button>

        <Dropdown
          trigger={
            <div className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-muted-action">
              <Avatar src={user?.avatar?.url} name={user?.name} size="sm" />
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight text-primary">
                  {user?.name || "Guest"}
                </p>
                <p className="text-xs leading-tight text-secondary">
                  {user?.role?.name || "—"}
                </p>
              </div>
            </div>
          }
        >
          <DropdownItem icon={User} onClick={() => navigate("/settings/account")}>
            Profile
          </DropdownItem>
          <DropdownItem icon={Settings} onClick={() => navigate("/settings/account")}>
            Account
          </DropdownItem>
          <DropdownItem icon={Palette} onClick={() => navigate("/settings/theme")}>
            Theme
          </DropdownItem>
          <div className="my-1 border-t border-secondary" />
          <DropdownItem icon={LogOut} danger onClick={handleLogout} disabled={isLoading}>
            Logout
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
