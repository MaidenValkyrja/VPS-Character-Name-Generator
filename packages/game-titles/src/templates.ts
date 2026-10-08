import { parsePattern } from './pattern';
import type { TemplateFamily } from './ids';
import type { Template } from './types';

function tpl(
  id: string,
  family: TemplateFamily,
  patterns: readonly string[],
  words: readonly [number, number],
  base: number,
  extra: { rare?: boolean; alliterate?: boolean } = {},
): Template {
  return { id, family, variants: patterns.map(parsePattern), words, base, ...extra };
}

/** The 35 title structures. Spec Appendix A. */
export const TEMPLATES: readonly Template[] = [
  tpl('T01', 'single', ['{noun!}'], [1, 1], 1),
  tpl('T02', 'single', ['{abstract!}'], [1, 1], 0.7),
  tpl('T03', 'compound', ['{compound}'], [1, 1], 1),
  tpl('T04', 'coined', ['{coined!}'], [1, 1], 0.8),
  tpl('T05', 'adj-noun', ['{adj} {noun!}'], [2, 2], 1),
  tpl('T06', 'pair', ['{noun} {noun!}'], [2, 2], 0.9),
  tpl('T07', 'the-noun', ['The {adj?} {noun!}'], [2, 3], 0.8),
  tpl('T08', 'number', ['{number} {nounPl!}', '{ordinal} {noun!}'], [2, 2], 0.6),
  tpl('T09', 'pair', ['{name!} {placeWord}'], [2, 2], 0.6),
  tpl('T10', 'duo', ['{noun} & {noun!}', '{noun} and {noun!}'], [2, 3], 0.6),
  tpl('T11', 'of-phrase', ['{noun} of {noun!}'], [3, 3], 1),
  tpl('T12', 'of-phrase', ['The {noun} of {nounPl!}'], [4, 4], 0.7),
  tpl('T13', 'of-phrase', ['{noun} of the {adj?} {noun!}'], [4, 5], 0.8),
  tpl('T14', 'prepositional', ['{prep} the {adj?} {noun!}', '{prep} {name!}', '{noun} {prep} the {nounPl!}'], [2, 5], 0.7),
  tpl('T15', 'prepositional', ['Where the {nounPl!} {predicate}'], [4, 7], 0.4),
  tpl('T16', 'sentence', ['The {nounPl!} {predicate}', '{nounPl!} {predicate}'], [2, 6], 0.5),
  tpl('T17', 'imperative', ['{verb} the {adj?} {noun!}'], [3, 4], 0.6),
  tpl('T18', 'imperative', ["Don't {verb} the {noun!}", 'Do Not {verb} the {noun!}', 'Never {verb} the {noun!}'], [4, 5], 0.4),
  tpl('T19', 'frame', ['{frame} of {name|noun!}'], [3, 3], 0.5),
  tpl('T20', 'frame', ['{name!} {frameSuffix}'], [2, 2], 0.4),
  tpl('T21', 'possessive', ["{name!}'s {noun}"], [2, 2], 0.4),
  tpl('T22', 'subtitle', ['{name!}: {subtitle}'], [2, 6], 0.8),
  tpl('T23', 'subtitle', ['{place!}: {abstract}'], [2, 2], 0.4),
  tpl('T24', 'subtitle', ['{adj} {noun!}: {subtitle}'], [3, 7], 0.5),
  tpl('T25', 'suffix', ['{name|place!} {genreSuffix}'], [2, 2], 0.4),
  tpl('T26', 'descriptive', ['{adj|noun} {noun!} {genreSuffix}'], [3, 3], 0.2),
  tpl('T27', 'code', ['{noun!}-{digits}', '{noun!} {digits}'], [1, 2], 0.3),
  tpl('T28', 'place', ['{noun!} {placeWord}'], [2, 2], 0.4),
  tpl('T29', 'the-name', ['The {name|place!} {noun}'], [3, 3], 0.4),
  tpl('T30', 'kenning', ['{noun}-{noun!}'], [1, 1], 0.05, { rare: true }),
  tpl('T31', 'triad', ['{noun}, {noun} and {noun!}'], [4, 4], 0.05, { rare: true }),
  tpl('T32', 'couplet', ['{adj} {noun}, {adj} {noun!}'], [4, 4], 0.05, { rare: true }),
  tpl('T33', 'saga', ['The Saga of {name!}', "{name!}'s Saga"], [2, 4], 0.05, { rare: true }),
  tpl('T34', 'epithet', ['{name!} the {epithet}'], [3, 3], 0.1, { rare: true }),
  tpl('T35', 'alliterative', ['{noun} and {noun!}'], [3, 3], 0.1, { rare: true, alliterate: true }),
];
