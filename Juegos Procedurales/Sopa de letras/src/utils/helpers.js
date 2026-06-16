export function normalizeWord(rawWord) {
  return String(rawWord)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

export function formatTime(totalMs) {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function rowColKey(row, col) {
  return `${row}:${col}`;
}

export function isSamePath(pathA = [], pathB = []) {
  if (pathA.length !== pathB.length) {
    return false;
  }

  return pathA.every((cell, index) => {
    const other = pathB[index];
    return cell.row === other.row && cell.col === other.col;
  });
}

export function isReversePath(pathA = [], pathB = []) {
  if (pathA.length !== pathB.length) {
    return false;
  }

  return pathA.every((cell, index) => {
    const other = pathB[pathB.length - index - 1];
    return cell.row === other.row && cell.col === other.col;
  });
}

export function getLineCells(startCell, endCell) {
  if (!startCell || !endCell) {
    return [];
  }

  const rowDistance = endCell.row - startCell.row;
  const colDistance = endCell.col - startCell.col;
  const isStraight = rowDistance === 0 || colDistance === 0 || Math.abs(rowDistance) === Math.abs(colDistance);

  if (!isStraight) {
    return [];
  }

  const rowStep = Math.sign(rowDistance);
  const colStep = Math.sign(colDistance);
  const length = Math.max(Math.abs(rowDistance), Math.abs(colDistance)) + 1;

  return Array.from({ length }, (_, index) => ({
    row: startCell.row + rowStep * index,
    col: startCell.col + colStep * index,
  }));
}

export function createSeedStamp() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function slugify(rawValue) {
  return String(rawValue ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function uniqueStrings(rawValues = []) {
  return [...new Set(
    rawValues
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  )];
}

export function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftDateKey(dateKey, offsetDays) {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  const baseDate = new Date(year, (month || 1) - 1, day || 1);
  baseDate.setDate(baseDate.getDate() + offsetDays);
  return getDateKey(baseDate);
}

export function isPreviousDateKey(previousDateKey, nextDateKey) {
  return shiftDateKey(previousDateKey, 1) === nextDateKey;
}
