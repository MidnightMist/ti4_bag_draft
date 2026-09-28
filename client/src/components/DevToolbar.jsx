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

  const handleCompleteMap = () => {
    if (!socket) return;
    socket.emit('dev_complete_map', { roomId: room.id });
  };

  const handleAutoBan = () => {
    if (!socket) return;
    socket.emit('dev_autoban_room', { roomId: room.id });
  };

  const handleAutoDraftRound = () => {
    if (!socket) return;
    socket.emit('dev_autodraft_round', { roomId: room.id });
  };

  const handleAutoDraftAll = () => {
    if (!socket) return;
    socket.emit('dev_autodraft_all', { roomId: room.id });
  };

  const handleAutoSelectFactions = () => {
    if (!socket) return;
    socket.emit('dev_auto_select_factions', { roomId: room.id });
  };

  const handleOpenPlayerTab = (slotIndex) => {
    const targetUrl = `${window.location.origin}/room/${room.id}?user=p${slotIndex + 1}`;
    window.open(targetUrl, `_blank`);
  };

  const activeSlot = room.players.find(p => Boolean(currentUserId) && p.claimedBy && p.claimedBy === currentUserId);

  return null;
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
