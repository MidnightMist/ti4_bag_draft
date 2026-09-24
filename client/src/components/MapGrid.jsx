import React, { useState } from 'react';
import { getMecatolTileId } from '../data/tileData.js';

// Geometry constants for flat-topped hexagonal grid
// Radius enlarged from 54 to 62 for maximum board presence
const R = 62; // Circumradius (center to vertex)
const H = Math.sqrt(3) * R; // Height of flat-topped hex (~107.39px)

/**
 * Generate standard flat-topped hex polygon points string centered at (cx, cy)
 */
function getFlatHexPoints(cx, cy, radius = R) {
  const h = Math.sqrt(3) * radius;
  return [
    `${cx - radius},${cy}`,
    `${cx - radius / 2},${cy - h / 2}`,
    `${cx + radius / 2},${cy - h / 2}`,
    `${cx + radius},${cy}`,
    `${cx + radius / 2},${cy + h / 2}`,
    `${cx - radius / 2},${cy + h / 2}`,
  ].join(' ');
}

/**
 * Generate standard mini flat-topped hex polygon points
 */
function getMiniHexPoints(cx, cy, radius = 14) {
  const h = Math.sqrt(3) * radius;
  return [
    `${cx - radius},${cy}`,
    `${cx - radius / 2},${cy - h / 2}`,
    `${cx + radius / 2},${cy - h / 2}`,
    `${cx + radius},${cy}`,
    `${cx + radius / 2},${cy + h / 2}`,
    `${cx - radius / 2},${cy + h / 2}`,
  ].join(' ');
}

/**
 * Base directions from center (0,0) for flat-topped hex grid in clockwise order:
 * d = 0: South (Bottom)
 * d = 1: South-West (Lower-Left)
 * d = 2: North-West (Upper-Left)
 * d = 3: North (Top)
 * d = 4: North-East (Upper-Right)
 * d = 5: South-East (Lower-Right)
 */
const BASE_DIRECTIONS = [
  { x: 0, y: H },              // 0: South (+y)
  { x: -1.5 * R, y: 0.5 * H },  // 1: South-West
  { x: -1.5 * R, y: -0.5 * H }, // 2: North-West
  { x: 0, y: -H },             // 3: North (-y)
  { x: 1.5 * R, y: -0.5 * H },  // 4: North-East
  { x: 1.5 * R, y: 0.5 * H },   // 5: South-East
];

/**
 * Build all 37 hex positions for the 3-ring TI4 map (Ring 0, 1, 2, 3)
 */
function generate37Hexes() {
  const hexes = [];

  // 1. Ring 0: Center (Mecatol Rex)
  hexes.push({
    id: 'center',
    ring: 0,
    index: 0,
    type: 'center',
    x: 0,
    y: 0,
  });

  // 2. Ring 1: 6 hexes
  for (let d = 0; d < 6; d++) {
    hexes.push({
      id: `ring1-${d}`,
      ring: 1,
      index: d,
      type: 'ring1',
      x: BASE_DIRECTIONS[d].x,
      y: BASE_DIRECTIONS[d].y,
    });
  }

  // 3. Ring 2: 12 hexes (6 corners + 6 midpoints)
  for (let d = 0; d < 6; d++) {
    const nextD = (d + 1) % 6;
    const cX = BASE_DIRECTIONS[d].x * 2;
    const cY = BASE_DIRECTIONS[d].y * 2;
    // Corner hex
    hexes.push({
      id: `ring2-corner-${d}`,
      ring: 2,
      index: d * 2,
      type: 'ring2',
      x: cX,
      y: cY,
    });

    // Edge midpoint hex
    const nextCX = BASE_DIRECTIONS[nextD].x * 2;
    const nextCY = BASE_DIRECTIONS[nextD].y * 2;
    hexes.push({
      id: `ring2-edge-${d}`,
      ring: 2,
      index: d * 2 + 1,
      type: 'ring2',
      x: (cX + nextCX) / 2,
      y: (cY + nextCY) / 2,
    });
  }

  // 4. Ring 3: 18 hexes (6 Home Systems at corners + 12 edge hexes)
  for (let d = 0; d < 6; d++) {
    const nextD = (d + 1) % 6;
    const cX = BASE_DIRECTIONS[d].x * 3;
    const cY = BASE_DIRECTIONS[d].y * 3;

    // Corner: Home System for seat d
    hexes.push({
      id: `home-system-${d}`,
      ring: 3,
      index: d,
      type: 'home_system',
      seatIndex: d,
      x: cX,
      y: cY,
    });

    // 2 intermediate edge hexes along this side
    const nextCX = BASE_DIRECTIONS[nextD].x * 3;
    const nextCY = BASE_DIRECTIONS[nextD].y * 3;
    const dx = (nextCX - cX) / 3;
    const dy = (nextCY - cY) / 3;

    hexes.push({
      id: `ring3-edge-${d}-1`,
      ring: 3,
      index: 6 + d * 2,
      type: 'ring3',
      x: cX + dx,
      y: cY + dy,
    });

    hexes.push({
      id: `ring3-edge-${d}-2`,
      ring: 3,
      index: 6 + d * 2 + 1,
      type: 'ring3',
      x: cX + dx * 2,
      y: cY + dy * 2,
    });
  }

  return hexes;
}

const ALL_37_HEXES = generate37Hexes();

/**
 * Standard Hex Tile Renderer
 */
function HexTile({
  cx,
  cy,
  tileId,
  label,
  subLabel,
  isPlaceholder,
  fill = '#161622',
  stroke = '#3b3b54',
  strokeWidth = 1.5,
  strokeDasharray,
  isHomeSystem = false,
  playerName = '',
  isViewer = false,
  isSpeaker = false,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = tileId && !imgFailed;
  const hexPoints = getFlatHexPoints(cx, cy, R);

  // Home System Green Styling
  if (isHomeSystem) {
    return (
      <g className="home-system-tile" style={{ cursor: 'pointer' }}>
        {/* Glow if viewer */}
        {isViewer && (
          <polygon
            points={getFlatHexPoints(cx, cy, R + 5)}
            fill="none"
            stroke="#34d399"
            strokeWidth="3.5"
            strokeOpacity="0.55"
          />
        )}

        {/* Base Green Polygon */}
        <polygon
          points={hexPoints}
          fill="url(#green-home-system-grad)"
          stroke={isViewer ? '#34d399' : '#059669'}
          strokeWidth={isViewer ? 3 : 2}
        />

        {/* Inner subtle border accent */}
        <polygon
          points={getFlatHexPoints(cx, cy, R - 6)}
          fill="none"
          stroke="#10b981"
          strokeWidth="1"
          strokeOpacity="0.4"
          strokeDasharray="4 3"
        />

        {/* Speaker Crown if applicable */}
        {isSpeaker && (
          <text
            x={cx}
            y={cy - 24}
            textAnchor="middle"
            fontSize="16"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            👑
          </text>
        )}

        {/* "YOU" badge if viewer */}
        {isViewer && !isSpeaker && (
          <g transform={`translate(${cx}, ${cy - 27})`}>
            <rect x="-20" y="-9" width="40" height="17" rx="4" fill="#047857" stroke="#34d399" strokeWidth="1" />
            <text x="0" y="3" textAnchor="middle" fill="#ecfdf5" fontSize="10" fontWeight="bold">
              YOU
            </text>
          </g>
        )}

        {/* Player Name */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="14"
          fontWeight="700"
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            textShadow: '0 2px 4px rgba(0,0,0,0.95)',
          }}
        >
          {playerName || label}
        </text>

        {/* Subtitle "HOME SYSTEM" */}
        <text
          x={cx}
          y={cy + 19}
          textAnchor="middle"
          fill="#a7f3d0"
          fontSize="10"
          fontWeight="600"
          letterSpacing="0.05em"
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            textTransform: 'uppercase',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          Home System
        </text>
      </g>
    );
  }

  return (
    <g className="map-hex-tile">
      {/* Background polygon */}
      <polygon
        points={hexPoints}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />

      {/* Tile image if available */}
      {showImage && (
        <>
          <g clipPath="url(#hex-clip-shape)">
            <image
              href={`/tiles/ST_${tileId}.png`}
              x={cx - R}
              y={cy - H / 2}
              width={2 * R}
              height={H}
              preserveAspectRatio="xMidYMid slice"
              onError={() => setImgFailed(true)}
            />
          </g>
          <polygon
            points={hexPoints}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </>
      )}

      {/* Center Label */}
      {(!showImage || isPlaceholder) && (
        <g>
          <text
            x={cx}
            y={subLabel ? cy - 2 : cy + 5}
            textAnchor="middle"
            fill={isPlaceholder ? '#6b7280' : '#ffffff'}
            fontSize={isPlaceholder ? '12' : '14'}
            fontWeight={isPlaceholder ? '500' : '700'}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {label || (tileId ? `Tile ${tileId}` : '')}
          </text>
          {subLabel && (
            <text
              x={cx}
              y={cy + 15}
              textAnchor="middle"
              fill="#9ca3af"
              fontSize="10"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {subLabel}
            </text>
          )}
        </g>
      )}
    </g>
  );
}

/**
 * Mini Hexagons Badge for remaining Blue & Red tiles beside a Home System
 */
function HomeSystemTileCountBadge({ cx, cy, blueCount = 3, redCount = 2 }) {
  // Center of badge is radially outward from (0,0) through (cx, cy)
  const dist = Math.sqrt(cx * cx + cy * cy);
  const ux = dist > 0 ? cx / dist : 0;
  const uy = dist > 0 ? cy / dist : 1;

  // Position badge cluster outward from the hex corner
  const badgeDist = dist + R + 22;
  const bx = ux * badgeDist;
  const by = uy * badgeDist;

  // Tangent vector for placing blue and red side-by-side
  const tx = -uy;
  const ty = ux;

  // Offsets for the two mini hexes
  const offset = 20;
  const blueX = bx - tx * offset;
  const blueY = by - ty * offset;
  const redX = bx + tx * offset;
  const redY = by + ty * offset;

  return (
    <g className="tile-count-badge" style={{ pointerEvents: 'none', userSelect: 'none' }}>
      {/* Blue Mini-Hexagon */}
      <g>
        <polygon
          points={getMiniHexPoints(blueX, blueY, 15)}
          fill="#1e3a8a"
          stroke="#60a5fa"
          strokeWidth="1.5"
        />
        <text
          x={blueX}
          y={blueY + 5}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="12"
          fontWeight="bold"
        >
          {blueCount}
        </text>
      </g>

      {/* Red Mini-Hexagon */}
      <g>
        <polygon
          points={getMiniHexPoints(redX, redY, 15)}
          fill="#991b1b"
          stroke="#f87171"
          strokeWidth="1.5"
        />
        <text
          x={redX}
          y={redY + 5}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="12"
          fontWeight="bold"
        >
          {redCount}
        </text>
      </g>
    </g>
  );
}

export default function MapGrid({ room, mySlot }) {
  const mecatolTileId = getMecatolTileId(room?.expansions);

  // Map player seats (0..5)
  const players = room?.players || [];

  // Rotation logic:
  // We want the viewing player's home system to be at the BOTTOM (South, d = 0).
  const viewerSeatIndex = mySlot ? players.findIndex(p => p.slotId === mySlot.slotId) : 0;
  const activeViewerSeat = viewerSeatIndex >= 0 ? viewerSeatIndex : 0;
  // Rotation angle theta = -activeViewerSeat * 60 degrees (-activeViewerSeat * PI / 3)
  const theta = -activeViewerSeat * (Math.PI / 3);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  return (
    <div
      id="map-grid-container"
      style={{
        width: '100%',
        maxWidth: '920px',
        backgroundColor: '#11111b',
        border: '1px solid #272738',
        borderRadius: '16px',
        padding: '20px 16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Board Header Bar */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          padding: '0 8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🌌</span>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#f3f4f6', fontWeight: '700' }}>
            Twilight Galaxy (3 Rings • 6 Players)
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              color: '#34d399',
              backgroundColor: '#064e3b',
              padding: '3px 8px',
              borderRadius: '6px',
              fontWeight: '600',
            }}
          >
            Oriented to: {mySlot ? mySlot.name : 'Player 1'}
          </span>
        </div>
      </div>

      {/* SVG Galaxy Board */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'visible',
        }}
      >
        <svg
          viewBox="-440 -440 880 880"
          style={{
            width: '100%',
            maxWidth: '880px',
            height: 'auto',
            aspectRatio: '1 / 1',
            display: 'block',
          }}
        >
          <defs>
            {/* Emerald Green gradient for Home Systems */}
            <radialGradient id="green-home-system-grad" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="70%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </radialGradient>

            {/* Mecatol Rex Purple gradient */}
            <radialGradient id="mecatol-grad" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#581c87" />
              <stop offset="75%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#2e1065" />
            </radialGradient>

            {/* Flat Hex Clip Path for tile images */}
            <clipPath id="hex-clip-shape">
              <polygon points={getFlatHexPoints(0, 0, R)} />
            </clipPath>
          </defs>

          {/* Background Space Ring Orbits */}
          <circle cx="0" cy="0" r={H} fill="none" stroke="#252538" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
          <circle cx="0" cy="0" r={2 * H} fill="none" stroke="#252538" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
          <circle cx="0" cy="0" r={3 * H} fill="none" stroke="#252538" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />

          {/* Render All 37 Hexes */}
          {ALL_37_HEXES.map((hex) => {
            // Apply view rotation theta:
            // rx = x * cos(theta) - y * sin(theta)
            // ry = x * sin(theta) + y * cos(theta)
            const rx = hex.x * cosT - hex.y * sinT;
            const ry = hex.x * sinT + hex.y * cosT;

            if (hex.type === 'center') {
              // Mecatol Rex
              return (
                <HexTile
                  key={hex.id}
                  cx={rx}
                  cy={ry}
                  tileId={mecatolTileId}
                  label="Mecatol Rex"
                  subLabel={`Tile ${mecatolTileId}`}
                  fill="url(#mecatol-grad)"
                  stroke="#c084fc"
                  strokeWidth={2.5}
                />
              );
            }

            if (hex.type === 'home_system') {
              // Home system at base seat index hex.seatIndex
              const player = players[hex.seatIndex] || {
                name: `Player ${hex.seatIndex + 1}`,
                slotId: hex.seatIndex,
              };
              const isViewer = mySlot && mySlot.slotId === player.slotId;
              const blueCount = player.remainingBlue ?? player.hand?.blue?.length ?? 3;
              const redCount = player.remainingRed ?? player.hand?.red?.length ?? 2;

              return (
                <g key={hex.id}>
                  <HexTile
                    cx={rx}
                    cy={ry}
                    isHomeSystem={true}
                    playerName={player.name}
                    isViewer={isViewer}
                    isSpeaker={!!player.isSpeaker}
                  />

                  {/* Tile count badge: Two mini-hexagons (blue & red) */}
                  <HomeSystemTileCountBadge
                    cx={rx}
                    cy={ry}
                    blueCount={blueCount}
                    redCount={redCount}
                  />
                </g>
              );
            }

            // Normal Empty Hex Slots (Ring 1, 2, 3)
            const ringColor =
              hex.ring === 1
                ? { stroke: '#4f46e5', fill: '#141424', label: 'Ring 1' }
                : hex.ring === 2
                ? { stroke: '#33334d', fill: '#12121e', label: 'Ring 2' }
                : { stroke: '#272738', fill: '#10101a', label: 'Ring 3' };

            return (
              <HexTile
                key={hex.id}
                cx={rx}
                cy={ry}
                label={ringColor.label}
                isPlaceholder={true}
                fill={ringColor.fill}
                stroke={ringColor.stroke}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            );
          })}
        </svg>
      </div>

      {/* Board Guide Note */}
      <div style={{ marginTop: '6px', fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
        Green tiles: Home Systems • Blue/Red badges: Remaining tiles in hand
      </div>
    </div>
  );
}
