export type Phoneme = {
  ipa: string; // the phonetic symbol
  label: string; // shorthand text for button
  hint: string; // mouse-over hint with english
};

// 24 consonant sounds (ordered as the HCE keyboard reference)
export const CONSONANTS: Phoneme[] = [
  { ipa: "p", label: "P", hint: "p, as in pig" },
  { ipa: "t", label: "T", hint: "t, as in top" },
  { ipa: "k", label: "K", hint: "k, as in kite" },
  { ipa: "b", label: "B", hint: "b, as in bed" },
  { ipa: "d", label: "D", hint: "d, as in dog" },
  { ipa: "g", label: "G", hint: "g, as in gum" },
  { ipa: "n", label: "N", hint: "n, as in net" },
  { ipa: "m", label: "M", hint: "m, as in map" },
  { ipa: "ŋ", label: "NG", hint: "ng, as in ring" },
  { ipa: "f", label: "F", hint: "f, as in fan" },
  { ipa: "s", label: "S", hint: "s, as in sun" },
  { ipa: "θ", label: "TH", hint: "th, as in thin" },
  { ipa: "ʃ", label: "SH", hint: "sh, as in ship" },
  { ipa: "v", label: "V", hint: "v, as in van" },
  { ipa: "z", label: "Z", hint: "z, as in zip" },
  { ipa: "ð", label: "TH", hint: "th, as in then" },
  { ipa: "ʒ", label: "ZH", hint: "s, as in vision" },
  { ipa: "l", label: "L", hint: "l, as in log" },
  { ipa: "ɹ", label: "R", hint: "r, as in ring" },
  { ipa: "w", label: "W", hint: "w, as in win" },
  { ipa: "j", label: "Y", hint: "y, as in yes" },
  { ipa: "h", label: "H", hint: "h, as in hat" },
  { ipa: "tʃ", label: "CH", hint: "ch, as in chin" },
  { ipa: "dʒ", label: "J", hint: "j, as in jam" },
];

// 19 vowel sounds (ordered as the HCE keyboard reference)
export const VOWELS: Phoneme[] = [
  { ipa: "iː", label: "EE", hint: "ee, as in street" },
  { ipa: "ɪ", label: "I", hint: "i, as in bid" },
  { ipa: "e", label: "E", hint: "e, as in bed" },
  { ipa: "eː", label: "AIR", hint: "air, as in hair" },
  { ipa: "æ", label: "A", hint: "a, as in bad" },
  { ipa: "ɐ", label: "U", hint: "u, as in bud" },
  { ipa: "ɐː", label: "AR", hint: "ar, as in bark" },
  { ipa: "ɜː", label: "ER", hint: "er, as in bird" },
  { ipa: "ʉː", label: "OO", hint: "oo, as in boot" },
  { ipa: "ɔ", label: "O", hint: "o, as in log" },
  { ipa: "oː", label: "OR", hint: "or, as in fork" },
  { ipa: "ʊ", label: "OO", hint: "oo, as in book" },
  { ipa: "æɪ", label: "AY", hint: "ay, as in bait" },
  { ipa: "ɑe", label: "IGH", hint: "igh, as in bike" },
  { ipa: "oɪ", label: "OY", hint: "oy, as in boil" },
  { ipa: "əʉ", label: "OH", hint: "oh, as in boat" },
  { ipa: "æɔ", label: "OW", hint: "ow, as in cloud" },
  { ipa: "ɪə", label: "EAR", hint: "ear, as in beard" },
  { ipa: "ə", label: "UH", hint: "uh, a soft unstressed vowel" },
];

// jointing phonemes together (used for look up by its symbol)
export const ALL_PHONEMES: Phoneme[] = [...CONSONANTS, ...VOWELS];

// finds a phonemes full details from its symbol
export function findPhoneme(ipa: string): Phoneme | undefined {
  return ALL_PHONEMES.find((p) => p.ipa === ipa);
}

// the word made of phonemes and the english version
export type PhonemeWord = {
  id: string;
  sounds: string[];
  english: string;
};

// given phoneme word example with english
export const DEFAULT_WORDLE_WORD: PhonemeWord = {
  id: "thin",
  sounds: ["θ", "ɪ", "n"],
  english: "thin",
};

// fixed list of five words utaken from the provided 3-phoneme HCE corpus list (for word builder function)
export const WORD_SEARCH_LIST: PhonemeWord[] = [
  { id: "thin", sounds: ["θ", "ɪ", "n"], english: "thin" },
  { id: "ship", sounds: ["ʃ", "ɪ", "p"], english: "ship" },
  { id: "chin", sounds: ["tʃ", "ɪ", "n"], english: "chin" },
  { id: "jam", sounds: ["dʒ", "æ", "m"], english: "jam" },
  { id: "sun", sounds: ["s", "ɐ", "n"], english: "sun" },
];
