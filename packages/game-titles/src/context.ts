import {
  lemmaCandidates, normalize, parseAvoid, parseThemes, pluralize, sanitizeInput, temper, titleCase, violatesAvoid,
  type AvoidRule, type PhoneticProfile, type PhraseRole, type Rng, type SteeringIndex, type ThemeProfile, type Weighted,
} from '@vps-name-tools/core';
import { buildSteeringIndex, type DataBundle, type LexEntry, type MythPack, type ToneDef } from '@vps-name-tools/data';
import { CREATIVITY, type CreativityParams, type Settings } from './settings';
import type { LengthOption, SlotType } from './ids';
import type { GameData, GenrePreset, LengthBias, Notice, StyleDef, Template, VocabItem } from './types';

export type LexSlot = 'noun' | 'nounPl' | 'adj' | 'verb' | 'abstract' | 'placeWord' | 'compoundHead' | 'compoundTail' | 'placeTail';
export type VocabSlot = 'frame' | 'frameSuffix' | 'genreSuffix' | 'number' | 'ordinal' | 'digits' | 'prep' | 'predicate' | 'epithet';
export type Source = 'core' | 'genre' | 'myth' | 'symbolic';

export interface Choice { readonly entry: LexEntry; readonly text: string; readonly source: Source }
export interface VocabChoice { readonly text: string; readonly concepts: readonly string[]; readonly cliche: number }
export interface IncludeSpec { readonly text: string; readonly norm: string; readonly role: PhraseRole; readonly entry?: LexEntry }

export interface Context {
  readonly settings: Settings;
  readonly params: CreativityParams;
  readonly genre: GenrePreset;
  readonly genreChain: readonly { readonly preset: GenrePreset; readonly weight: number }[];
  readonly myth: MythPack;
  readonly mythChain: readonly { readonly pack: MythPack; readonly weight: number }[];
  readonly style?: StyleDef;
  readonly tones: readonly { readonly def: ToneDef; readonly weight: number }[];
  readonly theme: ThemeProfile;
  readonly include?: IncludeSpec;
  readonly avoid: readonly AvoidRule[];
  readonly boost: ReadonlyMap<string, number>;
  readonly userConcepts: ReadonlySet<string>;
  readonly related: ReadonlyMap<string, readonly string[]>;
  readonly pools: ReadonlyMap<LexSlot, readonly Weighted<Choice>[]>;
  readonly flatPools: ReadonlyMap<LexSlot, readonly Choice[]>;
  readonly vocab: ReadonlyMap<VocabSlot, readonly Weighted<VocabChoice>[]>;
  readonly templates: readonly Weighted<Template>[];
  readonly familiesAvailable: number;
  readonly anchors: readonly Weighted<string>[];
  readonly profile: PhoneticProfile;
  /** Letter range for invented words: the style's brand range, else the primary tone's cap. */
  readonly coinedLetters?: readonly [number, number];
  /** Chance that a name slot becomes an invented word. */
  readonly coinedRate: number;
  /** Largest share of a batch that may be invented words. */
  readonly coinedCap: number;
  readonly liftedCliches: ReadonlySet<string>;
  readonly alliterationBonus: number;
  readonly maxBoost: number;
  readonly entryById: ReadonlyMap<string, LexEntry>;
  readonly symbolicIds: ReadonlySet<string>;
  readonly data: DataBundle;
  readonly game: GameData;
  readonly notices: readonly Notice[];
  readonly blocked: boolean;
  entryRelevance(entry: LexEntry): number;
  conceptLabel(id: string): string;
}

const SOURCE_BONUS: Readonly<Record<Source, number>> = { core: 1, genre: 2, myth: 2.5, symbolic: 0.6 };

const ROLE_SLOTS: Readonly<Record<PhraseRole, readonly SlotType[]>> = {
  name: ['name', 'place', 'coined', 'noun'],
  noun: ['noun', 'nounPl', 'name'],
  adj: ['adj', 'abstract'],
  gerund: ['adj'],
};

export function slotForRole(types: readonly SlotType[], role: PhraseRole): SlotType | undefined {
  return ROLE_SLOTS[role].find(t => types.includes(t));
}

const indexCache = new WeakMap<DataBundle, WeakMap<GameData, SteeringIndex>>();
export function steeringIndexFor(data: DataBundle, game: GameData): SteeringIndex {
  let byGame = indexCache.get(data);
  if (!byGame) {
    byGame = new WeakMap();
    indexCache.set(data, byGame);
  }
  let index = byGame.get(game);
  if (!index) {
    index = buildSteeringIndex(data, game.genres.flatMap(g => g.entries ?? []));
    byGame.set(game, index);
  }
  return index;
}

function classOf(t: Template): keyof LengthBias {
  const [lo, hi] = t.words;
  if (hi === 1) return 'one';
  if (t.family === 'subtitle' || lo >= 4) return 'long';
  if (hi <= 2) return 'short';
  return 'medium';
}

export function lengthWeight(t: Template, length: LengthOption, bias: LengthBias): number {
  const [lo, hi] = t.words;
  switch (length) {
    case 'one': return hi === 1 ? 1 : 0;
    case 'short': return lo <= 2 && t.family !== 'subtitle' ? 1 : 0;
    case 'medium': return hi >= 2 && lo <= 4 && t.family !== 'subtitle' ? 1 : 0;
    case 'long': return hi >= 4 || t.family === 'subtitle' ? 1 : 0;
    case 'any': return 0.5 + bias[classOf(t)];
  }
}

const usable = (m: MythPack | undefined): m is MythPack => !!m && m.review.status !== 'held';

function chainGenres(all: readonly GenrePreset[], genre: GenrePreset) {
  const chain = [{ preset: genre, weight: 1 }];
  let current = genre;
  let weight = 1;
  while (current.parent && chain.length < 4) {
    const parent = all.find(g => g.id === current.parent);
    if (!parent || chain.some(c => c.preset.id === parent.id)) break;
    weight /= 2;
    chain.push({ preset: parent, weight });
    current = parent;
  }
  return chain;
}

function chainMyths(all: readonly MythPack[], myth: MythPack, crossMyth: number, rng?: Rng) {
  const chain = [{ pack: myth, weight: 1 }];
  for (const b of myth.blend ?? []) {
    const pack = all.find(m => m.id === b.id);
    if (usable(pack)) chain.push({ pack, weight: b.weight });
  }
  if (myth.id === 'original' && crossMyth > 0 && rng) {
    const tierA = all.filter(m => m.tier === 'A' && usable(m));
    for (let i = 0; i < 2 && tierA.length > 0; i++) chain.push({ pack: tierA.splice(Math.floor(rng() * tierA.length), 1)[0], weight: crossMyth });
  }
  return chain;
}

function resolveTones(s: Settings, genre: GenrePreset, all: readonly ToneDef[]) {
  const find = (id: string | undefined) => (id ? all.find(t => t.id === id) : undefined);
  const primary = find(s.tone === 'auto' ? genre.defaultTones[0] : s.tone);
  const secondary = find(s.tone2 !== 'none' ? s.tone2 : s.tone === 'auto' ? genre.defaultTones[1] : undefined);
  const out: { def: ToneDef; weight: number }[] = [];
  if (primary) out.push({ def: primary, weight: 1 });
  if (secondary && secondary.id !== primary?.id) out.push({ def: secondary, weight: 0.5 });
  return out;
}

function resolveInclude(raw: string, index: SteeringIndex, entryById: ReadonlyMap<string, LexEntry>): IncludeSpec | undefined {
  const text = sanitizeInput(raw, 40).trim().replace(/\s+/g, ' ');
  if (!text) return undefined;
  const norm = normalize(text);
  const id = index.lexicon.get(norm)?.[0];
  const entry = id ? entryById.get(id) : undefined;
  const single = !text.includes(' ');
  const role: PhraseRole = single && entry?.pos.includes('noun') ? 'noun' : single && entry?.pos.includes('adj') ? 'adj' : 'name';
  return { text: text === text.toLowerCase() ? titleCase(text) : text, norm, role, entry };
}

export function buildContext(settings: Settings, data: DataBundle, game: GameData, rng?: Rng): Context {
  const notices: Notice[] = [];
  const params = CREATIVITY[settings.creativity];
  const genre = game.genres.find(g => g.id === settings.genre) ?? game.genres[0];
  const genreChain = chainGenres(game.genres, genre);
  const none = data.myths.find(m => m.id === 'none');
  if (!none) throw new Error('The "none" cultural pack is required');
  const chosen = data.myths.find(m => m.id === settings.myth);
  const myth = usable(chosen) ? chosen : none;
  const mythChain = chainMyths(data.myths, myth, params.crossMyth, rng);
  const style = settings.style === 'auto' ? undefined : game.styles.find(s => s.id === settings.style);
  const tones = resolveTones(settings, genre, data.tones);
  const index = steeringIndexFor(data, game);
  const theme = parseThemes(settings.themes, index);
  const avoid = parseAvoid(settings.avoid);

  const sources: { entry: LexEntry; source: Source; weight: number }[] = [
    ...data.lexicon.map(entry => ({ entry, source: 'core' as const, weight: 1 })),
    ...genreChain.flatMap(({ preset, weight }) => (preset.entries ?? []).map(entry => ({ entry, source: 'genre' as const, weight }))),
    ...mythChain.flatMap(({ pack, weight }) => [
      ...pack.imagery.map(entry => ({ entry, source: 'myth' as const, weight })),
      ...pack.symbolic.map(entry => ({ entry, source: 'symbolic' as const, weight })),
    ]),
  ];
  const entryById = new Map<string, LexEntry>();
  for (const e of [...data.lexicon, ...data.myths.flatMap(m => [...m.imagery, ...m.symbolic]), ...game.genres.flatMap(g => g.entries ?? [])]) entryById.set(e.id, e);
  const symbolicIds = new Set(mythChain.flatMap(({ pack }) => pack.symbolic.map(e => e.id)));

  const include = resolveInclude(settings.include, index, entryById);
  let blocked = false;
  if (include && violatesAvoid(include.text, [include.text], avoid)) {
    blocked = true;
    notices.push({ code: 'include-conflicts-avoid', message: 'Your Include word is also on your Avoid list. Remove it from one of them to generate titles.' });
  }
  if (include && settings.length === 'one' && include.text.includes(' ')) {
    notices.push({ code: 'include-unusable', message: 'A multi-word Include word cannot fit one-word titles. Try Any or Short length.' });
  }

  const boost = new Map<string, number>();
  const mul = (c: string, v: number, w: number) => boost.set(c, (boost.get(c) ?? 1) * (1 + (v - 1) * w));
  for (const { preset, weight } of genreChain) for (const [c, v] of Object.entries(preset.conceptBoosts)) mul(c, v, weight);
  for (const { pack, weight } of mythChain) for (const [c, v] of Object.entries(pack.conceptBoosts)) mul(c, v, weight);
  for (const { def, weight } of tones) for (const [c, v] of Object.entries(def.conceptBoosts)) mul(c, v, weight);
  for (const [c, v] of theme.conceptBoosts) mul(c, v, 1);
  const userConcepts = new Set(theme.conceptBoosts.keys());
  const suppressed = new Set(genreChain.flatMap(g => g.preset.suppress ?? []).filter(c => !userConcepts.has(c)));
  for (const c of suppressed) boost.set(c, 0);
  const maxBoost = Math.max(2, ...boost.values());

  const liftedCliches = new Set<string>();
  for (const w of normalize(`${settings.themes} ${settings.include}`).split(/[\s-]+/)) {
    if (!w) continue;
    for (const form of [w, `${w}s`, ...lemmaCandidates(w)]) liftedCliches.add(form);
  }

  const namedFamilies = new Set<string>();
  for (const id of theme.entryBoosts.keys()) {
    const family = entryById.get(id)?.family;
    if (family) namedFamilies.add(family);
  }

  const entryRelevance = (e: LexEntry): number => {
    const named = theme.entryBoosts.has(e.id);
    let max = 0;
    for (const c of e.concepts) {
      if (suppressed.has(c) && !named) return 0;
      max = Math.max(max, boost.get(c) ?? 1);
    }
    if (named) return Math.max(max, 1);
    return max > 1 ? max : params.baseline;
  };

  const entryWeight = (e: LexEntry, source: Source): number => {
    const relevance = entryRelevance(e);
    if (relevance === 0) return 0;
    let w = relevance * SOURCE_BONUS[source];
    for (const { def, weight } of tones) w *= Math.max(0.1, 1 + (e.tones?.[def.id] ?? 0) * 0.8 * weight);
    w *= style?.register?.[e.register] ?? 1;
    const named = theme.entryBoosts.get(e.id);
    if (named) w *= named;
    else if (e.family && namedFamilies.has(e.family)) w *= 1.5;
    const cliche = liftedCliches.has(normalize(e.text)) ? 0 : e.cliche ?? 0;
    return w * (1 - 0.6 * cliche);
  };

  const pools = new Map<LexSlot, Weighted<Choice>[]>();
  const flatPools = new Map<LexSlot, Choice[]>();
  let nounsSeen = 0;
  let nounsAvoided = 0;
  const push = (slot: LexSlot, choice: Choice, weight: number) => {
    if (slot === 'noun') nounsSeen++;
    if (violatesAvoid(choice.text, [choice.text], avoid)) {
      if (slot === 'noun') nounsAvoided++;
      return;
    }
    if (!pools.has(slot)) {
      pools.set(slot, []);
      flatPools.set(slot, []);
    }
    pools.get(slot)!.push({ item: choice, weight });
    flatPools.get(slot)!.push(choice);
  };
  for (const { entry: e, source, weight: chainWeight } of sources) {
    const w = entryWeight(e, source) * chainWeight;
    if (w <= 0) continue;
    const make = (text: string): Choice => ({ entry: e, text, source });
    if (e.pos.includes('noun')) {
      push('noun', make(e.text), w);
      if (!e.mass) push('nounPl', make(e.forms?.plural ?? pluralize(e.text)), w);
      if (e.forms?.adj) push('adj', make(e.forms.adj), w);
    }
    if (e.pos.includes('adj')) push('adj', make(e.text), w);
    if (e.pos.includes('verb')) push('verb', make(e.text), w);
    if (e.pos.includes('abstract')) push('abstract', make(e.text), w);
    if (e.pos.includes('place')) push('placeWord', make(e.text), w);
    if (e.compound === 'head' || e.compound === 'both') push('compoundHead', make(e.text), w);
    if (e.compound === 'tail' || e.compound === 'both') push('compoundTail', make(e.text.toLowerCase()), w);
    if (e.placeTail) push('placeTail', make(e.text.toLowerCase()), w);
  }
  for (const [slot, list] of pools) pools.set(slot, temper(list, params.temperature));
  if (nounsSeen > 0 && nounsAvoided / nounsSeen > 0.5) notices.push({ code: 'pool-limited', message: 'Some options are limited by your Avoid list.' });

  const genreIds = new Set<string>(genreChain.map(g => g.preset.id));
  const frameWords = new Set(genreChain.flatMap(g => g.preset.frameWords ?? []));
  const vocabWeight = (v: VocabItem, slot: VocabSlot): number => {
    let w = 1;
    if (v.genres?.some(id => genreIds.has(id))) w *= 3;
    if (slot === 'frame' && frameWords.has(v.text)) w *= 3;
    if (v.concepts?.length) {
      let r = 0;
      for (const c of v.concepts) {
        const b = boost.get(c) ?? 1;
        if (b === 0) return 0;
        r = Math.max(r, b);
      }
      w *= r > 1 ? r : 0.6;
    }
    for (const { def, weight } of tones) w *= Math.max(0.1, 1 + (v.tones?.[def.id] ?? 0) * 0.8 * weight);
    const cliche = liftedCliches.has(normalize(v.text)) ? 0 : v.cliche ?? 0;
    return w * (1 - 0.6 * cliche);
  };
  const vocabPool = (items: readonly VocabItem[], slot: VocabSlot): Weighted<VocabChoice>[] =>
    temper(
      items
        .filter(v => !violatesAvoid(v.text, [v.text], avoid))
        .map(v => ({
          item: { text: v.text, concepts: v.concepts ?? [], cliche: liftedCliches.has(normalize(v.text)) ? 0 : v.cliche ?? 0 },
          weight: vocabWeight(v, slot),
        })),
      params.temperature,
    );
  const V = game.vocab;
  const genreSuffixes = genreChain.flatMap(g => g.preset.suffixWords ?? []);
  const wantsFranchise = style?.id === 'franchise' || tones.some(t => t.def.id === 'retro') || genreSuffixes.length === 0;
  const vocab = new Map<VocabSlot, Weighted<VocabChoice>[]>([
    ['frame', vocabPool(V.frames, 'frame')],
    ['frameSuffix', vocabPool(V.frameSuffixes, 'frameSuffix')],
    ['genreSuffix', vocabPool(wantsFranchise ? [...genreSuffixes, ...V.franchiseSuffixes] : genreSuffixes, 'genreSuffix')],
    ['number', vocabPool(V.numbers, 'number')],
    ['ordinal', vocabPool(V.ordinals, 'ordinal')],
    ['digits', vocabPool(V.digits, 'digits')],
    ['prep', vocabPool(V.preps, 'prep')],
    ['predicate', vocabPool(V.predicates, 'predicate')],
    ['epithet', vocabPool(V.epithets, 'epithet')],
  ]);

  const templateWeight = (t: Template): number => {
    if (style?.maxWords !== undefined && t.words[0] > style.maxWords) return 0;
    if (include && !t.variants.some(v => v.some(tok => tok.kind === 'slot' && tok.lock && slotForRole(tok.types, include.role)))) return 0;
    let w = t.base;
    for (const { preset, weight } of genreChain) w *= 1 + ((preset.familyWeights[t.family] ?? 1) - 1) * weight;
    if (style) w *= style.familyWeights[t.family] ?? style.otherFamilies;
    for (const { pack, weight } of mythChain) w *= 1 + ((pack.rhythm[t.family] ?? 1) - 1) * weight;
    for (const { def, weight } of tones) w *= 1 + ((def.familyWeights[t.family] ?? 1) - 1) * weight;
    if (t.rare) w *= params.rareTemplateBoost;
    return w * lengthWeight(t, settings.length, genre.lengthBias);
  };
  const templates = game.templates.map(t => ({ item: t, weight: templateWeight(t) })).filter(x => x.weight > 0);
  const familiesAvailable = new Set(templates.map(x => x.item.family)).size;

  const anchors = [...boost.entries()].filter(([, b]) => b > 1).map(([c, b]) => ({ item: c, weight: b * (userConcepts.has(c) ? 2 : 1) }));
  // Sound bias: a tone may choose the profile only when neither the cultural style nor the genre does.
  const profileId = myth.id !== 'none' ? myth.profile : genre.profile !== 'neutral' ? genre.profile : tones[0]?.def.soundProfile ?? 'neutral';
  const toneMax = tones[0]?.def.maxCoinedLetters;
  const coinedLetters: readonly [number, number] | undefined = style?.brandLetters ?? (toneMax ? [3, toneMax] : undefined);
  const profile = data.profiles.find(p => p.id === profileId) ?? data.profiles.find(p => p.id === 'neutral');
  if (!profile) throw new Error('The neutral phonetic profile is required');
  const coinedRate = Math.min(1, (style?.coinedRate ?? 0.2) * myth.coinedRate);
  const coinedCap = style?.id === 'invented' ? 1 : Math.min(1, Math.max(params.coinedCap, style?.coinedRate ?? 0) * myth.coinedRate);
  const alliterationBonus = tones.reduce((n, t) => n + (t.def.alliterationBonus ?? 0) * t.weight, 0);
  const related = new Map(data.concepts.map(c => [c.id, c.related] as const));
  const labels = new Map(data.concepts.map(c => [c.id, c.label] as const));

  return {
    settings, params, genre, genreChain, myth, mythChain, style, tones, theme, include, avoid, boost, userConcepts, related,
    pools, flatPools, vocab, templates, familiesAvailable, anchors, profile, coinedLetters, coinedRate, coinedCap, liftedCliches,
    alliterationBonus, maxBoost, entryById, symbolicIds, data, game, notices, blocked, entryRelevance,
    conceptLabel: id => labels.get(id) ?? id,
  };
}
