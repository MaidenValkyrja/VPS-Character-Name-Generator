import { sanitizeInput } from '@vps-name-tools/core';
import { MYTH_IDS, TONE_IDS, type MythId, type ToneId } from '@vps-name-tools/data';
import {
  CREATIVITY_LEVELS, GENRE_IDS, LENGTH_OPTIONS, RESULT_COUNTS, STYLE_IDS,
  type Creativity, type GenreId, type LengthOption, type ResultCount, type StyleId,
} from './ids';

export interface Settings {
  readonly genre: GenreId;
  readonly myth: MythId;
  readonly tone: ToneId | 'auto';
  readonly tone2: ToneId | 'none';
  readonly style: StyleId | 'auto';
  readonly length: LengthOption;
  readonly creativity: Creativity;
  readonly count: ResultCount;
  readonly themes: string;
  readonly include: string;
  readonly avoid: string;
}

export const DEFAULT_SETTINGS: Settings = {
  genre: 'fantasy', myth: 'none', tone: 'auto', tone2: 'none', style: 'auto', length: 'any',
  creativity: 'balanced', count: 10, themes: '', include: '', avoid: '',
};

export const INPUT_LIMITS = { themes: 500, include: 40, avoid: 500 } as const;

export interface CreativityParams {
  readonly temperature: number;
  readonly literalRate: number;
  readonly wildcardRate: number;
  readonly coinedCap: number;
  /** Weight for words that match none of the boosted concepts. */
  readonly baseline: number;
  readonly rareTemplateBoost: number;
  /** Weight of two random Tier A packs blended into "Original Mythic". */
  readonly crossMyth: number;
}

export const CREATIVITY: Readonly<Record<Creativity, CreativityParams>> = {
  focused: { temperature: 0.7, literalRate: 0.6, wildcardRate: 0, coinedCap: 0.1, baseline: 0.03, rareTemplateBoost: 0.5, crossMyth: 0 },
  balanced: { temperature: 1.0, literalRate: 0.4, wildcardRate: 0.06, coinedCap: 0.2, baseline: 0.08, rareTemplateBoost: 1, crossMyth: 0 },
  wild: { temperature: 1.5, literalRate: 0.25, wildcardRate: 0.18, coinedCap: 0.35, baseline: 0.25, rareTemplateBoost: 2.5, crossMyth: 0.15 },
};

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function normalizeSettings(input?: Partial<Record<keyof Settings, unknown>>): Settings {
  const i = input ?? {};
  const text = (v: unknown, max: number) => (typeof v === 'string' ? sanitizeInput(v, max) : '');
  const tone = pick<ToneId | 'auto'>(i.tone, ['auto', ...TONE_IDS], 'auto');
  let tone2 = pick<ToneId | 'none'>(i.tone2, ['none', ...TONE_IDS], 'none');
  if (tone2 === tone) tone2 = 'none';
  const n = typeof i.count === 'string' ? Number(i.count) : i.count;
  const count = (RESULT_COUNTS as readonly unknown[]).includes(n) ? (n as ResultCount) : DEFAULT_SETTINGS.count;
  return {
    genre: pick(i.genre, GENRE_IDS, 'fantasy'),
    myth: pick(i.myth, MYTH_IDS, 'none'),
    tone,
    tone2,
    style: pick<StyleId | 'auto'>(i.style, ['auto', ...STYLE_IDS], 'auto'),
    length: pick(i.length, LENGTH_OPTIONS, 'any'),
    creativity: pick(i.creativity, CREATIVITY_LEVELS, 'balanced'),
    count,
    themes: text(i.themes, INPUT_LIMITS.themes),
    include: text(i.include, INPUT_LIMITS.include),
    avoid: text(i.avoid, INPUT_LIMITS.avoid),
  };
}
