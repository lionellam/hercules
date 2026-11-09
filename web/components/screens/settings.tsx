"use client";

// Settings (Specification 4.4): Categories & budgets, Appearance, Account, and the version running
import { useState } from "react";
import { signOutAction } from "@/app/actions";
import type { ApiCache } from "@/lib/client";
import type { Category } from "@/lib/types";
import { ConfirmSheet } from "../confirm";
import { AppearanceChoice } from "../theme";
import CategoriesScreen from "./categories";

// Fixed when the app is built (see next.config.ts)
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "";
const COMMIT = process.env.NEXT_PUBLIC_APP_COMMIT ?? "";
const BUILT_AT = process.env.NEXT_PUBLIC_APP_BUILT_AT ?? "";

function builtAtLabel() {
  const d = new Date(BUILT_AT);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-SG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 5h7l9 9-6 6-9-9V5zM8 9h.01" />
  </svg>
);
const PersonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);

export default function SettingsScreen({ email, categories, online, cache, onChanged }: { email: string; categories: Category[]; online: boolean; cache: ApiCache; onChanged: () => void }) {
  // Opening the Settings tab always starts on this list
  const [page, setPage] = useState<"list" | "categories">("list");
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  if (page === "categories") {
    return (
      <CategoriesScreen
        categories={categories}
        online={online}
        cache={cache}
        onChanged={onChanged}
        onBack={() => {
          setPage("list");
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  const budgeted = categories.filter((c) => c.monthly_budget != null).length;
  const updated = builtAtLabel();

  return (
    <section className="screen pinned-screen">
      <div className="pinned-top">
        <h1>Settings</h1>
      </div>

      <p className="settings-h">Spending</p>
      <button
        className="settings-row"
        onClick={() => {
          setPage("categories");
          window.scrollTo({ top: 0 });
        }}
      >
        <span className="settings-icon"><TagIcon /></span>
        <span className="settings-text">
          <span className="t">Categories &amp; budgets</span>
          <span className="d">
            {categories.length ? `${categories.length} categories · ${budgeted} with a budget` : "Loading…"}
          </span>
        </span>
        <span className="settings-chev" aria-hidden="true">›</span>
      </button>

      <p className="settings-h">Appearance</p>
      <AppearanceChoice />

      <p className="settings-h">Account</p>
      <div className="settings-row static">
        <span className="settings-icon"><PersonIcon /></span>
        <span className="settings-text">
          <span className="t">Signed in</span>
          <span className="d">{email}</span>
        </span>
      </div>
      <button className="settings-row danger" onClick={() => setConfirmSignOut(true)}>
        <span className="settings-text"><span className="t">Sign out</span></span>
      </button>

      <p className="settings-version">
        Version {VERSION}
        {COMMIT && ` (${COMMIT})`}
        {updated && (
          <>
            <br />
            Last updated {updated}
          </>
        )}
      </p>

      {confirmSignOut && (
        <ConfirmSheet
          title="Sign out?"
          body="You'll need to sign in with Google again to use Hercules on this device. Your expenses stay safe in your account."
          confirmLabel="Sign out"
          onConfirm={async () => {
            await signOutAction();
            // A full reload, not an in-app navigation, so no expenses stay in memory for the next person
            window.location.replace("/signin");
          }}
          onCancel={() => setConfirmSignOut(false)}
        />
      )}
    </section>
  );
}
