import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '@vps-name-tools/core';
import { buildContext, normalizeSettings, type Context, type Settings } from '../src/index';
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
