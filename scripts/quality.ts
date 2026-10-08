import { DATA } from '@vps-name-tools/data';
import { GAME, QUALITY_PRESETS, checkQuality, measureQuality, normalizeSettings } from '@vps-name-tools/game-titles';

const check = process.argv.includes('--check');
let failed = 0;
for (const preset of QUALITY_PRESETS) {
  const s = normalizeSettings(preset.settings);
  if (!GAME.genres.some(g => g.id === s.genre) || !DATA.myths.some(m => m.id === s.myth)) {
    console.log(`SKIP  ${preset.name} (genre or cultural pack not authored yet)`);
    continue;
  }
  const r = measureQuality(preset);
  const failures = checkQuality(r, s.creativity);
  console.log(`${failures.length ? 'FAIL' : 'OK  '}  ${preset.name}: family ${r.maxFamilyShare.toFixed(2)}, top word "${r.topWord}" ${(r.topWordShare * 100).toFixed(1)}%, frames ${(r.clicheShare * 100).toFixed(1)}%, literal ${r.literalRate.toFixed(2)}, coverage ${r.phraseCoverage.toFixed(2)}, ${r.msPer20.toFixed(1)} ms/20`);
  for (const f of failures) console.log(`        - ${f}`);
  if (failures.length) failed++;
}
process.exit(check && failed > 0 ? 1 : 0);
