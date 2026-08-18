import { Phoneme } from "@/lib/phonemes";

type Props = {
  phoneme: Phoneme;
  onClick?: () => void; // left out for buttons that are just for display
  showHint?: boolean;
  highlight?: "correct" | "present" | "absent" | null;
};

// One phoneme, shown as a button with just it's symbol (the letter) with english equivalent appearing as a mouse-over hint not visible text.
export default function PhonemeButton({ phoneme, onClick, showHint = true, highlight }: Props) {
  const highlightClass =
    highlight === "correct"
      ? "bg-[var(--correct-bg)] border-[var(--correct)]"
      : highlight === "present"
        ? "bg-[var(--present-bg)] border-[var(--present)]"
        : highlight === "absent"
          ? "bg-[var(--absent-bg)] border-[var(--border)]"
          : "bg-[var(--surface)] border-[var(--border)]";

  return (
    <button
      type="button"
      onClick={onClick}
      title={showHint ? phoneme.hint : undefined}
      aria-label={phoneme.hint}
      className={`flex h-11 w-11 items-center justify-center rounded-md border text-base font-semibold ${highlightClass} hover:border-[var(--primary)]`}
    >
      {phoneme.ipa}
    </button>
  );
}
