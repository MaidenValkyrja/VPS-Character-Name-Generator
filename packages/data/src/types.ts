import type { ConceptId, PhoneticProfile, SafetyLists } from '@vps-name-tools/core';
import type { MythGroup, MythId, Pos, ProfileId, Register, ToneId } from './ids';

export interface LexForms {
  readonly plural?: string;
  readonly adj?: string;
  readonly gerund?: string;
  readonly past?: string;
}

export interface LexEntry {
  readonly id: string;
  readonly text: string;
  readonly pos: readonly Pos[];
  readonly forms?: LexForms;
  readonly concepts: readonly ConceptId[];
  /** Near-synonym group used by Generate Similar (ash, ember, cinder share "fire-residue"). */
  readonly family?: string;
  /** Tone affinity from −1 (wrong for this tone) to +1 (made for it). */
  readonly tones?: Partial<Record<ToneId, number>>;
  readonly register: Register;
  /** 0 = fresh, 1 = worn-out cliché. */
  readonly cliche?: number;
  readonly compound?: 'head' | 'tail' | 'both';
  /** Can end a place name (Raven + moor). */
  readonly placeTail?: boolean;
  /** Mass noun (iron, frost): never offered to plural slots. */
  readonly mass?: boolean;
}

export interface SymbolicEntry extends LexEntry {
  /** Where the term comes from and why it is not sacred. Required. */
  readonly sourceNote: string;
}

export interface Concept {
  readonly id: ConceptId;
  readonly label: string;
  readonly related: readonly ConceptId[];
}

export interface ToneDef {
  readonly id: ToneId;
  readonly label: string;
  /** Word used in identity notes: "Grim Norse dark-fantasy title…". */
  readonly noteWord: string;
  readonly conceptBoosts: Readonly<Record<string, number>>;
  /** Multipliers keyed by template family. */
  readonly familyWeights: Readonly<Record<string, number>>;
  readonly alliterationBonus?: number;
  /** Sound bias: profile for invented words when the cultural option is None (Cozy → soft). */
  readonly soundProfile?: ProfileId;
  /** Sound bias: upper length for invented words (Minimalist → 8). */
  readonly maxCoinedLetters?: number;
}

export interface MythReview {
  /** 'held' removes the pack from the selector at launch; notes must give the reason. */
  readonly status: 'draft' | 'reviewed' | 'externally-reviewed' | 'held';
  readonly reviewer?: string;
  readonly date?: string;
  readonly notes: string;
}

export interface MythPack {
  readonly id: MythId;
  readonly label: string;
  readonly group: MythGroup;
  readonly tier: 'A' | 'B' | 'none';
  /** Used in notes: "Norse", "Japanese-inspired". Empty for None. */
  readonly noteLabel: string;
  readonly profile: ProfileId;
  /** Multiplies how often invented words appear (1 = normal; Tier B packs use low values). */
  readonly coinedRate: number;
  readonly blend?: readonly { readonly id: MythId; readonly weight: number }[];
  readonly conceptBoosts: Readonly<Record<string, number>>;
  readonly imagery: readonly LexEntry[];
  readonly symbolic: readonly SymbolicEntry[];
  /** Template-family multipliers (kenning, triad, couplet…). */
  readonly rhythm: Readonly<Record<string, number>>;
  /** Names this pack must never produce (deities, sacred terms, franchise names). */
  readonly denylist: readonly string[];
  readonly review: MythReview;
}

export interface DataBundle {
  readonly concepts: readonly Concept[];
  readonly aliases: Readonly<Record<string, readonly ConceptId[]>>;
  readonly lexicon: readonly LexEntry[];
  readonly tones: readonly ToneDef[];
  readonly profiles: readonly PhoneticProfile[];
  readonly myths: readonly MythPack[];
  readonly safety: SafetyLists;
}

export interface Issue {
  readonly level: 'error' | 'warning';
  readonly where: string;
  readonly message: string;
}
