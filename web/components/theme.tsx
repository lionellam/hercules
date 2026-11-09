"use client";

// Light and dark mode (Specification 4.4). "System" follows the device; a saved "light" or "dark" overrides it.
// The root layout's inline script applies a saved choice before the first paint.
import { useEffect, useSyncExternalStore } from "react";

type Choice = "system" | "light" | "dark";

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

const savedChoice = (): Choice => (document.documentElement.dataset.theme as "light" | "dark" | undefined) ?? "system";
const shownTheme = () => (document.documentElement.dataset.theme as "light" | "dark" | undefined) ?? (darkQuery().matches ? "dark" : "light");

function choose(choice: Choice) {
  const root = document.documentElement;
  try {
    if (choice === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", choice);
  } catch {
    // Storage can be unavailable; the choice still applies until the app closes
  }
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;
  window.dispatchEvent(new Event("themechange"));
}

// Keeps the phone's status bar matching the app's theme; rendered once by the app shell
export function ThemeColorSync() {
  const theme = useSyncExternalStore(subscribe, shownTheme, () => null);
  useEffect(() => {
    if (!theme) return;
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", THEME_COLORS[theme]));
  }, [theme]);
  return null;
}

const CHOICES: [Choice, string][] = [["system", "System"], ["light", "Light"], ["dark", "Dark"]];

export function AppearanceChoice() {
  const current = useSyncExternalStore(subscribe, savedChoice, () => null);
  return (
    <div className="seg" role="radiogroup" aria-label="Appearance">
      {CHOICES.map(([value, label]) => (
        <button key={value} role="radio" aria-checked={current === value} className={current === value ? "on" : ""} onClick={() => choose(value)}>
          {label}
        </button>
      ))}
    </div>
  );
}
