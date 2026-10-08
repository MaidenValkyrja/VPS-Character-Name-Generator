import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, hash32, pickWeighted, temper, shuffle, chance } from '../src/index';

test('the same seed gives the same sequence', () => {
  const a = createRng('abc');
  const b = createRng('abc');
  assert.deepEqual(Array.from({ length: 8 }, () => a()), Array.from({ length: 8 }, () => b()));
});

test('different seeds give different sequences', () => {
  assert.notDeepEqual(
    Array.from({ length: 4 }, createRng('abc')),
    Array.from({ length: 4 }, createRng('abd')),
  );
});

test('values stay in [0, 1)', () => {
  const r = createRng('range');
  for (let i = 0; i < 20000; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1, String(v));
  }
});

test('pickWeighted is roughly proportional to weight', () => {
  const r = createRng('weights');
  const counts = { a: 0, b: 0 };
  for (let i = 0; i < 20000; i++) {
    const k = pickWeighted(r, [{ item: 'a' as const, weight: 1 }, { item: 'b' as const, weight: 3 }]);
    counts[k!]++;
  }
  const ratio = counts.b / counts.a;
  assert.ok(ratio > 2.7 && ratio < 3.3, String(ratio));
});

test('pickWeighted ignores zero weights and returns undefined when nothing is positive', () => {
  const r = createRng('zero');
  for (let i = 0; i < 200; i++) assert.equal(pickWeighted(r, [{ item: 'x', weight: 0 }, { item: 'y', weight: 2 }]), 'y');
  assert.equal(pickWeighted(r, [{ item: 'x', weight: 0 }]), undefined);
  assert.equal(pickWeighted(r, []), undefined);
});

test('temper sharpens below 1 and flattens above 1', () => {
  const items = [{ item: 'a', weight: 1 }, { item: 'b', weight: 4 }];
  const sharp = temper(items, 0.5);
  assert.equal(sharp[1].weight / sharp[0].weight, 16);
  const flat = temper(items, 2);
  assert.equal(flat[1].weight / flat[0].weight, 2);
});

test('shuffle returns a deterministic permutation', () => {
  const xs = [1, 2, 3, 4, 5, 6];
  const s1 = shuffle(createRng('s'), xs);
  const s2 = shuffle(createRng('s'), xs);
  assert.deepEqual(s1, s2);
  assert.deepEqual([...s1].sort(), xs);
  assert.deepEqual(xs, [1, 2, 3, 4, 5, 6]);
});

test('chance respects 0 and 1', () => {
  const r = createRng('c');
  assert.equal(chance(r, 0), false);
  assert.equal(chance(r, 1), true);
});

test('hash32 is stable 8-character hex', () => {
  assert.equal(hash32('ashen oath'), hash32('ashen oath'));
  assert.match(hash32('x'), /^[0-9a-f]{8}$/);
  assert.notEqual(hash32('a'), hash32('b'));
});
