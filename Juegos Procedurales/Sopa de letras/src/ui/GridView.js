import { getLineCells, rowColKey } from '../utils/helpers.js';

export class GridView {
  constructor(containerElement) {
    this.containerElement = containerElement;
    this.puzzle = null;
    this.disabled = false;
    this.foundWordIds = [];
    this.activePath = [];
    this.feedback = null;
    this.selection = null;
    this.feedbackTimeoutId = null;
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);

    this.containerElement.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  bind({ onSelectionCommit }) {
    this.onSelectionCommit = onSelectionCommit;
  }

  render({ puzzle, foundWordIds, disabled }) {
    const puzzleChanged = this.puzzle?.id !== puzzle?.id;
    this.puzzle = puzzle;
    this.foundWordIds = foundWordIds;
    this.disabled = disabled;

    if (puzzleChanged && puzzle) {
      this.buildGrid(puzzle);
    }

    this.containerElement.classList.toggle('is-disabled', Boolean(disabled));
    this.updateCellStates();
  }

  flashSelection(cells, tone) {
    window.clearTimeout(this.feedbackTimeoutId);
    this.feedback = {
      cells,
      tone,
    };
    this.updateCellStates();

    this.feedbackTimeoutId = window.setTimeout(() => {
      this.feedback = null;
      this.updateCellStates();
    }, 900);
  }

  buildGrid(puzzle) {
    this.containerElement.style.gridTemplateColumns = `repeat(${puzzle.size}, minmax(0, 1fr))`;
    this.containerElement.style.setProperty('--grid-size', String(puzzle.size));
    this.containerElement.innerHTML = puzzle.grid.map((row, rowIndex) => row.map((letter, colIndex) => `
      <button
        type="button"
        class="grid-cell"
        data-row="${rowIndex}"
        data-col="${colIndex}"
        aria-label="Fila ${rowIndex + 1}, columna ${colIndex + 1}, letra ${letter}"
      >
        ${letter}
      </button>
    `).join('')).join('');
  }

  handlePointerDown(event) {
    if (this.disabled || !this.puzzle) {
      return;
    }

    const cellElement = event.target.closest('.grid-cell');

    if (!cellElement) {
      return;
    }

    event.preventDefault();
    this.selection = {
      pointerId: event.pointerId,
      startCell: this.extractCell(cellElement),
    };
    this.activePath = [this.selection.startCell];
    document.body.classList.add('is-selecting');
    this.updateCellStates();
  }

  handlePointerMove(event) {
    if (!this.selection || event.pointerId !== this.selection.pointerId) {
      return;
    }

    const targetCell = this.resolveCellByPoint(event.clientX, event.clientY);

    if (!targetCell) {
      return;
    }

    const nextPath = getLineCells(this.selection.startCell, targetCell);

    if (!nextPath.length) {
      return;
    }

    this.activePath = nextPath;
    this.updateCellStates();
  }

  handlePointerUp(event) {
    if (!this.selection || event.pointerId !== this.selection.pointerId) {
      return;
    }

    const finalPath = [...this.activePath];
    this.selection = null;
    this.activePath = [];
    document.body.classList.remove('is-selecting');
    this.updateCellStates();

    if (finalPath.length) {
      this.onSelectionCommit?.(finalPath);
    }
  }

  resolveCellByPoint(clientX, clientY) {
    const target = document.elementFromPoint(clientX, clientY)?.closest('.grid-cell');
    return target ? this.extractCell(target) : null;
  }

  extractCell(cellElement) {
    return {
      row: Number(cellElement.dataset.row),
      col: Number(cellElement.dataset.col),
    };
  }

  updateCellStates() {
    if (!this.puzzle) {
      return;
    }

    const foundSet = this.createFoundCellSet();
    const activeSet = new Set(this.activePath.map((cell) => rowColKey(cell.row, cell.col)));
    const feedbackSet = new Set((this.feedback?.cells || []).map((cell) => rowColKey(cell.row, cell.col)));

    this.containerElement.querySelectorAll('.grid-cell').forEach((cellElement) => {
      const cellKey = rowColKey(
        Number(cellElement.dataset.row),
        Number(cellElement.dataset.col),
      );

      cellElement.classList.toggle('is-found', foundSet.has(cellKey));
      cellElement.classList.toggle('is-active', activeSet.has(cellKey));
      cellElement.classList.toggle('is-feedback-success', this.feedback?.tone === 'success' && feedbackSet.has(cellKey));
      cellElement.classList.toggle('is-feedback-error', this.feedback?.tone === 'error' && feedbackSet.has(cellKey));
      cellElement.classList.toggle('is-feedback-hint', this.feedback?.tone === 'hint' && feedbackSet.has(cellKey));
      cellElement.disabled = this.disabled;
    });
  }

  createFoundCellSet() {
    const foundWordIdSet = new Set(this.foundWordIds);
    const cells = new Set();

    this.puzzle.placedWords.forEach((word) => {
      if (!foundWordIdSet.has(word.id)) {
        return;
      }

      word.cells.forEach((cell) => {
        cells.add(rowColKey(cell.row, cell.col));
      });
    });

    return cells;
  }
}
