import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate, generateSimilar, titleKey, type RecipePart, type Settings, type TitleResult } from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME } from './fixtures/mini-game';

const opts = { data: MINI, game: MINI_GAME };
const run = (patch: Partial<Settings>, seed: string) => generate(patch, { ...opts, seed });
const sourceOf = (titles: readonly TitleResult[]) =>
  titles.find(t => ['adj-noun', 'pair', 'of-phrase', 'the-noun'].includes(t.recipe.family)) ?? titles[0];
const headText = (t: TitleResult) => t.recipe.parts.find(p => p.kind !== 'literal' && p.index === t.recipe.headSlot)?.text ?? '';

test('returns related titles and never repeats the source', () => {
  const src = sourceOf(run({ genre: 'dark-fantasy', count: 20 }, 'sim').titles);
  const r = generateSimilar(src, { ...opts, seed: 's1' });
  assert.ok(r.titles.length >= 4, String(r.titles.length));
  for (const t of r.titles) assert.notEqual(titleKey(t.title), titleKey(src.title));
});

test('at least one result keeps the head word and at least two families appear', () => {
  const src = sourceOf(run({ genre: 'dark-fantasy', count: 20 }, 'sim').titles);
  const r = generateSimilar(src, { ...opts, seed: 's2' });
  const head = headText(src).toLowerCase();
  assert.ok(r.titles.some(t => t.title.toLowerCase().includes(head)), `${head} in ${r.titles.map(t => t.title)}`);
  assert.ok(new Set(r.titles.map(t => t.recipe.family)).size >= 2);
});

test('several strategies are represented', () => {
  const src = sourceOf(run({ genre: 'dark-fantasy', count: 20 }, 'sim').titles);
  const r = generateSimilar(src, { ...opts, seed: 's3' });
  assert.ok(new Set(r.titles.map(t => t.recipe.strategy)).size >= 2);
});

test('the Include word is kept', () => {
  const src = run({ include: 'Aeternum' }, 'inc').titles[0];
  for (const t of generateSimilar(src, { ...opts, seed: 's4' }).titles) assert.match(t.title, /Aeternum/);
});

test('is deterministic for a seed', () => {
  const src = sourceOf(run({}, 'det').titles);
  assert.deepEqual(
    generateSimilar(src, { ...opts, seed: 'same' }).titles.map(t => t.title),
    generateSimilar(src, { ...opts, seed: 'same' }).titles.map(t => t.title),
  );
});

test('invented-word sources mutate while keeping a syllable', () => {
  const src = run({ style: 'invented', length: 'one', myth: 'norse' }, 'inv').titles.find(t => t.recipe.parts.some(p => p.kind === 'coined'))!;
  const syllables = (src.recipe.parts.find(p => p.kind === 'coined') as Extract<RecipePart, { kind: 'coined' }>).syllables;
  const r = generateSimilar(src, { ...opts, seed: 's5' });
  assert.ok(r.titles.some(t => t.recipe.parts.some(p => p.kind === 'coined' && p.syllables.some(s => syllables.includes(s)))));
});
