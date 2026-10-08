import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileAvoid, createRng, normalize, parseAvoid, prepareAvoidText, violatesAvoid } from '@vps-name-tools/core';
import { buildContext, narrowTemplates, normalizeSettings, type Context, type Settings, type Template } from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME } from './fixtures/mini-game';

const ctx = (patch: Partial<Settings> = {}): Context =>
  buildContext(normalizeSettings({ ...patch }), MINI, MINI_GAME, createRng('ctx'));

test('genre, myth and user boosts combine and the user word dominates', () => {
  const c = ctx({ genre: 'dark-fantasy', myth: 'norse', themes: 'lantern' });
  assert.ok((c.boost.get('ruin') ?? 1) > 1);
  assert.ok((c.boost.get('cold') ?? 1) > 1);
  const nouns = c.pools.get('noun')!;
  const lantern = nouns.find(w => w.item.entry.id === 'lantern')!;
  const tide = nouns.find(w => w.item.entry.id === 'tide')!;
  assert.ok(lantern.weight > tide.weight * 5, `${lantern.weight} vs ${tide.weight}`);
});

test('Cozy suppresses violent concepts unless the user asks for them', () => {
  assert.ok(!ctx({ genre: 'cozy' }).pools.get('noun')!.some(w => w.item.entry.id === 'blood'));
  assert.ok(ctx({ genre: 'cozy', themes: 'blood' }).pools.get('noun')!.some(w => w.item.entry.id === 'blood'));
});

test('Avoid words are removed from word pools', () => {
  const c = ctx({ avoid: 'frost' });
  assert.ok(!c.pools.get('noun')!.some(w => w.item.text === 'Frost'));
  assert.ok(!(c.pools.get('compoundHead') ?? []).some(w => w.item.text === 'Frost'));
});

test('an Include word that is also avoided blocks generation with a notice', () => {
  const c = ctx({ include: 'Ash', avoid: 'ash' });
  assert.equal(c.blocked, true);
  assert.equal(c.notices[0]?.code, 'include-conflicts-avoid');
});

test('one-word length keeps only one-word templates', () => {
  const c = ctx({ length: 'one' });
  assert.ok(c.templates.length > 0);
  assert.ok(c.templates.every(t => t.item.words[1] === 1));
});

test('the phonetic profile follows the cultural pack, or the genre when None', () => {
  assert.equal(ctx({ genre: 'cozy' }).profile.id, 'soft');
  assert.equal(ctx({ myth: 'norse' }).profile.id, 'norse');
  assert.equal(ctx({}).profile.id, 'neutral');
});

test('templates without a head slot for the Include word are dropped', () => {
  const c = ctx({ include: 'Aeternum' });
  assert.ok(!c.templates.some(t => t.item.id === 'T03'));
  assert.ok(c.templates.some(t => t.item.id === 'T22'));
});

test('mass nouns stay out of plural slots', () => {
  assert.ok(!ctx({}).pools.get('nounPl')!.some(w => w.item.entry.id === 'iron'));
});

test('a tone can set the sound profile when the cultural option is None', () => {
  const tones = MINI.tones.map(t => (t.id === 'cozy' ? { ...t, soundProfile: 'soft' as const, maxCoinedLetters: 8 } : t));
  const c = buildContext(normalizeSettings({ genre: 'fantasy', tone: 'cozy' }), { ...MINI, tones }, MINI_GAME, createRng('ctx'));
  assert.equal(c.profile.id, 'soft');
  assert.deepEqual(c.coinedLetters, [3, 8]);
});

test('Norse rhythm lifts kennings', () => {
  const kenning = (c: Context) => c.templates.find(t => t.item.id === 'T30')?.weight ?? 0;
  assert.ok(kenning(ctx({ myth: 'norse' })) > kenning(ctx({})) * 5);
});

test('typed words lift the cliché penalty for matching frames', () => {
  const frame = (c: Context) => c.vocab.get('frame')!.find(w => w.item.text === 'Echoes')!;
  assert.ok(frame(ctx({ themes: 'echoes' })).weight > frame(ctx({})).weight);
  assert.equal(frame(ctx({ themes: 'echoes' })).item.cliche, 0);
});

// ---- Fix round 1: profile precedence, parent half-strength vocab, penalties, rule coverage ----

const withTones = (patch: (t: (typeof MINI.tones)[number]) => (typeof MINI.tones)[number]) => ({ ...MINI, tones: MINI.tones.map(patch) });
const withNorse = (patch: (m: (typeof MINI.myths)[number]) => (typeof MINI.myths)[number]) => ({
  ...MINI,
  myths: MINI.myths.map(m => (m.id === 'norse' ? patch(m) : m)),
});
const SOFT_TONE = (t: (typeof MINI.tones)[number]) => (t.id === 'cozy' ? { ...t, soundProfile: 'soft' as const, maxCoinedLetters: 8 } : t);

test('a cultural profile wins over a tone sound bias, and the tone letter cap does not apply', () => {
  const c = buildContext(normalizeSettings({ myth: 'norse', tone: 'cozy' }), withTones(SOFT_TONE), MINI_GAME, createRng('ctx'));
  assert.equal(c.profile.id, 'norse');
  assert.equal(c.coinedLetters, undefined);
});

test('the genre profile wins over a tone sound bias, and a neutral-profile pack does not block it', () => {
  const bundle = { ...withTones(SOFT_TONE), myths: MINI.myths.map(m => (m.id === 'norse' ? { ...m, profile: 'neutral' as const } : m)) };
  const c = buildContext(normalizeSettings({ genre: 'cozy', myth: 'norse', tone: 'cozy' }), bundle, MINI_GAME, createRng('ctx'));
  assert.equal(c.profile.id, 'soft');
  assert.equal(c.coinedLetters, undefined);
});

test('a neutral-profile pack falls through to the tone sound bias, with its letter cap', () => {
  const bundle = { ...withTones(SOFT_TONE), myths: MINI.myths.map(m => (m.id === 'norse' ? { ...m, profile: 'neutral' as const } : m)) };
  const c = buildContext(normalizeSettings({ genre: 'fantasy', myth: 'norse', tone: 'cozy' }), bundle, MINI_GAME, createRng('ctx'));
  assert.equal(c.profile.id, 'soft');
  assert.deepEqual(c.coinedLetters, [3, 8]);
});

test('a style brand range wins over everything', () => {
  const c = buildContext(normalizeSettings({ style: 'brandable', tone: 'cozy' }), withTones(SOFT_TONE), MINI_GAME, createRng('ctx'));
  assert.deepEqual(c.coinedLetters, [5, 9]);
});

const taggedGame = (genres: typeof MINI_GAME.genres): typeof MINI_GAME => ({
  ...MINI_GAME,
  genres,
  vocab: { ...MINI_GAME.vocab, frames: [{ text: 'Plain' }, { text: 'Tagged', genres: ['fantasy'] }, { text: 'Tales' }] },
});
const frameWeights = (c: Context) => {
  const f = c.vocab.get('frame')!;
  const plain = f.find(w => w.item.text === 'Plain')!.weight;
  return { tagged: f.find(w => w.item.text === 'Tagged')!.weight / plain, listed: f.find(w => w.item.text === 'Tales')!.weight / plain };
};

test('parent genre vocab tags and frame words count at half strength', () => {
  const game = taggedGame(MINI_GAME.genres);
  const own = frameWeights(buildContext(normalizeSettings({ genre: 'fantasy' }), MINI, game, createRng('ctx')));
  assert.equal(own.tagged, 3);
  assert.equal(own.listed, 3);
  const child = frameWeights(buildContext(normalizeSettings({ genre: 'dark-fantasy' }), MINI, game, createRng('ctx')));
  assert.equal(child.tagged, 2);
  assert.equal(child.listed, 2);
});

test('parent genre concept boosts count at half strength', () => {
  assert.equal(ctx({ genre: 'fantasy', tone: 'grim' }).boost.get('crown'), 2);
  assert.equal(ctx({ genre: 'dark-fantasy', tone: 'grim' }).boost.get('crown'), 1.5);
});

test('genre suffix words merge child first, dedupe by text, and weight the parent at half', () => {
  const genres = MINI_GAME.genres.map(g =>
    g.id === 'dark-fantasy' ? { ...g, suffixWords: [{ text: 'Dirge' }, { text: 'Saga', cliche: 0.5 }] }
      : g.id === 'fantasy' ? { ...g, suffixWords: [{ text: 'saga', cliche: 0 }, { text: 'Legend' }] }
        : g);
  const c = buildContext(normalizeSettings({ genre: 'dark-fantasy' }), MINI, { ...MINI_GAME, genres }, createRng('ctx'));
  const pool = c.vocab.get('genreSuffix')!;
  assert.deepEqual(pool.map(w => w.item.text), ['Dirge', 'Saga', 'Legend']);
  const weight = (t: string) => pool.find(w => w.item.text === t)!.weight;
  assert.equal(weight('Dirge'), 1);
  assert.ok(Math.abs(weight('Saga') - 0.7) < 1e-9, `child cliche applies: ${weight('Saga')}`);
  assert.equal(weight('Legend'), 0.5);
});

const entryIn = (c: Context, id: string, slot: 'noun' | 'nounPl' = 'noun') => c.pools.get(slot)?.find(w => w.item.entry.id === id);

test('a tone penalty below 1 lowers an entry below the baseline weight', () => {
  const penalised = withTones(t => (t.id === 'grim' ? { ...t, conceptBoosts: { ...t.conceptBoosts, war: 0.3 } } : t));
  const settings = normalizeSettings({ genre: 'fantasy', tone: 'grim' });
  const plain = buildContext(settings, MINI, MINI_GAME, createRng('ctx'));
  const low = buildContext(settings, penalised, MINI_GAME, createRng('ctx'));
  const ratio = (c: Context) => entryIn(c, 'iron')!.weight / entryIn(c, 'tide')!.weight;
  assert.ok(Math.abs(ratio(low) / ratio(plain) - 0.3) < 1e-9, `${ratio(low)} vs ${ratio(plain)}`);
  // A boosted concept still leads: oath is boosted by the genre, so the penalty on war does not touch an oath-only entry.
  assert.equal(low.entryRelevance(MINI.lexicon.find(e => e.id === 'vow')!), plain.entryRelevance(MINI.lexicon.find(e => e.id === 'vow')!));
});

test('a mixed entry takes both its boost and its penalty', () => {
  const penalised = withTones(t => (t.id === 'grim' ? { ...t, conceptBoosts: { ...t.conceptBoosts, blood: 0.5 } } : t));
  const settings = normalizeSettings({ genre: 'fantasy', tone: 'grim' });
  const plain = buildContext(settings, MINI, MINI_GAME, createRng('ctx'));
  const low = buildContext(settings, penalised, MINI_GAME, createRng('ctx'));
  const oath = MINI.lexicon.find(e => e.id === 'oath')!; // oath is boosted 1.6, blood is penalised
  assert.ok(Math.abs(low.entryRelevance(oath) - plain.entryRelevance(oath) * 0.5) < 1e-9);
});

test('a tone that zeroes a concept removes its entries unless the user typed the concept', () => {
  const zeroed = withTones(t => (t.id === 'grim' ? { ...t, conceptBoosts: { ...t.conceptBoosts, blood: 0 } } : t));
  const make = (themes: string) => buildContext(normalizeSettings({ genre: 'fantasy', tone: 'grim', themes }), zeroed, MINI_GAME, createRng('ctx'));
  const base = make('');
  for (const id of ['blood', 'pact', 'oath']) assert.equal(entryIn(base, id), undefined, id);
  const typed = make('blood');
  for (const id of ['blood', 'pact']) assert.ok(entryIn(typed, id), id);
  assert.ok((typed.boost.get('blood') ?? 0) > 1);
});

test('a vocab item with a penalised concept is lowered, and a zeroed one is removed', () => {
  const game = { ...MINI_GAME, vocab: { ...MINI_GAME.vocab, frames: [{ text: 'Probe', concepts: ['war'] }, { text: 'Gone', concepts: ['blood'] }] } };
  const tuned = withTones(t => (t.id === 'grim' ? { ...t, conceptBoosts: { ...t.conceptBoosts, war: 0.3, blood: 0 } } : t));
  const settings = normalizeSettings({ genre: 'fantasy', tone: 'grim' });
  const weight = (b: typeof MINI, text: string) =>
    buildContext(settings, b, game, createRng('ctx')).vocab.get('frame')!.find(w => w.item.text === text)!.weight;
  assert.ok(Math.abs(weight(tuned, 'Probe') / weight(MINI, 'Probe') - 0.3) < 1e-9);
  assert.ok(weight(MINI, 'Gone') > 0);
  assert.equal(weight(tuned, 'Gone'), 0);
});

test('user-typed concepts override a genre suppression on vocab items', () => {
  const game = { ...MINI_GAME, vocab: { ...MINI_GAME.vocab, frames: [{ text: 'Requiem', concepts: ['death'] }] } };
  const weight = (themes: string) =>
    buildContext(normalizeSettings({ genre: 'cozy', themes }), MINI, game, createRng('ctx')).vocab.get('frame')![0].weight;
  assert.equal(weight(''), 0);
  assert.ok(weight('death') > 0);
});

test('typing a word lifts the cliche penalty for its plural frame', () => {
  const frame = (c: Context) => c.vocab.get('frame')!.find(w => w.item.text === 'Echoes')!;
  const typed = ctx({ themes: 'echo' });
  assert.equal(frame(typed).item.cliche, 0);
  assert.ok(frame(typed).weight > frame(ctx({})).weight);
  assert.ok(typed.liftedCliches.has('echoes'));
});

test('the second tone counts at half strength', () => {
  const c = ctx({ tone: 'grim', tone2: 'cozy' });
  assert.deepEqual(c.tones.map(t => [t.def.id, t.weight]), [['grim', 1], ['cozy', 0.5]]);
  assert.ok(Math.abs((c.boost.get('home') ?? 0) - (1 + (1.6 - 1) * 0.5)) < 1e-9);
  assert.ok(Math.abs((c.boost.get('ruin') ?? 0) - 1.4) < 1e-9);
});

test('a held selected pack falls back to None', () => {
  const held = withNorse(m => ({ ...m, review: { ...m.review, status: 'held' as const } }));
  const c = buildContext(normalizeSettings({ myth: 'norse' }), held, MINI_GAME, createRng('ctx'));
  assert.equal(c.myth.id, 'none');
  assert.equal(c.profile.id, 'neutral');
});

test('a Tier B pack multiplies the invented-word rate and cap', () => {
  const tierB = withNorse(m => ({ ...m, tier: 'B' as const, coinedRate: 0.5 }));
  const c = buildContext(normalizeSettings({ myth: 'norse' }), tierB, MINI_GAME, createRng('ctx'));
  const none = ctx({});
  assert.ok(Math.abs(c.coinedRate - none.coinedRate * 0.5) < 1e-9);
  assert.ok(Math.abs(c.coinedCap - none.coinedCap * 0.5) < 1e-9);
});

test('a style word limit drops templates whose minimum exceeds it', () => {
  assert.ok(MINI_GAME.templates.some(t => t.words[0] > 2));
  const c = ctx({ style: 'short-punchy' });
  assert.ok(c.templates.length > 0);
  assert.ok(c.templates.every(t => t.item.words[0] <= 2));
});

test('a multi-word Include word cannot fit one-word titles and says so', () => {
  const c = ctx({ include: 'Winter Coast', length: 'one' });
  assert.ok(c.notices.some(n => n.code === 'include-unusable'));
  assert.ok(!ctx({ include: 'Winter Coast', length: 'any' }).notices.some(n => n.code === 'include-unusable'));
});

test('Avoid on a singular word also removes its irregular plural form', () => {
  const c = ctx({ avoid: 'wolf' });
  assert.equal(entryIn(c, 'wolf'), undefined);
  assert.equal(entryIn(c, 'wolf', 'nounPl'), undefined);
  assert.ok(entryIn(ctx({}), 'wolf', 'nounPl'));
  assert.ok(entryIn(ctx({}), 'wolf'));
});

// ---- Avoid is compiled once per build and must match violatesAvoid(text, [text], rules) exactly ----

const AVOID_INPUTS = [
  'wolf', 'wolves', 'ravens', "raven's", 'frost-bound', 'frost-', '-fall', 'ash*', '*ar*', '"frost"', '"stone heart"',
  'memories', 'ASH', '\u00c1sh', 'oath, vow; pact', 'sky, *star*, hold-', "o'clock, ash's", 'ice*, *ice', 'bury; kindle', 'little, hollow, pale',
];

const everyText = (): string[] => {
  const texts = new Set<string>(['', ' ', 'Frost-bound', 'Stone Heart', "Raven's Hollow", 'The Memories', 'Ashfall', 'ICE AGE']);
  for (const e of MINI.lexicon) {
    for (const t of [e.text, e.text.toLowerCase(), e.forms?.plural, e.forms?.adj]) if (t) texts.add(t);
  }
  for (const list of Object.values(MINI_GAME.vocab)) for (const v of list) texts.add(typeof v === 'string' ? v : v.text);
  return [...texts];
};

test('the compiled Avoid matcher agrees with violatesAvoid on every text', () => {
  const texts = everyText();
  for (const input of AVOID_INPUTS) {
    const rules = parseAvoid(input);
    const matches = compileAvoid(rules)!;
    assert.ok(matches, input);
    for (const text of texts) {
      assert.equal(matches(prepareAvoidText(text)), !!violatesAvoid(text, [text], rules), `${JSON.stringify(input)} on ${JSON.stringify(text)}`);
    }
  }
  assert.equal(compileAvoid([]), undefined);
});

test('the Avoid-filtered pools drop exactly the forms violatesAvoid rejects', () => {
  const keys = (c: Context) => {
    const out = new Map<string, string>();
    for (const [slot, list] of c.flatPools) for (const ch of list) out.set(`${slot}|${ch.entry.id}|${ch.text}`, ch.text);
    return out;
  };
  const all = keys(ctx({}));
  assert.ok(all.size > 100);
  for (const input of AVOID_INPUTS) {
    const rules = parseAvoid(input);
    const kept = keys(ctx({ avoid: input }));
    const expectedKept = new Set([...all].filter(([, text]) => !violatesAvoid(text, [text], rules)).map(([k]) => k));
    assert.deepEqual([...kept.keys()].sort(), [...expectedKept].sort(), input);
    const vocabAll = ctx({}).vocab;
    for (const [slot, list] of ctx({ avoid: input }).vocab) {
      const expected = vocabAll.get(slot)!.map(w => w.item.text).filter(t => !violatesAvoid(t, [t], rules));
      assert.deepEqual(list.map(w => w.item.text), expected, `${input} ${slot}`);
    }
  }
});

test('a blocked context is cheap but fully defined', () => {
  const c = ctx({ include: 'Ash', avoid: 'ash' });
  assert.equal(c.blocked, true);
  assert.equal(c.templates.length, 0);
  assert.equal(c.pools.size, 0);
  for (const f of [c.flatPools, c.vocab, c.anchors, c.avoid, c.boost, c.entryById, c.related]) assert.ok(f);
  assert.equal(typeof c.entryRelevance(MINI.lexicon[0]), 'number');
  assert.equal(c.conceptLabel('fire'), 'fire');
});

// ---- Fix round 1: Focused narrows the templates; creativity scales the invented-word rate ----

const families = (c: Context) => new Set(c.templates.map(t => t.item.family));
const order = (id: string) => MINI_GAME.templates.findIndex(t => t.id === id);

test('Focused keeps only the highest-weighted templates', () => {
  const focused = ctx({ creativity: 'focused' });
  const balanced = ctx({ creativity: 'balanced' });
  assert.ok(focused.templates.length < balanced.templates.length, `${focused.templates.length} vs ${balanced.templates.length}`);
  assert.ok(focused.templates.length >= 8);
  assert.ok(families(focused).size >= 4);
  const kept = new Set(focused.templates.map(t => t.item.id));
  const top = [...balanced.templates].sort((a, b) => b.weight - a.weight)[0];
  assert.ok(kept.has(top.item.id), 'the heaviest template stays');
  assert.ok(focused.templates.every((t, i, all) => i === 0 || order(all[i - 1].item.id) < order(t.item.id)), 'template order is kept');
  assert.equal(ctx({ creativity: 'wild' }).templates.length, balanced.templates.length);
});

const synthetic = (weights: readonly number[], family: (i: number) => string) =>
  weights.map((weight, i) => ({ item: { id: `S${i}`, family: family(i) } as unknown as Template, weight }));

test('narrowTemplates keeps the shortest prefix that covers 80% of the weight', () => {
  const all = synthetic([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], i => `f${i % 5}`);
  assert.equal(narrowTemplates(all).length, 16);
  // Weight order, not list order, decides what is kept; the list order is preserved.
  const skew = synthetic([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 30, 30, 30, 30], i => `f${i % 5}`);
  const kept = narrowTemplates(skew).map(t => t.item.id);
  assert.deepEqual(kept.slice(-4), ['S10', 'S11', 'S12', 'S13']);
  assert.equal(kept.length, 8);
});

test('narrowTemplates never keeps fewer than 8 templates or 4 families', () => {
  const heavyTop = synthetic([1000, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], i => `f${i % 6}`);
  assert.equal(narrowTemplates(heavyTop).length, 8);
  // Eight templates of one family are not enough: the prefix runs on until four families are in.
  const oneFamily = synthetic([50, 40, 30, 20, 15, 12, 10, 8, 6, 4, 2, 1], i => (i < 9 ? 'a' : ['b', 'c', 'd'][i - 9]));
  const kept = narrowTemplates(oneFamily);
  assert.equal(new Set(kept.map(t => t.item.family)).size, 4);
  assert.equal(kept.length, 12);
  // Fewer templates than the floor, or fewer families than the floor: everything stays.
  const few = synthetic([5, 4, 3], i => `f${i}`);
  assert.equal(narrowTemplates(few).length, 3);
  const twoFamilies = synthetic([9, 8, 7, 6, 5, 4, 3, 2, 1, 1], i => `f${i % 2}`);
  assert.equal(narrowTemplates(twoFamilies).length, 10);
  assert.deepEqual(narrowTemplates([]), []);
});

test('a style that narrows the families still keeps its floors under Focused', () => {
  for (const style of ['compound', 'short-punchy', 'brandable'] as const) {
    const balanced = ctx({ creativity: 'balanced', style });
    const focused = ctx({ creativity: 'focused', style });
    assert.ok(focused.templates.length >= Math.min(8, balanced.templates.length), `${style}: ${focused.templates.length} of ${balanced.templates.length}`);
    assert.ok(families(focused).size >= Math.min(4, families(balanced).size), style);
    assert.ok(focused.templates.length <= balanced.templates.length);
  }
});

test('Focused narrowing never empties a context that has templates', () => {
  for (const patch of [{ length: 'one' as const }, { include: 'Aeternum' }, { style: 'invented' as const }]) {
    assert.ok(ctx({ ...patch, creativity: 'focused' }).templates.length > 0, JSON.stringify(patch));
  }
});

test('the invented-word rate follows the creativity level unless the style sets it', () => {
  assert.deepEqual(['focused', 'balanced', 'wild'].map(creativity => ctx({ creativity: creativity as Settings['creativity'] }).coinedRate), [0.1, 0.2, 0.35]);
  const brandable = ['focused', 'balanced', 'wild'].map(creativity => ctx({ creativity: creativity as Settings['creativity'], style: 'brandable' }).coinedRate);
  assert.deepEqual(brandable, [0.6, 0.6, 0.6]);
});

test('pooled choices carry their normalised text', () => {
  const c = ctx({ genre: 'dark-fantasy', myth: 'norse' });
  let lexical = 0;
  for (const pool of c.pools.values()) {
    for (const w of pool) {
      assert.equal(w.item.norm, normalize(w.item.text));
      lexical++;
    }
  }
  for (const pool of c.vocab.values()) for (const w of pool) assert.equal(w.item.norm, normalize(w.item.text));
  assert.ok(lexical > 20);
});
