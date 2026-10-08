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
