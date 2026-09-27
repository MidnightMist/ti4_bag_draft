import React, { useState } from 'react';
import { isAnomaly, getWormholeType } from '../data/tileData.js';
import { FACTIONS } from '../data/factionsData.js';

export default function DraftItemZoomPreview({ hoveredItem }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!hoveredItem || (!hoveredItem.tileId && !hoveredItem.factionId)) {
    return null;
  }

  // Large High-Legibility Faction Zoom Preview located at the top of the viewport
  if (hoveredItem.type === 'faction' || hoveredItem.factionId) {
    const faction = FACTIONS.find(f => f.id === hoveredItem.factionId);
    if (!faction) return null;

    return (
      <div
        id="faction-zoom-preview"
        style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 1000,
          backgroundColor: '#0d0d17',
          border: '2px solid #3b82f6',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(59, 130, 246, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 'min(780px, calc(100vw - 48px))',
          animation: 'fadeIn 0.15s ease-out',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🔍</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Enlarged Faction Sheet: {faction.name}
            </span>
          </div>
          <span
            style={{
              fontSize: '11px',
              padding: '3px 10px',
              borderRadius: '6px',
              backgroundColor: '#1e293b',
              color: '#60a5fa',
              border: '1px solid #3b82f6',
              fontWeight: '600',
            }}
          >
            {faction.expansion === 'pok' ? 'Prophecy of Kings' : faction.expansion === 'thundersEdge' ? "Thunder's Edge" : 'Base Game'}
          </span>
        </div>

        {/* Large Sheet View with crisp readable dimensions */}
        <div
          style={{
            width: '100%',
            aspectRatio: '2800 / 1625',
            borderRadius: '10px',
            overflow: 'hidden',
            backgroundColor: '#07070d',
            border: '1px solid #28283c',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
          }}
        >
          <img
            src={`/factions/${encodeURIComponent(faction.filename)}`}
            alt={faction.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      </div>
    );
  }

  // Tile Zoom Preview (positioned at the top right as well, keeping bottom clear)
  const tileId = hoveredItem.tileId;
  const anomaly = isAnomaly(tileId);
  const wormhole = getWormholeType(tileId);

  return (
    <div
      id="draft-tile-zoom-preview"
      style={{
        position: 'fixed',
        top: '20px',
        right: '24px',
        zIndex: 1000,
        backgroundColor: '#161622',
        border: '2px solid #374151',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '300px',
        animation: 'fadeIn 0.15s ease-out',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Tile Preview #{tileId}
      </div>

      <div
        style={{
          width: '260px',
          height: '260px',
          borderRadius: '12px',
          overflow: 'visible',
          backgroundColor: '#0f0f18',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {!imgFailed ? (
          <img
            src={`/tiles/ST_${tileId}.png`}
            alt={`Tile ${tileId}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>#{tileId}</div>
        )}
      </div>

      <div style={{ marginTop: '12px', width: '100%', fontSize: '11px', color: '#d1d5db', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Anomaly:</span>
          <span style={{ color: anomaly ? '#f87171' : '#34d399', fontWeight: '600' }}>{anomaly ? 'Yes (Red)' : 'No (Blue)'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Wormhole:</span>
          <span style={{ color: wormhole ? '#60a5fa' : '#9ca3af', fontWeight: '600' }}>{wormhole ? `${wormhole} Wormhole` : 'None'}</span>
        </div>
      </div>
    </div>
  );
}
