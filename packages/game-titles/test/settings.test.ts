import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSettings, DEFAULT_SETTINGS, CREATIVITY } from '../src/index';

test('defaults match the spec', () => {
  assert.deepEqual(DEFAULT_SETTINGS, {
    genre: 'fantasy', myth: 'none', tone: 'auto', tone2: 'none', style: 'auto', length: 'any',
    creativity: 'balanced', count: 10, themes: '', include: '', avoid: '',
  });
  assert.deepEqual(normalizeSettings(undefined), DEFAULT_SETTINGS);
});

test('unknown values fall back to defaults', () => {
  const s = normalizeSettings({ genre: 'space-western', myth: 'atlantis', tone: 'sad', style: 'loud', length: 'huge', creativity: 'max' });
  assert.equal(s.genre, 'fantasy');
  assert.equal(s.myth, 'none');
  assert.equal(s.tone, 'auto');
  assert.equal(s.style, 'auto');
  assert.equal(s.length, 'any');
  assert.equal(s.creativity, 'balanced');
});

test('count accepts 5, 10 and 20 as numbers or strings', () => {
  assert.equal(normalizeSettings({ count: '20' }).count, 20);
  assert.equal(normalizeSettings({ count: 5 }).count, 5);
  assert.equal(normalizeSettings({ count: '7' }).count, 10);
});

test('a second tone equal to the first is dropped', () => {
  assert.equal(normalizeSettings({ tone: 'grim', tone2: 'grim' }).tone2, 'none');
  assert.equal(normalizeSettings({ tone: 'grim', tone2: 'mystical' }).tone2, 'mystical');
});

test('text fields are sanitised and capped', () => {
  const s = normalizeSettings({ themes: 'a\u0000b'.padEnd(700, 'x'), include: 'y'.repeat(60), avoid: 3 });
  assert.equal(s.themes.length, 500);
  assert.ok(!s.themes.includes('\u0000'));
  assert.equal(s.include.length, 40);
  assert.equal(s.avoid, '');
});

test('creativity parameters match the spec', () => {
  assert.deepEqual(
    [CREATIVITY.focused.temperature, CREATIVITY.balanced.temperature, CREATIVITY.wild.temperature],
    [0.7, 1.0, 1.5],
  );
  assert.deepEqual([CREATIVITY.focused.literalRate, CREATIVITY.balanced.literalRate, CREATIVITY.wild.literalRate], [0.6, 0.4, 0.25]);
  assert.deepEqual([CREATIVITY.focused.wildcardRate, CREATIVITY.balanced.wildcardRate, CREATIVITY.wild.wildcardRate], [0, 0.06, 0.18]);
  assert.deepEqual([CREATIVITY.focused.coinedCap, CREATIVITY.balanced.coinedCap, CREATIVITY.wild.coinedCap], [0.1, 0.2, 0.35]);
});
