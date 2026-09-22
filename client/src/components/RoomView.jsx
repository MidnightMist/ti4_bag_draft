import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getOrCreateUserId, setActiveUserOverride } from '../utils/userId.js';
import MapGrid from './MapGrid.jsx';
import DevToolbar from './DevToolbar.jsx';

export default function RoomView() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(() => getOrCreateUserId());

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [copied, setCopied] = useState(false);

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
      setError(message);
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
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const myClaimedSlot = room.players.find((p) => p.claimedBy === userId);
  const totalSlots = room.players.length;
  const claimedCount = room.players.filter((p) => p.claimedBy !== null).length;
  const isLobby = room.status === 'lobby';

  return (
    <div id="room-page" style={roomContainerStyle}>
      {/* Dev Debugging Toolbar */}
      <DevToolbar
        room={room}
        currentUserId={userId}
        onSwitchUser={handleSwitchUser}
        socket={socket}
      />

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
              style={{
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
              }}
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
            backgroundColor: isLobby ? '#374151' : '#065f46',
            color: isLobby ? '#f3f4f6' : '#6ee7b7'
          }}>
            {isLobby ? `⏳ Waiting for Claims (${claimedCount}/${totalSlots})` : '🚀 Board ready to build'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {isLobby ? (
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
              const isClaimedByMe = slot.claimedBy === userId;
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
      ) : (
        /* When all players claim, stage 2 (Map creation) starts */
        <div id="map-building-section" style={{ marginTop: '24px' }}>
          <div style={{
            backgroundColor: '#064e3b',
            border: '1px solid #059669',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <strong style={{ color: '#6ee7b7', fontSize: '16px' }}>All players have claimed their slots!</strong>
              <div style={{ color: '#d1fae5', fontSize: '14px', marginTop: '2px' }}>
                Speaker randomly selected: <strong style={{ color: '#fff' }}>{room.players.find(p => p.isSpeaker)?.name || 'Player'}</strong>.
                {myClaimedSlot && ` You are playing as: ${myClaimedSlot.name}`}
              </div>
            </div>
            <button
              onClick={() => {
                if (myClaimedSlot) handleUnclaim(myClaimedSlot.slotId);
              }}
              style={{
                backgroundColor: 'transparent',
                color: '#9ca3af',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Reset Claim
            </button>
          </div>

          {/* Grid view */}
          <MapGrid room={room} mySlot={myClaimedSlot} />
        </div>
      )}
    </div>
  );
}

const roomContainerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '16px',
};

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
