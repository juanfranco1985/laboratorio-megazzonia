export class WordListView {
  constructor(listElement, counterElement) {
    this.listElement = listElement;
    this.counterElement = counterElement;
  }

  render(words, foundWordIds, lastFoundWordId = null) {
    const foundSet = new Set(foundWordIds);
    const remainingCount = words.length - foundWordIds.length;

    this.counterElement.textContent = `${remainingCount} restantes`;
    this.listElement.innerHTML = words.map((word) => {
      const isFound = foundSet.has(word.id);
      const isRecent = lastFoundWordId === word.id;

      return `
        <li class="word-list__item ${isFound ? 'is-found' : ''} ${isRecent ? 'is-recent' : ''}">
          <span>${word.word}</span>
          <small>${word.cells.length} letras</small>
        </li>
      `;
    }).join('');
  }
}
