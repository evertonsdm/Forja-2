/**
 * Seeds a 128-bit hash from a string to initialize PRNGs.
 */
export function cyrb128(str: string): number[] {
  let h1 = 1779033703, h2 = 3024733165, h3 = 3362453659, h4 = 5024943;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

/**
 * Deterministic pseudorandom number generator (Mulberry32).
 * Returns a function that outputs numbers in the interval [0, 1).
 */
export function mulberry32(a: number): () => number {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Chooses an option based on weights and PRNG function.
 */
export function chooseWeighted<T>(options: T[], weights: number[], rand: () => number): T {
  if (options.length === 0) {
    throw new Error("Cannot select from an empty list");
  }
  const sum = weights.reduce((acc, val) => acc + val, 0);
  if (sum <= 0) {
    // If sum of weights is 0 or negative, fallback to uniform random choice
    return options[Math.floor(rand() * options.length)];
  }
  let r = rand() * sum;
  for (let i = 0; i < options.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      return options[i];
    }
  }
  return options[options.length - 1];
}

/**
 * Returns a pseudorandom integer in range [min, max] inclusive.
 */
export function randRange(min: number, max: number, rand: () => number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

/**
 * Generates a random alphanumeric seed of 5-8 digits.
 */
export function generateRandomSeed(): string {
  return String(Math.floor(Math.random() * 90000) + 10000);
}
