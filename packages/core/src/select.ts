export interface Candidate {
  readonly key: string;
  readonly score: number;
  readonly family: string;
  readonly features: ReadonlySet<string>;
  readonly capKeys: readonly string[];
}

export interface SelectOptions {
  readonly count: number;
  readonly familyCap: (family: string) => number;
  readonly capLimit: (capKey: string) => number;
  readonly diversity: number;
}

export function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let shared = 0;
  for (const x of a) if (b.has(x)) shared++;
  return shared / (a.size + b.size - shared);
}

export function selectDiverse<C extends Candidate>(candidates: readonly C[], opts: SelectOptions): C[] {
  const byKey = new Map<string, C>();
  for (const c of candidates) {
    const prev = byKey.get(c.key);
    if (!prev || c.score > prev.score) byKey.set(c.key, c);
  }
  const pool = [...byKey.values()].sort((a, b) => b.score - a.score);
  // maxOverlap[i] is the highest Jaccard overlap between pool[i] and any pick so far.
  // It only changes when a pick is made, so it is updated against the newest pick alone.
  const maxOverlap = new Array<number>(pool.length).fill(0);
  const used = new Array<boolean>(pool.length).fill(false);
  const picked: C[] = [];
  const familyCount = new Map<string, number>();
  const capCount = new Map<string, number>();

  const passes = [
    { families: true, caps: true },
    { families: false, caps: true },
    { families: false, caps: false },
  ];
  for (const pass of passes) {
    while (picked.length < opts.count) {
      let best = -1;
      let bestValue = -Infinity;
      for (let i = 0; i < pool.length; i++) {
        if (used[i]) continue;
        const c = pool[i];
        if (pass.families && (familyCount.get(c.family) ?? 0) >= opts.familyCap(c.family)) continue;
        if (pass.caps && c.capKeys.some(k => (capCount.get(k) ?? 0) >= opts.capLimit(k))) continue;
        const value = c.score - opts.diversity * maxOverlap[i];
        if (value > bestValue) {
          bestValue = value;
          best = i;
        }
      }
      if (best < 0) break;
      const chosen = pool[best];
      used[best] = true;
      picked.push(chosen);
      familyCount.set(chosen.family, (familyCount.get(chosen.family) ?? 0) + 1);
      for (const k of chosen.capKeys) capCount.set(k, (capCount.get(k) ?? 0) + 1);
      for (let i = 0; i < pool.length; i++) {
        if (!used[i]) maxOverlap[i] = Math.max(maxOverlap[i], jaccard(pool[i].features, chosen.features));
      }
    }
    if (picked.length >= opts.count) break;
  }
  return picked;
}
