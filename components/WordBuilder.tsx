"use client";

import { useState } from "react";
import PhonemeKeyboard from "@/components/PhonemeKeyboard";
import { findPhoneme } from "@/lib/phonemes";

type Props = {
  initialEnglish?: string;
  initialSounds?: string[];
  showHints: boolean;
  submitLabel: string;
  onSubmit: (word: { english: string; sounds: string[] }) => void;
  onCancel?: () => void;
};

// Builds one phoneme-based word: tap the keyboard to spell it out, type
// the English spelling, then submit. Used both to add a brand new word
// and, pre-filled with its current values, to edit an existing one.
export default function WordBuilder({
  initialEnglish = "",
  initialSounds = [],
  showHints,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [english, setEnglish] = useState(initialEnglish);
  const [sounds, setSounds] = useState<string[]>(initialSounds);

  function addSound(ipa: string) {
    if (sounds.length >= 8) return;
    setSounds([...sounds, ipa]);
  }

  function removeLast() {
    setSounds(sounds.slice(0, -1));
  }

  const canSubmit = english.trim().length > 0 && sounds.length > 0;

  return (
    <div className="rounded-md border border-[var(--border)] p-3">
      <div className="mb-2 flex min-h-10 flex-wrap items-center gap-1 rounded-md border border-dashed border-[var(--border)] p-2">
        {sounds.length === 0 && <span className="text-xs text-[var(--text-muted)]">Tap the keyboard to build the word.</span>}
        {sounds.map((ipa, i) => {
          const phoneme = findPhoneme(ipa);
          return phoneme ? (
            <span key={i} className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-sm font-semibold">
              {phoneme.ipa}
            </span>
          ) : null;
        })}
      </div>
      <button
        type="button"
        onClick={removeLast}
        disabled={sounds.length === 0}
        className="mb-2 rounded border border-[var(--border)] px-2 py-1 text-xs disabled:opacity-40"
      >
        Remove last
      </button>

      <PhonemeKeyboard onSelect={addSound} showHints={showHints} />

      <input
        type="text"
        value={english}
        onChange={(e) => setEnglish(e.target.value)}
        placeholder="English spelling"
        className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
      />

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit({ english: english.trim(), sounds })}
          disabled={!canSubmit}
          className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
