import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from '@vps-name-tools/core';
import { containsTerm } from '../src/index';

/** The validator passes normalised entry text; the term is whatever the denylist or phrase list holds. */
const has = (text: string, term: string) => containsTerm(normalize(text), term);

test('a single-word term matches a whole token', () => {
  assert.equal(has('Odin', 'odin'), true);
  assert.equal(has('The Odin Saga', 'odin'), true);
  assert.equal(has("Odin's Hall", 'odin'), true);
  assert.equal(has('Thor', 'thor'), true);
});

test('a term under five letters never matches inside a longer token', () => {
  assert.equal(has('Thornfall', 'thor'), false);
  assert.equal(has('Thorn', 'thor'), false);
  assert.equal(has('Lokiwood', 'loki'), false);
});

test('a term of five or more letters matches the start of a token', () => {
  assert.equal(has('Freyjasgard', 'freyja'), true);
  assert.equal(has('Zeldaria', 'zelda'), true);
  assert.equal(has('Hyrule Field', 'hyrule'), true);
});

test('terms do not match inside ordinary words or across word boundaries', () => {
  assert.equal(has('Shades', 'hades'), false);
  assert.equal(has('Chorus', 'horus'), false);
  assert.equal(has('Hall Ahead', 'allah'), false);
  assert.equal(has('Moonzelda', 'zelda'), false);
});

test('a multi-word term matches only as a word-boundary phrase', () => {
  assert.equal(has('Blood and Soil', 'blood and soil'), true);
  assert.equal(has('The Blood and Soil Keeper', 'blood and soil'), true);
  assert.equal(has('Blood and Soiled', 'blood and soil'), false);
  assert.equal(has('Bloodand Soil', 'blood and soil'), false);
  assert.equal(has('Sieg Heil', 'sieg heil'), true);
  assert.equal(has('Siegheil', 'sieg heil'), false);
});

test('the term is folded the same way as the text', () => {
  assert.equal(has("Philosopher's Stone", "philosopher's stone"), true);
  assert.equal(has("Ra's Eye", "ra's"), true);
  assert.equal(has('Middle Earth Saga', 'middle-earth'), true);
  assert.equal(has('Middle-Earth', 'middle earth'), true);
  assert.equal(has('Aegir', 'Ægir'), true);
  assert.equal(has('odin', 'ODIN'), true);
  assert.equal(has('Odin   Hall', ' odin '), true);
});

test('an empty term matches nothing', () => {
  assert.equal(has('Anything', ''), false);
  assert.equal(has('Anything', '   '), false);
  assert.equal(has('Anything', "'"), false);
});
