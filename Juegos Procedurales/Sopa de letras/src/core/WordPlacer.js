export class WordPlacer {
  constructor(size) {
    this.size = size;
  }

  createEmptyGrid() {
    return Array.from({ length: this.size }, () => Array(this.size).fill(''));
  }

  evaluatePlacement(grid, word, row, col, direction) {
    let overlapCount = 0;
    const cells = [];

    for (let index = 0; index < word.length; index += 1) {
      const targetRow = row + direction.rowStep * index;
      const targetCol = col + direction.colStep * index;

      if (!this.isInside(targetRow, targetCol)) {
        return null;
      }

      const existingLetter = grid[targetRow][targetCol];

      if (existingLetter && existingLetter !== word[index]) {
        return null;
      }

      if (existingLetter === word[index]) {
        overlapCount += 1;
      }

      cells.push({ row: targetRow, col: targetCol });
    }

    return {
      direction: direction.key,
      row,
      col,
      cells,
      overlapCount,
    };
  }

  placeWord(grid, word, placement) {
    placement.cells.forEach((cell, index) => {
      grid[cell.row][cell.col] = word[index];
    });
  }

  isInside(row, col) {
    return row >= 0 && row < this.size && col >= 0 && col < this.size;
  }
}
