import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '@vps-name-tools/core';
import {
  buildContext, normalizeSettings, checkCandidate, lengthMatches, lengthClassOf, hasRepeatedRoot, scoreCandidate, fillTemplate, renderTitle,
  TEMPLATES, type GameData, type Recipe, type RecipePart, type Settings,
} from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME, MINI_GENRES } from './fixtures/mini-game';

const ctx = (patch: Partial<Settings> = {}, game: GameData = MINI_GAME) => buildContext(normalizeSettings(patch), MINI, game, createRng('c'));
const T = (id: string) => TEMPLATES.find(t => t.id === id)!;
const lex = (index: number, entryId: string, text: string): RecipePart => ({ kind: 'lex', index, slot: 'noun', entryId, text });
const recipe = (...parts: RecipePart[]): Recipe => ({ templateId: 'T06', variant: 0, family: 'pair', parts, headSlot: 1, seed: '' });

test('length options', () => {
  assert.equal(lengthMatches('Pyre', 'one'), true);
  assert.equal(lengthMatches('Ashen Oath', 'short'), true);
  assert.equal(lengthMatches('Crown of Ash', 'medium'), true);
  assert.equal(lengthMatches('Aeternum: Ashen Crown', 'long'), true);
  assert.equal(lengthMatches('Aeternum: Ashen Crown', 'medium'), false);
  assert.equal(lengthMatches('x'.repeat(49), 'any'), false);
  assert.equal(lengthClassOf('Where the Ravens Keep Their Oaths'), 'long');
});

test('repeated roots are detected', () => {
  assert.equal(hasRepeatedRoot('Ash of Ashes'), true);
  assert.equal(hasRepeatedRoot('Ashen Ash'), true);
  assert.equal(hasRepeatedRoot('Raven Ravens'), true);
  assert.equal(hasRepeatedRoot('Sea Season'), false);
  assert.equal(hasRepeatedRoot('Crown of Ash'), false);
});

test('Avoid, Include, known titles, franchise terms and genre guards reject candidates', () => {
  const r = recipe(lex(0, 'ash', 'Ash'), { kind: 'literal', text: ' ' }, lex(1, 'oath', 'Oath'));
  assert.equal(checkCandidate(ctx({ avoid: 'oath' }), 'Ash Oath', r), 'avoid');
  assert.equal(checkCandidate(ctx({ include: 'Aeternum' }), 'Ash Oath', r), 'include');
  assert.equal(checkCandidate(ctx(), 'Ash Oath', r), undefined);

  const known: RecipePart = { kind: 'compound', index: 0, slot: 'compound', headId: 'frost', tailId: 'bound', morphemes: ['Frost', 'bound'], text: 'Frostbound' };
  assert.equal(checkCandidate(ctx(), 'Frostbound', recipe(known)), 'known-title');

  const franchise: RecipePart = { kind: 'coined', index: 0, slot: 'name', profile: 'neutral', syllables: ['hy', 'rule'], text: 'Hyrule' };
  assert.equal(checkCandidate(ctx(), 'Hyrule Falls', recipe(franchise, { kind: 'literal', text: ' ' }, lex(1, 'falls', 'Falls'))), 'franchise');

  const mon: RecipePart = { kind: 'coined', index: 0, slot: 'coined', profile: 'soft', syllables: ['pip', 'mon'], text: 'Pipmon' };
  assert.equal(checkCandidate(ctx({ genre: 'cozy' }), 'Pipmon', recipe(mon)), 'genre-guard');
});

test('denylisted cultural names are rejected in engine output but a user may type them', () => {
  const odin: RecipePart = { kind: 'coined', index: 0, slot: 'name', profile: 'norse', syllables: ['o', 'din'], text: 'Odin' };
  assert.equal(checkCandidate(ctx({ myth: 'norse' }), 'Odin', recipe(odin)), 'denylist');
  const typed: RecipePart = { kind: 'include', index: 0, slot: 'name', text: 'Odin' };
  assert.equal(checkCandidate(ctx({ myth: 'norse', include: 'Odin' }), 'Odin', recipe(typed)), undefined);
  const prefixed: RecipePart = { kind: 'coined', index: 0, slot: 'name', profile: 'norse', syllables: ['o', 'din', 'vald'], text: 'Odinvald' };
  assert.equal(checkCandidate(ctx({ myth: 'norse' }), 'Odinvald', recipe(prefixed)), 'denylist');
  const compound: RecipePart = { kind: 'compound', index: 0, slot: 'compound', headId: 'thorn', tailId: 'fall', morphemes: ['Thorn', 'fall'], text: 'Thornfall' };
  assert.equal(checkCandidate(ctx({ myth: 'norse' }), 'Thornfall', recipe(compound)), undefined);
});

test('ordinary numbers pass and explicit codes fail', () => {
  const sector = recipe(lex(0, 'signal', 'Signal'), { kind: 'literal', text: '-' }, { kind: 'vocab', index: 1, slot: 'digits', text: '88', cliche: 0 });
  assert.equal(checkCandidate(ctx(), 'Signal-88', sector), undefined);
  const code = recipe(lex(0, 'signal', 'Signal'), { kind: 'literal', text: ' ' }, { kind: 'vocab', index: 1, slot: 'digits', text: '1488', cliche: 0 });
  assert.equal(checkCandidate(ctx(), 'Signal 1488', code), 'safety');
});

test('scoring prefers titles that reflect the user themes', () => {
  const c = ctx({ genre: 'cozy', themes: 'lantern' });
  const zero = () => 0;
  const related = scoreCandidate(c, 'Lantern', recipe(lex(0, 'lantern', 'Lantern')), zero);
  const unrelated = scoreCandidate(c, 'Tide', recipe(lex(0, 'tide', 'Tide')), zero);
  assert.ok(related > unrelated, `${related} vs ${unrelated}`);
});

test('an empty title is rejected as empty', () => {
  assert.equal(checkCandidate(ctx(), '', recipe(lex(0, 'ash', 'Ash'))), 'empty');
});

test('the Include check follows the rendered Include part, so inflected forms pass', () => {
  const c = ctx({ include: 'Wolf' });
  let accepted = 0;
  for (let i = 0; i < 20; i++) {
    const r = fillTemplate(c, createRng(`wolf${i}`), T('T12'), 0);
    if (!r) continue;
    const title = renderTitle(r.parts);
    const reason = checkCandidate(c, title, r);
    assert.notEqual(reason, 'include', title);
    if (reason === undefined) {
      accepted++;
      assert.match(title, /of Wolves$/);
    }
  }
  assert.ok(accepted >= 5, `accepted ${accepted}`);
});

test('the Include check accepts a possessive and rejects a longer word or a missing Include part', () => {
  const c = ctx({ include: 'Aeternum' });
  let possessive = 0;
  for (let i = 0; i < 20; i++) {
    const r = fillTemplate(c, createRng(`poss${i}`), T('T21'), 0);
    if (!r) continue;
    const title = renderTitle(r.parts);
    const reason = checkCandidate(c, title, r);
    assert.notEqual(reason, 'include', title);
    if (reason === undefined) {
      possessive++;
      assert.match(title, /^Aeternum's /);
    }
  }
  assert.ok(possessive >= 3, `possessive ${possessive}`);

  const ash = ctx({ include: 'Ash' });
  const ashen = recipe(lex(0, 'ash', 'Ashen'), { kind: 'literal', text: ' ' }, lex(1, 'oath', 'Oath'));
  assert.equal(checkCandidate(ash, 'Ashen Oath', ashen), 'include');
  const include: RecipePart = { kind: 'include', index: 1, slot: 'noun', text: 'Ash' };
  const withPart = recipe(lex(0, 'oath', 'Oath'), { kind: 'literal', text: ' of ' }, include);
  assert.equal(checkCandidate(ash, 'Oath of Ash', withPart), undefined);
  assert.equal(checkCandidate(ash, 'Oath of Ashen', withPart), 'include');
});

test('Include with diacritics is accepted once the title is ASCII', () => {
  const c = ctx({ include: 'Aetherium Ærïs' });
  const r = fillTemplate(c, createRng('ascii'), T('T01'), 0);
  assert.ok(r);
  assert.equal(checkCandidate(c, renderTitle(r.parts), r), undefined);
});

test('Avoid also matches compound halves and a coined place ending', () => {
  const compound: RecipePart = { kind: 'compound', index: 0, slot: 'compound', headId: 'thorn', tailId: 'fall', morphemes: ['Thorn', 'fall'], text: 'Thornfall' };
  assert.equal(checkCandidate(ctx(), 'Thornfall', recipe(compound)), undefined);
  assert.equal(checkCandidate(ctx({ avoid: 'thorn' }), 'Thornfall', recipe(compound)), 'avoid');
  const place: RecipePart = { kind: 'coined', index: 0, slot: 'place', profile: 'neutral', syllables: ['bren'], ending: 'hold', text: 'Brenhold' };
  assert.equal(checkCandidate(ctx(), 'Brenhold', recipe(place)), undefined);
  assert.equal(checkCandidate(ctx({ avoid: 'hold' }), 'Brenhold', recipe(place)), 'avoid');
});

test('a repeated root is rejected as repeat', () => {
  const r = recipe(lex(0, 'ash', 'Ash'), { kind: 'literal', text: ' of ' }, lex(1, 'ash', 'Ashes'));
  assert.equal(checkCandidate(ctx(), 'Ash of Ashes', r), 'repeat');
});

test('genre blocked phrases reject candidates as genre-guard', () => {
  const guarded: GameData = {
    ...MINI_GAME,
    genres: MINI_GENRES.map(g => (g.id === 'cozy' ? { ...g, guard: { ...g.guard, blockPhrases: ['ash oath'] } } : g)),
  };
  const r = recipe(lex(0, 'ash', 'Ash'), { kind: 'literal', text: ' ' }, lex(1, 'oath', 'Oath'));
  assert.equal(checkCandidate(ctx({ genre: 'cozy' }, guarded), 'Ash Oath', r), 'genre-guard');
  assert.equal(checkCandidate(ctx({ genre: 'cozy' }), 'Ash Oath', r), undefined);
  assert.equal(checkCandidate(ctx({}, guarded), 'Ash Oath', r), undefined);
});

test('scoring is deterministic for the same seed', () => {
  const c = ctx({ genre: 'cozy', themes: 'lantern' });
  const r = recipe(lex(0, 'lantern', 'Lantern'));
  assert.equal(scoreCandidate(c, 'Lantern', r, createRng('same')), scoreCandidate(c, 'Lantern', r, createRng('same')));
});
