import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAscii } from '@vps-name-tools/core';
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

test('parsePattern rejects unknown slot types', () => {
  assert.throws(() => parsePattern('{banana}'), /Unknown slot type "banana"/);
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
