import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '@vps-name-tools/core';
import {
  buildContext, flattenParts, normalizeSettings, pickChoice, fillTemplate, renderTitle, joinCompound, morphemesOf, isBlockedEngineWord, matcherFor, parsePattern, TEMPLATES, VOCAB,
  type Choice, type Context, type GameData, type RecipePart, type Settings, type Template,
} from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME } from './fixtures/mini-game';

const ctx = (patch: Partial<Settings> = {}, game: GameData = MINI_GAME) => buildContext(normalizeSettings(patch), MINI, game, createRng('fill'));
const T = (id: string) => TEMPLATES.find(t => t.id === id)!;

test('renderTitle collapses spaces and title-cases', () => {
  const parts: RecipePart[] = [{ kind: 'literal', text: 'The ' }, { kind: 'literal', text: ' ' }, { kind: 'lex', index: 1, slot: 'noun', entryId: 'crown', text: 'Crown' }];
  assert.equal(renderTitle(parts), 'The Crown');
});

test('renderTitle keeps small words lower-case mid-title and capitalises first, last and after-colon words', () => {
  const text = (t: string): RecipePart => ({ kind: 'literal', text: t });
  const lex = (index: number, id: string, t: string): RecipePart => ({ kind: 'lex', index, slot: 'noun', entryId: id, text: t });
  assert.equal(renderTitle([text('the '), lex(1, 'crown', 'crown'), text(' of the '), lex(3, 'ash', 'ash')]), 'The Crown of the Ash');
  assert.equal(renderTitle([lex(0, 'ash', 'ash'), text(' of')]), 'Ash Of');
  assert.equal(renderTitle([lex(0, 'wolf', 'aeternum'), text(': the '), lex(2, 'ash', 'ash'), text(' and the oath')]), 'Aeternum: The Ash and the Oath');
});

test('user and Include text renders as ASCII', () => {
  const user: RecipePart = { kind: 'user', index: 0, slot: 'noun', phrase: 'aeris', text: 'Ærïs' };
  assert.equal(renderTitle([user]), 'Aeris');
  const c = ctx({ include: 'Aetherium Ærïs' });
  const r = fillTemplate(c, createRng('ascii'), T('T01'), 0);
  assert.ok(r);
  const title = renderTitle(r.parts);
  assert.equal(title, 'Aetherium Aeris');
  assert.match(title, /^[\x20-\x7e]+$/);
});

test('joinCompound joins, avoids tripled letters and hyphenates hard seams', () => {
  assert.equal(joinCompound('Frost', 'bound'), 'Frostbound');
  assert.equal(joinCompound('Storm', 'break'), 'Stormbreak');
  assert.equal(joinCompound('Hall', 'light'), 'Hall-Light');
});

test('the Include word goes into the head slot', () => {
  const c = ctx({ include: 'Aeternum' });
  for (let i = 0; i < 20; i++) {
    const r = fillTemplate(c, createRng(`inc${i}`), T('T11'), 0);
    assert.ok(r);
    assert.match(renderTitle(r.parts), /of Aeternum$/);
  }
});

test('a theme phrase can be placed literally', () => {
  const c = ctx({ themes: 'raven' });
  const r = fillTemplate(c, createRng('lit'), T('T05'), 0, { literal: c.theme.phrases[0] });
  assert.ok(r);
  assert.ok(r.parts.some(p => p.kind === 'user' && p.text === 'Raven'));
});

test('a required slot with an empty pool fails cleanly', () => {
  const c = ctx({ avoid: '*a*, *e*, *i*, *o*, *u*' });
  assert.equal(fillTemplate(c, createRng('empty'), T('T05'), 0), undefined);
});

test('compound parts expose their morphemes', () => {
  const c = ctx({ genre: 'dark-fantasy' });
  const r = fillTemplate(c, createRng('cmp'), T('T03'), 0);
  assert.ok(r);
  const part = r.parts.find(p => p.kind === 'compound');
  assert.ok(part && part.kind === 'compound');
  assert.deepEqual(morphemesOf(r.parts), [...part.morphemes]);
});

test('alliterative templates alliterate', () => {
  const c = ctx({ myth: 'norse' });
  let produced = 0;
  for (let i = 0; i < 20; i++) {
    const r = fillTemplate(c, createRng(`all${i}`), T('T35'), 0);
    if (!r) continue;
    produced++;
    const words = r.parts.filter(p => p.kind !== 'literal').map(p => p.text.toLowerCase());
    assert.equal(words[0][0], words[1][0], words.join(' & '));
  }
  assert.ok(produced > 0, 'at least one seed must produce a title');
});

test('the compound tail is not held to the head filter or letter', () => {
  const c = ctx();
  const locked: Template = { ...T('T03'), variants: [parsePattern('{compound!}')] };
  let formed = 0;
  for (let i = 0; i < 12; i++) {
    const r = fillTemplate(c, createRng(`tail${i}`), locked, 0, { headFilter: x => x.entry.id === 'wolf' });
    assert.ok(r, `seed ${i} formed no compound`);
    const part = r.parts.find(p => p.kind === 'compound');
    assert.ok(part && part.kind === 'compound');
    assert.equal(part.headId, 'wolf');
    assert.notEqual(part.tailId, 'wolf');
    formed++;
  }
  assert.equal(formed, 12);
});

test('a coined word that starts with a franchise term is blocked; a real compound is not', () => {
  const game: GameData = { ...MINI_GAME, franchiseTerms: [...MINI_GAME.franchiseTerms, 'jedi'] };
  const c = ctx({}, game);
  assert.equal(isBlockedEngineWord(c, 'Jedimar', true), true);
  assert.equal(isBlockedEngineWord(c, 'Jedimar'), false);
  assert.equal(isBlockedEngineWord(c, 'Thornfall', true), false);
  assert.equal(isBlockedEngineWord(c, 'Thornfall'), false);
});

test('an empty subtitle pattern list fails cleanly instead of throwing', () => {
  const game: GameData = { ...MINI_GAME, vocab: { ...VOCAB, subtitlePatterns: [] } };
  const c = ctx({}, game);
  for (let i = 0; i < 5; i++) assert.equal(fillTemplate(c, createRng(`sub${i}`), T('T22'), 0), undefined);
});

test('a coined place exposes its place ending as a morpheme, an invented word does not', () => {
  const place: RecipePart = { kind: 'coined', index: 0, slot: 'place', profile: 'neutral', syllables: ['bren'], ending: 'hold', text: 'Brenhold' };
  assert.deepEqual(morphemesOf([place]), ['Brenhold', 'hold']);
  const invented: RecipePart = { kind: 'coined', index: 0, slot: 'name', profile: 'neutral', syllables: ['bre', 'nar'], ending: 'ar', text: 'Brenar' };
  assert.deepEqual(morphemesOf([invented]), ['Brenar']);
});

test('term matchers are built once per list and match like containsTerm', () => {
  const list = ['jedi', 'hyrule', 'blood and soil'];
  assert.equal(matcherFor(list), matcherFor(list));
  assert.notEqual(matcherFor(list), matcherFor([...list]));
  assert.equal(matcherFor(list)('hyrule falls'), 'hyrule');
  assert.equal(matcherFor(list)('thornfall'), undefined);
});

// ---- pickChoice samples from a cumulative table; its distribution must equal the exact filtered scan's ----

interface Draw {
  readonly used: Set<string>;
  readonly anchor?: string;
  readonly bias?: ReadonlySet<string>;
  readonly filter?: (c: Choice) => boolean;
}

/** Each pool entry's probability by definition: filtered, scaled (anchor x2, related x1.4, bias x2.5), then by weight. */
function exactProbabilities(c: Context, d: Draw): Map<string, number> {
  const related = d.anchor ? c.related.get(d.anchor) ?? [] : [];
  const raw = new Map<string, number>();
  let total = 0;
  for (const w of c.pools.get('noun')!) {
    const ch = w.item;
    if (d.used.has(ch.entry.id) || d.used.has(ch.norm) || (d.filter && !d.filter(ch))) continue;
    let k = w.weight;
    if (d.anchor) {
      if (ch.entry.concepts.includes(d.anchor)) k *= 2;
      else if (ch.entry.concepts.some(x => related.includes(x))) k *= 1.4;
    }
    if (d.bias && ch.entry.concepts.some(x => d.bias!.has(x))) k *= 2.5;
    raw.set(ch.entry.id, k);
    total += k;
  }
  return new Map([...raw].map(([id, k]) => [id, k / total]));
}

function assertDistribution(label: string, counts: ReadonlyMap<string, number>, expected: ReadonlyMap<string, number>, n: number): void {
  for (const id of new Set([...counts.keys(), ...expected.keys()])) {
    const p = expected.get(id) ?? 0;
    const f = (counts.get(id) ?? 0) / n;
    const sigma = Math.sqrt((p * (1 - p)) / n);
    assert.ok(p > 0 || f === 0, `${label}: ${id} was drawn but has probability 0`);
    assert.ok(Math.abs(f - p) <= 3 * sigma + 1e-12, `${label}: ${id} drawn at ${f.toFixed(4)}, expected ${p.toFixed(4)} +- ${(3 * sigma).toFixed(4)}`);
  }
}

test('pickChoice draws each choice at its exact filtered and scaled probability', () => {
  const c = ctx({ creativity: 'focused' });
  const pool = c.pools.get('noun')!;
  const byWeight = [...pool].sort((a, b) => b.weight - a.weight).map(w => w.item);
  assert.ok(byWeight.length >= 12, 'the noun pool is big enough to filter');
  const anchor = byWeight[0].entry.concepts[0];
  const bias = new Set(byWeight[2].entry.concepts);
  const cases: [string, Draw][] = [
    ['no filters', { used: new Set() }],
    ['anchor and bias', { used: new Set(), anchor, bias }],
    // Eight heavy words stay; one of them is already used. Most draws land on a word the filter keeps.
    ['filter keeping the heaviest', { used: new Set([byWeight[1].entry.id]), anchor, bias, filter: ch => byWeight.slice(0, 8).includes(ch) }],
    // Three light words stay. Draws are rejected so often that the exact scan takes over.
    ['filter keeping the lightest', { used: new Set(), anchor, bias, filter: ch => byWeight.slice(-3).includes(ch) }],
    ['used words only', { used: new Set(byWeight.slice(0, 6).flatMap(ch => [ch.entry.id, ch.norm])), bias }],
  ];
  const n = 20000;
  for (const [label, draw] of cases) {
    const rng = createRng(`stat:${label}`);
    const counts = new Map<string, number>();
    for (let i = 0; i < n; i++) {
      const ch = pickChoice(c, rng, 'noun', { anchor: draw.anchor, bias: draw.bias, used: draw.used, filter: draw.filter });
      assert.ok(ch, label);
      counts.set(ch.entry.id, (counts.get(ch.entry.id) ?? 0) + 1);
    }
    assertDistribution(label, counts, exactProbabilities(c, draw), n);
  }
});

test('pickChoice mixes the wildcard draw in at the wildcard rate', () => {
  const c = ctx({ creativity: 'wild' });
  const rate = c.params.wildcardRate;
  assert.ok(rate > 0);
  const used = new Set(['ash']);
  const weighted = exactProbabilities(c, { used });
  const flat = (c.flatPools.get('noun') ?? []).filter(ch => !used.has(ch.entry.id) && !used.has(ch.norm));
  const expected = new Map<string, number>();
  for (const [id, p] of weighted) expected.set(id, (1 - rate) * p);
  for (const ch of flat) expected.set(ch.entry.id, (expected.get(ch.entry.id) ?? 0) + rate / flat.length);
  const n = 20000;
  const rng = createRng('stat:wild');
  const counts = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const ch = pickChoice(c, rng, 'noun', { used })!;
    counts.set(ch.entry.id, (counts.get(ch.entry.id) ?? 0) + 1);
  }
  assertDistribution('wildcard mix', counts, expected, n);
});

test('pickChoice returns nothing when every choice is filtered out, and honours the alliteration letter', () => {
  const c = ctx({ creativity: 'focused' });
  const everyone = new Set(c.pools.get('noun')!.flatMap(w => [w.item.entry.id]));
  assert.equal(pickChoice(c, createRng('none'), 'noun', { used: everyone }), undefined);
  assert.equal(pickChoice(c, createRng('none'), 'noun', { used: new Set(), filter: () => false }), undefined);
  assert.equal(pickChoice(c, createRng('none'), 'verbless' as never, { used: new Set() }), undefined);
  const rng = createRng('letter');
  for (let i = 0; i < 200; i++) assert.ok(pickChoice(c, rng, 'noun', { used: new Set(), letter: 'w' })!.text.toLowerCase().startsWith('w'));
});

test('flattenParts opens groups, and does the work once per recipe', () => {
  const lex = (index: number, text: string): RecipePart => ({ kind: 'lex', index, slot: 'noun', entryId: text.toLowerCase(), text });
  const inner: RecipePart[] = [lex(0, 'Ash'), { kind: 'literal', text: ' and ' }, lex(1, 'Oath')];
  const plain: RecipePart[] = [lex(0, 'Crown'), { kind: 'literal', text: ' of ' }, lex(1, 'Ash')];
  assert.equal(flattenParts(plain), plain, 'a recipe without groups is returned as it is');
  const grouped: RecipePart[] = [lex(0, 'Wolf'), { kind: 'literal', text: ': ' }, { kind: 'group', index: 2, slot: 'subtitle', parts: inner, text: 'Ash and Oath' }];
  const flat = flattenParts(grouped);
  assert.deepEqual(flat.map(p => (p.kind === 'group' ? 'group' : p.text)), ['Wolf', ': ', 'Ash', ' and ', 'Oath']);
  assert.equal(flattenParts(grouped), flat, 'the same list is returned on the next call');
  const nested: RecipePart[] = [{ kind: 'group', index: 0, slot: 'subtitle', parts: grouped, text: '' }];
  assert.deepEqual(flattenParts(nested).map(p => (p.kind === 'group' ? 'group' : p.text)), ['Wolf', ': ', 'Ash', ' and ', 'Oath']);
  assert.deepEqual(flattenParts([]), []);
});

test('isBlockedEngineWord keeps its verdict for a repeated word, and the coined flag is part of the question', () => {
  const c = ctx({});
  for (let i = 0; i < 3; i++) {
    assert.equal(isBlockedEngineWord(c, 'Jedimar'), false);
    assert.equal(isBlockedEngineWord(c, 'Jedimar', true), true);
    assert.equal(isBlockedEngineWord(c, 'Thornfall', true), false);
  }
  // A new build starts with a clean memo: another genre guard blocks what the first context allowed.
  const cozy = ctx({ genre: 'cozy' });
  assert.equal(isBlockedEngineWord(c, 'Pocketmon'), false);
  assert.equal(isBlockedEngineWord(cozy, 'Pocketmon'), true);
});
