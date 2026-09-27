import React from 'react';

export default function TierConfigEditor({
  tiers,
  setTiers,
  tierError,
  setTierError,
  showTierConfig,
  setShowTierConfig,
  onResetTiers,
}) {
  return (
    <div style={{ marginBottom: '24px', borderBottom: '1px solid #28283c', paddingBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#e5e7eb', marginBottom: '8px' }}>
          Tile Balance Configuration:
        </label>
        <button
          id="toggle-balance-tiers-btn"
          type="button"
          onClick={() => setShowTierConfig(!showTierConfig)}
          style={{
            backgroundColor: 'transparent',
            color: '#60a5fa',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {showTierConfig ? 'Hide Tier Breakdown' : 'Customize 3 Tiers'}
        </button>
      </div>

      {showTierConfig && (
        <div style={{
          backgroundColor: '#151522',
          border: '1px solid #32324b',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>
              Enter tile numbers separated by commas for each of the three tiers:
            </p>
            <button
              id="reset-default-tiers-btn"
              type="button"
              onClick={onResetTiers}
              style={{
                backgroundColor: '#1f2937',
                color: '#93c5fd',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: '12px',
                whiteSpace: 'nowrap'
              }}
              title="Reset to default distribution for selected expansions"
            >
              Reset to Default
            </button>
          </div>

          {tierError && (
            <div
              id="tier-validation-error-msg"
              style={{
                backgroundColor: '#7f1d1d',
                color: '#fecaca',
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '14px',
                fontSize: '13px',
                lineHeight: '1.4',
                border: '1px solid #ef4444'
              }}
            >
              ⚠️ <strong>Tile Distribution Error:</strong> {tierError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { id: 'tier1-input', key: 'tier1', label: 'Tier 1 (High):', placeholder: 'e.g. 27, 28, 29, 30...' },
              { id: 'tier2-input', key: 'tier2', label: 'Tier 2 (Medium):', placeholder: 'e.g. 26, 31, 33, 34...' },
              { id: 'tier3-input', key: 'tier3', label: 'Tier 3 (Base):', placeholder: 'e.g. 19, 20, 21, 22...' }
            ].map(({ id, key, label, placeholder }) => (
              <div key={key}>
                <span style={{ fontSize: '13px', color: '#93c5fd', fontWeight: 600 }}>{label}</span>
                <input
                  id={id}
                  type="text"
                  value={tiers[key]}
                  onChange={(e) => {
                    setTiers({ ...tiers, [key]: e.target.value });
                    if (tierError) setTierError(null);
                  }}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#14141f',
                    border: '1px solid #3f3f5a',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    width: '100%',
                    marginTop: '4px'
                  }}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
