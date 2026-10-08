import { normalize, sanitizeInput } from './text';
import { lemmaCandidates } from './lemma';

export type AvoidKind = 'word' | 'phrase' | 'prefix' | 'suffix' | 'contains';

export interface AvoidRule {
  readonly kind: AvoidKind;
  readonly value: string;
}

export const MAX_AVOID_RULES = 50;

/** Normalised words, split on spaces and hyphens, with a trailing possessive removed from each. */
function canonicalWords(text: string): string[] {
  return normalize(text)
    .split(/[\s-]+/)
    .map(w => w.replace(/'s$|'$/, ''))
    .filter(Boolean);
}

export function parseAvoid(text: string): AvoidRule[] {
  const rules: AvoidRule[] = [];
  // Newlines become commas before sanitising, which would otherwise turn them into spaces.
  for (const raw of sanitizeInput(text.replace(/[\r\n]+/g, ','), 500).split(/[,;]+/)) {
    const item = raw.trim();
    if (!item) continue;
    const quoted = item.length > 2 && /^["'].*["']$/.test(item);
    const core = quoted ? item.slice(1, -1) : item;
    const starts = /^[*-]/.test(core);
    const ends = /[*-]$/.test(core);
    const value = canonicalWords(core.replace(/^[*-]+|[*-]+$/g, '')).join(' ');
    if (!value) continue;
    let kind: AvoidKind;
    if (quoted || value.includes(' ')) kind = 'phrase';
    else if (starts && ends) kind = 'contains';
    else if (ends) kind = 'prefix';
    else if (starts) kind = 'suffix';
    else kind = 'word';
    rules.push({ kind, value });
    if (rules.length >= MAX_AVOID_RULES) break;
  }
  return rules;
}

export function violatesAvoid(title: string, morphemes: readonly string[], rules: readonly AvoidRule[]): AvoidRule | undefined {
  if (rules.length === 0) return undefined;
  const words = canonicalWords(title);
  const tokens = new Set<string>(words);
  for (const m of morphemes) for (const w of canonicalWords(m)) tokens.add(w);
  const spaced = ` ${words.join(' ')} `;
  for (const rule of rules) {
    switch (rule.kind) {
      case 'phrase':
        if (spaced.includes(` ${rule.value} `)) return rule;
        break;
      case 'word':
        for (const t of tokens) {
          if (t === rule.value || lemmaCandidates(t).includes(rule.value)) return rule;
        }
        break;
      case 'prefix':
        for (const t of tokens) if (t.startsWith(rule.value)) return rule;
        break;
      case 'suffix':
        for (const t of tokens) if (t.endsWith(rule.value)) return rule;
        break;
      case 'contains':
        for (const t of tokens) if (t.includes(rule.value)) return rule;
        break;
    }
  }
  return undefined;
}

/** One piece of text with its words prepared once, so many rule sets can be tested against it cheaply. */
export interface AvoidText {
  /** Canonical words: normalised, split on spaces and hyphens, possessives removed. */
  readonly tokens: readonly string[];
  /** Every token plus its plausible base forms. */
  readonly lemmas: readonly string[];
  /** " word word " for whole-phrase tests. */
  readonly spaced: string;
}

export function prepareAvoidText(text: string): AvoidText {
  const tokens = canonicalWords(text);
  const lemmas = new Set<string>();
  for (const t of tokens) for (const l of lemmaCandidates(t)) lemmas.add(l);
  return { tokens, lemmas: [...lemmas], spaced: ` ${tokens.join(' ')} ` };
}

/**
 * Compiles rules into one matcher over prepared text. For any text it agrees with
 * `violatesAvoid(text, [text], rules)`; it returns undefined when there are no rules.
 */
export function compileAvoid(rules: readonly AvoidRule[]): ((text: AvoidText) => boolean) | undefined {
  if (rules.length === 0) return undefined;
  const words = new Set<string>();
  const phrases: string[] = [];
  const prefixes: string[] = [];
  const suffixes: string[] = [];
  const parts: string[] = [];
  for (const rule of rules) {
    switch (rule.kind) {
      case 'word': words.add(rule.value); break;
      case 'phrase': phrases.push(` ${rule.value} `); break;
      case 'prefix': prefixes.push(rule.value); break;
      case 'suffix': suffixes.push(rule.value); break;
      case 'contains': parts.push(rule.value); break;
    }
  }
  const perToken = prefixes.length + suffixes.length + parts.length > 0;
  return text => {
    if (words.size > 0) for (const l of text.lemmas) if (words.has(l)) return true;
    for (const p of phrases) if (text.spaced.includes(p)) return true;
    if (perToken) {
      for (const t of text.tokens) {
        for (const p of prefixes) if (t.startsWith(p)) return true;
        for (const p of suffixes) if (t.endsWith(p)) return true;
        for (const p of parts) if (t.includes(p)) return true;
      }
    }
    return false;
  };
}
