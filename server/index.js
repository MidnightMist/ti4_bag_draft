import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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

// REST API for room creation and querying
app.post('/api/rooms', (req, res) => {
  const {
    playerCount = 6,
    playerNames = [],
    expansions = { pok: true, thundersEdge: false },
    tileMode = 'balanced', // 'random' | 'balanced'
    balanceTiers = {
      tier1: [],
      tier2: [],
      tier3: []
    }
  } = req.body;

  const count = Math.min(Math.max(parseInt(playerCount, 10) || 6, 3), 8);
  const formattedPlayers = [];
  for (let i = 0; i < count; i++) {
    const defaultName = `Игрок ${i + 1}`;
    const name = (playerNames[i] && playerNames[i].trim()) ? playerNames[i].trim() : defaultName;
    formattedPlayers.push({
      slotId: i,
      name,
      claimedBy: null, // userId if claimed
      claimedAt: null,
      isSpeaker: false
    });
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
      balanceTiers
    },
    players: formattedPlayers,
    mapState: {
      placedTiles: {}, // index/coord -> tile
      speakerSlotId: null
    }
  };

  rooms.set(roomId, roomData);
  res.json({ success: true, roomId, room: roomData });
});

app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({ room });
});

// Socket.io for real-time room and claim synchronization
io.on('connection', (socket) => {
  let currentRoomId = null;
  let currentUserId = null;

  socket.on('join_room', ({ roomId, userId }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('room_error', { message: 'Комната не найдена' });
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
      socket.emit('room_error', { message: 'Комната не найдена' });
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
      socket.emit('room_error', { message: 'Слот не найден' });
      return;
    }

    if (targetSlot.claimedBy && targetSlot.claimedBy !== userId) {
      socket.emit('room_error', { message: 'Этот слот уже занят другим игроком' });
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

  socket.on('disconnect', () => {
    // We intentionally keep user claim intact across temporary refreshes via userId/localStorage
  });
});

const PORT = 3000;

const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(clientDist, 'index.html'));
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

