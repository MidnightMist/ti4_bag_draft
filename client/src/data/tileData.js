// Twilight Imperium 4 Tile Metadata & Expansion Definitions

// 1. Mecatol Rex Tile ID
export function getMecatolTileId(expansions = {}) {
  return expansions?.thundersEdge ? 112 : 18;
}

// 2. Blue System Tiles
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

// 3. Red System Tiles
// Base game: 39-50 (12 tiles)
// PoK: 67, 68, 77-80 (6 tiles)
// Thunder's Edge: 113-117 (5 tiles)
export const RED_TILES_BY_EXPANSION = {
  base: [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
  pok: [67, 68, 77, 78, 79, 80],
  thundersEdge: [113, 114, 115, 116, 117]
};

export const ALL_RED_TILES = [
  ...RED_TILES_BY_EXPANSION.base,
  ...RED_TILES_BY_EXPANSION.pok,
  ...RED_TILES_BY_EXPANSION.thundersEdge
];

export function getActiveRedTiles(expansions = {}) {
  const tiles = [...RED_TILES_BY_EXPANSION.base];
  if (expansions?.pok) {
    tiles.push(...RED_TILES_BY_EXPANSION.pok);
  }
  if (expansions?.thundersEdge) {
    tiles.push(...RED_TILES_BY_EXPANSION.thundersEdge);
  }
  return tiles.sort((a, b) => a - b);
}

// 4. Anomalies (41-45, 67, 68, 79-81, 113-117)
export const ANOMALY_TILES = [
  41, 42, 43, 44, 45,
  67, 68,
  79, 80, 81,
  113, 114, 115, 116, 117
];

const ANOMALY_SET = new Set(ANOMALY_TILES);
export function isAnomaly(tileId) {
  return ANOMALY_SET.has(Number(tileId));
}

// 5. Wormholes
// Alpha Wormholes: 26, 39, 79, 102
export const ALPHA_WORMHOLE_TILES = [26, 39, 79, 102];
const ALPHA_WORMHOLE_SET = new Set(ALPHA_WORMHOLE_TILES);

export function hasAlphaWormhole(tileId) {
  return ALPHA_WORMHOLE_SET.has(Number(tileId));
}

// Beta Wormholes: 25, 40, 64, 113
export const BETA_WORMHOLE_TILES = [25, 40, 64, 113];
const BETA_WORMHOLE_SET = new Set(BETA_WORMHOLE_TILES);

export function hasBetaWormhole(tileId) {
  return BETA_WORMHOLE_SET.has(Number(tileId));
}

export function getWormholeType(tileId) {
  const id = Number(tileId);
  if (ALPHA_WORMHOLE_SET.has(id)) return 'alpha';
  if (BETA_WORMHOLE_SET.has(id)) return 'beta';
  return null;
}
