import { ALL_PHONEMES } from "@/lib/phonemes";

export type WordleSettings = {
  sounds: string[];
  english: string;
  showHints: boolean;
  maxGuesses: number;
};

// Build for full standalone HTML page for Wordle
export function buildWordleHtml(settings: WordleSettings): string {
  // The 'game data' is embedded as a JSON so the page needs no other files
  const gameData = JSON.stringify({
    answer: settings.sounds,
    english: settings.english,
    showHints: settings.showHints,
    maxGuesses: settings.maxGuesses,
    phonemes: ALL_PHONEMES,
  }).replace(/</g, "\\u003c"); // stops the JSON accidentally closing the <script> tag

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Phoneme Wordle Page</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f3f7f7; color: #16262b; max-width: 500px; margin: 0 auto; padding: 1rem; text-align: center; }
  h1 { color: #1c4a56; }
  .row { display: flex; justify-content: center; gap: 0.4rem; margin-bottom: 0.4rem; }
  .tile { width: 2.6rem; height: 2.6rem; display: flex; align-items: center; justify-content: center; border: 2px solid #cfe0e1; border-radius: 8px; font-weight: bold; background: #fff; }
  .tile.correct { background: #d8efe0; border-color: #3f8f5f; }
  .tile.present { background: #f7e6c4; border-color: #c98a1d; }
  .tile.absent { background: #e3e9ea; color: #6b7b7f; }
  .keyboard { display: flex; flex-wrap: wrap; gap: 0.35rem; justify-content: center; margin-top: 1rem; }
  .key { min-width: 2.4rem; padding: 0.4rem; border: 1px solid #cfe0e1; border-radius: 6px; background: #fff; cursor: pointer; font-family: inherit; font-size: 1rem; }
  .key:disabled { opacity: 0.4; }
  .message { font-weight: bold; min-height: 1.5rem; margin-top: 0.5rem; }
  button.enter { margin-top: 0.75rem; padding: 0.6rem 1.2rem; background: #2b6777; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
  button.enter:disabled { opacity: 0.4; }
</style>
</head>
<body>
  <h1>Phoneme Wordle Game</h1>
  <p>Guess the word, one phoneme at a time!</p>
  <div id="grid"></div>
  <p id="message" class="message"></p>
  <div id="keyboard" class="keyboard"></div>
  <button id="enter" class="enter" type="button">Enter</button>

  <script id="game-data" type="application/json">${gameData}</script>
  <script>
    // Everything below is JavaScript meaning no build step needed
    var data = JSON.parse(document.getElementById("game-data").textContent);
    var guesses = [];
    var current = [];
    var gameOver = false;

    // Same comparison rule as the React app (works out correct, present or absent per phoneme)
    function scoreGuess(guess, answer) {
      var result = guess.map(function () { return "absent"; });
      var used = answer.map(function () { return false; });
      for (var i = 0; i < guess.length; i++) {
        if (guess[i] === answer[i]) { result[i] = "correct"; used[i] = true; }
      }
      for (var j = 0; j < guess.length; j++) {
        if (result[j] === "correct") continue;
        for (var k = 0; k < answer.length; k++) {
          if (!used[k] && answer[k] === guess[j]) { result[j] = "present"; used[k] = true; break; }
        }
      }
      return result;
    }

    // redraws the guess grid to match the current game state
    function renderGrid() {
      var gridEl = document.getElementById("grid");
      gridEl.innerHTML = "";
      for (var r = 0; r < data.maxGuesses; r++) {
        var rowEl = document.createElement("div");
        rowEl.className = "row";
        var sounds, results;
        if (r < guesses.length) {
          sounds = guesses[r];
          results = scoreGuess(sounds, data.answer);
        } else if (r === guesses.length) {
          sounds = current.concat(new Array(data.answer.length - current.length).fill(""));
          results = [];
        } else {
          sounds = new Array(data.answer.length).fill("");
          results = [];
        }
        sounds.forEach(function (sound, i) {
          var tile = document.createElement("div");
          tile.className = "tile" + (results[i] ? " " + results[i] : "");
          tile.textContent = sound;
          rowEl.appendChild(tile);
        });
        gridEl.appendChild(rowEl);
      }
    }

    // draws every phoneme key once so students can build a guess by clicking
    // each key shows only the phoneme symbol with mouse over hint
    function renderKeyboard() {
      var keyboardEl = document.getElementById("keyboard");
      keyboardEl.innerHTML = "";
      data.phonemes.forEach(function (phoneme) {
        var key = document.createElement("button");
        key.type = "button";
        key.className = "key";
        key.textContent = phoneme.ipa;
        key.disabled = gameOver;
        if (data.showHints) key.title = phoneme.hint;
        key.setAttribute("aria-label", phoneme.hint);
        key.addEventListener("click", function () { addSound(phoneme.ipa); });
        keyboardEl.appendChild(key);
      });
    }

    // adds one phoneme to the guess being built (if theres room left)
    function addSound(ipa) {
      if (gameOver || current.length >= data.answer.length) return;
      current.push(ipa);
      renderGrid();
      updateEnterButton();
    }

    // submits the current guess and checks correctness
    function submitGuess() {
      if (gameOver || current.length !== data.answer.length) return;
      guesses.push(current);
      var results = scoreGuess(current, data.answer);
      var won = results.every(function (r) { return r === "correct"; });
      current = [];
      if (won) {
        gameOver = true;
        document.getElementById("message").textContent = "Correct! The word is \\"" + data.english + "\\".";
      } else if (guesses.length >= data.maxGuesses) {
        gameOver = true;
        document.getElementById("message").textContent = "Out of guesses. The word was \\"" + data.english + "\\".";
      }
      renderGrid();
      renderKeyboard();
      updateEnterButton();
    }

    // Enables Enter button only once a full guess is done
    function updateEnterButton() {
      document.getElementById("enter").disabled = gameOver || current.length !== data.answer.length;
    }

    document.getElementById("enter").addEventListener("click", submitGuess);
    renderGrid();
    renderKeyboard();
    updateEnterButton();
  </script>
</body>
</html>`;
}
