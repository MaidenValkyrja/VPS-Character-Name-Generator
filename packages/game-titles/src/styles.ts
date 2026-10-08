import type { StyleDef } from './types';

/** Naming styles (spec §7). "Auto" is the absence of a style. */
export const STYLES: readonly StyleDef[] = [
  { id: 'short-punchy', label: 'Short & Punchy', familyWeights: { single: 2, compound: 2.5, coined: 1, 'adj-noun': 1.5, pair: 1.5, 'the-noun': 1, number: 1, code: 1, kenning: 1 }, otherFamilies: 0.1, maxWords: 2, maxChars: 14, coinedRate: 0.15 },
  { id: 'epic-fantasy', label: 'Epic Fantasy', familyWeights: { 'of-phrase': 3, frame: 2, subtitle: 2, saga: 1.5, epithet: 1.5, 'the-noun': 1.2, possessive: 1 }, otherFamilies: 0.2, coinedRate: 0.15, register: { lofty: 1.6, archaic: 1.3, technical: 0.3 } },
  { id: 'poetic', label: 'Poetic', familyWeights: { prepositional: 3, sentence: 2.5, duo: 1.5, triad: 1.2, couplet: 1.2, 'of-phrase': 1.2, alliterative: 1.2 }, otherFamilies: 0.2, coinedRate: 0.05, register: { lofty: 1.3, technical: 0.4 } },
  { id: 'brandable', label: 'Brandable', familyWeights: { coined: 4, compound: 3, single: 1, pair: 0.3 }, otherFamilies: 0.05, maxWords: 2, coinedRate: 0.6, brandLetters: [5, 9] },
  { id: 'evocative', label: 'Evocative', familyWeights: { pair: 2.5, duo: 2, 'adj-noun': 1.2, 'of-phrase': 1.2, sentence: 1 }, otherFamilies: 0.3, coinedRate: 0.05 },
  { id: 'compound', label: 'Compound Word', familyWeights: { compound: 5, kenning: 1.5, place: 1 }, otherFamilies: 0.15, maxWords: 2, coinedRate: 0 },
  { id: 'invented', label: 'Invented Word', familyWeights: { coined: 6, suffix: 0.5 }, otherFamilies: 0.02, maxWords: 2, coinedRate: 1 },
  { id: 'ancient', label: 'Ancient / Mythic', familyWeights: { 'of-phrase': 2.5, saga: 2, epithet: 2, frame: 1.5, kenning: 1.5, 'the-noun': 1 }, otherFamilies: 0.25, coinedRate: 0.25, register: { archaic: 2, lofty: 1.4, technical: 0.2, plain: 0.7 } },
  { id: 'modern', label: 'Modern', familyWeights: { 'adj-noun': 1.5, pair: 2, number: 2, code: 1.5, single: 1.5, sentence: 1 }, otherFamilies: 0.25, coinedRate: 0.05, register: { archaic: 0.3, lofty: 0.6, plain: 1.5, technical: 1.2 } },
  { id: 'cryptic', label: 'Cryptic', familyWeights: { single: 3, number: 2, code: 2, imperative: 1, 'the-noun': 1 }, otherFamilies: 0.15, maxWords: 3, coinedRate: 0.1, register: { plain: 1.2 } },
  { id: 'descriptive', label: 'Descriptive', familyWeights: { descriptive: 5, place: 1.5, suffix: 1.5 }, otherFamilies: 0.15, coinedRate: 0 },
  { id: 'subtitle', label: 'Subtitle-heavy', familyWeights: { subtitle: 8 }, otherFamilies: 0.02, coinedRate: 0.25 },
  { id: 'franchise', label: 'Franchise-style', familyWeights: { suffix: 4, subtitle: 3, frame: 1 }, otherFamilies: 0.1, coinedRate: 0.3 },
];
