import React, { useState } from 'react';
import { isAnomaly, getWormholeType } from '../data/tileData.js';

export default function TileZoomPreview({ tileId }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (!tileId) return null;

  const showImage = !imgFailed;
  const anomaly = isAnomaly(tileId);
  const wormhole = getWormholeType(tileId);

  return (
    <div
      id="tile-zoom-preview"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        backgroundColor: '#161622',
        border: 'none',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '270px',
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
          width: '234px',
          height: '234px',
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
        {showImage ? (
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
        <div style={{ display: 'flex', justifyContent: 'between' }}>
          <span>Anomaly:</span>
          <span style={{ color: anomaly ? '#f87171' : '#34d399', fontWeight: '600' }}>{anomaly ? 'Yes (Red)' : 'No (Blue)'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'between' }}>
          <span>Wormhole:</span>
          <span style={{ color: wormhole ? '#60a5fa' : '#9ca3af', fontWeight: '600' }}>{wormhole ? `${wormhole} Wormhole` : 'None'}</span>
        </div>
      </div>
    </div>
  );
}
