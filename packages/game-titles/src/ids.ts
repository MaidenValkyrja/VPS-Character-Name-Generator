export const GENRE_IDS = [
  'fantasy', 'dark-fantasy', 'high-fantasy', 'rpg', 'action-rpg', 'crpg', 'mmo',
  'horror', 'psychological-horror', 'cosmic-horror',
  'sci-fi', 'cyberpunk', 'space-opera', 'post-apocalyptic', 'steampunk', 'dieselpunk',
  'adventure', 'survival', 'roguelike', 'sandbox',
  'cozy', 'farming', 'creature-collector',
  'strategy', 'city-builder', 'simulation',
  'puzzle', 'mystery', 'noir',
  'western', 'historical',
] as const;
export type GenreId = (typeof GENRE_IDS)[number];

export const GENRE_GROUPS = [
  'Fantasy & RPG', 'Horror', 'Sci-Fi & Punk', 'Adventure & Survival', 'Cozy & Life', 'Strategy & Simulation',
  'Mystery & Puzzle', 'Setting',
] as const;
export type GenreGroup = (typeof GENRE_GROUPS)[number];

export const STYLE_IDS = [
  'short-punchy', 'epic-fantasy', 'poetic', 'brandable', 'evocative', 'compound', 'invented', 'ancient', 'modern',
  'cryptic', 'descriptive', 'subtitle', 'franchise',
] as const;
export type StyleId = (typeof STYLE_IDS)[number];

export const TEMPLATE_FAMILIES = [
  'single', 'compound', 'coined', 'adj-noun', 'pair', 'the-noun', 'number', 'duo', 'of-phrase', 'prepositional',
  'sentence', 'imperative', 'frame', 'possessive', 'subtitle', 'suffix', 'descriptive', 'code', 'place', 'the-name',
  'kenning', 'triad', 'couplet', 'saga', 'epithet', 'alliterative',
] as const;
export type TemplateFamily = (typeof TEMPLATE_FAMILIES)[number];

export const SLOT_TYPES = [
  'noun', 'nounPl', 'adj', 'verb', 'abstract', 'name', 'place', 'compound', 'coined', 'number', 'ordinal', 'digits',
  'frame', 'frameSuffix', 'genreSuffix', 'prep', 'predicate', 'subtitle', 'epithet', 'placeWord',
] as const;
export type SlotType = (typeof SLOT_TYPES)[number];

export const LENGTH_OPTIONS = ['any', 'one', 'short', 'medium', 'long'] as const;
export type LengthOption = (typeof LENGTH_OPTIONS)[number];

export const CREATIVITY_LEVELS = ['focused', 'balanced', 'wild'] as const;
export type Creativity = (typeof CREATIVITY_LEVELS)[number];

export const RESULT_COUNTS = [5, 10, 20] as const;
export type ResultCount = (typeof RESULT_COUNTS)[number];
