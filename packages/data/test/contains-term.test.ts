import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from '@vps-name-tools/core';
import { createRng } from '@vps-name-tools/core';
import { containsTerm, termMatcher } from '../src/index';

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

const MATRIX_TERMS = [
  'odin', 'thor', 'freyja', 'hyrule', 'blood and soil', 'sieg heil', "ra's", 'middle-earth', "philosopher's stone", 'Ægir', 'zelda', 'allah',
];
const MATRIX_TEXTS = [
  'odin', 'the odin saga', "odin's hall", 'thornfall', 'thor', 'freyjasgard', 'hyrule field', 'shades', 'hall ahead',
  'blood and soil keeper', 'blood and soiled', "ra's eye", 'middle earth saga', "philosopher's stone", 'aegir', 'moonzelda', 'zeldaria', '', 'sieg heil',
];

test('termMatcher agrees with containsTerm over a matrix of terms and texts', () => {
  const match = termMatcher(MATRIX_TERMS);
  for (const text of MATRIX_TEXTS) {
    assert.equal(match(text) !== undefined, MATRIX_TERMS.some(t => containsTerm(text, t)), `text "${text}"`);
  }
});

test('termMatcher returns the first matching term in list order', () => {
  assert.equal(termMatcher(['hyrule', 'odin', 'freyja'])('odin in hyrule'), 'hyrule');
  assert.equal(termMatcher(['freyja', 'odin'])('odin and freyjasgard'), 'freyja');
  assert.equal(termMatcher(['blood and soil', 'blood'])('blood and soil'), 'blood and soil');
  assert.equal(termMatcher(['odin'])('thorn'), undefined);
});

test('termMatcher ignores empty terms and handles an empty list or text', () => {
  assert.equal(termMatcher([])('anything'), undefined);
  assert.equal(termMatcher(['', '   ', "'"])('anything'), undefined);
  assert.equal(termMatcher(['odin'])(''), undefined);
});

test('termMatcher agrees with containsTerm on generated terms and texts', () => {
  const rng = createRng('term-equivalence');
  const syllables = ['ra', 'ka', 'lo', 'ni', 'zel', 'da', 'hy', 'rule', 'od', 'in'];
  const word = () => Array.from({ length: 1 + Math.floor(rng() * 3) }, () => syllables[Math.floor(rng() * syllables.length)]).join('');
  const phrase = (max: number) => {
    const sep = () => (rng() < 0.15 ? "'" : rng() < 0.15 ? '-' : ' ');
    let out = word();
    for (let i = Math.floor(rng() * max); i > 0; i--) out += sep() + word();
    return out;
  };
  for (let round = 0; round < 60; round++) {
    const terms = Array.from({ length: 8 }, () => phrase(2));
    const match = termMatcher(terms);
    for (let k = 0; k < 40; k++) {
      // Often embed a term (or a stretched form of it) so phrase and prefix matches occur, not only misses.
      const pick = terms[Math.floor(rng() * terms.length)];
      const text = rng() < 0.5 ? phrase(4) : rng() < 0.5 ? `${phrase(1)} ${pick} ${phrase(1)}` : `${phrase(1)} ${pick}${word()}`;
      assert.equal(match(text) !== undefined, terms.some(t => containsTerm(text, t)), `terms ${JSON.stringify(terms)} text "${text}"`);
    }
  }
});
