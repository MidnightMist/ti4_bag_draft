import React, { useState, useEffect } from 'react';
import { FACTIONS } from '../data/factionsData.js';
import { isAnomaly, isRedTile } from '../data/tileData.js';
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
  // Allow viewing/controlling claimed slot or any active seat in dev/testing
  const initialSlotId = myClaimedSlot ? myClaimedSlot.slotId : (room.players.find(p => p.claimedBy === userId)?.slotId ?? 0);
  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId);

  // Sync selectedSlotId if myClaimedSlot changes
  useEffect(() => {
    if (myClaimedSlot) {
      setSelectedSlotId(myClaimedSlot.slotId);
    }
  }, [myClaimedSlot]);

  const activePlayer = room.players.find(p => p.slotId === selectedSlotId) || myClaimedSlot || room.players[0];

  // Hover state for zoomed hint preview
  const [hoveredItem, setHoveredItem] = useState(null);

  // Selected item in central current hand to pick
  const [selectedItem, setSelectedItem] = useState(null); // { type: 'faction'|'tile', id }

  // User feedback banner for action errors / quota warnings (replaces window.alert)
  const [actionFeedback, setActionFeedback] = useState(null);

  // Reset selection and feedback when active player or round index changes
  useEffect(() => {
    setSelectedItem(null);
    setActionFeedback(null);
  }, [activePlayer?.slotId, room.draftState?.roundIndex]);

  const draftHand = activePlayer.draftHand || { tiles: [], factions: [] };
  const seenItems = activePlayer.seenItems || { tiles: [], factions: [] };
  const pickedItems = activePlayer.pickedItems || { tiles: [], factions: [] };

  const pendingSelections = room.draftState?.pendingSelections || {};
  const hasSubmitted = Boolean(pendingSelections[activePlayer.slotId]);

  // Quota calculation for validation & force pass check
  const playerCount = room.settings?.playerCount || totalSlots || room.players.length;
  const maxBlue = playerCount === 3 ? 6 : 3;
  const maxRed = 2;
  const maxFactions = 2;

  const pickedTiles = pickedItems.tiles || [];
  const pickedFactions = pickedItems.factions || [];
  const blueCount = pickedTiles.filter(t => !isRedTile(t)).length;
  const redCount = pickedTiles.filter(t => isRedTile(t)).length;
  const factionCount = pickedFactions.length;

  const hasBlueRoom = blueCount < maxBlue;
  const hasRedRoom = redCount < maxRed;
  const hasFactionRoom = factionCount < maxFactions;

  // A player can take a tile/faction from hand ONLY IF they have room for that specific category
  const canTakeAnyItemInHand = (draftHand.tiles || []).some(t => {
    const isRed = isRedTile(t);
    return isRed ? hasRedRoom : hasBlueRoom;
  }) || ((draftHand.factions || []).length > 0 && hasFactionRoom);

  // If player cannot take ANY item currently in hand because quotas are full or hand is empty, they MUST pass
  const mustPass = !canTakeAnyItemInHand;

  const handleConfirmPick = () => {
    if (!socket || !activePlayer || hasSubmitted) return;

    if (!selectedItem) {
      if (mustPass) {
        handlePassTurn();
      } else {
        setActionFeedback('Please select an item from the current hand, or click "Pass Turn" to skip.');
      }
      return;
    }

    const payload = {
      roomId: room.id,
      slotId: activePlayer.slotId,
      itemType: selectedItem.type,
      itemId: selectedItem.id,
    };

    socket.emit('draft_pick', payload);
    setSelectedItem(null);
    setActionFeedback(null);
  };

  const handlePassTurn = () => {
    if (!socket || !activePlayer || hasSubmitted) return;

    const payload = {
      roomId: room.id,
      slotId: activePlayer.slotId,
      itemType: 'pass',
      itemId: null,
    };

    socket.emit('draft_pick', payload);
    setSelectedItem(null);
    setActionFeedback(null);
  };

  const totalPlayersCount = room.players.length;

  return (
    <div id="drafting-phase-container" style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 8px 32px 8px' }}>
      {/* Top Header Card */}
      <div style={headerCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Bag Draft — Active Round ({ (room.draftState?.roundIndex || 0) + 1 } / 7)
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
          <span style={{ ...chipStyle, backgroundColor: '#1d4ed8', color: '#bfdbfe' }}>
            🎒 Pick {blueCount}/{maxBlue} Blue, {redCount}/{maxRed} Red, {factionCount}/{maxFactions} Factions
          </span>
          <span style={{ ...chipStyle, backgroundColor: '#1f2937', color: '#9ca3af' }}>
            Controlling: <strong style={{ color: '#f3f4f6' }}>{activePlayer.name}</strong>
          </span>
        </div>
      </div>

      {actionFeedback && (
        <div style={{
          marginTop: '16px',
          backgroundColor: '#451a03',
          border: '1px solid #f59e0b',
          color: '#fef3c7',
          padding: '12px 18px',
          borderRadius: '8px',
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            style={{ background: 'none', border: 'none', color: '#fde68a', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 300px',
          gap: '20px',
          marginTop: '20px',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: 3-Part Draft Board */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* 1. TOP SECTION: Strip of Seen Elements */}
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

            <div
              style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                paddingBottom: '6px',
                alignItems: 'center',
              }}
            >
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

              {seenItems.factions.length > 0 && seenItems.tiles.length > 0 && (
                <div style={{ width: '1px', height: '60px', backgroundColor: '#2f2f45', margin: '0 4px', flexShrink: 0 }} />
              )}

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

          {/* 2. CENTER SECTION: Current Choice (Hand received in this round) */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#f9fafb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🎯</span>
                  <span>Current Hand to Draft From</span>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9ca3af' }}>
                  Select ONE item to keep and pick. Unselected items will be passed clockwise to the next player.
                </p>
              </div>

              {hasSubmitted ? (
                <div style={{ backgroundColor: '#064e3b', color: '#34d399', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', border: '1px solid #10b981' }}>
                  ✓ Selection Submitted! Waiting for other players...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  {mustPass && (
                    <div style={{
                      backgroundColor: '#7f1d1d',
                      color: '#fef2f2',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: '1px solid #ef4444',
                      maxWidth: '480px',
                      lineHeight: '1.4'
                    }}>
                      ⚠️ <strong>No Valid Items to Take:</strong> All available items in this hand exceed your quota limits ({blueCount}/{maxBlue} Blue, {redCount}/{maxRed} Red, {factionCount}/{maxFactions} Factions). Click "Pass Turn" to pass this hand to the next player.
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      id="pass-draft-turn-btn"
                      onClick={handlePassTurn}
                      style={{
                        backgroundColor: mustPass ? '#b91c1c' : '#334155',
                        color: '#fff',
                        border: mustPass ? '2px solid #ef4444' : '1px solid #475569',
                        borderRadius: '8px',
                        padding: '10px 18px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: mustPass ? '0 0 16px rgba(239, 68, 68, 0.45)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      title="Pass this hand to the next player clockwise without picking"
                    >
                      {mustPass ? '⏭️ Pass Turn (No valid items)' : '⏭️ Pass Turn'}
                    </button>

                    <button
                      id="confirm-draft-pick-btn"
                      onClick={handleConfirmPick}
                      disabled={!selectedItem}
                      style={{
                        backgroundColor: selectedItem ? '#2563eb' : '#27273a',
                        color: selectedItem ? '#fff' : '#6b7280',
                        border: selectedItem ? '2px solid #60a5fa' : '1px solid #374151',
                        borderRadius: '8px',
                        padding: '10px 22px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: selectedItem ? 'pointer' : 'not-allowed',
                        boxShadow: selectedItem ? '0 0 16px rgba(37, 99, 235, 0.4)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {selectedItem
                        ? `✓ Confirm Pick (${selectedItem.type === 'faction' ? 'Faction' : 'Tile'}) & Pass`
                        : mustPass
                        ? 'Cannot Pick (Quota Full)'
                        : 'Select an Item to Pick'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Factions Section */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#d1d5db', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Factions Available ({draftHand.factions.length})
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '16px',
                }}
              >
                {draftHand.factions.map(factionId => {
                  const faction = FACTIONS.find(f => f.id === factionId);
                  if (!faction) return null;
                  const isSelected = selectedItem?.type === 'faction' && selectedItem?.id === factionId;
                  const canTake = hasFactionRoom;

                  return (
                    <div
                      key={`cur-faction-${factionId}`}
                      onClick={() => {
                        if (hasSubmitted) return;
                        if (!canTake) {
                          setActionFeedback(`Cannot pick faction: You already have reached your maximum of ${maxFactions} factions!`);
                          return;
                        }
                        setActionFeedback(null);
                        setSelectedItem({ type: 'faction', id: factionId });
                      }}
                      onMouseEnter={() => setHoveredItem({ type: 'faction', factionId })}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{
                        backgroundColor: isSelected ? '#1e293b' : canTake ? '#111827' : '#121218',
                        border: `2.5px solid ${isSelected ? '#3b82f6' : canTake ? '#2d2d42' : '#7f1d1d'}`,
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: hasSubmitted ? 'default' : canTake ? 'pointer' : 'not-allowed',
                        opacity: canTake ? 1 : 0.6,
                        boxShadow: isSelected ? '0 0 20px rgba(59, 130, 246, 0.45)' : '0 2px 10px rgba(0,0,0,0.3)',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                    >
                      {!canTake && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, backgroundColor: '#991b1b', color: '#fca5a5', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                          Quota Full ({maxFactions}/{maxFactions})
                        </div>
                      )}
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
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: canTake ? '#f3f4f6' : '#9ca3af' }}>
                          {faction.name} {isSelected && '✓ (Selected)'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {faction.expansion === 'pok' ? 'PoK' : 'Base'}
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

            {/* System Tiles Section */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#d1d5db', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                System Tiles Available ({draftHand.tiles.length})
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
                  const red = isRedTile(tileId);
                  const isSelected = selectedItem?.type === 'tile' && selectedItem?.id === tileId;
                  const canTake = red ? hasRedRoom : hasBlueRoom;

                  return (
                    <div
                      key={`cur-tile-${tileId}`}
                      onClick={() => {
                        if (hasSubmitted) return;
                        if (!canTake) {
                          setActionFeedback(`Cannot pick tile: You already have your maximum ${red ? `${maxRed} red` : `${maxBlue} blue`} tiles!`);
                          return;
                        }
                        setActionFeedback(null);
                        setSelectedItem({ type: 'tile', id: tileId });
                      }}
                      onMouseEnter={() => setHoveredItem({ type: 'tile', tileId })}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{
                        width: '130px',
                        height: '130px',
                        backgroundColor: isSelected ? (red ? '#450a0a' : '#172554') : canTake ? '#111827' : '#121218',
                        border: `2.5px solid ${isSelected ? '#fbbf24' : canTake ? (red ? '#ef4444' : '#3b82f6') : '#7f1d1d'}`,
                        borderRadius: '12px',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        cursor: hasSubmitted ? 'default' : canTake ? 'pointer' : 'not-allowed',
                        opacity: canTake ? 1 : 0.6,
                        boxShadow: isSelected ? '0 0 16px rgba(251, 191, 36, 0.5)' : '0 2px 10px rgba(0,0,0,0.3)',
                      }}
                    >
                      {!canTake && (
                        <div style={{ position: 'absolute', top: '4px', left: '4px', right: '4px', zIndex: 10, backgroundColor: '#991b1b', color: '#fca5a5', padding: '1px 0', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', textAlign: 'center' }}>
                          Quota Full
                        </div>
                      )}
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
                        #{tileId} {isSelected && '✓'}
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
                  Your Picked Elements (Hand)
                </span>
                <span style={{ fontSize: '11px', color: '#9ca3af', backgroundColor: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>
                  {factionCount}/2 factions, {pickedTiles.length}/5 tiles ({blueCount} blue, {redCount} red)
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>
                Target: 3 Blue, 2 Red, 2 Factions
              </span>
            </div>

            {pickedTiles.length === 0 && pickedFactions.length === 0 ? (
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
                No elements picked yet. Your chosen tiles and factions will accumulate here as you draft.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center' }}>
                {pickedFactions.map(factionId => {
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

                {pickedTiles.map(tileId => {
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

        {/* RIGHT SIDEBAR: Players Status */}
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
                Round { (room.draftState?.roundIndex || 0) + 1 } / 7
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {room.players.map((p) => {
                const isMe = Boolean(userId) && Boolean(p.claimedBy) && p.claimedBy === userId;
                const isViewing = p.slotId === selectedSlotId;
                const picksMade = p.draftPicksCount || 0;
                const submitted = Boolean(pendingSelections[p.slotId]);

                return (
                  <div
                    key={p.slotId}
                    onClick={() => setSelectedSlotId(p.slotId)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: isViewing ? '#1e293b' : isMe ? '#182030' : '#111827',
                      border: `1.5px solid ${isViewing ? '#60a5fa' : isMe ? '#3b82f6' : '#272738'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title={`Click to view or control ${p.name}'s draft hand`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: (isMe || isViewing) ? 'bold' : 'normal', color: isViewing ? '#93c5fd' : isMe ? '#bfdbfe' : '#e5e7eb' }}>
                        {p.name}
                      </span>
                      {isMe && (
                        <span style={{ fontSize: '9px', backgroundColor: '#2563eb', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                          YOU
                        </span>
                      )}
                      {isViewing && !isMe && (
                        <span style={{ fontSize: '9px', backgroundColor: '#374151', color: '#93c5fd', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                          VIEWING
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: submitted ? '#34d399' : '#f59e0b' }}>
                        {submitted ? '✓ Ready' : '⏳ Picking'}
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
                        {picksMade}/7
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '14px', fontSize: '11px', color: '#6b7280', textAlign: 'center', lineHeight: '1.4' }}>
              🔄 Hands rotate clockwise after all players confirm their selection for the round.
            </div>
          </div>
        </div>
      </div>

      <DraftItemZoomPreview hoveredItem={hoveredItem} />
    </div>
  );
}
