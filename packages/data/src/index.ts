import { ALIASES } from './aliases';
import { CONCEPTS } from './concepts';
import { LEXICON } from './lexicon/index';
import { MYTHS } from './myths/index';
import { PROFILES } from './profiles/index';
import { SAFETY } from './safety';
import { TONES } from './tones';
import type { DataBundle } from './types';

export const PACKAGE = '@vps-name-tools/data';
export * from './ids';
export * from './types';
export * from './build';
export * from './steering-index';
export * from './validate';
export { ALIASES, CONCEPTS, LEXICON, MYTHS, PROFILES, SAFETY, TONES };

export const DATA: DataBundle = {
  concepts: CONCEPTS, aliases: ALIASES, lexicon: LEXICON, tones: TONES, profiles: PROFILES, myths: MYTHS, safety: SAFETY,
};
