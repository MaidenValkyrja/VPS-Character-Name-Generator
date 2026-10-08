import {
  contentWords, createRng, jaccard, mutateWord, normalize, pickWeighted, pluralize, randomSeed, titleSyllables, wordCount,
  type Rng, type SelectOptions, type Weighted,
} from '@vps-name-tools/core';
import { DATA } from '@vps-name-tools/data';
import { checkCandidate } from './constraints';
import { buildContext, type Choice, type Context } from './context';
import { fillTemplate, isBlockedEngineWord } from './fill';
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
  'the-noun': ['adj-noun', 'of-phrase', 'subtitle'],
  compound: ['adj-noun', 'pair', 'kenning'],
  subtitle: ['pair', 'of-phrase', 'adj-noun', 'the-noun'],
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

/** A recipe together with the strategy that actually produced it. */
interface Ran {
  readonly recipe: Recipe;
  readonly strategy: SimilarStrategy;
}

interface StructureOption {
  readonly template: Template;
  readonly variants: readonly { readonly index: number; readonly lock?: SlotToken; readonly moved?: RecipePart }[];
}

/**
 * Target templates for the structure strategy. Variants whose lock slot accepts the source head come first; the
 * unconstrained list is the fallback for a head nothing in the related families can hold.
 */
function planStructure(ctx: Context, template: Template | undefined, head: Head | undefined): readonly Weighted<StructureOption>[] {
  const families = (template && RELATED_FAMILIES[template.family]) ?? DEFAULT_RELATED;
  const all = ctx.templates
    .filter(w => families.includes(w.item.family))
    .map((w): Weighted<StructureOption> => ({
      item: {
        template: w.item,
        variants: w.item.variants.map((tokens, index) => {
          const lock = tokens.find((x): x is SlotToken => x.kind === 'slot' && x.lock);
          return { index, lock, moved: head && lock ? convertHead(ctx, head, lock) : undefined };
        }),
      },
      weight: w.weight,
    }));
  if (!head) return all;
  const accepting = all
    .map(w => ({ item: { ...w.item, variants: w.item.variants.filter(v => v.moved) }, weight: w.weight }))
    .filter(w => w.item.variants.length > 0);
  return accepting.length > 0 ? accepting : all;
}

interface Plan {
  readonly source: Recipe;
  readonly template: Template | undefined;
  readonly head: Head | undefined;
  readonly bias: ReadonlySet<string>;
  readonly structure: readonly Weighted<StructureOption>[];
  readonly outside: (word: string) => boolean;
}

/** Runs one strategy. A strategy that cannot run for this source returns undefined; it never stands in for another. */
function runStrategy(ctx: Context, rng: Rng, strategy: SimilarStrategy, plan: Plan, seed: string): Ran | undefined {
  const { source, template, head, bias } = plan;
  const ran = (recipe: Recipe | undefined): Ran | undefined => recipe && { recipe, strategy };
  switch (strategy) {
    case 'modifier': {
      if (!template || !head) return undefined;
      return ran(fillTemplate(ctx, rng, template, source.variant, { preset: new Map([[head.index, head]]), bias, anchor: source.anchor, seed }));
    }
    case 'head': {
      if (!template || !head || head.kind !== 'lex') return undefined;
      const keep = new Map<number, RecipePart>();
      for (const p of source.parts) if (p.kind !== 'literal' && p.index !== head.index) keep.set(p.index, p);
      const original = ctx.entryById.get(head.entryId);
      const sibling = (c: Choice) => c.entry.id !== head.entryId && (original?.family ? c.entry.family === original.family : c.entry.concepts.some(x => original?.concepts.includes(x)));
      const sharesConcept = (c: Choice) => c.entry.id !== head.entryId && c.entry.concepts.some(x => bias.has(x));
      // Siblings are the textbook head swap; a concept-sharing word keeps the list from running dry when a family is small.
      const filters = rng() < 0.5 ? [sibling, sharesConcept] : [sharesConcept, sibling];
      for (const headFilter of filters) {
        const recipe = fillTemplate(ctx, rng, template, source.variant, { preset: keep, bias, headFilter, anchor: source.anchor, seed });
        // A head swap changes the head only: an optional slot the source left empty stays empty.
        if (recipe && recipe.parts.every(p => p.kind === 'literal' || p.index === head.index || keep.has(p.index))) return ran(recipe);
      }
      return undefined;
    }
    case 'structure': {
      const option = pickWeighted(rng, plan.structure);
      if (!option) return undefined;
      const v = option.variants[Math.floor(rng() * option.variants.length)];
      if (!v) return undefined;
      return ran(fillTemplate(ctx, rng, option.template, v.index, {
        preset: v.moved && v.lock ? new Map([[v.lock.index, v.moved]]) : undefined, bias, anchor: source.anchor, seed,
      }));
    }
    case 'mutate': {
      if (!head || head.kind !== 'coined') return undefined;
      const m = mutateWord(rng, ctx.profile, { text: head.text, syllables: head.syllables, ending: head.ending, profile: head.profile }, {
        reject: w => isBlockedEngineWord(ctx, w, true) || plan.outside(w),
      });
      if (!m) return undefined;
      const parts = source.parts.map(p => (p === head ? { ...head, syllables: m.syllables, ending: m.ending, text: m.text } : p));
      return { recipe: { ...source, parts, seed }, strategy };
    }
  }
}

function rhythmBonus(origin: { words: number; chars: number; syllables: number }, title: string): number {
  const chars = title.length;
  const outside = chars < origin.chars * 0.8 || chars > origin.chars * 1.2;
  return -0.15 * Math.abs(titleSyllables(title) - origin.syllables) - 0.3 * Math.abs(wordCount(title) - origin.words) - (outside ? 0.4 : 0);
}

/** Cap keys that the kept source head must not be charged for: Similar keeps it on purpose. */
interface KeptHead {
  readonly norm: string;
  readonly keys: ReadonlySet<string>;
  /** Cap keys dropped from every candidate (invented words, when the source itself is an invented word). */
  readonly always: ReadonlySet<string>;
}

function keptHeadOf(head: Head | undefined): KeptHead | undefined {
  if (!head) return undefined;
  const keys = new Set<string>([`head:${normalize(head.text)}`, ...contentWords(head.text).map(w => `word:${w}`)]);
  if (head.kind === 'user') keys.add(`phrase:${head.phrase}`);
  return { norm: normalize(head.text), keys, always: new Set(head.kind === 'coined' ? ['coined'] : []) };
}

/** The candidate with the kept head's cap keys removed (a new object; the input is untouched). */
function exemptKeptHead(c: TitleCandidate, kept: KeptHead | undefined): TitleCandidate {
  if (!kept) return c;
  const h = c.recipe.parts.find(p => p.kind !== 'literal' && p.index === c.recipe.headSlot);
  const holdsKept = h !== undefined && h.kind !== 'literal' && normalize(h.text) === kept.norm;
  const drop = (k: string) => kept.always.has(k) || (holdsKept && kept.keys.has(k));
  return c.capKeys.some(drop) ? { ...c, capKeys: c.capKeys.filter(k => !drop(k)) } : c;
}

const strategyOf = (c: TitleCandidate): SimilarStrategy => c.recipe.strategy!;

/**
 * Picks `count` candidates by strategy quota. Every strategy that produced candidates first gets up to
 * ⌊count / 3⌋ of its best (diverse) ones, in rounds so no strategy goes first. The rest is topped up by score.
 * The per-strategy cap holds in the top-up when three strategies produced candidates and each can fill its quota;
 * the other caps (words, heads, invented words) yield before any strategy cap does, and the family cap does not
 * apply. If a strategy runs short, the count wins and the cap loosens one title at a time.
 */
function selectByStrategy(candidates: readonly TitleCandidate[], count: number, base: SelectOptions, order: readonly SimilarStrategy[]): TitleCandidate[] {
  const pool = [...candidates].sort((a, b) => b.score - a.score);
  const quota = Math.max(1, Math.floor(count / 3));
  const used = new Array<boolean>(pool.length).fill(false);
  const maxOverlap = new Array<number>(pool.length).fill(0);
  const capCount = new Map<string, number>();
  const perStrategy = new Map<SimilarStrategy, number>();
  const picked: TitleCandidate[] = [];

  const take = (only: SimilarStrategy | undefined, genericCaps: boolean, cap: number): boolean => {
    let best = -1;
    let bestValue = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const c = pool[i];
      if (used[i] || (only !== undefined && strategyOf(c) !== only)) continue;
      if ((perStrategy.get(strategyOf(c)) ?? 0) >= cap) continue;
      if (genericCaps && c.capKeys.some(k => (capCount.get(k) ?? 0) >= base.capLimit(k))) continue;
      const value = c.score - base.diversity * maxOverlap[i];
      if (value > bestValue) {
        bestValue = value;
        best = i;
      }
    }
    if (best < 0) return false;
    const chosen = pool[best];
    used[best] = true;
    picked.push(chosen);
    perStrategy.set(strategyOf(chosen), (perStrategy.get(strategyOf(chosen)) ?? 0) + 1);
    for (const k of chosen.capKeys) capCount.set(k, (capCount.get(k) ?? 0) + 1);
    for (let i = 0; i < pool.length; i++) if (!used[i]) maxOverlap[i] = Math.max(maxOverlap[i], jaccard(pool[i].features, chosen.features));
    return true;
  };

  // Quota rounds: honour the other caps first, then let a strategy that is still short ignore them.
  for (const genericCaps of [true, false]) {
    for (let round = 0; round < quota; round++) {
      for (const s of order) if (picked.length < count && (perStrategy.get(s) ?? 0) === round) take(s, genericCaps, quota);
    }
  }
  // Top-up by score. The strategy cap outlasts the other caps, and when a strategy ran short and six titles cannot
  // be reached under it, the cap loosens one title at a time before it goes.
  const caps = order.length >= 3 ? [quota, quota + 1, Infinity] : [Infinity];
  for (const cap of caps) {
    for (const genericCaps of [true, false]) {
      while (picked.length < count && take(undefined, genericCaps, cap)) { /* keep taking */ }
    }
  }
  return picked;
}

export interface SimilarRun {
  readonly result: GenerateResult;
  /** How many acceptable candidates each strategy produced before selection. A strategy that produced none is absent. */
  readonly pool: Readonly<Partial<Record<SimilarStrategy, number>>>;
}

/** generateSimilar plus the strategies its candidate pool offered. Exported for tests; not part of the package index. */
export function similarDetailed(source: TitleResult, opts: SimilarOptions = {}): SimilarRun {
  const data = opts.data ?? DATA;
  const game = opts.game ?? GAME;
  const count = opts.count ?? 6;
  const seed = opts.seed ?? randomSeed();
  const rng = createRng(`${seed}:similar`);
  const ctx = buildContext(normalizeSettings(source.settings), data, game, rng);
  if (ctx.blocked) return { result: { titles: [], notices: ctx.notices, seed }, pool: {} };

  const template = game.templates.find(t => t.id === source.recipe.templateId);
  const head = source.recipe.parts.find((p): p is Head => p.kind !== 'literal' && p.index === source.recipe.headSlot);
  const bias = new Set(recipeConcepts(ctx, source.recipe));
  const origin = { words: wordCount(source.title), chars: source.title.length, syllables: titleSyllables(source.title) };
  const exclude = new Set([titleKey(source.title), ...(opts.exclude ?? [])]);
  const letters = ctx.coinedLetters;
  const plan: Plan = {
    source: source.recipe, template, head, bias,
    structure: planStructure(ctx, template, head),
    outside: w => {
      if (!letters) return false;
      const n = normalize(w).replace(/[^a-z]/g, '').length;
      return n < letters[0] || n > letters[1];
    },
  };

  // Only strategies that can run for this source take part. An invented word is mutated and moved to another
  // structure; mutation gets twice the attempts because it is the cheaper way to a related word.
  const strategies: SimilarStrategy[] = head?.kind === 'coined' ? ['mutate', 'mutate', 'structure'] : [];
  if (strategies.length === 0) {
    if (template && head) strategies.push('modifier');
    if (template && head?.kind === 'lex') strategies.push('head');
    strategies.push('structure');
  }

  const candidates: TitleCandidate[] = [];
  const seen = new Set<string>();
  const kept = keptHeadOf(head);
  const target = count * 8;
  for (let i = 0; i < target * 5 && candidates.length < target; i++) {
    const ran = runStrategy(ctx, rng, strategies[i % strategies.length], plan, `${seed}:similar:${i}`);
    if (!ran) continue;
    const title = renderTitle(ran.recipe.parts);
    const key = titleKey(title);
    if (exclude.has(key) || seen.has(key) || checkCandidate(ctx, title, ran.recipe)) continue;
    seen.add(key);
    const tagged: Recipe = { ...ran.recipe, strategy: ran.strategy };
    candidates.push(exemptKeptHead(toCandidate(ctx, title, tagged, scoreCandidate(ctx, title, tagged, rng) + rhythmBonus(origin, title)), kept));
  }

  const sizes: Partial<Record<SimilarStrategy, number>> = {};
  for (const c of candidates) sizes[strategyOf(c)] = (sizes[strategyOf(c)] ?? 0) + 1;
  const order = [...new Set(strategies)].filter(s => sizes[s]);
  const picked = selectByStrategy(candidates, count, selectionOptions(ctx, count), order);
  const notices = [...ctx.notices];
  if (picked.length < count) notices.push({ code: 'shortfall', message: `Only ${picked.length} close variations fit these settings.` });
  return { result: { titles: picked.map(c => toResult(ctx, c)), notices, seed }, pool: sizes };
}

export function generateSimilar(source: TitleResult, opts: SimilarOptions = {}): GenerateResult {
  return similarDetailed(source, opts).result;
}
