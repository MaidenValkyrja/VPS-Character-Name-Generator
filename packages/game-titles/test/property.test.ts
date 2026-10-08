import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { isAscii, normalize, parseAvoid, violatesAvoid } from '@vps-name-tools/core';
import { CREATIVITY_LEVELS, LENGTH_OPTIONS, STYLE_IDS, generate, lengthMatches, morphemesOf, titleKey, type Settings } from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME } from './fixtures/mini-game';

const settingsArb = fc.record({
  genre: fc.constantFrom('fantasy', 'dark-fantasy', 'cozy'),
  myth: fc.constantFrom('none', 'norse'),
  tone: fc.constantFrom('auto', 'grim', 'cozy', 'epic'),
  tone2: fc.constantFrom('none', 'grim', 'cozy'),
  style: fc.constantFrom('auto', ...STYLE_IDS),
  length: fc.constantFrom(...LENGTH_OPTIONS),
  creativity: fc.constantFrom(...CREATIVITY_LEVELS),
  count: fc.constantFrom(5, 10),
  themes: fc.constantFrom('', 'lantern, aurora', 'blood oath, frozen kingdom', 'Aeternum'),
  include: fc.constantFrom('', 'Aeternum', 'Raven'),
  avoid: fc.constantFrom('', 'oath', '*frost*, pale'),
}) as fc.Arbitrary<Settings>;

test('generation invariants hold for random settings and seeds', () => {
  fc.assert(
    fc.property(settingsArb, fc.string({ minLength: 1, maxLength: 8 }), (s, seed) => {
      const r = generate(s, { seed, data: MINI, game: MINI_GAME });
      if (r.notices.some(n => n.code === 'include-conflicts-avoid')) return r.titles.length === 0;
      const keys = r.titles.map(t => titleKey(t.title));
      assert.equal(new Set(keys).size, keys.length);
      assert.ok(r.titles.length === s.count || r.notices.some(n => n.code === 'shortfall'));
      const rules = parseAvoid(s.avoid);
      for (const t of r.titles) {
        if (s.include) assert.ok(titleKey(t.title).includes(normalize(s.include)), t.title);
        assert.equal(violatesAvoid(t.title, morphemesOf(t.recipe.parts), rules), undefined, t.title);
        assert.ok(lengthMatches(t.title, s.length), `${t.title} vs ${s.length}`);
        assert.ok(isAscii(t.title), t.title);
      }
      const again = generate(s, { seed, data: MINI, game: MINI_GAME });
      assert.deepEqual(again.titles.map(t => t.title), r.titles.map(t => t.title));
      return true;
    }),
    { numRuns: 150 },
  );
});
