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
      if (k === 'literal') return Math.max(1, Math.round(count * ctx.params.literalRate));
      if (k === 'coined') return Math.max(1, Math.ceil(count * ctx.coinedCap));
      if (k === 'symbolic') return 2;
      return Infinity;
    },
  };
}

/**
 * Cap keys for the batch selector. Lexicon words are keyed by entry, so "Crown", "Crowns", "Crownhold" and
 * "Starcrown" all count against the one crown entry; invented words, frames and fixed pattern words are keyed by text.
 * The Include word and the user's own theme phrases are exempt from the word and head caps.
 */
export function toCandidate(ctx: Context, title: string, recipe: Recipe, score: number, extraCaps: readonly string[] = []): TitleCandidate {
  const words = contentWords(title);
  const caps = new Set<string>(extraCaps);
  const wordKeys = (text: string) => {
    for (const w of contentWords(text)) caps.add(`word:${w}`);
  };
  for (const p of flattenParts(recipe.parts)) {
    switch (p.kind) {
      case 'literal':
        wordKeys(p.text);
        break;
      case 'lex': {
        caps.add(`word:@${p.entryId}`);
        const e = ctx.entryById.get(p.entryId);
        if (e && (e.cliche ?? 0) >= CLASSIC && !ctx.liftedCliches.has(normalize(e.text))) caps.add('cliche-any');
        if (ctx.symbolicIds.has(p.entryId)) caps.add('symbolic');
        break;
      }
      case 'compound':
        caps.add(`word:@${p.headId}`);
        caps.add(`word:@${p.tailId}`);
        break;
      case 'vocab':
        wordKeys(p.text);
        if (p.cliche >= CLASSIC) {
          caps.add(`cliche:${normalize(p.text)}`);
          caps.add('cliche-any');
        }
        break;
      case 'coined':
        wordKeys(p.text);
        caps.add('coined');
        break;
      case 'user':
        caps.add(`phrase:${p.phrase}`);
        caps.add('literal');
        break;
      default:
        break;
    }
  }
  const head = recipe.parts.find(p => p.kind !== 'literal' && p.index === recipe.headSlot);
  if (head) {
    switch (head.kind) {
      case 'lex': caps.add(`head:@${head.entryId}`); break;
      case 'compound': caps.add(`head:@${head.headId}`); break;
      case 'include': case 'user': case 'literal': break;
      default: caps.add(`head:${normalize(head.text)}`);
    }
  }
  return {
    key: titleKey(title), title, recipe, score, family: recipe.family,
    features: new Set([...words, `tpl:${recipe.templateId}`]), capKeys: [...caps],
  };
}

/** Concepts carried by the words of the recipe itself. */
function partConcepts(ctx: Context, recipe: Recipe): string[] {
  const out: string[] = [];
  for (const p of flattenParts(recipe.parts)) {
    if (p.kind === 'lex') out.push(...(ctx.entryById.get(p.entryId)?.concepts ?? []));
    else if (p.kind === 'compound') out.push(...(ctx.entryById.get(p.headId)?.concepts ?? []), ...(ctx.entryById.get(p.tailId)?.concepts ?? []));
    else if (p.kind === 'user') out.push(...(ctx.theme.phrases.find(ph => ph.norm === p.phrase)?.concepts ?? []));
  }
  return out;
}

/** The recipe's concepts, with the anchor it was steered by. Similar uses this as its bias. */
export function recipeConcepts(ctx: Context, recipe: Recipe): string[] {
  const out = partConcepts(ctx, recipe);
  if (recipe.anchor) out.push(recipe.anchor);
  return [...new Set(out)];
}

/**
 * Concepts a note may name. The anchor steers word choice but need not show in the title, so it is listed only when
 * the user typed it or a word in the title carries it.
 */
function topConcepts(ctx: Context, recipe: Recipe, n: number): string[] {
  const out = partConcepts(ctx, recipe);
  if (recipe.anchor && ctx.userConcepts.has(recipe.anchor)) out.push(recipe.anchor);
  return [...new Set(out)]
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
    invented,
    inventedProfile: invented && ctx.profile.id !== 'neutral' ? ctx.profile.label : undefined,
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
