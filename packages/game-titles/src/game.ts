import { FRANCHISE_TERMS } from './guards';
import { GENRES } from './genres/index';
import { KNOWN_TITLES } from './known-titles';
import { STYLES } from './styles';
import { TEMPLATES } from './templates';
import { VOCAB } from './vocab';
import type { GameData } from './types';

export const GAME: GameData = {
  genres: GENRES, styles: STYLES, templates: TEMPLATES, vocab: VOCAB, knownTitles: KNOWN_TITLES, franchiseTerms: FRANCHISE_TERMS,
};
