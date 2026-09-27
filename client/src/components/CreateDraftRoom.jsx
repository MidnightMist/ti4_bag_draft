import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDefaultTiersForExpansions
} from '../data/blueTiles.js';
import { validateBlueTiers } from '../data/tierValidator.js';
import { FACTIONS, getActiveFactions } from '../data/factionsData.js';

export default function CreateDraftRoom({ onCancel }) {
  const navigate = useNavigate();
  const [playerCount, setPlayerCount] = useState(6);
  const [playerNames, setPlayerNames] = useState(['', '', '', '', '', '']);
  const [expansions, setExpansions] = useState({
    pok: true,
    thundersEdge: true,
  });

  // Selected faction IDs state (default: all active factions selected)
  const initialActiveFactions = getActiveFactions({ pok: true, thundersEdge: true });
  const [selectedFactionIds, setSelectedFactionIds] = useState(
    new Set(initialActiveFactions.map(f => f.id))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [tierError, setTierError] = useState(null);
  const [showTierConfig, setShowTierConfig] = useState(false);

  // Balance tier defaults (blue tiles of active expansions by tier)
  const initialDefaultTiers = getDefaultTiersForExpansions({ pok: true, thundersEdge: true });
  const [tiers, setTiers] = useState({
    tier1: initialDefaultTiers.tier1.join(', '),
    tier2: initialDefaultTiers.tier2.join(', '),
    tier3: initialDefaultTiers.tier3.join(', ')
  });

  const handleResetTiers = () => {
    const defaultTiers = getDefaultTiersForExpansions(expansions);
    setTiers({
      tier1: defaultTiers.tier1.join(', '),
      tier2: defaultTiers.tier2.join(', '),
      tier3: defaultTiers.tier3.join(', ')
    });
    setTierError(null);
  };

  const handleExpansionToggle = (expKey, isChecked) => {
    const updatedExpansions = { ...expansions, [expKey]: isChecked };
    setExpansions(updatedExpansions);

    // Update default tiers when expansions change
    const updatedDefaultTiers = getDefaultTiersForExpansions(updatedExpansions);
    setTiers({
      tier1: updatedDefaultTiers.tier1.join(', '),
      tier2: updatedDefaultTiers.tier2.join(', '),
      tier3: updatedDefaultTiers.tier3.join(', ')
    });
    setTierError(null);

    // Update selected factions: if expansion is disabled, remove its factions; if enabled, add them by default
    const newSelected = new Set(selectedFactionIds);
    FACTIONS.forEach(f => {
      if (f.expansion === expKey) {
        if (isChecked) {
          newSelected.add(f.id);
        } else {
          newSelected.delete(f.id);
        }
      }
    });
    setSelectedFactionIds(newSelected);
  };

  const handleFactionToggle = (factionId) => {
    const newSelected = new Set(selectedFactionIds);
    if (newSelected.has(factionId)) {
      newSelected.delete(factionId);
    } else {
      newSelected.add(factionId);
    }
    setSelectedFactionIds(newSelected);
  };

  const handleSelectAllFactions = (select) => {
    const active = getActiveFactions(expansions);
    const newSelected = new Set(selectedFactionIds);
    active.forEach(f => {
      if (select) {
        newSelected.add(f.id);
      } else {
        newSelected.delete(f.id);
      }
    });
    setSelectedFactionIds(newSelected);
  };

  const handlePlayerCountChange = (newCount) => {
    const count = parseInt(newCount, 10);
    setPlayerCount(count);
    const updatedNames = [...playerNames];
    while (updatedNames.length < count) {
      updatedNames.push('');
    }
    setPlayerNames(updatedNames.slice(0, count));
  };

  const handleNameChange = (index, value) => {
    const updated = [...playerNames];
    updated[index] = value;
    setPlayerNames(updated);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    setError(null);
    setTierError(null);

    // Bag Draft always uses balanced tiles
    const validation = validateBlueTiers(tiers, expansions);
    if (!validation.isValid) {
      setTierError(validation.error);
      setError(validation.error);
      setShowTierConfig(true);
      setIsSubmitting(false);
      return;
    }
    const parsedTiers = validation.parsed;

    const activeFactions = getActiveFactions(expansions);
    const chosenFactions = activeFactions.filter(f => selectedFactionIds.has(f.id)).map(f => f.id);
    const minRequiredFactions = playerCount * 3;
    if (chosenFactions.length < minRequiredFactions) {
      setError(`Please select at least ${minRequiredFactions} factions (${playerCount} players × 3 factions per player). Currently selected: ${chosenFactions.length}.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        gameMode: 'draft',
        playerCount,
        playerNames: playerNames.slice(0, playerCount),
        expansions,
        tileMode: 'balanced',
        balanceTiers: parsedTiers,
        selectedFactions: chosenFactions
      };

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        const errorData = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
        throw new Error(errorData.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      if (data.roomId) {
        navigate(`/room/${data.roomId}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const baseFactions = FACTIONS.filter(f => f.expansion === 'base');
  const pokFactions = FACTIONS.filter(f => f.expansion === 'pok');
  const teFactions = FACTIONS.filter(f => f.expansion === 'thundersEdge');

  return (
    <div id="create-draft-room-container" style={containerStyle}>
      <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', color: '#f3f4f6' }}>
        Room Setup: Bag Draft
      </h2>

      {error && (
        <div style={errorBannerStyle}>
          {error}
        </div>
      )}

      {/* Player count */}
      <div style={sectionStyle}>
        <label style={labelStyle}>
          Number of Players:
          <span style={{ marginLeft: '10px', fontWeight: 'bold', color: '#60a5fa' }}>{playerCount}</span>
        </label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {[3, 4, 5, 6, 7, 8].map((num) => (
            <button
              key={num}
              type="button"
              id={`player-count-btn-${num}`}
              onClick={() => handlePlayerCountChange(num)}
              style={{
                ...toggleBtnStyle,
                backgroundColor: playerCount === num ? '#3b82f6' : '#2b2d42',
                borderColor: playerCount === num ? '#60a5fa' : '#3f3f5a',
                color: '#fff'
              }}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Player names */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Player Names:</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginTop: '8px' }}>
          {playerNames.slice(0, playerCount).map((name, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>Slot {idx + 1}</span>
              <input
                id={`player-name-input-${idx}`}
                type="text"
                value={name}
                onChange={(e) => handleNameChange(idx, e.target.value)}
                style={inputStyle}
                placeholder={`Player ${idx + 1}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Expansions */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Expansions:</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <label style={checkboxLabelStyle}>
            <input
              id="expansion-pok-checkbox"
              type="checkbox"
              checked={expansions.pok}
              onChange={(e) => handleExpansionToggle('pok', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ color: '#e5e7eb', fontSize: '15px' }}>Prophecy of Kings (PoK)</span>
          </label>
          <label style={checkboxLabelStyle}>
            <input
              id="expansion-thundersedge-checkbox"
              type="checkbox"
              checked={expansions.thundersEdge}
              onChange={(e) => handleExpansionToggle('thundersEdge', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ color: '#e5e7eb', fontSize: '15px' }}>Thunder's Edge</span>
          </label>
        </div>
      </div>

      {/* Factions selection */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>
            Available Factions ({selectedFactionIds.size} selected):
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleSelectAllFactions(true)}
              style={smallActionBtnStyle}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => handleSelectAllFactions(false)}
              style={smallActionBtnStyle}
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Base Game Factions */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ color: '#93c5fd', fontSize: '14px', marginBottom: '8px', marginTop: 0 }}>Base Game Factions</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {baseFactions.map(f => (
              <label key={f.id} style={{ ...checkboxLabelStyle, fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={selectedFactionIds.has(f.id)}
                  onChange={() => handleFactionToggle(f.id)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.name}>{f.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* PoK Factions */}
        <div style={{ marginBottom: '16px', opacity: expansions.pok ? 1 : 0.5 }}>
          <h4 style={{ color: '#93c5fd', fontSize: '14px', marginBottom: '8px', marginTop: 0 }}>
            Prophecy of Kings Expansion Factions {!expansions.pok && '(Disabled)'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {pokFactions.map(f => (
              <label key={f.id} style={{ ...checkboxLabelStyle, fontSize: '14px', cursor: expansions.pok ? 'pointer' : 'not-allowed' }}>
                <input
                  type="checkbox"
                  checked={selectedFactionIds.has(f.id)}
                  disabled={!expansions.pok}
                  onChange={() => handleFactionToggle(f.id)}
                  style={{ width: '16px', height: '16px', cursor: expansions.pok ? 'pointer' : 'not-allowed' }}
                />
                <span style={{ color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.name}>{f.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Thunder's Edge Factions */}
        <div style={{ opacity: expansions.thundersEdge ? 1 : 0.5 }}>
          <h4 style={{ color: '#93c5fd', fontSize: '14px', marginBottom: '8px', marginTop: 0 }}>
            Thunder's Edge Expansion Factions {!expansions.thundersEdge && '(Disabled)'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {teFactions.map(f => (
              <label key={f.id} style={{ ...checkboxLabelStyle, fontSize: '14px', cursor: expansions.thundersEdge ? 'pointer' : 'not-allowed' }}>
                <input
                  type="checkbox"
                  checked={selectedFactionIds.has(f.id)}
                  disabled={!expansions.thundersEdge}
                  onChange={() => handleFactionToggle(f.id)}
                  style={{ width: '16px', height: '16px', cursor: expansions.thundersEdge ? 'pointer' : 'not-allowed' }}
                />
                <span style={{ color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.name}>{f.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Tile Distribution Mode (Balanced Tiles only - fixed) */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Tile Distribution Mode:</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd', fontSize: '15px' }}>
          <span>⚖️ Balanced Tiles (3 Tiers) — Always enabled for Bag Draft</span>
        </div>
      </div>

      {/* Tier configuration */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={labelStyle}>Tile Balance Configuration:</label>
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
          <div style={tierModalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>
                Enter tile numbers separated by commas for each of the three tiers:
              </p>
              <button
                id="reset-default-tiers-btn"
                type="button"
                onClick={handleResetTiers}
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
              <div>
                <span style={{ fontSize: '13px', color: '#93c5fd', fontWeight: 600 }}>Tier 1 (High):</span>
                <input
                  id="tier1-input"
                  type="text"
                  value={tiers.tier1}
                  onChange={(e) => {
                    setTiers({ ...tiers, tier1: e.target.value });
                    if (tierError) setTierError(null);
                  }}
                  style={{ ...inputStyle, width: '100%', marginTop: '4px' }}
                  placeholder="e.g. 27, 28, 29, 30..."
                />
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#93c5fd', fontWeight: 600 }}>Tier 2 (Medium):</span>
                <input
                  id="tier2-input"
                  type="text"
                  value={tiers.tier2}
                  onChange={(e) => {
                    setTiers({ ...tiers, tier2: e.target.value });
                    if (tierError) setTierError(null);
                  }}
                  style={{ ...inputStyle, width: '100%', marginTop: '4px' }}
                  placeholder="e.g. 26, 31, 33, 34..."
                />
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#93c5fd', fontWeight: 600 }}>Tier 3 (Base):</span>
                <input
                  id="tier3-input"
                  type="text"
                  value={tiers.tier3}
                  onChange={(e) => {
                    setTiers({ ...tiers, tier3: e.target.value });
                    if (tierError) setTierError(null);
                  }}
                  style={{ ...inputStyle, width: '100%', marginTop: '4px' }}
                  placeholder="e.g. 19, 20, 21, 22..."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
        <button
          id="submit-create-draft-room-btn"
          type="button"
          onClick={handleCreate}
          disabled={isSubmitting}
          style={primaryBtnStyle}
        >
          {isSubmitting ? 'Creating Draft Room...' : 'Create Draft Room'}
        </button>

        {onCancel && (
          <button
            id="cancel-create-draft-room-btn"
            type="button"
            onClick={onCancel}
            style={secondaryBtnStyle}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

const containerStyle = {
  maxWidth: '800px',
  margin: '0 auto',
  backgroundColor: '#1e1e2d',
  border: '1px solid #323248',
  borderRadius: '12px',
  padding: '32px',
};

const sectionStyle = {
  marginBottom: '24px',
  borderBottom: '1px solid #28283c',
  paddingBottom: '20px',
};

const labelStyle = {
  display: 'block',
  fontSize: '16px',
  fontWeight: '600',
  color: '#e5e7eb',
  marginBottom: '8px',
};

const inputStyle = {
  padding: '10px 14px',
  backgroundColor: '#14141f',
  border: '1px solid #3f3f5a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box',
};

const toggleBtnStyle = {
  padding: '10px 18px',
  fontSize: '16px',
  border: '1px solid',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer',
};

const smallActionBtnStyle = {
  backgroundColor: '#1f2937',
  color: '#93c5fd',
  border: '1px solid #374151',
  borderRadius: '4px',
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: '12px',
};

const tierModalContentStyle = {
  marginTop: '12px',
  padding: '16px',
  backgroundColor: '#161622',
  borderRadius: '8px',
  border: '1px solid #2f2f45',
};

const primaryBtnStyle = {
  flex: 1,
  padding: '14px 28px',
  fontSize: '16px',
  fontWeight: 'bold',
  backgroundColor: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const secondaryBtnStyle = {
  padding: '14px 28px',
  fontSize: '16px',
  backgroundColor: '#374151',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};

const errorBannerStyle = {
  padding: '12px 16px',
  backgroundColor: '#7f1d1d',
  color: '#fecaca',
  borderRadius: '6px',
  marginBottom: '20px',
  fontSize: '14px',
};
