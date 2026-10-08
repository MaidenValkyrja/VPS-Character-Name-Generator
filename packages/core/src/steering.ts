import { normalize, sanitizeInput, titleCase } from './text';
import { lemmaCandidates } from './lemma';

export type ConceptId = string;

export interface SteeringIndex {
  /** Normalised phrase → concepts. */
  readonly aliases: ReadonlyMap<string, readonly ConceptId[]>;
  /** Normalised word or form → entry ids. */
  readonly lexicon: ReadonlyMap<string, readonly string[]>;
  readonly concepts: ReadonlySet<ConceptId>;
  conceptsOfEntry(id: string): readonly ConceptId[];
  posOfEntry(id: string): readonly string[];
}

export type PhraseRole = 'noun' | 'adj' | 'gerund' | 'name';

export interface ThemePhrase {
  readonly raw: string;
  readonly display: string;
  readonly norm: string;
  readonly role: PhraseRole;
  readonly concepts: readonly ConceptId[];
  readonly entryIds: readonly string[];
}

export interface ThemeProfile {
  readonly phrases: readonly ThemePhrase[];
  readonly conceptBoosts: ReadonlyMap<ConceptId, number>;
  readonly entryBoosts: ReadonlyMap<string, number>;
}

export const STEER = {
  directConcept: 3.0,
  aliasConcept: 1.8,
  namedEntry: 4.0,
  namedEntryConcept: 1.5,
  maxPhrases: 20,
  maxPhraseChars: 60,
  maxInputChars: 500,
} as const;

const STOP = new Set([
  'the', 'of', 'and', 'a', 'an', 'with', 'my', 'in', 'on', 'to', 'for', 'at', 'by', 'from', 'or', 'is', 'are',
  'some', 'very', 'lots', 'about', 'into', 'like', 'vibe', 'vibes', 'theme', 'themes', 'game',
]);

export function splitPhrases(text: string): string[] {
  return sanitizeInput(text.replace(/[\r\n]+/g, ','), STEER.maxInputChars)
    .split(/[,;\n]+/)
    .map(s => s.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .slice(0, STEER.maxPhrases)
    .map(s => s.slice(0, STEER.maxPhraseChars));
}

export function phraseRole(tokens: readonly string[], entryIds: readonly string[], index: SteeringIndex): PhraseRole {
  if (tokens.length > 1) return 'noun';
  const pos = entryIds.flatMap(id => index.posOfEntry(id));
  if (pos.includes('noun')) return 'noun';
  if (pos.includes('adj')) return 'adj';
  const word = tokens[0] ?? '';
  if (/ing$/.test(word) && word.length > 4) return 'gerund';
  if (/(ed|en)$/.test(word) && word.length > 4) return 'adj';
  return 'name';
}

export function parseThemes(text: string, index: SteeringIndex): ThemeProfile {
  const conceptBoosts = new Map<ConceptId, number>();
  const entryBoosts = new Map<string, number>();
  const bump = (map: Map<string, number>, key: string, value: number) => map.set(key, Math.max(map.get(key) ?? 1, value));
  const phrases: ThemePhrase[] = [];

  for (const raw of splitPhrases(text)) {
    const norm = normalize(raw);
    if (!norm) continue;
    const concepts = new Set<ConceptId>();
    const entryIds = new Set<string>();

    const lookup = (key: string) => {
      const candidates = key.includes(' ') ? [key] : lemmaCandidates(key);
      for (const cand of candidates) {
        for (const c of index.aliases.get(cand) ?? []) {
          concepts.add(c);
          bump(conceptBoosts, c, STEER.aliasConcept);
        }
        if (index.concepts.has(cand)) {
          concepts.add(cand);
          bump(conceptBoosts, cand, STEER.directConcept);
        }
        for (const id of index.lexicon.get(cand) ?? []) {
          entryIds.add(id);
          bump(entryBoosts, id, STEER.namedEntry);
          for (const c of index.conceptsOfEntry(id)) {
            concepts.add(c);
            bump(conceptBoosts, c, STEER.namedEntryConcept);
          }
        }
      }
    };

    lookup(norm);
    const tokens = norm.split(' ').filter(t => t && !STOP.has(t));
    if (tokens.length > 1) {
      for (let i = 0; i < tokens.length - 1; i++) lookup(`${tokens[i]} ${tokens[i + 1]}`);
    }
    for (const t of tokens) lookup(t);

    phrases.push({
      raw,
      display: titleCase(raw),
      norm,
      role: phraseRole(tokens.length ? tokens : [norm], [...entryIds], index),
      concepts: [...concepts],
      entryIds: [...entryIds],
    });
  }
  return { phrases, conceptBoosts, entryBoosts };
}
