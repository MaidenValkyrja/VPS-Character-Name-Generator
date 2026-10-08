import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAscii, wordCount } from '@vps-name-tools/core';
import { parsePattern, TEMPLATES, VOCAB, SLOT_TYPES, TEMPLATE_FAMILIES } from '../src/index';

test('parsePattern reads slots, options, locks and literals', () => {
  assert.deepEqual(parsePattern('The {adj?} {noun!}'), [
    { kind: 'literal', text: 'The ' },
    { kind: 'slot', types: ['adj'], optional: true, lock: false, index: 0 },
    { kind: 'literal', text: ' ' },
    { kind: 'slot', types: ['noun'], optional: false, lock: true, index: 1 },
  ]);
  assert.deepEqual(parsePattern('{name|noun!}')[0], { kind: 'slot', types: ['name', 'noun'], optional: false, lock: true, index: 0 });
});

test('parsePattern keeps the tokens of valid patterns with punctuation and literals', () => {
  assert.deepEqual(parsePattern("{name!}'s {noun}"), [
    { kind: 'slot', types: ['name'], optional: false, lock: true, index: 0 },
    { kind: 'literal', text: "'s " },
    { kind: 'slot', types: ['noun'], optional: false, lock: false, index: 1 },
  ]);
  assert.deepEqual(parsePattern('{noun}-{digits}'), [
    { kind: 'slot', types: ['noun'], optional: false, lock: false, index: 0 },
    { kind: 'literal', text: '-' },
    { kind: 'slot', types: ['digits'], optional: false, lock: false, index: 1 },
  ]);
});

test('parsePattern rejects unknown slot types', () => {
  assert.throws(() => parsePattern('{banana}'), /Unknown slot type "banana"/);
});

test('parsePattern rejects malformed braces and slot text, naming the pattern', () => {
  for (const bad of ['{adj} {noun', 'noun}', '{{noun}}', '{}', '{noun2}', '{ noun}', '{noun!?}', '{noun_pl}', '{noun|}', '{|noun}']) {
    assert.throws(() => parsePattern(bad), (e: Error) => e instanceof Error && e.message.includes(bad), bad);
  }
});

test('every shipped template variant and subtitle pattern still parses', () => {
  // Template sources are parsed when templates.ts loads, so a parse regression fails this whole file.
  for (const t of TEMPLATES) for (const v of t.variants) assert.ok(v.length > 0, t.id);
  for (const p of VOCAB.subtitlePatterns) assert.doesNotThrow(() => parsePattern(p), p);
});

test('there are 35 templates, T01 to T35, with valid families', () => {
  assert.equal(TEMPLATES.length, 35);
  assert.deepEqual(TEMPLATES.map(t => t.id), Array.from({ length: 35 }, (_, i) => `T${String(i + 1).padStart(2, '0')}`));
  for (const t of TEMPLATES) assert.ok((TEMPLATE_FAMILIES as readonly string[]).includes(t.family), t.id);
});

test('every variant except the compound template has exactly one head slot', () => {
  for (const t of TEMPLATES) {
    for (const v of t.variants) {
      const locks = v.filter(x => x.kind === 'slot' && x.lock).length;
      assert.equal(locks, t.id === 'T03' ? 0 : 1, `${t.id}: ${locks} head slots`);
    }
  }
});

test('rare myth-rhythm templates are flagged rare', () => {
  for (const id of ['T30', 'T31', 'T32', 'T33', 'T34', 'T35']) assert.equal(TEMPLATES.find(t => t.id === id)?.rare, true, id);
});

test('vocabulary is ASCII, cliché scores are in range and subtitle patterns parse without head slots', () => {
  const lists = [VOCAB.frames, VOCAB.frameSuffixes, VOCAB.franchiseSuffixes, VOCAB.numbers, VOCAB.ordinals, VOCAB.digits, VOCAB.preps, VOCAB.predicates, VOCAB.epithets];
  for (const list of lists) for (const v of list) {
    assert.ok(isAscii(v.text), v.text);
    assert.ok((v.cliche ?? 0) >= 0 && (v.cliche ?? 0) <= 1, v.text);
  }
  for (const p of VOCAB.subtitlePatterns) {
    const tokens = parsePattern(p);
    assert.ok(tokens.every(t => t.kind === 'literal' || (!t.lock && t.types.every(x => (SLOT_TYPES as readonly string[]).includes(x)))), p);
  }
});

test('classic frames are present with reduced weight, not banned', () => {
  for (const f of ['Echoes', 'Shadow', 'Chronicles', 'Rise']) assert.ok((VOCAB.frames.find(v => v.text === f)?.cliche ?? 0) >= 0.5, f);
  for (const f of ['Legends', 'Saga']) assert.ok(VOCAB.frameSuffixes.some(v => v.text === f), f);
});

test('ordinary numbers including 14 and 88 are available as digits', () => {
  assert.ok(VOCAB.digits.some(d => d.text === '14'));
  assert.ok(VOCAB.digits.some(d => d.text === '88'));
});

test('T10 and T13 declared word ranges match the rendered variants', () => {
  // Render every variant with one-word fillers, with and without the optional slot, and count words with core wordCount.
  const fillers = ['Salt', 'Ember', 'Iron'];
  for (const id of ['T10', 'T13']) {
    const t = TEMPLATES.find(x => x.id === id);
    assert.ok(t, id);
    const counts: number[] = [];
    for (const v of t.variants) {
      for (const withOptional of [true, false]) {
        const title = v
          .map(tok => (tok.kind === 'literal' ? tok.text : tok.optional && !withOptional ? '' : fillers[tok.index % fillers.length]))
          .join('')
          .replace(/\s+/g, ' ')
          .trim();
        const n = wordCount(title);
        counts.push(n);
        assert.ok(n >= t.words[0] && n <= t.words[1], `${id} "${title}" has ${n} words, declared ${t.words.join('-')}`);
      }
    }
    assert.deepEqual([Math.min(...counts), Math.max(...counts)], [...t.words], `${id} declared range is not reachable exactly`);
  }
});
