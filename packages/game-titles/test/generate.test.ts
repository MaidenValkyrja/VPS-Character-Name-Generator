import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, normalize } from '@vps-name-tools/core';
import { buildContext, flattenParts, generate, normalizeSettings, prewarm, titleKey, toCandidate, type Settings, type TitleResult } from '../src/index';
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

// ---- Fix round 1: entry-level caps, literal theme use, caps through generate, unusable Include ----

const ENTRIES = [...MINI.lexicon, ...MINI.myths.flatMap(m => [...m.imagery, ...m.symbolic]), ...MINI_GAME.genres.flatMap(g => g.entries ?? [])];
const entryOf = (id: string) => ENTRIES.find(e => e.id === id);
/** Lexicon entries a title is built from, once each: lexicon words and both halves of a compound. Include parts carry none. */
const entryIdsOf = (t: TitleResult): string[] => [
  ...new Set(flattenParts(t.recipe.parts).flatMap(p => (p.kind === 'lex' ? [p.entryId] : p.kind === 'compound' ? [p.headId, p.tailId] : []))),
];
const headEntryOf = (t: TitleResult): string | undefined => {
  const h = t.recipe.parts.find(p => p.kind !== 'literal' && p.index === t.recipe.headSlot);
  return h?.kind === 'lex' ? h.entryId : h?.kind === 'compound' ? h.headId : undefined;
};
const tally = (ids: Iterable<string>) => {
  const m = new Map<string, number>();
  for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
  return m;
};

test('no lexicon entry is in more than two titles of a batch and no head entry is used twice', () => {
  for (const patch of [{}, { include: 'Aeternum' }, { genre: 'dark-fantasy' as const, myth: 'norse' as const }]) {
    for (let i = 0; i < 20; i++) {
      const titles = run({ count: 10, ...patch }, `ent${i}`).titles;
      for (const [id, n] of tally(titles.flatMap(entryIdsOf))) assert.ok(n <= 2, `${id} in ${n} titles: ${titles.map(t => t.title)}`);
      const heads = tally(titles.flatMap(t => headEntryOf(t) ?? []));
      for (const [id, n] of heads) assert.ok(n <= 1, `head ${id} used ${n} times: ${titles.map(t => t.title)}`);
    }
  }
});

test('the literal theme share follows the creativity level', () => {
  const band = { balanced: [0.3, 0.5], focused: [0.45, 0.75], wild: [0.15, 0.4] } as const;
  for (const creativity of ['balanced', 'focused', 'wild'] as const) {
    let literal = 0;
    let total = 0;
    for (let i = 0; i < 20; i++) {
      const titles = run({ themes: 'frozen kingdom', creativity, count: 10 }, `lit${i}`).titles;
      total += titles.length;
      literal += titles.filter(t => flattenParts(t.recipe.parts).some(p => p.kind === 'user')).length;
    }
    const mean = literal / total;
    const [lo, hi] = band[creativity];
    assert.ok(mean >= lo && mean <= hi, `${creativity}: mean literal share ${mean.toFixed(3)} outside [${lo}, ${hi}]`);
  }
});

test('theme phrases are never throttled by the word and head caps', () => {
  const ctx = buildContext(normalizeSettings({ themes: 'lantern', count: 10 }), MINI, MINI_GAME, createRng('k'));
  let seen = 0;
  for (let i = 0; i < 10; i++) {
    for (const t of run({ themes: 'lantern', count: 10 }, `thr${i}`).titles) {
      const keys = toCandidate(ctx, t.title, t.recipe, 0).capKeys;
      const users = flattenParts(t.recipe.parts).filter(p => p.kind === 'user');
      for (const p of users) {
        assert.ok(!keys.includes(`head:${normalize(p.text)}`), `${t.title}: ${keys}`);
        assert.ok(!keys.includes(`word:${normalize(p.text)}`), `${t.title}: ${keys}`);
      }
      assert.equal(keys.includes('literal'), users.length > 0, `${t.title}: ${keys}`);
      seen += users.length;
    }
  }
  assert.ok(seen > 0, 'some titles carry the theme phrase');
});

test('invented words stay within the batch cap for every creativity level', () => {
  const caps = { focused: 0.1, balanced: 0.2, wild: 0.35 } as const;
  for (const creativity of ['focused', 'balanced', 'wild'] as const) {
    for (const count of [5, 10, 20] as const) {
      const limit = Math.max(1, Math.floor(count * caps[creativity]));
      for (let i = 0; i < 20; i++) {
        const titles = run({ creativity, count }, `cn${i}`).titles;
        const coined = titles.filter(t => flattenParts(t.recipe.parts).some(p => p.kind === 'coined')).length;
        assert.ok(coined <= limit, `${creativity}/${count}/cn${i}: ${coined} invented words, limit ${limit}`);
      }
    }
  }
});

test('one theme phrase fills at most 30% of a batch when there are several', () => {
  for (let i = 0; i < 20; i++) {
    const titles = run({ themes: 'lantern, aurora, frozen kingdom', count: 10 }, `ph${i}`).titles;
    const perPhrase = tally(titles.flatMap(t => flattenParts(t.recipe.parts).flatMap(p => (p.kind === 'user' ? [p.phrase] : []))));
    for (const [phrase, n] of perPhrase) assert.ok(n <= 3, `${phrase} in ${n} titles: ${titles.map(t => t.title)}`);
  }
});

test('an Include word with no letters or digits is unusable and generates nothing', () => {
  for (const include of ['!!!', "'-'", '日本']) {
    const r = run({ include }, 'unu');
    assert.equal(r.titles.length, 0, include);
    assert.equal(r.notices[0]?.code, 'include-unusable', include);
    assert.deepEqual(r.notices.map(n => n.code), ['include-unusable'], include);
  }
  assert.ok(run({ include: 'Aeternum' }, 'unu').titles.length > 0);
});

test('a note lists a concept only when a word in the title carries it or the user typed it', () => {
  const conceptsOf = (t: TitleResult) => new Set(entryIdsOf(t).flatMap(id => entryOf(id)?.concepts ?? []));
  for (let i = 0; i < 20; i++) {
    for (const t of run({ genre: 'dark-fantasy', count: 10 }, `nt${i}`).titles) {
      const carried = conceptsOf(t);
      for (const c of t.meta.concepts) assert.ok(carried.has(c), `${t.title}: ${c} is not carried by ${[...carried]}`);
    }
  }
});

test('the invented-word share rises with the creativity level and stays within its cap', () => {
  const caps = { focused: 0.1, balanced: 0.2, wild: 0.35 } as const;
  const mean = {} as Record<keyof typeof caps, number>;
  for (const creativity of ['focused', 'balanced', 'wild'] as const) {
    let coined = 0;
    let total = 0;
    for (let i = 0; i < 20; i++) {
      const titles = run({ creativity, count: 20 }, `inv${i}`).titles;
      total += titles.length;
      coined += titles.filter(t => flattenParts(t.recipe.parts).some(p => p.kind === 'coined')).length;
    }
    mean[creativity] = coined / total;
    assert.ok(mean[creativity] <= caps[creativity], `${creativity}: mean ${mean[creativity].toFixed(3)} above ${caps[creativity]}`);
  }
  assert.ok(mean.wild > mean.balanced && mean.balanced > mean.focused, JSON.stringify(mean));
});

// ---- Fix round 2: generation stops once a batch can be picked without relaxing a limit ----

/** A Set that counts how many candidates reached the duplicate check, one call per candidate that passed the filters. */
class CountingSet extends Set<string> {
  calls = 0;
  override has(key: string): boolean {
    this.calls++;
    return super.has(key);
  }
}

/** MINI with its lexicon repeated under new ids and spellings, so a batch of 20 can honour the entry caps. */
function scaledMini(times: number): typeof MINI {
  const tag = (k: number) => 'bcdfghklmnprstvz'[k % 16] + 'aeiou'[Math.floor(k / 16) % 5];
  const lexicon = Array.from({ length: times }, (_, k) =>
    MINI.lexicon.map(e => (k === 0 ? e : {
      ...e, id: `${e.id}-${k}`, text: e.text + tag(k),
      forms: e.forms && Object.fromEntries(Object.entries(e.forms).map(([form, text]) => [form, `${text}${tag(k)}`])),
    })),
  ).flat();
  return { ...MINI, lexicon };
}

test('generation stops early once the pool can fill the batch within the limits', () => {
  const big = scaledMini(8);
  for (const [count, data] of [[5, MINI], [10, MINI], [20, big]] as const) {
    const floor = Math.max(3 * count, count + 20);
    let total = 0;
    for (let i = 0; i < 10; i++) {
      const exclude = new CountingSet();
      const r = generate({ count }, { seed: `early${i}`, data, game: MINI_GAME, exclude });
      assert.equal(r.titles.length, count);
      assert.ok(exclude.calls >= floor, `${count}: only ${exclude.calls} candidates, floor ${floor}`);
      total += exclude.calls;
    }
    assert.ok(total / 10 < count * 6, `${count}: mean ${total / 10} candidates, the full pool is ${count * 6}`);
  }
});

test('generation goes on to the full pool when the early pool cannot fill the batch within the limits', () => {
  // One-word titles from 60 lexicon words cannot all have a distinct head, so no early pool is a strict fill.
  for (let i = 0; i < 5; i++) {
    const exclude = new CountingSet();
    const r = generate({ count: 20, length: 'one' }, { seed: `hard${i}`, data: MINI, game: MINI_GAME, exclude });
    assert.equal(r.titles.length, 20);
    assert.equal(exclude.calls, 120, `hard${i}`);
  }
});

test('the early stop keeps the seed contract and the batch size', () => {
  for (const seed of ['e1', 'e2', 'e3']) {
    for (const count of [5, 10, 20] as const) {
      const a = run({ count }, seed);
      const b = run({ count }, seed);
      assert.deepEqual(a.titles.map(t => t.title), b.titles.map(t => t.title));
      assert.equal(a.titles.length, count);
      assert.equal(new Set(a.titles.map(t => titleKey(t.title))).size, count);
    }
  }
});

// ---- prewarm builds the lazy data and changes no result ----

test('prewarm then generate gives the same titles as generate alone', () => {
  // Two copies of the bundle, so each has its own per-bundle cache.
  const copy = () => ({ data: { ...MINI, myths: MINI.myths.map(m => ({ ...m, denylist: [...m.denylist] })) }, game: { ...MINI_GAME, franchiseTerms: [...MINI_GAME.franchiseTerms] } });
  const cold = copy();
  const warm = copy();
  const patches: Partial<Settings>[] = [{}, { genre: 'dark-fantasy', myth: 'norse', count: 20 }, { include: 'Aeternum' }, { themes: 'lantern, aurora', creativity: 'wild' }, { style: 'compound', creativity: 'focused' }];
  const before = patches.map((p, i) => generate(p, { seed: `pw${i}`, ...cold }).titles.map(t => t.title));
  prewarm(warm.data, warm.game);
  const after = patches.map((p, i) => generate(p, { seed: `pw${i}`, ...warm }).titles.map(t => t.title));
  assert.deepEqual(after, before);
  // Prewarming again, or on the cold copy afterwards, changes nothing either.
  prewarm(cold.data, cold.game);
  assert.deepEqual(patches.map((p, i) => generate(p, { seed: `pw${i}`, ...cold }).titles.map(t => t.title)), before);
});

test('prewarm with no arguments builds the shipped bundle without throwing', () => {
  prewarm();
  assert.ok(generate({ count: 5 }, { seed: 'pw-default' }).titles.length > 0);
});
