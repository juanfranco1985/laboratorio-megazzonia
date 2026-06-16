import { DIFFICULTY_PRESETS } from '../utils/constants.js';
import { createSeedStamp, isReversePath, isSamePath } from '../utils/helpers.js';
import { createRng } from '../utils/random.js';
import { GridGenerator } from './GridGenerator.js';

export class WordSearchEngine {
  constructor(contentManager) {
    this.contentManager = contentManager;
    this.gridGenerator = new GridGenerator();
  }

  createPuzzle(settings) {
    const category = this.contentManager.getCategory(settings.category);
    const difficulty = this.contentManager.getDifficulty(settings.difficulty);
    const wordPool = this.contentManager.getWordPool(category.id, difficulty.id);
    const seed = this.resolveSeed(settings, category.id, difficulty.id);
    const generation = this.gridGenerator.generate({
      size: difficulty.size,
      words: wordPool,
      wordCount: difficulty.wordCount,
      directionKeys: difficulty.directions,
      seed,
      createRng,
    });

    return {
      id: `${category.id}:${difficulty.id}:${seed}`,
      createdAt: new Date().toISOString(),
      seed,
      categoryId: category.id,
      categoryLabel: category.label,
      categorySourceLabel: category.sourceLabel,
      categorySourceUrl: category.sourceUrl,
      isExternalCategory: Boolean(category.isExternal),
      difficultyId: difficulty.id,
      difficultyLabel: difficulty.label,
      playMode: settings.playMode,
      timerMode: settings.timerMode,
      dailyChallengeDateKey: settings.dailyChallengeDateKey || null,
      isRankedDaily: Boolean(settings.isRankedDaily),
      size: difficulty.size,
      grid: generation.grid,
      placedWords: generation.placedWords,
      occupiedCellCount: generation.occupiedCellCount,
    };
  }

  matchSelection(puzzle, selectionCells, foundWordIds) {
    const foundSet = new Set(foundWordIds);

    return puzzle.placedWords.find((word) => (
      !foundSet.has(word.id)
      && (isSamePath(selectionCells, word.cells) || isReversePath(selectionCells, word.cells))
    )) ?? null;
  }

  getHint(puzzle, foundWordIds, hintedWordIds = []) {
    const foundSet = new Set(foundWordIds);
    const hintedSet = new Set(hintedWordIds);
    const unresolvedWords = puzzle.placedWords.filter((word) => !foundSet.has(word.id));
    const freshHints = unresolvedWords.filter((word) => !hintedSet.has(word.id));
    const hintPool = freshHints.length ? freshHints : unresolvedWords;

    if (!hintPool.length) {
      return null;
    }

    const targetWord = [...hintPool].sort((wordA, wordB) => (
      wordB.cells.length - wordA.cells.length
      || wordA.word.localeCompare(wordB.word)
    ))[0];

    return {
      wordId: targetWord.id,
      word: targetWord.word,
      cells: targetWord.cells.slice(0, Math.min(2, targetWord.cells.length)),
      direction: targetWord.direction,
    };
  }

  resolveSeed(settings, categoryId, difficultyId) {
    if (settings.playMode === 'daily') {
      return settings.customSeed || this.contentManager.getDailySeed(categoryId, difficultyId);
    }

    return settings.customSeed || this.createSeed(categoryId, difficultyId);
  }

  createSeed(categoryId, difficultyId) {
    return `${categoryId}-${difficultyId}-${createSeedStamp()}`;
  }

  getDifficulties() {
    return Object.values(DIFFICULTY_PRESETS);
  }
}
