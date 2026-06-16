import { CATEGORY_PACKS } from '../data/categories.js';
import { DIFFICULTY_PRESETS, PACK_MANIFEST_URL } from '../utils/constants.js';
import { getDateKey, normalizeWord, uniqueStrings } from '../utils/helpers.js';
import { hashSeed } from '../utils/random.js';
import { PackLoader } from './PackLoader.js';

export class ContentManager {
  constructor() {
    this.packLoader = new PackLoader();
    this.baseCategories = Object.values(CATEGORY_PACKS).map((category) => ({
      ...category,
      baseId: category.id,
      words: [...new Set(category.words.map((word) => normalizeWord(word)).filter(Boolean))],
      sourceId: 'builtin',
      sourceLabel: 'Incluido',
      sourceUrl: null,
      sourceKind: 'builtin',
      isBuiltIn: true,
      isExternal: false,
      isActive: true,
      isRemovable: false,
      isToggleable: false,
    }));
    this.categories = [...this.baseCategories];
    this.sources = [
      {
        id: 'builtin',
        label: 'Incluido',
        sourceUrl: null,
        sourceKind: 'builtin',
        isBuiltIn: true,
        isExternal: false,
        isActive: true,
        isRemovable: false,
        isToggleable: false,
      },
    ];
    this.externalErrors = [];
  }

  getCategories() {
    return this.categories.map(({
      id,
      baseId,
      label,
      description,
      words,
      sourceLabel,
      sourceUrl,
      sourceId,
      sourceKind,
      isExternal,
    }) => ({
      id,
      baseId,
      label,
      description,
      wordCount: words.length,
      sourceLabel,
      sourceUrl,
      sourceId,
      sourceKind,
      isExternal,
    }));
  }

  getCategory(categoryId) {
    return this.categories.find((category) => category.id === categoryId) ?? this.categories[0];
  }

  getSources() {
    return this.sources.map((source) => ({
      ...source,
      categoryCount: this.categories.filter((category) => category.sourceId === source.id).length,
    }));
  }

  getExternalErrors() {
    return [...this.externalErrors];
  }

  getDifficulty(difficultyId) {
    return DIFFICULTY_PRESETS[difficultyId] ?? DIFFICULTY_PRESETS.medium;
  }

  getWordPool(categoryId, difficultyId) {
    const category = this.getCategory(categoryId);
    const difficulty = this.getDifficulty(difficultyId);
    const wordsThatFitBoard = category.words.filter((word) => word.length <= difficulty.size);

    const filteredWords = wordsThatFitBoard.filter((word) => (
      word.length >= difficulty.minWordLength
      && word.length <= Math.min(difficulty.maxWordLength, difficulty.size)
    ));

    return filteredWords.length >= difficulty.wordCount ? filteredWords : wordsThatFitBoard;
  }

  getDailySeed(categoryId, difficultyId, date = new Date()) {
    const dateKey = getDateKey(date).replace(/-/g, '');
    return `daily-${dateKey}-${categoryId}-${difficultyId}`;
  }

  getDailyChallengeProfile(date = new Date()) {
    const builtInCategories = [...this.baseCategories];
    const categoryHash = hashSeed(`daily-category:${getDateKey(date)}`);
    const difficultyHash = hashSeed(`daily-difficulty:${getDateKey(date)}`);
    const difficultyIds = ['medium', 'hard', 'expert', 'easy'];
    const category = builtInCategories[categoryHash % builtInCategories.length];
    const difficultyId = difficultyIds[difficultyHash % difficultyIds.length];

    return {
      dateKey: getDateKey(date),
      categoryId: category.id,
      categoryLabel: category.label,
      difficultyId,
      difficultyLabel: this.getDifficulty(difficultyId).label,
      timerMode: 'timed',
      playMode: 'daily',
      seed: this.getDailySeed(category.id, difficultyId, date),
    };
  }

  async loadExternalSources(externalPackUrls = [], inactiveSourceIds = []) {
    const manifestUrls = await this.packLoader.loadManifestSources(PACK_MANIFEST_URL);
    const manifestUrlSet = new Set(uniqueStrings(manifestUrls));
    const userUrlSet = new Set(uniqueStrings(externalPackUrls));
    const loaded = await this.packLoader.loadSources([...manifestUrlSet, ...userUrlSet]);
    const inactiveIdSet = new Set(uniqueStrings(inactiveSourceIds));

    const decoratedSources = loaded.sources.map((source) => {
      const sourceKind = manifestUrlSet.has(source.sourceUrl) ? 'manifest' : 'user';
      const isActive = !inactiveIdSet.has(source.id);

      return {
        ...source,
        sourceKind,
        isExternal: true,
        isActive,
        isRemovable: sourceKind === 'user',
        isToggleable: true,
      };
    });

    const sourceMap = new Map(decoratedSources.map((source) => [source.id, source]));
    const activeCategories = loaded.categories.filter((category) => sourceMap.get(category.sourceId)?.isActive !== false);
    this.categories = [...this.baseCategories, ...activeCategories];
    this.sources = [
      {
        id: 'builtin',
        label: 'Incluido',
        sourceUrl: null,
        sourceKind: 'builtin',
        isBuiltIn: true,
        isExternal: false,
        isActive: true,
        isRemovable: false,
        isToggleable: false,
      },
      ...decoratedSources,
    ];
    this.externalErrors = loaded.errors;

    return {
      categories: this.getCategories(),
      sources: this.getSources(),
      errors: this.getExternalErrors(),
    };
  }
}
