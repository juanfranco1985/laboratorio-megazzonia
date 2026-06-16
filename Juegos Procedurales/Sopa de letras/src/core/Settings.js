import {
  DEFAULT_SETTINGS,
  DIFFICULTY_PRESETS,
  MAX_EXTERNAL_PACK_SOURCES,
  PLAY_MODES,
  THEMES,
  TIMER_MODES,
} from '../utils/constants.js';
import { uniqueStrings } from '../utils/helpers.js';

export class Settings {
  constructor(initialSettings = {}) {
    this.value = this.sanitize({
      ...DEFAULT_SETTINGS,
      ...initialSettings,
    });
  }

  sanitize(candidateSettings) {
    const difficulty = DIFFICULTY_PRESETS[candidateSettings.difficulty]
      ? candidateSettings.difficulty
      : DEFAULT_SETTINGS.difficulty;

    const theme = THEMES.includes(candidateSettings.theme)
      ? candidateSettings.theme
      : DEFAULT_SETTINGS.theme;

    const playMode = PLAY_MODES.includes(candidateSettings.playMode)
      ? candidateSettings.playMode
      : DEFAULT_SETTINGS.playMode;

    const timerMode = TIMER_MODES.includes(candidateSettings.timerMode)
      ? candidateSettings.timerMode
      : DEFAULT_SETTINGS.timerMode;

    return {
      category: String(candidateSettings.category || DEFAULT_SETTINGS.category),
      difficulty,
      theme,
      playMode,
      timerMode,
      customSeed: String(candidateSettings.customSeed || '').trim().slice(0, 40),
      externalPackUrls: uniqueStrings(candidateSettings.externalPackUrls || [])
        .slice(0, MAX_EXTERNAL_PACK_SOURCES),
      inactiveSourceIds: uniqueStrings(candidateSettings.inactiveSourceIds || []),
    };
  }

  get() {
    return { ...this.value };
  }

  update(patch) {
    this.value = this.sanitize({
      ...this.value,
      ...patch,
    });

    return this.get();
  }
}
