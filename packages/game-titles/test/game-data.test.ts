import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from '@vps-name-tools/data';
import { GAME, STYLES, STYLE_IDS, KNOWN_TITLES, FRANCHISE_TERMS, validateGameData } from '../src/index';

test('there are 13 styles in spec order', () => {
  assert.deepEqual(STYLES.map(s => s.id), [...STYLE_IDS]);
});

test('the real game data has no errors against the real concept registry', () => {
  assert.deepEqual(validateGameData(GAME, DATA).filter(i => i.level === 'error'), []);
});

test('known titles are normalised', () => {
  assert.ok(KNOWN_TITLES.has('dark souls'));
  assert.ok(KNOWN_TITLES.has('cities skylines'));
});

test('franchise terms are lowercase', () => {
  for (const t of FRANCHISE_TERMS) assert.equal(t, t.toLowerCase());
});

test('unknown genre concepts are errors', () => {
  const bad = { ...GAME, genres: [{ ...GAME.genres[0], conceptBoosts: { nonsense: 2 } }] };
  assert.ok(validateGameData(bad, DATA).some(i => i.level === 'error' && i.message.includes('unknown concept "nonsense"')));
});
