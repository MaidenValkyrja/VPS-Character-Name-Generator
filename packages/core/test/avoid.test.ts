import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAvoid, violatesAvoid } from '../src/index';

test('parseAvoid understands words, phrases, prefixes, suffixes and contains', () => {
  assert.deepEqual(parseAvoid('frost, "blood oath", grim*, *heim, *shadow*, -born, legend, dark souls'), [
    { kind: 'word', value: 'frost' },
    { kind: 'phrase', value: 'blood oath' },
    { kind: 'prefix', value: 'grim' },
    { kind: 'suffix', value: 'heim' },
    { kind: 'contains', value: 'shadow' },
    { kind: 'suffix', value: 'born' },
    { kind: 'word', value: 'legend' },
    { kind: 'phrase', value: 'dark souls' },
  ]);
});

test('parseAvoid drops empties and caps at 50 rules', () => {
  assert.deepEqual(parseAvoid(' , ,'), []);
  const many = Array.from({ length: 80 }, (_, i) => `w${i}`).join(',');
  assert.equal(parseAvoid(many).length, 50);
});

test('word rules match whole words, plurals and possessives', () => {
  const rules = parseAvoid('shadow, ysolde');
  assert.ok(violatesAvoid('Shadows of Ash', [], rules));
  assert.ok(violatesAvoid("Ysolde's Lantern", [], rules));
  assert.equal(violatesAvoid('Moonshadow', [], parseAvoid('shadow')), undefined);
});

test('word rules also check engine morphemes of compounds', () => {
  const rules = parseAvoid('frost');
  assert.ok(violatesAvoid('Frostbound Oath', ['Frost', 'bound', 'Oath'], rules));
  assert.equal(violatesAvoid('Frostbound Oath', ['Frostbound', 'Oath'], rules), undefined);
});

test('prefix, suffix, contains and phrase rules', () => {
  assert.ok(violatesAvoid('Grimhold', [], parseAvoid('grim*')));
  assert.ok(violatesAvoid('Ravenheim', [], parseAvoid('*heim')));
  assert.ok(violatesAvoid('Moonshadow', [], parseAvoid('*shadow*')));
  assert.ok(violatesAvoid('The Blood Oath: Ash', [], parseAvoid('"blood oath"')));
  assert.equal(violatesAvoid('Blood of the Oath', [], parseAvoid('"blood oath"')), undefined);
});

test('no rules never violates', () => {
  assert.equal(violatesAvoid('Anything', ['Anything'], []), undefined);
});
