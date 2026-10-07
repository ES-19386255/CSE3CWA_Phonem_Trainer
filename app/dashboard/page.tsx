"use client";

import { useCallback, useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import Card from "@/components/Card";
import StatCard from "@/components/StatCard";
import TrendChart from "@/components/TrendChart";
import * as api from "@/lib/apiClient";
import type { ApiStats } from "@/lib/apiClient";

type Health = Awaited<ReturnType<typeof api.checkHealth>>;

// Turns seconds into something readable, like "1m 35s".
function formatSeconds(total: number) {
  const s = Math.round(total);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function typeName(type: string | null) {
  if (type === "WORDLE") return "Wordle";
  if (type === "WORDSEARCH") return "Word Search";
  return "None yet";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

// The dashboard: health, usage numbers, alerts and reports, all read from
// the database through /api/stats.
export default function DashboardPage() {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");

  // Loads stats and health together. The snapshot is saved first (the
  // server ignores it if one was saved in the last minute).
  const load = useCallback(async () => {
    try {
      await api.saveSnapshot();
      const [newStats, newHealth] = await Promise.all([api.fetchStats(), api.checkHealth()]);
      setStats(newStats);
      setHealth(newHealth);
      setError("");
      setUpdatedAt(new Date().toLocaleTimeString("en-AU"));
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- this only runs to load data from the server
    load();
  }, [load]);

  // Refreshes every 15 seconds while the box is ticked.
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [autoRefresh, load]);

  const maxUsage = stats ? Math.max(1, stats.usage.wordle, stats.usage.wordSearch) : 1;

  return (
    <>
      <PageTitle title="Dashboard" description="Health, usage and alerts for Phoneme Builder, read from the database." />

      <div className="mx-auto max-w-5xl space-y-6 px-4 pb-10">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={load}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-black"
          >
            Refresh now
          </button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Refresh every 15 seconds
          </label>
          {updatedAt && <span className="text-sm text-[var(--text-muted)]">Last updated {updatedAt}</span>}
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-medium">
            Could not load the dashboard: {error}
          </p>
        )}

        {!stats && !error && <p>Loading the dashboard...</p>}

        {stats && (
          <>
            {/* ---- alerts ---- */}
            <section aria-labelledby="alerts-heading">
              <h2 id="alerts-heading" className="mb-2 text-xl font-bold">
                Alerts ({stats.alerts.length})
              </h2>
              {stats.alerts.length === 0 ? (
                <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
                  No alerts. Generation is working and the word lists look fine.
                </p>
              ) : (
                <ul className="space-y-2">
                  {stats.alerts.map((alert) => (
                    <li
                      key={alert.id}
                      className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                        alert.level === "error"
                          ? "border-[var(--danger)] bg-[var(--danger-bg)]"
                          : "border-[var(--present)] bg-[var(--warning-bg)]"
                      }`}
                    >
                      {/* The words "Error" and "Warning" mean it isn't just colour. */}
                      <span className="font-bold">{alert.level === "error" ? "✕ Error" : "⚠ Warning"}:</span>
                      <span>{alert.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ---- headline numbers ---- */}
            <section aria-labelledby="numbers-heading">
              <h2 id="numbers-heading" className="mb-2 text-xl font-bold">Key numbers</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  label="Health"
                  value={health?.ok ? "✓ Healthy" : "✕ Down"}
                  note={health ? `/health returned ${health.status || "no response"} in ${health.ms} ms` : undefined}
                />
                <StatCard label="Wordle activities" value={stats.activities.wordle} />
                <StatCard label="Word Search activities" value={stats.activities.wordSearch} />
                <StatCard
                  label="Most-used activity type"
                  value={typeName(stats.mostUsedType)}
                  note={`${stats.usage.wordle} Wordle vs ${stats.usage.wordSearch} Word Search generations`}
                />
                <StatCard
                  label="Generations"
                  value={`${stats.generations.ok} ok / ${stats.generations.failed} failed`}
                  note={stats.generations.successRate === null ? undefined : `${Math.round(stats.generations.successRate * 100)}% success rate`}
                />
                <StatCard
                  label="Average time on page"
                  value={formatSeconds(stats.avgTimeOnPage)}
                  note={`from ${stats.pageViews} page views`}
                />
              </div>
            </section>

            {/* ---- charts ---- */}
            <section aria-labelledby="charts-heading" className="grid gap-4 lg:grid-cols-3">
              <h2 id="charts-heading" className="sr-only">Charts</h2>
              <div className="lg:col-span-2">
                <Card>
                  <h3 className="mb-3 text-lg font-bold">Generations per day (last 14 days)</h3>
                  <TrendChart days={stats.trend} />
                </Card>
              </div>
              <Card>
                <h3 className="mb-3 text-lg font-bold">Usage by activity type</h3>
                <ul className="space-y-3 text-sm">
                  {[
                    { name: "Wordle", count: stats.usage.wordle, color: "var(--primary)" },
                    { name: "Word Search", count: stats.usage.wordSearch, color: "var(--accent)" },
                  ].map((row) => (
                    <li key={row.name}>
                      <div className="mb-1 flex justify-between">
                        <span>{row.name}</span>
                        <strong>{row.count}</strong>
                      </div>
                      <div className="h-3 rounded-sm bg-[var(--absent-bg)]">
                        <div className="h-3 rounded-r-[4px]" style={{ width: `${(row.count / maxUsage) * 100}%`, background: row.color }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            {/* ---- reports ---- */}
            <section aria-labelledby="reports-heading" className="space-y-4">
              <h2 id="reports-heading" className="text-xl font-bold">Reports</h2>

              <Card>
                <table className="w-full text-left text-sm">
                  <caption className="mb-2 text-left text-lg font-bold">Time on each page</caption>
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th scope="col" className="py-1 pr-2">Page</th>
                      <th scope="col" className="py-1 pr-2">Views</th>
                      <th scope="col" className="py-1">Average time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.pages.map((page) => (
                      <tr key={page.path} className="border-b border-[var(--border)]">
                        <th scope="row" className="py-1 pr-2 font-normal">{page.path}</th>
                        <td className="py-1 pr-2">{page.views}</td>
                        <td className="py-1">{formatSeconds(page.avgSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="mb-2 text-left text-lg font-bold">Latest generation attempts</caption>
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th scope="col" className="py-1 pr-2">When</th>
                        <th scope="col" className="py-1 pr-2">Activity</th>
                        <th scope="col" className="py-1 pr-2">Type</th>
                        <th scope="col" className="py-1 pr-2">Result</th>
                        <th scope="col" className="py-1">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentEvents.map((event) => (
                        <tr key={event.id} className="border-b border-[var(--border)]">
                          <td className="py-1 pr-2">{formatTime(event.createdAt)}</td>
                          <td className="py-1 pr-2">{event.activityTitle ?? "(unsaved or deleted)"}</td>
                          <td className="py-1 pr-2">{typeName(event.activityType)}</td>
                          <td className="py-1 pr-2">
                            {event.success ? "✓ Success" : `✕ Failed: ${event.errorMessage ?? "unknown"}`}
                          </td>
                          <td className="py-1">{event.simulated ? "Simulated" : "Real"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="mb-2 text-left text-lg font-bold">Saved stat snapshots</caption>
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th scope="col" className="py-1 pr-2">Saved</th>
                        <th scope="col" className="py-1 pr-2">Activities (W / WS)</th>
                        <th scope="col" className="py-1 pr-2">Ok / failed</th>
                        <th scope="col" className="py-1 pr-2">Avg time</th>
                        <th scope="col" className="py-1">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.snapshots.map((snap) => (
                        <tr key={snap.id} className="border-b border-[var(--border)]">
                          <td className="py-1 pr-2">{formatTime(snap.createdAt)}</td>
                          <td className="py-1 pr-2">{snap.wordleCount} / {snap.wordSearchCount}</td>
                          <td className="py-1 pr-2">{snap.generationsOk} / {snap.generationsFailed}</td>
                          <td className="py-1 pr-2">{formatSeconds(snap.avgTimeOnPage)}</td>
                          <td className="py-1">{snap.simulated ? "Simulated" : "Real"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>

            <p className="text-sm text-[var(--text-muted)]">
              {stats.simulated.generations} of {stats.generations.total} generation records and {stats.simulated.pageViews} of{" "}
              {stats.pageViews} page views are simulated (made by the seed script) so the dashboard has history to show.
              New activity from using the app is saved as real data.
            </p>
          </>
        )}
      </div>
    </>
  );
}
