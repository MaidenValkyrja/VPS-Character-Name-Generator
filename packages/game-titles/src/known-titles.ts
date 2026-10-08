import { normalize } from '@vps-name-tools/core';

/**
 * Famous game titles. An exact (normalised) match is never produced. Task 22 grows this list to 1,500+
 * from public best-seller and notable-game lists; titles are facts, not creative content.
 */
const TITLES: readonly string[] = [
  'Dark Souls', 'Elden Ring', 'Hollow Knight', 'Hades', 'Hades II', 'Celeste', 'Stardew Valley', 'Minecraft', 'Terraria',
  'Fallout', 'Skyrim', 'Frostpunk', 'Bloodborne', 'Sekiro', 'Halo', 'Doom', 'Quake', 'Portal', 'Braid', 'Limbo', 'Inside',
  'Journey', 'Okami', 'Undertale', 'Cuphead', 'Dead Cells', 'Slay the Spire', 'Balatro', 'Spiritfarer', 'Outer Wilds',
  'Disco Elysium', 'Subnautica', 'Valheim', 'RimWorld', 'Factorio', 'Cities: Skylines', 'Civilization', 'Starfield',
  'Mass Effect', 'Dragon Age', 'The Witcher', 'Cyberpunk 2077', 'Death Stranding', 'Ghost of Tsushima', 'God of War',
  'Horizon Zero Dawn', 'The Last of Us', 'Red Dead Redemption', 'Animal Crossing', 'Final Fantasy', 'Kingdom Hearts',
  'Dead Space', 'Silent Hill', 'Resident Evil', 'Alan Wake', 'Control', 'Returnal', 'Tunic', 'Gris',
  'Ori and the Blind Forest', 'Hyper Light Drifter', 'Darkest Dungeon', 'Into the Breach', 'Ashfall', 'Frostbound',
];

export const KNOWN_TITLES: ReadonlySet<string> = new Set(TITLES.map(normalize));
