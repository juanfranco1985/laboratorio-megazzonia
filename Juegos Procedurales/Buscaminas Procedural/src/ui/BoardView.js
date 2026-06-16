import { LONG_PRESS_MS } from "../utils/constants.js";

function createCellContent(cell) {
  if (cell.flagged && !cell.revealed) {
    return '<span class="cell__flag" aria-hidden="true"></span>';
  }

  if (cell.mine && cell.revealed) {
    return '<span class="cell__mine" aria-hidden="true"><span class="cell__mine-dot"></span></span>';
  }

  if (cell.wrongFlag) {
    return '<span class="cell__wrong" aria-hidden="true"></span>';
  }

  if (cell.revealed && cell.adjacent > 0) {
    return `<span class="cell__value">${cell.adjacent}</span>`;
  }

  return "";
}

function buildAriaLabel(cell) {
  if (cell.flagged && !cell.revealed) {
    return `Celda ${cell.row + 1}-${cell.col + 1}, marcada con bandera`;
  }

  if (!cell.revealed) {
    return `Celda ${cell.row + 1}-${cell.col + 1}, oculta`;
  }

  if (cell.mine) {
    return `Celda ${cell.row + 1}-${cell.col + 1}, mina`;
  }

  if (cell.adjacent > 0) {
    return `Celda ${cell.row + 1}-${cell.col + 1}, ${cell.adjacent} minas vecinas`;
  }

  return `Celda ${cell.row + 1}-${cell.col + 1}, vacia`;
}

export class BoardView {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.cellElements = [];
    this.currentDimensions = "";
    this.handlers = {
      onPrimaryAction: null,
      onSecondaryAction: null,
    };
    this.longPressTimer = null;
    this.suppressedClickKey = null;

    this.#bindPointerEvents();
  }

  bind(handlers) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  clear() {
    this.rootElement.innerHTML = "";
    this.cellElements = [];
    this.currentDimensions = "";
  }

  render(state) {
    const dimensionsKey = `${state.rows}x${state.cols}`;
    this.rootElement.style.setProperty("--cell-size", this.#resolveCellSize(state.cols));

    if (dimensionsKey !== this.currentDimensions) {
      this.#buildGrid(state.rows, state.cols);
      this.currentDimensions = dimensionsKey;
    }

    state.board.forEach((cell, index) => {
      const element = this.cellElements[index];
      const isRevealed = cell.revealed;
      const classes = ["cell"];

      classes.push(isRevealed ? "cell--revealed" : "cell--hidden");

      if (cell.flagged) {
        classes.push("cell--flagged");
      }

      if (cell.resolvedMine) {
        classes.push("cell--resolved-mine");
      }

      if (cell.mine && cell.revealed) {
        classes.push("cell--mine");
      }

      if (cell.exploded) {
        classes.push("cell--exploded");
      }

      if (cell.wrongFlag) {
        classes.push("cell--wrong-flag");
      }

      if (isRevealed && cell.adjacent > 0) {
        classes.push(`cell--adjacent-${cell.adjacent}`);
      }

      element.className = classes.join(" ");
      element.innerHTML = createCellContent(cell);
      element.disabled =
        state.isPaused || state.status === "won" || state.status === "lost";
      element.setAttribute("aria-label", buildAriaLabel(cell));
    });
  }

  #buildGrid(rows, cols) {
    this.rootElement.innerHTML = "";
    this.rootElement.style.setProperty("--board-cols", cols);
    this.cellElements = [];

    const fragment = document.createDocumentFragment();

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const button = document.createElement("button");
        button.className = "cell cell--hidden";
        button.type = "button";
        button.dataset.row = String(row);
        button.dataset.col = String(col);
        button.dataset.key = `${row}:${col}`;
        button.setAttribute("role", "gridcell");
        button.setAttribute("aria-label", `Celda ${row + 1}-${col + 1}, oculta`);
        fragment.appendChild(button);
        this.cellElements.push(button);
      }
    }

    this.rootElement.appendChild(fragment);
  }

  #resolveCellSize(cols) {
    if (cols >= 18) {
      return "2.05rem";
    }

    if (cols >= 16) {
      return "2.2rem";
    }

    if (cols >= 12) {
      return "2.45rem";
    }

    return "clamp(2.35rem, 7vw, 3.15rem)";
  }

  #bindPointerEvents() {
    this.rootElement.addEventListener("contextmenu", (event) => {
      const target = event.target.closest(".cell");

      if (!target) {
        return;
      }

      event.preventDefault();
      this.#fireSecondaryAction(target);
    });

    this.rootElement.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" || event.button !== 0) {
        return;
      }

      const target = event.target.closest(".cell");

      if (!target) {
        return;
      }

      this.#clearLongPress();
      this.longPressTimer = window.setTimeout(() => {
        this.suppressedClickKey = target.dataset.key;
        this.#fireSecondaryAction(target);
        this.#clearLongPress();
      }, LONG_PRESS_MS);
    });

    const cancelLongPress = () => this.#clearLongPress();
    this.rootElement.addEventListener("pointerup", cancelLongPress);
    this.rootElement.addEventListener("pointercancel", cancelLongPress);
    this.rootElement.addEventListener("pointerleave", cancelLongPress);

    this.rootElement.addEventListener("click", (event) => {
      const target = event.target.closest(".cell");

      if (!target) {
        return;
      }

      if (this.suppressedClickKey === target.dataset.key) {
        this.suppressedClickKey = null;
        return;
      }

      this.handlers.onPrimaryAction?.(
        Number(target.dataset.row),
        Number(target.dataset.col),
      );
    });
  }

  #fireSecondaryAction(target) {
    this.handlers.onSecondaryAction?.(
      Number(target.dataset.row),
      Number(target.dataset.col),
    );
  }

  #clearLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }
}
