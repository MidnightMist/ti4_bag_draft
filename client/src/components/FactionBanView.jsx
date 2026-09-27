import React from 'react';
import { FACTIONS } from '../data/factionsData.js';

export default function FactionBanView({
  room,
  userId,
  myClaimedSlot,
  totalSlots,
  copied,
  copyRoomUrl,
  selectedBanFactionId,
  setSelectedBanFactionId,
  socket,
  chipStyle,
  copyBtnStyle,
  headerCardStyle,
}) {
  // Current player being controlled (strictly the user's claimed slot, or active seat)
  const activePlayer = myClaimedSlot || room.players.find(p => p.claimedBy === userId) || room.players[0];
  const hasSubmittedBan = Boolean(activePlayer?.hasBanned);

  const totalPlayersCount = room.players.length;
  const bannedCount = room.players.filter(p => p.hasBanned).length;

  return (
    <div id="faction-ban-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 8px 32px 8px' }}>
      {/* Header Info */}
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
            🚫 Step 1: Secret Faction Banning
          </span>
          <span style={{ ...chipStyle, backgroundColor: '#1e293b', color: '#93c5fd' }}>
            📊 Progress: {bannedCount} / {totalPlayersCount} Ready
          </span>
        </div>
      </div>

      {/* Main 2-Column Layout: Left (Vertical Column of 3 Large Faction Cards) | Right (Action & Status Panel) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '24px',
          marginTop: '20px',
          alignItems: 'start'
        }}
      >
        {/* Left Column: 3 Full-Width Faction Sheet Cards in Vertical Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Always display all 3 factions assigned to the player */}
          {(activePlayer.banPool || []).map((factionId, index) => {
            const faction = FACTIONS.find(f => f.id === factionId);
            if (!faction) return null;

            const isBannedByMe = hasSubmittedBan && activePlayer.bannedFactionId === factionId;
            const isRemainingKept = hasSubmittedBan && activePlayer.bannedFactionId !== factionId;
            const isSelected = !hasSubmittedBan && selectedBanFactionId === factionId;

            return (
              <div
                key={factionId}
                onClick={() => {
                  if (!hasSubmittedBan) {
                    setSelectedBanFactionId(factionId);
                  }
                }}
                style={{
                  backgroundColor: isBannedByMe ? '#181115' : isSelected ? '#1e293b' : '#111827',
                  border: isBannedByMe
                    ? '3px solid #ef4444'
                    : isRemainingKept
                    ? '2px solid #10b981'
                    : `3px solid ${isSelected ? '#ef4444' : '#28283c'}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: hasSubmittedBan ? 'default' : 'pointer',
                  position: 'relative',
                  boxShadow: isBannedByMe
                    ? '0 0 24px rgba(239, 68, 68, 0.4), 0 4px 16px rgba(0,0,0,0.6)'
                    : isRemainingKept
                    ? '0 0 16px rgba(16, 185, 129, 0.25)'
                    : isSelected
                    ? '0 0 24px rgba(239, 68, 68, 0.5), 0 4px 16px rgba(0,0,0,0.6)'
                    : '0 4px 14px rgba(0,0,0,0.3)',
                  transition: 'all 0.18s ease-in-out',
                  transform: isSelected ? 'scale(1.008)' : 'scale(1)',
                }}
              >
                {/* Top Bar on each card */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 16px',
                    backgroundColor: isBannedByMe
                      ? '#7f1d1d'
                      : isRemainingKept
                      ? '#064e3b'
                      : isSelected
                      ? '#7f1d1d'
                      : '#181826',
                    borderBottom: `1px solid ${isBannedByMe ? '#ef4444' : isRemainingKept ? '#10b981' : isSelected ? '#ef4444' : '#2d2d42'}`,
                    transition: 'background-color 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isBannedByMe ? '#ef4444' : isRemainingKept ? '#10b981' : isSelected ? '#ef4444' : '#374151',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {index + 1}
                    </span>
                    <span
                      style={{
                        fontSize: '17px',
                        fontWeight: 'bold',
                        color: '#f9fafb',
                        textDecoration: isBannedByMe ? 'line-through' : 'none',
                      }}
                    >
                      {faction.name}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#1f2937',
                        color: '#9ca3af',
                        border: '1px solid #374151',
                      }}
                    >
                      {faction.expansion === 'pok' ? 'Prophecy of Kings' : faction.expansion === 'thundersEdge' ? "Thunder's Edge" : 'Base Game'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isBannedByMe ? (
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fca5a5' }}>
                        🚫 Banned by You
                      </span>
                    ) : isRemainingKept ? (
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#6ee7b7' }}>
                        ✓ Kept in Pool
                      </span>
                    ) : isSelected ? (
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fca5a5' }}>
                        ✓ Selected for Ban
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        Click to select
                      </span>
                    )}
                  </div>
                </div>

                {/* High-Resolution Faction Sheet Container (Preserves natural horizontal ratio ~2800x1625) */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '2800 / 1625',
                    backgroundColor: '#0a0a10',
                  }}
                >
                  <img
                    src={`/factions/${encodeURIComponent(faction.filename)}`}
                    alt={faction.name}
                    loading="eager"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      opacity: isBannedByMe ? 0.6 : 1,
                      filter: isBannedByMe ? 'grayscale(40%)' : 'none',
                    }}
                  />

                  {/* Overlay for Banned Card */}
                  {isBannedByMe && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(239, 68, 68, 0.22)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '28px',
                          fontWeight: '900',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#ffffff',
                          backgroundColor: 'rgba(185, 28, 28, 0.92)',
                          padding: '12px 30px',
                          borderRadius: '8px',
                          border: '2px solid #fecaca',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                        }}
                      >
                        🚫 BANNED
                      </span>
                    </div>
                  )}

                  {/* Badge for Selection prior to submission */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(220, 38, 38, 0.95)',
                        color: '#ffffff',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        pointerEvents: 'none'
                      }}
                    >
                      🚫 Selected to Ban
                    </div>
                  )}

                  {/* Kept indicator */}
                  {isRemainingKept && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(5, 150, 105, 0.95)',
                        color: '#ffffff',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        pointerEvents: 'none'
                      }}
                    >
                      ✓ Kept Faction
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Sticky Column: Ban Confirmation Button & Secret Progress */}
        <div style={{ position: 'sticky', top: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Action Box */}
          <div
            style={{
              backgroundColor: '#171724',
              border: '1px solid #28283c',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#f9fafb' }}>
              Confirm Faction Ban
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#9ca3af', lineHeight: '1.4' }}>
              {hasSubmittedBan
                ? 'Your ban choice has been locked. The other 2 factions remain visible and will go into the draft pool.'
                : 'Select 1 of your 3 factions on the left, then click the button below. Your choice remains completely secret.'}
            </p>

            <button
              onClick={() => {
                if (!socket || !selectedBanFactionId || hasSubmittedBan) return;
                socket.emit('submit_faction_ban', {
                  roomId: room.id,
                  slotId: activePlayer.slotId,
                  factionId: selectedBanFactionId
                });
                setSelectedBanFactionId(null);
              }}
              disabled={!selectedBanFactionId || hasSubmittedBan}
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: '15px',
                fontWeight: 'bold',
                backgroundColor: hasSubmittedBan ? '#059669' : selectedBanFactionId ? '#dc2626' : '#374151',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: selectedBanFactionId && !hasSubmittedBan ? 'pointer' : 'not-allowed',
                boxShadow: selectedBanFactionId && !hasSubmittedBan ? '0 4px 16px rgba(220, 38, 38, 0.45)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {hasSubmittedBan ? (
                <>
                  <span>✓</span> Ban Submitted
                </>
              ) : selectedBanFactionId ? (
                <>
                  <span>🚫</span> Confirm Ban
                </>
              ) : (
                'Select a Faction'
              )}
            </button>

            {selectedBanFactionId && !hasSubmittedBan && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#fca5a5', textAlign: 'center' }}>
                Will ban: <strong>{FACTIONS.find(f => f.id === selectedBanFactionId)?.name}</strong>
              </div>
            )}
          </div>

          {/* Players Secret Banning Progress (ONLY shows whether each player has banned or not) */}
          <div
            style={{
              backgroundColor: '#171724',
              border: '1px solid #28283c',
              borderRadius: '12px',
              padding: '18px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#f3f4f6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Players Status
              </h4>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                {bannedCount}/{totalPlayersCount} ready
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {room.players.map((p) => {
                const isMe = Boolean(userId) && Boolean(p.claimedBy) && p.claimedBy === userId;
                return (
                  <div
                    key={p.slotId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: isMe ? '#1e293b' : '#111827',
                      border: `1px solid ${isMe ? '#3b82f6' : '#272738'}`,
                      borderRadius: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: isMe ? 'bold' : 'normal', color: isMe ? '#93c5fd' : '#e5e7eb' }}>
                        {p.name}
                      </span>
                      {isMe && (
                        <span style={{ fontSize: '10px', backgroundColor: '#2563eb', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                          YOU
                        </span>
                      )}
                    </div>

                    <div>
                      {p.hasBanned ? (
                        <span style={{ color: '#34d399', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>✓</span> Ready
                        </span>
                      ) : (
                        <span style={{ color: '#fbbf24', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>⏳</span> Deciding...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '12px', fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
              🔒 Player choices are hidden until draft ends.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
