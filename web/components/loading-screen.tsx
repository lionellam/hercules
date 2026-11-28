"use client";

// The experimental loading screen (Specification 4.10, Architecture decision 47): the ship picture and "Hercules"
// over the app while it starts, until the Log screen's first data has arrived.
//
// It is drawn on the server with the rest of the page, but stays hidden unless the script in the page head
// (app/layout.tsx) found the "loading-screen" switch on and set data-splash on the page's root element. So with
// the switch off nothing shows. The picture is a CSS background (globals.css), fetched only when the screen is
// shown: an <img>, even hidden, is downloaded as soon as the browser reads the page.
// "Still loading..." after 3 seconds and giving way after 10 are CSS animations, so they work before this script runs.
import { useEffect, useState } from "react";

const MIN_MS = 500;
const READY_EVENT = "hercules-log-ready";
let logReady = false;

// Called by the app once the Log screen's first data (this month's expenses and the categories) has arrived
export function markLogReady() {
  if (logReady) return;
  logReady = true;
  window.dispatchEvent(new Event(READY_EVENT));
}

export function LoadingScreen() {
  const [state, setState] = useState<"showing" | "leaving" | "gone">("showing");

  useEffect(() => {
    const start = performance.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const leave = () => setState((s) => (s === "showing" ? "leaving" : s));
    // At least half a second on screen, so a quick load doesn't flash it on and off
    const ready = () => {
      timer = setTimeout(leave, Math.max(0, MIN_MS - (performance.now() - start)));
    };
    if (logReady) ready();
    else window.addEventListener(READY_EVENT, ready, { once: true });
    // Offline, nothing more will arrive: give way to the Log screen and its offline message straight away
    if (!navigator.onLine) leave();
    window.addEventListener("offline", leave);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(READY_EVENT, ready);
      window.removeEventListener("offline", leave);
    };
  }, []);

  if (state === "gone") return null;
  return (
    <div
      className={state === "leaving" ? "splash leaving" : "splash"}
      role="status"
      aria-label="Loading Hercules"
      // Removed once faded (or straight away when the fade is skipped by Reduce Motion)
      onAnimationEnd={(e) => {
        if (e.animationName.startsWith("splash-out")) setState("gone");
      }}
    >
      <div className="splash-art" aria-hidden="true" />
      <p className="splash-name" aria-hidden="true">Hercules</p>
      <p className="splash-still" aria-hidden="true">Still loading...</p>
    </div>
  );
}
