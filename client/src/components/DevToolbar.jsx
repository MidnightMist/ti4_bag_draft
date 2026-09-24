import React, { useState } from 'react';

/**
 * DevToolbar Component
 * Provides instant debugging controls:
 * 1. Switch active player seat in the current tab
 * 2. Auto-fill remaining lobby slots to immediately advance to map building
 * 3. Open a simulated separate player tab (?user=...)
 * 4. Reset room state back to empty lobby
 */
export default function DevToolbar({ room, currentUserId, onSwitchUser, socket }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!room) return null;

  const handleAutoFill = () => {
    if (!socket) return;
    socket.emit('dev_autofill_room', {
      roomId: room.id,
      currentUserId: currentUserId
    });
  };

  const handleResetRoom = () => {
    if (!socket) return;
    socket.emit('dev_reset_room', { roomId: room.id });
  };

  const handleOpenPlayerTab = (slotIndex) => {
    const targetUrl = `${window.location.origin}/room/${room.id}?user=p${slotIndex + 1}`;
    window.open(targetUrl, `_blank`);
  };

  const activeSlot = room.players.find(p => Boolean(currentUserId) && p.claimedBy && p.claimedBy === currentUserId);

  return (
    <div
      id="dev-toolbar-container"
      style={{
        backgroundColor: '#111827',
        border: '1px solid #374151',
        borderRadius: '10px',
        marginBottom: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {/* Dev Header with toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          backgroundColor: '#1f2937',
          borderBottom: isOpen ? '1px solid #374151' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🧪</span>
          <span style={{ fontWeight: '700', fontSize: '14px', color: '#fbbf24', letterSpacing: '0.04em' }}>
            DEV DEBUG TOOLBAR
          </span>
          <span style={{ fontSize: '12px', color: '#9ca3af', backgroundColor: '#374151', padding: '2px 6px', borderRadius: '4px' }}>
            Single-Seat & Multi-Seat Testing
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: '12px',
            textDecoration: 'underline'
          }}
        >
          {isOpen ? 'Hide Toolbar' : 'Show Toolbar'}
        </button>
      </div>

      {isOpen && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Row 1: Quick Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#d1d5db', fontWeight: '600' }}>Actions:</span>

            <button
              id="dev-autofill-btn"
              onClick={handleAutoFill}
              style={actionBtnStyle('#2563eb', '#1d4ed8')}
              title="Fills any unassigned seats with mock players so map building starts instantly"
            >
              ⚡ Auto-Fill Lobby & Start Draft
            </button>

            <button
              id="dev-reset-btn"
              onClick={handleResetRoom}
              style={actionBtnStyle('#4b5563', '#374151')}
              title="Resets room to lobby and clears all player claims"
            >
              🔄 Reset Room to Lobby
            </button>
          </div>

          {/* Row 2: Active User Switcher (Control As...) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#d1d5db', fontWeight: '600' }}>
                Control Active Seat in this Tab:
              </span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                Currently controlling: <strong style={{ color: activeSlot ? '#60a5fa' : '#f87171' }}>
                  {activeSlot ? `${activeSlot.name} (Slot ${activeSlot.slotId + 1})` : 'Unassigned / Spectator'}
                </strong>
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {room.players.map((player) => {
                const isCurrent = Boolean(currentUserId) && Boolean(player.claimedBy) && player.claimedBy === currentUserId;
                const isClaimed = !!player.claimedBy;

                return (
                  <button
                    key={player.slotId}
                    id={`dev-switch-seat-${player.slotId}`}
                    onClick={() => {
                      // Switch user override
                      if (player.claimedBy) {
                        onSwitchUser(player.claimedBy);
                      } else {
                        // Create a dedicated simulated ID for this slot and claim it
                        const newId = `user_slot_${player.slotId + 1}`;
                        onSwitchUser(newId);
                        if (socket) {
                          socket.emit('claim_slot', {
                            roomId: room.id,
                            slotId: player.slotId,
                            userId: newId
                          });
                        }
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: isCurrent ? '700' : '500',
                      cursor: 'pointer',
                      border: isCurrent ? '2px solid #3b82f6' : '1px solid #374151',
                      backgroundColor: isCurrent ? '#1d4ed8' : isClaimed ? '#1f2937' : '#111827',
                      color: isCurrent ? '#ffffff' : isClaimed ? '#e5e7eb' : '#9ca3af',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{player.name}</span>
                    {player.isSpeaker && <span title="Speaker token">👑</span>}
                    {isCurrent && <span style={{ fontSize: '10px', backgroundColor: '#3b82f6', padding: '1px 4px', borderRadius: '4px' }}>ACTIVE</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Multi-Tab Testing Shortcuts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #1f2937', paddingTop: '10px' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              Open isolated player tab:
            </span>
            {room.players.map((player, idx) => (
              <button
                key={player.slotId}
                onClick={() => handleOpenPlayerTab(idx)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#93c5fd',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
                title={`Open new tab with independent user session for ${player.name}`}
              >
                + Tab {player.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const actionBtnStyle = (bg, hoverBg) => ({
  padding: '6px 14px',
  backgroundColor: bg,
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'background-color 0.15s ease',
});
