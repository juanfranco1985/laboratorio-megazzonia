export class ThemeManager {
  constructor() {
    this.mediaQuery =
      globalThis.matchMedia && typeof globalThis.matchMedia === "function"
        ? globalThis.matchMedia("(prefers-color-scheme: dark)")
        : null;
    this.metaTheme = globalThis.document?.querySelector('meta[name="theme-color"]') || null;
    this.currentTheme = "system";
  }

  init(theme) {
    this.currentTheme = theme;
    this.apply(theme);

    if (this.mediaQuery && typeof this.mediaQuery.addEventListener === "function") {
      this.mediaQuery.addEventListener("change", () => {
        if (this.currentTheme === "system") {
          this.apply("system");
        }
      });
    }
  }

  resolveTheme(theme) {
    if (theme === "system") {
      return this.mediaQuery?.matches ? "dark" : "light";
    }
    return theme;
  }

  apply(theme) {
    this.currentTheme = theme;
    const resolved = this.resolveTheme(theme);
    globalThis.document.documentElement.dataset.theme = resolved;
    globalThis.document.documentElement.dataset.themeMode = theme;

    if (this.metaTheme) {
      this.metaTheme.setAttribute("content", resolved === "dark" ? "#0f1724" : "#f4eee3");
    }
  }

  getLabel(theme) {
    const labels = {
      system: "Tema auto",
      dark: "Tema oscuro",
      light: "Tema claro",
    };
    return labels[theme] || "Tema";
  }
}
