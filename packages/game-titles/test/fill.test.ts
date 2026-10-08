import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '@vps-name-tools/core';
import {
  buildContext, normalizeSettings, fillTemplate, renderTitle, joinCompound, morphemesOf, isBlockedEngineWord, parsePattern, TEMPLATES, VOCAB,
  type GameData, type RecipePart, type Settings, type Template,
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
