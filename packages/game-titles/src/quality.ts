import { contentWords, normalize, splitPhrases, createRng } from '@vps-name-tools/core';
import { DATA, type DataBundle } from '@vps-name-tools/data';
import { buildContext } from './context';
import { GAME } from './game';
import { generate, recipeConcepts } from './generate';
import type { Creativity } from './ids';
import { flattenParts } from './render';
import { normalizeSettings, type Settings } from './settings';
import type { GameData } from './types';

export interface QualityPreset { readonly name: string; readonly settings: Partial<Settings> }
export interface QualityReport {
  readonly preset: string; readonly titles: number; readonly maxFamilyShare: number; readonly topWordShare: number;
  readonly topWord: string; readonly clicheShare: number; readonly literalRate: number; readonly phraseCoverage: number;
  readonly avgChars: number; readonly msPer20: number; readonly hasThemes: boolean;
}

export const QUALITY_THRESHOLDS = {
  maxFamilyShare: 0.3,
  topWordShare: 0.04,
  clicheShare: 0.2,
  phraseCoverage: 1,
  literalBand: { focused: [0.45, 0.75], balanced: [0.3, 0.5], wild: [0.15, 0.4] } as Readonly<Record<Creativity, readonly [number, number]>>,
} as const;

export const QUALITY_PRESETS: readonly QualityPreset[] = [
  { name: 'Norse dark fantasy (spec example 1)', settings: { genre: 'dark-fantasy', myth: 'norse', tone: 'grim', tone2: 'mystical', themes: 'frozen kingdom, ravens, forgotten gods, blood oath, northern lights' } },
  { name: 'Cozy creature collector (spec example 2)', settings: { genre: 'creature-collector', myth: 'fairy-tale', tone: 'cozy', tone2: 'playful', themes: 'cute creatures, islands, collecting, friendship, cozy exploration' } },
  { name: 'Analog horror (spec example 3)', settings: { genre: 'psychological-horror', tone: 'mysterious', tone2: 'melancholic', creativity: 'focused', themes: 'abandoned radio tower, analog horror, snowstorm, missing hikers' } },
  { name: 'Fantasy defaults', settings: {} },
  { name: 'Cyberpunk, Japanese-inspired', settings: { genre: 'cyberpunk', myth: 'japanese' } },
  { name: 'Space opera, Greek, epic', settings: { genre: 'space-opera', myth: 'greek', tone: 'epic' } },
  { name: 'Cosmic horror, Lovecraftian, wild', settings: { genre: 'cosmic-horror', myth: 'cosmic', creativity: 'wild' } },
  { name: 'Farming, Celtic-inspired, cozy', settings: { genre: 'farming', myth: 'celtic', tone: 'cozy' } },
  { name: 'Strategy, Roman', settings: { genre: 'strategy', myth: 'roman' } },
  { name: 'Western, grim', settings: { genre: 'western', tone: 'grim' } },
  { name: 'Roguelike, alchemical', settings: { genre: 'roguelike', myth: 'alchemical', themes: 'transmutation, mercury, endless descent' } },
  { name: 'Mystery, fairy tale', settings: { genre: 'mystery', myth: 'fairy-tale', tone: 'mysterious' } },
];

export function measureQuality(preset: QualityPreset, opts: { batches?: number; data?: DataBundle; game?: GameData } = {}): QualityReport {
  const data = opts.data ?? DATA;
  const game = opts.game ?? GAME;
  const batches = opts.batches ?? 50;
  const settings = normalizeSettings({ ...preset.settings, count: 20 });
  const ctx = buildContext(settings, data, game, createRng('quality'));
  const themeWords = new Set(contentWords(`${settings.themes} ${settings.include}`));
  const phrases = ctx.theme.phrases;
  const hasThemes = splitPhrases(settings.themes).length > 0;

  let titles = 0;
  let maxFamilyShare = 0;
  let cliches = 0;
  let literal = 0;
  let covered = 0;
  let chars = 0;
  let ms = 0;
  const wordCounts = new Map<string, number>();
  for (let b = 0; b < batches; b++) {
    const start = performance.now();
    const r = generate(settings, { seed: `${preset.name}:${b}`, data, game });
    ms += performance.now() - start;
    const families = new Map<string, number>();
    const reflected = new Set<string>();
    for (const t of r.titles) {
      titles++;
      chars += t.title.length;
      families.set(t.recipe.family, (families.get(t.recipe.family) ?? 0) + 1);
      for (const w of new Set(contentWords(t.title))) if (!themeWords.has(w)) wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
      const parts = flattenParts(t.recipe.parts);
      if (parts.some(p => (p.kind === 'vocab' && p.cliche >= 0.5) || (p.kind === 'lex' && (ctx.entryById.get(p.entryId)?.cliche ?? 0) >= 0.5))) cliches++;
      if (parts.some(p => p.kind === 'user')) literal++;
      const concepts = new Set(recipeConcepts(ctx, t.recipe));
      for (const ph of phrases) {
        if (parts.some(p => p.kind === 'user' && p.phrase === ph.norm) || ph.concepts.some(c => concepts.has(c))) reflected.add(ph.norm);
      }
    }
    if (r.titles.length > 0) maxFamilyShare = Math.max(maxFamilyShare, Math.max(...families.values()) / r.titles.length);
    if (phrases.every(ph => reflected.has(ph.norm))) covered++;
  }
  const [topWord, topCount] = [...wordCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
  return {
    preset: preset.name, titles, maxFamilyShare, topWordShare: titles ? topCount / titles : 0, topWord: normalize(topWord),
    clicheShare: titles ? cliches / titles : 0, literalRate: titles ? literal / titles : 0,
    phraseCoverage: batches ? covered / batches : 0, avgChars: titles ? chars / titles : 0, msPer20: ms / batches, hasThemes,
  };
}

export function checkQuality(r: QualityReport, creativity: Creativity): string[] {
  const t = QUALITY_THRESHOLDS;
  const failures: string[] = [];
  if (r.maxFamilyShare > t.maxFamilyShare) failures.push(`largest family share ${r.maxFamilyShare.toFixed(2)} > ${t.maxFamilyShare}`);
  if (r.topWordShare > t.topWordShare) failures.push(`word "${r.topWord}" in ${(r.topWordShare * 100).toFixed(1)}% of titles > ${t.topWordShare * 100}%`);
  if (r.clicheShare > t.clicheShare) failures.push(`classic frames in ${(r.clicheShare * 100).toFixed(1)}% of titles > ${t.clicheShare * 100}%`);
  if (r.hasThemes) {
    const [lo, hi] = t.literalBand[creativity];
    if (r.literalRate < lo || r.literalRate > hi) failures.push(`literal theme use ${r.literalRate.toFixed(2)} outside ${lo}–${hi}`);
    if (r.phraseCoverage < t.phraseCoverage) failures.push(`phrase coverage ${r.phraseCoverage.toFixed(2)} < ${t.phraseCoverage}`);
  }
  return failures;
}
