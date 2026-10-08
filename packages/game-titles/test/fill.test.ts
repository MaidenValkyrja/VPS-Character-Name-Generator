import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '@vps-name-tools/core';
import {
  buildContext, normalizeSettings, fillTemplate, renderTitle, joinCompound, morphemesOf, TEMPLATES,
  type RecipePart, type Settings,
} from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME } from './fixtures/mini-game';

const ctx = (patch: Partial<Settings> = {}) => buildContext(normalizeSettings(patch), MINI, MINI_GAME, createRng('fill'));
const T = (id: string) => TEMPLATES.find(t => t.id === id)!;

test('renderTitle collapses spaces and title-cases', () => {
  const parts: RecipePart[] = [{ kind: 'literal', text: 'The ' }, { kind: 'literal', text: ' ' }, { kind: 'lex', index: 1, slot: 'noun', entryId: 'crown', text: 'Crown' }];
  assert.equal(renderTitle(parts), 'The Crown');
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
  for (let i = 0; i < 20; i++) {
    const r = fillTemplate(c, createRng(`all${i}`), T('T35'), 0);
    if (!r) continue;
    const words = r.parts.filter(p => p.kind !== 'literal').map(p => p.text.toLowerCase());
    assert.equal(words[0][0], words[1][0], words.join(' & '));
  }
});
