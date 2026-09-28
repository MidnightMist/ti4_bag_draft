# Twilight Imperium 4 (TI4) Map Generator & Bag Draft

A feature-rich real-time web application for Twilight Imperium 4 to create balanced random galaxies or conduct full Bag Drafts (factions, system tiles, tier distribution, and interactive hex map building) with friends across 3 to 8 players.

---

## 🚀 Key Features

- **Real-Time Multiplayer Rooms:** Powered by Node.js, Express, and Socket.IO. Share room links (`/room/:roomId`) with players for instant slot claiming and live synchronization.
- **Game Modes:**
  - **Random Map Creation:** Configurable player count (3–8), expansions, and tier-balanced blue tile distributions.
  - **Bag Draft Mode:** Faction selection (30+ factions across Base, Prophecy of Kings, and Thunder's Edge), faction banning phase, draft round distribution (Blue/Red tiles and Factions), and post-map faction selection.
- **Expansions Support:** Base Game, Prophecy of Kings (PoK), and Thunder's Edge.
- **Hexagonal Grid Geometry:** Flat-topped TI4 standard maps with 3 rings, Mecatol Rex center, home systems, and hyperlane corridors for 3, 4, 5, 7, and 8 players.
- **Player-Centric Map Rotation:** Automatically or manually rotate the galaxy so your home system is always oriented at the bottom (South) for optimal visibility.
- **Placement Validation:** Enforces ring progression order (Ring 1 → Ring 2 → Ring 3) and adjacency restrictions (anomalies, alpha/beta wormholes), complete with "forced placement" exception handling when no legal moves remain.
- **Developer Toolbar:** Fast-forward drafts, auto-fill rooms with bots/test players, reset rooms, and instantly switch active player seats in a single tab for rapid testing.

---

## 🛠️ Local Installation & Running the Server

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
To start both the backend Express/Socket.IO server (default port `4000`) and the Vite frontend (default port `3000`):
```bash
npm run dev:local
```
Alternative:
```bash
npm run dev
```

### 3. Production Build & Start
```bash
npm run build
npm start
```

---

## 🖼️ Image Assets (Tiles & Factions)

Because binary graphic assets are heavy, high-resolution tile and faction images are excluded from Git (`.gitignore`). To have the full graphical board and card previews render correctly, you must place your image files in the correct directories:

### 1. System Tile Images (`client/public/tiles/`)
- **Directory:** `client/public/tiles/` (and root `/tiles/` as a backup).
- **Naming Convention:** `ST_{tileId}.png` (e.g., `ST_18.png` for Mecatol Rex, `ST_1.png` for Sol home system, `ST_19.png`, etc.).
- **Content:** High-resolution tile graphics (system tiles covering Base, PoK, and Thunder's Edge expansions).
- **Fallback:** If an image is missing, the app automatically falls back to vector polygon hexes with system numbers.

### 2. Faction Sheets & Icons (`client/public/factions/`)
- **Directory:** `client/public/factions/`
- **Naming Convention:** PNG images matching faction identifiers used in `factionsData.js`.
- **Content:** High-resolution faction sheets and faction icons used during the draft phase and faction selection screen.

---

## 📂 Project Structure

- `client/` — React frontend (Vite, Tailwind CSS, components, routing).
- `server/` — Express backend and Socket.IO server (`server/index.js`).
- `client/src/data/` — Single source of truth for tile catalogs (`tileData.js`), factions (`factionsData.js`), and tier validation (`tierValidator.js`).
- `docs/` — Comprehensive project context (`PROJECT_CONTEXT.md`).
