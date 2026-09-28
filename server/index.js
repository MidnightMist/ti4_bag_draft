import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import { DEFAULT_BLUE_TILES, getDefaultTiersForExpansions } from './data/blueTiles.js';
import { validateBlueTiers } from './data/tierValidator.js';
import { getMecatolTileId, getActiveBlueTiles, getActiveRedTiles, isAnomaly, isRedTile, ALL_37_HEXES, getActiveHexes, FIVE_PLAYER_HYPERLANES, FOUR_PLAYER_HYPERLANES, SEVEN_PLAYER_HYPERLANES, EIGHT_PLAYER_HYPERLANES, getCurrentActiveRing, validatePlacement, getPlayerForTurn } from './data/tileData.js';
import { FACTIONS } from './data/factionsData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// In-memory room store: roomId -> RoomState
const rooms = new Map();

function generateRoomId() {
  return crypto.randomBytes(4).toString('hex'); // 8-char hex code (e.g. "a3f89b1c")
}

/**
 * Shuffle helper (Fisher-Yates)
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Transition room to map_building: randomize player seating order, pick random speaker, deal hands.
 */
function startMapBuilding(room) {
  room.status = 'map_building';
  
  // Pick random speaker among all players
  const speakerIndex = Math.floor(Math.random() * room.players.length);
  const speakerPlayer = room.players[speakerIndex];

  // Randomize seating order of other players relative to each other
  const otherPlayers = room.players.filter((_, idx) => idx !== speakerIndex);
  const shuffledOthers = shuffle(otherPlayers);

  // Speaker is first (index 0), followed by randomly ordered other players
  room.players = [speakerPlayer, ...shuffledOthers];

  // Assign speaker flag and mapState speakerSlotId
  room.players.forEach((p, idx) => {
    p.isSpeaker = (idx === 0);
  });
  room.mapState.speakerSlotId = room.players[0].slotId;

  if (room.settings?.gameMode === 'draft') {
    room.players.forEach(p => {
      const picked = p.pickedItems?.tiles || [];
      const blue = picked.filter(t => !isRedTile(t));
      const red = picked.filter(t => isRedTile(t));
      p.hand = { blue, red };
      p.remainingBlue = blue.length;
      p.remainingRed = red.length;
    });
  } else {
    dealPlayerHands(room);
  }
}

function startFactionBan(room) {
  room.status = 'faction_ban';
  // Randomize player seating order relative to each other for the draft
  room.players = shuffle(room.players);
  // Ensure no speaker is assigned during the draft phase
  room.players.forEach((p) => {
    p.isSpeaker = false;
  });
  room.mapState.speakerSlotId = null;

  const selectedFactionIds = (room.settings.selectedFactions && room.settings.selectedFactions.length >= room.players.length * 3)
    ? [...room.settings.selectedFactions]
    : FACTIONS.map(f => f.id);

  // Shuffle pool once so every player receives a strictly unique set of 3 factions without any duplicates
  const shuffledFactions = shuffle(selectedFactionIds);

  room.players.forEach((p, idx) => {
    // Deal 3 unique factions to each player from the shared shuffled pool
    p.banPool = shuffledFactions.slice(idx * 3, (idx + 1) * 3);
    p.bannedFactionId = null;
    p.hasBanned = false;
  });

  if (room.players.every(p => p.hasBanned)) {
    startDraftingPhase(room);
  }
}

function startDraftingPhase(room) {
  room.status = 'drafting';

  // 1. Gather all non-banned factions from players' ban pools into a shared pool
  const keptFactions = [];
  room.players.forEach(p => {
    (p.banPool || []).forEach(fId => {
      if (fId !== p.bannedFactionId) {
        keptFactions.push(fId);
      }
    });
  });

  // Shuffle the kept factions to deal 2 random factions to each player without duplicates
  const shuffledDraftFactions = shuffle(keptFactions);

  // 2. Deal tiles (3 Blue: 1 Tier 1, 1 Tier 2, 1 Tier 3; 2 Red)
  const expansions = room.settings.expansions;
  const mecatolId = getMecatolTileId(expansions);
  const isBalanced = room.settings.tileMode === 'balanced';
  const playerCount = room.settings.playerCount || room.players.length;

  const redPool = shuffle(getActiveRedTiles(expansions));

  let t1 = [], t2 = [], t3 = [], bluePool = [];
  if (isBalanced) {
    const tiers = room.settings.balanceTiers || getDefaultTiersForExpansions(expansions);
    t1 = shuffle((tiers.tier1 || []).filter(id => id !== mecatolId));
    t2 = shuffle((tiers.tier2 || []).filter(id => id !== mecatolId));
    t3 = shuffle((tiers.tier3 || []).filter(id => id !== mecatolId));
  } else {
    bluePool = shuffle(getActiveBlueTiles(expansions).filter(id => id !== mecatolId));
  }

  // 3. Initialize each player's draft state
  room.players.forEach((p, idx) => {
    // Deal tiles
    const pBlue = [];
    if (isBalanced) {
      const blueCountPerTier = playerCount === 3 ? 2 : 1;
      for (let i = 0; i < blueCountPerTier; i++) {
        if (t1.length > 0) pBlue.push(t1.pop());
        if (t2.length > 0) pBlue.push(t2.pop());
        if (t3.length > 0) pBlue.push(t3.pop());
      }
    } else {
      const blueLimit = playerCount === 3 ? 6 : 3;
      for (let i = 0; i < blueLimit; i++) {
        if (bluePool.length > 0) pBlue.push(bluePool.pop());
      }
    }

    const pRed = [];
    for (let i = 0; i < 2; i++) {
      if (redPool.length > 0) pRed.push(redPool.pop());
    }

    // Deal 2 random factions from the remaining post-ban pool
    const pFactions = [shuffledDraftFactions[idx * 2], shuffledDraftFactions[idx * 2 + 1]].filter(Boolean);

    // Initial 2 factions that the player saw during their ban phase
    const banSeenFactions = (p.banPool || []).filter(fId => fId !== p.bannedFactionId);

    // Draft Hand (what the player currently holds in their hand to choose from)
    p.draftHand = {
      tiles: [...pBlue, ...pRed],
      factions: pFactions,
    };

    // Seen items accumulator (initially has the 2 factions from ban phase + 5 tiles & 2 factions dealt now)
    const initialSeenFactions = Array.from(new Set([...banSeenFactions, ...pFactions]));
    const initialSeenTiles = Array.from(new Set([...pBlue, ...pRed]));

    p.seenItems = {
      tiles: initialSeenTiles,
      factions: initialSeenFactions,
    };

    // Picked items accumulator (items chosen by player so far during draft)
    p.pickedItems = {
      tiles: [],
      factions: [],
    };

    // Number of draft picks completed
    p.draftPicksCount = 0;
  });

  // Initialize circular draft queue state
  // Each player holds a hand of items to pick from. Initially each player has their dealt hand.
  // We track round index (0 to 6 total picks needed: 3 blue tiles, 2 red tiles, 2 factions)
  room.draftState = {
    roundIndex: 0,
    hands: room.players.map(p => ({
      slotId: p.slotId,
      tiles: [...p.draftHand.tiles],
      factions: [...p.draftHand.factions],
    })),
    // pendingSelections stores each player's selection for the current round before passing
    pendingSelections: {},
  };
}

/**
 * Deal 3 Blue and 2 Red tiles to each player in the room.
 * Balanced mode: 1 Tier 1 + 1 Tier 2 + 1 Tier 3 blue tiles, plus 2 red tiles.
 * Random mode: 3 random blue tiles + 2 red tiles.
 */
function dealPlayerHands(room) {
  if (!room || !room.players || room.players.length === 0) return;
  const expansions = room.settings.expansions;
  const mecatolId = getMecatolTileId(expansions);
  const isBalanced = room.settings.tileMode === 'balanced';
  const playerCount = room.settings.playerCount || room.players.length;

  // Red tiles pool (excluding any invalid)
  const redPool = shuffle(getActiveRedTiles(expansions));

  if (isBalanced) {
    const tiers = room.settings.balanceTiers || getDefaultTiersForExpansions(expansions);
    const t1 = shuffle((tiers.tier1 || []).filter(id => id !== mecatolId));
    const t2 = shuffle((tiers.tier2 || []).filter(id => id !== mecatolId));
    const t3 = shuffle((tiers.tier3 || []).filter(id => id !== mecatolId));

    room.players.forEach((p) => {
      const pBlue = [];
      const blueCountPerTier = playerCount === 3 ? 2 : 1;
      for (let i = 0; i < blueCountPerTier; i++) {
        if (t1.length > 0) pBlue.push(t1.pop());
        if (t2.length > 0) pBlue.push(t2.pop());
        if (t3.length > 0) pBlue.push(t3.pop());
      }

      const pRed = [];
      for (let i = 0; i < 2; i++) {
        if (redPool.length > 0) pRed.push(redPool.pop());
      }

      p.hand = {
        blue: pBlue,
        red: pRed
      };
      p.remainingBlue = pBlue.length;
      p.remainingRed = pRed.length;
    });
  } else {
    const bluePool = shuffle(getActiveBlueTiles(expansions).filter(id => id !== mecatolId));
    room.players.forEach((p) => {
      const pBlue = [];
      const blueLimit = playerCount === 3 ? 6 : 3;
      for (let i = 0; i < blueLimit; i++) {
        if (bluePool.length > 0) pBlue.push(bluePool.pop());
      }
      const pRed = [];
      for (let i = 0; i < 2; i++) {
        if (redPool.length > 0) pRed.push(redPool.pop());
      }

      p.hand = {
        blue: pBlue,
        red: pRed
      };
      p.remainingBlue = pBlue.length;
      p.remainingRed = pRed.length;
    });
  }
}

// REST API for room creation and querying
app.post('/api/rooms', (req, res) => {
  try {
    const {
      playerCount = 6,
      playerNames = [],
      expansions = { pok: true, thundersEdge: true },
      tileMode = 'balanced', // 'random' | 'balanced'
      balanceTiers = null,
      gameMode = 'map', // 'map' | 'draft'
      selectedFactions = []
    } = req.body;

    const count = Math.min(Math.max(parseInt(playerCount, 10) || 6, 3), 8);
    const formattedPlayers = [];
    for (let i = 0; i < count; i++) {
      const defaultName = `Player ${i + 1}`;
      const name = (playerNames[i] && playerNames[i].trim()) ? playerNames[i].trim() : defaultName;
      formattedPlayers.push({
        slotId: i,
        name,
        claimedBy: null, // userId if claimed
        claimedAt: null,
        isSpeaker: false
      });
    }

    let normalizedTiers = getDefaultTiersForExpansions(expansions);

    if (tileMode === 'balanced') {
      if (balanceTiers) {
        const validation = validateBlueTiers(balanceTiers, expansions);
        if (!validation.isValid) {
          return res.status(400).json({ error: validation.error });
        }
        normalizedTiers = validation.parsed;
      }
    }

    const roomId = generateRoomId();
    const initialPlacedTiles = count === 8 ? { ...EIGHT_PLAYER_HYPERLANES } : count === 7 ? { ...SEVEN_PLAYER_HYPERLANES } : count === 5 ? { ...FIVE_PLAYER_HYPERLANES } : count === 4 ? { ...FOUR_PLAYER_HYPERLANES } : {};

    const roomData = {
      id: roomId,
      createdAt: Date.now(),
      status: 'lobby', // 'lobby' | 'map_building' | 'completed'
      settings: {
        gameMode,
        playerCount: count,
        expansions,
        tileMode,
        balanceTiers: normalizedTiers,
        selectedFactions
      },
      players: formattedPlayers,
      mapState: {
        placedTiles: initialPlacedTiles, // index/coord -> tile
        speakerSlotId: null,
        currentTurnIndex: 0
      }
    };

    rooms.set(roomId, roomData);
    console.log(`[Room Created] Room ID: ${roomId}, Players: ${count}, Mode: ${tileMode}`);
    res.json({ success: true, roomId, room: roomData });
  } catch (err) {
    console.error('[Error creating room]:', err);
    res.status(500).json({ error: err.message || 'Internal server error while creating room' });
  }
});

app.get('/api/rooms/:id', (req, res) => {
  try {
    const room = rooms.get(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    // Auto-deal if already in map_building but hands missing
    if (room.status === 'map_building' && room.players.some(p => !p.hand)) {
      dealPlayerHands(room);
    }
    res.json({ room });
  } catch (err) {
    console.error('[Error fetching room]:', err);
    res.status(500).json({ error: err.message || 'Internal server error while fetching room' });
  }
});

// Socket.io for real-time room and claim synchronization
io.on('connection', (socket) => {
  let currentRoomId = null;
  let currentUserId = null;

  socket.on('join_room', ({ roomId, userId }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('room_error', { message: 'Room not found' });
      return;
    }

    currentRoomId = roomId;
    currentUserId = userId;
    socket.join(roomId);

    // Send current state
    socket.emit('room_state', room);
  });

  socket.on('claim_slot', ({ roomId, slotId, userId }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('room_error', { message: 'Room not found' });
      return;
    }

    const validUserId = (userId && typeof userId === 'string' && userId.trim() !== '' && userId !== 'null' && userId !== 'undefined')
      ? userId 
      : `user_dev_${Math.random().toString(36).substring(2, 8)}`;

    // Release any other slot claimed by validUserId
    room.players.forEach(p => {
      if (p.claimedBy === validUserId && p.slotId !== slotId) {
        p.claimedBy = null;
        p.claimedAt = null;
      }
    });

    const targetSlot = room.players.find(p => p.slotId === slotId);
    if (!targetSlot) {
      socket.emit('room_error', { message: 'Slot not found' });
      return;
    }

    if (targetSlot.claimedBy && targetSlot.claimedBy !== validUserId) {
      socket.emit('room_error', { message: 'This slot is already claimed by another player' });
      return;
    }

    // Claim slot
    targetSlot.claimedBy = validUserId;
    targetSlot.claimedAt = Date.now();

    // Check if all players are claimed
    const allClaimed = room.players.every(p => p.claimedBy !== null);
    if (allClaimed && room.status === 'lobby') {
      if (room.settings.gameMode === 'draft') {
        startFactionBan(room);
      } else {
        startMapBuilding(room);
      }
    }

    io.to(roomId).emit('room_state', room);
  });

  socket.on('unclaim_slot', ({ roomId, slotId, userId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const validUserId = (userId && typeof userId === 'string' && userId.trim() !== '' && userId !== 'null' && userId !== 'undefined') ? userId : null;
    const slot = room.players.find(p => p.slotId === slotId);
    if (slot && validUserId && slot.claimedBy === validUserId) {
      slot.claimedBy = null;
      slot.claimedAt = null;
      if (room.status === 'map_building' || room.status === 'faction_ban') {
        room.status = 'lobby';
        room.players.sort((a, b) => a.slotId - b.slotId);
      }
      io.to(roomId).emit('room_state', room);
    }
  });

  // DEV TOOLBAR: Auto-fill remaining open slots with simulated players
  socket.on('dev_autofill_room', ({ roomId, currentUserId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const validUserId = (currentUserId && typeof currentUserId === 'string' && currentUserId.trim() !== '' && currentUserId !== 'null' && currentUserId !== 'undefined')
      ? currentUserId 
      : `user_dev_${Math.random().toString(36).substring(2, 8)}`;

    // Ensure validUserId has at least one claimed slot
    let userSlot = room.players.find(p => p.claimedBy === validUserId);
    if (!userSlot) {
      const firstFree = room.players.find(p => !p.claimedBy);
      if (firstFree) {
        firstFree.claimedBy = validUserId;
        firstFree.claimedAt = Date.now();
        userSlot = firstFree;
      }
    }

    // Ensure no other slot has validUserId
    room.players.forEach(p => {
      if (p.claimedBy === validUserId && p.slotId !== userSlot?.slotId) {
        p.claimedBy = null;
        p.claimedAt = null;
      }
    });

    // Auto-fill all other unassigned slots with unique bot/test IDs
    room.players.forEach((p, idx) => {
      if (!p.claimedBy) {
        p.claimedBy = `sim_bot_${room.id}_s${idx + 1}`;
        p.claimedAt = Date.now();
      }
    });

    const allClaimed = room.players.every(p => p.claimedBy !== null);
    if (allClaimed) {
      if (room.settings && room.settings.gameMode === 'draft') {
        startFactionBan(room);
      } else {
        startMapBuilding(room);
      }
    }

    io.to(roomId).emit('room_state', room);
  });

  // DEV TOOLBAR: Auto-submit bans for other players (bots) to advance to drafting phase immediately
  socket.on('dev_autoban_room', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'faction_ban') return;

    room.players.forEach(p => {
      if (!p.hasBanned && p.banPool && p.banPool.length > 0) {
        p.bannedFactionId = p.banPool[0];
        p.hasBanned = true;
      }
    });

    const allBanned = room.players.every(p => p.hasBanned);
    if (allBanned) {
      startDraftingPhase(room);
    }

    io.to(roomId).emit('room_state', room);
  });

function isPlayerDraftComplete(player, playerCount) {
  if (!player) return false;
  const maxBlue = playerCount === 3 ? 6 : 3;
  const maxRed = 2;
  const maxFactions = 2;
  const pickedTiles = player.pickedItems?.tiles || [];
  const pickedFactions = player.pickedItems?.factions || [];
  const blueCount = pickedTiles.filter(t => !isRedTile(t)).length;
  const redCount = pickedTiles.filter(t => isRedTile(t)).length;
  const factionCount = pickedFactions.length;

  return blueCount >= maxBlue && redCount >= maxRed && factionCount >= maxFactions;
}

function areAllHandsEmpty(hands) {
  if (!hands || hands.length === 0) return true;
  return hands.every(h => (!h.tiles || h.tiles.length === 0) && (!h.factions || h.factions.length === 0));
}

function advanceDraftRound(room) {
  const playerCount = room.settings?.playerCount || room.players.length;

  // 1. Ensure all selections from this round are recorded in pickedItems
  let anyItemPickedThisRound = false;
  room.players.forEach(p => {
    const pSel = room.draftState.pendingSelections[p.slotId];
    if (pSel && !pSel.isPass && pSel.itemId !== null) {
      anyItemPickedThisRound = true;
      if (pSel.itemType === 'faction') {
        if (!p.pickedItems.factions.includes(pSel.itemId)) {
          p.pickedItems.factions.push(pSel.itemId);
        }
      } else {
        const numTile = Number(pSel.itemId);
        if (!p.pickedItems.tiles.includes(numTile)) {
          p.pickedItems.tiles.push(numTile);
        }
      }
    }
    p.draftPicksCount = (p.pickedItems.tiles?.length || 0) + (p.pickedItems.factions?.length || 0);
  });

  // 2. Remove picked items from the hands that held them
  const currentHands = [...room.draftState.hands];
  room.players.forEach((p) => {
    const pSel = room.draftState.pendingSelections[p.slotId];
    const hand = currentHands.find(h => h.slotId === p.slotId);
    if (pSel && !pSel.isPass && pSel.itemId !== null && hand) {
      if (pSel.itemType === 'faction') {
        const fIdx = hand.factions.indexOf(pSel.itemId);
        if (fIdx >= 0) hand.factions.splice(fIdx, 1);
      } else {
        const numTile = Number(pSel.itemId);
        const tIdx = hand.tiles.indexOf(numTile);
        if (tIdx >= 0) hand.tiles.splice(tIdx, 1);
      }
    }
  });

  // 3. Draft ends when EVERY player has collected their full hand (or safety fallback if hands are empty/all passed)
  const allPlayersFull = room.players.every(p => isPlayerDraftComplete(p, playerCount));
  const noMoreItems = areAllHandsEmpty(currentHands);
  const allPassedThisRound = !anyItemPickedThisRound;

  if (allPlayersFull || noMoreItems || allPassedThisRound) {
    startMapBuilding(room);
    delete room.draftState;
    return;
  }

  // 4. Rotate hands clockwise (player i receives hand from player (i - 1 + N) % N)
  room.draftState.roundIndex = (room.draftState.roundIndex || 0) + 1;
  const N = room.players.length;
  const newHands = room.players.map((p, idx) => {
    const sourceIdx = (idx - 1 + N) % N;
    const sourcePlayer = room.players[sourceIdx];
    const sourceHand = currentHands.find(h => h.slotId === sourcePlayer.slotId) || currentHands[sourceIdx];
    const nextTiles = [...sourceHand.tiles];
    const nextFactions = [...sourceHand.factions];

    // Update target player's seen items
    nextFactions.forEach(fId => {
      if (!p.seenItems.factions.includes(fId)) {
        p.seenItems.factions.push(fId);
      }
    });
    nextTiles.forEach(tId => {
      if (!p.seenItems.tiles.includes(tId)) {
        p.seenItems.tiles.push(tId);
      }
    });

    return {
      slotId: p.slotId,
      tiles: nextTiles,
      factions: nextFactions,
    };
  });

  room.draftState.hands = newHands;
  room.draftState.pendingSelections = {};

  // Update each player's active draftHand
  room.players.forEach(p => {
    const h = room.draftState.hands.find(hand => hand.slotId === p.slotId);
    if (h) {
      p.draftHand = {
        tiles: [...h.tiles],
        factions: [...h.factions],
      };
    }
  });
}

  // DEV TOOLBAR: Auto-submit draft picks for remaining bots/players in the current round
  socket.on('dev_autodraft_round', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'drafting' || !room.draftState) return;

    const playerCount = room.settings?.playerCount || room.players.length;
    const maxBlue = playerCount === 3 ? 6 : 3;
    const maxRed = 2;
    const maxFactions = 2;

    room.players.forEach(player => {
      if (room.draftState.pendingSelections[player.slotId]) return;

      const playerHand = room.draftState.hands.find(h => h.slotId === player.slotId) || player.draftHand || { tiles: [], factions: [] };
      const pickedTiles = player.pickedItems?.tiles || [];
      const pickedFactions = player.pickedItems?.factions || [];
      const blueCount = pickedTiles.filter(t => !isRedTile(t)).length;
      const redCount = pickedTiles.filter(t => isRedTile(t)).length;
      const factionCount = pickedFactions.length;

      const hasBlueRoom = blueCount < maxBlue;
      const hasRedRoom = redCount < maxRed;
      const hasFactionRoom = factionCount < maxFactions;

      // Find first valid pick
      let chosenType = 'pass';
      let chosenId = null;

      if (hasFactionRoom && playerHand.factions && playerHand.factions.length > 0) {
        chosenType = 'faction';
        chosenId = playerHand.factions[0];
      } else if (playerHand.tiles && playerHand.tiles.length > 0) {
        const validTile = playerHand.tiles.find(t => {
          const isRed = isRedTile(t);
          return isRed ? hasRedRoom : hasBlueRoom;
        });
        if (validTile !== undefined) {
          chosenType = 'tile';
          chosenId = validTile;
        }
      }

      const isPass = chosenType === 'pass';
      room.draftState.pendingSelections[player.slotId] = {
        isPass,
        itemType: isPass ? null : chosenType,
        itemId: isPass ? null : (chosenType === 'tile' ? Number(chosenId) : chosenId),
      };
    });

    // Check if all submitted
    const allSubmitted = room.players.every(p => room.draftState.pendingSelections[p.slotId]);
    if (allSubmitted) {
      advanceDraftRound(room);
    }

    io.to(roomId).emit('room_state', room);
  });

  socket.on('draft_pick', ({ roomId, slotId, itemType, itemId }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'drafting') {
      socket.emit('room_error', { message: 'Room not in drafting phase' });
      return;
    }

    const player = room.players.find(p => p.slotId === slotId);
    if (!player) {
      socket.emit('room_error', { message: 'Player slot not found' });
      return;
    }

    if (!room.draftState || !room.draftState.hands) {
      socket.emit('room_error', { message: 'Draft state not initialized' });
      return;
    }

    // Check if player has already made a selection for this round
    if (room.draftState.pendingSelections[slotId]) {
      socket.emit('room_error', { message: 'You have already submitted your pick for this round' });
      return;
    }

    const playerHand = room.draftState.hands.find(h => h.slotId === slotId);
    if (!playerHand) {
      socket.emit('room_error', { message: 'Player draft hand not found' });
      return;
    }

    // Determine target item category and validate presence in current draft hand
    const numId = Number(itemId);
    let isFaction = itemType === 'faction';
    let isPass = itemType === 'pass';
    let foundInHand = false;

    if (!isPass) {
      if (isFaction) {
        foundInHand = playerHand.factions.includes(itemId) || playerHand.factions.includes(numId);
      } else {
        foundInHand = playerHand.tiles.includes(itemId) || playerHand.tiles.includes(numId);
      }
    }

    const playerCount = room.settings?.playerCount || room.players.length;
    const maxBlue = playerCount === 3 ? 6 : 3;
    const maxRed = 2;
    const maxFactions = 2;

    const pickedTiles = player.pickedItems?.tiles || [];
    const pickedFactions = player.pickedItems?.factions || [];
    const bluePickedCount = pickedTiles.filter(t => !isRedTile(t)).length;
    const redPickedCount = pickedTiles.filter(t => isRedTile(t)).length;
    const factionPickedCount = pickedFactions.length;

    // Quotas: maxBlue, 2 Red, 2 Factions
    const hasBlueRoom = bluePickedCount < maxBlue;
    const hasRedRoom = redPickedCount < maxRed;
    const hasFactionRoom = factionPickedCount < maxFactions;

    // Check if player can take any item from the offered hand
    const canTakeAnyItemInHand = (playerHand.tiles || []).some(t => {
      const isRed = isRedTile(t);
      return isRed ? hasRedRoom : hasBlueRoom;
    }) || ((playerHand.factions || []).length > 0 && hasFactionRoom);

    let isValidPick = false;

    if (isPass) {
      if (canTakeAnyItemInHand) {
        socket.emit('room_error', { message: 'Cannot pass turn when valid draft picks are available in hand' });
        return;
      }
      isValidPick = true;
    } else {
      if (!foundInHand) {
        socket.emit('room_error', { message: 'Selected item not found in your current draft hand' });
        return;
      }

      if (isFaction) {
        if (!hasFactionRoom) {
          socket.emit('room_error', { message: 'You already have your maximum 2 factions!' });
          return;
        }
        isValidPick = true;
      } else {
        const isRed = isRedTile(numId);
        if (isRed) {
          if (!hasRedRoom) {
            socket.emit('room_error', { message: 'You already have your maximum 2 red tiles!' });
            return;
          }
          isValidPick = true;
        } else {
          if (!hasBlueRoom) {
            socket.emit('room_error', { message: `You already have your maximum ${maxBlue} blue tiles!` });
            return;
          }
          isValidPick = true;
        }
      }
    }

    // Record selection for this round
    room.draftState.pendingSelections[slotId] = {
      isPass,
      itemType: isPass ? null : (isFaction ? 'faction' : 'tile'),
      itemId: isPass ? null : (isFaction ? itemId : numId),
    };

    // Immediately add the picked item to player's pickedItems so it appears in the bottom hand right away
    const sel = room.draftState.pendingSelections[slotId];
    if (sel && !sel.isPass && sel.itemId !== null) {
      if (sel.itemType === 'faction') {
        if (!player.pickedItems.factions.includes(sel.itemId)) {
          player.pickedItems.factions.push(sel.itemId);
        }
      } else {
        if (!player.pickedItems.tiles.includes(sel.itemId)) {
          player.pickedItems.tiles.push(sel.itemId);
        }
      }
    }
    player.draftPicksCount = (player.pickedItems.tiles?.length || 0) + (player.pickedItems.factions?.length || 0);

    // Check if ALL players have submitted their pending selections for this round
    const allSubmitted = room.players.every(p => room.draftState.pendingSelections[p.slotId]);

    if (allSubmitted) {
      advanceDraftRound(room);
    }

    io.to(roomId).emit('room_state', room);
  });

  socket.on('submit_faction_ban', ({ roomId, slotId, factionId }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'faction_ban') {
      socket.emit('room_error', { message: 'Room not in faction ban phase' });
      return;
    }

    const player = room.players.find(p => p.slotId === slotId);
    if (!player) {
      socket.emit('room_error', { message: 'Player slot not found' });
      return;
    }

    if (player.hasBanned) {
      socket.emit('room_error', { message: 'You have already submitted your ban' });
      return;
    }

    if (!player.banPool || !player.banPool.includes(factionId)) {
      socket.emit('room_error', { message: 'Invalid faction selected for ban' });
      return;
    }

    player.bannedFactionId = factionId;
    player.hasBanned = true;

    const allBanned = room.players.every(p => p.hasBanned);
    if (allBanned) {
      startDraftingPhase(room);
    }

    io.to(roomId).emit('room_state', room);
  });

  socket.on('place_tile', ({ roomId, slotId, tileId, hexId }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'map_building') {
      socket.emit('room_error', { message: 'Room not in map building phase' });
      return;
    }

    const currentTurnIndex = room.mapState.currentTurnIndex || 0;
    const currentTurnPlayer = getPlayerForTurn(room.players, currentTurnIndex);
    if (!currentTurnPlayer || currentTurnPlayer.slotId !== slotId) {
      socket.emit('room_error', { message: 'It is not your turn!' });
      return;
    }

    const player = room.players.find(p => p.slotId === slotId);
    if (!player || !player.hand) {
      socket.emit('room_error', { message: 'Player hand not found' });
      return;
    }

    const tileNum = Number(tileId);
    const blueIdx = player.hand.blue.indexOf(tileNum);
    const redIdx = player.hand.red.indexOf(tileNum);

    if (blueIdx === -1 && redIdx === -1) {
      socket.emit('room_error', { message: 'Tile not found in your hand' });
      return;
    }

    const playerCount = room.settings?.playerCount || room.players.length;
    const activeHexes = getActiveHexes(playerCount);
    const targetHex = activeHexes.find(h => h.id === hexId);
    if (!targetHex) {
      socket.emit('room_error', { message: 'Invalid target hex' });
      return;
    }

    const activeRing = getCurrentActiveRing(room.mapState.placedTiles, activeHexes, playerCount);
    const validation = validatePlacement(room.mapState.placedTiles, targetHex, tileNum, activeRing, activeHexes, player, playerCount);

    if (!validation.allowed) {
      socket.emit('room_error', { message: validation.reason || 'Invalid placement' });
      return;
    }

    // Apply placement
    if (blueIdx >= 0) {
      player.hand.blue.splice(blueIdx, 1);
      player.remainingBlue = player.hand.blue.length;
    } else {
      player.hand.red.splice(redIdx, 1);
      player.remainingRed = player.hand.red.length;
    }

    room.mapState.placedTiles[hexId] = {
      tileId: tileNum,
      slotId,
      type: blueIdx >= 0 ? 'blue' : 'red'
    };

    room.mapState.currentTurnIndex = currentTurnIndex + 1;

    const draftableHexes = activeHexes.filter(h => h.type !== 'center' && h.type !== 'home_system' && !h.isHyperlane);
    const totalTilesToPlace = draftableHexes.length;
    if (room.mapState.currentTurnIndex >= totalTilesToPlace) {
      room.status = 'completed';
    }

    io.to(roomId).emit('room_state', room);
  });

  // DEV TOOLBAR: Instantly complete map by placing remaining tiles
  socket.on('dev_complete_map', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'map_building') return;

    // Collect all remaining hand tiles
    const remainingHandTiles = [];
    room.players.forEach(p => {
      if (p.hand) {
        (p.hand.blue || []).forEach(t => remainingHandTiles.push({ tileId: t, slotId: p.slotId, type: 'blue' }));
        (p.hand.red || []).forEach(t => remainingHandTiles.push({ tileId: t, slotId: p.slotId, type: 'red' }));
        p.hand.blue = [];
        p.hand.red = [];
        p.remainingBlue = 0;
        p.remainingRed = 0;
      }
    });

    // Find all empty hexes in ring 1, ring 2, ring 3
    const playerCount = room.settings?.playerCount || room.players.length;
    const activeHexes = getActiveHexes(playerCount);
    const emptyHexes = activeHexes.filter(h => {
      if (h.type === 'center' || h.type === 'home_system') return false;
      return !room.mapState.placedTiles[h.id];
    });

    emptyHexes.forEach((hex, idx) => {
      if (idx < remainingHandTiles.length) {
        const item = remainingHandTiles[idx];
        room.mapState.placedTiles[hex.id] = {
          tileId: item.tileId,
          slotId: item.slotId,
          type: item.type
        };
      }
    });

    const draftableHexes = activeHexes.filter(h => h.type !== 'center' && h.type !== 'home_system' && !h.isHyperlane);
    room.mapState.currentTurnIndex = draftableHexes.length;
    room.status = 'completed';

    io.to(roomId).emit('room_state', room);
  });

  // DEV TOOLBAR: Reset room back to lobby and clear all claims
  socket.on('dev_reset_room', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const playerCount = room.settings?.playerCount || room.players.length;
    room.status = 'lobby';
    room.players.forEach(p => {
      p.claimedBy = null;
      p.claimedAt = null;
      p.isSpeaker = false;
      p.hand = null;
      p.remainingBlue = playerCount === 3 ? 6 : 3;
      p.remainingRed = 2;
    });
    room.players.sort((a, b) => a.slotId - b.slotId);
    dealPlayerHands(room);
    const resetPlacedTiles = playerCount === 8 ? { ...EIGHT_PLAYER_HYPERLANES } : playerCount === 7 ? { ...SEVEN_PLAYER_HYPERLANES } : playerCount === 5 ? { ...FIVE_PLAYER_HYPERLANES } : playerCount === 4 ? { ...FOUR_PLAYER_HYPERLANES } : {};
    room.mapState = {
      placedTiles: resetPlacedTiles,
      speakerSlotId: null,
      currentTurnIndex: 0
    };

    io.to(roomId).emit('room_state', room);
  });

  socket.on('disconnect', () => {
    // We intentionally keep user claim intact across temporary refreshes via userId/localStorage
  });
});

const PORT = process.env.PORT || 4000;

// Serve static tile images from client/public/tiles or root /tiles
const clientTiles = path.resolve(__dirname, '../client/public/tiles');
app.use('/tiles', express.static(clientTiles));
const rootTiles = path.resolve(__dirname, '../tiles');
app.use('/tiles', express.static(rootTiles));

// Serve static faction images from client/public/factions
const clientFactions = path.resolve(__dirname, '../client/public/factions');
app.use('/factions', express.static(clientFactions));

const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  const indexPath = path.resolve(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send('Application is compiling, please reload shortly.');
  }
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

