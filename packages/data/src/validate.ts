import { isAscii, normalize } from '@vps-name-tools/core';
import { MYTH_IDS, PROFILE_IDS, TONE_IDS } from './ids';
import type { DataBundle, Issue, LexEntry } from './types';

export const RELEASE_TARGETS = { concepts: 250, aliases: 1000, lexicon: 1200, imageryPerPack: 40 } as const;

/** Folds text and terms alike: normalised, apostrophes and hyphens become spaces, spaces collapse. */
export const foldTerm = (s: string) => normalize(s).replace(/['-]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * A multi-word term matches only as a whole-word phrase. A single-word term matches a whole token, or, when it has
 * 5+ letters, the start of a token ("Freyjasgard" contains "freyja"). It never matches inside a token or across words
 * ("Shades" is not "hades", "Hall Ahead" is not "allah"). The engine adds its own prefix check for invented words (Task 14).
 */
export function containsTerm(normText: string, term: string): boolean {
  const t = foldTerm(term);
  if (!t) return false;
  const text = foldTerm(normText);
  if (t.includes(' ')) return ` ${text} `.includes(` ${t} `);
  const prefixOk = t.replace(/[^a-z]/g, '').length >= 5;
  return text.split(' ').some(tok => tok === t || (prefixOk && tok.startsWith(t)));
}

export function validateData(b: DataBundle, o: { release?: boolean; bannedTerms?: readonly string[] } = {}): Issue[] {
  const issues: Issue[] = [];
  const error = (where: string, message: string) => issues.push({ level: 'error', where, message });
  const target = (where: string, message: string) => issues.push({ level: o.release ? 'error' : 'warning', where, message });

  const conceptIds = new Set<string>();
  for (const c of b.concepts) {
    if (conceptIds.has(c.id)) error(`concept:${c.id}`, 'duplicate concept id');
    if (!/^[a-z][a-z0-9-]*$/.test(c.id)) error(`concept:${c.id}`, 'concept ids are lowercase kebab-case');
    conceptIds.add(c.id);
  }
  for (const c of b.concepts) for (const r of c.related) if (!conceptIds.has(r)) error(`concept:${c.id}`, `related concept "${r}" does not exist`);
  for (const [key, cs] of Object.entries(b.aliases)) {
    if (key !== normalize(key)) error(`alias:${key}`, 'alias keys must be normalised (lowercase ASCII)');
    for (const c of cs) if (!conceptIds.has(c)) error(`alias:${key}`, `unknown concept "${c}"`);
  }

  const ids = new Set<string>();
  const checkEntry = (e: LexEntry, where: string) => {
    if (ids.has(e.id)) error(where, `duplicate entry id "${e.id}"`);
    ids.add(e.id);
    if (!isAscii(e.text)) error(where, `"${e.text}" must be ASCII`);
    for (const f of Object.values(e.forms ?? {})) if (f && !isAscii(f)) error(where, `form "${f}" must be ASCII`);
    if (e.concepts.length === 0) error(where, 'an entry needs at least one concept');
    for (const c of e.concepts) if (!conceptIds.has(c)) error(where, `unknown concept "${c}"`);
    for (const t of Object.keys(e.tones ?? {})) if (!(TONE_IDS as readonly string[]).includes(t)) error(where, `unknown tone "${t}"`);
    if (e.cliche !== undefined && (e.cliche < 0 || e.cliche > 1)) error(where, 'cliche must be between 0 and 1');
    const n = normalize(e.text);
    for (const term of o.bannedTerms ?? []) if (containsTerm(n, term)) error(where, `"${e.text}" contains banned term "${term}"`);
    for (const p of b.safety.phrases) if (containsTerm(n, p)) error(where, `"${e.text}" matches a safety phrase`);
  };
  for (const e of b.lexicon) checkEntry(e, `lexicon:${e.id}`);

  for (const t of b.tones) for (const c of Object.keys(t.conceptBoosts)) if (!conceptIds.has(c)) error(`tone:${t.id}`, `unknown concept "${c}"`);

  const profileIds = new Set(b.profiles.map(p => p.id));
  if (!profileIds.has('neutral')) error('profiles', 'the neutral profile is required');
  for (const p of b.profiles) if (!(PROFILE_IDS as readonly string[]).includes(p.id)) error(`profile:${p.id}`, 'unknown profile id');

  const mythIds = new Set<string>(b.myths.map(m => m.id));
  if (!mythIds.has('none')) error('myths', 'the none pack is required');
  for (const m of b.myths) {
    const where = `myth:${m.id}`;
    if (!profileIds.has(m.profile)) target(where, `profile "${m.profile}" is not defined yet`);
    for (const x of m.blend ?? []) if (!mythIds.has(x.id)) target(where, `blend references missing pack "${x.id}"`);
    for (const c of Object.keys(m.conceptBoosts)) if (!conceptIds.has(c)) error(where, `unknown concept "${c}"`);
    for (const e of [...m.imagery, ...m.symbolic]) {
      if (!e.id.startsWith(`${m.id}.`)) error(where, `entry id "${e.id}" must start with "${m.id}."`);
      checkEntry(e, `${where}:${e.id}`);
    }
    for (const e of m.symbolic) if (!e.sourceNote.trim()) error(where, `symbolic term "${e.text}" needs a source note`);
    for (const e of [...m.imagery, ...m.symbolic]) {
      const n = normalize(e.text);
      for (const d of m.denylist) if (containsTerm(n, d)) error(where, `"${e.text}" contains denylisted "${d}"`);
    }
    if (m.id !== 'none' && m.id !== 'original' && m.denylist.length === 0) error(where, 'every cultural pack needs a denylist');
    if (m.tier === 'B' && !/-inspired/.test(m.label)) error(where, 'Tier B pack label must say "-inspired"');
    if (m.tier === 'B' && !/-inspired/.test(m.noteLabel)) error(where, 'Tier B pack noteLabel must say "-inspired"');
    if (m.review.status === 'held' && !m.review.notes.trim()) error(where, 'a held pack must give the reason in review.notes');
    if (m.id !== 'none' && !m.blend && m.imagery.length < RELEASE_TARGETS.imageryPerPack) {
      target(where, `imagery has ${m.imagery.length} entries; target ${RELEASE_TARGETS.imageryPerPack}`);
    }
    if (m.id !== 'none' && m.review.status === 'draft') target(where, 'review status is still draft');
  }

  if (b.concepts.length < RELEASE_TARGETS.concepts) target('concepts', `${b.concepts.length} concepts; target ${RELEASE_TARGETS.concepts}`);
  if (Object.keys(b.aliases).length < RELEASE_TARGETS.aliases) target('aliases', `${Object.keys(b.aliases).length} aliases; target ${RELEASE_TARGETS.aliases}`);
  if (b.lexicon.length < RELEASE_TARGETS.lexicon) target('lexicon', `${b.lexicon.length} entries; target ${RELEASE_TARGETS.lexicon}`);
  if (b.tones.length !== TONE_IDS.length) target('tones', `${b.tones.length} of ${TONE_IDS.length} tones defined`);
  if (b.profiles.length !== PROFILE_IDS.length) target('profiles', `${b.profiles.length} of ${PROFILE_IDS.length} profiles defined`);
  for (const id of MYTH_IDS) if (!mythIds.has(id)) target('myths', `pack "${id}" is missing`);
  return issues;
}
