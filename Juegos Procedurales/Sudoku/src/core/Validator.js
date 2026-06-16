import { ALL_UNITS, CELL_PEERS, DIGITS } from "../utils/constants.js";
import { bitmaskToValues, countBits, hasBit, setBit } from "../utils/helpers.js";

export function getCandidateMask(board, index) {
  if (board[index] !== 0) {
    return 0;
  }

  let usedMask = 0;
  for (const peerIndex of CELL_PEERS[index]) {
    const value = board[peerIndex];
    if (value !== 0) {
      usedMask = setBit(usedMask, value);
    }
  }

  let candidateMask = 0;
  for (const digit of DIGITS) {
    if (!hasBit(usedMask, digit)) {
      candidateMask = setBit(candidateMask, digit);
    }
  }

  return candidateMask;
}

export function getCandidates(board, index) {
  return bitmaskToValues(getCandidateMask(board, index));
}

export function isSolved(board, solution) {
  for (let index = 0; index < board.length; index += 1) {
    if (board[index] !== solution[index]) {
      return false;
    }
  }
  return true;
}

export function evaluateBoard(board, puzzle, solution, showErrors) {
  const duplicates = new Set();
  const incorrect = new Set();

  for (const unit of ALL_UNITS) {
    const seen = new Map();
    for (const index of unit) {
      const value = board[index];
      if (value === 0) {
        continue;
      }

      if (!seen.has(value)) {
        seen.set(value, []);
      }
      seen.get(value).push(index);
    }

    for (const indices of seen.values()) {
      if (indices.length > 1) {
        indices.forEach((index) => duplicates.add(index));
      }
    }
  }

  if (showErrors) {
    for (let index = 0; index < board.length; index += 1) {
      if (puzzle[index] !== 0) {
        continue;
      }

      if (board[index] !== 0 && board[index] !== solution[index]) {
        incorrect.add(index);
      }
    }
  }

  return {
    duplicates,
    incorrect,
    hasConflicts: duplicates.size > 0 || incorrect.size > 0,
    solved: isSolved(board, solution),
  };
}

export function findBestCell(board) {
  let bestIndex = -1;
  let bestMask = 0;
  let bestCount = 10;

  for (let index = 0; index < board.length; index += 1) {
    if (board[index] !== 0) {
      continue;
    }

    const candidateMask = getCandidateMask(board, index);
    const candidateCount = countBits(candidateMask);

    if (candidateCount === 0) {
      return { index, mask: 0, count: 0 };
    }

    if (candidateCount < bestCount) {
      bestIndex = index;
      bestMask = candidateMask;
      bestCount = candidateCount;

      if (candidateCount === 1) {
        break;
      }
    }
  }

  return {
    index: bestIndex,
    mask: bestMask,
    count: bestCount,
  };
}
