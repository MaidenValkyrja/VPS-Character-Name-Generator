import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unsafeGenerated, type SafetyLists } from '../src/index';

const LISTS: SafetyLists = { phrases: ['blood and soil', 'fourth reich'], coinedSubstrings: ['bok'] };

test('ordinary numbers are allowed', () => {
  assert.equal(unsafeGenerated('Station 88', [], LISTS), undefined);
  assert.equal(unsafeGenerated('Sector 14', [], LISTS), undefined);
  assert.equal(unsafeGenerated('Signal-14', [], LISTS), undefined);
});

test('explicit codes and the 14 + 88 pairing are blocked', () => {
  assert.equal(unsafeGenerated('Unit 1488', [], LISTS), 'code');
  assert.equal(unsafeGenerated('Sector 14/88', [], LISTS), 'code');
  assert.equal(unsafeGenerated('Station 14: Gate 88', [], LISTS), 'code-pair');
});

test('phrases match on word boundaries', () => {
  assert.equal(unsafeGenerated('Blood and Soil', [], LISTS), 'phrase');
  assert.equal(unsafeGenerated('The Fourth Reich Rising', [], LISTS), 'phrase');
  assert.equal(unsafeGenerated('Black Sun Rising', [], LISTS), undefined);
  assert.equal(unsafeGenerated('Blood and Soiled Linen', [], LISTS), undefined);
});

test('substring checks apply to invented words only', () => {
  assert.equal(unsafeGenerated('Bokarra', ['Bokarra'], LISTS), 'invented');
  assert.equal(unsafeGenerated('Bokarra Station', [], LISTS), undefined);
});

test('a repeated invented word keeps its verdict, and each list object keeps its own', () => {
  const strict: SafetyLists = { phrases: [], coinedSubstrings: ['bok', 'zul'] };
  const loose: SafetyLists = { phrases: [], coinedSubstrings: [] };
  for (let i = 0; i < 3; i++) {
    assert.equal(unsafeGenerated('Bokarra', ['Bokarra'], strict), 'invented');
    assert.equal(unsafeGenerated('Bokarra', ['Bokarra'], loose), undefined);
    assert.equal(unsafeGenerated('Kazulin', ['Kazulin'], strict), 'invented');
    assert.equal(unsafeGenerated('Marin', ['Marin'], strict), undefined);
  }
});

test('codes are still caught when digits sit among other text', () => {
  assert.equal(unsafeGenerated('Zone 14 Gate 88', [], LISTS), 'code-pair');
  assert.equal(unsafeGenerated('Echo 14 / 88', [], LISTS), 'code');
  assert.equal(unsafeGenerated('No digits here', [], LISTS), undefined);
});
