// Конфигурация синих тайлов по дополнениям
// Базовая игра: 18-38 (21 тайл)
// Prophecy of Kings (PoK): 59-66, 69-76 (16 тайлов)
// Thunder's Edge: 97-111 (15 тайлов)

export const BLUE_TILES_BY_EXPANSION = {
  base: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38],
  pok: [59, 60, 61, 62, 63, 64, 65, 66, 69, 70, 71, 72, 73, 74, 75, 76],
  thundersEdge: [97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111]
};

export const MASTER_BLUE_TILES_TIERS = {
  tier1: [27, 28, 29, 30, 35, 37, 69, 70, 71, 72, 75, 97, 101, 110],
  tier2: [26, 31, 33, 34, 36, 38, 62, 64, 65, 66, 73, 74, 76, 98, 99, 100, 105, 106, 107, 108],
  tier3: [18, 19, 20, 21, 22, 23, 24, 25, 32, 59, 60, 61, 63, 102, 103, 104, 109, 111]
};

export const DEFAULT_BLUE_TILES = MASTER_BLUE_TILES_TIERS;

export const ALL_BLUE_TILES = [
  ...BLUE_TILES_BY_EXPANSION.base,
  ...BLUE_TILES_BY_EXPANSION.pok,
  ...BLUE_TILES_BY_EXPANSION.thundersEdge
];

export function getActiveBlueTiles(expansions = {}) {
  const tiles = [...BLUE_TILES_BY_EXPANSION.base];
  if (expansions?.pok) {
    tiles.push(...BLUE_TILES_BY_EXPANSION.pok);
  }
  if (expansions?.thundersEdge) {
    tiles.push(...BLUE_TILES_BY_EXPANSION.thundersEdge);
  }
  return tiles.sort((a, b) => a - b);
}

export function getDefaultTiersForExpansions(expansions = {}) {
  const activeSet = new Set(getActiveBlueTiles(expansions));

  return {
    tier1: MASTER_BLUE_TILES_TIERS.tier1.filter(id => activeSet.has(id)),
    tier2: MASTER_BLUE_TILES_TIERS.tier2.filter(id => activeSet.has(id)),
    tier3: MASTER_BLUE_TILES_TIERS.tier3.filter(id => activeSet.has(id))
  };
}
