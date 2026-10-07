"use client";

import { useState } from "react";

type Day = { date: string; ok: number; failed: number };

// Turns "2026-10-07" into "7 Oct". Built from parts so it doesn't depend on the time zone.
function shortDate(iso: string) {
  const [, month, day] = iso.split("-").map(Number);
  return `${day} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month - 1]}`;
}

const CHART_HEIGHT = 140; // px

// A stacked column chart of generations per day (succeeded + failed).
// It is plain HTML, so each column can be focused with the keyboard, and
// there is a table view too so the numbers never rely on colour alone.
export default function TrendChart({ days }: { days: Day[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(1, ...days.map((d) => d.ok + d.failed));
  const shown = active === null ? null : days[active];

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <ul className="flex gap-4 text-sm">
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[var(--primary)]" aria-hidden="true" /> Succeeded
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[var(--danger)]" aria-hidden="true" /> Failed
          </li>
        </ul>
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          aria-pressed={showTable}
          className="rounded-md border border-[var(--border)] px-2 py-1 text-sm font-medium hover:bg-[var(--bg)]"
        >
          {showTable ? "Show chart" : "Show as table"}
        </button>
      </div>

      {showTable ? (
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Generations per day for the last 14 days</caption>
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th scope="col" className="py-1 pr-2">Day</th>
              <th scope="col" className="py-1 pr-2">Succeeded</th>
              <th scope="col" className="py-1">Failed</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date} className="border-b border-[var(--border)]">
                <th scope="row" className="py-1 pr-2 font-normal">{shortDate(d.date)}</th>
                <td className="py-1 pr-2">{d.ok}</td>
                <td className="py-1">{d.failed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          <div className="flex items-end gap-1 border-b border-[var(--border)]" style={{ height: CHART_HEIGHT }} role="group" aria-label="Generations per day for the last 14 days">
            {days.map((d, i) => {
              const total = d.ok + d.failed;
              return (
                <div
                  key={d.date}
                  tabIndex={0}
                  aria-label={`${shortDate(d.date)}: ${d.ok} succeeded, ${d.failed} failed`}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="flex h-full flex-1 flex-col-reverse items-center gap-[2px] rounded-sm outline-offset-2"
                >
                  {/* The segments are capped at 24px wide with a 2px gap between them. */}
                  <div className="w-full max-w-6 rounded-t-[4px] bg-[var(--primary)]" style={{ height: (d.ok / max) * (CHART_HEIGHT - 8), display: d.ok ? "block" : "none" }} />
                  <div className="w-full max-w-6 rounded-t-[4px] bg-[var(--danger)]" style={{ height: Math.max((d.failed / max) * (CHART_HEIGHT - 8), d.failed ? 3 : 0), display: d.failed ? "block" : "none" }} />
                  <span className="sr-only">{total} total</span>
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-xs text-[var(--text-muted)]">
            <span>{shortDate(days[0].date)}</span>
            <span>Tallest day: {max}</span>
            <span>{shortDate(days[days.length - 1].date)}</span>
          </div>
          <p className="mt-2 min-h-5 text-sm" aria-live="polite">
            {shown ? (
              <>
                <strong>{shortDate(shown.date)}</strong>: {shown.ok} succeeded, {shown.failed} failed
              </>
            ) : (
              <span className="text-[var(--text-muted)]">Hover or tab to a column to see its numbers.</span>
            )}
          </p>
        </>
      )}
    </div>
  );
}
