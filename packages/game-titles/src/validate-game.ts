import { isAscii, normalize } from '@vps-name-tools/core';
import { PROFILE_IDS, TONE_IDS, type DataBundle, type Issue } from '@vps-name-tools/data';
import { GENRE_IDS, STYLE_IDS, TEMPLATE_FAMILIES } from './ids';
import type { GameData, VocabItem } from './types';

export const KNOWN_TITLES_TARGET = 1500;

export function validateGameData(game: GameData, data: DataBundle, opts: { release?: boolean } = {}): Issue[] {
  const issues: Issue[] = [];
  const error = (where: string, message: string) => issues.push({ level: 'error', where, message });
  const target = (where: string, message: string) => issues.push({ level: opts.release ? 'error' : 'warning', where, message });
  const concepts = new Set(data.concepts.map(c => c.id));
  const families = TEMPLATE_FAMILIES as readonly string[];

  const ids = new Set<string>();
  for (const g of game.genres) {
    const where = `genre:${g.id}`;
    if (ids.has(g.id)) error(where, 'duplicate genre');
    ids.add(g.id);
    if (g.parent && !game.genres.some(x => x.id === g.parent)) error(where, `parent "${g.parent}" is missing`);
    for (const c of [...Object.keys(g.conceptBoosts), ...(g.suppress ?? [])]) if (!concepts.has(c)) error(where, `unknown concept "${c}"`);
    if (g.defaultTones.length === 0) error(where, 'needs at least one default tone');
    for (const t of g.defaultTones) if (!(TONE_IDS as readonly string[]).includes(t)) error(where, `unknown tone "${t}"`);
    for (const f of Object.keys(g.familyWeights)) if (!families.includes(f)) error(where, `unknown family "${f}"`);
    if (!(PROFILE_IDS as readonly string[]).includes(g.profile)) error(where, `unknown profile "${g.profile}"`);
    for (const fw of g.frameWords ?? []) if (!game.vocab.frames.some(v => v.text === fw)) error(where, `frame word "${fw}" is not in the vocabulary`);
    for (const e of g.entries ?? []) {
      if (!e.id.startsWith(`genre.${g.id}.`)) error(where, `entry id "${e.id}" must start with "genre.${g.id}."`);
      for (const c of e.concepts) if (!concepts.has(c)) error(where, `entry "${e.id}" has unknown concept "${c}"`);
    }
  }
  for (const id of GENRE_IDS) if (!ids.has(id)) target('genres', `genre "${id}" is missing`);

  if (game.styles.length !== STYLE_IDS.length) error('styles', `expected ${STYLE_IDS.length} styles`);
  for (const s of game.styles) for (const f of Object.keys(s.familyWeights)) if (!families.includes(f)) error(`style:${s.id}`, `unknown family "${f}"`);
  if (game.templates.length !== 35) error('templates', 'expected 35 templates');
  for (const t of data.tones) for (const f of Object.keys(t.familyWeights)) if (!families.includes(f)) error(`tone:${t.id}`, `unknown family "${f}"`);
  for (const m of data.myths) for (const f of Object.keys(m.rhythm)) if (!families.includes(f)) error(`myth:${m.id}`, `unknown rhythm family "${f}"`);

  const v = game.vocab;
  const items: VocabItem[] = [...v.frames, ...v.frameSuffixes, ...v.franchiseSuffixes, ...v.numbers, ...v.ordinals, ...v.digits, ...v.preps, ...v.predicates, ...v.epithets];
  for (const item of items) {
    if (!isAscii(item.text)) error(`vocab:${item.text}`, 'must be ASCII');
    for (const c of item.concepts ?? []) if (!concepts.has(c)) error(`vocab:${item.text}`, `unknown concept "${c}"`);
  }
  for (const t of game.knownTitles) if (t !== normalize(t) || !t) error(`known:${t}`, 'known titles must be normalised and non-empty');
  if (game.knownTitles.size < KNOWN_TITLES_TARGET) target('knownTitles', `${game.knownTitles.size} known titles; target ${KNOWN_TITLES_TARGET}`);
  return issues;
}
