import { normalize, type SteeringIndex } from '@vps-name-tools/core';
import type { DataBundle, LexEntry } from './types';

export function buildSteeringIndex(bundle: DataBundle, extra: readonly LexEntry[] = []): SteeringIndex {
  const aliases = new Map<string, readonly string[]>();
  for (const [k, v] of Object.entries(bundle.aliases)) aliases.set(normalize(k), v);
  const all = [...bundle.lexicon, ...bundle.myths.flatMap(m => [...m.imagery, ...m.symbolic]), ...extra];
  const byId = new Map(all.map(e => [e.id, e] as const));
  const lexicon = new Map<string, string[]>();
  const add = (text: string, id: string) => {
    const key = normalize(text);
    if (!key) return;
    const ids = lexicon.get(key) ?? [];
    if (!ids.includes(id)) ids.push(id);
    lexicon.set(key, ids);
  };
  for (const e of all) {
    add(e.text, e.id);
    for (const form of Object.values(e.forms ?? {})) if (form) add(form, e.id);
  }
  return {
    aliases,
    lexicon,
    concepts: new Set(bundle.concepts.map(c => c.id)),
    conceptsOfEntry: id => byId.get(id)?.concepts ?? [],
    posOfEntry: id => byId.get(id)?.pos ?? [],
  };
}
