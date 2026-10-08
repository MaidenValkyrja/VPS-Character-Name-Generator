export const TONE_IDS = [
  'epic', 'dark', 'grim', 'mystical', 'heroic', 'whimsical', 'cozy', 'romantic', 'melancholic', 'brutal',
  'mysterious', 'ancient', 'elegant', 'weird', 'surreal', 'cinematic', 'minimalist', 'retro', 'playful',
] as const;
export type ToneId = (typeof TONE_IDS)[number];

export const MYTH_IDS = [
  'none', 'original', 'norse', 'icelandic', 'germanic', 'anglo-saxon', 'celtic', 'arthurian', 'greek', 'roman',
  'egyptian', 'mesopotamian', 'persian', 'arabian', 'slavic', 'finnish', 'japanese', 'chinese', 'korean', 'indian',
  'mesoamerican', 'aztec', 'maya', 'andean', 'polynesian', 'african', 'biblical', 'gnostic', 'alchemical',
  'cosmic', 'fairy-tale',
] as const;
export type MythId = (typeof MYTH_IDS)[number];

export const MYTH_GROUPS = [
  'Neutral', 'Norse & Germanic', 'Celtic & Arthurian', 'Classical', 'Ancient Near East & Egypt', 'Slavic & Finnic',
  'East Asian', 'South Asian', 'Americas', 'Oceania', 'Africa', 'Religious & Esoteric', 'Literary & Folklore',
] as const;
export type MythGroup = (typeof MYTH_GROUPS)[number];

export const PROFILE_IDS = [
  'neutral', 'norse', 'germanic', 'old-english', 'celtic', 'elven', 'slavic', 'finnic', 'latin', 'hellenic',
  'ancient', 'cosmic', 'scifi', 'cyberpunk', 'soft', 'japanese',
] as const;
export type ProfileId = (typeof PROFILE_IDS)[number];

export const POS_VALUES = ['noun', 'adj', 'verb', 'abstract', 'place', 'morpheme'] as const;
export type Pos = (typeof POS_VALUES)[number];

export const REGISTERS = ['plain', 'archaic', 'lofty', 'technical', 'whimsical'] as const;
export type Register = (typeof REGISTERS)[number];
