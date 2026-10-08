import { coinWord, normalize, pickWeighted, pluralize, shuffle, unsafeGenerated, type Rng, type ThemePhrase } from '@vps-name-tools/core';
import { foldTerm, termMatcher } from '@vps-name-tools/data';
import { slotForRole, type Choice, type Context, type LexSlot, type VocabSlot } from './context';
import { parsePattern } from './pattern';
import { joinCompound, renderRaw } from './render';
import type { SlotType } from './ids';
import type { PatternToken, Recipe, RecipePart, SlotToken, Template } from './types';

export interface FillOptions {
  readonly anchor?: string;
  readonly literal?: ThemePhrase;
  readonly preset?: ReadonlyMap<number, RecipePart>;
  readonly bias?: ReadonlySet<string>;
  readonly headFilter?: (c: Choice) => boolean;
  readonly seed?: string;
}

export interface SlotFill {
  readonly anchor?: string;
  readonly bias?: ReadonlySet<string>;
  readonly used: Set<string>;
  readonly letter?: string;
  readonly filter?: (c: Choice) => boolean;
}

const LEX_SLOTS = new Set<SlotType>(['noun', 'nounPl', 'adj', 'verb', 'abstract', 'placeWord']);
const subtitleCache = new WeakMap<readonly string[], readonly (readonly PatternToken[])[]>();

const matchers = new WeakMap<readonly string[], (normText: string) => string | undefined>();
const prefixNameCache = { any: new WeakMap<readonly string[], readonly string[]>(), single: new WeakMap<readonly string[], readonly string[]>() };

/**
 * The compiled matcher for a term list, built once per list. The game data and the packs hold their lists for the
 * whole session, so the lists are the cache keys; a list must not be edited after it has been matched against.
 */
export function matcherFor(terms: readonly string[]): (normText: string) => string | undefined {
  let m = matchers.get(terms);
  if (!m) {
    m = termMatcher(terms);
    matchers.set(terms, m);
  }
  return m;
}

/**
 * Letters-only names of 4+ letters that an invented word must not start with. Denylist entries count in full
 * ("the morrigan" folds to "themorrigan"); franchise terms count only when they are a single word.
 */
function prefixNames(terms: readonly string[], mode: 'any' | 'single'): readonly string[] {
  const cache = prefixNameCache[mode];
  let names = cache.get(terms);
  if (!names) {
    names = terms.flatMap(t => {
      const folded = mode === 'single' ? foldTerm(t) : normalize(t);
      if (mode === 'single' && folded.includes(' ')) return [];
      const name = folded.replace(/[^a-z]/g, '');
      return name.length >= 4 ? [name] : [];
    });
    cache.set(terms, names);
  }
  return names;
}

const startsWithAny = (letters: string, names: readonly string[]): boolean => names.some(name => letters.startsWith(name));

export function isBlockedEngineWord(ctx: Context, word: string, coined = false): boolean {
  const n = normalize(word);
  if (unsafeGenerated(word, [word], ctx.data.safety)) return true;
  if (ctx.game.knownTitles.has(n)) return true;
  const letters = coined ? n.replace(/[^a-z]/g, '') : '';
  for (const { pack } of ctx.mythChain) {
    if (matcherFor(pack.denylist)(n) !== undefined) return true;
    if (coined && startsWithAny(letters, prefixNames(pack.denylist, 'any'))) return true;
  }
  const franchise = ctx.game.franchiseTerms;
  if (matcherFor(franchise)(n) !== undefined) return true;
  // An invented word must not begin with a single-word franchise name ("Jedimar" for "Jedi").
  if (coined && startsWithAny(letters, prefixNames(franchise, 'single'))) return true;
  for (const { preset } of ctx.genreChain) for (const s of preset.guard?.blockSuffixes ?? []) if (n.endsWith(s)) return true;
  return false;
}

export function pickChoice(ctx: Context, rng: Rng, slot: LexSlot, o: SlotFill): Choice | undefined {
  const ok = (c: Choice) =>
    !o.used.has(c.entry.id) && !o.used.has(normalize(c.text)) &&
    (!o.letter || c.text.toLowerCase().startsWith(o.letter)) && (!o.filter || o.filter(c));
  if (!o.filter && rng() < ctx.params.wildcardRate) {
    const flat = (ctx.flatPools.get(slot) ?? []).filter(ok);
    if (flat.length > 0) return flat[Math.floor(rng() * flat.length)];
  }
  const related = o.anchor ? new Set(ctx.related.get(o.anchor) ?? []) : undefined;
  const weighted: { item: Choice; weight: number }[] = [];
  for (const w of ctx.pools.get(slot) ?? []) {
    const c = w.item;
    if (!ok(c)) continue;
    let k = w.weight;
    if (o.anchor) {
      if (c.entry.concepts.includes(o.anchor)) k *= 2;
      else if (related && c.entry.concepts.some(x => related.has(x))) k *= 1.4;
    }
    if (o.bias && c.entry.concepts.some(x => o.bias!.has(x))) k *= 2.5;
    weighted.push({ item: c, weight: k });
  }
  return pickWeighted(rng, weighted);
}

function pickVocab(ctx: Context, rng: Rng, slot: VocabSlot, o: SlotFill) {
  const weighted = (ctx.vocab.get(slot) ?? [])
    .filter(w => !o.used.has(normalize(w.item.text)))
    .map(w => ({ item: w.item, weight: o.anchor && w.item.concepts.includes(o.anchor) ? w.weight * 2 : w.weight }));
  return pickWeighted(rng, weighted);
}

function markUsed(used: Set<string>, p: RecipePart): void {
  switch (p.kind) {
    case 'literal':
      return;
    case 'lex':
      used.add(p.entryId);
      used.add(normalize(p.text));
      return;
    case 'compound':
      used.add(p.headId);
      used.add(p.tailId);
      used.add(normalize(p.text));
      return;
    case 'group':
      for (const q of p.parts) markUsed(used, q);
      return;
    default:
      used.add(normalize(p.text));
  }
}

function coinedPart(ctx: Context, rng: Rng, index: number, slot: SlotType): RecipePart | undefined {
  const letters = ctx.coinedLetters;
  const w = coinWord(rng, ctx.profile, {
    reject: word => isBlockedEngineWord(ctx, word, true),
    ...(letters ? { minLetters: letters[0], maxLetters: letters[1] } : {}),
  });
  return w && { kind: 'coined', index, slot, profile: w.profile, syllables: w.syllables, ending: w.ending, text: w.text };
}

function compoundPart(ctx: Context, rng: Rng, index: number, slot: SlotType, tailSlot: 'compoundTail' | 'placeTail', o: SlotFill): RecipePart | undefined {
  for (let attempt = 0; attempt < 6; attempt++) {
    const head = pickChoice(ctx, rng, 'compoundHead', o);
    if (!head) return undefined;
    // The head filter and alliteration letter constrain the head only; the tail is free.
    const tail = pickChoice(ctx, rng, tailSlot, { ...o, filter: undefined, letter: undefined, used: new Set([...o.used, head.entry.id]) });
    if (!tail) return undefined;
    const text = joinCompound(head.text, tail.text);
    if (isBlockedEngineWord(ctx, text)) continue;
    return { kind: 'compound', index, slot, headId: head.entry.id, tailId: tail.entry.id, morphemes: [head.text, tail.text], text };
  }
  return undefined;
}

function coinedPlacePart(ctx: Context, rng: Rng, index: number, o: SlotFill): RecipePart | undefined {
  const root = coinWord(rng, ctx.profile, { minLetters: 3, maxLetters: 6, reject: w => isBlockedEngineWord(ctx, w, true) });
  const tail = root && pickChoice(ctx, rng, 'placeTail', o);
  if (!root || !tail) return undefined;
  const text = joinCompound(root.text, tail.text);
  if (isBlockedEngineWord(ctx, text)) return undefined;
  return { kind: 'coined', index, slot: 'place', profile: root.profile, syllables: root.syllables, ending: tail.text, text };
}

function subtitlePart(ctx: Context, rng: Rng, index: number, o: SlotFill): RecipePart | undefined {
  const patterns = ctx.game.vocab.subtitlePatterns;
  if (patterns.length === 0) return undefined;
  let parsed = subtitleCache.get(patterns);
  if (!parsed) {
    parsed = patterns.map(parsePattern);
    subtitleCache.set(patterns, parsed);
  }
  const tokens = parsed[Math.floor(rng() * parsed.length)];
  const parts: RecipePart[] = [];
  for (const tok of tokens) {
    if (tok.kind === 'literal') {
      parts.push({ kind: 'literal', text: tok.text });
      continue;
    }
    if (tok.optional && rng() < 0.45) continue;
    const p = fillSlot(ctx, rng, tok, o, -1);
    if (!p) {
      if (tok.optional) continue;
      return undefined;
    }
    parts.push(p);
    markUsed(o.used, p);
  }
  return { kind: 'group', index, slot: 'subtitle', parts, text: renderRaw(parts) };
}

function fillType(ctx: Context, rng: Rng, type: SlotType, index: number, o: SlotFill): RecipePart | undefined {
  if (LEX_SLOTS.has(type)) {
    const c = pickChoice(ctx, rng, type as LexSlot, o);
    return c && { kind: 'lex', index, slot: type, entryId: c.entry.id, text: c.text };
  }
  switch (type) {
    case 'compound':
      return compoundPart(ctx, rng, index, 'compound', 'compoundTail', o);
    case 'coined':
      return coinedPart(ctx, rng, index, 'coined');
    case 'name': {
      if (rng() < ctx.coinedRate) {
        const c = coinedPart(ctx, rng, index, 'name');
        if (c) return c;
      }
      const first = rng() < 0.5 ? 'placeTail' : 'compoundTail';
      const second = first === 'placeTail' ? 'compoundTail' : 'placeTail';
      return compoundPart(ctx, rng, index, 'name', first, o) ?? compoundPart(ctx, rng, index, 'name', second, o);
    }
    case 'place':
      return compoundPart(ctx, rng, index, 'place', 'placeTail', o) ?? (ctx.coinedRate > 0 ? coinedPlacePart(ctx, rng, index, o) : undefined);
    case 'subtitle':
      return subtitlePart(ctx, rng, index, o);
    default: {
      const v = pickVocab(ctx, rng, type as VocabSlot, o);
      return v && { kind: 'vocab', index, slot: type, text: v.text, cliche: v.cliche };
    }
  }
}

function fillSlot(ctx: Context, rng: Rng, tok: SlotToken, o: SlotFill, index = tok.index): RecipePart | undefined {
  for (const type of shuffle(rng, tok.types)) {
    const p = fillType(ctx, rng, type, index, o);
    if (p) return p;
  }
  return undefined;
}

function includePart(ctx: Context, index: number, slot: SlotType): RecipePart {
  const inc = ctx.include!;
  const text = slot === 'nounPl' && inc.entry ? inc.entry.forms?.plural ?? pluralize(inc.entry.text) : inc.text;
  return { kind: 'include', index, slot, text };
}

function userPart(ctx: Context, phrase: ThemePhrase, index: number, slot: SlotType): RecipePart {
  const entry = phrase.entryIds.length === 1 && !phrase.norm.includes(' ') ? ctx.entryById.get(phrase.entryIds[0]) : undefined;
  let text = phrase.display;
  if (entry) {
    if (slot === 'nounPl') text = entry.forms?.plural ?? pluralize(entry.text);
    else if (slot === 'noun' || slot === 'name') text = entry.text;
    else if (slot === 'adj') text = entry.pos.includes('adj') ? entry.text : entry.forms?.adj ?? entry.text;
  } else if (slot === 'nounPl' && !/s$/i.test(text)) {
    text = pluralize(text);
  }
  return { kind: 'user', index, slot, phrase: phrase.norm, text };
}

export function fillTemplate(ctx: Context, rng: Rng, template: Template, variant: number, opts: FillOptions = {}): Recipe | undefined {
  const tokens = template.variants[variant];
  if (!tokens) return undefined;
  const slots = tokens.filter((t): t is SlotToken => t.kind === 'slot');
  const headSlot = slots.find(s => s.lock)?.index ?? -1;
  const presetParts = [...(opts.preset?.values() ?? [])];

  let includeAt = -1;
  let includeType: SlotType | undefined;
  if (ctx.include && !presetParts.some(p => p.kind === 'include')) {
    for (const s of slots) {
      if (!s.lock || opts.preset?.has(s.index)) continue;
      const t = slotForRole(s.types, ctx.include.role);
      if (t) {
        includeAt = s.index;
        includeType = t;
        break;
      }
    }
    if (includeAt < 0) return undefined;
  }

  let literalAt = -1;
  let literalType: SlotType | undefined;
  if (opts.literal) {
    const literal = opts.literal;
    const options = slots
      .filter(s => s.index !== includeAt && !opts.preset?.has(s.index))
      .flatMap(s => {
        const t = slotForRole(s.types, literal.role);
        return t ? [{ s, t }] : [];
      });
    const locked = ctx.include ? [] : options.filter(x => x.s.lock);
    const from = locked.length > 0 ? locked : options;
    const choice = from[Math.floor(rng() * from.length)];
    if (choice) {
      literalAt = choice.s.index;
      literalType = choice.t;
    }
  }

  const used = new Set<string>();
  for (const p of presetParts) markUsed(used, p);
  const parts: RecipePart[] = [];
  let letter: string | undefined;
  for (const tok of tokens) {
    if (tok.kind === 'literal') {
      parts.push({ kind: 'literal', text: tok.text });
      continue;
    }
    const preset = opts.preset?.get(tok.index);
    let part: RecipePart | undefined = preset;
    if (!part && tok.index === includeAt && includeType) part = includePart(ctx, tok.index, includeType);
    if (!part && tok.index === literalAt && literalType && opts.literal) part = userPart(ctx, opts.literal, tok.index, literalType);
    if (!part) {
      if (tok.optional && rng() < 0.45) continue;
      part = fillSlot(ctx, rng, tok, {
        anchor: opts.anchor,
        bias: opts.bias,
        used,
        letter: template.alliterate ? letter : undefined,
        filter: tok.index === headSlot ? opts.headFilter : undefined,
      });
      if (!part) {
        if (tok.optional) continue;
        return undefined;
      }
    }
    if (!preset) markUsed(used, part);
    parts.push(part);
    if (template.alliterate && !letter) letter = part.text.charAt(0).toLowerCase();
  }
  return { templateId: template.id, variant, family: template.family, parts, headSlot, anchor: opts.anchor, seed: opts.seed ?? '' };
}
