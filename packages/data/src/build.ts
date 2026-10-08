import type { ConceptId } from '@vps-name-tools/core';
import type { Pos } from './ids';
import type { Concept, LexEntry, SymbolicEntry } from './types';

type EntryOptions = Omit<Partial<LexEntry>, 'id' | 'text' | 'concepts' | 'pos'> & { readonly also?: readonly Pos[] };

function make(pos: Pos, id: string, text: string, concepts: readonly ConceptId[], o: EntryOptions = {}): LexEntry {
  const { also = [], ...rest } = o;
  return { register: 'plain', ...rest, id, text, concepts, pos: [pos, ...also] };
}

export const noun = (id: string, text: string, concepts: readonly ConceptId[], o?: EntryOptions) => make('noun', id, text, concepts, o);
export const adj = (id: string, text: string, concepts: readonly ConceptId[], o?: EntryOptions) => make('adj', id, text, concepts, o);
export const verb = (id: string, text: string, concepts: readonly ConceptId[], o?: EntryOptions) => make('verb', id, text, concepts, o);
export const abstract = (id: string, text: string, concepts: readonly ConceptId[], o?: EntryOptions) => make('abstract', id, text, concepts, o);
export const place = (id: string, text: string, concepts: readonly ConceptId[], o?: EntryOptions) => make('place', id, text, concepts, o);
export const morpheme = (id: string, text: string, concepts: readonly ConceptId[], o?: EntryOptions) => make('morpheme', id, text, concepts, o);
export const symbolic = (base: LexEntry, sourceNote: string): SymbolicEntry => ({ ...base, sourceNote });
export const concept = (id: ConceptId, related: readonly ConceptId[] = [], label = id.replace(/-/g, ' ')): Concept => ({ id, label, related });
