// =====================================================
// THEME REGISTRY
// -----------------------------------------------------
// The backend has NO theme API yet (no model, controller,
// or routes for themes). So this registry is a temporary,
// frontend-only source of truth for business themes.
//
// Each theme just supplies values for the same semantic
// tokens defined in styles/index.css. When a real
// `/api/themes` endpoint exists later, this file can be
// replaced by data fetched from RTK Query without
// touching any component — everything reads through
// applyTheme() / useTheme().
// =====================================================

export const themes = {
  "default-indigo": {
    id: "default-indigo",
    name: "Default Indigo",
    swatch: "#4F46E5",
    light: {
      "--ui-primary": "#f4f5f7",
      "--ui-secondary": "#ffffff",
      "--action-primary": "#4f46e5",
      "--action-primary-hover": "#4338ca",
      "--action-secondary": "#e5e7eb",
      "--action-secondary-hover": "#d1d5db",
      "--border-primary-color": "#d1d5db",
      "--border-secondary-color": "#e5e7eb",
    },
    dark: {
      "--ui-primary": "#0b0f19",
      "--ui-secondary": "#141a29",
      "--action-primary": "#6366f1",
      "--action-primary-hover": "#818cf8",
      "--action-secondary": "#1f2937",
      "--action-secondary-hover": "#2b3446",
      "--border-primary-color": "#26304199",
      "--border-secondary-color": "#1f2937",
    },
  },

  "mobile-tech": {
    id: "mobile-tech",
    name: "Mobile Tech",
    swatch: "#0EA5E9",
    light: {
      "--ui-primary": "#f1f6fb",
      "--ui-secondary": "#ffffff",
      "--action-primary": "#0ea5e9",
      "--action-primary-hover": "#0284c7",
      "--action-secondary": "#e0f2fe",
      "--action-secondary-hover": "#bae6fd",
      "--border-primary-color": "#cbd5e1",
      "--border-secondary-color": "#e2e8f0",
    },
    dark: {
      "--ui-primary": "#081521",
      "--ui-secondary": "#0f2233",
      "--action-primary": "#38bdf8",
      "--action-primary-hover": "#7dd3fc",
      "--action-secondary": "#123047",
      "--action-secondary-hover": "#194061",
      "--border-primary-color": "#1e3a5599",
      "--border-secondary-color": "#123047",
    },
  },

  fashion: {
    id: "fashion",
    name: "Fashion",
    swatch: "#DB2777",
    light: {
      "--ui-primary": "#fdf2f8",
      "--ui-secondary": "#ffffff",
      "--action-primary": "#db2777",
      "--action-primary-hover": "#be185d",
      "--action-secondary": "#fce7f3",
      "--action-secondary-hover": "#fbcfe8",
      "--border-primary-color": "#f5d0e5",
      "--border-secondary-color": "#fce7f3",
    },
    dark: {
      "--ui-primary": "#1a0a13",
      "--ui-secondary": "#26101c",
      "--action-primary": "#f472b6",
      "--action-primary-hover": "#f9a8d4",
      "--action-secondary": "#3a1526",
      "--action-secondary-hover": "#4a1c30",
      "--border-primary-color": "#4a1c3099",
      "--border-secondary-color": "#3a1526",
    },
  },

  "fresh-market": {
    id: "fresh-market",
    name: "Fresh Market",
    swatch: "#16A34A",
    light: {
      "--ui-primary": "#f2f9f3",
      "--ui-secondary": "#ffffff",
      "--action-primary": "#16a34a",
      "--action-primary-hover": "#15803d",
      "--action-secondary": "#dcfce7",
      "--action-secondary-hover": "#bbf7d0",
      "--border-primary-color": "#c7e8ce",
      "--border-secondary-color": "#dcfce7",
    },
    dark: {
      "--ui-primary": "#08150c",
      "--ui-secondary": "#0f2417",
      "--action-primary": "#4ade80",
      "--action-primary-hover": "#86efac",
      "--action-secondary": "#123821",
      "--action-secondary-hover": "#18492b",
      "--border-primary-color": "#18492b99",
      "--border-secondary-color": "#123821",
    },
  },

  electronics: {
    id: "electronics",
    name: "Electronics",
    swatch: "#EA580C",
    light: {
      "--ui-primary": "#fbf5f1",
      "--ui-secondary": "#ffffff",
      "--action-primary": "#ea580c",
      "--action-primary-hover": "#c2410c",
      "--action-secondary": "#ffedd5",
      "--action-secondary-hover": "#fed7aa",
      "--border-primary-color": "#f1d9c4",
      "--border-secondary-color": "#ffedd5",
    },
    dark: {
      "--ui-primary": "#190f08",
      "--ui-secondary": "#271a0f",
      "--action-primary": "#fb923c",
      "--action-primary-hover": "#fdba74",
      "--action-secondary": "#3a2513",
      "--action-secondary-hover": "#4a2f17",
      "--border-primary-color": "#4a2f1799",
      "--border-secondary-color": "#3a2513",
    },
  },

  healthcare: {
    id: "healthcare",
    name: "Healthcare",
    swatch: "#0D9488",
    light: {
      "--ui-primary": "#f1f9f8",
      "--ui-secondary": "#ffffff",
      "--action-primary": "#0d9488",
      "--action-primary-hover": "#0f766e",
      "--action-secondary": "#ccfbf1",
      "--action-secondary-hover": "#99f6e4",
      "--border-primary-color": "#c8e6e2",
      "--border-secondary-color": "#ccfbf1",
    },
    dark: {
      "--ui-primary": "#071615",
      "--ui-secondary": "#0d2624",
      "--action-primary": "#2dd4bf",
      "--action-primary-hover": "#5eead4",
      "--action-secondary": "#123a36",
      "--action-secondary-hover": "#184a45",
      "--border-primary-color": "#184a4599",
      "--border-secondary-color": "#123a36",
    },
  },
};

export const themeList = Object.values(themes);

export const defaultThemeId = "default-indigo";

/**
 * Applies a theme's tokens (for the given mode) as CSS variables
 * on the document root. Pure DOM side-effect, no API calls.
 */
export function applyTheme(themeId, mode = "light") {
  const theme = themes[themeId] || themes[defaultThemeId];
  const tokens = theme[mode] || theme.light;

  const root = document.documentElement;
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
