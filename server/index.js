import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import { DEFAULT_BLUE_TILES, getDefaultTiersForExpansions } from './data/blueTiles.js';
import { validateBlueTiers } from './data/tierValidator.js';
import { getMecatolTileId, getActiveBlueTiles, getActiveRedTiles } from './data/tileData.js';

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
 * Deal 3 Blue and 2 Red tiles to each player in the room.
 * Balanced mode: 1 Tier 1 + 1 Tier 2 + 1 Tier 3 blue tiles, plus 2 red tiles.
 * Random mode: 3 random blue tiles + 2 red tiles.
 */
function dealPlayerHands(room) {
  if (!room || !room.players || room.players.length === 0) return;
  const expansions = room.settings.expansions;
  const mecatolId = getMecatolTileId(expansions);
  const isBalanced = room.settings.tileMode === 'balanced';

  // Shuffle helper (Fisher-Yates)
  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Red tiles pool (excluding any invalid)
  const redPool = shuffle(getActiveRedTiles(expansions));

  if (isBalanced) {
    const tiers = room.settings.balanceTiers || getDefaultTiersForExpansions(expansions);
    const t1 = shuffle((tiers.tier1 || []).filter(id => id !== mecatolId));
    const t2 = shuffle((tiers.tier2 || []).filter(id => id !== mecatolId));
    const t3 = shuffle((tiers.tier3 || []).filter(id => id !== mecatolId));

    room.players.forEach((p) => {
      const pBlue = [];
      if (t1.length > 0) pBlue.push(t1.pop());
      if (t2.length > 0) pBlue.push(t2.pop());
      if (t3.length > 0) pBlue.push(t3.pop());

      const pRed = [];
      if (redPool.length > 0) pRed.push(redPool.pop());
      if (redPool.length > 0) pRed.push(redPool.pop());

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
      for (let i = 0; i < 3; i++) {
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
      expansions = { pok: true, thundersEdge: false },
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
        placedTiles: {}, // index/coord -> tile
        speakerSlotId: null
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

    // Check if player already claimed another slot
    const existingSlot = room.players.find(p => p.claimedBy === userId);
    if (existingSlot && existingSlot.slotId !== slotId) {
      // Release previously claimed slot
      existingSlot.claimedBy = null;
      existingSlot.claimedAt = null;
    }

    const targetSlot = room.players.find(p => p.slotId === slotId);
    if (!targetSlot) {
      socket.emit('room_error', { message: 'Slot not found' });
      return;
    }

    if (targetSlot.claimedBy && targetSlot.claimedBy !== userId) {
      socket.emit('room_error', { message: 'This slot is already claimed by another player' });
      return;
    }

    // Claim slot
    targetSlot.claimedBy = userId;
    targetSlot.claimedAt = Date.now();

    // Check if all players are claimed
    const allClaimed = room.players.every(p => p.claimedBy !== null);
    if (allClaimed && room.status === 'lobby') {
      room.status = 'map_building';
      // Pick random speaker
      const randomSpeakerIndex = Math.floor(Math.random() * room.players.length);
      room.players.forEach((p, idx) => {
        p.isSpeaker = idx === randomSpeakerIndex;
      });
      room.mapState.speakerSlotId = room.players[randomSpeakerIndex].slotId;
      dealPlayerHands(room);
    }

    io.to(roomId).emit('room_state', room);
  });

  socket.on('unclaim_slot', ({ roomId, slotId, userId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const slot = room.players.find(p => p.slotId === slotId);
    if (slot && slot.claimedBy === userId) {
      slot.claimedBy = null;
      slot.claimedAt = null;
      if (room.status === 'map_building') {
        room.status = 'lobby';
      }
      io.to(roomId).emit('room_state', room);
    }
  });

  // DEV TOOLBAR: Auto-fill remaining open slots with simulated players
  socket.on('dev_autofill_room', ({ roomId, currentUserId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Ensure the current user has at least one claimed slot if they don't have one
    const userSlot = room.players.find(p => p.claimedBy === currentUserId);
    if (!userSlot) {
      const firstFree = room.players.find(p => !p.claimedBy);
      if (firstFree) {
        firstFree.claimedBy = currentUserId;
        firstFree.claimedAt = Date.now();
      }
    }

    // Auto-fill all other unassigned slots with bot/test IDs
    room.players.forEach((p, idx) => {
      if (!p.claimedBy) {
        p.claimedBy = `sim_bot_player_${idx + 1}`;
        p.claimedAt = Date.now();
      }
    });

    const allClaimed = room.players.every(p => p.claimedBy !== null);
    if (allClaimed && room.status === 'lobby') {
      room.status = 'map_building';
      const randomSpeakerIndex = Math.floor(Math.random() * room.players.length);
      room.players.forEach((p, idx) => {
        p.isSpeaker = idx === randomSpeakerIndex;
      });
      room.mapState.speakerSlotId = room.players[randomSpeakerIndex].slotId;
      dealPlayerHands(room);
    }

    io.to(roomId).emit('room_state', room);
  });

  // DEV TOOLBAR: Reset room back to lobby and clear all claims
  socket.on('dev_reset_room', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'lobby';
    room.players.forEach(p => {
      p.claimedBy = null;
      p.claimedAt = null;
      p.isSpeaker = false;
      p.hand = null;
      p.remainingBlue = 3;
      p.remainingRed = 2;
    });
    room.mapState = {
      placedTiles: {},
      speakerSlotId: null
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

