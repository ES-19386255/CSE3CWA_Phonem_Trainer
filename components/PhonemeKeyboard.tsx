import { CONSONANTS, VOWELS } from "@/lib/phonemes";
import PhonemeButton from "@/components/PhonemeButton";

type Props = {
  onSelect: (ipa: string) => void;
  showHints: boolean;
};

// The full on-screen 'phoneme keyboard'
export default function PhonemeKeyboard({ onSelect, showHints }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-xs font-semibold text-[var(--text-muted)]">Consonants</p>
        <div className="flex flex-wrap gap-1.5">
          {CONSONANTS.map((phoneme) => (
            <PhonemeButton key={phoneme.ipa} phoneme={phoneme} showHint={showHints} onClick={() => onSelect(phoneme.ipa)} />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold text-[var(--text-muted)]">Vowels</p>
        <div className="flex flex-wrap gap-1.5">
          {VOWELS.map((phoneme) => (
            <PhonemeButton key={phoneme.ipa} phoneme={phoneme} showHint={showHints} onClick={() => onSelect(phoneme.ipa)} />
          ))}
        </div>
      </div>
    </div>
  );
}
