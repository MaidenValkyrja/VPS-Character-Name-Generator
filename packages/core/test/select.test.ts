import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectDiverse, jaccard, type Candidate } from '../src/index';

const cand = (key: string, score: number, family = 'f', features: string[] = [key], capKeys: string[] = []): Candidate =>
  ({ key, score, family, features: new Set(features), capKeys });

const open = { familyCap: () => Infinity, capLimit: () => Infinity, diversity: 0 };

test('picks the highest scores without caps', () => {
  const out = selectDiverse([cand('a', 1), cand('b', 3), cand('c', 2)], { ...open, count: 2 });
  assert.deepEqual(out.map(c => c.key), ['b', 'c']);
});

test('removes duplicate keys', () => {
  const out = selectDiverse([cand('a', 2), cand('a', 1), cand('b', 1)], { ...open, count: 3 });
  assert.deepEqual(out.map(c => c.key), ['a', 'b']);
});

test('respects family caps when possible', () => {
  const xs = [cand('a', 5, 'x'), cand('b', 4, 'x'), cand('c', 1, 'y')];
  const out = selectDiverse(xs, { ...open, count: 2, familyCap: f => (f === 'x' ? 1 : 5) });
  assert.deepEqual(out.map(c => c.key), ['a', 'c']);
});

test('respects cap keys when possible', () => {
  const xs = [cand('a', 5, 'f', ['a'], ['word:ash']), cand('b', 4, 'f', ['b'], ['word:ash']), cand('c', 1)];
  const out = selectDiverse(xs, { ...open, count: 2, capLimit: k => (k === 'word:ash' ? 1 : Infinity) });
  assert.deepEqual(out.map(c => c.key), ['a', 'c']);
});

test('relaxes caps to fill the batch', () => {
  const xs = [cand('a', 3, 'x'), cand('b', 2, 'x'), cand('c', 1, 'x')];
  const out = selectDiverse(xs, { ...open, count: 3, familyCap: () => 1 });
  assert.equal(out.length, 3);
});

test('diversity prefers dissimilar candidates', () => {
  const xs = [cand('a', 1.0, 'f', ['ash', 'oath']), cand('b', 0.95, 'f', ['ash', 'oath']), cand('c', 0.9, 'f', ['frost', 'crown'])];
  const out = selectDiverse(xs, { ...open, count: 2, diversity: 0.5 });
  assert.deepEqual(out.map(c => c.key), ['a', 'c']);
});

test('jaccard', () => {
  assert.equal(jaccard(new Set(['a', 'b']), new Set(['b', 'c'])), 1 / 3);
  assert.equal(jaccard(new Set(), new Set()), 0);
});
