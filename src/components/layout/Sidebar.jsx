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
// BUILD FALLBACK TEXT LOGO
// "Muhammad Fazian" + "Mobiles" → "Muhammad Mobiles"
// =====================================================

function getFallbackLogoText(user) {
  if (!user) return "POS";

  const firstName = user.name?.trim().split(/\s+/)[0] || "POS";
  const businessTypeName = user.businessType?.name?.trim() || "";

  if (businessTypeName) {
    return `${firstName} ${businessTypeName}`;
  }

  return firstName;
}

// =====================================================
// LOGO IMAGE – always constrained (any upload size/aspect)
// Fits inside the h-16 header without covering nav items.
// =====================================================

function ConstrainedLogo({ src, alt, collapsed }) {
  if (collapsed) {
    return (
      <img
        src={src}
        alt={alt}
        className="mx-auto h-9 w-9 shrink-0 rounded-lg object-contain"
      />
    );
  }

  // Expanded: max height ~40px, max width ~180px, contain aspect ratio
  return (
    <div className="flex max-h-20   w-[200px] items-center justify-start overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="max-h-15 w-full   object-cover "
      />
    </div>
  );
}

// =====================================================
// SIDEBAR LOGO (role-aware)
// =====================================================

function SidebarLogo({ collapsed }) {
  const { user, role } = usePermissions();

  // ---------- SUPER ADMIN → static brand logos ----------
  if (role === "super-admin") {
    return collapsed ? (
      <img
        src="/images/mylogo3.png"
        alt="POS"
        className="mx-auto h-9 w-9 shrink-0 object-contain"
      />
    ) : (
      <div className="flex h-10 max-h-10 w-full max-w-[180px] items-center overflow-hidden">
        <img
          src="/images/mylogo2.png"
          alt="Nexora"
          className="h-full w-auto max-h-10 max-w-full object-contain object-left"
        />
      </div>
    );
  }

  // ---------- ADMIN → own logo or fallback text ----------
  if (role === "admin") {
    const logoUrl = user?.logo?.url;

    if (logoUrl) {
      return (
        <ConstrainedLogo
          src={logoUrl}
          alt={user?.name || "Logo"}
          collapsed={collapsed}
        />
      );
    }

    // No logo → text fallback
    const text = getFallbackLogoText(user);

    return collapsed ? (
      <div className="mx-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--action-primary)]/15 text-sm font-bold text-[var(--action-primary)]">
        {text.charAt(0).toUpperCase()}
      </div>
    ) : (
      <div className="truncate text-base font-semibold tracking-tight text-primary">
        {text}
      </div>
    );
  }

  // ---------- MANAGER → Admin's logo (createdBy) ----------
  if (role === "manager") {
    const admin = user?.createdBy;
    const logoUrl = admin?.logo?.url;

    if (logoUrl) {
      return (
        <ConstrainedLogo
          src={logoUrl}
          alt={admin?.name || "Logo"}
          collapsed={collapsed}
        />
      );
    }

    // No logo → Admin's fallback text
    const text = getFallbackLogoText(admin || user);

    return collapsed ? (
      <div className="mx-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--action-primary)]/15 text-sm font-bold text-[var(--action-primary)]">
        {text.charAt(0).toUpperCase()}
      </div>
    ) : (
      <div className="truncate text-base font-semibold tracking-tight text-primary">
        {text}
      </div>
    );
  }

  // ---------- Fallback (should rarely happen) ----------
  return collapsed ? (
    <img
      src="/favicon.png"
      alt="POS"
      className="mx-auto h-9 w-9 shrink-0 object-contain"
    />
  ) : (
    <div className="flex h-10 max-h-10 w-full max-w-[180px] items-center overflow-hidden">
      <img
        src="/images/nexora3.png"
        alt="Nexora"
        className="h-full w-auto max-h-10 max-w-full object-contain object-left"
      />
    </div>
  );
}

// =====================================================
// NAV ITEM
// =====================================================

function NavItem({ item, collapsed, onCloseMobile }) {
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
            ? // Active = app surface color (contrast against sidebar) + brand text
              "bg-[var(--ui-primary)] text-[var(--action-primary)] shadow-sm"
            : // Inactive = primary text, soft hover
              "text-primary hover:bg-[var(--action-secondary)]"
        }`
      }
    >
      <item.icon className="h-4.5 w-4.5 shrink-0" />

      {!collapsed && (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <span className="truncate">{item.title}</span>

          {item.comingSoon && (
            <span className="shrink-0 rounded-md bg-[var(--action-secondary)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-secondary">
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

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left transition-colors hover:bg-[var(--action-secondary)]"
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

      <div
        className={`grid transition-[grid-template-rows] duration-200 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
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

  const visiblePages = sidebarConfig.filter((item) =>
    isVisible(item, role)
  );

  const groupedPages = groupBySection(visiblePages);

  const [openSections, setOpenSections] = useState(() => {
    const initialState = {};
    Object.keys(groupedPages).forEach((section) => {
      initialState[section] = true;
    });
    return initialState;
  });

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
          HEADER – Dynamic Logo (constrained)
      ================================================= */}

      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-secondary-color)] px-3">
        <div className="flex min-w-0 flex-1 items-center overflow-hidden">
          <SidebarLogo collapsed={collapsed} />
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="ml-2 shrink-0 rounded-lg p-1.5 text-secondary transition-colors hover:bg-[var(--action-secondary)] md:hidden"
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
          {Object.entries(groupedPages).map(([section, items]) => (
            <SidebarSection
              key={section}
              section={section}
              items={items}
              collapsed={collapsed}
              open={openSections[section] ?? true}
              onToggle={() => toggleSection(section)}
              onCloseMobile={onCloseMobile}
            />
          ))}
        </div>
      </nav>

      {/* =================================================
          DESKTOP COLLAPSE BUTTON
      ================================================= */}

      <div className="hidden shrink-0 border-t border-[var(--border-secondary-color)] p-2 md:block">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-secondary transition-colors hover:bg-[var(--action-secondary)]"
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
  // RETURN
  // =====================================================
  //
  // Contrast panel:
  // - Sidebar background = brand-tinted mix of --ui-secondary
  //   so it always differs from the main app surface (--ui-primary)
  // - Works with every business theme + light/dark
  // - Active nav uses --ui-primary (app bg) for clear contrast
  // =====================================================

  const sidebarSurfaceClass =
    "bg-[color-mix(in_srgb,var(--action-primary)_9%,var(--ui-secondary))]";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-[var(--border-primary-color)] transition-all duration-200 md:block ${sidebarSurfaceClass} ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {content}
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onCloseMobile}
          />
          <aside
            className={`relative h-full w-72 shadow-xl animate-fade-up ${sidebarSurfaceClass}`}
          >
            {content}
          </aside>
        </div>
      )}
    </>
  );
}