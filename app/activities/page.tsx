"use client";

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import Card from "@/components/Card";
import WordBuilder from "@/components/WordBuilder";
import * as api from "@/lib/apiClient";
import type { ApiActivity } from "@/lib/apiClient";

// Sorts a word's phonemes into the right reading order
function sortedSymbols(word: ApiActivity["words"][number]): string[] {
  return [...word.phonemes].sort((a, b) => a.position - b.position).map((p) => p.symbol);
}

// The management page: create and delete activities, and add, edit, or
// delete the words inside each one -- full CRUD, backed by the database.
export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"WORDLE" | "WORDSEARCH">("WORDLE");

  const [addingWordFor, setAddingWordFor] = useState<number | null>(null);
  const [editingWord, setEditingWord] = useState<{ activityId: number; wordId: number } | null>(null);

  // Reloads the activity list from the server, used after every change.
  async function load() {
    setLoading(true);
    setError("");
    try {
      setActivities(await api.fetchActivities());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- this only runs once, to load data from the server
    load();
  }, []);

  // Runs an action, reloads the list on success, and shows the error on failure.
  async function runAction(action: () => Promise<unknown>) {
    setError("");
    try {
      await action();
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleCreateActivity() {
    if (!newTitle.trim()) return;
    runAction(async () => {
      await api.createActivity({ title: newTitle.trim(), type: newType });
      setNewTitle("");
    });
  }

  return (
    <div className="pb-12">
      <PageTitle title="Manage Activities" description="Create, edit, and delete saved activities and their words." />
      <div className="mx-auto max-w-3xl space-y-4 px-4">
        {error && (
          <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <Card>
          <h2 className="mb-2 text-lg font-semibold">New activity</h2>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title"
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as "WORDLE" | "WORDSEARCH")}
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            >
              <option value="WORDLE">Wordle</option>
              <option value="WORDSEARCH">Word Search</option>
            </select>
            <button
              type="button"
              onClick={handleCreateActivity}
              disabled={!newTitle.trim()}
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Create
            </button>
          </div>
        </Card>

        {loading && <p className="text-sm text-[var(--text-muted)]">Loading...</p>}
        {!loading && activities.length === 0 && (
          <Card>
            <p className="text-sm text-[var(--text-muted)]">No activities yet. Create one above.</p>
          </Card>
        )}

        {activities.map((activity) => (
          <Card key={activity.id}>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{activity.title}</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {activity.type === "WORDLE" ? "Wordle" : "Word Search"} · {activity.words.length} word
                  {activity.words.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => runAction(() => api.deleteActivity(activity.id))}
                className="rounded-md border border-[var(--border)] px-3 py-1 text-sm text-red-600"
              >
                Delete activity
              </button>
            </div>

            <ul className="mb-3 space-y-2">
              {activity.words.map((word) => {
                const isEditing = editingWord?.activityId === activity.id && editingWord?.wordId === word.id;
                return (
                  <li key={word.id} className="rounded-md border border-[var(--border)] p-2">
                    {isEditing ? (
                      <WordBuilder
                        initialEnglish={word.english}
                        initialSounds={sortedSymbols(word)}
                        showHints={activity.showHints}
                        submitLabel="Save"
                        onCancel={() => setEditingWord(null)}
                        onSubmit={(updated) =>
                          runAction(async () => {
                            await api.updateWord(activity.id, word.id, updated);
                            setEditingWord(null);
                          })
                        }
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{sortedSymbols(word).join(" - ")} → {word.english}</span>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setEditingWord({ activityId: activity.id, wordId: word.id })}
                            className="text-xs text-[var(--primary)] underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => runAction(() => api.deleteWord(activity.id, word.id))}
                            className="text-xs text-red-600 underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {addingWordFor === activity.id ? (
              <WordBuilder
                showHints={activity.showHints}
                submitLabel="Add word"
                onCancel={() => setAddingWordFor(null)}
                onSubmit={(word) =>
                  runAction(async () => {
                    await api.addWord(activity.id, word);
                    setAddingWordFor(null);
                  })
                }
              />
            ) : (
              <button
                type="button"
                onClick={() => setAddingWordFor(activity.id)}
                className="text-sm text-[var(--primary)] underline"
              >
                + Add a word
              </button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
