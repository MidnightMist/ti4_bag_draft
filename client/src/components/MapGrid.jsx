import React from 'react';

export default function MapGrid() {
  return (
    <div style={{ border: '1px solid #444', borderRadius: '8px', padding: '16px', backgroundColor: '#242435', minWidth: '400px' }}>
      <h2>Карта (Hex Grid)</h2>
      <svg width="360" height="360" viewBox="-180 -180 360 360">
        {/* Placeholder hex grid for Mecatol Rex and Ring 1 */}
        <polygon points="0,-40 34.6,-20 34.6,20 0,40 -34.6,20 -34.6,-20" fill="#3b2d54" stroke="#8b72be" strokeWidth="2" />
        <text x="0" y="5" textAnchor="middle" fill="#fff" fontSize="12">Mecatol Rex (18)</text>
      </svg>
    </div>
  );
}
