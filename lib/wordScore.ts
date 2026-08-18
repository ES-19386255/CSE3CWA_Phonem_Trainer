// evals guessed phoneme apart as correct (right spot) or present (wrong spot) or absent (not in the answer)
export type TileResult = "correct" | "present" | "absent";

// evals one guess against the answer and returns a result
export function scoreGuess(guess: string[], answer: string[]): TileResult[] {
  const result: TileResult[] = guess.map(() => "absent");
  const usedInAnswer = answer.map(() => false);

  // marks exact matches so not counted twice
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
      usedInAnswer[i] = true;
    }
  }

  // marks phonemes that appear elsewhere within answer
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") continue;
    const matchIndex = answer.findIndex((sound, j) => sound === guess[i] && !usedInAnswer[j]);
    if (matchIndex !== -1) {
      result[i] = "present";
      usedInAnswer[matchIndex] = true;
    }
  }

  return result;
}

// function once every phoneme in the guess is marked correctly
export function isCorrectGuess(result: TileResult[]): boolean {
  return result.every((r) => r === "correct");
}
