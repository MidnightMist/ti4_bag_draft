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

// 4-player seat mapping: P1 (North-East = seat 4), P2 (South-East = seat 5), P3 (South-West = seat 1), P4 (North-West = seat 2)
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
  if (playerCount === 5) {
    const pIdx = FIVE_PLAYER_SEAT_TO_PLAYER_INDEX[seatIndex];
    return pIdx !== undefined ? players[pIdx] : null;
  }
  if (playerCount === 4) {
    const pIdx = FOUR_PLAYER_SEAT_TO_PLAYER_INDEX[seatIndex];
    return pIdx !== undefined ? players[pIdx] : null;
  }
  return players[seatIndex] || null;
}

export function getSeatIndexForPlayer(playerIndex, playerCount = 6) {
  if (playerCount === 5) {
    return FIVE_PLAYER_PLAYER_TO_SEAT_INDEX[playerIndex] ?? 0;
  }
  if (playerCount === 4) {
    return FOUR_PLAYER_PLAYER_TO_SEAT_INDEX[playerIndex] ?? 0;
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

export function getCurrentActiveRing(placedTiles = {}, allHexes = ALL_37_HEXES) {
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

  if (targetHex.ring !== activeRing || (targetHex.ring === 3 && targetHex.type !== 'ring3')) {
    return { allowed: false, reason: `Must place in Ring ${activeRing} first` };
  }

  const tileNum = Number(tileId);
  const violations = checkTileViolations(placedTiles, targetHex, tileNum, allHexes, playerCount);

  if (!violations.hasViolation) {
    return { allowed: true, forced: false, reason: 'Valid placement' };
  }

  // Determine available empty hexes in the current active ring
  const emptyHexesInRing = allHexes.filter(h => {
    if (h.ring !== activeRing) return false;
    if (activeRing === 3 && h.type !== 'ring3') return false;
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
