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
  const picked: C[] = [];
  const pickedKeys = new Set<string>();
  const familyCount = new Map<string, number>();
  const capCount = new Map<string, number>();

  const passes = [
    { families: true, caps: true },
    { families: false, caps: true },
    { families: false, caps: false },
  ];
  for (const pass of passes) {
    while (picked.length < opts.count) {
      let best: C | undefined;
      let bestValue = -Infinity;
      for (const c of pool) {
        if (pickedKeys.has(c.key)) continue;
        if (pass.families && (familyCount.get(c.family) ?? 0) >= opts.familyCap(c.family)) continue;
        if (pass.caps && c.capKeys.some(k => (capCount.get(k) ?? 0) >= opts.capLimit(k))) continue;
        let overlap = 0;
        for (const p of picked) overlap = Math.max(overlap, jaccard(c.features, p.features));
        const value = c.score - opts.diversity * overlap;
        if (value > bestValue) {
          bestValue = value;
          best = c;
        }
      }
      if (!best) break;
      picked.push(best);
      pickedKeys.add(best.key);
      familyCount.set(best.family, (familyCount.get(best.family) ?? 0) + 1);
      for (const k of best.capKeys) capCount.set(k, (capCount.get(k) ?? 0) + 1);
    }
    if (picked.length >= opts.count) break;
  }
  return picked;
}
