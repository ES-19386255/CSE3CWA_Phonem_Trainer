import Link from "next/link";
import Card from "@/components/Card";

// The home page: a short introduction and links into the two builder tools.
export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-[var(--primary)] sm:text-4xl">
        Turn phonemes into classroom games.
      </h1>
      <p className="mt-3 max-w-xl text-[var(--text-muted)]">
        Phoneme Builder helps Speech Pathology teachers turn individual sounds into two familiar game formats — Wordle and Word Search — then download a single HTML file students can play in any browser.
      </p>

      <div className="mt-6 flex gap-3">
        <Link href="/wordle" className="rounded-md bg-[var(--accent)] text-[var(--on-accent)] px-5 py-2.5 text-sm font-semibold">
          Build a Wordle activity
        </Link>
        <Link href="/wordsearch" className="rounded-md border border-[var(--border)] px-5 py-2.5 text-sm font-semibold">
          Build a Word Search
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-[var(--primary)]">Wordle</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Spell out a phoneme-based answer, preview it as a guessing game and download it.
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-[var(--primary)]">Word Search</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Generate a word search from a fixed set of phoneme-based words and download it.
          </p>
        </Card>
      </div>

      <p className="mt-8 text-sm text-[var(--text-muted)]">
        Save word lists in <Link href="/activities" className="text-[var(--primary)] underline">Manage</Link> and
        keep an eye on usage and alerts on the <Link href="/dashboard" className="text-[var(--primary)] underline">Dashboard</Link>.
        See the <Link href="/about" className="text-[var(--primary)] underline">About page</Link> for more.
      </p>
    </div>
  );
}
