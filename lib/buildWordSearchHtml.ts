import { WordSearchGrid } from "@/lib/wordSearchGrid";

// builds the full standalone HTML page for the 'Word Search'
export function buildWordSearchHtml(grid: WordSearchGrid, showHints: boolean): string {
  const gameData = JSON.stringify({
    size: grid.size,
    letters: grid.letters, // each cell holds only one phoneme symbol
    placed: grid.placed,
    showHints: showHints,
  }).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Phoneme Word Search</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f3f7f7; color: #16262b; max-width: 500px; margin: 0 auto; padding: 1rem; text-align: center; }
  h1 { color: #1c4a56; }
  #grid { display: grid; gap: 3px; max-width: 460px; margin: 1rem auto; }
  .cell { aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; border: 1px solid #cfe0e1; border-radius: 3px; background: #fff; cursor: pointer; }
  .cell.selected { background: #cfe3e6; }
  .cell.found { background: #d8efe0; border-color: #3f8f5f; }
  .word-list { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
  .word-list li { border: 1px solid #cfe0e1; border-radius: 6px; padding: 0.4rem 0.6rem; background: #fff; }
  .word-list li.found { text-decoration: line-through; opacity: 0.6; border-color: #3f8f5f; }
  .message { font-weight: bold; min-height: 1.5rem; }
</style>
</head>
<body>
  <h1>Phoneme Word Search</h1>
  <p>Click the first phoneme then the last phoneme to find each word.</p>
  <div id="grid"></div>
  <p id="message" class="message"></p>
  <ul id="word-list" class="word-list"></ul>

  <script id="game-data" type="application/json">${gameData}</script>
  <script>
    // everything below is JavaScript meaning no build step needed (same as the Wordle)
    var data = JSON.parse(document.getElementById("game-data").textContent);
    var selectedStart = null;
    var found = []; // holds the English spelling of each found so far

    // checks whether the two tapped squares are the two ends of a 'hidden word'
    function matchWord(startRow, startCol, endRow, endCol) {
      for (var i = 0; i < data.placed.length; i++) {
        var w = data.placed[i];
        var lastRow = w.row + w.dRow * (w.sounds.length - 1);
        var lastCol = w.col + w.dCol * (w.sounds.length - 1);
        var forward = startRow === w.row && startCol === w.col && endRow === lastRow && endCol === lastCol;
        var backward = startRow === lastRow && startCol === lastCol && endRow === w.row && endCol === w.col;
        if (forward || backward) return w;
      }
      return null;
    }

    // redraws the grid (highlights words found)
    function renderGrid() {
      var gridEl = document.getElementById("grid");
      gridEl.style.gridTemplateColumns = "repeat(" + data.size + ", 1fr)";
      gridEl.innerHTML = "";
      for (var r = 0; r < data.size; r++) {
        for (var c = 0; c < data.size; c++) {
          var cell = document.createElement("button");
          cell.type = "button";
          cell.className = "cell";
          if (isFoundCell(r, c)) cell.className += " found";
          if (selectedStart && selectedStart.row === r && selectedStart.col === c) cell.className += " selected";
          cell.textContent = data.letters[r][c];
          cell.addEventListener("click", (function (row, col) {
            return function () { handleCellClick(row, col); };
          })(r, c));
          gridEl.appendChild(cell);
        }
      }
    }

    // checks grid square belongs to a word already found
    function isFoundCell(row, col) {
      return data.placed.some(function (w) {
        if (found.indexOf(w.english) === -1) return false;
        for (var i = 0; i < w.sounds.length; i++) {
          if (w.row + w.dRow * i === row && w.col + w.dCol * i === col) return true;
        }
        return false;
      });
    }

    // draws the list of phoneme clues below the grid
    function renderWordList() {
      var listEl = document.getElementById("word-list");
      listEl.innerHTML = "";
      data.placed.forEach(function (word) {
        var li = document.createElement("li");
        if (found.indexOf(word.english) !== -1) li.className = "found";
        li.textContent = word.sounds.join(" - ");
        if (data.showHints) li.title = "Sounds out to: " + word.english;
        listEl.appendChild(li);
      });
    }

    // Handler for selecting grid square - first click starts a selection second checks it
    function handleCellClick(row, col) {
      if (!selectedStart) {
        selectedStart = { row: row, col: col };
        renderGrid();
        return;
      }
      var match = matchWord(selectedStart.row, selectedStart.col, row, col);
      if (match && found.indexOf(match.english) === -1) {
        found.push(match.english);
      }
      selectedStart = null;
      renderGrid();
      renderWordList();
      if (found.length === data.placed.length) {
        document.getElementById("message").textContent = "All words found!";
      }
    }

    renderGrid();
    renderWordList();
  </script>
</body>
</html>`;
}
