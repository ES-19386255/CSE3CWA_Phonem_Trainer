"use client";

// Measures how long each page stays open and reports it to the server, so
// the dashboard can show "average time on page". Only time the tab is
// actually visible is counted.

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function usePageTimer() {
  const pathname = usePathname();

  useEffect(() => {
    let seconds = 0; // total visible time so far
    let visibleSince: number | null = document.visibilityState === "visible" ? Date.now() : null;
    let sent = false;

    // Adds the time since the tab last became visible.
    function stopClock() {
      if (visibleSince !== null) {
        seconds += (Date.now() - visibleSince) / 1000;
        visibleSince = null;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") visibleSince = Date.now();
      else stopClock();
    }

    // Sends the result once. Very short visits (under a second) are skipped,
    // which also ignores the double-run React does in development.
    function send() {
      if (sent) return;
      sent = true;
      stopClock();
      if (seconds < 1) return;
      const body = JSON.stringify({ path: pathname, durationSeconds: Math.min(seconds, 3600) });
      // sendBeacon survives the tab closing; fetch is the fallback.
      const queued = navigator.sendBeacon?.("/api/page-views", new Blob([body], { type: "application/json" }));
      if (!queued) {
        fetch("/api/page-views", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", send);
    // Cleanup runs when the page changes, which is also the end of this visit.
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", send);
      send();
    };
  }, [pathname]);
}
