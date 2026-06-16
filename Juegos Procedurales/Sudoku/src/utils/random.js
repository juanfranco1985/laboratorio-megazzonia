export function hashString(value) {
  const input = String(value);
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createSeededRandom(seed) {
  let state = hashString(seed) || 0x6d2b79f5;

  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let temp = state;
    temp = Math.imul(temp ^ (temp >>> 15), temp | 1);
    temp ^= temp + Math.imul(temp ^ (temp >>> 7), temp | 61);
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296;
  }

  return {
    seed: String(seed),
    next,
    int(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick(items) {
      return items[Math.floor(next() * items.length)];
    },
    shuffle(items) {
      const clone = items.slice();
      for (let index = clone.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(next() * (index + 1));
        [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
      }
      return clone;
    },
  };
}

export function createSessionSeed(prefix = "sdk") {
  const chunks = new Uint32Array(2);

  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(chunks);
  } else {
    chunks[0] = Date.now() >>> 0;
    chunks[1] = Math.floor(Math.random() * 0xffffffff) >>> 0;
  }

  return `${prefix}-${chunks[0].toString(36)}-${chunks[1].toString(36)}`;
}
