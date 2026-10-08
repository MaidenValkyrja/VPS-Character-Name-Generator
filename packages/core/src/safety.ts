import { normalize } from './text';

export interface SafetyLists {
  /** Unambiguous extremist phrases (normalised), matched on word boundaries in engine output. */
  readonly phrases: readonly string[];
  /** Profanity and slur fragments, matched inside invented words only (no false positives on real words). */
  readonly coinedSubstrings: readonly string[];
}

const CODE_PATTERNS: readonly RegExp[] = [/\b1488\b/, /\b14\s*[\/\\–-]\s*88\b/, /\b88\s*[\/\\–-]\s*14\b/];

/** Checks engine-generated material. Ordinary numbers are allowed; only explicit codes and phrases are blocked. */
export function unsafeGenerated(
  title: string,
  inventedWords: readonly string[],
  lists: SafetyLists,
): 'code' | 'code-pair' | 'phrase' | 'invented' | undefined {
  for (const re of CODE_PATTERNS) if (re.test(title)) return 'code';
  const numbers: string[] = title.match(/\b\d+\b/g) ?? [];
  if (numbers.includes('14') && numbers.includes('88')) return 'code-pair';
  const spaced = ` ${normalize(title).replace(/-/g, ' ')} `;
  for (const phrase of lists.phrases) if (spaced.includes(` ${phrase} `)) return 'phrase';
  for (const word of inventedWords) {
    const letters = normalize(word).replace(/[^a-z]/g, '');
    for (const fragment of lists.coinedSubstrings) if (letters.includes(fragment)) return 'invented';
  }
  return undefined;
}
