import type { PhoneticProfile } from '@vps-name-tools/core';

export const NEUTRAL: PhoneticProfile = {
  id: 'neutral',
  label: 'neutral mythic',
  onsets: [['b', 1], ['d', 1], ['f', 0.6], ['g', 0.8], ['h', 0.6], ['k', 1], ['l', 1], ['m', 1], ['n', 1], ['r', 1], ['s', 1],
    ['t', 1], ['v', 0.8], ['th', 0.5], ['br', 0.5], ['dr', 0.5], ['kr', 0.4], ['st', 0.5], ['tr', 0.5], ['', 0.6]],
  nuclei: [['a', 1.2], ['e', 1], ['i', 0.8], ['o', 1], ['u', 0.5], ['ae', 0.15], ['ai', 0.2]],
  codas: [['', 3], ['n', 1], ['r', 1], ['l', 0.8], ['s', 0.5], ['th', 0.3], ['nd', 0.3], ['rn', 0.3]],
  shapes: [['CV', 3], ['CVC', 2], ['V', 0.4], ['VC', 0.3]],
  syllables: [[2, 3], [3, 1.5], [1, 0.2]],
  endings: [['ara', 0.5], ['en', 0.6], ['is', 0.5], ['or', 0.6], ['eth', 0.3], ['ia', 0.5], ['um', 0.4]],
  endingChance: 0.3,
  forbid: ['q(?!u)', 'vv', 'uu', 'ii', '^ng', "'"],
  letters: [4, 10],
};
