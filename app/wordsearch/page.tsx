"use client";

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import Card from "@/components/Card";
import { WORD_SEARCH_LIST, PhonemeWord } from "@/lib/phonemes";
import { buildWordSearch, matchWord, WordSearchGrid } from "@/lib/wordSearchGrid";
import { buildWordSearchHtml } from "@/lib/buildWordSearchHtml";
import { downloadTextFile } from "@/lib/download";
import * as api from "@/lib/apiClient";
import type { ApiActivity } from "@/lib/apiClient";

// The Word Search builder page: a word list (the fixed Task 1 default, or
// one loaded from the database), a difficulty choice, and a live preview.
export default function WordSearchPage() {
  const [gridSize, setGridSize] = useState(10);
  const [showHints, setShowHints] = useState(true);
  const [wordList, setWordList] = useState<PhonemeWord[]>(WORD_SEARCH_LIST);
  // The grid is built once and stored in state, so the preview and the
  // downloaded file always show exactly the same puzzle.
  const [grid, setGrid] = useState<WordSearchGrid>(() => buildWordSearch(WORD_SEARCH_LIST, 10));

  const [savedActivities, setSavedActivities] = useState<ApiActivity[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [saveTitle, setSaveTitle] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    api
      .fetchActivities()
      .then((all) => setSavedActivities(all.filter((a) => a.type === "WORDSEARCH")))
      .catch(() => setSavedActivities([])); // if the backend isn't reachable, the builder still works on its own
  }, []);

  // Rebuilds the puzzle whenever the difficulty (grid size) changes.
  function handleSizeChange(size: number) {
    setGridSize(size);
    setGrid(buildWordSearch(wordList, size));
  }

  // Builds a brand new random layout at the same size, so a teacher can reshuffle.
  function handleShuffle() {
    setGrid(buildWordSearch(wordList, gridSize));
  }

  // Loads a saved activity's word list straight into the builder.
  function handleSelectActivity(id: string) {
    setSelectedId(id);
    const activity = savedActivities.find((a) => String(a.id) === id);
    if (!activity) {
      setWordList(WORD_SEARCH_LIST);
      setGrid(buildWordSearch(WORD_SEARCH_LIST, gridSize));
      return;
    }
    const words: PhonemeWord[] = activity.words.map((word) => ({
      id: String(word.id),
      english: word.english,
      sounds: [...word.phonemes].sort((a, b) => a.position - b.position).map((p) => p.symbol),
    }));
    const size = activity.gridSize ?? gridSize;
    setWordList(words);
    setShowHints(activity.showHints);
    setGridSize(size);
    setGrid(buildWordSearch(words, size));
  }

  // Saves the current word list as a brand new activity.
  async function handleSaveToLibrary() {
    if (!saveTitle.trim()) return;
    setSaveMessage("");
    try {
      await api.createActivity({
        title: saveTitle.trim(),
        type: "WORDSEARCH",
        showHints,
        gridSize,
        words: wordList.map((w) => ({ english: w.english, sounds: w.sounds })),
      });
      setSaveMessage("Saved.");
      setSaveTitle("");
      const all = await api.fetchActivities();
      setSavedActivities(all.filter((a) => a.type === "WORDSEARCH"));
    } catch (err) {
      setSaveMessage((err as Error).message);
    }
  }

  // Turns the current puzzle into a downloadable HTML file.
  function handleGenerate() {
    const html = buildWordSearchHtml(grid, showHints);
    downloadTextFile("word-search.html", html);
  }

  return (
    <div className="pb-12">
      <PageTitle title="Word Search" description="Preview and download a phoneme-based word search activity." />
      <div className="mx-auto max-w-5xl px-4">
        {savedActivities.length > 0 && (
          <Card>
            <label className="block text-sm font-medium">Load a saved activity</label>
            <select
              value={selectedId}
              onChange={(e) => handleSelectActivity(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            >
              <option value="">Use the default word list</option>
              {savedActivities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.title}
                </option>
              ))}
            </select>
          </Card>
        )}
      </div>
      <div className="mx-auto mt-4 grid max-w-5xl gap-6 px-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Word list</h2>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            The grid itself is built from phoneme symbols, not plain letters.
          </p>
          <ul className="mb-4 space-y-1.5 text-sm">
            {wordList.map((word) => (
              <li key={word.id} className="rounded-md border border-[var(--border)] px-3 py-1.5">
                {word.sounds.join(" - ")} → {word.english}
              </li>
            ))}
          </ul>

          <label className="block text-sm font-medium">Difficulty (grid size)</label>
          <select
            value={gridSize}
            onChange={(e) => handleSizeChange(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          >
            <option value={10}>Easy (10 x 10)</option>
            <option value={12}>Medium (12 x 12)</option>
            <option value={14}>Hard (14 x 14)</option>
          </select>

          <div className="mt-4">
            <p className="text-sm font-medium">Show hints</p>
            <label className="mr-3 text-sm"><input type="radio" checked={showHints} onChange={() => setShowHints(true)} /> Yes</label>
            <label className="text-sm"><input type="radio" checked={!showHints} onChange={() => setShowHints(false)} /> No</label>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            className="mt-5 w-full rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold"
          >
            Generate downloadable HTML
          </button>

          {/* Saving to the database keeps this word list around to reload
              or edit later -- separate from generating a file for a student. */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Title to save as..."
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleSaveToLibrary}
              disabled={!saveTitle.trim()}
              className="rounded-md border border-[var(--border)] px-3 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Save
            </button>
          </div>
          {saveMessage && <p className="mt-1 text-xs text-[var(--text-muted)]">{saveMessage}</p>}
        </Card>

        <WordSearchPreview grid={grid} showHints={showHints} onShuffle={handleShuffle} />
      </div>
    </div>
  );
}

type PreviewProps = {
  grid: WordSearchGrid;
  showHints: boolean;
  onShuffle: () => void;
};

// A live, click-to-find copy of the puzzle so a teacher can test it before downloading.
function WordSearchPreview({ grid, showHints, onShuffle }: PreviewProps) {
  const [selectedStart, setSelectedStart] = useState<{ row: number; col: number } | null>(null);
  const [found, setFound] = useState<string[]>([]); // holds each found word's English spelling

  // Handles a click on a grid square: first click starts a selection, second click checks it.
  function handleCellClick(row: number, col: number) {
    if (!selectedStart) {
      setSelectedStart({ row, col });
      return;
    }
    const match = matchWord(grid.placed, selectedStart.row, selectedStart.col, row, col);
    if (match && !found.includes(match.english)) {
      setFound([...found, match.english]);
    }
    setSelectedStart(null);
  }

  // True if this grid square belongs to a word that has already been found.
  function isFoundCell(row: number, col: number): boolean {
    return grid.placed.some((word) => {
      if (!found.includes(word.english)) return false;
      for (let i = 0; i < word.sounds.length; i++) {
        if (word.row + word.dRow * i === row && word.col + word.dCol * i === col) return true;
      }
      return false;
    });
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Live preview</h2>
        <button type="button" onClick={onShuffle} className="text-sm text-[var(--primary)] underline">
          Shuffle
        </button>
      </div>

      <div
        className="mx-auto mb-4 grid max-w-lg gap-1"
        style={{ gridTemplateColumns: `repeat(${grid.size}, minmax(0, 1fr))` }}
      >
        {grid.letters.map((row, r) =>
          row.map((symbol, c) => (
            <button
              key={`${r}-${c}`}
              type="button"
              onClick={() => handleCellClick(r, c)}
              className={`aspect-square rounded-sm border text-xs font-semibold sm:text-sm ${
                isFoundCell(r, c)
                  ? "border-[var(--correct)] bg-[var(--correct-bg)]"
                  : selectedStart?.row === r && selectedStart?.col === c
                    ? "border-[var(--primary)] bg-[var(--bg)]"
                    : "border-[var(--border)] bg-[var(--bg)]"
              }`}
            >
              {symbol}
            </button>
          ))
        )}
      </div>

      <p className="mb-2 text-sm font-medium">Find these phonemes ({found.length}/{grid.placed.length})</p>
      <ul className="flex flex-wrap gap-2 text-sm">
        {grid.placed.map((word) => (
          <li
            key={word.english}
            title={showHints ? `Sounds out to: ${word.english}` : undefined}
            className={`rounded-md border px-2 py-1 ${
              found.includes(word.english) ? "border-[var(--correct)] bg-[var(--correct-bg)] line-through" : "border-[var(--border)]"
            }`}
          >
            {word.sounds.join(" - ")}
          </li>
        ))}
      </ul>
    </Card>
  );
}
