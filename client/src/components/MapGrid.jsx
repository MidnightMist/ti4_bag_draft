import React, { useState } from 'react';
import { getMecatolTileId, getCurrentActiveRing, ALL_37_HEXES, getPlayerForSeatIndex, getSeatIndexForPlayer } from '../data/tileData.js';

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
 * Standard Hex Tile Renderer
 */
function HexTile({
  cx,
  cy,
  tileId,
  label,
  subLabel,
  isPlaceholder,
  isPending = false,
  fill = '#161622',
  stroke = '#3b3b54',
  strokeWidth = 1,
  strokeDasharray,
  isHomeSystem = false,
  playerName = '',
  isViewer = false,
  isSpeaker = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  cursor = 'default',
  showTileNumber = false,
  rotation = 0,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = tileId && !imgFailed;
  const hexPoints = getFlatHexPoints(0, 0, R);
  const clipId = `hex-clip-${Math.abs(Math.round(cx))}-${Math.abs(Math.round(cy))}-${tileId || 'home'}`;

  return (
    <g
      transform={`translate(${cx}, ${cy})${rotation ? ` rotate(${rotation})` : ''}`}
      className="map-hex-tile"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor }}
    >
      <defs>
        <clipPath id={clipId}>
          <polygon points={hexPoints} />
        </clipPath>
      </defs>

      {/* Home System Green Styling */}
      {isHomeSystem ? (
        <g className="home-system-tile">
          {/* Glow if viewer */}
          {isViewer && (
            <polygon
              points={getFlatHexPoints(0, 0, R + 5)}
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
            points={getFlatHexPoints(0, 0, R - 6)}
            fill="none"
            stroke="#10b981"
            strokeWidth="1"
            strokeOpacity="0.4"
            strokeDasharray="4 3"
          />

          {/* Speaker Crown if applicable */}
          {isSpeaker && (
            <text
              x={0}
              y={-24}
              textAnchor="middle"
              fontSize="16"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              👑
            </text>
          )}

          {/* "YOU" badge if viewer */}
          {isViewer && !isSpeaker && (
            <g transform={`translate(0, -27)`}>
              <rect x="-20" y="-9" width="40" height="17" rx="4" fill="#047857" stroke="#34d399" strokeWidth="1" />
              <text x="0" y="3" textAnchor="middle" fill="#ecfdf5" fontSize="10" fontWeight="bold">
                YOU
              </text>
            </g>
          )}

          {/* Player Name */}
          <text
            x={0}
            y={0}
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
            x={0}
            y={19}
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
      ) : (
        <g>
          {/* Background polygon */}
          <polygon
            points={hexPoints}
            fill={fill}
            stroke={isPending ? 'transparent' : stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />

          {/* Tile image if available */}
          {showImage && (
            <image
              href={`/tiles/ST_${tileId}.png`}
              x={-R}
              y={-H / 2}
              width={2 * R}
              height={H}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${clipId})`}
              onError={() => setImgFailed(true)}
            />
          )}

          {/* Center Label */}
          {(!showImage || isPlaceholder) && (
            <g>
              <text
                x={0}
                y={subLabel ? -2 : 5}
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
                  x={0}
                  y={15}
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

          {/* Top-most Border Polygon ensuring uniform stroke on all sides */}
          {stroke !== 'none' && (
            <polygon
              points={hexPoints}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          )}

          {/* High-contrast tile number overlay (white font with dark outline) */}
          {showTileNumber && tileId && (
            <g style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <text
                x={0}
                y={7}
                textAnchor="middle"
                fill="#ffffff"
                stroke="#000000"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
                paintOrder="stroke fill"
                fontSize="20"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))',
                }}
              >
                {tileId}
              </text>
            </g>
          )}

          {/* Pending inner frame */}
          {isPending && (
            <polygon
              points={getFlatHexPoints(0, 0, R - 6)}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              strokeOpacity="0.85"
            />
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
  const dist = Math.sqrt(cx * cx + cy * cy);
  const ux = dist > 0 ? cx / dist : 0;
  const uy = dist > 0 ? cy / dist : 1;

  const badgeDist = dist + R + 22;
  const bx = ux * badgeDist;
  const by = uy * badgeDist;

  const tx = -uy;
  const ty = ux;

  const offset = 20;
  const blueX = bx - tx * offset;
  const blueY = by - ty * offset;
  const redX = bx + tx * offset;
  const redY = by + ty * offset;

  return (
    <g className="tile-count-badge" style={{ pointerEvents: 'none', userSelect: 'none' }}>
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

export default function MapGrid({
  room,
  mySlot,
  selectedTileId,
  pendingHexId,
  onSelectHex,
  isMyTurn,
  onHoverTile,
  perspectiveSeatIndex = null,
  isCompleted = false,
  showTileCounts = true,
  showTileNumbers = true,
  isFullscreen = false,
  onToggleFullscreen,
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const mecatolTileId = getMecatolTileId(room?.settings?.expansions);
  const players = room?.players || [];
  const placedTiles = room?.mapState?.placedTiles || {};
  const activeRing = getCurrentActiveRing(placedTiles, ALL_37_HEXES);

  const playerCount = room?.settings?.playerCount || players.length;

  // Rotation logic: if perspectiveSeatIndex is explicitly passed, use it;
  // otherwise default to viewer home system at bottom (South, d=0)
  let activeViewerSeat = 0;
  if (perspectiveSeatIndex !== null && perspectiveSeatIndex !== undefined) {
    activeViewerSeat = Number(perspectiveSeatIndex);
  } else if (mySlot) {
    if (playerCount === 5 || playerCount === 4) {
      const myPlayerIdx = players.findIndex(p => p.slotId === mySlot.slotId);
      activeViewerSeat = myPlayerIdx >= 0 ? getSeatIndexForPlayer(myPlayerIdx, playerCount) : 0;
    } else {
      const viewerSeatIndex = players.findIndex(p => p.slotId === mySlot.slotId);
      activeViewerSeat = viewerSeatIndex >= 0 ? viewerSeatIndex : 0;
    }
  }
  const theta = -activeViewerSeat * (Math.PI / 3);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  // Oriented label
  let orientedLabel = 'Player 1';
  if (playerCount === 5 || playerCount === 4) {
    if (activeViewerSeat === 0) {
      orientedLabel = 'Overview (Hyperlanes South)';
    } else {
      const p = getPlayerForSeatIndex(players, activeViewerSeat, playerCount);
      orientedLabel = p ? p.name : `Seat #${activeViewerSeat}`;
    }
  } else {
    const orientedPlayer = players[activeViewerSeat] || { name: `Player ${activeViewerSeat + 1}` };
    orientedLabel = orientedPlayer.name;
  }

  return (
    <div
      id="map-grid-container"
      style={{
        width: '100%',
        maxWidth: isFullscreen ? '100vw' : isCompleted ? '1140px' : '920px',
        backgroundColor: isFullscreen ? '#0a0a12' : '#11111b',
        border: isFullscreen ? 'none' : '1px solid #272738',
        borderRadius: isFullscreen ? '0' : '16px',
        padding: isFullscreen ? '20px 16px' : isCompleted ? '14px 16px 6px 16px' : '20px 16px',
        boxShadow: isFullscreen ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        overflow: isFullscreen ? 'auto' : 'visible',
      }}
    >
      {/* Board Header Bar */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isCompleted ? '4px' : '10px',
          padding: '0 8px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🌌</span>
          <h3 style={{ margin: 0, fontSize: isCompleted ? '19px' : '18px', color: '#f3f4f6', fontWeight: '700' }}>
            {isCompleted ? 'Twilight Galaxy Map' : `Twilight Galaxy (Active Ring: ${activeRing})`}
          </h3>
          {isCompleted && (
            <span style={{ fontSize: '11px', color: '#34d399', backgroundColor: '#064e3b', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
              ✓ Complete
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '12px',
              color: '#34d399',
              backgroundColor: '#064e3b',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>🧭 Oriented to:</span>
            <strong style={{ color: '#fff' }}>{orientedLabel}</strong>
            {(activeViewerSeat !== 0 || playerCount !== 5) && (
              <span style={{ fontSize: '10px', color: '#a7f3d0' }}>(South)</span>
            )}
          </span>

          {/* Zoom & Fullscreen Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#1c1c2b', padding: '3px', borderRadius: '6px', border: '1px solid #323248' }}>
            <button
              onClick={() => setZoomLevel(z => Math.max(0.7, Math.round((z - 0.1) * 10) / 10))}
              disabled={zoomLevel <= 0.7}
              style={{
                backgroundColor: '#272738',
                border: 'none',
                color: zoomLevel <= 0.7 ? '#4b5563' : '#d1d5db',
                borderRadius: '4px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: zoomLevel <= 0.7 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
              }}
              title="Zoom Out"
            >
              -
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '11px',
                padding: '0 4px',
                cursor: 'pointer',
              }}
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel(z => Math.min(1.8, Math.round((z + 0.1) * 10) / 10))}
              disabled={zoomLevel >= 1.8}
              style={{
                backgroundColor: '#272738',
                border: 'none',
                color: zoomLevel >= 1.8 ? '#4b5563' : '#d1d5db',
                borderRadius: '4px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: zoomLevel >= 1.8 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
              }}
              title="Zoom In"
            >
              +
            </button>
          </div>

          {onToggleFullscreen && (
            <button
              id="map-toggle-fullscreen-btn"
              onClick={onToggleFullscreen}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                backgroundColor: isFullscreen ? '#dc2626' : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen Map'}
            >
              <span>{isFullscreen ? '✕' : '⛶'}</span>
              <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          )}
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
          viewBox={isCompleted ? "-348 -382 696 764" : "-440 -440 880 880"}
          style={{
            width: '100%',
            maxWidth: isFullscreen ? '94vh' : isCompleted ? '1060px' : '880px',
            height: 'auto',
            aspectRatio: isCompleted ? '696 / 764' : '1 / 1',
            display: 'block',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
        >
          <defs>
            <radialGradient id="green-home-system-grad" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="70%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </radialGradient>

            <radialGradient id="mecatol-grad" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#581c87" />
              <stop offset="75%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#2e1065" />
            </radialGradient>

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
            const rx = hex.x * cosT - hex.y * sinT;
            const ry = hex.x * sinT + hex.y * cosT;

            if (hex.type === 'center') {
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
                  showTileNumber={isCompleted && showTileNumbers}
                />
              );
            }

            // Check if this hex has a placed tile (including hyperlanes)
            const placed = placedTiles[hex.id];

            if (hex.type === 'home_system' && !placed) {
              const player = getPlayerForSeatIndex(players, hex.seatIndex, playerCount) || {
                name: `Player ${hex.seatIndex + 1}`,
                slotId: hex.seatIndex,
              };
              const isViewer = mySlot && mySlot.slotId === player.slotId;
              const isOrientedSeat = hex.seatIndex === activeViewerSeat;
              const blueCount = player.remainingBlue ?? player.hand?.blue?.length ?? 3;
              const redCount = player.remainingRed ?? player.hand?.red?.length ?? 2;

              return (
                <g key={hex.id}>
                  <HexTile
                    cx={rx}
                    cy={ry}
                    isHomeSystem={true}
                    playerName={player.name}
                    isViewer={isViewer || isOrientedSeat}
                    isSpeaker={!!player.isSpeaker}
                  />
                  {showTileCounts && !isCompleted && (
                    <HomeSystemTileCountBadge
                      cx={rx}
                      cy={ry}
                      blueCount={blueCount}
                      redCount={redCount}
                    />
                  )}
                </g>
              );
            }

            if (placed) {
              const isPending = pendingHexId === hex.id;
              const isHyperlane = placed.isHyperlane;
              // Hyperlane tiles keep base rotation defined in tile data plus counter-rotation by -activeViewerSeat * 60 degrees
              const baseHyperlaneRotation = placed.rotation || 0;
              const hyperlaneRotation = isHyperlane ? (baseHyperlaneRotation - activeViewerSeat * 60) : 0;

              return (
                <HexTile
                  key={hex.id}
                  cx={rx}
                  cy={ry}
                  tileId={placed.tileId}
                  label={isHyperlane ? `Hyperlane ${placed.tileId}` : `Tile ${placed.tileId}`}
                  isPlaceholder={false}
                  isPending={isPending}
                  fill="#181824"
                  stroke={isHyperlane ? '#4338ca' : placed.type === 'blue' ? '#3b82f6' : placed.type === 'red' ? '#ef4444' : '#4f46e5'}
                  strokeWidth={isHyperlane ? 1.5 : 1}
                  onMouseEnter={() => !isHyperlane && onHoverTile && onHoverTile(placed.tileId)}
                  onMouseLeave={() => !isHyperlane && onHoverTile && onHoverTile(null)}
                  showTileNumber={isCompleted && showTileNumbers && !isHyperlane}
                  rotation={hyperlaneRotation}
                />
              );
            }

            // Empty Hex Slot
            const isActiveRingHex = hex.ring === activeRing && (hex.ring !== 3 || hex.type === 'ring3');
            const isPending = pendingHexId === hex.id;
            const isClickable = isMyTurn && selectedTileId && isActiveRingHex;

            let fill = hex.ring === 1 ? '#141424' : hex.ring === 2 ? '#12121e' : '#10101a';
            let stroke = hex.ring === 1 ? '#4f46e5' : hex.ring === 2 ? '#33334d' : '#272738';
            let strokeWidth = 1;
            let strokeDasharray = 'none';

            if (isPending) {
              fill = '#36230b';
              stroke = 'none';
              strokeWidth = 0;
              strokeDasharray = 'none';
            } else if (isActiveRingHex && isMyTurn && selectedTileId) {
              fill = '#1a1a38';
              stroke = '#60a5fa';
              strokeWidth = 1;
              strokeDasharray = 'none';
            }

            return (
              <HexTile
                key={hex.id}
                cx={rx}
                cy={ry}
                tileId={isPending ? selectedTileId : null}
                label={isPending ? `Tile ${selectedTileId}` : `Ring ${hex.ring}`}
                subLabel={isPending ? 'Pending placement' : isActiveRingHex ? 'Active Ring' : ''}
                isPlaceholder={!isPending}
                isPending={isPending}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                cursor={isClickable ? 'pointer' : 'default'}
                onClick={() => isClickable && onSelectHex && onSelectHex(hex.id)}
                onMouseEnter={() => isPending && selectedTileId && onHoverTile && onHoverTile(selectedTileId)}
                onMouseLeave={() => isPending && onHoverTile && onHoverTile(null)}
              />
            );
          })}
        </svg>
      </div>

      {/* Board Guide Note (only shown during active draft, hidden when completed) */}
      {!isCompleted && (
        <div style={{ marginTop: '6px', fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
          {isMyTurn && selectedTileId
            ? 'Click an active ring hex to place your selected tile, then click Accept.'
            : 'Green tiles: Home Systems • Blue/Red badges: Remaining tiles in hand'}
        </div>
      )}
    </div>
  );
}
