"use client";

import { useState } from "react";
import PageTitle from "@/components/PageTitle";
import Card from "@/components/Card";
import { WORD_SEARCH_LIST } from "@/lib/phonemes";
import { buildWordSearch, matchWord, WordSearchGrid } from "@/lib/wordSearchGrid";
import { buildWordSearchHtml } from "@/lib/buildWordSearchHtml";
import { downloadTextFile } from "@/lib/download";

// word search builder page with live preview
export default function WordSearchPage() {
  const [gridSize, setGridSize] = useState(10);
  const [showHints, setShowHints] = useState(true);
  // grid is built once and stored in state so preview and download show exactly the same
  const [grid, setGrid] = useState<WordSearchGrid>(() => makeGrid(10));

  // builds new puzzle at the chosen size using the phoneme sequence for each word (not the english spelling)
  function makeGrid(size: number): WordSearchGrid {
    return buildWordSearch(WORD_SEARCH_LIST, size);
  }

  // rebuilds the puzzle when difficulty changes i.e grid size
  function handleSizeChange(size: number) {
    setGridSize(size);
    setGrid(makeGrid(size));
  }

  // rebuilds new random layout at the same size
  function handleShuffle() {
    setGrid(makeGrid(gridSize));
  }

  // generates downloadable file
  function handleGenerate() {
    const html = buildWordSearchHtml(grid, showHints);
    downloadTextFile("word-search.html", html);
  }

  return (
    <div className="pb-12">
      <PageTitle title="Word Search" description="Preview and download a phoneme-based word search activity!" />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Word list</h2>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            This first version uses a fixed list of five phoneme-based words, the grid itself is built from phoneme symbols not plain letters.
          </p>
          <ul className="mb-4 space-y-1.5 text-sm">
            {WORD_SEARCH_LIST.map((word) => (
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

// live puzzle so a teacher can test it before downloading
function WordSearchPreview({ grid, showHints, onShuffle }: PreviewProps) {
  const [selectedStart, setSelectedStart] = useState<{ row: number; col: number } | null>(null);
  const [found, setFound] = useState<string[]>([]); // holds found words (english)

  // handles clicks on grid squares (first click starts selection second click checks it)
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

  // check for grid square belonging to a word that has already been found
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
