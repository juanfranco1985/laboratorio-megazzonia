import { DEFAULT_SETTINGS, THEME_SEQUENCE } from "../utils/constants.js";

export class Settings {
  constructor(storage) {
    this.storage = storage;
    this.current = {
      ...DEFAULT_SETTINGS,
      ...storage.loadSettings(),
    };
  }

  get() {
    return { ...this.current };
  }

  update(patch) {
    this.current = {
      ...this.current,
      ...patch,
    };
    this.storage.saveSettings(this.current);
    return this.get();
  }

  cycleTheme() {
    const index = THEME_SEQUENCE.indexOf(this.current.theme);
    const nextTheme = THEME_SEQUENCE[(index + 1) % THEME_SEQUENCE.length];
    return this.update({ theme: nextTheme });
  }
}
