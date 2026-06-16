import { getNeighborCoords } from "../utils/helpers.js";
import { getCell } from "./GameState.js";

export function revealArea(board, rows, cols, startRow, startCol) {
  const startCell = getCell(board, startRow, startCol, cols);

  if (!startCell || startCell.revealed || startCell.flagged) {
    return {
      changed: false,
      mineHit: false,
      revealedCount: 0,
    };
  }

  if (startCell.mine) {
    startCell.revealed = true;
    startCell.exploded = true;

    return {
      changed: true,
      mineHit: true,
      revealedCount: 0,
    };
  }

  let revealedCount = 0;
  const queue = [[startRow, startCol]];
  const visited = new Set();

  while (queue.length > 0) {
    const [row, col] = queue.shift();
    const visitKey = `${row}:${col}`;

    if (visited.has(visitKey)) {
      continue;
    }

    visited.add(visitKey);

    const cell = getCell(board, row, col, cols);

    if (!cell || cell.revealed || cell.flagged || cell.mine) {
      continue;
    }

    cell.revealed = true;
    revealedCount += 1;

    if (cell.adjacent !== 0) {
      continue;
    }

    for (const [neighborRow, neighborCol] of getNeighborCoords(row, col, rows, cols)) {
      const neighbor = getCell(board, neighborRow, neighborCol, cols);

      if (neighbor && !neighbor.revealed && !neighbor.mine) {
        queue.push([neighborRow, neighborCol]);
      }
    }
  }

  return {
    changed: revealedCount > 0,
    mineHit: false,
    revealedCount,
  };
}

export function revealAllMines(board) {
  for (const cell of board) {
    if (cell.mine) {
      cell.revealed = true;
    } else if (cell.flagged) {
      cell.wrongFlag = true;
    }
  }
}

export function autoFlagMines(board) {
  for (const cell of board) {
    if (cell.mine) {
      cell.flagged = true;
    }
  }
}

export function countFlaggedNeighbors(board, rows, cols, row, col) {
  return getNeighborCoords(row, col, rows, cols).reduce((total, [nextRow, nextCol]) => {
    const neighbor = getCell(board, nextRow, nextCol, cols);
    return total + (neighbor?.flagged ? 1 : 0);
  }, 0);
}

export function getChordTargets(board, rows, cols, row, col) {
  return getNeighborCoords(row, col, rows, cols).filter(([nextRow, nextCol]) => {
    const neighbor = getCell(board, nextRow, nextCol, cols);
    return neighbor && !neighbor.revealed && !neighbor.flagged;
  });
}
