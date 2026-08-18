"use client";

import { useState } from "react";
import PageTitle from "@/components/PageTitle";
import Card from "@/components/Card";
import PhonemeKeyboard from "@/components/PhonemeKeyboard";
import { DEFAULT_WORDLE_WORD, findPhoneme } from "@/lib/phonemes";
import { scoreGuess, isCorrectGuess } from "@/lib/wordScore";
import { buildWordleHtml } from "@/lib/buildWordleHtml";
import { downloadTextFile } from "@/lib/download";

// wordle builder page LHS form for building the answer RHS live preview
export default function WordlePage() {
  const [sounds, setSounds] = useState<string[]>(DEFAULT_WORDLE_WORD.sounds);
  const [english, setEnglish] = useState(DEFAULT_WORDLE_WORD.english);
  const [showHints, setShowHints] = useState(true);
  const [maxGuesses, setMaxGuesses] = useState(6);

  // adds phoneme word being built
  function addSound(ipa: string) {
    if (sounds.length >= 8) return;
    setSounds([...sounds, ipa]);
  }

  // removes the last phoneme
  function removeLastSound() {
    setSounds(sounds.slice(0, -1));
  }

  // generate downloadable HTML file
  function handleGenerate() {
    const html = buildWordleHtml({ sounds, english, showHints, maxGuesses });
    downloadTextFile(`wordle-${english || "activity"}.html`, html);
  }

  const canGenerate = sounds.length > 0 && english.trim().length > 0;

  return (
    <div className="pb-12">
      <PageTitle title="Wordle" description="Build a phoneme-based answer word, preview it and download it!" />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Build the answer</h2>

          {/* phoneme word being built shown as a row of symbols */}
          <p className="mb-1 text-sm font-medium">Phoneme word</p>
          <div className="mb-2 flex min-h-12 flex-wrap items-center gap-2 rounded-md border border-dashed border-[var(--border)] p-2">
            {sounds.length === 0 && <span className="text-sm text-[var(--text-muted)]">Click the shown keyboard below to start.</span>}
            {sounds.map((ipa, i) => {
              const phoneme = findPhoneme(ipa);
              return phoneme ? <span key={i} className="rounded bg-[var(--bg)] px-2 py-1 text-sm font-semibold">{phoneme.ipa}</span> : null;
            })}
          </div>
          <button type="button" onClick={removeLastSound} className="mb-4 rounded-md border border-[var(--border)] px-3 py-1 text-sm">
            Remove last
          </button>

          <PhonemeKeyboard onSelect={addSound} showHints={showHints} />

          <label className="mt-4 block text-sm font-medium">English word</label>
          <input
            type="text"
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            placeholder="e.g. thin"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Show hints</p>
              <label className="mr-3 text-sm"><input type="radio" checked={showHints} onChange={() => setShowHints(true)} /> Yes</label>
              <label className="text-sm"><input type="radio" checked={!showHints} onChange={() => setShowHints(false)} /> No</label>
            </div>
            <div>
              <label className="block text-sm font-medium">Number of guesses</label>
              <input
                type="number"
                min={3}
                max={8}
                value={maxGuesses}
                onChange={(e) => setMaxGuesses(Number(e.target.value) || 6)}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="mt-5 w-full rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            Generate downloadable HTML
          </button>
        </Card>

        <WordlePreview sounds={sounds} english={english} showHints={showHints} maxGuesses={maxGuesses} />
      </div>
    </div>
  );
}

type PreviewProps = {
  sounds: string[];
  english: string;
  showHints: boolean;
  maxGuesses: number;
};

// live view for teacher to review
function WordlePreview({ sounds, english, showHints, maxGuesses }: PreviewProps) {
  const [guesses, setGuesses] = useState<string[][]>([]);
  const [current, setCurrent] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const gameOver = message !== "";

  // adds phoneme to word being built
  function addGuessSound(ipa: string) {
    if (gameOver || current.length >= sounds.length) return;
    setCurrent([...current, ipa]);
  }

  // submits and checks whether it matches the answer
  function handleEnter() {
    if (gameOver || current.length !== sounds.length) return;
    const result = scoreGuess(current, sounds);
    const nextGuesses = [...guesses, current];
    setGuesses(nextGuesses);
    setCurrent([]);
    if (isCorrectGuess(result)) {
      setMessage(`Correct! The word is "${english || "?"}".`);
    } else if (nextGuesses.length >= maxGuesses) {
      setMessage(`Out of guesses, the word was "${english || "?"}".`);
    }
  }

  // clears the preview replay
  function handleReset() {
    setGuesses([]);
    setCurrent([]);
    setMessage("");
  }

  if (sounds.length === 0) {
    return (
      <Card>
        <p className="text-sm text-[var(--text-muted)]">Build a phoneme word to see a live preview here.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Live preview</h2>
        <button type="button" onClick={handleReset} className="text-sm text-[var(--primary)] underline">
          Reset
        </button>
      </div>

      {/* note: one row per guess filled with the phonemes typed so far */}
      <div className="mb-3 space-y-1.5">
        {Array.from({ length: maxGuesses }).map((_, rowIndex) => {
          const submittedRow = guesses[rowIndex];
          const isCurrentRow = rowIndex === guesses.length;
          const rowSounds = submittedRow ?? (isCurrentRow ? current : []);
          const results = submittedRow ? scoreGuess(submittedRow, sounds) : [];
          return (
            <div key={rowIndex} className="flex justify-center gap-1.5">
              {Array.from({ length: sounds.length }).map((_, colIndex) => {
                const phoneme = findPhoneme(rowSounds[colIndex] ?? "");
                const highlight = results[colIndex];
                return (
                  <div
                    key={colIndex}
                    className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold ${
                      highlight === "correct"
                        ? "border-[var(--correct)] bg-[var(--correct-bg)]"
                        : highlight === "present"
                          ? "border-[var(--present)] bg-[var(--present-bg)]"
                          : highlight === "absent"
                            ? "border-[var(--border)] bg-[var(--absent-bg)]"
                            : "border-[var(--border)] bg-[var(--bg)]"
                    }`}
                  >
                    {phoneme?.ipa ?? ""}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {message && <p className="mb-3 text-sm font-semibold">{message}</p>}

      <PhonemeKeyboard onSelect={addGuessSound} showHints={showHints} />

      <button
        type="button"
        onClick={handleEnter}
        disabled={gameOver || current.length !== sounds.length}
        className="mt-3 w-full rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        Enter
      </button>
    </Card>
  );
}
