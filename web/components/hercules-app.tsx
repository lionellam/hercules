"use client";

// The signed-in app: four screens and the tab bar. Each screen lives in ./screens.
import { useEffect, useState } from "react";
import { expensesUrl, summaryUrl, useApiCache, useCached, useOnline } from "@/lib/client";
import { monthKey } from "@/lib/dates";
import type { Category } from "@/lib/types";
import { UndoContext, useUndoBar } from "./confirm";
import HistoryScreen from "./screens/history";
import LogScreen from "./screens/log";
import SettingsScreen from "./screens/settings";
import SummaryScreen from "./screens/summary";
import { ThemeColorSync } from "./theme";

type Tab = "log" | "history" | "summary" | "settings";

export default function HerculesApp({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("log");
  const cache = useApiCache();
  const categories = useCached<Category[]>(cache, "/api/categories") ?? [];
  const { load } = cache;
  const online = useOnline();
  const undoBar = useUndoBar();

  useEffect(() => {
    // Load the other tabs' default views up front so they open instantly
    // (The current month's Summary is worked out from this month's expenses, so only last month's totals are needed)
    load(expensesUrl(monthKey(0)));
    load(summaryUrl(monthKey(-1)));
  }, [load]);

  return (
    <UndoContext.Provider value={undoBar.showUndo}>
      <main className="app">
        {tab === "log" && <LogScreen categories={categories} online={online} cache={cache} onSaved={cache.reloadAll} />}
        {tab === "history" && <HistoryScreen categories={categories} online={online} cache={cache} onChanged={cache.reloadAll} />}
        {tab === "summary" && <SummaryScreen cache={cache} categories={categories} />}
        {tab === "settings" && <SettingsScreen email={email} categories={categories} online={online} cache={cache} onChanged={cache.reloadAll} />}
        <nav className="tabs">
          <TabButton id="log" tab={tab} setTab={setTab} label="Log" path="M12 5v14M5 12h14" />
          <TabButton id="history" tab={tab} setTab={setTab} label="History" path="M4 6h16M4 12h16M4 18h10" />
          <TabButton id="summary" tab={tab} setTab={setTab} label="Summary" path="M6 20V10M12 20V4M18 20v-6" />
          <TabButton id="settings" tab={tab} setTab={setTab} label="Settings" path="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </nav>
        {undoBar.element}
        <ThemeColorSync />
      </main>
    </UndoContext.Provider>
  );
}

function TabButton({ id, tab, setTab, label, path }: { id: Tab; tab: Tab; setTab: (t: Tab) => void; label: string; path: string }) {
  return (
    <button className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d={path} />
      </svg>
      {label}
    </button>
  );
}
