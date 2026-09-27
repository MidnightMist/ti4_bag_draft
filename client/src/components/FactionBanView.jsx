import React from 'react';
import { FACTIONS } from '../data/factionsData.js';

export default function FactionBanView({
  room,
  userId,
  myClaimedSlot,
  totalSlots,
  copied,
  copyRoomUrl,
  banningViewingSlotId,
  setBanningViewingSlotId,
  selectedBanFactionId,
  setSelectedBanFactionId,
  socket,
  chipStyle,
  copyBtnStyle,
  headerCardStyle,
}) {
  const activeSlotId = banningViewingSlotId !== null ? banningViewingSlotId : (myClaimedSlot ? myClaimedSlot.slotId : room.players[0].slotId);
  const activePlayer = room.players.find(p => p.slotId === activeSlotId) || room.players[0];

  return (
    <div id="faction-ban-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={headerCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Bag Draft — Faction Banning Phase
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

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          <span style={chipStyle}>👥 Players: {totalSlots}</span>
          <span style={chipStyle}>⚖️ Balanced Tiles</span>
          {room.settings.expansions.pok && <span style={chipStyle}>📦 PoK</span>}
          {room.settings.expansions.thundersEdge && <span style={chipStyle}>⚡ Thunder's Edge</span>}
          <span style={{ ...chipStyle, backgroundColor: '#9a3412', color: '#fed7aa' }}>
            🚫 Step 1: Faction Banning
          </span>
        </div>
      </div>

      {/* Player Switcher Tabs for Banning */}
      <div style={{ margin: '24px 0 16px 0' }}>
        <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>
          Viewing / Managing Faction Ban for:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {room.players.map(p => {
            const isMe = Boolean(userId) && Boolean(p.claimedBy) && p.claimedBy === userId;
            const isSelectedTab = activeSlotId === p.slotId;

            return (
              <button
                key={p.slotId}
                onClick={() => {
                  setBanningViewingSlotId(p.slotId);
                  setSelectedBanFactionId(null);
                }}
                style={{
                  padding: '8px 14px',
                  backgroundColor: isSelectedTab ? '#2563eb' : '#1f2937',
                  color: isSelectedTab ? '#fff' : '#d1d5db',
                  border: `1px solid ${isSelectedTab ? '#60a5fa' : '#374151'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isSelectedTab ? 'bold' : 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{p.name}</span>
                {isMe && <span style={{ fontSize: '10px', backgroundColor: '#1e3a8a', padding: '1px 4px', borderRadius: '3px' }}>YOU</span>}
                {p.hasBanned ? <span style={{ color: '#34d399' }}>✓</span> : <span style={{ color: '#fbbf24' }}>⏳</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Player Ban Card */}
      <div style={{ backgroundColor: '#171724', border: '1px solid #28283c', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#f9fafb' }}>
            {activePlayer.name}'s Faction Ban Selection
          </h3>
          <span style={{
            fontSize: '13px',
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: activePlayer.hasBanned ? '#064e3b' : '#78350f',
            color: activePlayer.hasBanned ? '#34d399' : '#fde68a',
            fontWeight: 'bold',
          }}>
            {activePlayer.hasBanned ? '✓ Ban Submitted' : '⏳ Action Required: Choose 1 to Ban'}
          </span>
        </div>

        {activePlayer.hasBanned ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '16px', color: '#34d399', marginBottom: '16px' }}>
              Player <strong>{activePlayer.name}</strong> has successfully banned:
            </div>
            {(() => {
              const bannedFaction = FACTIONS.find(f => f.id === activePlayer.bannedFactionId);
              if (!bannedFaction) return <div style={{ color: '#fff' }}>{activePlayer.bannedFactionId}</div>;
              return (
                <div style={{ display: 'inline-block', backgroundColor: '#1e1e2d', border: '2px solid #ef4444', borderRadius: '12px', padding: '16px' }}>
                  <img
                    src={`/factions/${encodeURIComponent(bannedFaction.filename)}`}
                    alt={bannedFaction.name}
                    style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #3f3f5a', marginBottom: '10px' }}
                  />
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fca5a5', textDecoration: 'line-through' }}>
                    {bannedFaction.name} (Banned)
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: 0, marginBottom: '20px' }}>
              Click on one of the 3 randomly assigned factions below, then click the confirmation button to ban it from the draft pool.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {(activePlayer.banPool || []).map(factionId => {
                const faction = FACTIONS.find(f => f.id === factionId);
                if (!faction) return null;
                const isSelected = selectedBanFactionId === factionId;

                return (
                  <div
                    key={factionId}
                    onClick={() => setSelectedBanFactionId(factionId)}
                    style={{
                      backgroundColor: isSelected ? '#1e3a8a' : '#14141f',
                      border: `2px solid ${isSelected ? '#3b82f6' : '#2f2f45'}`,
                      borderRadius: '10px',
                      padding: '16px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      boxShadow: isSelected ? '0 0 16px rgba(59, 130, 246, 0.4)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <img
                      src={`/factions/${encodeURIComponent(faction.filename)}`}
                      alt={faction.name}
                      style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #3f3f5a', marginBottom: '12px' }}
                    />
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f3f4f6' }}>
                      {faction.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                      {faction.expansion === 'pok' ? 'Prophecy of Kings' : faction.expansion === 'thundersEdge' ? "Thunder's Edge" : 'Base Game'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  if (!socket || !selectedBanFactionId) return;
                  socket.emit('submit_faction_ban', {
                    roomId: room.id,
                    slotId: activePlayer.slotId,
                    factionId: selectedBanFactionId
                  });
                  setSelectedBanFactionId(null);
                }}
                disabled={!selectedBanFactionId}
                style={{
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: selectedBanFactionId ? '#dc2626' : '#374151',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: selectedBanFactionId ? 'pointer' : 'not-allowed',
                  boxShadow: selectedBanFactionId ? '0 4px 14px rgba(220, 38, 38, 0.4)' : 'none',
                }}
              >
                {selectedBanFactionId ? `Confirm Ban: ${FACTIONS.find(f => f.id === selectedBanFactionId)?.name}` : 'Select a Faction to Ban'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Players Progress Summary */}
      <div style={{ marginTop: '24px', backgroundColor: '#171724', border: '1px solid #28283c', borderRadius: '12px', padding: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#f3f4f6' }}>
          Players Banning Progress
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {room.players.map(p => {
            const bannedFaction = FACTIONS.find(f => f.id === p.bannedFactionId);
            return (
              <div key={p.slotId} style={{ backgroundColor: '#12121a', border: '1px solid #272738', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e5e7eb' }}>{p.name}</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  {p.hasBanned ? (
                    <span style={{ color: '#34d399' }}>✓ Banned {bannedFaction?.name || 'Faction'}</span>
                  ) : (
                    <span style={{ color: '#fbbf24' }}>⏳ Choosing ban...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
