import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measureQuality, checkQuality } from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME } from './fixtures/mini-game';

test('measureQuality reports ratios for a preset', () => {
  const r = measureQuality({ name: 'mini', settings: { genre: 'dark-fantasy', myth: 'norse', themes: 'lantern, aurora' } }, { batches: 10, data: MINI, game: MINI_GAME });
  assert.equal(r.titles, 200);
  for (const v of [r.maxFamilyShare, r.topWordShare, r.clicheShare, r.literalRate, r.phraseCoverage]) assert.ok(v >= 0 && v <= 1, String(v));
  assert.ok(r.msPer20 > 0);
});

test('checkQuality lists threshold failures', () => {
  const failures = checkQuality(
    { preset: 'x', titles: 100, maxFamilyShare: 0.5, topWordShare: 0.01, topWord: 'ash', clicheShare: 0.1, literalRate: 0.9, phraseCoverage: 1, avgChars: 12, msPer20: 5, hasThemes: true },
    'balanced',
  );
  assert.ok(failures.some(f => f.includes('family')));
  assert.ok(failures.some(f => f.includes('literal')));
});
