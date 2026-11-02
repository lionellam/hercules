"use client";

import { useEffect, useSyncExternalStore } from "react";

const THEME_COLORS = { light: "#ffffff", dark: "#18181b" };
const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

function subscribe(onChange: () => void) {
  const query = darkQuery();
  query.addEventListener("change", onChange);
  window.addEventListener("themechange", onChange);
  return () => {
    query.removeEventListener("change", onChange);
    window.removeEventListener("themechange", onChange);
  };
}

// Set by the toggle or the inline script in the root layout; otherwise follows the device's setting
function currentTheme() {
  const saved = document.documentElement.dataset.theme as "light" | "dark" | undefined;
  return saved ?? (darkQuery().matches ? "dark" : "light");
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => null);

  // Keeps the phone's status bar matching the app when the choice differs from the device's setting
  useEffect(() => {
    if (!theme) return;
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", THEME_COLORS[theme]));
  }, [theme]);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be unavailable; the choice still applies until the app closes
    }
    window.dispatchEvent(new Event("themechange"));
  }

  return (
    <button className="theme-toggle" onClick={toggle} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
      {theme && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {theme === "dark" ? (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
            </>
          ) : (
            <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
          )}
        </svg>
      )}
    </button>
  );
}
