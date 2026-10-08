import type { DataBundle, LexEntry, MythId, ProfileId, Register, ToneId } from '@vps-name-tools/data';
import type { GenreGroup, GenreId, SlotType, StyleId, TemplateFamily } from './ids';
import type { Settings } from './settings';

export interface SlotToken {
  readonly kind: 'slot';
  readonly types: readonly SlotType[];
  readonly optional: boolean;
  /** The head slot: where the Include word may go. */
  readonly lock: boolean;
  readonly index: number;
}
export interface LiteralToken {
  readonly kind: 'literal';
  readonly text: string;
}
export type PatternToken = SlotToken | LiteralToken;

export interface Template {
  readonly id: string;
  readonly family: TemplateFamily;
  readonly variants: readonly (readonly PatternToken[])[];
  readonly words: readonly [number, number];
  readonly base: number;
  readonly rare?: boolean;
  readonly alliterate?: boolean;
}

export interface LengthBias {
  readonly one: number;
  readonly short: number;
  readonly medium: number;
  readonly long: number;
}

export interface VocabItem {
  readonly text: string;
  readonly concepts?: readonly string[];
  readonly cliche?: number;
  readonly genres?: readonly GenreId[];
  readonly tones?: Partial<Record<ToneId, number>>;
}

export interface GenreGuard {
  readonly blockPhrases?: readonly string[];
  /** Engine-built words may not end with these ("mon", "craft"). */
  readonly blockSuffixes?: readonly string[];
}

export interface GenrePreset {
  readonly id: GenreId;
  readonly label: string;
  readonly group: GenreGroup;
  readonly parent?: GenreId;
  /** Used in notes: "dark-fantasy". */
  readonly noteLabel: string;
  readonly conceptBoosts: Readonly<Record<string, number>>;
  readonly suppress?: readonly string[];
  readonly familyWeights: Partial<Record<TemplateFamily, number>>;
  readonly defaultTones: readonly ToneId[];
  readonly lengthBias: LengthBias;
  readonly frameWords?: readonly string[];
  readonly suffixWords?: readonly VocabItem[];
  readonly entries?: readonly LexEntry[];
  /** Phonetic profile when the cultural option is None. */
  readonly profile: ProfileId;
  readonly guard?: GenreGuard;
}

export interface StyleDef {
  readonly id: StyleId;
  readonly label: string;
  readonly familyWeights: Partial<Record<TemplateFamily, number>>;
  /** Multiplier for families the style does not list. */
  readonly otherFamilies: number;
  readonly maxWords?: number;
  readonly maxChars?: number;
  /** Chance that a name slot becomes an invented word. */
  readonly coinedRate: number;
  readonly register?: Partial<Record<Register, number>>;
  readonly brandLetters?: readonly [number, number];
}

export interface Vocab {
  readonly frames: readonly VocabItem[];
  readonly frameSuffixes: readonly VocabItem[];
  readonly franchiseSuffixes: readonly VocabItem[];
  readonly numbers: readonly VocabItem[];
  readonly ordinals: readonly VocabItem[];
  readonly digits: readonly VocabItem[];
  readonly preps: readonly VocabItem[];
  readonly predicates: readonly VocabItem[];
  readonly epithets: readonly VocabItem[];
  readonly subtitlePatterns: readonly string[];
}

export interface GameData {
  readonly genres: readonly GenrePreset[];
  readonly styles: readonly StyleDef[];
  readonly templates: readonly Template[];
  readonly vocab: Vocab;
  /** Normalised famous game titles: exact matches are never produced. */
  readonly knownTitles: ReadonlySet<string>;
  readonly franchiseTerms: readonly string[];
}

export type SimilarStrategy = 'modifier' | 'head' | 'structure' | 'mutate';

interface PartBase {
  readonly index: number;
  readonly slot: SlotType;
}
export type RecipePart =
  | { readonly kind: 'literal'; readonly text: string }
  | (PartBase & { readonly kind: 'lex'; readonly entryId: string; readonly text: string })
  | (PartBase & { readonly kind: 'vocab'; readonly text: string; readonly cliche: number })
  | (PartBase & { readonly kind: 'user'; readonly phrase: string; readonly text: string })
  | (PartBase & { readonly kind: 'include'; readonly text: string })
  | (PartBase & { readonly kind: 'coined'; readonly profile: string; readonly syllables: readonly string[]; readonly ending?: string; readonly text: string })
  | (PartBase & { readonly kind: 'compound'; readonly headId: string; readonly tailId: string; readonly morphemes: readonly [string, string]; readonly text: string })
  | (PartBase & { readonly kind: 'group'; readonly parts: readonly RecipePart[]; readonly text: string });

export interface Recipe {
  readonly templateId: string;
  readonly variant: number;
  readonly family: TemplateFamily;
  readonly parts: readonly RecipePart[];
  /** Slot index of the head (lock) slot, or -1. */
  readonly headSlot: number;
  readonly anchor?: string;
  readonly seed: string;
  readonly strategy?: SimilarStrategy;
}

export interface TitleMeta {
  readonly genre: GenreId;
  readonly myth: MythId;
  readonly style: StyleId | 'auto';
  readonly tones: readonly ToneId[];
  readonly concepts: readonly string[];
  readonly note: string;
  readonly genreLabel: string;
  readonly mythLabel: string;
  readonly styleLabel: string;
}

export interface TitleResult {
  readonly id: string;
  readonly title: string;
  readonly meta: TitleMeta;
  readonly recipe: Recipe;
  readonly settings: Settings;
}

export type NoticeCode = 'include-conflicts-avoid' | 'pool-limited' | 'include-unusable' | 'shortfall';
export interface Notice {
  readonly code: NoticeCode;
  readonly message: string;
}

export interface GenerateResult {
  readonly titles: readonly TitleResult[];
  readonly notices: readonly Notice[];
  readonly seed: string;
}

export interface GenerateOptions {
  readonly seed?: string;
  /** Normalised titles not to repeat (recently shown). */
  readonly exclude?: ReadonlySet<string>;
  readonly data?: DataBundle;
  readonly game?: GameData;
}

export interface SimilarOptions extends GenerateOptions {
  readonly count?: number;
}
