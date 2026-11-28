"use client";

// Experimental features page and switches (Specification 4.7). Switches are saved on this device only.
import { useSyncExternalStore } from "react";
import { EXPERIMENTS } from "@/lib/experiments";

const STORAGE_KEY = "hercules-experiments";
const CHANGE_EVENT = "experimentschange";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange); // a change made in another tab
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// The saved text is the snapshot, so it only counts as changed when a switch actually changes
function savedText() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return ""; // storage can be unavailable; everything is then off
  }
}

function parse(text: string): Record<string, boolean> {
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function setSwitch(id: string, on: boolean) {
  const next = parse(savedText());
  if (on) next[id] = true;
  else delete next[id];
  try {
    if (Object.keys(next).length) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable; the switch can't be remembered
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Everything is off until switched on, and off while the page is first drawn on the server
function useSwitches(): Record<string, boolean> {
  return parse(useSyncExternalStore(subscribe, savedText, () => ""));
}

// For a feature's own code: whether it's switched on on this device
export function useExperiment(id: string) {
  return useSwitches()[id] === true;
}

// The Settings row's description, for example "1 of 3 on", or "None right now"
export function useExperimentsSummary() {
  const switches = useSwitches();
  if (!EXPERIMENTS.length) return "None right now";
  return `${EXPERIMENTS.filter((e) => switches[e.id]).length} of ${EXPERIMENTS.length} on`;
}

export function ExperimentsPage({ onBack }: { onBack: () => void }) {
  const switches = useSwitches();
  return (
    <section className="screen pinned-screen">
      <div className="pinned-top">
        <button className="back-link" onClick={onBack}>‹ Settings</button>
        <h1>Experimental features</h1>
        <p className="sub">These features are experimental, and may be turned on to improve your experience with the app. Changes are applied only to this device.</p>
      </div>
      {EXPERIMENTS.length ? (
        <ul className="experiment-list">
          {EXPERIMENTS.map((e) => {
            const on = switches[e.id] === true;
            return (
              <li key={e.id}>
                <span className="experiment-text">
                  <span className="t" id={`experiment-${e.id}`}>{e.name}</span>
                  <span className="d">{e.description}</span>
                </span>
                <button className={`switch${on ? " on" : ""}`} role="switch" aria-checked={on} aria-labelledby={`experiment-${e.id}`} onClick={() => setSwitch(e.id, !on)} />
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="no-results">
          <b>Nothing to try right now</b>
          <span>New features being tested will appear here.</span>
        </div>
      )}
    </section>
  );
}
