import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate, titleKey, type Settings } from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME } from './fixtures/mini-game';

const run = (patch: Partial<Settings> = {}, seed = 'seed', exclude?: Set<string>) =>
  generate(patch, { seed, data: MINI, game: MINI_GAME, exclude });

test('returns the requested number of titles for the defaults', () => {
  assert.equal(run().titles.length, 10);
  assert.equal(run({ count: 20 }).titles.length, 20);
});

test('is deterministic for a seed', () => {
  assert.deepEqual(run({}, 'x').titles.map(t => t.title), run({}, 'x').titles.map(t => t.title));
  assert.notDeepEqual(run({}, 'x').titles.map(t => t.title), run({}, 'y').titles.map(t => t.title));
});

test('every title contains the Include word', () => {
  const r = run({ include: 'Aeternum' });
  assert.ok(r.titles.length >= 5);
  for (const t of r.titles) assert.match(t.title, /Aeternum/);
});

test('Avoid words never appear', () => {
  for (const seed of ['a', 'b', 'c']) {
    for (const t of run({ avoid: 'oath, *frost*' }, seed).titles) {
      assert.doesNotMatch(t.title, /\boaths?\b/i, t.title);
      assert.doesNotMatch(t.title, /frost/i, t.title);
    }
  }
});

test('no template family exceeds 30% of a batch of ten', () => {
  for (const seed of ['a', 'b', 'c']) {
    const counts = new Map<string, number>();
    for (const t of run({}, seed).titles) counts.set(t.recipe.family, (counts.get(t.recipe.family) ?? 0) + 1);
    assert.ok(Math.max(...counts.values()) <= 3, JSON.stringify([...counts]));
  }
});

test('titles are unique and excluded titles are not repeated', () => {
  const first = run({}, 'u');
  const keys = first.titles.map(t => titleKey(t.title));
  assert.equal(new Set(keys).size, keys.length);
  const second = run({}, 'u', new Set(keys));
  for (const t of second.titles) assert.ok(!keys.includes(titleKey(t.title)), t.title);
});

test('an Include word on the Avoid list gives no titles and a notice', () => {
  const r = run({ include: 'Ash', avoid: 'ash' });
  assert.equal(r.titles.length, 0);
  assert.equal(r.notices[0]?.code, 'include-conflicts-avoid');
});

test('notes are short and name the cultural style', () => {
  const r = run({ genre: 'dark-fantasy', myth: 'norse' });
  for (const t of r.titles) assert.ok(t.meta.note.length <= 100, t.meta.note);
  assert.ok(r.titles.some(t => t.meta.note.includes('Norse')));
});

test('known titles are never produced', () => {
  for (const seed of ['k1', 'k2', 'k3', 'k4', 'k5']) {
    for (const t of run({ length: 'one', style: 'compound', genre: 'dark-fantasy' }, seed).titles) {
      assert.ok(!['ashfall', 'frostbound'].includes(titleKey(t.title)), t.title);
    }
  }
});

test('themes steer without appearing in every title', () => {
  const r = run({ themes: 'lantern, aurora' });
  const literal = r.titles.filter(t => t.recipe.parts.some(p => p.kind === 'user')).length;
  assert.ok(literal >= 1 && literal <= 7, String(literal));
});
