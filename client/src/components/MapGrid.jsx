import React from 'react';

export default function MapGrid({ room, mySlot }) {
  return (
    <div id="map-grid-container" style={{ border: '1px solid #33334d', borderRadius: '12px', padding: '24px', backgroundColor: '#1e1e2d', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: '#f3f4f6' }}>Игровое поле (Hex Grid)</h3>
        {room && (
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>
            Этап 2: Визуализация поля и тайлов (в разработке)
          </span>
        )}
      </div>

      <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
        <svg width="420" height="420" viewBox="-210 -210 420 420" style={{ maxWidth: '100%', height: 'auto' }}>
          {/* Central tile: Mecatol Rex */}
          <polygon points="0,-45 38.97,-22.5 38.97,22.5 0,45 -38.97,22.5 -38.97,-22.5" fill="#3b2d54" stroke="#a78bfa" strokeWidth="2" />
          <text x="0" y="5" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">Mecatol Rex (18)</text>

          {/* Placeholder for Ring 1 surrounding hexes */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const dist = 78;
            const cx = dist * Math.sin(rad);
            const cy = -dist * Math.cos(rad);
            return (
              <g key={i} transform={`translate(${cx}, ${cy})`}>
                <polygon points="0,-45 38.97,-22.5 38.97,22.5 0,45 -38.97,22.5 -38.97,-22.5" fill="#181825" stroke="#3b3b54" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="0" y="4" textAnchor="middle" fill="#6b7280" fontSize="11">Кольцо 1</text>
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
                3 синих / 2 красных
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
