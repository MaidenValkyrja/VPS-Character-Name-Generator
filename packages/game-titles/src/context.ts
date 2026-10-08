import {
  compileAvoid, lemmaCandidates, normalize, parseAvoid, parseThemes, pluralize, prepareAvoidText, sanitizeInput, temper, titleCase,
  violatesAvoid,
  type AvoidRule, type AvoidText, type PhoneticProfile, type PhraseRole, type Rng, type SteeringIndex, type ThemeProfile, type Weighted,
} from '@vps-name-tools/core';
import { buildSteeringIndex, type DataBundle, type LexEntry, type MythPack, type ToneDef } from '@vps-name-tools/data';
import { CREATIVITY, type CreativityParams, type Settings } from './settings';
import type { LengthOption, SlotType } from './ids';
import type { GameData, GenrePreset, LengthBias, Notice, StyleDef, Template, VocabItem } from './types';

export type LexSlot = 'noun' | 'nounPl' | 'adj' | 'verb' | 'abstract' | 'placeWord' | 'compoundHead' | 'compoundTail' | 'placeTail';
export type VocabSlot = 'frame' | 'frameSuffix' | 'genreSuffix' | 'number' | 'ordinal' | 'digits' | 'prep' | 'predicate' | 'epithet';
export type Source = 'core' | 'genre' | 'myth' | 'symbolic';

export interface Choice {
  readonly entry: LexEntry;
  readonly text: string;
  /** normalize(text), computed once with the bundle cache so picks do not fold strings. */
  readonly norm: string;
  readonly source: Source;
}
export interface VocabChoice {
  readonly text: string;
  /** normalize(text), computed once per build. */
  readonly norm: string;
  readonly concepts: readonly string[];
  readonly cliche: number;
}
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
  /** Chance that a name slot becomes an invented word: the style's rate, else the creativity level's cap. */
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

/** A piece of text prepared once for Avoid matching, with the verdict of the latest build that asked. */
interface Probe {
  readonly text: AvoidText;
  stamp: number;
  hit: boolean;
}

/** One place an entry can appear in a pool: the shared Choice, and its Avoid probe once someone asks. */
interface Form {
  readonly slot: LexSlot;
  readonly choice: Choice;
  probe?: Probe;
}

/** An entry's settings-independent pool forms. */
interface EntryRec {
  readonly entry: LexEntry;
  readonly bonus: number;
  /** Normalised text, for the cliche lift. */
  readonly norm: string;
  readonly forms: readonly Form[];
}

/** Everything about a bundle and game that does not depend on the settings. Built once, reused by every call. */
interface BundleCache {
  readonly index: SteeringIndex;
  readonly entryById: ReadonlyMap<string, LexEntry>;
  readonly related: ReadonlyMap<string, readonly string[]>;
  readonly labels: ReadonlyMap<string, string>;
  recsOf(list: readonly LexEntry[], source: Source): readonly EntryRec[];
  probeOf(text: string): Probe;
}

const NO_ENTRIES: readonly LexEntry[] = [];

function recFor(e: LexEntry, source: Source): EntryRec {
  const forms: Form[] = [];
  const add = (slot: LexSlot, text: string) => forms.push({ slot, choice: { entry: e, text, norm: normalize(text), source } });
  if (e.pos.includes('noun')) {
    add('noun', e.text);
    if (!e.mass) add('nounPl', e.forms?.plural ?? pluralize(e.text));
    if (e.forms?.adj) add('adj', e.forms.adj);
  }
  if (e.pos.includes('adj')) add('adj', e.text);
  if (e.pos.includes('verb')) add('verb', e.text);
  if (e.pos.includes('abstract')) add('abstract', e.text);
  if (e.pos.includes('place')) add('placeWord', e.text);
  if (e.compound === 'head' || e.compound === 'both') add('compoundHead', e.text);
  if (e.compound === 'tail' || e.compound === 'both') add('compoundTail', e.text.toLowerCase());
  if (e.placeTail) add('placeTail', e.text.toLowerCase());
  return { entry: e, bonus: SOURCE_BONUS[source], norm: normalize(e.text), forms };
}

function createCache(data: DataBundle, game: GameData): BundleCache {
  const entryById = new Map<string, LexEntry>();
  for (const e of [...data.lexicon, ...data.myths.flatMap(m => [...m.imagery, ...m.symbolic]), ...game.genres.flatMap(g => g.entries ?? [])]) entryById.set(e.id, e);
  const recs = new Map<readonly LexEntry[], readonly EntryRec[]>();
  const probes = new Map<string, Probe>();
  const byCanon = new Map<string, Probe>();
  return {
    index: buildSteeringIndex(data, game.genres.flatMap(g => g.entries ?? [])),
    entryById,
    related: new Map(data.concepts.map(c => [c.id, c.related] as const)),
    labels: new Map(data.concepts.map(c => [c.id, c.label] as const)),
    recsOf(list, source) {
      let out = recs.get(list);
      if (!out) {
        out = list.map(e => recFor(e, source));
        recs.set(list, out);
      }
      return out;
    },
    probeOf(text) {
      let probe = probes.get(text);
      if (!probe) {
        const prepared = prepareAvoidText(text);
        // Texts that differ only in case or punctuation share one probe.
        const canon = prepared.spaced;
        probe = byCanon.get(canon);
        if (!probe) {
          probe = { text: prepared, stamp: 0, hit: false };
          byCanon.set(canon, probe);
        }
        probes.set(text, probe);
      }
      return probe;
    },
  };
}

const bundleCaches = new WeakMap<DataBundle, WeakMap<GameData, BundleCache>>();
function cacheFor(data: DataBundle, game: GameData): BundleCache {
  let byGame = bundleCaches.get(data);
  if (!byGame) {
    byGame = new WeakMap();
    bundleCaches.set(data, byGame);
  }
  let cache = byGame.get(game);
  if (!cache) {
    cache = createCache(data, game);
    byGame.set(game, cache);
  }
  return cache;
}

export function steeringIndexFor(data: DataBundle, game: GameData): SteeringIndex {
  return cacheFor(data, game).index;
}

/** Builds the settings-independent data of a bundle: the cache and every pool form, for all genres and packs. */
export function prewarmBundle(data: DataBundle, game: GameData): void {
  const cache = cacheFor(data, game);
  cache.recsOf(data.lexicon, 'core');
  for (const g of game.genres) if (g.entries) cache.recsOf(g.entries, 'genre');
  for (const m of data.myths) {
    cache.recsOf(m.imagery, 'myth');
    cache.recsOf(m.symbolic, 'symbolic');
  }
}

/** Each build that has Avoid rules takes a fresh stamp, so a shared probe is evaluated once per build. */
let buildStamp = 0;

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

/** Focused: the share of the template weight kept, and the fewest templates and families it may narrow to. */
const FOCUSED_COVERAGE = 0.8;
const FOCUSED_MIN_TEMPLATES = 8;
const FOCUSED_MIN_FAMILIES = 4;

/**
 * The highest-weighted templates: the shortest prefix, by weight, that covers 80% of the total weight, extended until
 * it holds at least 8 templates and 4 families (or every template is in). The list keeps its order.
 */
export function narrowTemplates(all: readonly Weighted<Template>[]): readonly Weighted<Template>[] {
  if (all.length <= FOCUSED_MIN_TEMPLATES) return all;
  const byWeight = all.map((_, i) => i).sort((a, b) => all[b].weight - all[a].weight || a - b);
  const total = all.reduce((n, w) => n + w.weight, 0);
  const families = new Set<string>();
  let covered = 0;
  let n = 0;
  while (n < byWeight.length && (covered < FOCUSED_COVERAGE * total || n < FOCUSED_MIN_TEMPLATES || families.size < FOCUSED_MIN_FAMILIES)) {
    const w = all[byWeight[n++]];
    covered += w.weight;
    families.add(w.item.family);
  }
  const keep = new Set(byWeight.slice(0, n));
  return all.filter((_, i) => keep.has(i));
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
  const cache = cacheFor(data, game);
  const { index, entryById } = cache;
  const theme = parseThemes(settings.themes, index);
  const avoid = parseAvoid(settings.avoid);
  const avoids = compileAvoid(avoid);
  const stamp = ++buildStamp;
  // True when the text matches an Avoid rule. Each distinct text is evaluated once per build.
  const hits = (probe: Probe): boolean => {
    if (!avoids) return false;
    if (probe.stamp !== stamp) {
      probe.stamp = stamp;
      probe.hit = avoids(probe.text);
    }
    return probe.hit;
  };
  const avoided = (text: string): boolean => !!avoids && hits(cache.probeOf(text));

  const symbolicIds = new Set(mythChain.flatMap(({ pack }) => pack.symbolic.map(e => e.id)));

  const include = resolveInclude(settings.include, index, entryById);
  let blocked = false;
  // An Include word with no letter or digit (symbols, or a script this tool cannot render) can never appear in a title.
  const unusable = !!include && !/[a-z0-9]/.test(include.norm);
  if (unusable) {
    blocked = true;
    notices.push({ code: 'include-unusable', message: 'Your Include word has no letters or digits this tool can use. Try a word written in Latin letters.' });
  } else if (include && violatesAvoid(include.text, [include.text], avoid)) {
    blocked = true;
    notices.push({ code: 'include-conflicts-avoid', message: 'Your Include word is also on your Avoid list. Remove it from one of them to generate titles.' });
  }
  if (include && !unusable && settings.length === 'one' && include.text.includes(' ')) {
    notices.push({ code: 'include-unusable', message: 'A multi-word Include word cannot fit one-word titles. Try Any or Short length.' });
  }

  const boost = new Map<string, number>();
  const mul = (c: string, v: number, w: number) => boost.set(c, (boost.get(c) ?? 1) * (1 + (v - 1) * w));
  for (const { preset, weight } of genreChain) for (const [c, v] of Object.entries(preset.conceptBoosts)) mul(c, v, weight);
  for (const { pack, weight } of mythChain) for (const [c, v] of Object.entries(pack.conceptBoosts)) mul(c, v, weight);
  for (const { def, weight } of tones) for (const [c, v] of Object.entries(def.conceptBoosts)) mul(c, v, weight);
  const userConcepts = new Set(theme.conceptBoosts.keys());
  // A concept the user typed starts over at 1 when a tone or pack zeroed it: the user's identity wins.
  for (const c of userConcepts) if (boost.get(c) === 0) boost.set(c, 1);
  for (const [c, v] of theme.conceptBoosts) mul(c, v, 1);
  const suppressed = new Set(genreChain.flatMap(g => g.preset.suppress ?? []).filter(c => !userConcepts.has(c)));
  for (const c of suppressed) boost.set(c, 0);
  const maxBoost = Math.max(2, ...boost.values());

  const liftedCliches = new Set<string>();
  const typed = settings.themes || settings.include ? normalize(`${settings.themes} ${settings.include}`) : '';
  for (const w of typed ? typed.split(/[\s-]+/) : []) {
    if (!w) continue;
    // Typed "echo" must lift "Echoes": pluralize() gives "echos", so words ending in "o" also take "-es".
    for (const form of [w, `${w}s`, pluralize(w), ...(w.endsWith('o') ? [`${w}es`] : []), ...lemmaCandidates(w)]) liftedCliches.add(form);
  }
  const lifted = (norm: string): boolean => liftedCliches.size > 0 && liftedCliches.has(norm);

  const namedFamilies = new Set<string>();
  for (const id of theme.entryBoosts.keys()) {
    const family = entryById.get(id)?.family;
    if (family) namedFamilies.add(family);
  }

  const entryRelevance = (e: LexEntry): number => {
    const named = theme.entryBoosts.has(e.id);
    let max = 0;
    let min = Infinity;
    for (const c of e.concepts) {
      const b = boost.get(c) ?? 1;
      if (b === 0 && !named) return 0;
      max = Math.max(max, b);
      min = Math.min(min, b);
    }
    if (named) return Math.max(max, 1);
    return (max > 1 ? max : params.baseline) * (min < 1 ? min : 1);
  };

  // Sound bias: a tone chooses the profile (and its letter cap applies) only when neither a non-neutral
  // cultural profile nor a non-neutral genre profile does.
  const packProfile = myth.id !== 'none' && myth.profile !== 'neutral';
  const toneBias = !packProfile && genre.profile === 'neutral';
  const profileId = packProfile ? myth.profile : genre.profile !== 'neutral' ? genre.profile : tones[0]?.def.soundProfile ?? 'neutral';
  const toneMax = toneBias ? tones[0]?.def.maxCoinedLetters : undefined;
  const coinedLetters: readonly [number, number] | undefined = style?.brandLetters ?? (toneMax ? [3, toneMax] : undefined);
  const profile = data.profiles.find(p => p.id === profileId) ?? data.profiles.find(p => p.id === 'neutral');
  if (!profile) throw new Error('The neutral phonetic profile is required');
  const coinedRate = Math.min(1, (style?.coinedRate ?? params.coinedCap) * myth.coinedRate);
  const coinedCap = style?.id === 'invented' ? 1 : Math.min(1, Math.max(params.coinedCap, style?.coinedRate ?? 0) * myth.coinedRate);
  const alliterationBonus = tones.reduce((n, t) => n + (t.def.alliterationBonus ?? 0) * t.weight, 0);

  const finish = (
    pools: ReadonlyMap<LexSlot, readonly Weighted<Choice>[]>,
    flatPools: ReadonlyMap<LexSlot, readonly Choice[]>,
    vocab: ReadonlyMap<VocabSlot, readonly Weighted<VocabChoice>[]>,
    templates: readonly Weighted<Template>[],
    anchors: readonly Weighted<string>[],
  ): Context => ({
    settings, params, genre, genreChain, myth, mythChain, style, tones, theme, include, avoid, boost, userConcepts,
    related: cache.related, pools, flatPools, vocab, templates, familiesAvailable: new Set(templates.map(x => x.item.family)).size,
    anchors, profile, coinedLetters, coinedRate, coinedCap, liftedCliches, alliterationBonus, maxBoost, entryById, symbolicIds,
    data, game, notices, blocked, entryRelevance, conceptLabel: id => cache.labels.get(id) ?? id,
  });
  // A blocked build generates nothing, so skip the pools: callers read only the notices and the flag.
  if (blocked) return finish(new Map(), new Map(), new Map(), [], []);

  const entryWeight = (rec: EntryRec): number => {
    const e = rec.entry;
    const relevance = entryRelevance(e);
    if (relevance === 0) return 0;
    let w = relevance * rec.bonus;
    for (const { def, weight } of tones) w *= Math.max(0.1, 1 + (e.tones?.[def.id] ?? 0) * 0.8 * weight);
    w *= style?.register?.[e.register] ?? 1;
    const named = theme.entryBoosts.get(e.id);
    if (named) w *= named;
    else if (e.family && namedFamilies.has(e.family)) w *= 1.5;
    const cliche = lifted(rec.norm) ? 0 : e.cliche ?? 0;
    return w * (1 - 0.6 * cliche);
  };

  const pools = new Map<LexSlot, Weighted<Choice>[]>();
  const flatPools = new Map<LexSlot, Choice[]>();
  let nounsSeen = 0;
  let nounsAvoided = 0;
  // Weights are tempered as they are pooled: the same power transform as temper(), without a second pass.
  const power = 1 / params.temperature;
  const lists: { recs: readonly EntryRec[]; weight: number }[] = [
    { recs: cache.recsOf(data.lexicon, 'core'), weight: 1 },
    ...genreChain.map(({ preset, weight }) => ({ recs: cache.recsOf(preset.entries ?? NO_ENTRIES, 'genre'), weight })),
    ...mythChain.flatMap(({ pack, weight }) => [
      { recs: cache.recsOf(pack.imagery, 'myth'), weight },
      { recs: cache.recsOf(pack.symbolic, 'symbolic'), weight },
    ]),
  ];
  for (const { recs, weight: chainWeight } of lists) {
    for (const rec of recs) {
      const w = entryWeight(rec) * chainWeight;
      if (w <= 0) continue;
      const pooled = power === 1 ? w : Math.pow(w, power);
      for (const f of rec.forms) {
        if (f.slot === 'noun') nounsSeen++;
        if (avoids && hits((f.probe ??= cache.probeOf(f.choice.text)))) {
          if (f.slot === 'noun') nounsAvoided++;
          continue;
        }
        let pool = pools.get(f.slot);
        let flat = flatPools.get(f.slot);
        if (!pool || !flat) {
          pool = [];
          flat = [];
          pools.set(f.slot, pool);
          flatPools.set(f.slot, flat);
        }
        pool.push({ item: f.choice, weight: pooled });
        flat.push(f.choice);
      }
    }
  }
  if (nounsSeen > 0 && nounsAvoided / nounsSeen > 0.5) notices.push({ code: 'pool-limited', message: 'Some options are limited by your Avoid list.' });

  // Genre tags and frame words lift x3 for the chosen genre and x2 for its parent: 1 + (3 - 1) * chain weight.
  const genreWeight = new Map<string, number>(genreChain.map(g => [g.preset.id, g.weight]));
  const frameWordWeight = new Map<string, number>();
  for (const { preset, weight } of genreChain) {
    for (const word of preset.frameWords ?? []) frameWordWeight.set(word, Math.max(frameWordWeight.get(word) ?? 0, weight));
  }
  const vocabWeight = (v: VocabItem, slot: VocabSlot): number => {
    let w = 1;
    let tag = 0;
    for (const id of v.genres ?? []) tag = Math.max(tag, genreWeight.get(id) ?? 0);
    if (tag > 0) w *= 1 + 2 * tag;
    const framed = slot === 'frame' ? frameWordWeight.get(v.text) : undefined;
    if (framed) w *= 1 + 2 * framed;
    if (v.concepts?.length) {
      let max = 0;
      let min = Infinity;
      for (const c of v.concepts) {
        const b = boost.get(c) ?? 1;
        if (b === 0) return 0;
        max = Math.max(max, b);
        min = Math.min(min, b);
      }
      w *= (max > 1 ? max : 0.6) * (min < 1 ? min : 1);
    }
    for (const { def, weight } of tones) w *= Math.max(0.1, 1 + (v.tones?.[def.id] ?? 0) * 0.8 * weight);
    const cliche = lifted(normalize(v.text)) ? 0 : v.cliche ?? 0;
    return w * (1 - 0.6 * cliche);
  };
  const vocabPool = (items: readonly { readonly v: VocabItem; readonly scale: number }[], slot: VocabSlot): Weighted<VocabChoice>[] =>
    temper(
      items
        .filter(({ v }) => !avoided(v.text))
        .map(({ v, scale }) => {
          const norm = normalize(v.text);
          return {
            item: { text: v.text, norm, concepts: v.concepts ?? [], cliche: lifted(norm) ? 0 : v.cliche ?? 0 },
            weight: vocabWeight(v, slot) * scale,
          };
        }),
      params.temperature,
    );
  const plain = (items: readonly VocabItem[]) => items.map(v => ({ v, scale: 1 }));
  const V = game.vocab;
  // Suffix words: the chosen genre's first, then each parent's that are not already present, at the parent's chain weight.
  const genreSuffixes: { v: VocabItem; scale: number }[] = [];
  const seenSuffixes = new Set<string>();
  for (const { preset, weight } of genreChain) {
    for (const v of preset.suffixWords ?? []) {
      const key = normalize(v.text);
      if (seenSuffixes.has(key)) continue;
      seenSuffixes.add(key);
      genreSuffixes.push({ v, scale: weight });
    }
  }
  const wantsFranchise = style?.id === 'franchise' || tones.some(t => t.def.id === 'retro') || genreSuffixes.length === 0;
  const vocab = new Map<VocabSlot, Weighted<VocabChoice>[]>([
    ['frame', vocabPool(plain(V.frames), 'frame')],
    ['frameSuffix', vocabPool(plain(V.frameSuffixes), 'frameSuffix')],
    ['genreSuffix', vocabPool(wantsFranchise ? [...genreSuffixes, ...plain(V.franchiseSuffixes)] : genreSuffixes, 'genreSuffix')],
    ['number', vocabPool(plain(V.numbers), 'number')],
    ['ordinal', vocabPool(plain(V.ordinals), 'ordinal')],
    ['digits', vocabPool(plain(V.digits), 'digits')],
    ['prep', vocabPool(plain(V.preps), 'prep')],
    ['predicate', vocabPool(plain(V.predicates), 'predicate')],
    ['epithet', vocabPool(plain(V.epithets), 'epithet')],
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
  const weighted = game.templates.map(t => ({ item: t, weight: templateWeight(t) })).filter(x => x.weight > 0);
  const templates = settings.creativity === 'focused' ? narrowTemplates(weighted) : weighted;

  const anchors = [...boost.entries()].filter(([, b]) => b > 1).map(([c, b]) => ({ item: c, weight: b * (userConcepts.has(c) ? 2 : 1) }));
  return finish(pools, flatPools, vocab, templates, anchors);
}
