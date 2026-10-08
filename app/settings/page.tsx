"use client";

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import Card from "@/components/Card";

// One year in seconds, used so the saved preference lasts a long time.
const ONE_YEAR = 60 * 60 * 24 * 365;

// The settings page: theme and text size, both stored in a cookie so they are remembered.
export default function SettingsPage() {
  const [isDark, setIsDark] = useState(false);
  const [isLarge, setIsLarge] = useState(false);

  // Reads the saved cookie once the page loads in the browser (the server has no cookies to read here).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- this only runs once, to read a browser-only value
    setIsDark(document.cookie.includes("theme=dark"));
    setIsLarge(document.cookie.includes("textSize=large"));
  }, []);

  // Switches the theme and saves the choice in a cookie.
  function setTheme(dark: boolean) {
    document.cookie = `theme=${dark ? "dark" : "light"}; path=/; max-age=${ONE_YEAR}`;
    document.documentElement.classList.toggle("dark-theme", dark);
    setIsDark(dark);
  }

  // Switches the text size and saves the choice in a cookie.
  function setTextSize(large: boolean) {
    document.cookie = `textSize=${large ? "large" : "standard"}; path=/; max-age=${ONE_YEAR}`;
    document.documentElement.classList.toggle("large-text", large);
    setIsLarge(large);
  }

  return (
    <div className="pb-12">
      <PageTitle title="Settings" description="These choices are saved in your browser as cookies." />
      <div className="mx-auto max-w-2xl space-y-4 px-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="font-medium">Theme</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTheme(false)}
                className={`rounded-md px-3 py-1.5 text-sm ${!isDark ? "bg-[var(--primary)] text-[var(--on-primary)]" : "border border-[var(--border)]"}`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme(true)}
                className={`rounded-md px-3 py-1.5 text-sm ${isDark ? "bg-[var(--primary)] text-[var(--on-primary)]" : "border border-[var(--border)]"}`}
              >
                Dark
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="font-medium">Text size</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTextSize(false)}
                className={`rounded-md px-3 py-1.5 text-sm ${!isLarge ? "bg-[var(--primary)] text-[var(--on-primary)]" : "border border-[var(--border)]"}`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setTextSize(true)}
                className={`rounded-md px-3 py-1.5 text-sm ${isLarge ? "bg-[var(--primary)] text-[var(--on-primary)]" : "border border-[var(--border)]"}`}
              >
                Large
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
