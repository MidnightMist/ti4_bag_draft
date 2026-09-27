import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getOrCreateUserId, setActiveUserOverride } from '../utils/userId.js';
import MapGrid from './MapGrid.jsx';
import DevToolbar from './DevToolbar.jsx';
import PlayerHandPanel from './PlayerHandPanel.jsx';
import TileZoomPreview from './TileZoomPreview.jsx';
import FactionBanView from './FactionBanView.jsx';
import DraftingPhaseView from './DraftingPhaseView.jsx';
import { getPlayerForTurn, validatePlacement, getCurrentActiveRing, getActiveHexes, getSeatIndexForPlayer } from '../data/tileData.js';

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
  // Draft selections kept per player slot: slotId -> { selectedTileId, pendingHexId }
  const [slotDrafts, setSlotDrafts] = useState({});
  const [hoveredTileId, setHoveredTileId] = useState(null);
  const [selectedPerspectiveSeat, setSelectedPerspectiveSeat] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTileNumbers, setShowTileNumbers] = useState(true);
  const [selectedBanFactionId, setSelectedBanFactionId] = useState(null);
  const [banningViewingSlotId, setBanningViewingSlotId] = useState(null);

  // Clear draft previews whenever turn advances or room status transitions
  useEffect(() => {
    setSlotDrafts({});
  }, [room?.mapState?.currentTurnIndex, room?.status]);

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
    setSelectedPerspectiveSeat(null);
  };

  useEffect(() => {
    setSelectedPerspectiveSeat(null);
  }, [userId]);

  // Initialize socket and load room
  useEffect(() => {
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
  const isFactionBan = room.status === 'faction_ban';
  const isDrafting = room.status === 'drafting';
  const isCompleted = room.status === 'completed';
  const speaker = room.players.find((p) => p.isSpeaker);

  // Perspective calculation: default to viewer's claimed seat, or seat 0 (Player 1 in 6p, Overview in 5p/4p)
  const defaultPerspectiveSeat = myClaimedSlot
    ? ((totalSlots === 8 || totalSlots === 7 || totalSlots === 5 || totalSlots === 4 || totalSlots === 3)
        ? getSeatIndexForPlayer(room.players.findIndex(p => p.slotId === myClaimedSlot.slotId), totalSlots)
        : room.players.findIndex(p => p.slotId === myClaimedSlot.slotId))
    : (totalSlots === 3 ? getSeatIndexForPlayer(0, 3) : 0);
  const activePerspectiveSeat = selectedPerspectiveSeat !== null ? selectedPerspectiveSeat : (defaultPerspectiveSeat >= 0 ? defaultPerspectiveSeat : 0);

  // Turn calculation
  const currentTurnIndex = room.mapState?.currentTurnIndex || 0;
  const currentTurnPlayer = getPlayerForTurn(room.players, currentTurnIndex);
  const isMyTurn = Boolean(myClaimedSlot && currentTurnPlayer && currentTurnPlayer.slotId === myClaimedSlot.slotId);
  const activeHexes = getActiveHexes(totalSlots);
  const activeRing = getCurrentActiveRing(room.mapState?.placedTiles || {}, activeHexes, totalSlots);

  // Private draft preview: only the player whose turn it is sees their tentative placement
  const currentSlotId = myClaimedSlot?.slotId;
  const currentDraft = (currentSlotId !== undefined && slotDrafts[currentSlotId]) || { selectedTileId: null, pendingHexId: null };
  const selectedTileId = isMyTurn ? currentDraft.selectedTileId : null;
  const pendingHexId = isMyTurn ? currentDraft.pendingHexId : null;

  // Validate pending placement if tile and hex selected
  let pendingValidation = null;
  if (selectedTileId && pendingHexId) {
    const targetHex = activeHexes.find(h => h.id === pendingHexId);
    if (targetHex) {
      pendingValidation = validatePlacement(room.mapState?.placedTiles || {}, targetHex, selectedTileId, activeRing, activeHexes, currentTurnPlayer, totalSlots);
    }
  }

  const handleSelectTile = (tileId) => {
    if (!isMyTurn || currentSlotId === undefined) return;
    setActionError(null);
    setSlotDrafts((prev) => ({
      ...prev,
      [currentSlotId]: { selectedTileId: tileId, pendingHexId: null }
    }));
  };

  const handleSelectHex = (hexId) => {
    if (!isMyTurn || currentSlotId === undefined || !selectedTileId) return;
    setActionError(null);
    setSlotDrafts((prev) => ({
      ...prev,
      [currentSlotId]: { selectedTileId, pendingHexId: hexId }
    }));
  };

  const handleCancelPlacement = () => {
    if (currentSlotId === undefined) return;
    setSlotDrafts((prev) => ({
      ...prev,
      [currentSlotId]: { selectedTileId: null, pendingHexId: null }
    }));
  };

  const handleAcceptPlacement = () => {
    if (!socket || !myClaimedSlot || !selectedTileId || !pendingHexId) return;
    setActionError(null);
    socket.emit('place_tile', {
      roomId,
      slotId: myClaimedSlot.slotId,
      tileId: selectedTileId,
      hexId: pendingHexId
    });
    setSlotDrafts((prev) => ({
      ...prev,
      [myClaimedSlot.slotId]: { selectedTileId: null, pendingHexId: null }
    }));
  };

  return (
    <div id="room-page" style={roomContainerStyle(isCompleted)}>
      {/* Dev Debugging Toolbar */}
      <DevToolbar
        room={room}
        currentUserId={userId}
        socket={socket}
        onSwitchUser={handleSwitchUser}
      />

      {isFactionBan ? (
        <FactionBanView
          room={room}
          userId={userId}
          myClaimedSlot={myClaimedSlot}
          totalSlots={totalSlots}
          copied={copied}
          copyRoomUrl={copyRoomUrl}
          banningViewingSlotId={banningViewingSlotId}
          setBanningViewingSlotId={setBanningViewingSlotId}
          selectedBanFactionId={selectedBanFactionId}
          setSelectedBanFactionId={setSelectedBanFactionId}
          socket={socket}
          chipStyle={chipStyle}
          copyBtnStyle={copyBtnStyle}
          headerCardStyle={headerCardStyle}
        />
      ) : isDrafting ? (
        <DraftingPhaseView
          room={room}
          userId={userId}
          myClaimedSlot={myClaimedSlot}
          totalSlots={totalSlots}
          copied={copied}
          copyRoomUrl={copyRoomUrl}
          socket={socket}
          chipStyle={chipStyle}
          copyBtnStyle={copyBtnStyle}
          headerCardStyle={headerCardStyle}
        />
      ) : isLobby ? (
        /* LOBBY VIEW */
        <>
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

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              <span style={chipStyle}>👥 Players: {totalSlots}</span>
              <span style={chipStyle}>
                {room.settings.tileMode === 'balanced' ? '⚖️ Balanced Tiles' : '🎲 Random Tiles'}
              </span>
              {room.settings.expansions.pok && <span style={chipStyle}>📦 PoK</span>}
              {room.settings.expansions.thundersEdge && <span style={chipStyle}>⚡ Thunder's Edge</span>}
              <span style={{ ...chipStyle, backgroundColor: '#374151', color: '#f3f4f6' }}>
                {`⏳ Waiting for Claims (${claimedCount}/${totalSlots})`}
              </span>
            </div>
          </div>

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
      ) : (
        /* UNIFIED MAP VIEW (Active Draft or Completed) */
        <div
          id={isCompleted ? 'completed-map-container' : 'map-building-container'}
          style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}
        >
          {/* SIDEBAR */}
          <aside
            id={isCompleted ? 'completed-map-sidebar' : 'room-side-panel'}
            style={{
              width: isCompleted ? '320px' : '310px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: isCompleted ? '16px' : '14px',
            }}
          >
            {isCompleted ? (
              /* Block 1: Completed Header */
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

                <div style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap' }}>
                  <span style={miniChipStyle}>👥 {totalSlots} Players</span>
                  <span style={miniChipStyle}>
                    {room.settings.tileMode === 'balanced' ? '⚖️ Balanced' : '🎲 Random'}
                  </span>
                  {room.settings.expansions.pok && <span style={miniChipStyle}>📦 PoK</span>}
                  {room.settings.expansions.thundersEdge && <span style={miniChipStyle}>⚡ Thunder's Edge</span>}
                  <span style={{ ...miniChipStyle, backgroundColor: '#064e3b', color: '#a7f3d0' }}>
                    🌌 {activeHexes.length} Systems
                  </span>
                </div>
              </div>
            ) : (
              /* Block 1: Compact Active Room Header */
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

                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <span style={miniChipStyle}>👥 {totalSlots} Players</span>
                  <span style={miniChipStyle}>
                    {room.settings.tileMode === 'balanced' ? '⚖️ Balanced' : '🎲 Random'}
                  </span>
                  {room.settings.expansions.pok && <span style={miniChipStyle}>📦 PoK</span>}
                  {room.settings.expansions.thundersEdge && <span style={miniChipStyle}>⚡ Thunder's Edge</span>}
                </div>
              </div>
            )}

            {/* Block 2: Tile Numbers Checkbox (Completed) or Status Card (Active) */}
            {isCompleted ? (
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
                        Display system numbers on board tiles
                      </div>
                    </div>
                  </div>
                  <input
                    id="toggle-tile-numbers-checkbox"
                    type="checkbox"
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
            ) : (
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
              </div>
            )}

            {/* Block 3: Perspective Selector & Seating Order */}
            {isCompleted ? (
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
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Rotate View</span>
                </div>

                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px', lineHeight: '1.4' }}>
                  Choose a player to view the galaxy from their seat (their home system rotates to the bottom):
                </div>

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
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🌌</span>
                        <span>{totalSlots === 4 ? 'Overview (Hyperlanes South/North)' : 'Overview (Hyperlanes South)'}</span>
                      </div>
                      {activePerspectiveSeat === 0 ? (
                        <span style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 'bold' }}>✓ Active</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>View ↷</span>
                      )}
                    </button>
                  )}

                  {room.players.map((player, playerIdx) => {
                    const targetSeat = (totalSlots === 8 || totalSlots === 7 || totalSlots === 5 || totalSlots === 4 || totalSlots === 3)
                      ? getSeatIndexForPlayer(playerIdx, totalSlots)
                      : playerIdx;
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
                          <span style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 'bold' }}>✓ South</span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>View ↷</span>
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
                      const seatMod = totalSlots || 6;
                      return (cur - 1 + seatMod) % seatMod;
                    })}
                    style={{ flex: 1, padding: '8px 10px', backgroundColor: '#242436', border: '1px solid #374151', borderRadius: '6px', color: '#e5e7eb', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    ↺ -60°
                  </button>
                  <button
                    id="rotate-cw-btn"
                    onClick={() => setSelectedPerspectiveSeat((prev) => {
                      const cur = prev !== null ? prev : activePerspectiveSeat;
                      const seatMod = totalSlots || 6;
                      return (cur + 1) % seatMod;
                    })}
                    style={{ flex: 1, padding: '8px 10px', backgroundColor: '#242436', border: '1px solid #374151', borderRadius: '6px', color: '#e5e7eb', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    ↻ +60°
                  </button>
                  {myClaimedSlot && (
                    <button
                      id="rotate-reset-btn"
                      onClick={() => {
                        const myIdx = room.players.findIndex(p => p.slotId === myClaimedSlot.slotId);
                        if (myIdx >= 0) {
                          const targetSeat = (totalSlots === 8 || totalSlots === 7 || totalSlots === 5 || totalSlots === 4 || totalSlots === 3) ? getSeatIndexForPlayer(myIdx, totalSlots) : myIdx;
                          setSelectedPerspectiveSeat(targetSeat);
                        }
                      }}
                      style={{ padding: '8px 10px', backgroundColor: '#1e3a8a', border: '1px solid #3b82f6', borderRadius: '6px', color: '#bfdbfe', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      My Seat
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Block 3 (Draft): Table Seating Order */
              <div
                id="seating-order-card"
                style={{
                  backgroundColor: '#161622',
                  border: '1px solid #272738',
                  borderRadius: '12px',
                  padding: '14px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Table Seating Order</span>
                  <span style={{ fontSize: '10px', color: '#6b7280' }}>Remaining Hand</span>
                </div>

                {selectedPerspectiveSeat !== null && (
                  <div style={{ marginBottom: '8px' }}>
                    <button
                      onClick={() => setSelectedPerspectiveSeat(null)}
                      style={{ width: '100%', backgroundColor: '#1f2937', color: '#93c5fd', border: '1px solid #374151', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <span>↺</span> Reset View to My Seat
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {room.players.map((p, playerIdx) => {
                    const isMe = Boolean(userId) && Boolean(p.claimedBy) && p.claimedBy === userId;
                    const initialBlue = totalSlots === 3 ? 6 : 3;
                    const blueCount = p.remainingBlue ?? p.hand?.blue?.length ?? initialBlue;
                    const redCount = p.remainingRed ?? p.hand?.red?.length ?? 2;
                    const targetSeat = (totalSlots === 8 || totalSlots === 7 || totalSlots === 5 || totalSlots === 4 || totalSlots === 3)
                      ? getSeatIndexForPlayer(playerIdx, totalSlots)
                      : playerIdx;
                    const isOriented = activePerspectiveSeat === targetSeat;

                    return (
                      <div
                        key={p.slotId}
                        onClick={() => setSelectedPerspectiveSeat(targetSeat)}
                        style={{
                          backgroundColor: isMe ? '#1e293b' : isOriented ? '#162032' : '#11111b',
                          border: `1px solid ${isMe ? '#3b82f6' : isOriented ? '#10b981' : '#272738'}`,
                          borderRadius: '8px',
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        title={`Click to view board from ${p.name}'s seat`}
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
                          {isOriented && !isMe && (
                            <span style={{ fontSize: '9px', backgroundColor: '#064e3b', padding: '1px 5px', borderRadius: '4px', color: '#34d399', fontWeight: 'bold' }}>
                              VIEWING
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span title={`${blueCount} Blue tiles in hand`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: '#93c5fd' }}>
                            <svg width="14" height="14" viewBox="-10 -10 20 20">
                              <polygon points="-8,0 -4,-7 4,-7 8,0 4,7 -4,7" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1" />
                            </svg>
                            {blueCount}
                          </span>
                          <span title={`${redCount} Red tiles in hand`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: '#fca5a5' }}>
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
            )}

            {/* Block 4: Map Summary Details (Completed Only) */}
            {isCompleted && (
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
            )}
          </aside>

          {/* MAIN COLUMN */}
          <main
            id={isCompleted ? 'completed-map-main' : 'map-main-column'}
            style={{
              flex: 1,
              minWidth: isCompleted ? '550px' : '500px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Placement Error Notification Banner (Draft mode) */}
            {actionError && !isCompleted && (
              <div
                id="room-action-error-banner"
                style={{
                  marginBottom: '14px',
                  width: '100%',
                  maxWidth: totalSlots === 7 ? '840px' : '920px',
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
                  style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>
            )}

            <MapGrid
              room={room}
              mySlot={myClaimedSlot}
              selectedTileId={selectedTileId}
              pendingHexId={pendingHexId}
              onSelectHex={handleSelectHex}
              isMyTurn={isMyTurn}
              onHoverTile={setHoveredTileId}
              perspectiveSeatIndex={activePerspectiveSeat}
              isCompleted={isCompleted}
              showTileCounts={!isCompleted}
              showTileNumbers={showTileNumbers}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            />

            {/* Placement Action Bar with Accept button (Draft mode) */}
            {!isCompleted && selectedTileId && isMyTurn && (
              <div
                style={{
                  marginTop: '14px',
                  width: '100%',
                  maxWidth: totalSlots === 7 ? '840px' : '920px',
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
                    onClick={handleCancelPlacement}
                    style={{ backgroundColor: '#374151', color: '#d1d5db', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
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

            {/* Row of 5 Tiles at the bottom (Draft mode) */}
            {!isCompleted && myClaimedSlot && (
              <PlayerHandPanel
                player={myClaimedSlot}
                activeTileId={selectedTileId}
                onSelectTile={handleSelectTile}
                onHoverTile={setHoveredTileId}
              />
            )}
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
  fontSize: '12px',
  padding: '4px 10px',
  borderRadius: '6px',
  backgroundColor: '#2b2b3f',
  color: '#e5e7eb',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
};

const miniChipStyle = {
  fontSize: '11px',
  padding: '2px 7px',
  borderRadius: '4px',
  backgroundColor: '#242436',
  color: '#d1d5db',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3px',
};

const copyBtnStyle = (copied) => ({
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: '600',
  backgroundColor: copied ? '#059669' : '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s',
});

const claimBtnStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#059669',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  transition: 'background-color 0.2s',
};

const unclaimBtnStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#374151',
  color: '#d1d5db',
  border: '1px solid #4b5563',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  transition: 'background-color 0.2s',
};

const claimedDisabledBtnStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#262638',
  color: '#6b7280',
  border: '1px solid #323248',
  borderRadius: '6px',
  fontSize: '13px',
  cursor: 'not-allowed',
};
