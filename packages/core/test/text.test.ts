import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  asciiFold, isAscii, normalize, sanitizeInput, titleCase, wordCount, contentWords,
  syllableCount, indefiniteArticle, pluralize, lemmaCandidates,
} from '../src/index';

test('asciiFold removes diacritics and folds special letters', () => {
  assert.equal(asciiFold('Hrímþursar'), 'Hrimthursar');
  assert.equal(asciiFold('Ægir Óðinn'), 'Aegir Odinn');
  assert.equal(asciiFold('Straße'), 'Strasse');
  assert.equal(isAscii(asciiFold('Mjǫllnir')), true);
});

test('normalize lowercases, folds and strips punctuation', () => {
  assert.equal(normalize('  Aeternum: The Ashen Crown! '), 'aeternum the ashen crown');
  assert.equal(normalize('Ysolde’s Lantern'), "ysolde's lantern");
  assert.equal(normalize('Wolf-Winter'), 'wolf-winter');
  assert.equal(normalize('Pip & Puddle'), 'pip puddle');
});

test('sanitizeInput removes control characters and caps length', () => {
  assert.equal(sanitizeInput('a\u0000b\nc', 10), 'a b c');
  assert.equal(sanitizeInput('abcdef', 3), 'abc');
});

test('titleCase keeps small words lowercase except first, last and after a colon', () => {
  assert.equal(titleCase('where the ravens sleep'), 'Where the Ravens Sleep');
  assert.equal(titleCase('aeternum: the ashen crown'), 'Aeternum: The Ashen Crown');
  assert.equal(titleCase('bury the crown'), 'Bury the Crown');
  assert.equal(titleCase('stone, salt and song'), 'Stone, Salt and Song');
  assert.equal(titleCase("ysolde's lantern"), "Ysolde's Lantern");
  assert.equal(titleCase('wolf-winter'), 'Wolf-Winter');
  assert.equal(titleCase('NEON grid'), 'NEON Grid');
  assert.equal(titleCase('what dreams are made of'), 'What Dreams Are Made Of');
});

test('wordCount ignores symbols and treats hyphenated words as one', () => {
  assert.equal(wordCount('Pip & Puddle'), 2);
  assert.equal(wordCount('Wolf-Winter'), 1);
  assert.equal(wordCount('Aeternum: Ashen Crown'), 3);
  assert.deepEqual(contentWords('The Hymn of Ravens'), ['hymn', 'ravens']);
});

test('syllableCount heuristic', () => {
  assert.equal(syllableCount('oath'), 1);
  assert.equal(syllableCount('stone'), 1);
  assert.equal(syllableCount('raven'), 2);
  assert.equal(syllableCount('bramble'), 2);
  assert.equal(syllableCount('aeternum'), 3);
  assert.equal(syllableCount('cyberpunk'), 3);
});

test('indefiniteArticle', () => {
  assert.equal(indefiniteArticle('oath'), 'an');
  assert.equal(indefiniteArticle('grim'), 'a');
  assert.equal(indefiniteArticle('unicorn'), 'a');
  assert.equal(indefiniteArticle('hour'), 'an');
});

test('pluralize regular words, last word of a phrase only', () => {
  assert.equal(pluralize('Raven'), 'Ravens');
  assert.equal(pluralize('Story'), 'Stories');
  assert.equal(pluralize('Torch'), 'Torches');
  assert.equal(pluralize('Blood Oath'), 'Blood Oaths');
});

test('lemmaCandidates covers plurals, -ing, -ed and irregular forms', () => {
  assert.ok(lemmaCandidates('ravens').includes('raven'));
  assert.ok(lemmaCandidates('stories').includes('story'));
  assert.ok(lemmaCandidates('frozen').includes('freeze'));
  assert.ok(lemmaCandidates('burning').includes('burn'));
  assert.ok(lemmaCandidates('wolves').includes('wolf'));
  assert.ok(!lemmaCandidates('glass').includes('glas'));
});
