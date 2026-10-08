import { createRng, mutateWord, pickWeighted, pluralize, randomSeed, selectDiverse, titleSyllables, wordCount, type Rng } from '@vps-name-tools/core';
import { DATA } from '@vps-name-tools/data';
import { checkCandidate } from './constraints';
import { buildContext, type Choice, type Context } from './context';
import { fillTemplate } from './fill';
import { GAME } from './game';
import { recipeConcepts, selectionOptions, titleKey, toCandidate, toResult, type TitleCandidate } from './generate';
import type { TemplateFamily } from './ids';
import { renderTitle } from './render';
import { scoreCandidate } from './score';
import { normalizeSettings } from './settings';
import type { GenerateResult, Recipe, RecipePart, SimilarOptions, SimilarStrategy, SlotToken, Template, TitleResult } from './types';

export const RELATED_FAMILIES: Partial<Record<TemplateFamily, readonly TemplateFamily[]>> = {
  'adj-noun': ['of-phrase', 'the-noun', 'pair', 'subtitle'],
  pair: ['of-phrase', 'adj-noun', 'the-noun'],
  'of-phrase': ['adj-noun', 'the-noun', 'pair'],
  'the-noun': ['adj-noun', 'of-phrase'],
  compound: ['adj-noun', 'pair', 'kenning'],
  subtitle: ['pair', 'of-phrase', 'adj-noun'],
  frame: ['of-phrase', 'saga', 'suffix'],
  single: ['adj-noun', 'the-noun', 'compound'],
  number: ['adj-noun', 'the-noun'],
  prepositional: ['of-phrase', 'the-noun'],
  sentence: ['prepositional', 'imperative'],
  imperative: ['sentence', 'the-noun'],
  possessive: ['the-name', 'pair'],
  suffix: ['subtitle', 'frame'],
  place: ['pair', 'possessive'],
  'the-name': ['possessive', 'pair'],
  duo: ['pair', 'triad'],
  kenning: ['compound', 'pair'],
  code: ['number', 'single'],
};
const DEFAULT_RELATED: readonly TemplateFamily[] = ['adj-noun', 'of-phrase', 'the-noun'];

type Head = Exclude<RecipePart, { kind: 'literal' }>;

function convertHead(ctx: Context, head: Head, lock: SlotToken): RecipePart | undefined {
  const index = lock.index;
  if (head.kind === 'lex') {
    const e = ctx.entryById.get(head.entryId);
    if (!e) return undefined;
    if (lock.types.includes('noun') && e.pos.includes('noun')) return { kind: 'lex', index, slot: 'noun', entryId: e.id, text: e.text };
    if (lock.types.includes('nounPl') && e.pos.includes('noun')) return { kind: 'lex', index, slot: 'nounPl', entryId: e.id, text: e.forms?.plural ?? pluralize(e.text) };
    if (lock.types.includes('adj') && e.pos.includes('adj')) return { kind: 'lex', index, slot: 'adj', entryId: e.id, text: e.text };
    return undefined;
  }
  if (head.kind === 'include' || head.kind === 'user' || head.kind === 'coined' || head.kind === 'compound') {
    const t = (['name', 'noun', 'place', 'coined'] as const).find(x => lock.types.includes(x));
    return t ? { ...head, index, slot: t } : undefined;
  }
  return undefined;
}

function runStrategy(
  ctx: Context, rng: Rng, strategy: SimilarStrategy, source: Recipe, template: Template | undefined, head: Head | undefined, bias: ReadonlySet<string>,
): Recipe | undefined {
  switch (strategy) {
    case 'modifier': {
      if (!template || !head) return runStrategy(ctx, rng, 'structure', source, template, head, bias);
      return fillTemplate(ctx, rng, template, source.variant, { preset: new Map([[head.index, head]]), bias, anchor: source.anchor });
    }
    case 'head': {
      if (!template || !head || head.kind !== 'lex') return runStrategy(ctx, rng, 'modifier', source, template, head, bias);
      const keep = new Map<number, RecipePart>();
      for (const p of source.parts) if (p.kind !== 'literal' && p.index !== head.index) keep.set(p.index, p);
      const original = ctx.entryById.get(head.entryId);
      const sibling = (c: Choice) => c.entry.id !== head.entryId && (original?.family ? c.entry.family === original.family : c.entry.concepts.some(x => original?.concepts.includes(x)));
      const sharesConcept = (c: Choice) => c.entry.id !== head.entryId && c.entry.concepts.some(x => bias.has(x));
      return fillTemplate(ctx, rng, template, source.variant, { preset: keep, bias, headFilter: sibling, anchor: source.anchor })
        ?? fillTemplate(ctx, rng, template, source.variant, { preset: keep, bias, headFilter: sharesConcept, anchor: source.anchor });
    }
    case 'structure': {
      const families = (template && RELATED_FAMILIES[template.family]) ?? DEFAULT_RELATED;
      const chosen = pickWeighted(rng, ctx.templates.filter(w => families.includes(w.item.family)));
      if (!chosen) return undefined;
      const variant = Math.floor(rng() * chosen.variants.length);
      const lock = chosen.variants[variant].find((x): x is SlotToken => x.kind === 'slot' && x.lock);
      const moved = head && lock ? convertHead(ctx, head, lock) : undefined;
      return fillTemplate(ctx, rng, chosen, variant, { preset: moved && lock ? new Map([[lock.index, moved]]) : undefined, bias, anchor: source.anchor });
    }
    case 'mutate': {
      if (!head || head.kind !== 'coined') return undefined;
      const m = mutateWord(rng, ctx.profile, { text: head.text, syllables: head.syllables, ending: head.ending, profile: head.profile });
      if (!m) return undefined;
      const parts = source.parts.map(p => (p === head ? { ...head, syllables: m.syllables, ending: m.ending, text: m.text } : p));
      return { ...source, parts };
    }
  }
}

function rhythmBonus(origin: { words: number; chars: number; syllables: number }, title: string): number {
  const chars = title.length;
  const outside = chars < origin.chars * 0.8 || chars > origin.chars * 1.2;
  return -0.15 * Math.abs(titleSyllables(title) - origin.syllables) - 0.3 * Math.abs(wordCount(title) - origin.words) - (outside ? 0.4 : 0);
}

export function generateSimilar(source: TitleResult, opts: SimilarOptions = {}): GenerateResult {
  const data = opts.data ?? DATA;
  const game = opts.game ?? GAME;
  const count = opts.count ?? 6;
  const seed = opts.seed ?? randomSeed();
  const rng = createRng(`${seed}:similar`);
  const ctx = buildContext(normalizeSettings(source.settings), data, game, rng);
  if (ctx.blocked) return { titles: [], notices: ctx.notices, seed };

  const template = game.templates.find(t => t.id === source.recipe.templateId);
  const head = source.recipe.parts.find((p): p is Head => p.kind !== 'literal' && p.index === source.recipe.headSlot);
  const bias = new Set(recipeConcepts(ctx, source.recipe));
  const origin = { words: wordCount(source.title), chars: source.title.length, syllables: titleSyllables(source.title) };
  const exclude = new Set([titleKey(source.title), ...(opts.exclude ?? [])]);
  const coinedSource = head?.kind === 'coined';
  const strategies: SimilarStrategy[] = coinedSource ? ['mutate', 'mutate', 'structure'] : ['modifier', 'head', 'structure'];

  const candidates: TitleCandidate[] = [];
  const seen = new Set<string>();
  const target = count * 8;
  for (let i = 0; i < target * 5 && candidates.length < target; i++) {
    const strategy = strategies[i % strategies.length];
    const recipe = runStrategy(ctx, rng, strategy, source.recipe, template, head, bias);
    if (!recipe) continue;
    const title = renderTitle(recipe.parts);
    const key = titleKey(title);
    if (exclude.has(key) || seen.has(key) || checkCandidate(ctx, title, recipe)) continue;
    seen.add(key);
    const tagged: Recipe = { ...recipe, strategy };
    candidates.push(toCandidate(ctx, title, tagged, scoreCandidate(ctx, title, tagged, rng) + rhythmBonus(origin, title), [`strategy:${strategy}`]));
  }

  const strategiesUsed = new Set(candidates.map(c => c.recipe.strategy)).size;
  const base = selectionOptions(ctx, count);
  const picked = selectDiverse(candidates, {
    ...base,
    capLimit: k => (k.startsWith('strategy:') ? (strategiesUsed >= 3 ? Math.max(1, Math.floor(count / 3)) : count) : base.capLimit(k)),
  });
  const notices = [...ctx.notices];
  if (picked.length < count) notices.push({ code: 'shortfall', message: `Only ${picked.length} close variations fit these settings.` });
  return { titles: picked.map(c => toResult(ctx, c)), notices, seed };
}
