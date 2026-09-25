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
  - When all `N` players claim their slots, the room state transitions from `"lobby"` to active map creation (`map_building`).
  - **Randomized Speaker & Seating:** Speaker is randomly selected from claimed players, and players are simultaneously seated in a random order around the table (rather than sequential slot order).
  - Reverting back to lobby (reset or unclaim) restores the sorted slot order.

### Phase 2.1: Developer & Testing Toolbar (`DevToolbar.jsx`)
- **Single-Seat Quick Testing:**
  - **⚡ Auto-Fill Lobby & Start Draft:** Emits `dev_autofill_room` to immediately assign all unassigned seats with mock players and advance the room to `map_building` (or next phase) with speaker selection.
  - **🔄 Reset Room to Lobby:** Emits `dev_reset_room` to wipe claims and restore `lobby` status for clean re-runs.
  - **Seat Switcher (Control As...):** Switches the active user session in the current tab between Player 1..N on the fly, allowing full testing of turn order and placement rules from one window.
- **Multi-Tab Isolation:**
  - Users can append `?user=<id>` to the room URL (e.g. `/room/:roomId?user=p2`) or click the "+ Tab Player N" shortcut to open separate isolated player sessions without needing incognito windows.

### Phase 3: Map Building Interface & Board Geometry (`MapGrid.jsx`, `PlayerHandPanel.jsx`)
1. **Hexagonal Grid Geometry (Flat-Topped TI4 Standard):**
   - Flat-topped regular hexagons: Width $2R$, Height $H = \sqrt{3}R$ ($R = 54\text{px}$). Top and bottom edges are horizontal flat lines.
   - Total of 37 hexes across 3 complete rings centered around Mecatol Rex (Tile 18 or 112):
     - **Ring 0:** 1 center hex (Mecatol Rex).
     - **Ring 1:** 6 hexes (sharing flat horizontal edges North and South).
     - **Ring 2:** 12 hexes (6 corners at radius $2$, 6 edge midpoints).
     - **Ring 3:** 18 hexes (6 outer corners + 12 intermediate edge hexes).
2. **Green Home System Tiles:**
   - The 6 outer corners of Ring 3 represent the 6 player Home Systems.
   - Styled in emerald green (`#064e3b` / `#059669` with `#34d399` stroke) replacing generic placeholders.
   - Each Home System displays the player's name in bold white, "HOME SYSTEM" label, speaker crown 👑 if speaker, and "YOU" badge for the viewing player.
   - Next to each Home System are two mini-hexagons:
     - **Blue Mini-Hex:** Displays remaining Blue tiles in hand (e.g. `3`).
     - **Red Mini-Hex:** Displays remaining Red tiles in hand (e.g. `2`).
3. **Player-Centric Dynamic Map Rotation:**
   - The map rotates so that the viewing player's home system is always oriented towards them (at the bottom / South position $(0, 3H)$).
   - If player slot is $V \in \{0..5\}$, coordinate rotation angle is $\theta = -V \times 60^\circ$ ($-V \frac{\pi}{3}$ rad).
   - Since $60^\circ$ is a 6-fold symmetry, the rotated grid aligns onto the hex lattice, while hex polygons remain upright so all player names and numbers remain horizontal and legible.
4. **Layout Optimization & 5-Tile Player Hand Panel:**
   - In `map_building` status, the layout splits into a compact left sidebar (room header, ready status, and player roster) and a large central game board.
   - Directly underneath the hex map is `PlayerHandPanel` displaying the player's 5 tiles (3 Blue and 2 Red), ready for selection and placement during their turn.

### Phase 4: Draft / Placement Sequence (Snake Order):
1. **Draft Order:**
   - Starting from the Speaker: `1 -> 2 -> ... -> N -> N -> ... -> 2 -> 1 -> 1 -> ...`
   - Active player selects a tile from hand, clicks an available valid hex, reviews validation, and confirms with "Apply".
2. **Hex Placement Rules:**
   - **Rings Order:** Ring 1 (around Mecatol Rex) must be fully completed before Ring 2 can be placed. Ring 2 must be fully completed before Ring 3.
   - **Adjacency Restrictions:**
     - Anomalies cannot be adjacent to other anomalies (unless no other legal placement exists).
     - Alpha wormholes cannot be adjacent to Alpha wormholes (unless forced).
     - Beta wormholes cannot be adjacent to Beta wormholes (unless forced).
3. **Phase 5: Completed Map View & Perspective Rotation (`room.status === 'completed'`):**
   - **Expansive Proportional Viewport Display:** When all player hand tiles are placed, the application transitions to the completed map view. Hand tiles panel, placement action bar, and bottom guide captions are removed.
   - **Tight Hex ViewBox Framing:** In completed mode, SVG viewBox is dynamically cropped to `-348 -382 696 764` with `aspectRatio: '696 / 764'`, expanding the map so the top Home System tile sits right below the top header labels and the bottom Home System tile almost touches the bottom border of the board container.
   - **Cleaned Home Systems:** Mini red and blue tile count badges beside home systems are automatically hidden upon completion since all hand tiles are placed on the board.
   - **Left Sidebar - Map Creation Room Card:** Retains the compact room card with a dedicated **🔗 Copy Map Link** permalink button (`/room/:roomId`) that leads directly to the completed galaxy for players and spectators.
   - **Left Sidebar - Show Tile Numbers Checkbox:** Includes a dedicated "Show Tile Numbers" toggle checkbox (enabled by default) allowing users to turn system numbers on and off across all placed tiles.
   - **High-Contrast Tile Numbers Overlay:** When enabled, system numbers on tiles (including Mecatol Rex) are displayed in bold white text with a crisp 4px dark stroke outline (`paintOrder="stroke fill"` and drop shadow) ensuring maximum legibility over all system art images.
   - **Left Sidebar - Interactive Map Perspective Controls:** Provides an interface allowing users to rotate the board to view the galaxy from any player's perspective (orienting that player's Home System directly to the South / bottom position $(0, 3H)$). Includes single-click player seat buttons, counter-clockwise (`↺ -60°`) and clockwise (`↻ +60°`) step rotations, and a "My Seat" shortcut.

### 5-Player Map Layout & Hyperlanes:
1. **Pre-Placed Hyperlane Tiles:**
   - Instead of 6 player slices, 1 slice (South) is replaced by 6 fixed hyperlane tiles:
     - `ring1-0` -> Tile **85A** (directly South of Mecatol Rex)
     - `ring2-edge-0` -> Tile **87A** (South-West in Ring 2)
     - `ring2-edge-5` -> Tile **88A** (South-East in Ring 2)
     - `ring3-edge-0-1` -> Tile **84A** (South-West in Ring 3)
     - `ring3-edge-5-2` -> Tile **83A** (South-East in Ring 3)
     - `home-system-0` -> Tile **86A** (directly South at Ring 3)
2. **5 Player Home System Seating:**
   - **Player 1 (Speaker, P1):** North (`home-system-3`)
   - **Player 2 (P2):** North-East (`home-system-4`)
   - **Player 3 (P3):** South-East (`home-system-5`)
   - **Player 4 (P4):** South-West (`home-system-1`)
   - **Player 5 (P5):** North-West (`home-system-2`)
3. **Draftable Tile Slots:**
   - 25 draftable hexes total ($5 \text{ players} \times 5 \text{ tiles in hand} = 25$ turns).
   - Hex `ring2-corner-0` (designated as spot **7**) is in the center of the hyperlane cluster and is a draftable Ring 2 slot.
4. **Hyperlane Adjacency Rules (enforced in `getHexNeighbors` and `checkTileViolations`):**
   - **Hex 1 (`ring1-1`)** and **Hex 2 (`ring1-5`)** are adjacent via hyperlane tile 85A.
   - **Hex 7 (`ring2-corner-0`)** is adjacent to **Hex 1, 2, 3, 4, 5, and 6** via hyperlanes.
   - **Hex 5 (`ring3-edge-0-2`)** and **Hex 4 (`ring3-edge-5-1`)** are adjacent via hyperlane tiles 84A-86A-83A.
   - All standard physical grid adjacencies between adjacent hexes remain intact.
   - Adjacency rules (no adjacent anomalies, no adjacent matching wormholes unless forced) strictly respect these hyperlane connections.

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
  - Default Tier 3: `19, 20, 21, 22, 23, 24, 25, 32`
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
- **Production Nginx Config Template:**
  ```nginx
  server {
      listen 80;
      server_name _;

      location / {
          root /var/www/ti4_bag_draft/client/dist;
          index index.html;
          try_files $uri $uri/ /index.html;
      }

      location /api/ {
          proxy_pass http://127.0.0.1:4000;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }

      location /socket.io/ {
          proxy_pass http://127.0.0.1:4000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "Upgrade";
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  ```

---

## 7. Tile Placement Logic & Adjacency Rules

1. **Ring Order & Progression:**
   - Ring 1 (6 hexes surrounding Mecatol Rex) must be fully filled before any hex in Ring 2 can be placed.
   - Ring 2 (12 hexes) must be fully filled before any edge hex in Ring 3 can be placed.
2. **Adjacency Constraints:**
   - Anomaly tiles cannot be placed adjacent to other anomaly tiles.
   - Alpha wormhole tiles cannot be placed adjacent to Alpha wormholes.
   - Beta wormhole tiles cannot be placed adjacent to Beta wormholes.
3. **"No Other Choice" Exception ("Forced Placement"):**
   - Forced placement triggers **if and only if** the player has **no legal placement available** with **any tile** currently in their hand on **any available empty hex** in the current active ring (i.e. every hand tile would cause an adjacency violation on every available empty hex in the active ring).
   - If the player holds at least one tile in hand that can be legally placed on at least one empty hex in the active ring without violating adjacency rules, forced placement **does not** trigger, and placing any violating tile adjacent to another anomaly / matching wormhole is strictly rejected.
   - When forced placement is legitimately active (player has zero legal moves available across all hand tiles and empty ring hexes), the placement with violations is permitted (`forced: true`), the Accept button is enabled in amber, and the server validates and accepts the placement without errors or rejections.
4. **Placement Workflow & Error Handling:**
   - Active player selects a tile from hand (`PlayerHandPanel`). Temporary debug labels beneath hand tiles show Anomaly and Wormhole parameters.
   - Player clicks an eligible empty hex in the active ring (`MapGrid`).
   - Real-time validation feedback runs via `validatePlacement(placedTiles, targetHex, tileId, activeRing, allHexes, player)`.
   - An **Accept** button appears in the placement action bar alongside real-time validation feedback.
   - Clicking **Accept** confirms the choice (`place_tile` socket event), places the tile on the board, removes it from the player's hand, and advances the turn in snake order.
   - Any runtime socket error (e.g. `room_error`) is presented as a dismissible notification banner above the map rather than unmounting or crashing the room view.

