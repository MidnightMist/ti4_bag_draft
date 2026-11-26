import React from 'react';

export default function ReclaimSeatView({
  room,
  phaseLabel = 'Draft',
  onClaimSlot,
  actionError,
  onClearActionError,
  onBackHome,
}) {
  const unclaimedCount = room.players.filter((p) => !p.isClaimed).length;

  return (
    <div id="reclaim-seat-container" style={{ maxWidth: '880px', margin: '32px auto', padding: '0 12px' }}>
      <div
        style={{
          backgroundColor: '#171724',
          border: '1px solid #3b82f6',
          borderRadius: '14px',
          padding: '28px',
          boxShadow: '0 10px 36px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
              {phaseLabel} In Progress • Room ID: {room.id}
            </span>
            <h2 style={{ margin: '6px 0 8px 0', color: '#f9fafb', fontSize: '22px' }}>
              Rejoin Room — Claim Your Open Seat
            </h2>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px', lineHeight: '1.5' }}>
              The room host has released {unclaimedCount === 1 ? 'a player seat' : `${unclaimedCount} player seats`} so you can reconnect from this browser.
              Select your player slot below to resume your session.
            </p>
          </div>
          {onBackHome && (
            <button
              onClick={onBackHome}
              style={{
                padding: '8px 14px',
                backgroundColor: '#27273a',
                color: '#d1d5db',
                border: '1px solid #3f3f58',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              Back to Home
            </button>
          )}
        </div>

        {actionError && (
          <div
            style={{
              marginTop: '16px',
              backgroundColor: '#451a03',
              border: '1px solid #f59e0b',
              color: '#fef3c7',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>⚠️ {actionError}</span>
            {onClearActionError && (
              <button
                onClick={onClearActionError}
                style={{ background: 'none', border: 'none', color: '#fde68a', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '14px',
            marginTop: '24px',
          }}
        >
          {room.players.map((slot) => {
            const isFree = !slot.isClaimed;
            return (
              <div
                key={slot.slotId}
                id={`reclaim-slot-card-${slot.slotId}`}
                style={{
                  backgroundColor: isFree ? '#111c2d' : '#13131f',
                  border: `1.5px solid ${isFree ? '#10b981' : '#2a2a3e'}`,
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  opacity: isFree ? 1 : 0.65,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '700' }}>
                      SLOT {slot.slotId + 1}
                    </span>
                    {isFree ? (
                      <span style={{ fontSize: '11px', backgroundColor: '#064e3b', color: '#34d399', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                        Available
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', backgroundColor: '#374151', color: '#9ca3af', padding: '2px 8px', borderRadius: '10px' }}>
                        Claimed
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: '700', color: '#f9fafb', marginTop: '8px' }}>
                    {slot.name}
                  </div>
                </div>

                {isFree ? (
                  <button
                    id={`reclaim-btn-${slot.slotId}`}
                    onClick={() => onClaimSlot && onClaimSlot(slot.slotId)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#059669',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(5, 150, 105, 0.35)',
                    }}
                  >
                    Claim This Seat
                  </button>
                ) : (
                  <button
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#1f2937',
                      color: '#6b7280',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'not-allowed',
                    }}
                  >
                    Occupied
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
          🔒 Private draft hands and bans remain hidden until you claim your assigned seat.
        </div>
      </div>
    </div>
  );
}
