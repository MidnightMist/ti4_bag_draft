// Twilight Imperium 4 Tile Metadata & Expansion Definitions

// 1. Mecatol Rex Tile ID
export function getMecatolTileId(expansions = {}) {
  return expansions?.thundersEdge ? 112 : 18;
}

// 2. Blue System Tiles
export const BLUE_TILES_BY_EXPANSION = {
  base: [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38],
  pok: [59, 60, 61, 62, 63, 64, 65, 66, 69, 70, 71, 72, 73, 74, 75, 76],
  thundersEdge: [97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111]
};

export const MASTER_BLUE_TILES_TIERS = {
  tier1: [27, 28, 29, 30, 35, 37, 69, 70, 71, 72, 75, 97, 101, 110],
  tier2: [26, 31, 33, 34, 36, 38, 62, 64, 65, 66, 73, 74, 76, 98, 99, 100, 105, 106, 107, 108],
  tier3: [19, 20, 21, 22, 23, 24, 25, 32, 59, 60, 61, 63, 102, 103, 104, 109, 111]
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

// --- Map Geometry & Placement Rules ---
export function generate37Hexes() {
  const hexes = [];
  const BASE_DIRECTIONS = [
    { x: 0, y: 107.39 },              // 0: South
    { x: -1.5 * 62, y: 0.5 * 107.39 },  // 1: South-West
    { x: -1.5 * 62, y: -0.5 * 107.39 }, // 2: North-West
    { x: 0, y: -107.39 },             // 3: North
    { x: 1.5 * 62, y: -0.5 * 107.39 },  // 4: North-East
    { x: 1.5 * 62, y: 0.5 * 107.39 },   // 5: South-East
  ];

  // Ring 0: Center
  hexes.push({ id: 'center', ring: 0, index: 0, type: 'center', x: 0, y: 0 });

  // Ring 1: 6 hexes
  for (let d = 0; d < 6; d++) {
    hexes.push({ id: `ring1-${d}`, ring: 1, index: d, type: 'ring1', x: BASE_DIRECTIONS[d].x, y: BASE_DIRECTIONS[d].y });
  }

  // Ring 2: 12 hexes
  for (let d = 0; d < 6; d++) {
    const nextD = (d + 1) % 6;
    const cX = BASE_DIRECTIONS[d].x * 2;
    const cY = BASE_DIRECTIONS[d].y * 2;
    hexes.push({ id: `ring2-corner-${d}`, ring: 2, index: d * 2, type: 'ring2', x: cX, y: cY });

    const nextCX = BASE_DIRECTIONS[nextD].x * 2;
    const nextCY = BASE_DIRECTIONS[nextD].y * 2;
    hexes.push({ id: `ring2-edge-${d}`, ring: 2, index: d * 2 + 1, type: 'ring2', x: (cX + nextCX) / 2, y: (cY + nextCY) / 2 });
  }

  // Ring 3: 18 hexes (6 Home Systems at corners + 12 edge hexes)
  for (let d = 0; d < 6; d++) {
    const nextD = (d + 1) % 6;
    const cX = BASE_DIRECTIONS[d].x * 3;
    const cY = BASE_DIRECTIONS[d].y * 3;

    hexes.push({ id: `home-system-${d}`, ring: 3, index: d, type: 'home_system', seatIndex: d, x: cX, y: cY });

    const nextCX = BASE_DIRECTIONS[nextD].x * 3;
    const nextCY = BASE_DIRECTIONS[nextD].y * 3;
    const dx = (nextCX - cX) / 3;
    const dy = (nextCY - cY) / 3;

    hexes.push({ id: `ring3-edge-${d}-1`, ring: 3, index: 6 + d * 2, type: 'ring3', x: cX + dx, y: cY + dy });
    hexes.push({ id: `ring3-edge-${d}-2`, ring: 3, index: 6 + d * 2 + 1, type: 'ring3', x: cX + dx * 2, y: cY + dy * 2 });
  }

  return hexes;
}

export const ALL_37_HEXES = generate37Hexes();

// In 3-player map, each home system (0, 2, 4) has exactly 1 adjacent Ring 3 spot on each side:
// - home-system-0 (South): ring3-edge-5-2 (SE side) and ring3-edge-0-1 (SW side)
// - home-system-2 (North-West): ring3-edge-1-2 (SW side) and ring3-edge-2-1 (North side)
// - home-system-4 (North-East): ring3-edge-3-2 (North side) and ring3-edge-4-1 (SE side)
export const THREE_PLAYER_RING3_HEX_IDS = new Set([
  'home-system-0',
  'ring3-edge-0-1',
  'ring3-edge-5-2',
  'home-system-2',
  'ring3-edge-2-1',
  'ring3-edge-1-2',
  'home-system-4',
  'ring3-edge-4-1',
  'ring3-edge-3-2'
]);

export const SEVEN_PLAYER_49_HEXES = [
  // Col 0 (9 tiles)
  { id: 'home-p1', col: 0, row: -4, x: 0.0, y: -429.56, type: 'home_system', ring: 3, seatIndex: 0 },
  { id: 'ring-0-neg3', col: 0, row: -3, x: 0.0, y: -322.17, type: 'ring_system', ring: 2 },
  { id: 'ring-0-neg2', col: 0, row: -2, x: 0.0, y: -214.78, type: 'ring_system', ring: 1 },
  { id: 'hl-85B', col: 0, row: -1, x: 0.0, y: -107.39, type: 'hyperlane', ring: 1 },
  { id: 'center', col: 0, row: 0, x: 0.0, y: 0.0, type: 'center', ring: 0 },
  { id: 'hl-84B', col: 0, row: 1, x: 0.0, y: 107.39, type: 'hyperlane', ring: 1 },
  { id: 'ring-0-pos2', col: 0, row: 2, x: 0.0, y: 214.78, type: 'ring_system', ring: 1 },
  { id: 'ring-0-pos3', col: 0, row: 3, x: 0.0, y: 322.17, type: 'ring_system', ring: 2 },
  { id: 'home-p4', col: 0, row: 4, x: 0.0, y: 429.56, type: 'home_system', ring: 3, seatIndex: 3 },

  // Col +1 (8 tiles)
  { id: 'ring-1-neg35', col: 1, row: -3.5, x: 93.0, y: -375.87, type: 'ring_system', ring: 3 },
  { id: 'hl-88B', col: 1, row: -2.5, x: 93.0, y: -268.48, type: 'hyperlane', ring: 2 },
  { id: 'ring-1-neg15', col: 1, row: -1.5, x: 93.0, y: -161.09, type: 'ring_system', ring: 2 },
  { id: 'ring-1-neg05', col: 1, row: -0.5, x: 93.0, y: -53.7, type: 'ring_system', ring: 1 },
  { id: 'ring-1-pos05', col: 1, row: 0.5, x: 93.0, y: 53.7, type: 'ring_system', ring: 1 },
  { id: 'ring-1-pos15', col: 1, row: 1.5, x: 93.0, y: 161.09, type: 'ring_system', ring: 2 },
  { id: 'hl-86B', col: 1, row: 2.5, x: 93.0, y: 268.48, type: 'hyperlane', ring: 2 },
  { id: 'ring-1-pos35', col: 1, row: 3.5, x: 93.0, y: 375.87, type: 'ring_system', ring: 3 },

  // Col +2 (5 tiles)
  { id: 'ring-2-neg2', col: 2, row: -2, x: 186.0, y: -214.78, type: 'ring_system', ring: 3 },
  { id: 'ring-2-neg1', col: 2, row: -1, x: 186.0, y: -107.39, type: 'ring_system', ring: 2 },
  { id: 'ring-2-0', col: 2, row: 0, x: 186.0, y: 0.0, type: 'ring_system', ring: 2 },
  { id: 'ring-2-pos1', col: 2, row: 1, x: 186.0, y: 107.39, type: 'ring_system', ring: 2 },
  { id: 'ring-2-pos2', col: 2, row: 2, x: 186.0, y: 214.78, type: 'ring_system', ring: 3 },

  // Col +3 (4 tiles)
  { id: 'home-p2', col: 3, row: -1.5, x: 279.0, y: -161.09, type: 'home_system', ring: 3, seatIndex: 1 },
  { id: 'ring-3-neg05', col: 3, row: -0.5, x: 279.0, y: -53.7, type: 'ring_system', ring: 3 },
  { id: 'ring-3-pos05', col: 3, row: 0.5, x: 279.0, y: 53.7, type: 'ring_system', ring: 3 },
  { id: 'home-p3', col: 3, row: 1.5, x: 279.0, y: 161.09, type: 'home_system', ring: 3, seatIndex: 2 },

  // Col -1 (8 tiles)
  { id: 'ring-neg1-neg35', col: -1, row: -3.5, x: -93.0, y: -375.87, type: 'ring_system', ring: 3 },
  { id: 'ring-neg1-neg25', col: -1, row: -2.5, x: -93.0, y: -268.48, type: 'ring_system', ring: 2 },
  { id: 'ring-neg1-neg15', col: -1, row: -1.5, x: -93.0, y: -161.09, type: 'ring_system', ring: 1 },
  { id: 'ring-neg1-neg05', col: -1, row: -0.5, x: -93.0, y: -53.7, type: 'ring_system', ring: 1 },
  { id: 'hl-90B', col: -1, row: 0.5, x: -93.0, y: 53.7, type: 'hyperlane', ring: 1 },
  { id: 'ring-neg1-pos15', col: -1, row: 1.5, x: -93.0, y: 161.09, type: 'ring_system', ring: 1 },
  { id: 'ring-neg1-pos25', col: -1, row: 2.5, x: -93.0, y: 268.48, type: 'ring_system', ring: 2 },
  { id: 'ring-neg1-pos35', col: -1, row: 3.5, x: -93.0, y: 375.87, type: 'ring_system', ring: 3 },

  // Col -2 (7 tiles)
  { id: 'ring-neg2-neg3', col: -2, row: -3, x: -186.0, y: -322.17, type: 'ring_system', ring: 3 },
  { id: 'ring-neg2-neg2', col: -2, row: -2, x: -186.0, y: -214.78, type: 'ring_system', ring: 2 },
  { id: 'ring-neg2-neg1', col: -2, row: -1, x: -186.0, y: -107.39, type: 'ring_system', ring: 2 },
  { id: 'ring-neg2-0', col: -2, row: 0, x: -186.0, y: 0.0, type: 'ring_system', ring: 2 },
  { id: 'ring-neg2-pos1', col: -2, row: 1, x: -186.0, y: 107.39, type: 'ring_system', ring: 2 },
  { id: 'ring-neg2-pos2', col: -2, row: 2, x: -186.0, y: 214.78, type: 'ring_system', ring: 2 },
  { id: 'ring-neg2-pos3', col: -2, row: 3, x: -186.0, y: 322.17, type: 'ring_system', ring: 3 },

  // Col -3 (6 tiles)
  { id: 'home-p7', col: -3, row: -2.5, x: -279.0, y: -268.48, type: 'home_system', ring: 3, seatIndex: 6 },
  { id: 'ring-neg3-neg15', col: -3, row: -1.5, x: -279.0, y: -161.09, type: 'ring_system', ring: 3 },
  { id: 'hl-83B', col: -3, row: -0.5, x: -279.0, y: -53.7, type: 'hyperlane', ring: 2 },
  { id: 'ring-neg3-pos05', col: -3, row: 0.5, x: -279.0, y: 53.7, type: 'ring_system', ring: 3 },
  { id: 'ring-neg3-pos15', col: -3, row: 1.5, x: -279.0, y: 161.09, type: 'ring_system', ring: 3 },
  { id: 'home-p5', col: -3, row: 2.5, x: -279.0, y: 268.48, type: 'home_system', ring: 3, seatIndex: 4 },

  // Col -4 (2 tiles)
  { id: 'ring-neg4-neg1', col: -4, row: -1, x: -372.0, y: -107.39, type: 'ring_system', ring: 3 },
  { id: 'home-p6', col: -4, row: 0, x: -372.0, y: 0.0, type: 'home_system', ring: 3, seatIndex: 5 },
];

export const EIGHT_PLAYER_55_HEXES = [
  // Col 0 (9 tiles)
  { id: 'home-p1', col: 0, row: -4, x: 0.0, y: -429.54, type: 'home_system', ring: 3, seatIndex: 0, playerIndex: 0 },
  { id: 'ring-0-neg3', col: 0, row: -3, x: 0.0, y: -322.17, type: 'ring_system', ring: 2 },
  { id: 'ring-0-neg2', col: 0, row: -2, x: 0.0, y: -214.78, type: 'ring_system', ring: 1 },
  { id: 'hl-87A', col: 0, row: -1, x: 0.0, y: -107.39, type: 'hyperlane', ring: 1, tileId: '87A', rotation: 60, fixed: true, isHyperlane: true },
  { id: 'center', col: 0, row: 0, x: 0.0, y: 0.0, type: 'center', ring: 0 },
  { id: 'hl-88A', col: 0, row: 1, x: 0.0, y: 107.39, type: 'hyperlane', ring: 1, tileId: '88A', rotation: 120, fixed: true, isHyperlane: true },
  { id: 'ring-0-pos2', col: 0, row: 2, x: 0.0, y: 214.78, type: 'ring_system', ring: 1 },
  { id: 'ring-0-pos3', col: 0, row: 3, x: 0.0, y: 322.17, type: 'ring_system', ring: 2 },
  { id: 'home-p5', col: 0, row: 4, x: 0.0, y: 429.54, type: 'home_system', ring: 3, seatIndex: 4, playerIndex: 4 },

  // Col +1 (8 tiles)
  { id: 'ring-1-neg35', col: 1, row: -3.5, x: 93.0, y: -375.87, type: 'ring_system', ring: 3 },
  { id: 'ring-1-neg25', col: 1, row: -2.5, x: 93.0, y: -268.48, type: 'ring_system', ring: 2 },
  { id: 'ring-1-neg15', col: 1, row: -1.5, x: 93.0, y: -161.09, type: 'ring_system', ring: 1 },
  { id: 'hl-90B', col: 1, row: -0.5, x: 93.0, y: -53.7, type: 'hyperlane', ring: 1, tileId: '90B', rotation: 180, fixed: true, isHyperlane: true },
  { id: 'ring-1-pos05', col: 1, row: 0.5, x: 93.0, y: 53.7, type: 'ring_system', ring: 1 },
  { id: 'ring-1-pos15', col: 1, row: 1.5, x: 93.0, y: 161.09, type: 'ring_system', ring: 1 },
  { id: 'ring-1-pos25', col: 1, row: 2.5, x: 93.0, y: 268.48, type: 'ring_system', ring: 2 },
  { id: 'ring-1-pos35', col: 1, row: 3.5, x: 93.0, y: 375.87, type: 'ring_system', ring: 3 },

  // Col +2 (7 tiles)
  { id: 'ring-2-neg3', col: 2, row: -3, x: 186.0, y: -322.17, type: 'ring_system', ring: 3 },
  { id: 'ring-2-neg2', col: 2, row: -2, x: 186.0, y: -214.78, type: 'ring_system', ring: 2 },
  { id: 'ring-2-neg1', col: 2, row: -1, x: 186.0, y: -107.39, type: 'ring_system', ring: 2 },
  { id: 'ring-2-0', col: 2, row: 0, x: 186.0, y: 0.0, type: 'ring_system', ring: 2 },
  { id: 'ring-2-pos1', col: 2, row: 1, x: 186.0, y: 107.39, type: 'ring_system', ring: 2 },
  { id: 'ring-2-pos2', col: 2, row: 2, x: 186.0, y: 214.78, type: 'ring_system', ring: 2 },
  { id: 'ring-2-pos3', col: 2, row: 3, x: 186.0, y: 322.17, type: 'ring_system', ring: 3 },

  // Col +3 (6 tiles)
  { id: 'home-p2', col: 3, row: -2.5, x: 279.0, y: -268.48, type: 'home_system', ring: 3, seatIndex: 1, playerIndex: 1 },
  { id: 'ring-3-neg15', col: 3, row: -1.5, x: 279.0, y: -161.09, type: 'ring_system', ring: 3 },
  { id: 'ring-3-neg05', col: 3, row: -0.5, x: 279.0, y: -53.7, type: 'ring_system', ring: 3 },
  { id: 'hl-85B', col: 3, row: 0.5, x: 279.0, y: 53.7, type: 'hyperlane', ring: 2, tileId: '85B', rotation: 300, fixed: true, isHyperlane: true },
  { id: 'ring-3-pos15', col: 3, row: 1.5, x: 279.0, y: 161.09, type: 'ring_system', ring: 3 },
  { id: 'home-p4', col: 3, row: 2.5, x: 279.0, y: 268.48, type: 'home_system', ring: 3, seatIndex: 3, playerIndex: 3 },

  // Col +4 (2 tiles)
  { id: 'home-p3', col: 4, row: 0, x: 372.0, y: 0.0, type: 'home_system', ring: 3, seatIndex: 2, playerIndex: 2 },
  { id: 'ring-4-pos1', col: 4, row: 1, x: 372.0, y: 107.39, type: 'ring_system', ring: 3 },

  // Col -1 (8 tiles)
  { id: 'ring-neg1-neg35', col: -1, row: -3.5, x: -93.0, y: -375.87, type: 'ring_system', ring: 3 },
  { id: 'ring-neg1-neg25', col: -1, row: -2.5, x: -93.0, y: -268.48, type: 'ring_system', ring: 2 },
  { id: 'ring-neg1-neg15', col: -1, row: -1.5, x: -93.0, y: -161.09, type: 'ring_system', ring: 1 },
  { id: 'ring-neg1-neg05', col: -1, row: -0.5, x: -93.0, y: -53.7, type: 'ring_system', ring: 1 },
  { id: 'hl-89B', col: -1, row: 0.5, x: -93.0, y: 53.7, type: 'hyperlane', ring: 1, tileId: '89B', rotation: 0, fixed: true, isHyperlane: true },
  { id: 'ring-neg1-pos15', col: -1, row: 1.5, x: -93.0, y: 161.09, type: 'ring_system', ring: 1 },
  { id: 'ring-neg1-pos25', col: -1, row: 2.5, x: -93.0, y: 268.48, type: 'ring_system', ring: 2 },
  { id: 'ring-neg1-pos35', col: -1, row: 3.5, x: -93.0, y: 375.87, type: 'ring_system', ring: 3 },

  // Col -2 (7 tiles)
  { id: 'ring-neg2-neg3', col: -2, row: -3, x: -186.0, y: -322.17, type: 'ring_system', ring: 3 },
  { id: 'ring-neg2-neg2', col: -2, row: -2, x: -186.0, y: -214.78, type: 'ring_system', ring: 2 },
  { id: 'ring-neg2-neg1', col: -2, row: -1, x: -186.0, y: -107.39, type: 'ring_system', ring: 2 },
  { id: 'ring-neg2-0', col: -2, row: 0, x: -186.0, y: 0.0, type: 'ring_system', ring: 2 },
  { id: 'ring-neg2-pos1', col: -2, row: 1, x: -186.0, y: 107.39, type: 'ring_system', ring: 2 },
  { id: 'ring-neg2-pos2', col: -2, row: 2, x: -186.0, y: 214.78, type: 'ring_system', ring: 2 },
  { id: 'ring-neg2-pos3', col: -2, row: 3, x: -186.0, y: 322.17, type: 'ring_system', ring: 3 },

  // Col -3 (6 tiles)
  { id: 'home-p8', col: -3, row: -2.5, x: -279.0, y: -268.48, type: 'home_system', ring: 3, seatIndex: 7, playerIndex: 7 },
  { id: 'ring-neg3-neg15', col: -3, row: -1.5, x: -279.0, y: -161.09, type: 'ring_system', ring: 3 },
  { id: 'hl-83B', col: -3, row: -0.5, x: -279.0, y: -53.7, type: 'hyperlane', ring: 2, tileId: '83B', rotation: 300, fixed: true, isHyperlane: true },
  { id: 'ring-neg3-pos05', col: -3, row: 0.5, x: -279.0, y: 53.7, type: 'ring_system', ring: 3 },
  { id: 'ring-neg3-pos15', col: -3, row: 1.5, x: -279.0, y: 161.09, type: 'ring_system', ring: 3 },
  { id: 'home-p6', col: -3, row: 2.5, x: -279.0, y: 268.48, type: 'home_system', ring: 3, seatIndex: 5, playerIndex: 5 },

  // Col -4 (2 tiles)
  { id: 'ring-neg4-neg1', col: -4, row: -1, x: -372.0, y: -107.39, type: 'ring_system', ring: 3 },
  { id: 'home-p7', col: -4, row: 0, x: -372.0, y: 0.0, type: 'home_system', ring: 3, seatIndex: 6, playerIndex: 6 },
];

export const EIGHT_PLAYER_HYPERLANES = {
  'hl-87A': { tileId: '87A', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 60 },
  'hl-90B': { tileId: '90B', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 180 },
  'hl-88A': { tileId: '88A', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 120 },
  'hl-89B': { tileId: '89B', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 0 },
  'hl-85B': { tileId: '85B', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 300 },
  'hl-83B': { tileId: '83B', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 300 },
};

export const EIGHT_PLAYER_HOME_SYSTEMS = {
  'home-p1': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 0, playerIndex: 0 },
  'home-p2': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 1, playerIndex: 1 },
  'home-p3': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 2, playerIndex: 2 },
  'home-p4': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 3, playerIndex: 3 },
  'home-p5': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 4, playerIndex: 4 },
  'home-p6': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 5, playerIndex: 5 },
  'home-p7': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 6, playerIndex: 6 },
  'home-p8': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 7, playerIndex: 7 },
};

export const EIGHT_PLAYER_SEAT_TO_PLAYER_INDEX = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7
};

export const EIGHT_PLAYER_PLAYER_TO_SEAT_INDEX = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7
};

export function getActiveHexes(playerCount = 6) {
  if (playerCount === 8) {
    return EIGHT_PLAYER_55_HEXES.map(h => ({ ...h }));
  }
  if (playerCount === 7) {
    return SEVEN_PLAYER_49_HEXES.map(h => ({ ...h }));
  }
  const hexes = generate37Hexes();
  if (playerCount === 3) {
    return hexes.filter(h => {
      if (h.ring === 3) {
        return THREE_PLAYER_RING3_HEX_IDS.has(h.id);
      }
      return true;
    });
  }
  return hexes;
}

// Pre-placed fixed hyperlane tiles for 7-player galaxy map
export const SEVEN_PLAYER_HYPERLANES = {
  'hl-85B': { tileId: '85B', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 0 },
  'hl-84B': { tileId: '84B', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 0 },
  'hl-88B': { tileId: '88B', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 0 },
  'hl-86B': { tileId: '86B', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 0 },
  'hl-90B': { tileId: '90B', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 0 },
  'hl-83B': { tileId: '83B', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 120 },
};

// Pre-placed home systems for 7-player galaxy map
export const SEVEN_PLAYER_HOME_SYSTEMS = {
  'home-p1': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 0, playerIndex: 0 },
  'home-p2': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 1, playerIndex: 1 },
  'home-p3': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 2, playerIndex: 2 },
  'home-p4': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 3, playerIndex: 3 },
  'home-p5': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 4, playerIndex: 4 },
  'home-p6': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 5, playerIndex: 5 },
  'home-p7': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 6, playerIndex: 6 },
};

// 7-player seat mapping:
export const SEVEN_PLAYER_SEAT_TO_PLAYER_INDEX = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
};

export const SEVEN_PLAYER_PLAYER_TO_SEAT_INDEX = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
};

// Pre-placed fixed hyperlane tiles for 5-player galaxy map
export const FIVE_PLAYER_HYPERLANES = {
  'ring1-0': { tileId: '85A', type: 'hyperlane', isHyperlane: true, fixed: true },
  'ring2-edge-0': { tileId: '87A', type: 'hyperlane', isHyperlane: true, fixed: true },
  'ring2-edge-5': { tileId: '88A', type: 'hyperlane', isHyperlane: true, fixed: true },
  'ring3-edge-0-1': { tileId: '84A', type: 'hyperlane', isHyperlane: true, fixed: true },
  'ring3-edge-5-2': { tileId: '83A', type: 'hyperlane', isHyperlane: true, fixed: true },
  'home-system-0': { tileId: '86A', type: 'hyperlane', isHyperlane: true, fixed: true },
};

// Pre-placed fixed hyperlane tiles for 4-player galaxy map (with hyperlanes on both South and North corridors)
export const FOUR_PLAYER_HYPERLANES = {
  // South corridor (d = 0) - original orientation
  'ring1-0': { tileId: '85A', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 0 },
  'ring2-edge-0': { tileId: '87A', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 0 },
  'ring2-edge-5': { tileId: '88A', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 0 },
  'ring3-edge-0-1': { tileId: '84A', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 0 },
  'ring3-edge-5-2': { tileId: '83A', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 0 },
  'home-system-0': { tileId: '86A', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 0 },

  // North corridor (d = 3) - 85, 83, 84, 86 inverted (180 deg), 88 and 87 rotated 180 deg
  'ring1-3': { tileId: '85A', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 180 },
  'ring2-edge-3': { tileId: '87A', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 180 },
  'ring2-edge-2': { tileId: '88A', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 180 },
  'ring3-edge-3-1': { tileId: '84A', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 180 },
  'ring3-edge-2-2': { tileId: '83A', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 180 },
  'home-system-3': { tileId: '86A', type: 'hyperlane', isHyperlane: true, fixed: true, rotation: 180 },
};

// Pre-placed home systems for 3-player galaxy map (P1 at home-system-4, P2 at home-system-0, P3 at home-system-2)
export const THREE_PLAYER_HOME_SYSTEMS = {
  'home-system-4': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 4, playerIndex: 0 },
  'home-system-0': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 0, playerIndex: 1 },
  'home-system-2': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 2, playerIndex: 2 },
};

// 3-player seat mapping: P1 (North-East = seat 4), P2 (South = seat 0), P3 (North-West = seat 2)
export const THREE_PLAYER_SEAT_TO_PLAYER_INDEX = {
  4: 0,
  0: 1,
  2: 2,
};

export const THREE_PLAYER_PLAYER_TO_SEAT_INDEX = {
  0: 4,
  1: 0,
  2: 2,
};

// 4-player seat mapping:
// Seat 4: North-East -> Player 1 (Index 0, Speaker)
// Seat 5: South-East -> Player 2 (Index 1)
// Seat 1: South-West -> Player 3 (Index 2)
// Seat 2: North-West -> Player 4 (Index 3)
// Seat 0: South -> Hyperlane tile 86A
// Seat 3: North -> Hyperlane tile 86A
export const FOUR_PLAYER_SEAT_TO_PLAYER_INDEX = {
  4: 0,
  5: 1,
  1: 2,
  2: 3,
};

export const FOUR_PLAYER_PLAYER_TO_SEAT_INDEX = {
  0: 4,
  1: 5,
  2: 1,
  3: 2,
};

// Pre-placed home systems for 4-player galaxy map
export const FOUR_PLAYER_HOME_SYSTEMS = {
  'home-system-4': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 4, playerIndex: 0 },
  'home-system-5': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 5, playerIndex: 1 },
  'home-system-1': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 1, playerIndex: 2 },
  'home-system-2': { tileId: 0, type: 'home_system', fixed: true, seatIndex: 2, playerIndex: 3 },
};

// 5-player seat mapping:
// Seat 3: North -> Player 1 (Index 0, Speaker)
// Seat 4: North-East -> Player 2 (Index 1)
// Seat 5: South-East -> Player 3 (Index 2)
// Seat 1: South-West -> Player 4 (Index 3)
// Seat 2: North-West -> Player 5 (Index 4)
// Seat 0: South -> Hyperlane tile 86A
export const FIVE_PLAYER_SEAT_TO_PLAYER_INDEX = {
  3: 0,
  4: 1,
  5: 2,
  1: 3,
  2: 4,
};

export const FIVE_PLAYER_PLAYER_TO_SEAT_INDEX = {
  0: 3,
  1: 4,
  2: 5,
  3: 1,
  4: 2,
};

export function getPlayerForSeatIndex(players, seatIndex, playerCount = 6) {
  if (!players || players.length === 0) return null;
  if (playerCount === 7) {
    const pIdx = SEVEN_PLAYER_SEAT_TO_PLAYER_INDEX[seatIndex];
    return pIdx !== undefined ? players[pIdx] : null;
  }
  if (playerCount === 5) {
    const pIdx = FIVE_PLAYER_SEAT_TO_PLAYER_INDEX[seatIndex];
    return pIdx !== undefined ? players[pIdx] : null;
  }
  if (playerCount === 4) {
    const pIdx = FOUR_PLAYER_SEAT_TO_PLAYER_INDEX[seatIndex];
    return pIdx !== undefined ? players[pIdx] : null;
  }
  if (playerCount === 3) {
    const pIdx = THREE_PLAYER_SEAT_TO_PLAYER_INDEX[seatIndex];
    return pIdx !== undefined ? players[pIdx] : null;
  }
  return players[seatIndex] || null;
}

export function getSeatIndexForPlayer(playerIndex, playerCount = 6) {
  if (playerCount === 7) {
    return SEVEN_PLAYER_PLAYER_TO_SEAT_INDEX[playerIndex] ?? 0;
  }
  if (playerCount === 5) {
    return FIVE_PLAYER_PLAYER_TO_SEAT_INDEX[playerIndex] ?? 0;
  }
  if (playerCount === 4) {
    return FOUR_PLAYER_PLAYER_TO_SEAT_INDEX[playerIndex] ?? 0;
  }
  if (playerCount === 3) {
    return THREE_PLAYER_PLAYER_TO_SEAT_INDEX[playerIndex] ?? 0;
  }
  return playerIndex;
}

export function getHexNeighbors(hex, allHexes = ALL_37_HEXES, playerCount = 6) {
  const neighbors = [];
  const H_dist = 107.39; // sqrt(3) * 62
  for (const other of allHexes) {
    if (other.id === hex.id) continue;
    const dx = other.x - hex.x;
    const dy = other.y - hex.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= H_dist * 0.93 && dist <= H_dist * 1.07) {
      neighbors.push(other);
    }
  }

  // 8-player slot-based neighborhood adjacency connections:
  if (playerCount === 8) {
    const extraAdjacencyMap8 = {
      'ring-1-neg15': ['ring-1-pos05'],
      'ring-1-pos05': ['ring-1-neg15', 'ring-2-neg1'],
      'ring-2-neg1': ['ring-1-pos05'],
      'ring-2-0': ['ring-4-pos1'],
      'ring-2-pos1': ['ring-4-pos1'],
      'ring-4-pos1': ['ring-2-0', 'ring-2-pos1'],
      'ring-neg1-neg05': ['ring-neg1-pos15', 'ring-neg2-pos1'],
      'ring-neg1-pos15': ['ring-neg1-neg05'],
      'ring-neg2-pos1': ['ring-neg1-neg05'],
      'ring-neg2-neg1': ['ring-neg4-neg1'],
      'ring-neg2-0': ['ring-neg4-neg1'],
      'ring-neg4-neg1': ['ring-neg2-neg1', 'ring-neg2-0'],
    };

    const extras = extraAdjacencyMap8[hex.id];
    if (extras) {
      extras.forEach(extraId => {
        if (!neighbors.some(n => n.id === extraId)) {
          const target = allHexes.find(h => h.id === extraId);
          if (target) neighbors.push(target);
        }
      });
    }
  }

  // 7-player slot-based neighborhood adjacency connections:
  if (playerCount === 7) {
    const extraAdjacencyMap7 = {
      'ring-1-neg35': ['ring-2-neg2', 'ring-1-neg15'],
      'ring-2-neg2': ['ring-1-neg35'],
      'ring-1-neg15': ['ring-0-neg3', 'ring-1-neg35'],
      'ring-0-neg3': ['ring-1-neg15'],
      'ring-1-neg05': ['ring-0-neg2'],
      'ring-0-neg2': ['ring-1-neg05'],
      'ring-neg2-neg1': ['ring-neg4-neg1'],
      'ring-neg4-neg1': ['ring-neg2-0', 'ring-neg2-neg1'],
      'ring-neg2-0': ['ring-neg4-neg1'],
      'ring-neg1-neg05': ['ring-neg2-pos1', 'ring-neg1-pos15'],
      'ring-neg2-pos1': ['ring-neg1-neg05'],
      'ring-neg1-pos15': ['ring-neg1-neg05'],
      'ring-1-pos05': ['ring-0-pos2'],
      'ring-0-pos2': ['ring-1-pos05'],
      'ring-1-pos15': ['ring-0-pos3', 'ring-1-pos35'],
      'ring-0-pos3': ['ring-1-pos15'],
      'ring-1-pos35': ['ring-1-pos15', 'ring-2-pos2'],
      'ring-2-pos2': ['ring-1-pos35'],
    };

    const extras = extraAdjacencyMap7[hex.id];
    if (extras) {
      extras.forEach(extraId => {
        if (!neighbors.some(n => n.id === extraId)) {
          const target = allHexes.find(h => h.id === extraId);
          if (target) neighbors.push(target);
        }
      });
    }
  }

  // 5-player hyperlane connections:
  // 1: ring1-1 (South-West ring 1)
  // 2: ring1-5 (South-East ring 1)
  // 3: ring2-corner-5 (South-East ring 2)
  // 4: ring3-edge-5-1 (South-East ring 3 edge)
  // 5: ring3-edge-0-2 (South-West ring 3 edge)
  // 6: ring2-corner-1 (South-West ring 2)
  // 7: ring2-corner-0 (South ring 2 corner)
  if (playerCount === 5) {
    const extraAdjacencyMap = {
      // 1 is adjacent to 2 and 7
      'ring1-1': ['ring1-5', 'ring2-corner-0'],
      // 2 is adjacent to 1 and 7
      'ring1-5': ['ring1-1', 'ring2-corner-0'],
      // 7 is adjacent to 1, 2, 3, 4, 5, 6
      'ring2-corner-0': [
        'ring1-1',
        'ring1-5',
        'ring2-corner-5',
        'ring3-edge-5-1',
        'ring3-edge-0-2',
        'ring2-corner-1'
      ],
      // 3 is adjacent to 7
      'ring2-corner-5': ['ring2-corner-0'],
      // 4 is adjacent to 7 and 5
      'ring3-edge-5-1': ['ring2-corner-0', 'ring3-edge-0-2'],
      // 5 is adjacent to 7 and 4
      'ring3-edge-0-2': ['ring2-corner-0', 'ring3-edge-5-1'],
      // 6 is adjacent to 7
      'ring2-corner-1': ['ring2-corner-0']
    };

    const extras = extraAdjacencyMap[hex.id];
    if (extras) {
      extras.forEach(extraId => {
        if (!neighbors.some(n => n.id === extraId)) {
          const target = allHexes.find(h => h.id === extraId);
          if (target) neighbors.push(target);
        }
      });
    }
  }

  if (playerCount === 4) {
    // 4-player hyperlane adjacency map (supports both South and North hyperlane corridors)
    const extraAdjacencyMap4 = {
      // South corridor (d = 0)
      'ring1-0': ['ring1-1', 'ring1-5', 'ring2-corner-0'],
      'ring1-1': ['ring1-0', 'ring1-5', 'ring2-corner-0'],
      'ring1-5': ['ring1-0', 'ring1-1', 'ring2-corner-0'],
      'ring2-corner-0': [
        'ring1-0',
        'ring1-1',
        'ring1-5',
        'ring2-corner-5',
        'ring3-edge-5-1',
        'ring3-edge-0-2',
        'ring2-corner-1'
      ],
      'ring2-corner-5': ['ring2-corner-0'],
      'ring3-edge-5-1': ['ring2-corner-0', 'ring3-edge-0-2'],
      'ring3-edge-0-2': ['ring2-corner-0', 'ring3-edge-5-1'],
      'ring2-corner-1': ['ring2-corner-0'],

      // North corridor (d = 3) - ring1-3, ring1-2, ring1-4 connected through hyperlane/corner-3
      'ring1-3': ['ring1-2', 'ring1-4', 'ring2-corner-3'],
      'ring1-2': ['ring1-3', 'ring1-4', 'ring2-corner-3'],
      'ring1-4': ['ring1-3', 'ring1-2', 'ring2-corner-3'],
      'ring2-corner-3': [
        'ring1-3',
        'ring1-2',
        'ring1-4',
        'ring2-corner-2',
        'ring3-edge-2-2',
        'ring3-edge-3-1',
        'ring3-edge-3-2',
        'ring2-corner-4'
      ],
      'ring2-corner-2': ['ring2-corner-3'],
      'ring3-edge-2-2': ['ring2-corner-3', 'ring3-edge-3-1', 'ring3-edge-3-2'],
      'ring3-edge-3-1': ['ring2-corner-3', 'ring3-edge-2-2', 'ring3-edge-3-2'],
      'ring3-edge-3-2': ['ring2-corner-3', 'ring3-edge-2-2', 'ring3-edge-3-1'],
      'ring2-corner-4': ['ring2-corner-3']
    };

    const extras = extraAdjacencyMap4[hex.id];
    if (extras) {
      extras.forEach(extraId => {
        if (!neighbors.some(n => n.id === extraId)) {
          const target = allHexes.find(h => h.id === extraId);
          if (target) neighbors.push(target);
        }
      });
    }
  }

  return neighbors;
}

export function getCurrentActiveRing(placedTiles = {}, allHexes = ALL_37_HEXES, playerCount = 6) {
  if (playerCount === 8 || playerCount === 7) {
    const ring1Hexes = allHexes.filter(h => h.ring === 1 && h.type === 'ring_system');
    const ring1Filled = ring1Hexes.every(h => placedTiles[h.id]);
    if (!ring1Filled) return 1;

    const ring2Hexes = allHexes.filter(h => h.ring === 2 && h.type === 'ring_system');
    const ring2Filled = ring2Hexes.every(h => placedTiles[h.id]);
    if (!ring2Filled) return 2;

    const ring3Hexes = allHexes.filter(h => h.ring === 3 && h.type === 'ring_system');
    const ring3Filled = ring3Hexes.every(h => placedTiles[h.id]);
    if (!ring3Filled) return 3;

    return 3;
  }

  const ring1Hexes = allHexes.filter(h => h.ring === 1);
  const ring1Filled = ring1Hexes.every(h => placedTiles[h.id]);
  if (!ring1Filled) return 1;

  const ring2Hexes = allHexes.filter(h => h.ring === 2);
  const ring2Filled = ring2Hexes.every(h => placedTiles[h.id]);
  if (!ring2Filled) return 2;

  const ring3EdgeHexes = allHexes.filter(h => h.ring === 3 && h.type === 'ring3');
  const ring3Filled = ring3EdgeHexes.every(h => placedTiles[h.id]);
  if (!ring3Filled) return 3;

  return 3;
}

export function checkTileViolations(placedTiles = {}, hex, tileId, allHexes = ALL_37_HEXES, playerCount = 6) {
  const neighbors = getHexNeighbors(hex, allHexes, playerCount);
  const tileAnomaly = isAnomaly(tileId);
  const tileWh = getWormholeType(tileId);

  let anomalyViolation = false;
  let alphaViolation = false;
  let betaViolation = false;

  for (const n of neighbors) {
    const placed = placedTiles[n.id];
    if (placed && !placed.isHyperlane) {
      const neighborTileId = placed.tileId;
      if (tileAnomaly && isAnomaly(neighborTileId)) {
        anomalyViolation = true;
      }
      if (tileWh === 'alpha' && getWormholeType(neighborTileId) === 'alpha') {
        alphaViolation = true;
      }
      if (tileWh === 'beta' && getWormholeType(neighborTileId) === 'beta') {
        betaViolation = true;
      }
    }
  }

  return {
    hasViolation: anomalyViolation || alphaViolation || betaViolation,
    anomalyViolation,
    alphaViolation,
    betaViolation
  };
}

export function validatePlacement(placedTiles = {}, targetHex, tileId, activeRing, allHexes = ALL_37_HEXES, player = null, playerCount = 6) {
  if (!targetHex) {
    return { allowed: false, reason: 'Invalid target hex' };
  }

  if (placedTiles[targetHex.id]) {
    return { allowed: false, reason: 'Hex is already occupied' };
  }

  if (playerCount === 8 || playerCount === 7) {
    if (targetHex.ring !== activeRing || targetHex.type !== 'ring_system') {
      return { allowed: false, reason: `Must place in Ring ${activeRing} first` };
    }
  } else {
    if (targetHex.ring !== activeRing || (targetHex.ring === 3 && targetHex.type !== 'ring3')) {
      return { allowed: false, reason: `Must place in Ring ${activeRing} first` };
    }
  }

  const tileNum = Number(tileId);
  const violations = checkTileViolations(placedTiles, targetHex, tileNum, allHexes, playerCount);

  if (!violations.hasViolation) {
    return { allowed: true, forced: false, reason: 'Valid placement' };
  }

  // Determine available empty hexes in the current active ring
  const emptyHexesInRing = allHexes.filter(h => {
    if (h.ring !== activeRing) return false;
    if ((playerCount === 8 || playerCount === 7) && h.type !== 'ring_system') return false;
    if (playerCount !== 8 && playerCount !== 7 && activeRing === 3 && h.type !== 'ring3') return false;
    return !placedTiles[h.id];
  });

  // Forced placement rule (TI4 Bag Draft):
  // A placement that violates adjacency rules (anomaly next to anomaly, or matching wormholes)
  // is ONLY allowed if the player has NO legal placement available at all (i.e. every tile remaining
  // in the player's hand violates rules on every available empty hex in the current active ring).
  let handTiles = [];
  if (player && player.hand) {
    handTiles = [...(player.hand.blue || []), ...(player.hand.red || [])];
  }

  let canForce = false;

  if (handTiles.length > 0) {
    // Check if there is ANY legal placement for ANY tile in the player's hand on ANY empty hex in the ring
    const hasAnyLegalMove = handTiles.some(t => {
      const tNum = Number(t);
      return emptyHexesInRing.some(emptyHex => {
        const v = checkTileViolations(placedTiles, emptyHex, tNum, allHexes, playerCount);
        return !v.hasViolation;
      });
    });

    // Forced placement triggers IF AND ONLY IF no legal move exists anywhere for this player
    canForce = !hasAnyLegalMove;
  } else {
    // Fallback if player or player hand is not provided:
    // Check if this specific tile can be legally placed on ANY empty hex in the ring
    const anyLegalHexExists = emptyHexesInRing.some(emptyHex => {
      const v = checkTileViolations(placedTiles, emptyHex, tileNum, allHexes, playerCount);
      return !v.hasViolation;
    });
    canForce = !anyLegalHexExists;
  }

  if (!canForce) {
    let reason = 'Cannot place ';
    if (violations.anomalyViolation) reason += 'anomaly adjacent to anomaly';
    else if (violations.alphaViolation) reason += 'Alpha wormhole adjacent to Alpha wormhole';
    else if (violations.betaViolation) reason += 'Beta wormhole adjacent to Beta wormhole';
    return { allowed: false, reason };
  } else {
    return { allowed: true, forced: true, reason: 'Forced placement (no legal placement available)' };
  }
}

export function getPlayerForTurn(players, turnIndex) {
  if (!players || players.length === 0) return null;
  const n = players.length;
  const round = Math.floor(turnIndex / n);
  const posInRound = turnIndex % n;
  const actualIndex = (round % 2 === 0) ? posInRound : (n - 1 - posInRound);
  return players[actualIndex];
}
