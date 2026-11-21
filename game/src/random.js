// Seeded random numbers for Shadowtide: every decorative detail of a level
// (pebbles, shells, sparkles) comes from one seed, so the same level always
// looks the same and screenshots are reproducible.

/** A small deterministic generator (mulberry32). `seed` is any integer. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] from a generator. */
export function intBetween(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Float in [min, max) from a generator. */
export function floatBetween(rng, min, max) {
  return min + rng() * (max - min);
}

/** Pick one element of an array with a generator. */
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

/** Fisher-Yates shuffle that returns a new array, driven by a generator. */
export function shuffled(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
