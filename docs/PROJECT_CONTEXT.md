# Project Context & Architecture Handover

> **Purpose:** This file captures the full project context, architectural decisions, and domain rules for the Twilight Imperium 4 (TI4) Map Generator & Draft web application before chat reset.
> **Language Rule:** All user-facing interfaces, messages, buttons, and future UI components **must be strictly in English**.

---

## 1. Project Overview & Architecture

### Stack
- **Frontend:** React 18, Vite, React Router v6, Tailwind CSS & inline component styles.
- **Backend:** Node.js, Express, Socket.IO for real-time room synchronization.
- **Persistence / State Management:**
  - In-memory `rooms` map on the server with full Socket.IO event broadcasting (`join_room`, `claim_slot`, `unclaim_slot`, `room_state`, `room_error`).
  - Client user identity using persistent `localStorage` UUID (`getOrCreateUserId`) so players can claim their slots from separate devices or refresh their browser without losing their slot.
- **Build / Dev Ports:** Port 3000 (proxied). Production build via `npm run build:client` (Vite) and `npm start` (Express serving static + Socket.IO API).

---

## 2. Core Feature: Random Map Creation (Phased Flow)

### Phase 1: Room Creation & Settings (`CreateRoom.jsx`, `/map`)
- **Player Count:** 3 to 8 players (default 6). Dynamically adjusts player name inputs.
- **Player Names:** Slot 1..N with custom names or defaults (`Player 1`, `Player 2`, etc.).
- **Expansions:**
  - Base Game (always included).
  - Prophecy of Kings (PoK) — togglable.
  - Thunder's Edge — togglable.
  *(Note: UI labels show only the expansion names without confusing raw tile ID ranges).*
- **Tile Distribution Mode:**
  - **Random Tiles**
  - **Balanced Tiles (3 Tiers)**: Blue tiles split into Tier 1 (High), Tier 2 (Medium), Tier 3 (Base).
- **Balance Tier Customization Modal:**
  - Allows editing comma-separated tile lists for each tier.
  - Dynamically updates default tiers when expansions are toggled.
  - "Reset to Default" button restores presets for currently active expansions.
  - Strict validator (`validateBlueTiers` on client and server):
    1. Rejects invalid non-numeric tokens.
    2. Rejects tiles outside active expansions.
    3. Rejects duplicate tiles within the same tier.
    4. Rejects overlapping tiles between tiers.
    5. Rejects missing tiles (every single active blue tile must be assigned to exactly one tier).

### Phase 2: Lobby & Claim System (`RoomView.jsx`, `/room/:roomId`)
- **Unique Shareable URL:** `/room/:roomId` with one-click "Copy Link for Players".
- **Slot Claiming:**
  - Each player opens the URL and claims their slot.
  - Once claimed, the slot is locked to that user's ID and highlighted in blue. Other players see it as "Claimed".
  - A player can unclaim/release their slot if needed.
- **Transition Trigger:**
  - When all `N` players claim their slots, the room state transitions from `"lobby"` to active map creation.
  - Speaker is randomly selected from claimed players.
  - Player seating arrangement around the table is assigned.

### Phase 3: Tile Dealing & Map Building (Next Implementation Step)
1. **Player Hands:**
   - Each player receives **3 Blue tiles** and **2 Red tiles**.
   - If Balanced mode: 1 Tier 1 + 1 Tier 2 + 1 Tier 3 blue tile, plus 2 random red tiles.
   - If Random mode: 3 random blue tiles + 2 random red tiles.
   - Sidebar/HUD shows all players, speaker token, and remaining tile counts (tile faces remain hidden from opponents).
2. **Draft / Placement Sequence (Snake Order):**
   - Starting from the Speaker: `1 -> 2 -> ... -> N -> N -> ... -> 2 -> 1 -> 1 -> ...`
   - Active player selects a tile from hand, clicks an available valid hex, reviews validation, and confirms with "Apply".
3. **Hex Placement Rules:**
   - **Rings Order:** Ring 1 (around Mecatol Rex) must be fully completed before Ring 2 can be placed. Ring 2 must be fully completed before Ring 3.
   - **Adjacency Restrictions:**
     - Anomalies cannot be adjacent to other anomalies (unless no other legal placement exists).
     - Alpha wormholes cannot be adjacent to Alpha wormholes (unless forced).
     - Beta wormholes cannot be adjacent to Beta wormholes (unless forced).
4. **Final Stage:**
   - Completed interactive map view with shareable permalink.

---

## 3. Master Tile Catalog & Expansion Sets (`tileData.js`)

### Mecatol Rex:
- **Base Game & PoK:** Tile `18`
- **Thunder's Edge Active:** Tile `112`
- Helper: `getMecatolTileId(expansions)`

### Blue Tiles:
- **Base Game (21 tiles):**
  - IDs: `18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38`
  - Default Tier 1: `27, 28, 29, 30, 35, 37`
  - Default Tier 2: `26, 31, 33, 34, 36, 38`
  - Default Tier 3: `18, 19, 20, 21, 22, 23, 24, 25, 32`
- **Prophecy of Kings (PoK) (16 tiles):**
  - IDs: `59, 60, 61, 62, 63, 64, 65, 66, 69, 70, 71, 72, 73, 74, 75, 76`
  - Default Tier 1: `69, 70, 71, 72, 75`
  - Default Tier 2: `62, 64, 65, 66, 73, 74, 76`
  - Default Tier 3: `59, 60, 61, 63`
- **Thunder's Edge (15 tiles):**
  - IDs: `97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111`
  - Default Tier 1: `97, 101, 110`
  - Default Tier 2: `98, 99, 100, 105, 106, 107, 108`
  - Default Tier 3: `102, 103, 104, 109, 111`

### Red Tiles:
- **Base Game (12 tiles):** `39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50`
- **Prophecy of Kings (PoK) (6 tiles):** `67, 68, 77, 78, 79, 80`
- **Thunder's Edge (5 tiles):** `113, 114, 115, 116, 117`
- Helper: `getActiveRedTiles(expansions)`

### Anomalies:
- **Tiles:** `41, 42, 43, 44, 45, 67, 68, 79, 80, 81, 113, 114, 115, 116, 117`
- Helper: `isAnomaly(tileId)` (returns `boolean`)
- **Map Rule:** Two anomaly tiles cannot be placed adjacent to each other on the hex grid (unless forced by legal move exhaustion).

### Wormholes:
- **Alpha Wormholes:** `26, 39, 79, 102`
  - Helper: `hasAlphaWormhole(tileId)`
  - **Map Rule:** Two Alpha wormhole tiles cannot be placed adjacent to each other (unless forced).
- **Beta Wormholes:** `25, 40, 64, 113`
  - Helper: `hasBetaWormhole(tileId)`
  - **Map Rule:** Two Beta wormhole tiles cannot be placed adjacent to each other (unless forced).
- General Helper: `getWormholeType(tileId)` (returns `'alpha' | 'beta' | null`)

### Summary of Helper Functions in `tileData.js` (and re-exported via `blueTiles.js`):
- `getMecatolTileId(expansions)`: Returns `112` if Thunder's Edge active, else `18`.
- `getActiveBlueTiles(expansions)`: Returns sorted array of active blue tiles.
- `getDefaultTiersForExpansions(expansions)`: Returns Tier 1, 2, and 3 arrays for active expansions.
- `getActiveRedTiles(expansions)`: Returns sorted array of active red tiles.
- `isAnomaly(tileId)`: Fast Set lookup for anomaly tiles.
- `hasAlphaWormhole(tileId)` / `hasBetaWormhole(tileId)` / `getWormholeType(tileId)`: Wormhole classifications.

---

## 4. UI / UX Principles for Future Turns
1. **Language:** English only. No Cyrillic in user-facing UI labels, error alerts, placeholders, or buttons.
2. **Minimal Clutter:** Keep setup forms clean. Avoid displaying internal database IDs or verbose tile number ranges directly in high-level configuration options.
3. **Real-time Synchronization:** Maintain Socket.IO state on server (`server/index.js`), with reactive client updates in React.

---

## 5. Tile Image Assets Architecture
- **Location:** `client/public/tiles/` (and mirrored to `client/dist/tiles/` on build).
- **Git Tracking:** Explicitly ignored in `.gitignore` (`client/public/tiles/`, `tiles/`) so binary image assets are never committed to GitHub.
- **Naming Convention:** `ST_{tileId}.png` (e.g. `ST_18.png` for Mecatol Rex, `ST_1.png` for Jord / Sol, etc.).
- **Server Route:** Express explicitly exposes `/tiles` via `express.static(path.resolve(__dirname, '../client/public/tiles'))`.
- **UI Rendering & Fallback:** `HexTile` SVG component clips image via `<clipPath id="hex-clip-shape">`, applies crisp outline stroke overlay, and automatically falls back to vector polygon + text label if an image fails to load or is not present.

---

## 6. Server & VPS Deployment Architecture
- **Server Entry:** `server/index.js` listens on `process.env.PORT || 4000`.
- **Static Hosting:** When `client/dist` exists, Express serves static files and responds with `index.html` on wildcard routes.
- **Reverse Proxy Requirement (Nginx/Caddy on VPS):**
  - If Nginx sits in front, it must forward `/api/` and `/socket.io/` (with WebSocket upgrade headers `Upgrade` and `Connection "upgrade"`) to `http://127.0.0.1:4000` (or whatever `PORT` is configured in PM2).
  - Alternatively, Nginx can proxy all requests (`location /`) to `http://127.0.0.1:4000` since Express handles both static frontend and API/WebSocket routes directly.

