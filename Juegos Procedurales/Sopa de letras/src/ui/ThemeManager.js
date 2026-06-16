export class ThemeManager {
  constructor(targetElement = document.body) {
    this.targetElement = targetElement;
  }

  apply(theme) {
    this.targetElement.dataset.theme = theme;
  }
}
