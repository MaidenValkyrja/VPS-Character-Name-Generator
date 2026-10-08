import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, selectDiverse, jaccard, type Candidate, type SelectOptions } from '../src/index';

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

// Pool and configs are shared with the capture run that recorded the expected keys.
const POOL_VOCAB = Array.from({ length: 40 }, (_, i) => `w${i}`);

/** Deterministic 200-candidate pool with duplicate keys, score ties, shared features and cap keys. */
function pool200(): Candidate[] {
  const rng = createRng('select-equivalence');
  return Array.from({ length: 200 }, () => {
    const features = new Set<string>();
    const n = 2 + Math.floor(rng() * 4);
    for (let j = 0; j < n; j++) features.add(POOL_VOCAB[Math.floor(rng() * POOL_VOCAB.length)]);
    return {
      key: `k${Math.floor(rng() * 190)}`,
      score: Math.floor(rng() * 5) / 4,
      family: `f${Math.floor(rng() * 6)}`,
      features,
      capKeys: rng() < 0.5 ? [`c${Math.floor(rng() * 8)}`] : [],
    };
  });
}

const POOL_CONFIGS: SelectOptions[] = [
  { count: 15, familyCap: () => 4, capLimit: () => 2, diversity: 0.5 },
  { count: 20, familyCap: f => (f === 'f0' ? 2 : 6), capLimit: () => Infinity, diversity: 0 },
  { count: 30, familyCap: () => 3, capLimit: () => 1, diversity: 1 },
];

test('a deterministic 200-candidate pool selects the same keys as before', () => {
  const expected = [
    ["k82", "k160", "k159", "k116", "k60", "k175", "k57", "k16", "k12", "k166", "k65", "k33", "k20", "k133", "k127"],
    ["k82", "k160", "k84", "k65", "k159", "k175", "k94", "k116", "k20", "k184", "k60", "k93", "k57", "k133", "k69", "k166", "k149", "k16", "k127", "k61"],
    ["k82", "k160", "k159", "k116", "k60", "k175", "k57", "k16", "k12", "k65", "k20", "k93", "k84", "k184", "k111", "k151", "k53", "k29", "k39", "k87", "k8", "k112", "k166", "k134", "k137", "k122", "k37", "k102", "k52", "k98"],
  ];
  POOL_CONFIGS.forEach((opts, i) => {
    assert.deepEqual(selectDiverse(pool200(), opts).map(c => c.key), expected[i], `config ${i}`);
  });
});
