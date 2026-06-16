import { createRng, createSeed, shuffleInPlace } from "../utils/random.js";
import { getNeighborCoords } from "../utils/helpers.js";
import { indexFromCoord } from "./GameState.js";

function buildProtectedSet(rows, cols, safeRow, safeCol) {
  const protectedCells = new Set([indexFromCoord(safeRow, safeCol, cols)]);

  for (const [row, col] of getNeighborCoords(safeRow, safeCol, rows, cols)) {
    protectedCells.add(indexFromCoord(row, col, cols));
  }

  return protectedCells;
}

export function populateBoard(board, rows, cols, mineCount, safeRow, safeCol, seed = createSeed()) {
  const rng = createRng(seed);
  const protectedCells = buildProtectedSet(rows, cols, safeRow, safeCol);
  const candidates = [];

  for (let index = 0; index < board.length; index += 1) {
    if (!protectedCells.has(index)) {
      candidates.push(index);
    }
  }

  if (mineCount > candidates.length) {
    throw new Error("No hay espacio suficiente para minas con la zona protegida.");
  }

  const nextBoard = board.map((cell) => ({
    ...cell,
    mine: false,
    adjacent: 0,
    exploded: false,
    wrongFlag: false,
  }));

  shuffleInPlace(candidates, rng);

  for (let index = 0; index < mineCount; index += 1) {
    nextBoard[candidates[index]].mine = true;
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cellIndex = indexFromCoord(row, col, cols);
      const cell = nextBoard[cellIndex];

      if (cell.mine) {
        continue;
      }

      let adjacent = 0;

      for (const [neighborRow, neighborCol] of getNeighborCoords(row, col, rows, cols)) {
        if (nextBoard[indexFromCoord(neighborRow, neighborCol, cols)].mine) {
          adjacent += 1;
        }
      }

      cell.adjacent = adjacent;
    }
  }

  return {
    board: nextBoard,
    seed,
  };
}
