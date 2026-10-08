import type { PhoneticProfile } from '@vps-name-tools/core';
import { NEUTRAL } from '../../src/profiles/neutral';
import { NONE } from '../../src/myths/none';
import { abstract, adj, concept as c, morpheme, noun, place, symbolic, verb } from '../../src/build';
import type { DataBundle, MythPack, ToneDef } from '../../src/types';

export const MINI_CONCEPTS = [
  c('fire', ['warmth', 'light']), c('warmth', ['home', 'fire']), c('light', ['sky', 'star']), c('ruin', ['death', 'silence']),
  c('death', ['ruin', 'night']), c('cold', ['winter', 'ice']), c('winter', ['cold', 'hunger']), c('ice', ['cold']),
  c('oath', ['vow', 'kin']), c('vow', ['oath']), c('kin', ['blood', 'oath']), c('blood', ['kin', 'war']), c('war', ['iron', 'blood']),
  c('raven', ['omen', 'night']), c('omen', ['raven', 'gods']), c('night', ['dread', 'raven']), c('crown', ['realm']),
  c('realm', ['crown']), c('gods', ['silence', 'sky']), c('silence', ['memory']), c('sky', ['star', 'light']),
  c('aurora', ['sky', 'cold', 'light']), c('star', ['sky', 'night']), c('home', ['warmth', 'garden']), c('garden', ['bloom', 'home']),
  c('bloom', ['garden']), c('friendship', ['home']), c('sea', ['island']), c('island', ['sea']), c('iron', ['war']),
  c('memory', ['silence']), c('forest', ['wolf']), c('wolf', ['hunger', 'forest']), c('hunger', ['wolf']),
  c('signal', ['dread']), c('dread', ['night']),
];

const g = { grim: 0.6, dark: 0.4, cozy: -0.8 } as const;

export const MINI_LEXICON = [
  noun('ash', 'Ash', ['fire', 'ruin', 'death'], { forms: { plural: 'Ashes', adj: 'Ashen' }, family: 'fire-residue', compound: 'head', tones: g }),
  noun('ember', 'Ember', ['fire', 'warmth'], { forms: { plural: 'Embers' }, family: 'fire-residue', compound: 'head', tones: { cozy: 0.3 } }),
  noun('cinder', 'Cinder', ['fire', 'ruin'], { forms: { plural: 'Cinders' }, family: 'fire-residue' }),
  noun('oath', 'Oath', ['oath', 'vow', 'blood'], { forms: { plural: 'Oaths' }, family: 'promise', tones: { grim: 0.4, epic: 0.5 } }),
  noun('vow', 'Vow', ['oath', 'vow'], { forms: { plural: 'Vows' }, family: 'promise' }),
  noun('covenant', 'Covenant', ['oath', 'gods'], { forms: { plural: 'Covenants' }, family: 'promise', register: 'lofty' }),
  noun('pact', 'Pact', ['oath', 'blood'], { forms: { plural: 'Pacts' }, family: 'promise' }),
  noun('raven', 'Raven', ['raven', 'omen', 'night'], { forms: { plural: 'Ravens' }, compound: 'head' }),
  noun('crown', 'Crown', ['crown', 'realm'], { forms: { plural: 'Crowns' }, compound: 'both' }),
  noun('kingdom', 'Kingdom', ['realm', 'crown'], { forms: { plural: 'Kingdoms' } }),
  noun('frost', 'Frost', ['cold', 'winter', 'ice'], { forms: { adj: 'Frozen' }, compound: 'head', tones: { grim: 0.4 } , mass: true }),
  noun('winter', 'Winter', ['cold', 'winter'], { forms: { plural: 'Winters' } }),
  noun('rime', 'Rime', ['cold', 'ice'], { register: 'archaic', compound: 'head' }),
  noun('blood', 'Blood', ['blood', 'kin', 'war'], { compound: 'head', tones: { dark: 0.6, cozy: -1 } , mass: true }),
  noun('god', 'God', ['gods'], { forms: { plural: 'Gods' } }),
  noun('aurora', 'Aurora', ['aurora', 'sky', 'light'], { forms: { plural: 'Auroras' } }),
  noun('sky', 'Sky', ['sky', 'light'], { forms: { plural: 'Skies' } }),
  noun('star', 'Star', ['star', 'sky', 'light'], { forms: { plural: 'Stars' }, compound: 'head' }),
  noun('iron', 'Iron', ['iron', 'war'], { compound: 'head' , mass: true }),
  noun('wolf', 'Wolf', ['wolf', 'forest', 'hunger'], { forms: { plural: 'Wolves' }, compound: 'head' }),
  noun('hearth', 'Hearth', ['home', 'warmth'], { forms: { plural: 'Hearths' }, compound: 'head', tones: { cozy: 0.9 } }),
  noun('garden', 'Garden', ['garden', 'bloom', 'home'], { forms: { plural: 'Gardens' } }),
  noun('lantern', 'Lantern', ['light', 'home', 'warmth'], { forms: { plural: 'Lanterns' }, tones: { cozy: 0.7 } }),
  noun('meadow', 'Meadow', ['garden', 'bloom'], { forms: { plural: 'Meadows' } }),
  noun('bloom', 'Bloom', ['bloom', 'garden'], { forms: { plural: 'Blooms' } }),
  noun('friend', 'Friend', ['friendship'], { forms: { plural: 'Friends' } }),
  noun('isle', 'Isle', ['island', 'sea'], { forms: { plural: 'Isles' } }),
  noun('tide', 'Tide', ['sea'], { forms: { plural: 'Tides' } }),
  noun('signal', 'Signal', ['signal', 'dread'], { forms: { plural: 'Signals' }, register: 'technical' }),
  noun('night', 'Night', ['night', 'dread'], { forms: { plural: 'Nights' } }),
  noun('memory', 'Memory', ['memory', 'silence'], { forms: { plural: 'Memories' } }),
  noun('hunger', 'Hunger', ['hunger', 'wolf'], { mass: true }),
  adj('pale', 'Pale', ['cold', 'death', 'silence']),
  adj('hollow', 'Hollow', ['ruin', 'silence']),
  adj('silent', 'Silent', ['silence']),
  adj('broken', 'Broken', ['ruin', 'oath']),
  adj('forgotten', 'Forgotten', ['memory', 'gods', 'silence']),
  adj('warm', 'Warm', ['warmth', 'home'], { tones: { cozy: 0.8 } }),
  adj('little', 'Little', ['home', 'friendship'], { register: 'whimsical' }),
  verb('bury', 'Bury', ['death', 'ruin']),
  verb('outlast', 'Outlast', ['winter', 'hunger']),
  verb('kindle', 'Kindle', ['fire', 'warmth']),
  verb('answer', 'Answer', ['signal']),
  abstract('unsworn', 'Unsworn', ['oath']),
  abstract('exile', 'Exile', ['ruin', 'silence']),
  abstract('remnant', 'Remnant', ['ruin', 'memory']),
  place('falls', 'Falls', ['realm']), place('reach', 'Reach', ['realm']), place('cove', 'Cove', ['sea', 'home']),
  place('vale', 'Vale', ['realm', 'forest']), place('station', 'Station', ['signal']),
  morpheme('bound', 'bound', ['oath'], { compound: 'tail' }), morpheme('fall', 'fall', ['ruin'], { compound: 'tail' }),
  morpheme('forge', 'forge', ['fire', 'iron'], { compound: 'tail' }), morpheme('hold', 'hold', ['realm'], { compound: 'tail', placeTail: true }),
  morpheme('moor', 'moor', ['forest'], { placeTail: true }), morpheme('wick', 'wick', ['home'], { placeTail: true }),
  morpheme('mere', 'mere', ['sea'], { placeTail: true }), morpheme('light', 'light', ['light'], { compound: 'tail' }),
  morpheme('song', 'song', ['memory'], { compound: 'tail' }),
];

export const MINI_TONES: readonly ToneDef[] = [
  { id: 'grim', label: 'Grim', noteWord: 'grim', conceptBoosts: { ruin: 1.4, death: 1.3, hunger: 1.3 }, familyWeights: { single: 1.3, compound: 1.2 } },
  { id: 'cozy', label: 'Cozy', noteWord: 'cozy', conceptBoosts: { home: 1.6, warmth: 1.5, friendship: 1.4, bloom: 1.3 }, familyWeights: { possessive: 1.5, place: 1.6, duo: 1.3 }, alliterationBonus: 1 },
  { id: 'epic', label: 'Epic', noteWord: 'epic', conceptBoosts: { crown: 1.4, realm: 1.4, gods: 1.3 }, familyWeights: { 'of-phrase': 1.4, subtitle: 1.3 } },
];

export const MINI_NORSE_PROFILE: PhoneticProfile = {
  id: 'norse', label: 'Norse',
  onsets: [['b', 1], ['d', 1], ['f', 0.8], ['g', 1], ['h', 0.8], ['k', 1], ['r', 1], ['s', 1], ['t', 1], ['v', 1], ['sk', 0.6], ['st', 0.6], ['br', 0.5], ['gr', 0.6], ['hr', 0.4], ['th', 0.5]],
  nuclei: [['a', 1.2], ['e', 1], ['i', 0.8], ['o', 1], ['u', 0.6], ['y', 0.3], ['ei', 0.3], ['au', 0.2]],
  codas: [['', 1.5], ['r', 1], ['n', 1], ['l', 0.8], ['k', 0.8], ['g', 0.6], ['d', 0.6], ['rn', 0.4], ['ld', 0.4], ['nd', 0.4]],
  shapes: [['CVC', 5], ['CV', 3]],
  syllables: [[2, 7], [3, 2.5], [1, 0.5]],
  endings: [['gard', 0.6], ['vald', 0.6], ['mark', 0.5], ['fell', 0.5], ['vik', 0.5], ['holt', 0.5], ['run', 0.4]],
  endingChance: 0.35,
  forbid: ['q(?!u)', 'yy', 'uu', '^ng', "'", 'heim$'],
  letters: [4, 10],
};

export const MINI_SOFT_PROFILE: PhoneticProfile = {
  id: 'soft', label: 'soft and whimsical',
  onsets: [['b', 1], ['p', 1], ['m', 1], ['l', 1], ['n', 0.8], ['w', 0.6], ['f', 0.6], ['t', 0.6], ['bl', 0.4], ['pl', 0.4], ['fl', 0.4], ['sn', 0.3]],
  nuclei: [['a', 1], ['e', 0.8], ['i', 0.8], ['o', 1], ['u', 0.6], ['oo', 0.3], ['ee', 0.2]],
  codas: [['', 3], ['n', 0.8], ['m', 0.5], ['l', 0.6], ['p', 0.4]],
  shapes: [['CV', 5], ['CVC', 3]],
  syllables: [[2, 6], [3, 3.5]],
  endings: [['le', 1], ['ling', 0.8], ['kin', 0.7], ['wick', 0.5], ['bloom', 0.5], ['puff', 0.4]],
  endingChance: 0.45,
  forbid: ['q(?!u)', "'", 'ooo'],
  letters: [4, 11],
};

const NORSE: MythPack = {
  id: 'norse', label: 'Norse', group: 'Norse & Germanic', tier: 'A', noteLabel: 'Norse', profile: 'norse', coinedRate: 1,
  conceptBoosts: { cold: 2, winter: 2, oath: 2, raven: 2, wolf: 1.8, iron: 1.5, gods: 1.4 },
  imagery: [
    noun('norse.longhall', 'Longhall', ['home', 'realm'], { register: 'archaic' }),
    noun('norse.skald', 'Skald', ['memory', 'oath'], { forms: { plural: 'Skalds' } }),
    noun('norse.rune', 'Rune', ['omen', 'gods'], { forms: { plural: 'Runes' }, compound: 'head' }),
  ],
  symbolic: [symbolic(adj('norse.wyrd', 'Wyrd', ['omen', 'gods'], { register: 'archaic' }), 'Old English wyrd / Old Norse urdr, fate; long established in English.')],
  rhythm: { kenning: 12, compound: 1.5, saga: 6 },
  denylist: ['odin', 'thor', 'loki', 'freya'],
  review: { status: 'reviewed', notes: 'Test fixture.' },
};

export const MINI: DataBundle = {
  concepts: MINI_CONCEPTS,
  aliases: { 'northern lights': ['aurora', 'sky', 'cold'], frozen: ['cold', 'ice'], kingdom: ['realm', 'crown'], cozy: ['home', 'warmth'] },
  lexicon: MINI_LEXICON,
  tones: MINI_TONES,
  profiles: [NEUTRAL, MINI_NORSE_PROFILE, MINI_SOFT_PROFILE],
  myths: [NONE, NORSE],
  safety: { phrases: ['blood and soil'], coinedSubstrings: ['bok'] },
};
