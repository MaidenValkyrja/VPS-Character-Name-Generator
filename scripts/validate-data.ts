import { DATA, validateData, type Issue } from '@vps-name-tools/data';
import { FRANCHISE_TERMS, GAME, validateGameData } from '@vps-name-tools/game-titles';

const release = process.argv.includes('--release');
const issues: Issue[] = [
  ...validateData(DATA, { release, bannedTerms: FRANCHISE_TERMS }),
  ...validateGameData(GAME, DATA, { release }),
];
for (const i of issues) console.log(`${i.level.toUpperCase().padEnd(7)} ${i.where}: ${i.message}`);
const errors = issues.filter(i => i.level === 'error').length;
console.log(`\n${errors} error(s), ${issues.length - errors} warning(s)${release ? ' (release mode)' : ''}`);
process.exit(errors > 0 ? 1 : 0);
