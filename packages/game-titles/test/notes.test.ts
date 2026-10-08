import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildNote, MAX_NOTE_CHARS } from '../src/index';

test('the standard note reads naturally', () => {
  assert.equal(
    buildNote({ tone: 'grim', myth: 'Norse', genre: 'dark-fantasy', concepts: ['oath', 'winter', 'ruin'], variant: 0 }),
    'Grim Norse dark-fantasy title evoking oath, winter and ruin.',
  );
});

test('the alternate phrasing uses an article', () => {
  assert.equal(
    buildNote({ tone: 'epic', genre: 'fantasy', concepts: ['crown', 'oath'], variant: 1 }),
    'An epic fantasy name built around crown and oath.',
  );
});

test('invented words get an honest note', () => {
  assert.equal(
    buildNote({ tone: 'grim', genre: 'survival', concepts: [], inventedProfile: 'Norse', variant: 0 }),
    'Invented word with a Norse-inspired sound; suits a grim survival game.',
  );
});

test('notes never exceed the limit', () => {
  const long = ['transformation', 'esoteric knowledge', 'astronomical cycles', 'forgotten dynasties'];
  const note = buildNote({ tone: 'melancholic', myth: 'Indian mythology-inspired', genre: 'psychological-horror', concepts: long, variant: 0 });
  assert.ok(note.length <= MAX_NOTE_CHARS, note);
});
