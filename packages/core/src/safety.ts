import { normalize } from './text';

export interface SafetyLists {
  /** Unambiguous extremist phrases (normalised), matched on word boundaries in engine output. */
  readonly phrases: readonly string[];
  /** Profanity and slur fragments, matched inside invented words only (no false positives on real words). */
  readonly coinedSubstrings: readonly string[];
}

const CODE_PATTERNS: readonly RegExp[] = [/\b1488\b/, /\b14\s*[\/\\–-]\s*88\b/, /\b88\s*[\/\\–-]\s*14\b/];

/** Verdicts for invented words, per list object. Words repeat within a build; the lists never change once loaded. */
const MEMO_LIMIT = 4000;
const inventedVerdicts = new WeakMap<SafetyLists, Map<string, boolean>>();

function hasCoinedFragment(word: string, lists: SafetyLists): boolean {
  let memo = inventedVerdicts.get(lists);
  if (!memo) {
    memo = new Map();
    inventedVerdicts.set(lists, memo);
  }
  const known = memo.get(word);
  if (known !== undefined) return known;
  const letters = normalize(word).replace(/[^a-z]/g, '');
  let bad = false;
  for (const fragment of lists.coinedSubstrings) {
    if (letters.includes(fragment)) {
      bad = true;
      break;
    }
  }
  if (memo.size >= MEMO_LIMIT) memo.clear();
  memo.set(word, bad);
  return bad;
}

/** Checks engine-generated material. Ordinary numbers are allowed; only explicit codes and phrases are blocked. */
export function unsafeGenerated(
  title: string,
  inventedWords: readonly string[],
  lists: SafetyLists,
): 'code' | 'code-pair' | 'phrase' | 'invented' | undefined {
  // Every code pattern needs a digit, so a title without one skips them.
  if (/\d/.test(title)) {
    for (const re of CODE_PATTERNS) if (re.test(title)) return 'code';
    const numbers: string[] = title.match(/\b\d+\b/g) ?? [];
    if (numbers.includes('14') && numbers.includes('88')) return 'code-pair';
  }
  const spaced = ` ${normalize(title).replace(/-/g, ' ')} `;
  for (const phrase of lists.phrases) if (spaced.includes(` ${phrase} `)) return 'phrase';
  for (const word of inventedWords) if (hasCoinedFragment(word, lists)) return 'invented';
  return undefined;
}
