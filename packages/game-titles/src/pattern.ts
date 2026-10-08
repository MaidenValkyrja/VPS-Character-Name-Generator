import { SLOT_TYPES, type SlotType } from './ids';
import type { PatternToken } from './types';

export function parsePattern(src: string): PatternToken[] {
  const out: PatternToken[] = [];
  const re = /\{([a-zA-Z|]+)(\?)?(!)?\}|([^{]+)/g;
  let index = 0;
  for (const m of src.matchAll(re)) {
    if (m[4] !== undefined) {
      out.push({ kind: 'literal', text: m[4] });
      continue;
    }
    const types = m[1].split('|');
    for (const t of types) if (!(SLOT_TYPES as readonly string[]).includes(t)) throw new Error(`Unknown slot type "${t}" in "${src}"`);
    out.push({ kind: 'slot', types: types as SlotType[], optional: m[2] === '?', lock: m[3] === '!', index: index++ });
  }
  return out;
}
