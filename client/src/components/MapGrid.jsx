import React, { useState } from 'react';
import { getMecatolTileId } from '../data/tileData.js';

function HexTile({ tileId, label, isPlaceholder, fill = '#181825', stroke = '#3b3b54', strokeWidth = 1.5, strokeDasharray }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = tileId && !imgFailed;

  return (
    <g>
      {/* Background polygon */}
      <polygon
        points="0,-45 38.97,-22.5 38.97,22.5 0,45 -38.97,22.5 -38.97,-22.5"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />

      {/* Tile image if available */}
      {showImage && (
        <>
          <image
            href={`/tiles/ST_${tileId}.png`}
            x="-45"
            y="-45"
            width="90"
            height="90"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#hex-clip-shape)"
            onError={() => setImgFailed(true)}
          />
          <polygon
            points="0,-45 38.97,-22.5 38.97,22.5 0,45 -38.97,22.5 -38.97,-22.5"
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </>
      )}

      {/* Text label if no image or placeholder */}
      {(!showImage || isPlaceholder) && (
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fill={isPlaceholder ? '#6b7280' : '#ffffff'}
          fontSize={isPlaceholder ? '11' : '12'}
          fontWeight={isPlaceholder ? 'normal' : 'bold'}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {label || (tileId ? `Tile ${tileId}` : '')}
        </text>
      )}
    </g>
  );
}

export default function MapGrid({ room, mySlot }) {
  const mecatolTileId = getMecatolTileId(room?.expansions);

  return (
    <div id="map-grid-container" style={{ border: '1px solid #33334d', borderRadius: '12px', padding: '24px', backgroundColor: '#1e1e2d', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: '#f3f4f6' }}>Game Board (Hex Grid)</h3>
        {room && (
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>
            Stage 2: Board & Tile Placement
          </span>
        )}
      </div>

      <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
        <svg width="420" height="420" viewBox="-210 -210 420 420" style={{ maxWidth: '100%', height: 'auto' }}>
          <defs>
            <clipPath id="hex-clip-shape">
              <polygon points="0,-45 38.97,-22.5 38.97,22.5 0,45 -38.97,22.5 -38.97,-22.5" />
            </clipPath>
          </defs>

          {/* Central tile: Mecatol Rex (18 or 112 with Thunder's Edge) */}
          <HexTile
            tileId={mecatolTileId}
            label={`Mecatol Rex (${mecatolTileId})`}
            fill="#3b2d54"
            stroke="#a78bfa"
            strokeWidth={2}
          />

          {/* Ring 1 surrounding hexes */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const dist = 78;
            const cx = dist * Math.sin(rad);
            const cy = -dist * Math.cos(rad);
            return (
              <g key={i} transform={`translate(${cx}, ${cy})`}>
                <HexTile
                  label="Ring 1"
                  isPlaceholder={true}
                  fill="#181825"
                  stroke="#3b3b54"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {room && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {room.players.map((p) => (
            <div
              key={p.slotId}
              style={{
                backgroundColor: p.isSpeaker ? '#312e81' : '#14141f',
                border: `1px solid ${p.isSpeaker ? '#818cf8' : '#33334d'}`,
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#e5e7eb',
              }}
            >
              {p.isSpeaker && '👑 '}
              <strong>{p.name}</strong>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                3 Blue / 2 Red
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
