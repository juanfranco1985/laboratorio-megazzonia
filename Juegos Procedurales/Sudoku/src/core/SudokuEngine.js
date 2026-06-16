import { analyzeDifficulty, countSolutions, generatePuzzleGame, solveBoard } from "./PuzzleGenerator.js";
import { isSolved } from "./Validator.js";

export class SudokuEngine {
  generateGame(difficulty, seed) {
    return generatePuzzleGame(difficulty, seed);
  }

  solve(board) {
    return solveBoard(board);
  }

  countSolutions(board, limit = 2) {
    return countSolutions(board, limit);
  }

  analyze(board) {
    return analyzeDifficulty(board);
  }

  isSolved(board, solution) {
    return isSolved(board, solution);
  }
}
