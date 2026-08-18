"use client";

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import Card from "@/components/Card";

// year in seconds so the saved preferences last
const ONE_YEAR = 60 * 60 * 24 * 365;

// settings (aka theme and text size) are both stored in a cookie
export default function SettingsPage() {
  const [isDark, setIsDark] = useState(false);
  const [isLarge, setIsLarge] = useState(false);

  // reads the stored cookie when page loads in the browser
  useEffect(() => {
    setIsDark(document.cookie.includes("theme=dark"));
    setIsLarge(document.cookie.includes("textSize=large"));
  }, []);

  // changes theme and saves to cookie
  function setTheme(dark: boolean) {
    document.cookie = `theme=${dark ? "dark" : "light"}; path=/; max-age=${ONE_YEAR}`;
    document.documentElement.classList.toggle("dark-theme", dark);
    setIsDark(dark);
  }

  // changes text size and saves to cookie
  function setTextSize(large: boolean) {
    document.cookie = `textSize=${large ? "large" : "standard"}; path=/; max-age=${ONE_YEAR}`;
    document.documentElement.classList.toggle("large-text", large);
    setIsLarge(large);
  }

  return (
    <div className="pb-12">
      <PageTitle title="Settings" description="These choices will be saved in your browser as cookies." />
      <div className="mx-auto max-w-2xl space-y-4 px-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="font-medium">Theme</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTheme(false)}
                className={`rounded-md px-3 py-1.5 text-sm ${!isDark ? "bg-[var(--primary)] text-white" : "border border-[var(--border)]"}`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme(true)}
                className={`rounded-md px-3 py-1.5 text-sm ${isDark ? "bg-[var(--primary)] text-white" : "border border-[var(--border)]"}`}
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
                className={`rounded-md px-3 py-1.5 text-sm ${!isLarge ? "bg-[var(--primary)] text-white" : "border border-[var(--border)]"}`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setTextSize(true)}
                className={`rounded-md px-3 py-1.5 text-sm ${isLarge ? "bg-[var(--primary)] text-white" : "border border-[var(--border)]"}`}
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
