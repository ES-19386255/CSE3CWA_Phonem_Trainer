const NAME = "Erin Sproule";
const STUDENT_NUMBER = "19386255";

// The site footer (bottom of every page)
export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-4 py-4 text-center text-sm text-[var(--text-muted)]">
      Phoneme Builder — Assignment 1 — {NAME} · {STUDENT_NUMBER}
    </footer>
  );
}
