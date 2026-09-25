import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getOrCreateUserId, setActiveUserOverride } from '../utils/userId.js';
import MapGrid from './MapGrid.jsx';
import DevToolbar from './DevToolbar.jsx';
import PlayerHandPanel from './PlayerHandPanel.jsx';
import TileZoomPreview from './TileZoomPreview.jsx';
import { getPlayerForTurn, validatePlacement, getCurrentActiveRing, ALL_37_HEXES, getSeatIndexForPlayer } from '../data/tileData.js';

export default function RoomView() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(() => getOrCreateUserId());

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedTileId, setSelectedTileId] = useState(null);
  const [pendingHexId, setPendingHexId] = useState(null);
  const [hoveredTileId, setHoveredTileId] = useState(null);
  const [selectedPerspectiveSeat, setSelectedPerspectiveSeat] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTileNumbers, setShowTileNumbers] = useState(true);

  useEffect(() => {
    if (!actionError) return;
    const timer = setTimeout(() => {
      setActionError(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [actionError]);

  const handleSwitchUser = (newUserId) => {
    setActiveUserOverride(newUserId);
    setUserId(newUserId);
  };

  // Initialize socket and load room
  useEffect(() => {
    // 1. Initial REST fetch for fast load
    fetch(`/api/rooms/${roomId}`)
      .then(async (res) => {
        if (!res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Room not found (${res.status})`);
          }
          throw new Error(`Failed to load room (${res.status}). Server returned non-JSON response.`);
        }
        return res.json();
      })
      .then((data) => {
        setRoom(data.room);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // 2. Connect Socket.IO
    const newSocket = io({
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_room', { roomId, userId });
    });

    newSocket.on('room_state', (updatedRoom) => {
      setRoom(updatedRoom);
      setLoading(false);
    });

    newSocket.on('room_error', ({ message }) => {
      setRoom((currentRoom) => {
        if (!currentRoom) {
          setError(message);
        } else {
          setActionError(message);
        }
        return currentRoom;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, userId]);

  const handleClaim = (slotId) => {
    if (!socket) return;
    socket.emit('claim_slot', { roomId, slotId, userId });
  };

  const handleUnclaim = (slotId) => {
    if (!socket) return;
    socket.emit('unclaim_slot', { roomId, slotId, userId });
  };

  const copyRoomUrl = () => {
    const url = room?.id ? `${window.location.origin}/room/${room.id}` : window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      prompt('Copy room link:', url);
    });
  };

  if (loading) {
    return (
      <div id="room-loading" style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
        Loading room data...
      </div>
    );
  }

  if (error || !room) {
    return (
      <div id="room-error" style={{ textAlign: 'center', padding: '40px' }}>
        <h3 style={{ color: '#ef4444' }}>{error || 'Room not found'}</h3>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  const myClaimedSlot = room.players.find((p) => Boolean(userId) && Boolean(p.claimedBy) && p.claimedBy === userId);
  const totalSlots = room.players.length;
  const claimedCount = room.players.filter((p) => p.claimedBy !== null).length;
  const isLobby = room.status === 'lobby';
  const isCompleted = room.status === 'completed';
  const speaker = room.players.find((p) => p.isSpeaker);

  // Perspective calculation: default to viewer's claimed seat, or seat 0 (Player 1 in 6p, Overview in 5p/4p)
  const defaultPerspectiveSeat = myClaimedSlot
    ? ((totalSlots === 5 || totalSlots === 4)
        ? getSeatIndexForPlayer(room.players.findIndex(p => p.slotId === myClaimedSlot.slotId), totalSlots)
        : room.players.findIndex(p => p.slotId === myClaimedSlot.slotId))
    : 0;
  const activePerspectiveSeat = selectedPerspectiveSeat !== null ? selectedPerspectiveSeat : (defaultPerspectiveSeat >= 0 ? defaultPerspectiveSeat : 0);

  // Turn calculation
  const currentTurnIndex = room.mapState?.currentTurnIndex || 0;
  const currentTurnPlayer = getPlayerForTurn(room.players, currentTurnIndex);
  const isMyTurn = myClaimedSlot && currentTurnPlayer && currentTurnPlayer.slotId === myClaimedSlot.slotId;
  const activeRing = getCurrentActiveRing(room.mapState?.placedTiles || {}, ALL_37_HEXES);

  // Validate pending placement if tile and hex selected
  let pendingValidation = null;
  if (selectedTileId && pendingHexId) {
    const targetHex = ALL_37_HEXES.find(h => h.id === pendingHexId);
    if (targetHex) {
      pendingValidation = validatePlacement(room.mapState?.placedTiles || {}, targetHex, selectedTileId, activeRing, ALL_37_HEXES, currentTurnPlayer, totalSlots);
    }
  }

  const handleAcceptPlacement = () => {
    if (!socket || !myClaimedSlot || !selectedTileId || !pendingHexId) return;
    setActionError(null);
    socket.emit('place_tile', {
      roomId,
      slotId: myClaimedSlot.slotId,
      tileId: selectedTileId,
      hexId: pendingHexId
    });
    // Reset selection locally upon sending
    setSelectedTileId(null);
    setPendingHexId(null);
  };

  return (
    <div id="room-page" style={roomContainerStyle(isCompleted)}>
      {/* Dev Debugging Toolbar */}
      <DevToolbar
        room={room}
        currentUserId={userId}
        onSwitchUser={handleSwitchUser}
        socket={socket}
      />

      {isLobby ? (
        /* LOBBY VIEW */
        <>
          {/* Top Banner with share link and status */}
          <div style={headerCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Map Creation Room
                </span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', color: '#f9fafb' }}>
                  ID: <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{room.id}</span>
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

            {/* Room configuration info chips */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              <span style={chipStyle}>👥 Players: {totalSlots}</span>
              <span style={chipStyle}>
                {room.settings.tileMode === 'balanced' ? '⚖️ Balanced Tiles' : '🎲 Random Tiles'}
              </span>
              {room.settings.expansions.pok && <span style={chipStyle}>📦 PoK</span>}
              {room.settings.expansions.thundersEdge && <span style={chipStyle}>⚡ Thunder's Edge</span>}
              <span style={{
                ...chipStyle,
                backgroundColor: '#374151',
                color: '#f3f4f6'
              }}>
                {`⏳ Waiting for Claims (${claimedCount}/${totalSlots})`}
              </span>
            </div>
          </div>

          {/* Lobby Claim Slots Grid */}
          <div id="lobby-claim-section" style={{ marginTop: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', color: '#f3f4f6', margin: '0 0 8px 0' }}>
                Claim your Player Slot
              </h3>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: '15px' }}>
                Each player should open this page on their device and click <strong>Claim</strong> next to their name.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
              maxWidth: '1000px',
              margin: '0 auto',
            }}>
              {room.players.map((slot) => {
                const isClaimedByMe = Boolean(userId) && Boolean(slot.claimedBy) && slot.claimedBy === userId;
                const isClaimedByOther = slot.claimedBy && slot.claimedBy !== userId;
                const isFree = !slot.claimedBy;

                return (
                  <div
                    key={slot.slotId}
                    id={`player-slot-card-${slot.slotId}`}
                    style={{
                      backgroundColor: isClaimedByMe ? '#1e293b' : '#181824',
                      border: `2px solid ${isClaimedByMe ? '#3b82f6' : isClaimedByOther ? '#374151' : '#2b2b3f'}`,
                      borderRadius: '10px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '130px',
                      boxShadow: isClaimedByMe ? '0 0 12px rgba(59, 130, 246, 0.25)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold' }}>
                          SLOT {slot.slotId + 1}
                        </span>
                        {isClaimedByMe && (
                          <span style={{ fontSize: '12px', backgroundColor: '#2563eb', padding: '2px 8px', borderRadius: '12px', color: '#fff' }}>
                            You
                          </span>
                        )}
                        {isClaimedByOther && (
                          <span style={{ fontSize: '12px', backgroundColor: '#374151', padding: '2px 8px', borderRadius: '12px', color: '#9ca3af' }}>
                            Claimed
                          </span>
                        )}
                        {isFree && (
                          <span style={{ fontSize: '12px', backgroundColor: '#064e3b', padding: '2px 8px', borderRadius: '12px', color: '#34d399' }}>
                            Available
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#f9fafb', marginTop: '8px' }}>
                        {slot.name}
                      </div>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      {isClaimedByMe ? (
                        <button
                          id={`unclaim-btn-${slot.slotId}`}
                          onClick={() => handleUnclaim(slot.slotId)}
                          style={unclaimBtnStyle}
                        >
                          Release (Unclaim)
                        </button>
                      ) : isFree ? (
                        <button
                          id={`claim-btn-${slot.slotId}`}
                          onClick={() => handleClaim(slot.slotId)}
                          style={claimBtnStyle}
                        >
                          Claim this slot
                        </button>
                      ) : (
                        <button
                          disabled
                          style={claimedDisabledBtnStyle}
                        >
                          Claimed by another player
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: '32px', color: '#6b7280', fontSize: '14px' }}>
              Once all {totalSlots} players have claimed their slots, the room will automatically advance to map creation.
            </div>
          </div>
        </>
      ) : isCompleted ? (
        /* COMPLETED MAP VIEW:
           Full-screen spacious galaxy layout.
           Left sidebar with "Map Creation Room" card (permalink button) and "Rotate Perspective" controls.
           Right main column with expanded high-resolution map without mini badges.
        */
        <div id="completed-map-container" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Left Sidebar: Room info + Perspective Rotation controls */}
          <aside
            id="completed-map-sidebar"
            style={{
              width: '320px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Block 1: Map Creation Room Card with shareable link */}
            <div
              id="completed-room-header"
              style={{
                backgroundColor: '#171724',
                border: '1px solid #28283c',
                borderRadius: '14px',
                padding: '18px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
                  Map Creation Room
                </span>
                <span style={{ fontSize: '11px', color: '#34d399', backgroundColor: '#064e3b', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
                  ✓ Completed
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6', fontFamily: 'monospace' }}>
                  ID: <span style={{ color: '#60a5fa' }}>{room.id}</span>
                </span>
              </div>

              {/* Direct Permalink Button leading to this completed map */}
              <div style={{ marginTop: '14px' }}>
                <button
                  id="copy-map-link-btn"
                  onClick={copyRoomUrl}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px 16px',
                    backgroundColor: copied ? '#059669' : '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '700',
                    boxShadow: '0 2px 10px rgba(37, 99, 235, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {copied ? '✓ Link Copied!' : '🔗 Copy Map Link'}
                </button>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px', textAlign: 'center' }}>
                  Share this permalink to view the completed galaxy
                </div>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap' }}>
                <span style={miniChipStyle}>👥 {totalSlots} Players</span>
                <span style={miniChipStyle}>
                  {room.settings.tileMode === 'balanced' ? '⚖️ Balanced' : '🎲 Random'}
                </span>
                {room.settings.expansions.pok && <span style={miniChipStyle}>📦 PoK</span>}
                {room.settings.expansions.thundersEdge && <span style={miniChipStyle}>⚡ Thunder's Edge</span>}
                <span style={{ ...miniChipStyle, backgroundColor: '#064e3b', color: '#a7f3d0' }}>
                  🌌 37 Systems
                </span>
              </div>
            </div>

            {/* Block 2: Tile Numbers Display Toggle Checkbox */}
            <div
              id="display-options-card"
              style={{
                backgroundColor: '#171724',
                border: '1px solid #28283c',
                borderRadius: '14px',
                padding: '14px 18px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              <label
                htmlFor="toggle-tile-numbers-checkbox"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>🔢</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#f3f4f6' }}>
                      Show Tile Numbers
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                      Overlay system numbers on tiles
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="toggle-tile-numbers-checkbox"
                  checked={showTileNumbers}
                  onChange={(e) => setShowTileNumbers(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#2563eb',
                    cursor: 'pointer',
                  }}
                />
              </label>
            </div>

            {/* Block 3: Perspective / Rotate View Interface */}
            <div
              id="perspective-selector-card"
              style={{
                backgroundColor: '#171724',
                border: '1px solid #28283c',
                borderRadius: '14px',
                padding: '18px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '15px' }}>🧭</span>
                  <span style={{ fontSize: '12px', color: '#f3f4f6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Map Perspective
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                  Rotate View
                </span>
              </div>

              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px', lineHeight: '1.4' }}>
                Choose a player to view the galaxy from their seat (their home system rotates to the bottom):
              </div>

              {/* Player Perspective Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(totalSlots === 5 || totalSlots === 4) && (
                  <button
                    id="perspective-btn-overview"
                    onClick={() => setSelectedPerspectiveSeat(0)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      backgroundColor: activePerspectiveSeat === 0 ? '#064e3b' : '#1f1f2e',
                      border: activePerspectiveSeat === 0 ? '1.5px solid #10b981' : '1px solid #2f2f45',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: activePerspectiveSeat === 0 ? '#ecfdf5' : '#d1d5db',
                      fontWeight: activePerspectiveSeat === 0 ? '700' : '500',
                      fontSize: '13px',
                      transition: 'all 0.15s ease',
                      boxShadow: activePerspectiveSeat === 0 ? '0 0 12px rgba(16, 185, 129, 0.35)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🌌</span>
                      <span>Overview (Hyperlanes South)</span>
                    </div>
                    {activePerspectiveSeat === 0 ? (
                      <span style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 'bold' }}>✓ Active</span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>View ↷</span>
                    )}
                  </button>
                )}

                {room.players.map((player, playerIdx) => {
                  const targetSeat = (totalSlots === 5 || totalSlots === 4) ? getSeatIndexForPlayer(playerIdx, totalSlots) : playerIdx;
                  const isOriented = activePerspectiveSeat === targetSeat;
                  const isViewer = myClaimedSlot && myClaimedSlot.slotId === player.slotId;

                  return (
                    <button
                      key={player.slotId ?? playerIdx}
                      id={`perspective-btn-${playerIdx}`}
                      onClick={() => setSelectedPerspectiveSeat(targetSeat)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: isOriented ? '#064e3b' : '#1f1f2e',
                        border: isOriented ? '1.5px solid #10b981' : '1px solid #2f2f45',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: isOriented ? '#ecfdf5' : '#d1d5db',
                        fontWeight: isOriented ? '700' : '500',
                        fontSize: '13px',
                        transition: 'all 0.15s ease',
                        boxShadow: isOriented ? '0 0 12px rgba(16, 185, 129, 0.35)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: isOriented ? '#34d399' : '#6b7280', fontSize: '12px', fontFamily: 'monospace' }}>
                          #{playerIdx + 1}
                        </span>
                        <span>{player.name}</span>
                        {player.isSpeaker && <span title="Speaker">👑</span>}
                        {isViewer && (
                          <span style={{ fontSize: '9px', backgroundColor: '#2563eb', padding: '1px 5px', borderRadius: '4px', color: '#fff', fontWeight: 'bold' }}>
                            YOU
                          </span>
                        )}
                      </div>

                      {isOriented ? (
                        <span style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          ✓ South
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                          View ↷
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Step Rotation Row */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button
                  id="rotate-ccw-btn"
                  onClick={() => setSelectedPerspectiveSeat((prev) => {
                    const cur = prev !== null ? prev : activePerspectiveSeat;
                    return (cur + 5) % (room.players.length || 6);
                  })}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    backgroundColor: '#242436',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#e5e7eb',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                  title="Rotate 60° Counter-Clockwise"
                >
                  ↺ -60°
                </button>

                <button
                  id="rotate-cw-btn"
                  onClick={() => setSelectedPerspectiveSeat((prev) => {
                    const cur = prev !== null ? prev : activePerspectiveSeat;
                    return (cur + 1) % (room.players.length || 6);
                  })}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    backgroundColor: '#242436',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#e5e7eb',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                  title="Rotate 60° Clockwise"
                >
                  ↻ +60°
                </button>

                {myClaimedSlot && (
                  <button
                    id="rotate-reset-btn"
                    onClick={() => {
                      const myIdx = room.players.findIndex(p => p.slotId === myClaimedSlot.slotId);
                      if (myIdx >= 0) {
                        const targetSeat = (totalSlots === 5 || totalSlots === 4) ? getSeatIndexForPlayer(myIdx, totalSlots) : myIdx;
                        setSelectedPerspectiveSeat(targetSeat);
                      }
                    }}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: '#1e3a8a',
                      border: '1px solid #3b82f6',
                      borderRadius: '6px',
                      color: '#bfdbfe',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                    title="Reset orientation to your seat"
                  >
                    My Seat
                  </button>
                )}
              </div>
            </div>

            {/* Block 3: Map Summary Details */}
            <div
              id="completed-summary-card"
              style={{
                backgroundColor: '#171724',
                border: '1px solid #28283c',
                borderRadius: '14px',
                padding: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700', marginBottom: '8px' }}>
                Galaxy Details
              </div>
              <div style={{ fontSize: '13px', color: '#d1d5db', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Speaker:</span>
                  <strong style={{ color: '#fbbf24' }}>👑 {speaker?.name || 'Player 1'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Tiles Placed:</span>
                  <strong style={{ color: '#34d399' }}>{Object.keys(room.mapState?.placedTiles || {}).length} tiles</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Rings Completed:</span>
                  <strong style={{ color: '#60a5fa' }}>3 / 3 Rings</strong>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN COLUMN: Expansive Full Map */}
          <main
            id="completed-map-main"
            style={{
              flex: 1,
              minWidth: '550px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <MapGrid
              room={room}
              mySlot={myClaimedSlot}
              selectedTileId={null}
              pendingHexId={null}
              isMyTurn={false}
              onHoverTile={setHoveredTileId}
              perspectiveSeatIndex={activePerspectiveSeat}
              isCompleted={true}
              showTileCounts={false}
              showTileNumbers={showTileNumbers}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            />
          </main>
        </div>
      ) : (
        /* ACTIVE MAP BUILDING VIEW:
           Two-column layout shifting the two top blocks to a compact sidebar,
           leaving the main center area spacious for the large hex board and player hand.
        */
        <div id="map-building-container" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* SIDEBAR: Compact Room Header + Claim Status + Seating Roster */}
          <aside
            id="room-side-panel"
            style={{
              width: '310px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Block 1 (Reduced & shifted): Compact Map Creation Room Header */}
            <div
              id="compact-room-header"
              style={{
                backgroundColor: '#171724',
                border: '1px solid #28283c',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
                  Map Creation Room
                </span>
                <span style={{ fontSize: '11px', color: '#34d399', backgroundColor: '#064e3b', padding: '2px 7px', borderRadius: '4px', fontWeight: '600' }}>
                  Active Draft
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6', fontFamily: 'monospace' }}>
                  ID: <span style={{ color: '#60a5fa' }}>{room.id}</span>
                </span>
                <button
                  id="compact-copy-btn"
                  onClick={copyRoomUrl}
                  style={{
                    backgroundColor: copied ? '#059669' : '#1e3a8a',
                    color: '#fff',
                    border: '1px solid #3b82f6',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {copied ? '✓ Copied' : '🔗 Link'}
                </button>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span style={miniChipStyle}>👥 {totalSlots} Players</span>
                <span style={miniChipStyle}>
                  {room.settings.tileMode === 'balanced' ? '⚖️ Balanced' : '🎲 Random'}
                </span>
                {room.settings.expansions.pok && <span style={miniChipStyle}>📦 PoK</span>}
                {room.settings.expansions.thundersEdge && <span style={miniChipStyle}>⚡ Thunder's Edge</span>}
              </div>
            </div>

            {/* Block 2 (Reduced & shifted): Compact Claim Status Alert */}
            <div
              id="compact-status-card"
              style={{
                backgroundColor: 'rgba(6, 78, 59, 0.4)',
                border: '1px solid #059669',
                borderRadius: '12px',
                padding: '14px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🚀</span>
                <div>
                  <div style={{ color: '#34d399', fontWeight: '700', fontSize: '13px' }}>
                    All players claimed their slots!
                  </div>
                  <div style={{ color: '#d1fae5', fontSize: '12px', marginTop: '2px' }}>
                    Speaker: <strong style={{ color: '#fbbf24' }}>👑 {speaker?.name || 'Player 1'}</strong>
                  </div>
                  <div style={{ color: '#fbbf24', fontSize: '12px', marginTop: '4px' }}>
                    Turn: <strong>{currentTurnPlayer?.name || 'Player 1'}</strong> {isMyTurn ? '(Your Turn!)' : ''}
                  </div>
                </div>
              </div>

              {myClaimedSlot && (
                <div
                  style={{
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#d1d5db' }}>
                    You: <strong style={{ color: '#60a5fa' }}>{myClaimedSlot.name}</strong>
                  </span>
                  <button
                    onClick={() => handleUnclaim(myClaimedSlot.slotId)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#9ca3af',
                      border: '1px solid #4b5563',
                      borderRadius: '5px',
                      padding: '3px 8px',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    Reset Claim
                  </button>
                </div>
              )}
            </div>

            {/* Players Seating & Hand Tile Summary */}
            <div
              id="players-roster-panel"
              style={{
                backgroundColor: '#161622',
                border: '1px solid #272738',
                borderRadius: '12px',
                padding: '14px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Table Seating Order</span>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Remaining Hand</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {room.players.map((p) => {
                  const isMe = Boolean(userId) && Boolean(p.claimedBy) && p.claimedBy === userId;
                  const blueCount = p.remainingBlue ?? p.hand?.blue?.length ?? 3;
                  const redCount = p.remainingRed ?? p.hand?.red?.length ?? 2;

                  return (
                    <div
                      key={p.slotId}
                      style={{
                        backgroundColor: isMe ? '#1e293b' : '#11111b',
                        border: `1px solid ${isMe ? '#3b82f6' : '#272738'}`,
                        borderRadius: '8px',
                        padding: '8px 10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {p.isSpeaker && <span title="Speaker token">👑</span>}
                        <span style={{ fontSize: '13px', fontWeight: isMe ? '700' : '500', color: isMe ? '#93c5fd' : '#e5e7eb' }}>
                          {p.name}
                        </span>
                        {isMe && (
                          <span style={{ fontSize: '9px', backgroundColor: '#2563eb', padding: '1px 5px', borderRadius: '4px', color: '#fff', fontWeight: 'bold' }}>
                            YOU
                          </span>
                        )}
                      </div>

                      {/* Mini Hexagon badges */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span
                          title={`${blueCount} Blue tiles in hand`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: '#93c5fd',
                          }}
                        >
                          <svg width="14" height="14" viewBox="-10 -10 20 20">
                            <polygon points="-8,0 -4,-7 4,-7 8,0 4,7 -4,7" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1" />
                          </svg>
                          {blueCount}
                        </span>

                        <span
                          title={`${redCount} Red tiles in hand`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: '#fca5a5',
                          }}
                        >
                          <svg width="14" height="14" viewBox="-10 -10 20 20">
                            <polygon points="-8,0 -4,-7 4,-7 8,0 4,7 -4,7" fill="#b91c1c" stroke="#f87171" strokeWidth="1" />
                          </svg>
                          {redCount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* MAIN CENTER SECTION: Large Hex Board + Player's 5 Hand Tiles */}
          <main
            id="map-main-column"
            style={{
              flex: 1,
              minWidth: '500px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Placement / Runtime Error Notification Banner */}
            {actionError && (
              <div
                id="room-action-error-banner"
                style={{
                  marginBottom: '14px',
                  width: '100%',
                  maxWidth: '920px',
                  backgroundColor: '#7f1d1d',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#fee2e2',
                  fontSize: '13px',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  <span><strong>Placement Notice:</strong> {actionError}</span>
                </div>
                <button
                  onClick={() => setActionError(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    padding: '0 4px',
                  }}
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            )}

            {/* The Big 3-Ring Hexagonal Board */}
            <MapGrid
              room={room}
              mySlot={myClaimedSlot}
              selectedTileId={selectedTileId}
              pendingHexId={pendingHexId}
              onSelectHex={(hexId) => {
                if (isMyTurn && selectedTileId) {
                  setActionError(null);
                  setPendingHexId(hexId);
                }
              }}
              isMyTurn={isMyTurn}
              onHoverTile={setHoveredTileId}
              perspectiveSeatIndex={activePerspectiveSeat}
              isCompleted={false}
              showTileCounts={true}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            />

            {/* Placement Action Bar with Accept button */}
            {selectedTileId && isMyTurn && (
              <div
                style={{
                  marginTop: '14px',
                  width: '100%',
                  maxWidth: '920px',
                  backgroundColor: '#1b1b2f',
                  border: '1px solid #3b82f6',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>📦</span>
                  <div>
                    <div style={{ color: '#93c5fd', fontWeight: '700', fontSize: '13px' }}>
                      Selected Tile: #{selectedTileId}
                    </div>
                    <div style={{ color: '#d1d5db', fontSize: '12px', marginTop: '2px' }}>
                      {pendingHexId ? (
                        <span>
                          Target Hex: <strong style={{ color: '#fbbf24' }}>{pendingHexId}</strong>{' '}
                          {pendingValidation && (
                            <span style={{ color: pendingValidation.allowed ? (pendingValidation.forced ? '#fbbf24' : '#34d399') : '#ef4444', marginLeft: '8px', fontWeight: '600' }}>
                              ({pendingValidation.reason})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>
                          Click an empty hex in <strong>Ring {activeRing}</strong> on the map
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => { setSelectedTileId(null); setPendingHexId(null); }}
                    style={{
                      backgroundColor: '#374151',
                      color: '#d1d5db',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    id="accept-tile-placement-btn"
                    disabled={!pendingHexId || !pendingValidation?.allowed}
                    onClick={handleAcceptPlacement}
                    style={{
                      backgroundColor: pendingHexId && pendingValidation?.allowed ? '#059669' : '#374151',
                      color: pendingHexId && pendingValidation?.allowed ? '#fff' : '#9ca3af',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 20px',
                      fontSize: '13px',
                      cursor: pendingHexId && pendingValidation?.allowed ? 'pointer' : 'not-allowed',
                      fontWeight: '700',
                      boxShadow: pendingHexId && pendingValidation?.allowed ? '0 0 10px rgba(5, 150, 105, 0.4)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Accept
                  </button>
                </div>
              </div>
            )}

            {/* Row of 5 Tiles at the bottom (player hand) */}
            <PlayerHandPanel
              player={myClaimedSlot}
              activeTileId={selectedTileId}
              onSelectTile={(tileId) => {
                if (isMyTurn) {
                  setActionError(null);
                  setSelectedTileId(tileId);
                  setPendingHexId(null);
                }
              }}
              onHoverTile={setHoveredTileId}
            />
          </main>
        </div>
      )}

      {/* Hover Zoom Preview Hint */}
      <TileZoomPreview tileId={hoveredTileId} />
    </div>
  );
}

const roomContainerStyle = (isCompleted) => ({
  maxWidth: isCompleted ? '1750px' : '1600px',
  margin: '0 auto',
  padding: '16px',
});

const headerCardStyle = {
  backgroundColor: '#1e1e2d',
  border: '1px solid #323248',
  borderRadius: '12px',
  padding: '24px',
};

const chipStyle = {
  backgroundColor: '#28283c',
  color: '#d1d5db',
  padding: '4px 10px',
  borderRadius: '6px',
  fontSize: '13px',
};

const miniChipStyle = {
  backgroundColor: '#202030',
  color: '#cbd5e1',
  padding: '3px 8px',
  borderRadius: '5px',
  fontSize: '11px',
};

const copyBtnStyle = (copied) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  backgroundColor: copied ? '#059669' : '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'background-color 0.2s',
});

const claimBtnStyle = {
  width: '100%',
  padding: '10px 16px',
  backgroundColor: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '14px',
  transition: 'background-color 0.15s ease',
};

const unclaimBtnStyle = {
  width: '100%',
  padding: '10px 16px',
  backgroundColor: '#dc2626',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '14px',
};

const claimedDisabledBtnStyle = {
  width: '100%',
  padding: '10px 16px',
  backgroundColor: '#272738',
  color: '#6b7280',
  border: 'none',
  borderRadius: '6px',
  cursor: 'not-allowed',
  fontSize: '14px',
};
