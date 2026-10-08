import type { Rng } from './rng';

export interface Weighted<T> {
  readonly item: T;
  readonly weight: number;
}

export function pickWeighted<T>(rng: Rng, items: readonly Weighted<T>[]): T | undefined {
  let total = 0;
  for (const w of items) if (w.weight > 0) total += w.weight;
  if (total <= 0) return undefined;
  let r = rng() * total;
  for (const w of items) {
    if (w.weight <= 0) continue;
    r -= w.weight;
    if (r < 0) return w.item;
  }
  for (let i = items.length - 1; i >= 0; i--) if (items[i].weight > 0) return items[i].item;
  return undefined;
}

/** Raise weights to 1/temperature: < 1 sharpens favourites, > 1 flattens. */
export function temper<T>(items: readonly Weighted<T>[], temperature: number): Weighted<T>[] {
  const p = 1 / temperature;
  return items.map(w => ({ item: w.item, weight: w.weight > 0 ? Math.pow(w.weight, p) : 0 }));
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function chance(rng: Rng, p: number): boolean {
  if (p <= 0) return false;
  if (p >= 1) return true;
  return rng() < p;
}
