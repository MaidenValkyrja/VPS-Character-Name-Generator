import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA, noun, type DataBundle, type LexEntry } from '@vps-name-tools/data';
import {
  GAME, STYLES, STYLE_IDS, KNOWN_TITLES, FRANCHISE_TERMS, VOCAB, validateGameData,
  type GameData, type GenreId, type GenrePreset, type TemplateFamily,
} from '../src/index';
import { MINI_GAME } from './fixtures/mini-game';
import { MINI } from '../../data/test/fixtures/mini-bundle';

test('there are 13 styles in spec order', () => {
  assert.deepEqual(STYLES.map(s => s.id), [...STYLE_IDS]);
});

test('the real game data has no errors against the real concept registry', () => {
  assert.deepEqual(validateGameData(GAME, DATA).filter(i => i.level === 'error'), []);
});

test('known titles are normalised', () => {
  assert.ok(KNOWN_TITLES.has('dark souls'));
  assert.ok(KNOWN_TITLES.has('cities skylines'));
});

test('franchise terms are lowercase', () => {
  for (const t of FRANCHISE_TERMS) assert.equal(t, t.toLowerCase());
});

test('unknown genre concepts are errors', () => {
  const bad = { ...GAME, genres: [{ ...GAME.genres[0], conceptBoosts: { nonsense: 2 } }] };
  assert.ok(validateGameData(bad, DATA).some(i => i.level === 'error' && i.message.includes('unknown concept "nonsense"')));
});

// Negative cases cloned from MINI_GAME, validated against the MINI bundle. MINI_GAME's real VOCAB names concepts that
// MINI does not define, so each case matches its own error rather than asserting a clean baseline.
const BOGUS = { nonsense: 1 } as unknown as Partial<Record<TemplateFamily, number>>;
const genreWith = (id: string, patch: Partial<GenrePreset>): GameData => ({
  ...MINI_GAME,
  genres: MINI_GAME.genres.map(g => (g.id === id ? { ...g, ...patch } : g)),
});
const entry = (id: string, text: string, o?: Parameters<typeof noun>[3]) => noun(id, text, ['fire'], o);

interface NegativeCase { readonly name: string; readonly game: GameData; readonly where: string; readonly message: string }

const NEGATIVE_CASES: readonly NegativeCase[] = [
  { name: 'missing parent', game: genreWith('dark-fantasy', { parent: 'nope' as unknown as GenreId }), where: 'genre:dark-fantasy', message: 'parent "nope" is missing' },
  { name: 'entry id with the wrong prefix', game: genreWith('fantasy', { entries: [entry('wrong.ash', 'Ash')] }), where: 'genre:fantasy', message: 'must start with "genre.fantasy."' },
  { name: 'duplicate entry id', game: genreWith('fantasy', { entries: [entry('genre.fantasy.ash', 'Ash'), entry('genre.fantasy.ash', 'Cinder')] }), where: 'genre:fantasy', message: 'duplicate entry id "genre.fantasy.ash"' },
  { name: 'entry with no concept', game: genreWith('fantasy', { entries: [noun('genre.fantasy.ash', 'Ash', [])] }), where: 'genre:fantasy', message: 'needs at least one concept' },
  { name: 'entry with an unknown tone', game: genreWith('fantasy', { entries: [noun('genre.fantasy.ash', 'Ash', ['fire'], { tones: { bogus: 1 } as unknown as LexEntry['tones'] })] }), where: 'genre:fantasy', message: 'has unknown tone "bogus"' },
  { name: 'entry cliche above 1', game: genreWith('fantasy', { entries: [entry('genre.fantasy.ash', 'Ash', { cliche: 1.5 })] }), where: 'genre:fantasy', message: 'cliche must be between 0 and 1' },
  { name: 'frame word not in the vocabulary', game: genreWith('fantasy', { frameWords: ['Nope'] }), where: 'genre:fantasy', message: 'is not in the vocabulary' },
  { name: 'unknown style family', game: { ...MINI_GAME, styles: STYLES.map(s => (s.id === 'epic-fantasy' ? { ...s, familyWeights: BOGUS } : s)) }, where: 'style:epic-fantasy', message: 'unknown family "nonsense"' },
  { name: 'unknown genre family', game: genreWith('fantasy', { familyWeights: BOGUS }), where: 'genre:fantasy', message: 'unknown family "nonsense"' },
  { name: 'non-normalised known title', game: { ...MINI_GAME, knownTitles: new Set(['Dark Souls']) }, where: 'known:Dark Souls', message: 'must be normalised' },
  { name: 'non-ASCII genre entry', game: genreWith('fantasy', { entries: [entry('genre.fantasy.ashe', 'Ashé')] }), where: 'genre:fantasy', message: 'must be ASCII' },
  { name: 'non-ASCII entry form', game: genreWith('fantasy', { entries: [noun('genre.fantasy.ash', 'Ash', ['fire'], { forms: { plural: 'Ashés' } })] }), where: 'genre:fantasy', message: 'must be ASCII' },
  { name: 'franchise term in a genre entry', game: genreWith('fantasy', { entries: [entry('genre.fantasy.keep', 'Mordor Keep')] }), where: 'genre:fantasy', message: 'franchise term "mordor"' },
  { name: 'franchise term in a suffix word', game: genreWith('fantasy', { suffixWords: [{ text: 'Gondor' }] }), where: 'genre:fantasy', message: 'franchise term "gondor"' },
  { name: 'safety phrase in a vocab item', game: { ...MINI_GAME, vocab: { ...VOCAB, epithets: [...VOCAB.epithets, { text: 'Blood and Soil' }] } }, where: 'vocab:Blood and Soil', message: 'safety phrase "blood and soil"' },
  { name: 'cliche above 1 on a vocab item', game: { ...MINI_GAME, vocab: { ...VOCAB, frames: [...VOCAB.frames, { text: 'Overture', cliche: 1.5 }] } }, where: 'vocab:Overture', message: 'cliche must be between 0 and 1' },
];

for (const c of NEGATIVE_CASES) {
  test(`validateGameData reports ${c.name}`, () => {
    const issues = validateGameData(c.game, MINI);
    const errors = issues.filter(i => i.level === 'error').map(i => `${i.where}: ${i.message}`);
    assert.ok(
      issues.some(i => i.level === 'error' && i.where === c.where && i.message.includes(c.message)),
      `expected error at ${c.where} containing "${c.message}"; got ${JSON.stringify(errors)}`,
    );
  });
}

test('unknown families in tone weights and unknown rhythm keys in myth packs are both reported', () => {
  const stub: DataBundle = {
    ...MINI,
    tones: MINI.tones.map((t, i) => (i === 0 ? { ...t, familyWeights: { nonsense: 1 } } : t)),
    myths: MINI.myths.map(m => (m.id === 'norse' ? { ...m, rhythm: { ...m.rhythm, bogus: 2 } } : m)),
  };
  const issues = validateGameData(MINI_GAME, stub);
  assert.ok(issues.some(i => i.level === 'error' && i.where === `tone:${MINI.tones[0].id}` && i.message.includes('unknown family "nonsense"')));
  assert.ok(issues.some(i => i.level === 'error' && i.where === 'myth:norse' && i.message.includes('unknown rhythm family "bogus"')));
});

test('a small known-titles set is a warning normally and an error in release mode', () => {
  const small: GameData = { ...MINI_GAME, knownTitles: new Set(['ashfall']) };
  const levels = (opts?: { release?: boolean }) =>
    validateGameData(small, MINI, opts).filter(i => i.where === 'knownTitles').map(i => i.level);
  assert.deepEqual(levels(), ['warning']);
  assert.deepEqual(levels({ release: true }), ['error']);
});
