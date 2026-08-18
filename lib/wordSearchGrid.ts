// builds square grid of phoneme symbols with a set of 'phoneme-based words' hidden

export type PlacedWord = {
  sounds: string[]; // phoneme sequence for word
  english: string; // english spelling shown within clue list
  row: number;
  col: number;
  dRow: number; // direction word travels
  dCol: number;
};

export type WordSearchGrid = {
  size: number;
  letters: string[][]; // each cell holds one phoneme symbol
  placed: PlacedWord[];
};

// 8 directions a word can be placed in (across or down or diagonally)
const DIRECTIONS = [
  { dRow: 0, dCol: 1 },
  { dRow: 0, dCol: -1 },
  { dRow: 1, dCol: 0 },
  { dRow: -1, dCol: 0 },
  { dRow: 1, dCol: 1 },
  { dRow: -1, dCol: -1 },
  { dRow: 1, dCol: -1 },
  { dRow: -1, dCol: 1 },
];

// creates a grid and 'tries' to fit every phoneme-based word within
export function buildWordSearch(words: PhonemeWordInput[], size: number): WordSearchGrid {
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
  const placed: PlacedWord[] = [];

  // ensure longer words are placed first
  const sortedWords = [...words].sort((a, b) => b.sounds.length - a.sounds.length);

  // fills squares with phonemes actually used in word
  const fillerPool = Array.from(new Set(words.flatMap((w) => w.sounds)));

  for (const word of sortedWords) {
    tryPlaceWord(word, grid, size, placed);
  }

  const letters = grid.map((row) =>
    row.map((cell) => cell ?? randomFrom(fillerPool))
  );

  return { size, letters, placed };
}

export type PhonemeWordInput = { sounds: string[]; english: string };

// tries a number of random positions and directions until word fits
function tryPlaceWord(word: PhonemeWordInput, grid: (string | null)[][], size: number, placed: PlacedWord[]) {
  const attempts = 200;
  for (let i = 0; i < attempts; i++) {
    const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);

    if (wordFitsHere(word.sounds, row, col, direction, grid, size)) {
      for (let i2 = 0; i2 < word.sounds.length; i2++) {
        grid[row + direction.dRow * i2][col + direction.dCol * i2] = word.sounds[i2];
      }
      placed.push({ sounds: word.sounds, english: word.english, row, col, dRow: direction.dRow, dCol: direction.dCol });
      return;
    }
  }
  // If it fails the word is skipped
}

// checks word can sit in position without running off the grid or clashing
function wordFitsHere(
  sounds: string[],
  row: number,
  col: number,
  direction: { dRow: number; dCol: number },
  grid: (string | null)[][],
  size: number
): boolean {
  for (let i = 0; i < sounds.length; i++) {
    const r = row + direction.dRow * i;
    const c = col + direction.dCol * i;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    const existing = grid[r][c];
    if (existing !== null && existing !== sounds[i]) return false;
  }
  return true;
}

// picks random item from a list to fill empty grid
function randomFrom(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

// checks if selected squares are the two ends of a word
export function matchWord(placed: PlacedWord[], startRow: number, startCol: number, endRow: number, endCol: number): PlacedWord | null {
  for (const word of placed) {
    const lastRow = word.row + word.dRow * (word.sounds.length - 1);
    const lastCol = word.col + word.dCol * (word.sounds.length - 1);
    const matchesForward = startRow === word.row && startCol === word.col && endRow === lastRow && endCol === lastCol;
    const matchesBackward = startRow === lastRow && startCol === lastCol && endRow === word.row && endCol === word.col;
    if (matchesForward || matchesBackward) return word;
  }
  return null;
}
