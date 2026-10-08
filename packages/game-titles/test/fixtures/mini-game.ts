import { FRANCHISE_TERMS, STYLES, TEMPLATES, VOCAB, type GameData, type GenrePreset } from '../../src/index';

export const MINI_GENRES: readonly GenrePreset[] = [
  {
    id: 'fantasy', label: 'Fantasy', group: 'Fantasy & RPG', noteLabel: 'fantasy',
    conceptBoosts: { crown: 2, realm: 2, oath: 1.6, star: 1.4, gods: 1.4 },
    familyWeights: { 'of-phrase': 1.4, subtitle: 1.2 }, defaultTones: ['epic'],
    lengthBias: { one: 0.5, short: 0.6, medium: 0.8, long: 0.5 },
    frameWords: ['Chronicles', 'Tales'], suffixWords: [{ text: 'Saga', cliche: 0.6 }, { text: 'Legends', cliche: 0.7 }], profile: 'neutral',
  },
  {
    id: 'dark-fantasy', label: 'Dark Fantasy', group: 'Fantasy & RPG', parent: 'fantasy', noteLabel: 'dark-fantasy',
    conceptBoosts: { ruin: 2.2, blood: 2, death: 1.8, fire: 1.5 },
    familyWeights: { pair: 1.3, compound: 1.3 }, defaultTones: ['grim'],
    lengthBias: { one: 0.7, short: 0.8, medium: 0.6, long: 0.3 }, profile: 'neutral',
  },
  {
    id: 'cozy', label: 'Cozy', group: 'Cozy & Life', noteLabel: 'cozy',
    conceptBoosts: { home: 2.4, warmth: 2.2, garden: 2, bloom: 1.8, friendship: 2, island: 1.4 },
    suppress: ['death', 'war', 'blood', 'dread'],
    familyWeights: { place: 2, possessive: 1.6, duo: 1.4, descriptive: 1.2 }, defaultTones: ['cozy'],
    lengthBias: { one: 0.5, short: 0.8, medium: 0.7, long: 0.2 },
    suffixWords: [{ text: 'Days' }, { text: 'Friends' }], profile: 'soft', guard: { blockSuffixes: ['mon'] },
  },
];

export const MINI_GAME: GameData = {
  genres: MINI_GENRES, styles: STYLES, templates: TEMPLATES, vocab: VOCAB,
  knownTitles: new Set(['ashfall', 'frostbound', 'dark souls']), franchiseTerms: FRANCHISE_TERMS,
};
