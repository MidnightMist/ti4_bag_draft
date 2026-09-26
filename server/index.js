import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import { DEFAULT_BLUE_TILES, getDefaultTiersForExpansions } from './data/blueTiles.js';
import { validateBlueTiers } from './data/tierValidator.js';
import { getMecatolTileId, getActiveBlueTiles, getActiveRedTiles, ALL_37_HEXES, getActiveHexes, FIVE_PLAYER_HYPERLANES, FOUR_PLAYER_HYPERLANES, getCurrentActiveRing, validatePlacement, getPlayerForTurn } from './data/tileData.js';

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
  dealPlayerHands(room);
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
      balanceTiers = null
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
    const initialPlacedTiles = count === 5 ? { ...FIVE_PLAYER_HYPERLANES } : count === 4 ? { ...FOUR_PLAYER_HYPERLANES } : {};

    const roomData = {
      id: roomId,
      createdAt: Date.now(),
      status: 'lobby', // 'lobby' | 'map_building' | 'completed'
      settings: {
        playerCount: count,
        expansions,
        tileMode,
        balanceTiers: normalizedTiers
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
      startMapBuilding(room);
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
      if (room.status === 'map_building') {
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
    if (allClaimed && room.status === 'lobby') {
      startMapBuilding(room);
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

    const activeRing = getCurrentActiveRing(room.mapState.placedTiles, activeHexes);
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

    const tilesPerPlayer = (room.settings?.playerCount === 3 || room.players.length === 3) ? 8 : 5;
    const totalTilesToPlace = room.players.length * tilesPerPlayer;
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

    const tilesPerPlayer = playerCount === 3 ? 8 : 5;
    room.mapState.currentTurnIndex = room.players.length * tilesPerPlayer;
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
    const resetPlacedTiles = playerCount === 5 ? { ...FIVE_PLAYER_HYPERLANES } : playerCount === 4 ? { ...FOUR_PLAYER_HYPERLANES } : {};
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
if (fs.existsSync(clientTiles)) {
  app.use('/tiles', express.static(clientTiles));
}
const rootTiles = path.resolve(__dirname, '../tiles');
if (fs.existsSync(rootTiles)) {
  app.use('/tiles', express.static(rootTiles));
}

const clientDist = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientDist, 'index.html'));
  });
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

