import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyTheme, defaultThemeId, themeList } from "./themeRegistry";

const ThemeContext = createContext(null);

const APPEARANCE_KEY = "pos.appearance"; // "light" | "dark" | "system"
const BUSINESS_THEME_KEY = "pos.businessTheme";

function getSystemPrefersDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function ThemeProvider({ children }) {
  const [appearance, setAppearance] = useState(
    () => localStorage.getItem(APPEARANCE_KEY) || "system"
  );

  const [businessThemeId, setBusinessThemeId] = useState(
    () => localStorage.getItem(BUSINESS_THEME_KEY) || defaultThemeId
  );

  const resolvedMode = useMemo(() => {
    if (appearance === "system") {
      return getSystemPrefersDark() ? "dark" : "light";
    }
    return appearance;
  }, [appearance]);

  // Toggle the `dark` class Tailwind's dark variant relies on.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedMode === "dark");
  }, [resolvedMode]);

  // Re-apply the CSS variable tokens whenever theme or mode changes.
  useEffect(() => {
    applyTheme(businessThemeId, resolvedMode);
  }, [businessThemeId, resolvedMode]);

  // Follow OS changes live when the user picked "system".
  useEffect(() => {
    if (appearance !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme(businessThemeId, getSystemPrefersDark() ? "dark" : "light");
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [appearance, businessThemeId]);

  function updateAppearance(next) {
    setAppearance(next);
    localStorage.setItem(APPEARANCE_KEY, next);
  }

  function updateBusinessTheme(themeId) {
    setBusinessThemeId(themeId);
    localStorage.setItem(BUSINESS_THEME_KEY, themeId);
  }

  const value = {
    appearance, // light | dark | system
    resolvedMode, // light | dark (actual applied mode)
    setAppearance: updateAppearance,
    businessThemeId,
    setBusinessThemeId: updateBusinessTheme,
    availableThemes: themeList,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
