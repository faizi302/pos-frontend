import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";


import { sidebarConfig } from "@/config/sidebarConfig";
import { usePermissions } from "@/hooks/usePermissions";

// =====================================================
// CHECK PAGE VISIBILITY
// =====================================================

function isVisible(item, role) {
  return item.roles?.includes(role);
}

// =====================================================
// GROUP ITEMS BY SECTION
// =====================================================

function groupBySection(items) {
  return items.reduce((groups, item) => {
    const section = item.section || "Other";

    if (!groups[section]) {
      groups[section] = [];
    }

    groups[section].push(item);

    return groups;
  }, {});
}

// =====================================================
// NAV ITEM
// =====================================================

function NavItem({
  item,
  collapsed,
  onCloseMobile,
}) {
  return (
    <NavLink
      to={
        item.comingSoon
          ? `/coming-soon?feature=${encodeURIComponent(item.title)}`
          : item.path
      }
      title={collapsed ? item.title : undefined}
      onClick={onCloseMobile}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-brand/15 text-[var(--action-primary)]"
            : "text-primary hover:bg-muted-action"
        }`
      }
    >
      {/* Icon */}

      <item.icon className="h-4.5 w-4.5 shrink-0" />

      {/* Title */}

      {!collapsed && (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">

          <span className="truncate">
            {item.title}
          </span>

          {/* Coming Soon Badge */}

          {item.comingSoon && (
            <span className="shrink-0 rounded-md bg-muted-action px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-secondary">
              Soon
            </span>
          )}

        </div>
      )}
    </NavLink>
  );
}

// =====================================================
// SECTION
// =====================================================

function SidebarSection({
  section,
  items,
  collapsed,
  open,
  onToggle,
  onCloseMobile,
}) {
  const isDashboard = section === "Dashboard";

  // ===================================================
  // DASHBOARD
  // ===================================================

  if (isDashboard) {
    return (
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            collapsed={collapsed}
            onCloseMobile={onCloseMobile}
          />
        ))}
      </div>
    );
  }

  // ===================================================
  // COLLAPSED SIDEBAR
  // ===================================================

  if (collapsed) {
    return (
      <div className="flex flex-col gap-0.5">

        {items.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            collapsed={collapsed}
            onCloseMobile={onCloseMobile}
          />
        ))}

      </div>
    );
  }

  // ===================================================
  // NORMAL SIDEBAR
  // ===================================================

  return (
    <div className="flex flex-col">

      {/* =================================================
          SECTION HEADER
      ================================================= */}

      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left transition-colors hover:bg-muted-action"
        aria-expanded={open}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
          {section}
        </span>

        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-secondary transition-transform" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-secondary transition-transform" />
        )}
      </button>

      {/* =================================================
          SECTION CONTENT
      ================================================= */}

      <div
        className={`grid transition-[grid-template-rows] duration-200 ${
          open
            ? "grid-rows-[1fr]"
            : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">

          <div className="mt-1 flex flex-col gap-0.5">

            {items.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                collapsed={collapsed}
                onCloseMobile={onCloseMobile}
              />
            ))}

          </div>

        </div>
      </div>

    </div>
  );
}

// =====================================================
// SIDEBAR
// =====================================================

export default function Sidebar({
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
}) {
  const { role } = usePermissions();

  // ===================================================
  // FILTER PAGES BY ROLE
  // ===================================================

  const visiblePages = sidebarConfig.filter((item) =>
    isVisible(item, role)
  );

  // ===================================================
  // GROUP PAGES
  // ===================================================

  const groupedPages = groupBySection(visiblePages);

  // ===================================================
  // SECTION OPEN STATES
  // ===================================================

  const [openSections, setOpenSections] = useState(() => {
    const initialState = {};

    Object.keys(groupedPages).forEach((section) => {
      initialState[section] = true;
    });

    return initialState;
  });

  // ===================================================
  // TOGGLE SECTION
  // ===================================================

  const toggleSection = (section) => {
    setOpenSections((previous) => ({
      ...previous,
      [section]: !previous[section],
    }));
  };

  // ===================================================
  // SIDEBAR CONTENT
  // ===================================================

  const content = (
    <div className="flex h-full flex-col">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex h-16 shrink-0 items-center justify-between border-b border-secondary px-3">

        {/* Logo container – fills available space */}
        <div className="flex min-w-0 flex-1 items-center overflow-hidden">

          {collapsed ? (
            // Collapsed: square logo, centered
            <img
              src="/favicon.png"
              alt="POS"
              className="mx-auto h-9 w-9 shrink-0 object-contain"
            />
          ) : (
            // Expanded + Mobile: full logo that fills the header height & width
            <img
              src="/images/nexora3.png"
              alt="Nexora"
              className="h-full w-auto w-full object-cover "
            />
          )}

        </div>

        {/* =================================================
            MOBILE CLOSE BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={onCloseMobile}
          className="ml-2 shrink-0 rounded-lg p-1.5 text-secondary hover:bg-muted-action md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>

      </div>

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="flex-1 overflow-y-auto px-2 py-3">

        <div className="flex flex-col gap-3">

          {Object.entries(groupedPages).map(
            ([section, items]) => (
              <SidebarSection
                key={section}
                section={section}
                items={items}
                collapsed={collapsed}
                open={openSections[section] ?? true}
                onToggle={() =>
                  toggleSection(section)
                }
                onCloseMobile={onCloseMobile}
              />
            )
          )}

        </div>

      </nav>

      {/* =================================================
          DESKTOP COLLAPSE BUTTON
      ================================================= */}

      <div className="hidden shrink-0 border-t border-secondary p-2 md:block">

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-secondary transition-colors hover:bg-muted-action"
        >
          {collapsed ? (
            <ChevronsRight className="h-4.5 w-4.5" />
          ) : (
            <ChevronsLeft className="h-4.5 w-4.5" />
          )}
        </button>

      </div>

    </div>
  );

  // =====================================================
  // RETURN SIDEBAR
  // =====================================================

  return (
    <>
      {/* =================================================
          DESKTOP SIDEBAR
      ================================================= */}

      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-secondary bg-card transition-all duration-200 md:block ${
          collapsed
            ? "w-[72px]"
            : "w-64"
        }`}
      >
        {content}
      </aside>

      {/* =================================================
          MOBILE SIDEBAR
      ================================================= */}

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">

          {/* Overlay */}

          <div
            className="absolute inset-0 bg-black/50"
            onClick={onCloseMobile}
          />

          {/* Drawer */}

          <aside className="relative h-full w-72 bg-card shadow-xl animate-fade-up">
            {content}
          </aside>

        </div>
      )}
    </>
  );
}