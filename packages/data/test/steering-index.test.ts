import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSteeringIndex } from '../src/index';
import { MINI } from './fixtures/mini-bundle';

test('the index maps text and word forms to entry ids', () => {
  const idx = buildSteeringIndex(MINI);
  assert.deepEqual(idx.lexicon.get('ravens'), ['raven']);
  assert.deepEqual(idx.lexicon.get('ashen'), ['ash']);
  assert.deepEqual(idx.lexicon.get('rune'), ['norse.rune']);
  assert.deepEqual(idx.conceptsOfEntry('norse.rune'), ['omen', 'gods']);
  assert.deepEqual(idx.posOfEntry('pale'), ['adj']);
  assert.ok(idx.concepts.has('aurora'));
  assert.deepEqual(idx.aliases.get('northern lights'), ['aurora', 'sky', 'cold']);
});

test('extra entries are indexed too', () => {
  const idx = buildSteeringIndex(MINI, [{ id: 'genre.cozy.teacup', text: 'Teacup', pos: ['noun'], concepts: ['home'], register: 'whimsical' }]);
  assert.deepEqual(idx.lexicon.get('teacup'), ['genre.cozy.teacup']);
});
