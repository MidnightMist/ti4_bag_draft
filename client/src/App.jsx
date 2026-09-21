import React from 'react';
import MapGrid from './components/MapGrid.jsx';
import DraftPanel from './components/DraftPanel.jsx';

export default function App() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Twilight Imperium 4 - Bag Draft & Map Builder</h1>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
        <DraftPanel />
        <MapGrid />
      </div>
    </div>
  );
}
