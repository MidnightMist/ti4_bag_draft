import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_ROOMS_DIR = path.resolve(REPO_ROOT, 'rooms_data');
const configuredRoomsDir = process.env.ROOMS_DATA_DIR?.trim();
const ROOMS_DIR = configuredRoomsDir
  ? (path.isAbsolute(configuredRoomsDir)
      ? path.resolve(configuredRoomsDir)
      : path.resolve(REPO_ROOT, configuredRoomsDir))
  : DEFAULT_ROOMS_DIR;

const ROOM_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const CURRENT_SCHEMA_VERSION = 1;

const rooms = new Map();

export function isValidRoomId(roomId) {
  return typeof roomId === 'string' && ROOM_ID_PATTERN.test(roomId);
}

function getRoomFilePath(roomId) {
  if (!isValidRoomId(roomId)) {
    return null;
  }
  const resolved = path.resolve(ROOMS_DIR, `${roomId}.json`);
  const basePrefix = ROOMS_DIR.endsWith(path.sep) ? ROOMS_DIR : `${ROOMS_DIR}${path.sep}`;
  if (!resolved.startsWith(basePrefix)) {
    return null;
  }
  return resolved;
}

function ensureStorageDir() {
  if (!fs.existsSync(ROOMS_DIR)) {
    fs.mkdirSync(ROOMS_DIR, { recursive: true });
  }
}

/**
 * Normalize loaded room data so rooms saved before code updates remain compatible.
 */
export function normalizeRoomData(raw) {
  if (!raw || typeof raw !== 'object' || !isValidRoomId(raw.id)) {
    return null;
  }

  const players = Array.isArray(raw.players) ? raw.players : [];
  const settings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  const mapState = raw.mapState && typeof raw.mapState === 'object' ? raw.mapState : {};

  const normalized = {
    ...raw,
    schemaVersion: raw.schemaVersion || CURRENT_SCHEMA_VERSION,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
    status: raw.status || 'lobby',
    settings: {
      gameMode: settings.gameMode || 'map',
      playerCount: settings.playerCount || players.length || 6,
      expansions: settings.expansions || { pok: true, thundersEdge: true },
      tileMode: settings.tileMode || 'balanced',
      balanceTiers: settings.balanceTiers ?? null,
      selectedFactions: Array.isArray(settings.selectedFactions) ? settings.selectedFactions : [],
    },
    players: players.map((p, idx) => ({
      ...p,
      slotId: typeof p.slotId === 'number' ? p.slotId : idx,
      name: p.name || `Player ${idx + 1}`,
      claimedBy: p.claimedBy ?? null,
      claimedAt: p.claimedAt ?? null,
      isSpeaker: Boolean(p.isSpeaker),
    })),
    mapState: {
      placedTiles: mapState.placedTiles && typeof mapState.placedTiles === 'object' ? mapState.placedTiles : {},
      speakerSlotId: mapState.speakerSlotId ?? null,
      currentTurnIndex: typeof mapState.currentTurnIndex === 'number' ? mapState.currentTurnIndex : 0,
    },
  };

  if (normalized.status === 'faction_selection' && !normalized.factionSelection) {
    normalized.factionSelection = { currentTurnIndex: 0 };
  }

  if (normalized.draftState && typeof normalized.draftState === 'object') {
    normalized.draftState = {
      roundIndex: normalized.draftState.roundIndex || 0,
      hands: Array.isArray(normalized.draftState.hands) ? normalized.draftState.hands : [],
      pendingSelections:
        normalized.draftState.pendingSelections && typeof normalized.draftState.pendingSelections === 'object'
          ? normalized.draftState.pendingSelections
          : {},
      consecutivePassRounds: normalized.draftState.consecutivePassRounds || 0,
    };
  }

  return normalized;
}

export function saveRoom(room) {
  if (!room || !isValidRoomId(room.id)) {
    return false;
  }

  const filePath = getRoomFilePath(room.id);
  if (!filePath) {
    return false;
  }

  try {
    ensureStorageDir();
    room.schemaVersion = CURRENT_SCHEMA_VERSION;
    room.updatedAt = Date.now();
    rooms.set(room.id, room);

    const tmpPath = `${filePath}.${process.pid}.tmp`;
    const serialized = JSON.stringify(room);
    fs.writeFileSync(tmpPath, serialized, 'utf8');
    fs.renameSync(tmpPath, filePath);
    return true;
  } catch (err) {
    console.error(`[RoomStore] Failed to persist room ${room.id}:`, err);
    return false;
  }
}

export function loadRoomFromDisk(roomId) {
  const filePath = getRoomFilePath(roomId);
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  try {
    const rawText = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(rawText);
    const normalized = normalizeRoomData(parsed);
    if (!normalized) {
      return null;
    }
    rooms.set(normalized.id, normalized);
    return normalized;
  } catch (err) {
    console.error(`[RoomStore] Failed to load room ${roomId} from disk:`, err);
    return null;
  }
}

export function getRoom(roomId) {
  if (!isValidRoomId(roomId)) {
    return undefined;
  }
  const existing = rooms.get(roomId);
  if (existing) {
    return existing;
  }
  const loaded = loadRoomFromDisk(roomId);
  return loaded || undefined;
}

export function setRoom(roomId, roomData) {
  if (!isValidRoomId(roomId) || !roomData) {
    return;
  }
  rooms.set(roomId, roomData);
  saveRoom(roomData);
}

export function initRoomStore() {
  ensureStorageDir();
  let loadedCount = 0;

  try {
    const entries = fs.readdirSync(ROOMS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) {
        continue;
      }
      const roomId = entry.name.slice(0, -'.json'.length);
      if (!isValidRoomId(roomId)) {
        continue;
      }
      const room = loadRoomFromDisk(roomId);
      if (room) {
        loadedCount += 1;
      }
    }
    console.log(`[RoomStore] Loaded ${loadedCount} persisted room(s) from ${ROOMS_DIR}`);
  } catch (err) {
    console.error('[RoomStore] Error initializing room storage:', err);
  }

  return loadedCount;
}
