import React, { useState } from 'react';
import { isAnomaly, getWormholeType } from '../data/tileData.js';

// Tile radius for bottom hand tiles: enlarged to R = 64 (width ~128px, height ~110px)
const HAND_R = 64;
const HAND_H = Math.sqrt(3) * HAND_R;

function getHandHexPoints(cx, cy, radius = HAND_R) {
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
 * Pure Hexagon Tile View:
 * - No red or blue outer borders/cards
 * - No labels or text captions
 * - Pure hexagon tile artwork with subtle selection state
 */
function LargeHexTile({ tileId, isSelected, onClick, onMouseEnter, onMouseLeave }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = tileId && !imgFailed;

  const hexPoints = getHandHexPoints(0, 0, HAND_R);

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        filter: isSelected
          ? 'drop-shadow(0 0 14px #fbbf24) drop-shadow(0 0 6px #f59e0b)'
          : 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6))',
        transform: isSelected ? 'translateY(-8px) scale(1.04)' : 'none',
        transition: 'transform 0.18s ease, filter 0.18s ease',
        userSelect: 'none',
      }}
    >
      <svg
        width={HAND_R * 2 + 10}
        height={HAND_H + 10}
        viewBox={`${-(HAND_R + 5)} ${-(HAND_H / 2 + 5)} ${HAND_R * 2 + 10} ${HAND_H + 10}`}
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <clipPath id={`hand-clip-${tileId}`}>
            <polygon points={hexPoints} />
          </clipPath>
          <radialGradient id={`empty-hex-grad-${tileId}`} cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#1e1e2d" />
            <stop offset="100%" stopColor="#0f0f18" />
          </radialGradient>
        </defs>

        {/* Base Hexagon Background */}
        <polygon
          points={hexPoints}
          fill={`url(#empty-hex-grad-${tileId})`}
          stroke={isSelected ? '#fbbf24' : '#323248'}
          strokeWidth={isSelected ? 3 : 1.5}
        />

        {/* Tile image (artwork fills the entire hexagon) */}
        {showImage && (
          <image
            href={`/tiles/ST_${tileId}.png`}
            x={-HAND_R}
            y={-HAND_H / 2}
            width={HAND_R * 2}
            height={HAND_H}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#hand-clip-${tileId})`}
            onError={() => setImgFailed(true)}
          />
        )}

        {/* Top subtle stroke outline */}
        <polygon
          points={hexPoints}
          fill="none"
          stroke={isSelected ? '#fbbf24' : '#3f3f58'}
          strokeWidth={isSelected ? 3 : 1.2}
        />

        {/* Tile number fallback if image not loaded yet */}
        {!showImage && tileId && (
          <text
            x="0"
            y="6"
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="18"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            #{tileId}
          </text>
        )}
      </svg>

      {/* Temporary Debug Labels below tile */}
      {tileId && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '10px',
            color: '#9ca3af',
            textAlign: 'center',
            fontFamily: 'monospace',
            lineHeight: '1.2',
            backgroundColor: '#181824',
            padding: '3px 6px',
            borderRadius: '4px',
            border: '1px solid #28283c',
            width: '100%',
          }}
        >
          <div>{isAnomaly(tileId) ? 'Anom: Yes' : 'Anom: No'}</div>
          <div>{getWormholeType(tileId) ? `WH: ${getWormholeType(tileId)}` : 'WH: None'}</div>
        </div>
      )}
    </div>
  );
}

export default function PlayerHandPanel({ player, activeTileId, onSelectTile, onHoverTile }) {
  const blueTiles = player?.hand?.blue || [];
  const redTiles = player?.hand?.red || [];

  // Dynamically map all hand tiles (e.g. 8 tiles for 3 players: 6 Blue + 2 Red; 5 tiles for 4-8 players: 3 Blue + 2 Red)
  const displayTiles = [
    ...blueTiles.map((tileId, idx) => ({ tileId, key: `b-${tileId}-${idx}`, type: 'blue' })),
    ...redTiles.map((tileId, idx) => ({ tileId, key: `r-${tileId}-${idx}`, type: 'red' })),
  ];
  const tileCount = displayTiles.length;

  return (
    <div
      id="player-hand-panel"
      style={{
        marginTop: '20px',
        width: '100%',
        maxWidth: '920px',
        backgroundColor: '#12121c',
        border: '1px solid #262638',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          padding: '0 8px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0' }}>
          {player ? `${player.name}'s Hand` : 'Your Hand'} ({tileCount} {tileCount === 1 ? 'Tile' : 'Tiles'})
        </span>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          Click a tile to select
        </span>
      </div>

      {/* Row of Large Hexagons (up to 8 tiles) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          padding: '8px 0',
        }}
      >
        {displayTiles.length === 0 ? (
          <div style={{ color: '#9ca3af', fontSize: '13px', padding: '16px 0' }}>
            All tiles placed from hand
          </div>
        ) : (
          displayTiles.map((item, idx) => (
            <LargeHexTile
              key={`${item.key}-${idx}`}
              tileId={item.tileId}
              isSelected={activeTileId === item.tileId && item.tileId !== null}
              onClick={() => onSelectTile && item.tileId && onSelectTile(item.tileId)}
              onMouseEnter={() => item.tileId && onHoverTile && onHoverTile(item.tileId)}
              onMouseLeave={() => onHoverTile && onHoverTile(null)}
            />
          ))
        )}
      </div>
    </div>
  );
}
