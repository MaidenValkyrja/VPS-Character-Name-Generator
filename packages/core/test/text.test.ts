import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
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

test('sanitizeInput does not leave a lone high surrogate at the cut', () => {
  const out = sanitizeInput('a'.repeat(39) + '\u{1F600}', 40);
  assert.equal(out.length, 39);
  assert.doesNotThrow(() => encodeURIComponent(out));
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

test('asciiFold strips combining marks before folding special letters', () => {
  // ǿ = o-stroke-acute, ǽ = ae-acute, ŋ = eng, Ŋ = Eng
  assert.equal(asciiFold('dǿmr'), 'domr');
  assert.equal(asciiFold('ǽ'), 'ae');
  assert.equal(asciiFold('ŋ'), 'ng');
  assert.equal(asciiFold('Ŋ'), 'Ng');
  for (const s of ['dǿmr', 'ǽ', 'ŋ', 'Ŋ']) {
    assert.equal(isAscii(asciiFold(s)), true, s);
  }
});

test('indefiniteArticle follows the sound, not the letter', () => {
  for (const w of ['unimpressed', 'uninvited', 'unimportant', 'uninspired', 'unnamed', 'umbrella', 'oak', 'hour', 'honest', 'heir', 'ember']) {
    assert.equal(indefiniteArticle(w), 'an', w);
  }
  for (const w of ['unicorn', 'unique', 'union', 'unit', 'universe', 'uniform', 'utopian', 'usual', 'euro', 'user', 'useful', 'one', 'ubiquitous', 'utility', 'ukulele', 'grim', 'hollow']) {
    assert.equal(indefiniteArticle(w), 'a', w);
  }
});

// ---- The ASCII fast path must return exactly what the full fold returns ----

const FOLD_MAP: Record<string, string> = {
  'æ': 'ae', 'Æ': 'Ae', 'œ': 'oe', 'Œ': 'Oe', 'ð': 'd', 'Ð': 'D', 'þ': 'th', 'Þ': 'Th',
  'ø': 'o', 'Ø': 'O', 'ß': 'ss', 'ł': 'l', 'Ł': 'L', 'đ': 'd', 'Đ': 'D', 'ı': 'i', 'ŋ': 'ng', 'Ŋ': 'Ng',
};
/** The fold as it was before the fast path: always decompose, strip marks, map the special letters. */
const referenceFold = (s: string): string =>
  s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[æÆœŒðÐþÞøØßłŁđĐıŊŋ]/g, ch => FOLD_MAP[ch] ?? ch);
const referenceNormalize = (s: string): string =>
  referenceFold(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9' -]+/g, ' ').replace(/\s+/g, ' ').trim();

const printable = fc.string({ unit: fc.integer({ min: 0x20, max: 0x7e }).map(n => String.fromCharCode(n)), maxLength: 60 });
const tricky = fc.string({
  unit: fc.constantFrom('a', 'Z', '7', ' ', '-', "'", '`', '’', '‘', 'é', 'Ö', 'ø', 'Æ', 'ß', 'ł', 'ŋ', 'ı', '\u0301', '\u00a0', '日', '\ufb01', '１', '👍', '\n', '\t'),
  maxLength: 40,
});

test('asciiFold and normalize match the full fold for ASCII, Latin and other text', () => {
  const strings = fc.oneof(printable, tricky, fc.string({ unit: 'binary-ascii', maxLength: 40 }), fc.string({ unit: 'grapheme', maxLength: 30 }), fc.string({ unit: 'binary', maxLength: 30 }));
  fc.assert(
    fc.property(strings, s => {
      assert.equal(asciiFold(s), referenceFold(s));
      assert.equal(normalize(s), referenceNormalize(s));
    }),
    { numRuns: 4000, seed: 20261008 },
  );
});

test('the ASCII path keeps the cases the fold treats specially', () => {
  for (const s of ["It's", 'it`s', 'Ash  Wolf', '  pad ', 'A-B', 'x\ty', '', 'Ærïs', 'ǿ']) {
    assert.equal(asciiFold(s), referenceFold(s), JSON.stringify(s));
    assert.equal(normalize(s), referenceNormalize(s), JSON.stringify(s));
  }
});

test('lemmaCandidates gives the same answer on every call, including after its memo fills and clears', () => {
  const first = new Map<string, string[]>();
  for (let i = 0; i < 6200; i++) {
    const w = `Raven${i.toString(36)}ies`;
    const got = [...lemmaCandidates(w)];
    assert.ok(got.includes(w.toLowerCase()) && got.includes(`${w.toLowerCase().slice(0, -3)}y`), w);
    if (i < 50) first.set(w, got);
  }
  for (const [w, got] of first) assert.deepEqual([...lemmaCandidates(w)], got, w);
  assert.ok(lemmaCandidates('Wolves').includes('wolf') && lemmaCandidates('Wolves')[0] === 'wolves');
  assert.ok(lemmaCandidates('Frozen').includes('freeze') && lemmaCandidates('Frozen')[0] === 'frozen');
  assert.equal(lemmaCandidates('ravens'), lemmaCandidates('ravens'), 'a repeated word returns the shared result');
});
