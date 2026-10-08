import { asciiFold, capitalizeFirst, titleCase } from '@vps-name-tools/core';
import type { RecipePart } from './types';

/** User and Include text may carry diacritics; output text is ASCII, so it is folded before casing. */
const textOf = (p: RecipePart): string => (p.kind === 'user' || p.kind === 'include' ? asciiFold(p.text) : p.text);

export function renderRaw(parts: readonly RecipePart[]): string {
  return parts.map(textOf).join('').replace(/\s+/g, ' ').replace(/\s+([,:])/g, '$1').trim();
}

export function renderTitle(parts: readonly RecipePart[]): string {
  return titleCase(renderRaw(parts));
}

/** Joins two morphemes; hyphenates when letters would triple or the seam is hard to read. */
export function joinCompound(head: string, tail: string): string {
  const h = head.replace(/\s+/g, '');
  const t = tail.toLowerCase().replace(/\s+/g, '');
  if (!t) return h;
  const end = h.slice(-2).toLowerCase();
  const tripled = end === t[0] + t[0] || (end[1] === t[0] && t[1] === t[0]);
  const hardSeam = /[^aeiouy]{5,}/.test(h.slice(-3).toLowerCase() + t.slice(0, 3));
  return tripled || hardSeam ? `${h}-${capitalizeFirst(t)}` : h + t;
}

export function flattenParts(parts: readonly RecipePart[]): RecipePart[] {
  return parts.flatMap(p => (p.kind === 'group' ? flattenParts(p.parts) : [p]));
}

/**
 * Words and word parts for Avoid matching. Compounds contribute both halves; a coined place contributes its place
 * ending ("hold" in "Brenhold"), which is a real word. An invented word's phonetic ending is not a word and stays out.
 */
export function morphemesOf(parts: readonly RecipePart[]): string[] {
  return flattenParts(parts).flatMap(p => {
    switch (p.kind) {
      case 'literal': return [];
      case 'compound': return [...p.morphemes];
      case 'coined': return p.slot === 'place' && p.ending ? [p.text, p.ending] : [p.text];
      default: return [p.text];
    }
  });
}

/** Words the engine built itself (invented words and compounds), for substring safety checks. */
export function engineWords(parts: readonly RecipePart[]): string[] {
  return flattenParts(parts).flatMap(p => (p.kind === 'coined' || p.kind === 'compound' ? [p.text] : []));
}
