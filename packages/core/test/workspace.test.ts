import { test } from 'node:test';
import assert from 'node:assert/strict';

const PACKAGES = ['@vps-name-tools/core', '@vps-name-tools/data', '@vps-name-tools/game-titles', '@vps-name-tools/site-kit'];

test('every workspace package resolves and exports PACKAGE', async () => {
  for (const name of PACKAGES) {
    const mod = (await import(name)) as { PACKAGE?: string };
    assert.equal(mod.PACKAGE, name);
  }
});
