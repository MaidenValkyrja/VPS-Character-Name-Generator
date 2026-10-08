import type { Rng } from './rng';
import { pickWeighted } from './weighted';
import { capitalizeFirst } from './text';

type W<T> = readonly (readonly [T, number])[];

export interface PhoneticProfile {
  readonly id: string;
  readonly label: string;
  readonly onsets: W<string>;
  readonly nuclei: W<string>;
  readonly codas: W<string>;
  readonly shapes: W<'CV' | 'CVC' | 'V' | 'VC'>;
  readonly syllables: W<number>;
  readonly endings?: W<string>;
  readonly endingChance?: number;
  /** Regex sources tested against the lowercase word. */
  readonly forbid: readonly string[];
  /** [regex source, replacement] applied to the lowercase word. */
  readonly rewrite?: readonly (readonly [string, string])[];
  readonly letters: readonly [number, number];
  readonly vowelRatio?: readonly [number, number];
  readonly maxConsonantRun?: number;
  readonly allowedClusters?: readonly string[];
}

export interface CoinedWord {
  readonly text: string;
  readonly syllables: readonly string[];
  readonly ending?: string;
  readonly profile: string;
}

const pick = <T>(rng: Rng, list: W<T>): T | undefined => pickWeighted(rng, list.map(([item, weight]) => ({ item, weight })));

export function generateSyllable(rng: Rng, profile: PhoneticProfile): string {
  const shape = pick(rng, profile.shapes) ?? 'CV';
  const onset = shape.startsWith('C') ? pick(rng, profile.onsets) ?? '' : '';
  const nucleus = pick(rng, profile.nuclei) ?? 'a';
  const coda = shape.endsWith('C') ? pick(rng, profile.codas) ?? '' : '';
  return onset + nucleus + coda;
}

function join(stem: string, ending: string): string {
  const vowel = /[aeiouy]/;
  const last = stem.slice(-1);
  const first = ending.charAt(0);
  if (vowel.test(last) && vowel.test(first)) return stem.slice(0, -1) + ending;
  if (last === first) return stem + ending.slice(1);
  return stem + ending;
}

function finish(profile: PhoneticProfile, raw: string): string {
  let w = raw.toLowerCase();
  for (const [from, to] of profile.rewrite ?? []) w = w.replace(new RegExp(from, 'g'), to);
  return capitalizeFirst(w);
}

export function readable(word: string, profile: PhoneticProfile, letters: readonly [number, number] = profile.letters): boolean {
  const w = word.toLowerCase();
  const plain = w.replace(/[^a-z]/g, '');
  if (plain.length < letters[0] || plain.length > letters[1]) return false;
  if (/(.)\1\1/.test(plain)) return false;
  const vowels = (plain.match(/[aeiouy]/g) ?? []).length;
  const [minRatio, maxRatio] = profile.vowelRatio ?? [0.28, 0.62];
  const ratio = vowels / plain.length;
  if (ratio < minRatio || ratio > maxRatio) return false;
  const maxRun = profile.maxConsonantRun ?? 3;
  for (const run of plain.match(/[^aeiouy]+/g) ?? []) {
    if (run.length > maxRun && !(profile.allowedClusters ?? []).includes(run)) return false;
  }
  for (const source of profile.forbid) if (new RegExp(source).test(w)) return false;
  if ((w.match(/'/g) ?? []).length > 1) return false;
  return true;
}

export function coinWord(
  rng: Rng,
  profile: PhoneticProfile,
  opts: { minLetters?: number; maxLetters?: number; attempts?: number; reject?: (word: string) => boolean } = {},
): CoinedWord | undefined {
  const letters: readonly [number, number] = [opts.minLetters ?? profile.letters[0], opts.maxLetters ?? profile.letters[1]];
  const attempts = opts.attempts ?? 40;
  for (let i = 0; i < attempts; i++) {
    const count = pick(rng, profile.syllables) ?? 2;
    const syllables = Array.from({ length: count }, () => generateSyllable(rng, profile));
    let stem = syllables.join('');
    let ending: string | undefined;
    if (profile.endings?.length && rng() < (profile.endingChance ?? 0)) {
      ending = pick(rng, profile.endings);
      if (ending) stem = join(stem, ending);
    }
    const text = finish(profile, stem);
    if (!readable(text, profile, letters)) continue;
    if (opts.reject?.(text)) continue;
    return { text, syllables, ending, profile: profile.id };
  }
  return undefined;
}

export function mutateWord(
  rng: Rng,
  profile: PhoneticProfile,
  source: CoinedWord,
  opts: { reject?: (word: string) => boolean } = {},
): CoinedWord | undefined {
  for (let i = 0; i < 30; i++) {
    const syllables = [...source.syllables];
    let ending = source.ending;
    if (ending && rng() < 0.3) {
      ending = profile.endings?.length ? pick(rng, profile.endings) : undefined;
    } else {
      const at = Math.floor(rng() * syllables.length);
      syllables[at] = generateSyllable(rng, profile);
    }
    if (!syllables.some(s => source.syllables.includes(s))) continue;
    let stem = syllables.join('');
    if (ending) stem = join(stem, ending);
    const text = finish(profile, stem);
    if (text === source.text || !readable(text, profile) || opts.reject?.(text)) continue;
    return { text, syllables, ending, profile: profile.id };
  }
  return undefined;
}
