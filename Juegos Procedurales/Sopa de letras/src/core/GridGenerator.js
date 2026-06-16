import {
  BOARD_GENERATION_RETRIES,
  DIRECTION_VECTORS,
  LETTER_BAG,
  WORD_PLACEMENT_ATTEMPTS,
} from '../utils/constants.js';
import { pickFromBag, randomInt, sample, shuffle } from '../utils/random.js';
import { rowColKey } from '../utils/helpers.js';
import { WordPlacer } from './WordPlacer.js';

export class GridGenerator {
  generate({
    size,
    words,
    wordCount,
    directionKeys,
    seed,
    createRng,
  }) {
    for (let attempt = 0; attempt < BOARD_GENERATION_RETRIES; attempt += 1) {
      const rng = createRng(`${seed}:${attempt}`);
      const placer = new WordPlacer(size);
      const grid = placer.createEmptyGrid();
      const placedWords = [];
      const orderedWords = shuffle(rng, words).sort((wordA, wordB) => wordB.length - wordA.length);

      for (const word of orderedWords) {
        if (placedWords.length >= wordCount) {
          break;
        }

        const placement = this.findBestPlacement({
          grid,
          placer,
          word,
          directionKeys,
          rng,
        });

        if (!placement) {
          continue;
        }

        placer.placeWord(grid, word, placement);
        placedWords.push({
          id: `word-${placedWords.length}-${word}`,
          word,
          direction: placement.direction,
          start: placement.cells[0],
          end: placement.cells[placement.cells.length - 1],
          cells: placement.cells,
          overlapCount: placement.overlapCount,
        });
      }

      if (placedWords.length === wordCount) {
        this.fillEmptyCells(grid, rng);
        return {
          grid,
          placedWords,
          occupiedCellCount: this.countOccupiedCells(placedWords),
        };
      }
    }

    throw new Error('No fue posible generar una sopa de letras válida con la configuración actual.');
  }

  findBestPlacement({
    grid,
    placer,
    word,
    directionKeys,
    rng,
  }) {
    let bestPlacement = null;

    for (let attempt = 0; attempt < WORD_PLACEMENT_ATTEMPTS; attempt += 1) {
      const directionKey = sample(rng, directionKeys);
      const direction = DIRECTION_VECTORS[directionKey];
      const start = this.createValidStart({
        size: grid.length,
        wordLength: word.length,
        direction,
        rng,
      });

      const evaluatedPlacement = placer.evaluatePlacement(grid, word, start.row, start.col, direction);

      if (!evaluatedPlacement) {
        continue;
      }

      const centerBias = this.getCenterBias(evaluatedPlacement.cells, grid.length);
      const score = evaluatedPlacement.overlapCount * 7 + centerBias + rng();

      if (!bestPlacement || score > bestPlacement.score) {
        bestPlacement = {
          ...evaluatedPlacement,
          score,
        };
      }
    }

    return bestPlacement;
  }

  createValidStart({ size, wordLength, direction, rng }) {
    const rowMin = direction.rowStep === -1 ? wordLength - 1 : 0;
    const rowMax = direction.rowStep === 1 ? size - wordLength : size - 1;
    const colMin = direction.colStep === -1 ? wordLength - 1 : 0;
    const colMax = direction.colStep === 1 ? size - wordLength : size - 1;

    return {
      row: randomInt(rng, rowMin, rowMax),
      col: randomInt(rng, colMin, colMax),
    };
  }

  fillEmptyCells(grid, rng) {
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (!cell) {
          grid[rowIndex][colIndex] = pickFromBag(rng, LETTER_BAG);
        }
      });
    });
  }

  getCenterBias(cells, size) {
    const middle = (size - 1) / 2;
    const averageDistance = cells.reduce((total, cell) => {
      const rowDistance = Math.abs(cell.row - middle);
      const colDistance = Math.abs(cell.col - middle);
      return total + rowDistance + colDistance;
    }, 0) / cells.length;

    return Math.max(0, size - averageDistance);
  }

  countOccupiedCells(placedWords) {
    const cellSet = new Set();

    placedWords.forEach((word) => {
      word.cells.forEach((cell) => {
        cellSet.add(rowColKey(cell.row, cell.col));
      });
    });

    return cellSet.size;
  }
}
