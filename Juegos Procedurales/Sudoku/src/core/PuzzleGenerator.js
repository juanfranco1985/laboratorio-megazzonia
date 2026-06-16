import {
  ALL_UNITS,
  BOARD_SIZE,
  BOX_UNITS,
  CELL_COUNT,
  CELL_PEERS,
  COLUMN_UNITS,
  DIFFICULTY_CONFIG,
  GENERATION_ATTEMPTS,
  ROW_UNITS,
} from "../utils/constants.js";
import {
  bitmaskToValues,
  clearBit,
  copyBoard,
  countBits,
  countFilledCells,
  createEmptyBoard,
  hasBit,
} from "../utils/helpers.js";
import { createSeededRandom, createSessionSeed } from "../utils/random.js";
import { findBestCell, getCandidateMask } from "./Validator.js";

function solveRecursive(board, randomizer = null) {
  const target = findBestCell(board);

  if (target.index === -1) {
    return true;
  }

  if (target.count === 0) {
    return false;
  }

  const options = bitmaskToValues(target.mask);
  const values = randomizer ? randomizer.shuffle(options) : options;

  for (const value of values) {
    board[target.index] = value;
    if (solveRecursive(board, randomizer)) {
      return true;
    }
  }

  board[target.index] = 0;
  return false;
}

function countSolutionsRecursive(board, limit, counter) {
  if (counter.count >= limit) {
    return;
  }

  const target = findBestCell(board);
  if (target.index === -1) {
    counter.count += 1;
    return;
  }

  if (target.count === 0) {
    return;
  }

  const values = bitmaskToValues(target.mask);
  for (const value of values) {
    board[target.index] = value;
    countSolutionsRecursive(board, limit, counter);
    if (counter.count >= limit) {
      break;
    }
  }

  board[target.index] = 0;
}

function buildRemovalGroups(randomizer) {
  const used = new Set();
  const groups = [];

  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (used.has(index)) {
      continue;
    }

    const mirrorIndex = CELL_COUNT - 1 - index;
    if (mirrorIndex === index) {
      groups.push([index]);
      used.add(index);
    } else {
      groups.push([index, mirrorIndex]);
      used.add(index);
      used.add(mirrorIndex);
    }
  }

  return randomizer.shuffle(groups);
}

function createAnalysisState(boardSource) {
  const board = copyBoard(boardSource);
  const candidates = Array(CELL_COUNT).fill(0);

  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (board[index] === 0) {
      candidates[index] = getCandidateMask(board, index);
    }
  }

  return { board, candidates };
}

function cloneAnalysisState(state) {
  return {
    board: copyBoard(state.board),
    candidates: copyBoard(state.candidates),
  };
}

function isInvalidState(state) {
  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (state.board[index] === 0 && state.candidates[index] === 0) {
      return true;
    }
  }
  return false;
}

function placeValue(state, index, value) {
  state.board[index] = value;
  state.candidates[index] = 0;

  for (const peerIndex of CELL_PEERS[index]) {
    if (state.board[peerIndex] === 0) {
      state.candidates[peerIndex] = clearBit(state.candidates[peerIndex], value);
    }
  }
}

function findBestAnalysisCell(state) {
  let bestIndex = -1;
  let bestMask = 0;
  let bestCount = 10;

  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (state.board[index] !== 0) {
      continue;
    }

    const mask = state.candidates[index];
    const count = countBits(mask);

    if (count === 0) {
      return { index, mask: 0, count: 0 };
    }

    if (count < bestCount) {
      bestIndex = index;
      bestMask = mask;
      bestCount = count;
      if (count === 1) {
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

function createTechniqueResult() {
  return {
    valid: true,
    progress: false,
    score: 0,
    nakedSingles: 0,
    hiddenSingles: 0,
    nakedPairs: 0,
    pointingPairs: 0,
    advancedMoves: 0,
  };
}

function applyNakedSingles(state) {
  const result = createTechniqueResult();
  const moves = [];

  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (state.board[index] !== 0) {
      continue;
    }

    const mask = state.candidates[index];
    const count = countBits(mask);
    if (count === 0) {
      result.valid = false;
      return result;
    }
    if (count === 1) {
      moves.push({
        index,
        value: bitmaskToValues(mask)[0],
      });
    }
  }

  if (moves.length === 0) {
    return result;
  }

  for (const move of moves) {
    placeValue(state, move.index, move.value);
  }

  result.progress = true;
  result.score = moves.length * 8;
  result.nakedSingles = moves.length;
  return result;
}

function applyHiddenSingles(state) {
  const result = createTechniqueResult();
  const moves = new Map();

  for (const unit of ALL_UNITS) {
    const candidatesByDigit = Array.from({ length: BOARD_SIZE + 1 }, () => []);

    for (const index of unit) {
      if (state.board[index] !== 0) {
        continue;
      }

      const mask = state.candidates[index];
      if (mask === 0) {
        result.valid = false;
        return result;
      }

      for (const value of bitmaskToValues(mask)) {
        candidatesByDigit[value].push(index);
      }
    }

    for (let value = 1; value <= BOARD_SIZE; value += 1) {
      if (candidatesByDigit[value].length === 1) {
        moves.set(candidatesByDigit[value][0], value);
      }
    }
  }

  if (moves.size === 0) {
    return result;
  }

  for (const [index, value] of moves.entries()) {
    placeValue(state, index, value);
  }

  result.progress = true;
  result.score = moves.size * 12;
  result.hiddenSingles = moves.size;
  return result;
}

function applyNakedPairs(state) {
  const result = createTechniqueResult();
  let pairPatterns = 0;
  let eliminations = 0;

  for (const unit of ALL_UNITS) {
    const pairMap = new Map();

    for (const index of unit) {
      if (state.board[index] !== 0) {
        continue;
      }

      const mask = state.candidates[index];
      if (countBits(mask) === 2) {
        if (!pairMap.has(mask)) {
          pairMap.set(mask, []);
        }
        pairMap.get(mask).push(index);
      }
    }

    for (const [mask, pairCells] of pairMap.entries()) {
      if (pairCells.length !== 2) {
        continue;
      }

      let changed = false;
      for (const index of unit) {
        if (pairCells.includes(index) || state.board[index] !== 0) {
          continue;
        }

        const before = state.candidates[index];
        let next = before;
        for (const value of bitmaskToValues(mask)) {
          next = clearBit(next, value);
        }

        if (next !== before) {
          state.candidates[index] = next;
          eliminations += countBits(before) - countBits(next);
          changed = true;
        }
      }

      if (changed) {
        pairPatterns += 1;
      }
    }
  }

  if (isInvalidState(state)) {
    result.valid = false;
    return result;
  }

  if (eliminations === 0) {
    return result;
  }

  result.progress = true;
  result.score = 22 * pairPatterns + eliminations * 5;
  result.nakedPairs = pairPatterns;
  result.advancedMoves = pairPatterns;
  return result;
}

function applyPointingPairs(state) {
  const result = createTechniqueResult();
  let patterns = 0;
  let eliminations = 0;

  for (const box of BOX_UNITS) {
    for (let value = 1; value <= BOARD_SIZE; value += 1) {
      const candidates = box.filter((index) => state.board[index] === 0 && hasBit(state.candidates[index], value));

      if (candidates.length < 2) {
        continue;
      }

      const rows = new Set(candidates.map((index) => Math.floor(index / BOARD_SIZE)));
      const cols = new Set(candidates.map((index) => index % BOARD_SIZE));

      if (rows.size === 1) {
        const [row] = [...rows];
        let changed = false;
        for (const index of ROW_UNITS[row]) {
          if (box.includes(index) || state.board[index] !== 0 || !hasBit(state.candidates[index], value)) {
            continue;
          }
          state.candidates[index] = clearBit(state.candidates[index], value);
          eliminations += 1;
          changed = true;
        }
        if (changed) {
          patterns += 1;
        }
      }

      if (cols.size === 1) {
        const [col] = [...cols];
        let changed = false;
        for (const index of COLUMN_UNITS[col]) {
          if (box.includes(index) || state.board[index] !== 0 || !hasBit(state.candidates[index], value)) {
            continue;
          }
          state.candidates[index] = clearBit(state.candidates[index], value);
          eliminations += 1;
          changed = true;
        }
        if (changed) {
          patterns += 1;
        }
      }
    }
  }

  if (isInvalidState(state)) {
    result.valid = false;
    return result;
  }

  if (eliminations === 0) {
    return result;
  }

  result.progress = true;
  result.score = 28 * patterns + eliminations * 6;
  result.pointingPairs = patterns;
  result.advancedMoves = patterns;
  return result;
}

function applyLogicalPass(state) {
  const techniques = [
    applyNakedSingles,
    applyHiddenSingles,
    applyNakedPairs,
    applyPointingPairs,
  ];

  for (const technique of techniques) {
    const result = technique(state);
    if (!result.valid) {
      return result;
    }
    if (result.progress) {
      return result;
    }
  }

  return createTechniqueResult();
}

function mergeMetrics(base, patch) {
  base.score += patch.score;
  base.nakedSingles += patch.nakedSingles;
  base.hiddenSingles += patch.hiddenSingles;
  base.nakedPairs += patch.nakedPairs;
  base.pointingPairs += patch.pointingPairs;
  base.advancedMoves += patch.advancedMoves;
}

function rateStateRecursive(state, depth = 0) {
  const working = cloneAnalysisState(state);
  const metrics = {
    valid: true,
    score: 0,
    guesses: 0,
    maxDepth: depth,
    nakedSingles: 0,
    hiddenSingles: 0,
    nakedPairs: 0,
    pointingPairs: 0,
    advancedMoves: 0,
  };

  while (true) {
    if (isInvalidState(working)) {
      return {
        ...metrics,
        valid: false,
        score: Infinity,
      };
    }

    const pass = applyLogicalPass(working);
    if (!pass.valid) {
      return {
        ...metrics,
        valid: false,
        score: Infinity,
      };
    }

    if (!pass.progress) {
      break;
    }

    mergeMetrics(metrics, pass);
  }

  const target = findBestAnalysisCell(working);
  if (target.index === -1) {
    return metrics;
  }

  if (target.count === 0) {
    return {
      ...metrics,
      valid: false,
      score: Infinity,
    };
  }

  let bestResult = null;
  for (const value of bitmaskToValues(target.mask)) {
    const nextState = cloneAnalysisState(working);
    placeValue(nextState, target.index, value);
    const branch = rateStateRecursive(nextState, depth + 1);

    if (!branch.valid) {
      continue;
    }

    const candidate = {
      valid: true,
      score: metrics.score + branch.score + 46 + depth * 16 + target.count * 7,
      guesses: metrics.guesses + branch.guesses + 1,
      maxDepth: Math.max(branch.maxDepth, depth + 1),
      nakedSingles: metrics.nakedSingles + branch.nakedSingles,
      hiddenSingles: metrics.hiddenSingles + branch.hiddenSingles,
      nakedPairs: metrics.nakedPairs + branch.nakedPairs,
      pointingPairs: metrics.pointingPairs + branch.pointingPairs,
      advancedMoves: metrics.advancedMoves + branch.advancedMoves,
    };

    if (!bestResult || candidate.score < bestResult.score) {
      bestResult = candidate;
    }
  }

  return (
    bestResult || {
      ...metrics,
      valid: false,
      score: Infinity,
    }
  );
}

function rateBoardRecursive(board) {
  return rateStateRecursive(createAnalysisState(board));
}

function distanceToRange(value, [min, max]) {
  if (value < min) {
    return min - value;
  }
  if (value > max) {
    return value - max;
  }
  return 0;
}

function getDifficultyDistance(analysis, difficulty) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const clueDistance = distanceToRange(analysis.clues, config.targetClues) * 24;
  const scoreDistance = distanceToRange(analysis.score, config.scoreRange);
  const guessPenalty = Math.max(0, analysis.guesses - config.maxGuesses) * 80;
  const depthPenalty = Math.max(0, analysis.maxDepth - config.maxDepth) * 90;
  const advancedPenalty = Math.max(0, config.minAdvancedMoves - analysis.advancedMoves) * 120;

  return clueDistance + scoreDistance + guessPenalty + depthPenalty + advancedPenalty;
}

function matchesDifficulty(analysis, difficulty) {
  return getDifficultyDistance(analysis, difficulty) === 0;
}

export function analyzeDifficulty(board) {
  const rating = rateBoardRecursive(board);
  const clues = countFilledCells(board);

  return {
    clues,
    empties: CELL_COUNT - clues,
    score: rating.score,
    guesses: rating.guesses,
    maxDepth: rating.maxDepth,
    nakedSingles: rating.nakedSingles,
    hiddenSingles: rating.hiddenSingles,
    nakedPairs: rating.nakedPairs,
    pointingPairs: rating.pointingPairs,
    advancedMoves: rating.advancedMoves,
    valid: rating.valid,
  };
}

export function generateSolution(seed = createSessionSeed("solution")) {
  const randomizer = createSeededRandom(seed);
  const board = createEmptyBoard();
  solveRecursive(board, randomizer);
  return board;
}

export function solveBoard(board) {
  const working = copyBoard(board);
  const solved = solveRecursive(working);
  return solved ? working : null;
}

export function countSolutions(board, limit = 2) {
  const working = copyBoard(board);
  const counter = { count: 0 };
  countSolutionsRecursive(working, limit, counter);
  return counter.count;
}

function removeCellsFromSolution(solution, difficulty, randomizer) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const targetClues = randomizer.int(config.targetClues[0], config.targetClues[1]);
  const puzzle = copyBoard(solution);
  let clueCount = CELL_COUNT;

  const groups = buildRemovalGroups(randomizer);
  for (const group of groups) {
    if (clueCount <= targetClues) {
      break;
    }

    if (clueCount - group.length < targetClues) {
      continue;
    }

    const previous = group.map((index) => puzzle[index]);
    group.forEach((index) => {
      puzzle[index] = 0;
    });

    if (countSolutions(puzzle, 2) !== 1) {
      group.forEach((index, offset) => {
        puzzle[index] = previous[offset];
      });
      continue;
    }

    clueCount -= group.length;
  }

  if (clueCount > targetClues) {
    const singles = randomizer.shuffle(Array.from({ length: CELL_COUNT }, (_, index) => index));

    for (const index of singles) {
      if (clueCount <= targetClues || puzzle[index] === 0) {
        continue;
      }

      const previous = puzzle[index];
      puzzle[index] = 0;

      if (countSolutions(puzzle, 2) !== 1) {
        puzzle[index] = previous;
        continue;
      }

      clueCount -= 1;
    }
  }

  return {
    puzzle,
    targetClues,
  };
}

export function generatePuzzleGame(difficulty, seed = createSessionSeed(difficulty)) {
  let bestCandidate = null;

  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
    const attemptSeed = `${seed}:${attempt}`;
    const randomizer = createSeededRandom(attemptSeed);
    const solution = generateSolution(`${attemptSeed}:solution`);
    const { puzzle, targetClues } = removeCellsFromSolution(solution, difficulty, randomizer);
    const analysis = analyzeDifficulty(puzzle);
    const distance = getDifficultyDistance(analysis, difficulty);

    const candidate = {
      seed: attemptSeed,
      difficulty,
      targetClues,
      puzzle,
      solution,
      analysis,
      distance,
    };

    if (!bestCandidate || candidate.distance < bestCandidate.distance) {
      bestCandidate = candidate;
    }

    if (matchesDifficulty(analysis, difficulty)) {
      return candidate;
    }
  }

  return bestCandidate;
}
