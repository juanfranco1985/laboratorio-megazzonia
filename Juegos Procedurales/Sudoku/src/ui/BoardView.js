import { CELL_PEERS } from "../utils/constants.js";
import { bitmaskToValues, indexToRowCol } from "../utils/helpers.js";

function buildCellLabel(game, index) {
  const { row, col } = indexToRowCol(index);
  const value = game.current[index];
  const given = game.puzzle[index] !== 0;
  const notes = bitmaskToValues(game.notes[index]);

  if (value !== 0) {
    return `Fila ${row + 1}, columna ${col + 1}, valor ${value}${given ? ", fija" : ", editable"}`;
  }

  if (notes.length > 0) {
    return `Fila ${row + 1}, columna ${col + 1}, vacia, notas ${notes.join(", ")}`;
  }

  return `Fila ${row + 1}, columna ${col + 1}, vacia`;
}

function renderNotes(mask) {
  const active = new Set(bitmaskToValues(mask));
  return `
    <span class="cell-notes" aria-hidden="true">
      ${Array.from({ length: 9 }, (_, index) => {
        const value = index + 1;
        return `<span class="cell-note ${active.has(value) ? "is-visible" : ""}">${value}</span>`;
      }).join("")}
    </span>
  `;
}

export class BoardView {
  constructor(container) {
    this.container = container;
    this.lastKey = "";
  }

  render(snapshot) {
    const game = snapshot.game;
    if (!game) {
      this.container.innerHTML = "";
      this.lastKey = "";
      return;
    }

    const renderKey = [
      game.revision,
      game.paused,
      game.completed,
      snapshot.settings.showErrors,
      game.selectedIndex,
    ].join(":");

    if (renderKey === this.lastKey) {
      return;
    }

    const selectedIndex = game.selectedIndex;
    const related = new Set(selectedIndex !== null && selectedIndex >= 0 ? CELL_PEERS[selectedIndex] : []);
    const matching = new Set(game.matchingIndices || []);
    const duplicates = new Set(game.duplicates || []);
    const incorrect = new Set(game.incorrect || []);

    this.container.innerHTML = Array.from({ length: game.current.length }, (_, index) => {
      const { row, col } = indexToRowCol(index);
      const value = game.current[index];
      const given = game.puzzle[index] !== 0;
      const classes = ["board-cell"];

      if (selectedIndex === index) {
        classes.push("is-selected");
      }
      if (related.has(index)) {
        classes.push("is-related");
      }
      if (matching.has(index) && value !== 0) {
        classes.push("is-matching");
      }
      if (duplicates.has(index)) {
        classes.push("is-conflict");
      }
      if (incorrect.has(index)) {
        classes.push("is-incorrect");
      }
      if (given) {
        classes.push("is-given");
      }
      if ((col + 1) % 3 === 0 && col !== 8) {
        classes.push("is-box-edge-right");
      }
      if ((row + 1) % 3 === 0 && row !== 8) {
        classes.push("is-box-edge-bottom");
      }

      return `
        <button
          type="button"
          class="${classes.join(" ")}"
          data-cell="${index}"
          aria-label="${buildCellLabel(game, index)}"
          aria-pressed="${selectedIndex === index ? "true" : "false"}"
          tabindex="${selectedIndex === index ? "0" : "-1"}"
          ${game.paused || snapshot.isGenerating ? "disabled" : ""}
        >
          <span class="cell-surface">
            ${
              value === 0
                ? renderNotes(game.notes[index])
                : `<span class="cell-value">${value}</span>`
            }
          </span>
        </button>
      `;
    }).join("");

    this.lastKey = renderKey;
  }
}
