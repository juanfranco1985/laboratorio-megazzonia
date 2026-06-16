import { THEMES } from "../utils/constants.js";

export class ThemeManager {
  constructor(rootElement, metaThemeColor) {
    this.rootElement = rootElement;
    this.metaThemeColor = metaThemeColor;
    this.preference = THEMES.auto;
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    this.mediaQuery.addEventListener("change", () => {
      if (this.preference === THEMES.auto) {
        this.apply();
      }
    });
  }

  setPreference(preference) {
    this.preference = Object.values(THEMES).includes(preference)
      ? preference
      : THEMES.auto;
    this.apply();
  }

  apply() {
    const resolvedTheme =
      this.preference === THEMES.auto
        ? this.mediaQuery.matches
          ? THEMES.dark
          : THEMES.light
        : this.preference;

    this.rootElement.dataset.themePreference = this.preference;
    this.rootElement.dataset.theme = resolvedTheme;

    if (this.metaThemeColor) {
      this.metaThemeColor.content =
        resolvedTheme === THEMES.dark ? "#06111f" : "#e6edf7";
    }
  }
}
