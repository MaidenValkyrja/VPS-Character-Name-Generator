import {
  contentWords, createRng, hash32, normalize, pickWeighted, randomSeed, selectDiverse,
  type Candidate, type Rng, type SelectOptions, type ThemePhrase,
} from '@vps-name-tools/core';
import { DATA } from '@vps-name-tools/data';
import { checkCandidate } from './constraints';
import { buildContext, type Context } from './context';
import { fillTemplate } from './fill';
import { GAME } from './game';
import { buildNote } from './notes';
import { flattenParts, renderTitle } from './render';
import { scoreCandidate } from './score';
import { normalizeSettings, type Settings } from './settings';
import type { GenerateOptions, GenerateResult, Recipe, TitleResult } from './types';

export interface TitleCandidate extends Candidate {
  readonly title: string;
  readonly recipe: Recipe;
}

export const titleKey = (title: string): string => normalize(title);
const CLASSIC = 0.5;

export function selectionOptions(ctx: Context, count: number): SelectOptions {
  const atLeastOne = (x: number) => Math.max(1, Math.floor(x));
  const phrases = ctx.theme.phrases.length;
  return {
    count,
    diversity: 0.6,
    familyCap: f => (ctx.familiesAvailable < 4 ? count : f === 'adj-noun' ? atLeastOne(count * 0.2) : atLeastOne(count * 0.3)),
    capLimit: k => {
      if (k.startsWith('word:')) return 2;
      if (k.startsWith('head:')) return 1;
      if (k.startsWith('cliche:')) return 1;
      if (k === 'cliche-any') return atLeastOne(count * 0.2);
      if (k.startsWith('phrase:')) return phrases > 1 ? atLeastOne(count * 0.3) : count;
      if (k === 'coined') return Math.max(1, Math.ceil(count * ctx.coinedCap));
      if (k === 'symbolic') return 2;
      return Infinity;
    },
  };
}

export function toCandidate(ctx: Context, title: string, recipe: Recipe, score: number, extraCaps: readonly string[] = []): TitleCandidate {
  const words = contentWords(title);
  const includeWords = new Set(ctx.include ? contentWords(ctx.include.text) : []);
  const caps = new Set<string>(extraCaps);
  for (const w of words) if (!includeWords.has(w)) caps.add(`word:${w}`);
  const head = recipe.parts.find(p => p.kind !== 'literal' && p.index === recipe.headSlot);
  if (head && head.kind !== 'include') caps.add(`head:${normalize(head.text)}`);
  for (const p of flattenParts(recipe.parts)) {
    if (p.kind === 'vocab' && p.cliche >= CLASSIC) {
      caps.add(`cliche:${normalize(p.text)}`);
      caps.add('cliche-any');
    }
    if (p.kind === 'lex') {
      const e = ctx.entryById.get(p.entryId);
      if (e && (e.cliche ?? 0) >= CLASSIC && !ctx.liftedCliches.has(normalize(e.text))) caps.add('cliche-any');
      if (ctx.symbolicIds.has(p.entryId)) caps.add('symbolic');
    }
    if (p.kind === 'user') caps.add(`phrase:${p.phrase}`);
    if (p.kind === 'coined') caps.add('coined');
  }
  return {
    key: titleKey(title), title, recipe, score, family: recipe.family,
    features: new Set([...words, `tpl:${recipe.templateId}`]), capKeys: [...caps],
  };
}

export function recipeConcepts(ctx: Context, recipe: Recipe): string[] {
  const out: string[] = [];
  for (const p of flattenParts(recipe.parts)) {
    if (p.kind === 'lex') out.push(...(ctx.entryById.get(p.entryId)?.concepts ?? []));
    else if (p.kind === 'compound') out.push(...(ctx.entryById.get(p.headId)?.concepts ?? []), ...(ctx.entryById.get(p.tailId)?.concepts ?? []));
    else if (p.kind === 'user') out.push(...(ctx.theme.phrases.find(ph => ph.norm === p.phrase)?.concepts ?? []));
  }
  if (recipe.anchor) out.push(recipe.anchor);
  return [...new Set(out)];
}

function topConcepts(ctx: Context, recipe: Recipe, n: number): string[] {
  return recipeConcepts(ctx, recipe)
    .map(c => ({ c, s: (ctx.boost.get(c) ?? 1) * (ctx.userConcepts.has(c) ? 2 : 1) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map(x => x.c);
}

export function toResult(ctx: Context, c: TitleCandidate): TitleResult {
  const concepts = topConcepts(ctx, c.recipe, 3);
  const invented = c.recipe.family === 'coined' && c.recipe.parts.some(p => p.kind === 'coined');
  const s = ctx.settings;
  const note = buildNote({
    tone: ctx.tones[0]?.def.noteWord ?? '',
    myth: ctx.myth.id === 'none' ? undefined : ctx.myth.noteLabel,
    genre: ctx.genre.noteLabel,
    concepts: concepts.map(id => ctx.conceptLabel(id)),
    inventedProfile: invented ? ctx.profile.label : undefined,
    variant: c.title.length,
  });
  return {
    id: `t_${hash32(`${c.key}|${s.genre}|${s.myth}`)}`,
    title: c.title,
    meta: {
      genre: s.genre, myth: ctx.myth.id, style: s.style, tones: ctx.tones.map(t => t.def.id), concepts, note,
      genreLabel: ctx.genre.label, mythLabel: ctx.myth.label, styleLabel: ctx.style?.label ?? 'Auto',
    },
    recipe: c.recipe,
    settings: s,
  };
}

function leastUsed(rng: Rng, phrases: readonly ThemePhrase[], use: ReadonlyMap<string, number>): ThemePhrase {
  const min = Math.min(...phrases.map(p => use.get(p.norm) ?? 0));
  const options = phrases.filter(p => (use.get(p.norm) ?? 0) === min);
  return options[Math.floor(rng() * options.length)];
}

function buildCandidate(ctx: Context, rng: Rng, phraseUse: Map<string, number>, seed: string): TitleCandidate | undefined {
  const template = pickWeighted(rng, ctx.templates);
  if (!template) return undefined;
  const variant = Math.floor(rng() * template.variants.length);
  const literal = ctx.theme.phrases.length > 0 && rng() < ctx.params.literalRate ? leastUsed(rng, ctx.theme.phrases, phraseUse) : undefined;
  const anchor = literal?.concepts.length ? literal.concepts[Math.floor(rng() * literal.concepts.length)] : pickWeighted(rng, ctx.anchors);
  const recipe = fillTemplate(ctx, rng, template, variant, { anchor, literal, seed });
  if (!recipe) return undefined;
  const title = renderTitle(recipe.parts);
  if (checkCandidate(ctx, title, recipe)) return undefined;
  for (const p of recipe.parts) if (p.kind === 'user') phraseUse.set(p.phrase, (phraseUse.get(p.phrase) ?? 0) + 1);
  return toCandidate(ctx, title, recipe, scoreCandidate(ctx, title, recipe, rng));
}

export function generate(input: Partial<Settings>, opts: GenerateOptions = {}): GenerateResult {
  const settings = normalizeSettings(input);
  const data = opts.data ?? DATA;
  const game = opts.game ?? GAME;
  const seed = opts.seed ?? randomSeed();
  const rng = createRng(seed);
  const ctx = buildContext(settings, data, game, rng);
  if (ctx.blocked) return { titles: [], notices: ctx.notices, seed };

  const target = settings.count * 6;
  const candidates: TitleCandidate[] = [];
  const seen = new Set<string>();
  const phraseUse = new Map<string, number>();
  for (let attempt = 0; attempt < target * 5 && candidates.length < target; attempt++) {
    const c = buildCandidate(ctx, rng, phraseUse, `${seed}:${attempt}`);
    if (!c || seen.has(c.key) || opts.exclude?.has(c.key)) continue;
    seen.add(c.key);
    candidates.push(c);
  }
  const picked = selectDiverse(candidates, selectionOptions(ctx, settings.count));
  const notices = [...ctx.notices];
  if (picked.length < settings.count) {
    notices.push({ code: 'shortfall', message: `Only ${picked.length} titles fit these settings. Try another length or style, or fewer Avoid words.` });
  }
  return { titles: picked.map(c => toResult(ctx, c)), notices, seed };
}
