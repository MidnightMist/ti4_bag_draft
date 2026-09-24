import React, { useState } from 'react';
import { isAnomaly, hasAlphaWormhole, hasBetaWormhole } from '../data/tileData.js';

function HandTileCard({ tileId, type, label, tier, isSelected, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  const isBlue = type === 'blue';
  const showImage = tileId && !imgFailed;

  const borderColor = isSelected
    ? '#fbbf24'
    : isBlue
    ? '#3b82f6'
    : '#ef4444';

  const bgColor = isSelected
    ? '#1e293b'
    : isBlue
    ? 'rgba(30, 58, 138, 0.35)'
    : 'rgba(127, 29, 29, 0.35)';

  const anomaly = tileId ? isAnomaly(tileId) : false;
  const alphaWormhole = tileId ? hasAlphaWormhole(tileId) : false;
  const betaWormhole = tileId ? hasBetaWormhole(tileId) : false;

  return (
    <div
      onClick={onClick}
      style={{
        width: '110px',
        minHeight: '135px',
        backgroundColor: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '10px',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        boxShadow: isSelected ? '0 0 16px rgba(251, 191, 36, 0.45)' : '0 2px 8px rgba(0,0,0,0.3)',
        transform: isSelected ? 'translateY(-4px)' : 'none',
        transition: 'all 0.18s ease',
        userSelect: 'none',
      }}
    >
      {/* Top Header Tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '1px 5px',
            borderRadius: '4px',
            backgroundColor: isBlue ? '#1d4ed8' : '#b91c1c',
            color: '#ffffff',
          }}
        >
          {isBlue ? 'Blue' : 'Red'}
        </span>
        {tier && (
          <span style={{ fontSize: '10px', color: '#93c5fd', fontWeight: '600' }}>
            {tier.toUpperCase()}
          </span>
        )}
      </div>

      {/* Hex Tile Artwork Preview */}
      <div
        style={{
          width: '64px',
          height: '64px',
          margin: '6px 0',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="64" height="64" viewBox="-32 -32 64 64">
          <defs>
            <clipPath id={`hand-hex-clip-${tileId || label}`}>
              <polygon points="-30,0 -15,-26 15,-26 30,0 15,26 -15,26" />
            </clipPath>
          </defs>

          {/* Hex Background */}
          <polygon
            points="-30,0 -15,-26 15,-26 30,0 15,26 -15,26"
            fill={isBlue ? '#1e3a8a' : '#7f1d1d'}
            stroke={borderColor}
            strokeWidth="1.5"
          />

          {/* Tile image if available */}
          {showImage && (
            <image
              href={`/tiles/ST_${tileId}.png`}
              x="-30"
              y="-30"
              width="60"
              height="60"
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#hand-hex-clip-${tileId || label})`}
              onError={() => setImgFailed(true)}
            />
          )}

          {/* Center number */}
          <text
            x="0"
            y={showImage ? '22' : '4'}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="12"
            fontWeight="bold"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
          >
            {tileId ? `#${tileId}` : '—'}
          </text>
        </svg>
      </div>

      {/* Footer details: Name / tags */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#e5e7eb' }}>
          {tileId ? `Tile ${tileId}` : label}
        </div>
        <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px', display: 'flex', justifyContent: 'center', gap: '3px' }}>
          {anomaly && <span style={{ color: '#f87171' }}>Anomaly</span>}
          {alphaWormhole && <span style={{ color: '#fbbf24' }}>α Wormhole</span>}
          {betaWormhole && <span style={{ color: '#fbbf24' }}>β Wormhole</span>}
          {!anomaly && !alphaWormhole && !betaWormhole && (
            <span>{isBlue ? 'Planetary' : 'Hazard'}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlayerHandPanel({ player, activeTileId, onSelectTile }) {
  const blueTiles = player?.hand?.blue || [];
  const redTiles = player?.hand?.red || [];

  // Default placeholders if hands not yet dealt
  const displayBlue = [
    blueTiles[0] || null,
    blueTiles[1] || null,
    blueTiles[2] || null,
  ];

  const displayRed = [
    redTiles[0] || null,
    redTiles[1] || null,
  ];

  return (
    <div
      id="player-hand-panel"
      style={{
        marginTop: '16px',
        width: '100%',
        maxWidth: '740px',
        backgroundColor: '#13131e',
        border: '1px solid #28283c',
        borderRadius: '12px',
        padding: '14px 18px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px' }}>🃏</span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#f3f4f6' }}>
            {player ? `${player.name}'s Hand` : 'Your Hand'}
          </span>
          <span
            style={{
              fontSize: '11px',
              color: '#9ca3af',
              backgroundColor: '#1f2937',
              padding: '2px 8px',
              borderRadius: '10px',
            }}
          >
            3 Blue • 2 Red Tiles
          </span>
        </div>

        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          Placement Phase (Select tile when active)
        </span>
      </div>

      {/* Row of 5 Tiles */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {displayBlue.map((tileId, idx) => (
          <HandTileCard
            key={`blue-${idx}`}
            tileId={tileId}
            type="blue"
            tier={idx === 0 ? 'Tier 1' : idx === 1 ? 'Tier 2' : 'Tier 3'}
            label={`Blue ${idx + 1}`}
            isSelected={activeTileId === tileId && tileId !== null}
            onClick={() => onSelectTile && tileId && onSelectTile(tileId)}
          />
        ))}

        {displayRed.map((tileId, idx) => (
          <HandTileCard
            key={`red-${idx}`}
            tileId={tileId}
            type="red"
            label={`Red ${idx + 1}`}
            isSelected={activeTileId === tileId && tileId !== null}
            onClick={() => onSelectTile && tileId && onSelectTile(tileId)}
          />
        ))}
      </div>
    </div>
  );
}
