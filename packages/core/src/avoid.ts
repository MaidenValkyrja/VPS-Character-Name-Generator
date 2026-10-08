import { normalize, sanitizeInput } from './text';
import { lemmaCandidates } from './lemma';

export type AvoidKind = 'word' | 'phrase' | 'prefix' | 'suffix' | 'contains';

export interface AvoidRule {
  readonly kind: AvoidKind;
  readonly value: string;
}

export const MAX_AVOID_RULES = 50;

export function parseAvoid(text: string): AvoidRule[] {
  const rules: AvoidRule[] = [];
  for (const raw of sanitizeInput(text, 500).split(/[,;\n]+/)) {
    const item = raw.trim();
    if (!item) continue;
    const quoted = item.length > 2 && /^["'].*["']$/.test(item);
    const core = quoted ? item.slice(1, -1) : item;
    const starts = /^[*-]/.test(core);
    const ends = /[*-]$/.test(core);
    const value = normalize(core.replace(/^[*-]+|[*-]+$/g, ''));
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
  const norm = normalize(title);
  const tokens = new Set<string>();
  for (const t of norm.split(/[\s-]+/)) if (t) tokens.add(t);
  for (const m of morphemes) {
    const n = normalize(m);
    if (n) tokens.add(n);
  }
  const spaced = ` ${norm.replace(/-/g, ' ')} `;
  for (const rule of rules) {
    switch (rule.kind) {
      case 'phrase':
        if (spaced.includes(` ${rule.value} `)) return rule;
        break;
      case 'word':
        for (const t of tokens) {
          const bare = t.replace(/'s$/, '');
          if (bare === rule.value || lemmaCandidates(bare).includes(rule.value)) return rule;
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
