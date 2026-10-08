import { SLOT_TYPES, type SlotType } from './ids';
import type { PatternToken } from './types';

/** A brace group (inner text may be empty) or a run of text with no braces. Stray braces match neither. */
const TOKEN_RE = /\{([^{}]*)\}|([^{}]+)/g;
/** Slot text: one or more slot names joined by "|", then an optional "?" (optional) and "!" (head). */
const SLOT_RE = /^([a-zA-Z]+(?:\|[a-zA-Z]+)*)(\?)?(!)?$/;

export function parsePattern(src: string): PatternToken[] {
  const out: PatternToken[] = [];
  let index = 0;
  let covered = 0;
  for (const m of src.matchAll(TOKEN_RE)) {
    covered += m[0].length;
    if (m[2] !== undefined) {
      out.push({ kind: 'literal', text: m[2] });
      continue;
    }
    const slot = SLOT_RE.exec(m[1]);
    if (!slot) throw new Error(`Malformed slot "{${m[1]}}" in "${src}"`);
    const types = slot[1].split('|');
    for (const t of types) if (!(SLOT_TYPES as readonly string[]).includes(t)) throw new Error(`Unknown slot type "${t}" in "${src}"`);
    out.push({ kind: 'slot', types: types as SlotType[], optional: slot[2] === '?', lock: slot[3] === '!', index: index++ });
  }
  if (covered !== src.length) throw new Error(`Malformed pattern "${src}": unmatched brace`);
  return out;
}
