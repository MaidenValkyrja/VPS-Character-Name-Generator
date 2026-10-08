import type { MythPack } from '../types';

export const NONE: MythPack = {
  id: 'none', label: 'None / Neutral', group: 'Neutral', tier: 'none', noteLabel: '', profile: 'neutral', coinedRate: 1,
  conceptBoosts: {}, imagery: [], symbolic: [], rhythm: {}, denylist: [],
  review: { status: 'reviewed', notes: 'No cultural content.' },
};
