import type { SafetyLists } from '@vps-name-tools/core';
import { COINED_SUBSTRINGS } from './safety-generated';

/** Unambiguous extremist phrases and codes (ADL Hate Symbols Database). Engine output only; ordinary numbers stay allowed. */
export const EXTREMIST_PHRASES: readonly string[] = [
  'blood and soil', 'fourteen words', 'sieg heil', 'heil hitler', 'fourth reich', 'third reich', 'white power',
  'white pride', 'sonnenrad', 'wolfsangel', 'totenkopf', 'day of the rope', 'racial holy war', 'rahowa', 'zyklon',
  'aryan nation', 'aryan nations', 'hitler', 'nazi', 'swastika',
];

/** 3-letter slurs copied from the build-safety review list (step above). Keep this list short and reviewed. */
export const EXTRA_SHORT_FRAGMENTS: readonly string[] = [];

/** Extremist fragments an invented word must never contain ("Nazimund"). Invented words only. */
export const EXTREMIST_FRAGMENTS: readonly string[] = ['nazi', 'hitler', 'heil', 'reich', 'sieg', 'aryan', 'kkk', 'zyklon', 'rahowa'];

export const SAFETY: SafetyLists = {
  phrases: EXTREMIST_PHRASES,
  coinedSubstrings: [...COINED_SUBSTRINGS, ...EXTRA_SHORT_FRAGMENTS, ...EXTREMIST_FRAGMENTS],
};
