import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseThemes, splitPhrases, STEER, type SteeringIndex } from '../src/index';

const entries: Record<string, { concepts: string[]; pos: string[] }> = {
  raven: { concepts: ['raven', 'omen'], pos: ['noun'] },
  oath: { concepts: ['oath', 'vow'], pos: ['noun'] },
  blood: { concepts: ['blood', 'kin'], pos: ['noun'] },
  pale: { concepts: ['cold', 'silence'], pos: ['adj'] },
};

const index: SteeringIndex = {
  aliases: new Map([
    ['northern lights', ['aurora', 'sky', 'cold']],
    ['frozen', ['cold', 'ice']],
    ['kingdom', ['realm', 'crown']],
  ]),
  lexicon: new Map([['raven', ['raven']], ['ravens', ['raven']], ['oath', ['oath']], ['blood', ['blood']], ['pale', ['pale']]]),
  concepts: new Set(['aurora', 'sky', 'cold', 'ice', 'realm', 'crown', 'raven', 'omen', 'oath', 'vow', 'blood', 'kin', 'silence', 'winter']),
  conceptsOfEntry: id => entries[id]?.concepts ?? [],
  posOfEntry: id => entries[id]?.pos ?? [],
};

test('splitPhrases splits on commas, semicolons and newlines and caps the count', () => {
  assert.deepEqual(splitPhrases('a, b; c\nd'), ['a', 'b', 'c', 'd']);
  assert.equal(splitPhrases(Array.from({ length: 40 }, (_, i) => `p${i}`).join(',')).length, STEER.maxPhrases);
});

test('phrases keep a display form', () => {
  const p = parseThemes('frozen kingdom, ravens, northern lights', index);
  assert.deepEqual(p.phrases.map(x => x.display), ['Frozen Kingdom', 'Ravens', 'Northern Lights']);
});

test('alias phrases boost their concepts at alias strength', () => {
  const p = parseThemes('northern lights', index);
  assert.equal(p.conceptBoosts.get('aurora'), STEER.aliasConcept);
  assert.deepEqual([...p.phrases[0].concepts].sort(), ['aurora', 'cold', 'sky']);
});

test('a direct concept id boosts at full strength', () => {
  const p = parseThemes('winter', index);
  assert.equal(p.conceptBoosts.get('winter'), STEER.directConcept);
});

test('a lexicon word, even plural, boosts its entry and concepts', () => {
  const p = parseThemes('ravens', index);
  assert.equal(p.entryBoosts.get('raven'), STEER.namedEntry);
  assert.ok((p.conceptBoosts.get('omen') ?? 1) >= STEER.namedEntryConcept);
  assert.equal(p.phrases[0].role, 'noun');
});

test('multi-word phrases are matched whole and by token', () => {
  const p = parseThemes('blood oath, frozen kingdom', index);
  assert.ok(p.entryBoosts.has('blood') && p.entryBoosts.has('oath'));
  assert.ok(p.conceptBoosts.has('ice') && p.conceptBoosts.has('crown'));
  assert.equal(p.phrases[0].role, 'noun');
});

test('unknown words become name-role phrases with no concepts', () => {
  const p = parseThemes('Aeternum', index);
  assert.equal(p.phrases[0].role, 'name');
  assert.deepEqual(p.phrases[0].concepts, []);
});

test('adjective entries and -ing words get adjective roles', () => {
  assert.equal(parseThemes('pale', index).phrases[0].role, 'adj');
  assert.equal(parseThemes('burning', index).phrases[0].role, 'gerund');
});

test('empty input gives an empty profile', () => {
  const p = parseThemes('  ', index);
  assert.equal(p.phrases.length, 0);
  assert.equal(p.conceptBoosts.size, 0);
});
