import { capitalizeFirst, titleCase } from '@vps-name-tools/core';
import type { RecipePart } from './types';

export function renderRaw(parts: readonly RecipePart[]): string {
  return parts.map(p => p.text).join('').replace(/\s+/g, ' ').replace(/\s+([,:])/g, '$1').trim();
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

/** Words and word parts for Avoid matching (compounds contribute both halves). */
export function morphemesOf(parts: readonly RecipePart[]): string[] {
  return flattenParts(parts).flatMap(p => (p.kind === 'literal' ? [] : p.kind === 'compound' ? [...p.morphemes] : [p.text]));
}

/** Words the engine built itself (invented words and compounds), for substring safety checks. */
export function engineWords(parts: readonly RecipePart[]): string[] {
  return flattenParts(parts).flatMap(p => (p.kind === 'coined' || p.kind === 'compound' ? [p.text] : []));
}
