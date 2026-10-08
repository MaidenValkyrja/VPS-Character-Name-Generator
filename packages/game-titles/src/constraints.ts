import { contentWords, lemmaCandidates, normalize, unsafeGenerated, violatesAvoid, wordCount } from '@vps-name-tools/core';
import { foldTerm } from '@vps-name-tools/data';
import type { Context } from './context';
import { isBlockedEngineWord, matcherFor } from './fill';
import type { LengthOption } from './ids';
import { engineWords, flattenParts, morphemesOf } from './render';
import type { Recipe } from './types';

export type LengthClass = 'one' | 'short' | 'medium' | 'long';
export const MAX_TITLE_CHARS = 48;

export function lengthClassOf(title: string): LengthClass {
  const words = wordCount(title);
  const chars = title.length;
  const colon = title.includes(':');
  if (words === 1) return 'one';
  if (!colon && words <= 2 && chars <= 16) return 'short';
  if (colon || words >= 5 || chars > 28) return 'long';
  return 'medium';
}

export function lengthMatches(title: string, length: LengthOption): boolean {
  const words = wordCount(title);
  const chars = title.length;
  const colon = title.includes(':');
  switch (length) {
    case 'any': return chars <= MAX_TITLE_CHARS;
    case 'one': return words === 1 && chars <= 16;
    case 'short': return words <= 2 && chars <= 16 && !colon;
    case 'medium': return words >= 2 && words <= 4 && chars <= 28 && !colon;
    case 'long': return (colon || words >= 4) && chars <= MAX_TITLE_CHARS;
  }
}

export function hasRepeatedRoot(title: string): boolean {
  const words = contentWords(title).map(w => w.replace(/'s$/, ''));
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const a = words[i];
      const b = words[j];
      if (a === b) return true;
      if (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
      const la = lemmaCandidates(a);
      if (lemmaCandidates(b).some(x => x.length >= 3 && la.includes(x))) return true;
    }
  }
  return false;
}

/**
 * The Include word counts only when the recipe holds an Include part and the rendered form (an inflected
 * "Wolves" for "Wolf") appears in the title as a whole word or phrase. "Ash" is not satisfied by "Ashen".
 * Hyphens and apostrophes fold to spaces on both sides, so "Aeternum's Oath" still contains "Aeternum".
 */
function includeSatisfied(recipe: Recipe, title: string): boolean {
  const part = flattenParts(recipe.parts).find(p => p.kind === 'include');
  if (!part) return false;
  const needle = foldTerm(part.text);
  return needle !== '' && ` ${foldTerm(title)} `.includes(` ${needle} `);
}

/** Returns a rejection reason, or undefined when the candidate is acceptable. */
export function checkCandidate(ctx: Context, title: string, recipe: Recipe): string | undefined {
  if (!title) return 'empty';
  if (title.length > MAX_TITLE_CHARS) return 'too-long';
  if (!lengthMatches(title, ctx.settings.length)) return 'length';
  if (ctx.style?.maxWords !== undefined && wordCount(title) > ctx.style.maxWords) return 'style-words';
  if (ctx.style?.maxChars !== undefined && title.length > ctx.style.maxChars) return 'style-chars';
  const key = normalize(title);
  if (ctx.include && !includeSatisfied(recipe, title)) return 'include';
  if (violatesAvoid(title, morphemesOf(recipe.parts), ctx.avoid)) return 'avoid';
  const built = engineWords(recipe.parts);
  if (unsafeGenerated(title, built, ctx.data.safety)) return 'safety';
  if (ctx.game.knownTitles.has(key) || ctx.game.knownTitles.has(normalize(title.split(':')[0]))) return 'known-title';
  const engineText = normalize(
    flattenParts(recipe.parts).filter(p => p.kind !== 'user' && p.kind !== 'include').map(p => p.text).join(' '),
  );
  if (matcherFor(ctx.game.franchiseTerms)(engineText) !== undefined) return 'franchise';
  for (const { pack } of ctx.mythChain) if (matcherFor(pack.denylist)(engineText) !== undefined) return 'denylist';
  for (const { preset } of ctx.genreChain) {
    if (preset.guard?.blockPhrases && matcherFor(preset.guard.blockPhrases)(engineText) !== undefined) return 'genre-guard';
    for (const s of preset.guard?.blockSuffixes ?? []) if (built.some(w => normalize(w).endsWith(s))) return 'genre-guard';
  }
  for (const p of flattenParts(recipe.parts)) if (p.kind === 'coined' && isBlockedEngineWord(ctx, p.text, true)) return 'denylist';
  if (hasRepeatedRoot(title)) return 'repeat';
  return undefined;
}
