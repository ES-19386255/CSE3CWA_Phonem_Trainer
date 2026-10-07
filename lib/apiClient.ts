// Small wrapper functions around fetch() for talking to our own /api
// routes, so every page calls the backend the same way instead of each
// writing its own fetch logic.

export type ApiPhoneme = { id: number; symbol: string; position: number };
export type ApiWord = { id: number; english: string; order: number; phonemes: ApiPhoneme[] };
export type ApiActivity = {
  id: number;
  title: string;
  type: "WORDLE" | "WORDSEARCH";
  showHints: boolean;
  maxGuesses: number | null;
  gridSize: number | null;
  allowDiagonals: boolean | null;
  wordListId: number;
  wordListName: string;
  words: ApiWord[];
};

export type NewWordInput = { english: string; sounds: string[] };
export type NewActivityInput = {
  title: string;
  type: "WORDLE" | "WORDSEARCH";
  showHints?: boolean;
  maxGuesses?: number;
  gridSize?: number;
  allowDiagonals?: boolean;
  words?: NewWordInput[];
  wordListId?: number; // reuse an existing list
};

// Reads a fetch Response as JSON, and turns a non-2xx response into a
// thrown error using the server's own { error: "..." } message.
async function readJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = body && typeof body === "object" && "error" in body ? String(body.error) : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}

export async function fetchActivities(): Promise<ApiActivity[]> {
  const res = await fetch("/api/activities");
  return readJson<ApiActivity[]>(res);
}

export async function createActivity(input: NewActivityInput): Promise<ApiActivity> {
  const res = await fetch("/api/activities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<ApiActivity>(res);
}

export async function updateActivity(id: number, input: Partial<NewActivityInput>): Promise<ApiActivity> {
  const res = await fetch(`/api/activities/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<ApiActivity>(res);
}

export async function deleteActivity(id: number): Promise<void> {
  const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
  await readJson(res);
}

export async function addWord(activityId: number, input: NewWordInput): Promise<ApiWord> {
  const res = await fetch(`/api/activities/${activityId}/words`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<ApiWord>(res);
}

export async function updateWord(activityId: number, wordId: number, input: Partial<NewWordInput>): Promise<ApiWord> {
  const res = await fetch(`/api/activities/${activityId}/words/${wordId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<ApiWord>(res);
}

export async function deleteWord(activityId: number, wordId: number): Promise<void> {
  const res = await fetch(`/api/activities/${activityId}/words/${wordId}`, { method: "DELETE" });
  await readJson(res);
}

// ---- Task 3: dashboard, page timing and generation reporting ----

// The shape of /api/stats, taken straight from the function that makes it,
// so the types can't drift apart.
export type ApiStats = Awaited<ReturnType<typeof import("./stats").computeStats>>;

export async function fetchStats(): Promise<ApiStats> {
  const res = await fetch("/api/stats", { cache: "no-store" });
  return readJson<ApiStats>(res);
}

// Saves today's numbers as a snapshot row (the server skips it if one was
// saved in the last minute).
export async function saveSnapshot(): Promise<void> {
  const res = await fetch("/api/stats", { method: "POST" });
  await readJson(res);
}

// Pings /health and times it, for the dashboard's health card.
export async function checkHealth(): Promise<{ ok: boolean; status: number; ms: number }> {
  const started = performance.now();
  try {
    const res = await fetch("/health", { cache: "no-store" });
    return { ok: res.ok, status: res.status, ms: Math.round(performance.now() - started) };
  } catch {
    return { ok: false, status: 0, ms: Math.round(performance.now() - started) };
  }
}

// Tells the server how a generate click went. It never throws -- a failure
// to report must not get in the way of the teacher's download.
export function reportGeneration(input: {
  activityType: "WORDLE" | "WORDSEARCH";
  success: boolean;
  errorMessage?: string;
  activityId?: number;
}): void {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).catch(() => {});
}
