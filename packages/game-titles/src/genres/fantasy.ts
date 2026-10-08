import type { GenrePreset } from '../types';

export const FANTASY: GenrePreset = {
  id: 'fantasy', label: 'Fantasy', group: 'Fantasy & RPG', noteLabel: 'fantasy',
  conceptBoosts: { crown: 2, realm: 2, oath: 1.6, relic: 1.6, magic: 1.6, dragon: 1.5, blade: 1.5, ancient: 1.4, legend: 1.3, forest: 1.3 },
  familyWeights: { 'of-phrase': 1.5, 'the-noun': 1.2, subtitle: 1.3, compound: 1.2, frame: 1.2, epithet: 1.5 },
  defaultTones: ['epic', 'mystical'],
  lengthBias: { one: 0.5, short: 0.7, medium: 0.9, long: 0.5 },
  frameWords: ['Chronicles', 'Tales', 'Legend', 'Song'],
  suffixWords: [{ text: 'Saga', cliche: 0.6 }, { text: 'Legends', cliche: 0.7 }, { text: 'Chronicles', cliche: 0.7 }],
  profile: 'neutral',
};
