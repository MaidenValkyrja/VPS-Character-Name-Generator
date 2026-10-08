import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, normalize } from '@vps-name-tools/core';
import { buildContext, flattenParts, generate, normalizeSettings, titleKey, toCandidate, type Settings, type TitleResult } from '../src/index';
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
