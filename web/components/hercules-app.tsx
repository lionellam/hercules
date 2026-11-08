"use client";

// The signed-in app: four screens and the tab bar. Each screen lives in ./screens.
import { useEffect, useState } from "react";
import { expensesUrl, summaryUrl, useApiCache, useCached, useOnline } from "@/lib/client";
import { monthKey } from "@/lib/dates";
import type { Category } from "@/lib/types";
import { UndoContext, useUndoBar } from "./confirm";
import CategoriesScreen from "./screens/categories";
import HistoryScreen from "./screens/history";
import LogScreen from "./screens/log";
import SummaryScreen from "./screens/summary";

type Tab = "log" | "history" | "summary" | "categories";

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
        {tab === "summary" && <SummaryScreen email={email} cache={cache} categories={categories} />}
        {tab === "categories" && <CategoriesScreen categories={categories} online={online} cache={cache} onChanged={cache.reloadAll} />}
        <nav className="tabs">
          <TabButton id="log" tab={tab} setTab={setTab} label="Log" path="M12 5v14M5 12h14" />
          <TabButton id="history" tab={tab} setTab={setTab} label="History" path="M4 6h16M4 12h16M4 18h10" />
          <TabButton id="summary" tab={tab} setTab={setTab} label="Summary" path="M6 20V10M12 20V4M18 20v-6" />
          <TabButton id="categories" tab={tab} setTab={setTab} label="Categories" path="M4 5h7l9 9-6 6-9-9V5zM8 9h.01" />
        </nav>
        {undoBar.element}
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
