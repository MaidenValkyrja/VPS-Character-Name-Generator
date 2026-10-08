import { contentWords, normalize, type Rng } from '@vps-name-tools/core';
import type { Context } from './context';
import { lengthClassOf } from './constraints';
import { flattenParts } from './render';
import type { Recipe } from './types';

/** Tunable in Task 25 against the quality metrics. */
export const SCORE = { fit: 1.0, user: 0.6, readability: 0.5, lengthBias: 0.4, alliteration: 0.25, cliche: 0.6, noise: 0.15 } as const;

export function scoreCandidate(ctx: Context, title: string, recipe: Recipe, rng: Rng): number {
  const logMax = Math.log1p(ctx.maxBoost);
  const relevance = (id: string) => {
    const e = ctx.entryById.get(id);
    return e ? Math.log1p(ctx.entryRelevance(e)) / logMax : 0.5;
  };
  let fit = 0;
  let n = 0;
  let cliche = 0;
  let userHit = false;
  for (const p of flattenParts(recipe.parts)) {
    switch (p.kind) {
      case 'lex': {
        fit += relevance(p.entryId);
        n++;
        const e = ctx.entryById.get(p.entryId);
        if (e?.concepts.some(c => ctx.userConcepts.has(c))) userHit = true;
        if (e && !ctx.liftedCliches.has(normalize(e.text))) cliche += e.cliche ?? 0;
        break;
      }
      case 'compound': fit += (relevance(p.headId) + relevance(p.tailId)) / 2; n++; break;
      case 'user': fit += 1; n++; userHit = true; break;
      case 'include': fit += 1; n++; break;
      case 'coined': fit += 0.5; n++; break;
      case 'vocab': fit += 0.4; n++; cliche += p.cliche; break;
      default: break;
    }
  }
  const chars = title.length;
  const longWords = title.split(/\s+/).filter(w => w.replace(/[^A-Za-z]/g, '').length > 12).length;
  const readability = 1 - Math.min(1, Math.max(0, (chars - 22) / 30)) - 0.3 * longWords;
  const lengthBias = ctx.settings.length === 'any' ? ctx.genre.lengthBias[lengthClassOf(title)] : 0.5;
  const words = contentWords(title);
  const alliterates = words.length >= 2 && words[0][0] === words[1][0];
  return (
    SCORE.fit * (n ? fit / n : 0) +
    (userHit ? SCORE.user : 0) +
    SCORE.readability * readability +
    SCORE.lengthBias * lengthBias +
    (alliterates ? SCORE.alliteration * ctx.alliterationBonus : 0) -
    SCORE.cliche * cliche +
    SCORE.noise * ctx.params.temperature * rng()
  );
}
