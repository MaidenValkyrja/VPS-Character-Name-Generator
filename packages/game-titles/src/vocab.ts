import type { Vocab, VocabItem } from './types';

/** Small, curated title vocabulary. Classic frames stay available with a cliché weight (Revision 2, decision 16). */
export const VOCAB: Vocab = {
  frames: [
    { text: 'Echoes', cliche: 0.8 }, { text: 'Shadow', cliche: 0.8 },
    { text: 'Chronicles', cliche: 0.7, genres: ['rpg', 'high-fantasy', 'fantasy'] }, { text: 'Rise', cliche: 0.7 },
    { text: 'Fall', cliche: 0.7 }, { text: 'Legend', cliche: 0.7 }, { text: 'Tales', cliche: 0.5, genres: ['cozy', 'crpg', 'adventure'] },
    { text: 'Song', cliche: 0.3, concepts: ['legend'] }, { text: 'Ballad', cliche: 0.3 }, { text: 'Book', cliche: 0.3, concepts: ['knowledge'] },
    { text: 'Hymn', cliche: 0.2, concepts: ['faith'] }, { text: 'Requiem', cliche: 0.4, concepts: ['death'] },
    { text: 'Lament', cliche: 0.2, concepts: ['sorrow'] }, { text: 'Children', cliche: 0.3, concepts: ['kin'] },
    { text: 'Heirs', cliche: 0.4, concepts: ['kin', 'crown'] }, { text: 'Keepers', cliche: 0.3 }, { text: 'Gates', cliche: 0.4 },
    { text: 'Dawn', cliche: 0.5, concepts: ['dawn'] }, { text: 'Twilight', cliche: 0.6, concepts: ['dusk'] },
    { text: 'Age', cliche: 0.5, concepts: ['age'] }, { text: 'Wrath', cliche: 0.5, concepts: ['rage'] },
    { text: 'Memory', cliche: 0.2, concepts: ['memory'] }, { text: 'Rites', cliche: 0.2, concepts: ['faith'] },
    { text: 'Vigil', cliche: 0.2, concepts: ['night', 'hope'] },
  ],
  frameSuffixes: [
    { text: 'Saga', cliche: 0.6 }, { text: 'Chronicles', cliche: 0.7 }, { text: 'Legends', cliche: 0.7 }, { text: 'Tales', cliche: 0.5 },
    { text: 'Cycle', cliche: 0.2 }, { text: 'Codex', cliche: 0.2 }, { text: 'Annals', cliche: 0.1 }, { text: 'Accord', cliche: 0.1 },
  ],
  franchiseSuffixes: [
    { text: 'Origins', cliche: 0.5 }, { text: 'Tactics', cliche: 0.2 }, { text: 'Legends', cliche: 0.7 }, { text: 'Online', cliche: 0.3 },
    { text: 'Arena', cliche: 0.4 }, { text: 'Rising', cliche: 0.6 }, { text: 'Reborn', cliche: 0.5 }, { text: 'Unbound', cliche: 0.4 },
    { text: 'Frontiers', cliche: 0.3 }, { text: 'Zero', cliche: 0.3 }, { text: 'Protocol', cliche: 0.2 },
    { text: 'Blaster', cliche: 0.3, tones: { retro: 1 } }, { text: 'Mania', cliche: 0.4, tones: { retro: 0.8 } },
    { text: 'Turbo', cliche: 0.3, tones: { retro: 1 } }, { text: 'Deluxe', cliche: 0.3, tones: { retro: 0.6 } },
  ],
  numbers: ['Two', 'Three', 'Seven', 'Nine', 'Ten', 'Twelve', 'Thirteen', 'Forty', 'Hundred', 'Thousand'].map(text => ({ text })),
  ordinals: ['First', 'Second', 'Third', 'Seventh', 'Ninth', 'Thirteenth', 'Last', 'Final', 'Hundredth'].map(text => ({ text })),
  digits: ['0', '1', '7', '9', '13', '14', '23', '47', '88', '99', '101', '108', '404', '512'].map(text => ({ text })),
  preps: ['Beneath', 'Beyond', 'After', 'Before', 'Under', 'Within', 'Below', 'Against', 'Across', 'Behind', 'Between', 'Past', 'Toward', 'Over', 'in', 'among']
    .map(text => ({ text })),
  predicates: [
    { text: 'Remember', concepts: ['memory'] }, { text: 'Never Sleep', concepts: ['dread', 'night'] },
    { text: 'Keep No Oaths', concepts: ['oath', 'ruin'] }, { text: 'Do Not Rest', concepts: ['death', 'dread'] },
    { text: 'Still Burn', concepts: ['fire'] }, { text: 'Came Down', concepts: ['absence', 'mountain'] },
    { text: 'Wait Below', concepts: ['deep', 'dread'] }, { text: 'Will Not Wake', concepts: ['sleep', 'death'] },
    { text: 'Sing at Dusk', concepts: ['dusk', 'legend'] }, { text: 'Know Your Name', concepts: ['secret', 'dread'] },
    { text: 'Forgot Us', concepts: ['gods', 'absence'] }, { text: 'Dream of Iron', concepts: ['dream', 'iron'] },
    { text: 'Walk Again', concepts: ['death', 'hope'] }, { text: 'Answer Back', concepts: ['signal', 'dread'] },
    { text: 'Grow Quiet', concepts: ['silence'] }, { text: 'Bloom at Midnight', concepts: ['bloom', 'night'], tones: { cozy: 0.5, whimsical: 0.6 } },
    { text: 'Keep the Light', concepts: ['light', 'hope'] }, { text: 'Come Home', concepts: ['home', 'journey'], tones: { cozy: 0.8 } },
    { text: 'Watch Over Us', concepts: ['gods', 'hope'] }, { text: 'Hum Softly', concepts: ['home', 'joy'], tones: { cozy: 0.7 } },
    { text: 'Have Teeth', concepts: ['beast', 'dread'], tones: { weird: 0.8 } }, { text: 'Count the Days', concepts: ['time', 'survival'] },
    { text: 'Hold the Line', concepts: ['war', 'hope'], cliche: 0.4 }, { text: 'Drift Apart', concepts: ['void', 'sorrow'] },
  ],
  epithets: [
    'Unbound', 'Pale', 'Drowned', 'Patient', 'Hollow', 'Unsworn', 'Last', 'Silent', 'Undying', 'Wanderer', 'Merciful', 'Lost',
    'Unseen', 'Restless', 'Bright', 'Grey', 'Crowned', 'Broken', 'Exile', 'Elder', 'Kind', 'Small', 'Brave',
  ].map((text): VocabItem => ({ text })).concat([{ text: 'Nameless', cliche: 0.4 }]),
  subtitlePatterns: [
    '{adj} {noun}', '{noun} of {noun}', 'The {adj} {noun}', '{abstract}', '{prep} the {noun}', 'The {noun} of {nounPl}',
  ],
};
