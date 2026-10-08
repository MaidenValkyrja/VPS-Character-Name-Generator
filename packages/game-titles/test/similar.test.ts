import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '@vps-name-tools/core';
import {
  buildContext, generate, generateSimilar, normalizeSettings, RELATED_FAMILIES, titleKey, toCandidate, type RecipePart, type Settings, type TitleResult,
} from '../src/index';
import { exemptKeptHead, keptHeadOf, similarDetailed } from '../src/similar';
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

// Fix round 1: strategy tags, quota selection, mutation and structure details.

const headPart = (t: TitleResult): RecipePart | undefined => t.recipe.parts.find(p => p.kind !== 'literal' && p.index === t.recipe.headSlot);
const FANTASY = ['probe', 'x1', 'x2', 'x3', 'x4'].flatMap(seed => run({ genre: 'fantasy', count: 20 }, seed).titles);
/** Lexicon-head sources from three different families, so the sweep does not lean on one template. */
const lexSources = ['adj-noun', 'of-phrase', 'the-noun'].map(f => FANTASY.find(t => t.recipe.family === f && headPart(t)?.kind === 'lex')!);
const tally = (titles: readonly TitleResult[]) => {
  const counts = new Map<string, number>();
  for (const t of titles) counts.set(t.recipe.strategy ?? 'none', (counts.get(t.recipe.strategy ?? 'none') ?? 0) + 1);
  return counts;
};

test('the sweep has lexicon-head sources from three families', () => {
  assert.equal(lexSources.length, 3);
  for (const s of lexSources) assert.ok(s, 'a lexicon-head source was found');
});

test('a lexicon-head source returns exactly 6 distinct titles', () => {
  for (const src of lexSources) {
    for (let i = 0; i < 10; i++) {
      const r = generateSimilar(src, { ...opts, seed: `six${i}` });
      assert.equal(r.titles.length, 6, `${src.title} / six${i}: ${r.titles.map(t => t.title)}`);
      assert.equal(new Set(r.titles.map(t => titleKey(t.title))).size, 6);
      assert.ok(!r.titles.some(t => titleKey(t.title) === titleKey(src.title)));
    }
  }
});

test('the strategy tag names the strategy that ran', () => {
  for (const src of lexSources) {
    const head = headPart(src)!;
    for (let i = 0; i < 10; i++) {
      for (const t of generateSimilar(src, { ...opts, seed: `tag${i}` }).titles) {
        const h = headPart(t);
        if (t.recipe.strategy === 'modifier') {
          assert.equal(t.recipe.templateId, src.recipe.templateId, t.title);
          assert.equal(h?.kind !== 'literal' && h?.text, head.kind !== 'literal' && head.text, t.title);
        } else if (t.recipe.strategy === 'head') {
          assert.equal(t.recipe.templateId, src.recipe.templateId, t.title);
          assert.notEqual(h?.kind !== 'literal' && h?.text, head.kind !== 'literal' && head.text, t.title);
          const others = (x: TitleResult) => x.recipe.parts.filter(p => p.kind !== 'literal' && p.index !== x.recipe.headSlot).map(p => p.kind !== 'literal' && p.text);
          assert.deepEqual(others(t), others(src), t.title);
        }
      }
    }
  }
});

test('a head swap is never reported for a head that is not a lexicon word', () => {
  const inc = run({ include: 'Aeternum', count: 20 }, 'inc2').titles.find(t => ['adj-noun', 'pair', 'of-phrase'].includes(t.recipe.family))!;
  assert.ok(inc && headPart(inc)?.kind === 'include', `an Include-head source: ${inc?.title}`);
  for (let i = 0; i < 10; i++) {
    const r = generateSimilar(inc, { ...opts, seed: `inc${i}` });
    assert.ok(r.titles.length > 0);
    assert.ok(!r.titles.some(t => t.recipe.strategy === 'head' || t.recipe.strategy === 'mutate'), r.titles.map(t => `${t.title}:${t.recipe.strategy}`).join(', '));
    for (const t of r.titles) {
      assert.match(t.title, /Aeternum/);
      if (t.recipe.strategy === 'modifier') assert.equal(t.recipe.templateId, inc.recipe.templateId);
    }
  }
});

test('Avoid words in the snapshot never appear, and the test would notice if they did', () => {
  const src = sourceOf(run({ genre: 'dark-fantasy', count: 20 }, 'sim').titles);
  const avoiding: TitleResult = { ...src, settings: { ...src.settings, avoid: 'cinder' } };
  let plain = 0;
  for (let i = 0; i < 20; i++) {
    if (generateSimilar(src, { ...opts, seed: `av${i}` }).titles.some(t => /cinder/i.test(t.title))) plain++;
    for (const t of generateSimilar(avoiding, { ...opts, seed: `av${i}` }).titles) assert.doesNotMatch(t.title, /cinder/i, t.title);
  }
  assert.ok(plain > 0, 'without Avoid, Cinder does show up');
});

test('a source made under non-default settings keeps its snapshot', () => {
  const src = run({ genre: 'cozy', tone: 'whimsical', count: 20 }, 'cz').titles[0];
  assert.equal(src.settings.genre, 'cozy');
  const r = generateSimilar(src, { ...opts, seed: 'snap' });
  assert.ok(r.titles.length > 0);
  for (const t of r.titles) {
    assert.deepEqual(t.settings, src.settings);
    assert.equal(t.meta.genre, 'cozy');
  }
});

test('an Include that now conflicts with Avoid returns nothing and says why', () => {
  const src = run({ genre: 'dark-fantasy', count: 20 }, 'sim').titles[0];
  const r = generateSimilar({ ...src, settings: { ...src.settings, include: 'Aeternum', avoid: 'Aeternum' } }, { ...opts, seed: 'blk' });
  assert.equal(r.titles.length, 0);
  assert.deepEqual(r.notices.map(n => n.code), ['include-conflicts-avoid']);
});

test('mutated words stay inside the brandable letter range', () => {
  const sources = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'].flatMap(seed => run({ style: 'brandable', count: 20 }, seed).titles).filter(t => headPart(t)?.kind === 'coined');
  assert.ok(sources.length > 0, 'brandable batches contain invented-word sources');
  let mutated = 0;
  for (const src of sources.slice(0, 6)) {
    for (let i = 0; i < 8; i++) {
      for (const t of generateSimilar(src, { ...opts, seed: `br${i}` }).titles) {
        if (t.recipe.strategy !== 'mutate') continue;
        mutated++;
        const word = headPart(t)!;
        const letters = (word.kind !== 'literal' ? word.text : '').toLowerCase().replace(/[^a-z]/g, '').length;
        assert.ok(letters >= 5 && letters <= 9, `${word.kind !== 'literal' && word.text} has ${letters} letters`);
      }
    }
  }
  assert.ok(mutated > 0);
});

test('structure results keep the head word or share a concept with the source', () => {
  const entry = (id: string) =>
    [...MINI.lexicon, ...MINI.myths.flatMap(m => [...m.imagery, ...m.symbolic]), ...MINI_GAME.genres.flatMap(g => g.entries ?? [])].find(e => e.id === id);
  const conceptsOf = (t: TitleResult) => new Set(t.recipe.parts.flatMap(p => (p.kind === 'lex' ? entry(p.entryId)?.concepts ?? [] : [])));
  let seen = 0;
  for (const src of lexSources) {
    const head = headPart(src)!;
    const shared = conceptsOf(src);
    for (let i = 0; i < 10; i++) {
      for (const t of generateSimilar(src, { ...opts, seed: `st${i}` }).titles) {
        if (t.recipe.strategy !== 'structure') continue;
        seen++;
        const keeps = head.kind === 'lex' && t.recipe.parts.some(p => p.kind === 'lex' && p.entryId === head.entryId);
        const shares = [...conceptsOf(t)].some(c => shared.has(c));
        assert.ok(keeps || shares, `${src.title} -> ${t.title}`);
      }
    }
  }
  assert.ok(seen > 0);
});

test('recipes carry the Similar seed and the related-family chain runs both ways', () => {
  const src = lexSources[0];
  for (const t of generateSimilar(src, { ...opts, seed: 'sd' }).titles) assert.match(t.recipe.seed, /^sd:similar:\d+$/, t.title);
  const inv = run({ style: 'invented', length: 'one', myth: 'norse' }, 'inv').titles.find(t => t.recipe.parts.some(p => p.kind === 'coined'))!;
  for (const t of generateSimilar(inv, { ...opts, seed: 'sd2' }).titles) assert.match(t.recipe.seed, /^sd2:similar:\d+$/, t.title);
  const link = (a: string, b: string) => assert.ok((RELATED_FAMILIES as Record<string, readonly string[]>)[a]?.includes(b), `${a} -> ${b}`);
  for (const [a, b] of [['pair', 'of-phrase'], ['of-phrase', 'the-noun'], ['the-noun', 'subtitle']]) {
    link(a, b);
    link(b, a);
  }
});

test('a pool of three strategies shows three, and a full pool keeps each within floor(count / 3)', () => {
  let eligible = 0;
  let full = 0;
  let runs = 0;
  for (const src of lexSources) {
    for (let i = 0; i < 20; i++) {
      const { result, pool } = similarDetailed(src, { ...opts, seed: `sw${i}` });
      runs++;
      assert.equal(result.titles.length, 6, `${src.title} / sw${i}`);
      const sizes = Object.values(pool);
      if (sizes.length < 3) continue;
      eligible++;
      const counts = tally(result.titles);
      const label = `${src.title} / sw${i}: ${result.titles.map(t => `${t.title}:${t.recipe.strategy}`).join(', ')}`;
      assert.ok(counts.size >= 3, label);
      // When a strategy offered fewer than its quota, six titles cannot be reached under the cap; the count wins.
      if (sizes.some(n => n < 2)) continue;
      full++;
      assert.ok(Math.max(...counts.values()) <= 2, label);
    }
  }
  assert.ok(eligible >= runs / 2, `${eligible} of ${runs} runs offered three strategies`);
  assert.ok(full >= runs / 3, `${full} of ${runs} runs had a full quota in every strategy`);
});

test('an invented-word source is served by mutation and structure', () => {
  // Length "any": a one-word snapshot would rule every two-word structure out.
  const inv = run({ style: 'invented', myth: 'norse', count: 20 }, 'inv').titles.find(t => headPart(t)?.kind === 'coined')!;
  assert.ok(inv, 'an invented-word source');
  for (let i = 0; i < 10; i++) {
    const { result, pool } = similarDetailed(inv, { ...opts, seed: `iv${i}` });
    assert.ok(Object.keys(pool).every(s => s === 'mutate' || s === 'structure'), Object.keys(pool).join());
    assert.equal(result.titles.length, 6);
    const counts = tally(result.titles);
    assert.ok((counts.get('mutate') ?? 0) >= 1 && (counts.get('structure') ?? 0) >= 1, [...counts].join());
  }
});

// Fix round 1 (Task 16): batch caps are keyed on lexicon entries, so Similar exempts the kept head by entry.

test('the kept head is not charged against the entry-level word and head caps', () => {
  const ctx = buildContext(normalizeSettings({ count: 10 }), MINI, MINI_GAME, createRng('kept'));
  const capsOf = (t: TitleResult) => toCandidate(ctx, t.title, t.recipe, 0);
  // A lexicon head: both of its entry keys go, every other key stays.
  const lex = lexSources[0];
  const lexHead = headPart(lex)!;
  assert.ok(lexHead.kind === 'lex');
  const before = capsOf(lex);
  const after = exemptKeptHead(before, keptHeadOf(lexHead as Exclude<RecipePart, { kind: 'literal' }>));
  assert.ok(before.capKeys.includes(`head:@${(lexHead as Extract<RecipePart, { kind: 'lex' }>).entryId}`));
  assert.deepEqual(before.capKeys.filter(k => !after.capKeys.includes(k)).sort(), [`head:@${(lexHead as Extract<RecipePart, { kind: 'lex' }>).entryId}`, `word:@${(lexHead as Extract<RecipePart, { kind: 'lex' }>).entryId}`].sort());
  // A different head word keeps its keys.
  const other = lexSources.find(t => headPart(t)?.kind === 'lex' && (headPart(t) as Extract<RecipePart, { kind: 'lex' }>).entryId !== (lexHead as Extract<RecipePart, { kind: 'lex' }>).entryId)!;
  assert.deepEqual(exemptKeptHead(capsOf(other), keptHeadOf(lexHead as Exclude<RecipePart, { kind: 'literal' }>)).capKeys, capsOf(other).capKeys);
  // A compound head: the head entry and both halves go.
  const compound = ['c1', 'c2', 'c3'].flatMap(seed => run({ count: 20 }, seed).titles).find(t => headPart(t)?.kind === 'compound')!;
  assert.ok(compound, 'a compound-head source');
  const c = headPart(compound) as Extract<RecipePart, { kind: 'compound' }>;
  const cAfter = exemptKeptHead(capsOf(compound), keptHeadOf(c));
  assert.deepEqual(capsOf(compound).capKeys.filter(k => !cAfter.capKeys.includes(k)).sort(), [`head:@${c.headId}`, `word:@${c.headId}`, `word:@${c.tailId}`].sort());
});

test('the kept head entry is exempt in another surface form, such as its plural', () => {
  const ctx = buildContext(normalizeSettings({ count: 10 }), MINI, MINI_GAME, createRng('kept2'));
  const src = lexSources[0];
  const head = headPart(src) as Extract<RecipePart, { kind: 'lex' }>;
  const plural = { ...src.recipe, parts: src.recipe.parts.map(p => (p === head ? { ...head, slot: 'nounPl' as const, text: `${head.text}s` } : p)) };
  const kept = exemptKeptHead(toCandidate(ctx, `${src.title}s`, plural, 0), keptHeadOf(head));
  assert.ok(!kept.capKeys.includes(`head:@${head.entryId}`));
  assert.ok(!kept.capKeys.includes(`word:@${head.entryId}`));
});
