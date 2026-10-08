import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateData, noun, DATA, SAFETY, type DataBundle, type MythPack } from '../src/index';
import { MINI } from './fixtures/mini-bundle';

const errors = (b: DataBundle, release = false, bannedTerms: string[] = []) =>
  validateData(b, { release, bannedTerms }).filter(i => i.level === 'error').map(i => i.message);
const withPack = (patch: Partial<MythPack>): DataBundle => ({ ...MINI, myths: MINI.myths.map(m => (m.id === 'norse' ? { ...m, ...patch } : m)) });

test('the mini bundle has no errors', () => {
  assert.deepEqual(errors(MINI), []);
});

test('the real bundle has no errors in development mode', () => {
  assert.deepEqual(errors(DATA), []);
});

test('unknown concepts are errors', () => {
  const bad = { ...MINI, lexicon: [...MINI.lexicon, noun('xylo', 'Xylo', ['nope'])] };
  assert.ok(errors(bad).some(m => m.includes('unknown concept "nope"')));
});

test('duplicate entry ids are errors', () => {
  const bad = { ...MINI, lexicon: [...MINI.lexicon, noun('ash', 'Ash Two', ['fire'])] };
  assert.ok(errors(bad).some(m => m.includes('duplicate entry id "ash"')));
});

test('non-ASCII text is an error', () => {
  const bad = { ...MINI, lexicon: [...MINI.lexicon, noun('aegir', 'Ægir', ['fire'])] };
  assert.ok(errors(bad).some(m => m.includes('must be ASCII')));
});

test('Tier B packs need a denylist and an -inspired label', () => {
  const msgs = errors(withPack({ tier: 'B', denylist: [], noteLabel: 'Norse' }));
  assert.ok(msgs.some(m => m.includes('needs a denylist')));
  assert.ok(msgs.some(m => m.includes('-inspired')));
});

test('every cultural pack needs a denylist, Tier A included', () => {
  const msgs = errors(withPack({ tier: 'A', denylist: [] }));
  assert.ok(msgs.includes('every cultural pack needs a denylist'));
  assert.deepEqual(errors(MINI).filter(m => m.includes('denylist')), []);
});

test('only the none and original packs may have an empty denylist', () => {
  const norse = MINI.myths.find(m => m.id === 'norse')!;
  const original: MythPack = { ...norse, id: 'original', label: 'Original', noteLabel: 'original', imagery: [], symbolic: [], denylist: [] };
  const bundle: DataBundle = { ...MINI, myths: [...MINI.myths, original] };
  assert.deepEqual(errors(bundle).filter(m => m.includes('denylist')), []);
  assert.deepEqual(errors(MINI).filter(m => m.includes('denylist')), []);
});

test('Tier B note labels must carry the hyphenated -inspired suffix', () => {
  const ok = { tier: 'B' as const, label: 'Japanese-inspired', noteLabel: 'Japanese-inspired' };
  assert.deepEqual(errors(withPack(ok)).filter(m => m.includes('-inspired')), []);
  const bad = errors(withPack({ ...ok, noteLabel: 'Uninspired Japanese' }));
  assert.ok(bad.some(m => m.includes('noteLabel') && m.includes('-inspired')));
  assert.ok(!bad.some(m => m.includes('pack label')));
});

test('Tier B labels must carry the hyphenated -inspired suffix', () => {
  const bad = errors(withPack({ tier: 'B', label: 'Japanese', noteLabel: 'Japanese-inspired' }));
  assert.ok(bad.some(m => m.includes('pack label') && m.includes('-inspired')));
  assert.ok(!bad.some(m => m.includes('noteLabel')));
  const unhyphenated = errors(withPack({ tier: 'B', label: 'Japanese inspired', noteLabel: 'Japanese inspired' }));
  assert.ok(unhyphenated.some(m => m.includes('pack label')));
  assert.ok(unhyphenated.some(m => m.includes('noteLabel')));
});

test('the reviewed three-letter slur is a blocked fragment in invented words', () => {
  assert.ok(SAFETY.coinedSubstrings.includes('fag'));
});

test('symbolic terms need a source note', () => {
  const pack = MINI.myths.find(m => m.id === 'norse')!;
  assert.ok(errors(withPack({ symbolic: [{ ...pack.symbolic[0], sourceNote: ' ' }] })).some(m => m.includes('needs a source note')));
});

test('denylisted names may not appear in pack vocabulary', () => {
  const pack = MINI.myths.find(m => m.id === 'norse')!;
  const imagery = [...pack.imagery, noun('norse.odinshall', "Odin's Hall", ['home'])];
  assert.ok(errors(withPack({ imagery })).some(m => m.includes('denylisted "odin"')));
});

test('banned franchise terms are errors', () => {
  const bad = { ...MINI, lexicon: [...MINI.lexicon, noun('hyrule', 'Hyrule Field', ['realm'])] };
  assert.ok(errors(bad, false, ['hyrule']).some(m => m.includes('banned term "hyrule"')));
});

test('release mode turns content targets into errors', () => {
  assert.ok(errors(MINI, true).some(m => m.includes('target')));
});
