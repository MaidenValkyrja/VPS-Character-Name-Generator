import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, coinWord, readable, mutateWord, type PhoneticProfile } from '../src/index';

const P: PhoneticProfile = {
  id: 'test',
  label: 'Test',
  onsets: [['b', 1], ['k', 1], ['st', 0.6], ['v', 1], ['', 0.3]],
  nuclei: [['a', 1], ['e', 1], ['o', 1]],
  codas: [['', 2], ['n', 1], ['r', 1], ['ld', 0.4]],
  shapes: [['CV', 3], ['CVC', 2], ['V', 0.5]],
  syllables: [[2, 3], [3, 1]],
  endings: [['ara', 1]],
  endingChance: 0.2,
  forbid: ['q(?!u)', 'vv'],
  letters: [3, 10],
};

test('the same seed gives the same invented words', () => {
  const a = Array.from({ length: 5 }, ((r) => () => coinWord(r, P)?.text)(createRng('same')));
  const b = Array.from({ length: 5 }, ((r) => () => coinWord(r, P)?.text)(createRng('same')));
  assert.deepEqual(a, b);
});

test('invented words are capitalised and readable', () => {
  const r = createRng('readable');
  for (let i = 0; i < 1000; i++) {
    const w = coinWord(r, P);
    assert.ok(w, 'expected a word');
    assert.match(w.text, /^[A-Z][a-z]+$/);
    assert.ok(readable(w.text, P), w.text);
    assert.ok(w.syllables.length >= 2);
  }
});

test('readable rejects triple letters, long consonant runs, bad vowel ratio and forbidden patterns', () => {
  assert.equal(readable('Baaab', P), false);
  assert.equal(readable('Kstrnba', P), false);
  assert.equal(readable('Aeaeae', P), false);
  assert.equal(readable('Qoda', P), false);
  assert.equal(readable('Vavvo', P), false);
  assert.equal(readable('Bakor', P), true);
});

test('reject callback is honoured', () => {
  const r = createRng('reject');
  for (let i = 0; i < 300; i++) {
    const w = coinWord(r, P, { reject: x => x.toLowerCase().includes('b') });
    if (w) assert.ok(!w.text.toLowerCase().includes('b'), w.text);
  }
});

test('impossible length limits return undefined', () => {
  assert.equal(coinWord(createRng('x'), P, { minLetters: 40, maxLetters: 50 }), undefined);
});

test('mutateWord keeps at least one original syllable', () => {
  const r = createRng('mutate');
  const source = coinWord(r, P)!;
  for (let i = 0; i < 50; i++) {
    const m = mutateWord(r, P, source);
    if (!m) continue;
    assert.notEqual(m.text, source.text);
    assert.ok(m.syllables.some(s => source.syllables.includes(s)), `${source.text} → ${m.text}`);
  }
});
