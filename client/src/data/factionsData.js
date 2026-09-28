export const FACTIONS = [
  { id: 'sardakk', filename: 'TI4 - Sardakk N_orr.png', name: "Sardakk N'orr", expansion: 'base' },
  { id: 'arborec', filename: 'TI4 - The Arborec.png', name: 'The Arborec', expansion: 'base' },
  { id: 'letnev', filename: 'TI4 - The Barony of Letnev.png', name: 'The Barony of Letnev', expansion: 'base' },
  { id: 'saar', filename: 'TI4 - The Clan of Saar.png', name: 'The Clan of Saar', expansion: 'base' },
  { id: 'keleres', filename: 'TI4 - The Council Keleres.png', name: 'The Council Keleres', expansion: 'base' },
  { id: 'muaat', filename: 'TI4 - The Embers of Muaat.png', name: 'The Embers of Muaat', expansion: 'base' },
  { id: 'hacan', filename: 'TI4 - The Emirates of Hacan.png', name: 'The Emirates of Hacan', expansion: 'base' },
  { id: 'sol', filename: 'TI4 - The Federation of Sol.png', name: 'The Federation of Sol', expansion: 'base' },
  { id: 'creuss', filename: 'TI4 - The Ghosts of Creuss.png', name: 'The Ghosts of Creuss', expansion: 'base' },
  { id: 'l1z1x', filename: 'TI4 - The L1Z1X Mindnet.png', name: 'The L1Z1X Mindnet', expansion: 'base' },
  { id: 'mentak', filename: 'TI4 - The Mentak Coalition.png', name: 'The Mentak Coalition', expansion: 'base' },
  { id: 'naalu', filename: 'TI4 - The Naalu Collective.png', name: 'The Naalu Collective', expansion: 'base' },
  { id: 'nekro', filename: 'TI4 - The Nekro Virus.png', name: 'The Nekro Virus', expansion: 'base' },
  { id: 'jolnar', filename: 'TI4 - The Universities of Jol-Nar.png', name: 'The Universities of Jol-Nar', expansion: 'base' },
  { id: 'winnu', filename: 'TI4 - The Winnu.png', name: 'The Winnu', expansion: 'base' },
  { id: 'xxcha', filename: 'TI4 - The Xxcha Kingdom.png', name: 'The Xxcha Kingdom', expansion: 'base' },
  { id: 'yin', filename: 'TI4 - The Yin Brotherhood.png', name: 'The Yin Brotherhood', expansion: 'base' },
  { id: 'yssaril', filename: 'TI4 - The Yssaril Tribes.png', name: 'The Yssaril Tribes', expansion: 'base' },

  // Prophecy of Kings
  { id: 'argent', filename: 'TI4 - The Argent Flight.png', name: 'The Argent Flight', expansion: 'pok' },
  { id: 'empyrean', filename: 'TI4 - The Empyrean.png', name: 'The Empyrean', expansion: 'pok' },
  { id: 'mahact', filename: 'TI4 - The Mahact Gene-Sorcerers.png', name: 'The Mahact Gene-Sorcerers', expansion: 'pok' },
  { id: 'naazrokha', filename: 'TI4 - The Naaz-Rokha Alliance.png', name: 'The Naaz-Rokha Alliance', expansion: 'pok' },
  { id: 'nomad', filename: 'TI4 - The Nomad.png', name: 'The Nomad', expansion: 'pok' },
  { id: 'titans', filename: 'TI4 - The Titans of Ul.png', name: 'The Titans of Ul', expansion: 'pok' },
  { id: 'vuilraith', filename: 'TI4 - The Vuil_Raith Cabal.png', name: "The Vuil'Raith Cabal", expansion: 'pok' },

  // Thunder's Edge
  { id: 'lastbastion', filename: 'TI4 - Last Bastion.png', name: 'Last Bastion', expansion: 'thundersEdge' },
  { id: 'crimson', filename: 'TI4 - The Crimson Rebellion.png', name: 'The Crimson Rebellion', expansion: 'thundersEdge' },
  { id: 'deepwrought', filename: 'TI4 - The Deepwrought Scholarate.png', name: 'The Deepwrought Scholarate', expansion: 'thundersEdge' },
  { id: 'firmament', filename: 'TI4 - The Firmament The Obsidian.png', name: 'The Firmament / The Obsidian', expansion: 'thundersEdge' },
  { id: 'ralnel', filename: 'TI4 - The Ral Nel Consortium.png', name: 'The Ral Nel Consortium', expansion: 'thundersEdge' },
];

export function getActiveFactions(expansions = { pok: true, thundersEdge: true }) {
  return FACTIONS.filter(f => {
    if (f.expansion === 'pok' && !expansions.pok) return false;
    if (f.expansion === 'thundersEdge' && !expansions.thundersEdge) return false;
    return true;
  });
}

/**
 * Mapping between faction IDs and their respective home system tile numbers.
 */
export const FACTION_HOME_SYSTEM_TILES = {
  sol: 1,
  mentak: 2,
  yin: 3,
  muaat: 4,
  arborec: 5,
  l1z1x: 6,
  winnu: 7,
  nekro: 8,
  naalu: 9,
  letnev: 10,
  saar: 11,
  jolnar: 12,
  sardakk: 13,
  xxcha: 14,
  yssaril: 15,
  hacan: 16,
  creuss: 17,
  mahact: 52,
  nomad: 53,
  vuilraith: 54,
  titans: 55,
  empyrean: 56,
  naazrokha: 57,
  argent: 58,
  lastbastion: 92,
  ralnel: 93,
  crimson: 94,
  deepwrought: 95,
  firmament: '96A',
  keleres: 2, // fallback for Council Keleres
};

export function getFactionHomeTileId(factionId) {
  if (!factionId) return null;
  return FACTION_HOME_SYSTEM_TILES[factionId] || null;
}
