import React, { useState } from 'react';
import { FACTIONS } from '../data/factionsData.js';
import { isAnomaly } from '../data/tileData.js';
import DraftItemZoomPreview from './DraftItemZoomPreview.jsx';

export default function DraftingPhaseView({
  room,
  userId,
  myClaimedSlot,
  totalSlots,
  copied,
  copyRoomUrl,
  socket,
  chipStyle,
  copyBtnStyle,
  headerCardStyle,
}) {
  // Current active player: strictly user's claimed slot or the active seat
  const activePlayer = myClaimedSlot || room.players.find(p => p.claimedBy === userId) || room.players[0];

  // Hover state for zoomed hint preview (works on tiles and factions across all 3 zones)
  const [hoveredItem, setHoveredItem] = useState(null);

  // Selected item in central current hand (ready for picking when drafting logic is introduced)
  const [selectedDraftItemId, setSelectedDraftItemId] = useState(null);

  const draftHand = activePlayer.draftHand || { tiles: [], factions: [] };
  const seenItems = activePlayer.seenItems || { tiles: [], factions: [] };
  const pickedItems = activePlayer.pickedItems || { tiles: [], factions: [] };

  const totalPlayersCount = room.players.length;

  return (
    <div id="drafting-phase-container" style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 8px 32px 8px' }}>
      {/* Top Header Card */}
      <div style={headerCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Bag Draft — Active Drafting Phase
            </span>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', color: '#f9fafb' }}>
              Room ID: <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{room.id}</span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              id="copy-invite-link-btn"
              onClick={copyRoomUrl}
              style={copyBtnStyle(copied)}
            >
              {copied ? '✓ Link Copied!' : '🔗 Copy Link for Players'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={chipStyle}>👥 Players: {totalSlots}</span>
          <span style={chipStyle}>⚖️ Balanced Tiles</span>
          {room.settings.expansions.pok && <span style={chipStyle}>📦 PoK</span>}
          {room.settings.expansions.thundersEdge && <span style={chipStyle}>⚡ Thunder's Edge</span>}
          <span style={{ ...chipStyle, backgroundColor: '#1d4ed8', color: '#bfdbfe' }}>
            🎒 Step 2: Bag Draft
          </span>
          <span style={{ ...chipStyle, backgroundColor: '#1f2937', color: '#9ca3af' }}>
            Controlling: <strong style={{ color: '#f3f4f6' }}>{activePlayer.name}</strong>
          </span>
        </div>
      </div>

      {/* Main 2-Column Grid: Left (3-Part Draft Screen) | Right Sidebar (Players Progress: Picks Count Only) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 290px',
          gap: '20px',
          marginTop: '20px',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: 3-Part Draft Board (Top: Seen items strip | Center: Current Choice Hand | Bottom: Picked Items) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* 1. TOP SECTION: Strip of Seen Tiles and Factions */}
          <div
            id="draft-seen-section"
            style={{
              backgroundColor: '#12121c',
              border: '1px solid #232336',
              borderRadius: '12px',
              padding: '14px 18px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>👁️</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#e5e7eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Seen Elements During Draft
                </span>
                <span style={{ fontSize: '11px', color: '#9ca3af', backgroundColor: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>
                  {seenItems.factions.length} factions, {seenItems.tiles.length} tiles
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>
                Hover for zoomed preview
              </span>
            </div>

            {/* Strip of Seen Elements */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                paddingBottom: '6px',
                alignItems: 'center',
              }}
            >
              {/* Seen Factions (Compact Horizontal Cards) */}
              {seenItems.factions.map(factionId => {
                const faction = FACTIONS.find(f => f.id === factionId);
                if (!faction) return null;
                return (
                  <div
                    key={`seen-faction-${factionId}`}
                    onMouseEnter={() => setHoveredItem({ type: 'faction', factionId })}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      flexShrink: 0,
                      width: '130px',
                      backgroundColor: '#181828',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'help',
                      transition: 'transform 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    <div style={{ width: '100%', aspectRatio: '2800 / 1625', backgroundColor: '#09090f' }}>
                      <img
                        src={`/factions/${encodeURIComponent(faction.filename)}`}
                        alt={faction.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    </div>
                    <div
                      style={{
                        padding: '4px 6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#d1d5db',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'center',
                        backgroundColor: '#1f1f33',
                      }}
                      title={faction.name}
                    >
                      {faction.name}
                    </div>
                  </div>
                );
              })}

              {/* Separator if both exist */}
              {seenItems.factions.length > 0 && seenItems.tiles.length > 0 && (
                <div style={{ width: '1px', height: '60px', backgroundColor: '#2f2f45', margin: '0 4px', flexShrink: 0 }} />
              )}

              {/* Seen Tiles (Compact Hexagonal / Rounded Thumbnails) */}
              {seenItems.tiles.map(tileId => {
                const red = isAnomaly(tileId);
                return (
                  <div
                    key={`seen-tile-${tileId}`}
                    onMouseEnter={() => setHoveredItem({ type: 'tile', tileId })}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      flexShrink: 0,
                      width: '64px',
                      height: '64px',
                      backgroundColor: '#161624',
                      border: `1.5px solid ${red ? '#ef4444' : '#3b82f6'}`,
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'help',
                      padding: '2px',
                    }}
                  >
                    <img
                      src={`/tiles/ST_${tileId}.png`}
                      alt={`Tile ${tileId}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: '#fff',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        padding: '0 4px',
                        borderRadius: '3px',
                      }}
                    >
                      #{tileId}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. CENTER SECTION: Current Choice (Most Prominent Zone) */}
          <div
            id="draft-current-choice-section"
            style={{
              backgroundColor: '#171724',
              border: '2px solid #28283c',
              borderRadius: '14px',
              padding: '22px',
              boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#f9fafb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🎯</span>
                  <span>Current Draft Hand</span>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9ca3af' }}>
                  Available elements to draft from. Hover over any tile or faction sheet for an enlarged preview.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#1e3a8a', color: '#93c5fd', fontWeight: 'bold' }}>
                  2 Factions Available
                </span>
                <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#064e3b', color: '#6ee7b7', fontWeight: 'bold' }}>
                  5 System Tiles Available
                </span>
              </div>
            </div>

            {/* Factions Section (2 Large Cards side-by-side or stacked cleanly) */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#d1d5db', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Factions to Draft ({draftHand.factions.length})
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '16px',
                }}
              >
                {draftHand.factions.map(factionId => {
                  const faction = FACTIONS.find(f => f.id === factionId);
                  if (!faction) return null;
                  const isSelected = selectedDraftItemId === `faction-${factionId}`;

                  return (
                    <div
                      key={`cur-faction-${factionId}`}
                      onClick={() => setSelectedDraftItemId(`faction-${factionId}`)}
                      onMouseEnter={() => setHoveredItem({ type: 'faction', factionId })}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{
                        backgroundColor: isSelected ? '#1e293b' : '#111827',
                        border: `2px solid ${isSelected ? '#3b82f6' : '#2d2d42'}`,
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 0 20px rgba(59, 130, 246, 0.45)' : '0 2px 10px rgba(0,0,0,0.3)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          backgroundColor: isSelected ? '#1e3a8a' : '#181826',
                          borderBottom: '1px solid #2d2d42',
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f3f4f6' }}>
                          {faction.name}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {faction.expansion === 'pok' ? 'PoK' : faction.expansion === 'thundersEdge' ? "Thunder's Edge" : 'Base'}
                        </span>
                      </div>

                      <div style={{ position: 'relative', width: '100%', aspectRatio: '2800 / 1625', backgroundColor: '#09090f' }}>
                        <img
                          src={`/factions/${encodeURIComponent(faction.filename)}`}
                          alt={faction.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* System Tiles Section (5 Large Tiles in responsive flex row) */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#d1d5db', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                System Tiles to Draft ({draftHand.tiles.length})
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '14px',
                  justifyContent: 'flex-start',
                }}
              >
                {draftHand.tiles.map(tileId => {
                  const red = isAnomaly(tileId);
                  const isSelected = selectedDraftItemId === `tile-${tileId}`;

                  return (
                    <div
                      key={`cur-tile-${tileId}`}
                      onClick={() => setSelectedDraftItemId(`tile-${tileId}`)}
                      onMouseEnter={() => setHoveredItem({ type: 'tile', tileId })}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{
                        width: '130px',
                        height: '130px',
                        backgroundColor: isSelected ? (red ? '#450a0a' : '#172554') : '#111827',
                        border: `2.5px solid ${isSelected ? '#fbbf24' : red ? '#ef4444' : '#3b82f6'}`,
                        borderRadius: '12px',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 0 16px rgba(251, 191, 36, 0.5)' : '0 2px 10px rgba(0,0,0,0.3)',
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      <img
                        src={`/tiles/ST_${tileId}.png`}
                        alt={`Tile ${tileId}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#ffffff',
                          backgroundColor: 'rgba(0,0,0,0.75)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        #{tileId}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. BOTTOM SECTION: Elements Picked By Player So Far */}
          <div
            id="draft-picked-section"
            style={{
              backgroundColor: '#12121c',
              border: '1px solid #232336',
              borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>🎒</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#e5e7eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Your Picked Elements
                </span>
                <span style={{ fontSize: '11px', color: '#9ca3af', backgroundColor: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>
                  {pickedItems.factions.length} factions, {pickedItems.tiles.length} tiles
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>
                Elements you choose will accumulate here
              </span>
            </div>

            {pickedItems.tiles.length === 0 && pickedItems.factions.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  border: '1.5px dashed #2a2a3d',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '13px',
                }}
              >
                No elements picked yet. When the draft begins, your chosen tiles and factions will be stored here.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center' }}>
                {/* Picked Factions */}
                {pickedItems.factions.map(factionId => {
                  const faction = FACTIONS.find(f => f.id === factionId);
                  if (!faction) return null;
                  return (
                    <div
                      key={`picked-faction-${factionId}`}
                      onMouseEnter={() => setHoveredItem({ type: 'faction', factionId })}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{
                        flexShrink: 0,
                        width: '140px',
                        backgroundColor: '#181828',
                        border: '1.5px solid #10b981',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'help',
                      }}
                    >
                      <div style={{ width: '100%', aspectRatio: '2800 / 1625', backgroundColor: '#09090f' }}>
                        <img
                          src={`/factions/${encodeURIComponent(faction.filename)}`}
                          alt={faction.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                        />
                      </div>
                      <div style={{ padding: '4px 6px', fontSize: '11px', fontWeight: 'bold', color: '#6ee7b7', textAlign: 'center' }}>
                        {faction.name}
                      </div>
                    </div>
                  );
                })}

                {/* Picked Tiles */}
                {pickedItems.tiles.map(tileId => {
                  const red = isAnomaly(tileId);
                  return (
                    <div
                      key={`picked-tile-${tileId}`}
                      onMouseEnter={() => setHoveredItem({ type: 'tile', tileId })}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{
                        flexShrink: 0,
                        width: '70px',
                        height: '70px',
                        backgroundColor: '#161624',
                        border: `2px solid ${red ? '#ef4444' : '#3b82f6'}`,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        cursor: 'help',
                        padding: '2px',
                      }}
                    >
                      <img
                        src={`/tiles/ST_${tileId}.png`}
                        alt={`Tile ${tileId}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '2px',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          color: '#fff',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          padding: '0 4px',
                          borderRadius: '3px',
                        }}
                      >
                        #{tileId}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR: Secret Players Status (ONLY shows how many picks each player made) */}
        <div style={{ position: 'sticky', top: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              backgroundColor: '#171724',
              border: '1px solid #28283c',
              borderRadius: '12px',
              padding: '18px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#f3f4f6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Players Draft Status
              </h4>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                {totalPlayersCount} Players
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {room.players.map((p) => {
                const isMe = Boolean(userId) && Boolean(p.claimedBy) && p.claimedBy === userId;
                const picksMade = p.draftPicksCount || (p.pickedItems ? (p.pickedItems.tiles?.length || 0) + (p.pickedItems.factions?.length || 0) : 0);

                return (
                  <div
                    key={p.slotId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: isMe ? '#1e293b' : '#111827',
                      border: `1px solid ${isMe ? '#3b82f6' : '#272738'}`,
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: isMe ? 'bold' : 'normal', color: isMe ? '#93c5fd' : '#e5e7eb' }}>
                        {p.name}
                      </span>
                      {isMe && (
                        <span style={{ fontSize: '9px', backgroundColor: '#2563eb', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                          YOU
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        Picks:
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#38bdf8',
                          backgroundColor: '#0f172a',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid #1e293b',
                        }}
                      >
                        {picksMade}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '14px', fontSize: '11px', color: '#6b7280', textAlign: 'center', lineHeight: '1.4' }}>
              🔒 Specific card and tile hands are secret. Only the count of picks made by each player is visible.
            </div>
          </div>
        </div>
      </div>

      {/* Enlarged Zoom Preview Hint for any hovered tile or faction across all zones */}
      <DraftItemZoomPreview hoveredItem={hoveredItem} />
    </div>
  );
}
