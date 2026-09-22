import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateRoom({ onCancel }) {
  const navigate = useNavigate();
  const [playerCount, setPlayerCount] = useState(6);
  const [playerNames, setPlayerNames] = useState([
    '', '', '', '', '', ''
  ]);
  const [expansions, setExpansions] = useState({
    pok: true,
    thundersEdge: false,
  });
  const [tileMode, setTileMode] = useState('balanced'); // 'random' | 'balanced'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showTierConfig, setShowTierConfig] = useState(false);

  // Balance tier defaults (sample placeholders for tier management)
  const [tiers, setTiers] = useState({
    tier1: '19, 20, 21, 22, 23, 24, 25, 26',
    tier2: '27, 28, 29, 30, 31, 32, 33, 34',
    tier3: '35, 36, 37, 38, 59, 64, 65, 66'
  });

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
    try {
      const payload = {
        playerCount,
        playerNames: playerNames.slice(0, playerCount),
        expansions,
        tileMode,
        balanceTiers: {
          tier1: tiers.tier1.split(',').map(s => s.trim()).filter(Boolean),
          tier2: tiers.tier2.split(',').map(s => s.trim()).filter(Boolean),
          tier3: tiers.tier3.split(',').map(s => s.trim()).filter(Boolean),
        }
      };

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Не удалось создать комнату');
      }

      const data = await res.json();
      if (data.roomId) {
        navigate(`/room/${data.roomId}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ошибка соединения с сервером');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="create-room-container" style={containerStyle}>
      <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', color: '#f3f4f6' }}>
        Настройки комнаты: Random Map Creation
      </h2>

      {error && (
        <div style={errorBannerStyle}>
          {error}
        </div>
      )}

      {/* Количество игроков */}
      <div style={sectionStyle}>
        <label style={labelStyle}>
          Количество игроков:
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

      {/* Имена игроков */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Имена игроков:</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginTop: '8px' }}>
          {playerNames.slice(0, playerCount).map((name, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>Слот {idx + 1}</span>
              <input
                id={`player-name-input-${idx}`}
                type="text"
                value={name}
                onChange={(e) => handleNameChange(idx, e.target.value)}
                style={inputStyle}
                placeholder={`Игрок ${idx + 1}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Дополнения */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Дополнения:</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <label style={checkboxLabelStyle}>
            <input
              id="expansion-pok-checkbox"
              type="checkbox"
              checked={expansions.pok}
              onChange={(e) => setExpansions({ ...expansions, pok: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ color: '#e5e7eb', fontSize: '15px' }}>Prophecy of Kings (PoK)</span>
          </label>
          <label style={checkboxLabelStyle}>
            <input
              id="expansion-thundersedge-checkbox"
              type="checkbox"
              checked={expansions.thundersEdge}
              onChange={(e) => setExpansions({ ...expansions, thundersEdge: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ color: '#e5e7eb', fontSize: '15px' }}>Thunder's Edge</span>
          </label>
        </div>
      </div>

      {/* Режим тайлов */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Режим распределения тайлов:</label>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <label style={radioLabelStyle}>
            <input
              id="tile-mode-balanced-radio"
              type="radio"
              name="tileMode"
              value="balanced"
              checked={tileMode === 'balanced'}
              onChange={() => setTileMode('balanced')}
            />
            <span>Сбалансированные тайлы (3 тира)</span>
          </label>
          <label style={radioLabelStyle}>
            <input
              id="tile-mode-random-radio"
              type="radio"
              name="tileMode"
              value="random"
              checked={tileMode === 'random'}
              onChange={() => setTileMode('random')}
            />
            <span>Случайные тайлы</span>
          </label>
        </div>
      </div>

      {/* Настройка баланса (3 тира) */}
      {tileMode === 'balanced' && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={labelStyle}>Настройка баланса тайлов:</label>
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
              {showTierConfig ? 'Скрыть разбивку по тирам' : 'Настроить разделение на 3 тира'}
            </button>
          </div>

          {showTierConfig && (
            <div style={tierModalContentStyle}>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#9ca3af' }}>
                Укажите номера тайлов через запятую для каждого из трех тиров (баланс синих тайлов):
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '13px', color: '#93c5fd', fontWeight: 600 }}>Тир 1 (Высокий):</span>
                  <input
                    id="tier1-input"
                    type="text"
                    value={tiers.tier1}
                    onChange={(e) => setTiers({ ...tiers, tier1: e.target.value })}
                    style={{ ...inputStyle, width: '100%', marginTop: '4px' }}
                    placeholder="Например: 19, 20, 21, 22..."
                  />
                </div>
                <div>
                  <span style={{ fontSize: '13px', color: '#93c5fd', fontWeight: 600 }}>Тир 2 (Средний):</span>
                  <input
                    id="tier2-input"
                    type="text"
                    value={tiers.tier2}
                    onChange={(e) => setTiers({ ...tiers, tier2: e.target.value })}
                    style={{ ...inputStyle, width: '100%', marginTop: '4px' }}
                    placeholder="Например: 27, 28, 29, 30..."
                  />
                </div>
                <div>
                  <span style={{ fontSize: '13px', color: '#93c5fd', fontWeight: 600 }}>Тир 3 (Базовый):</span>
                  <input
                    id="tier3-input"
                    type="text"
                    value={tiers.tier3}
                    onChange={(e) => setTiers({ ...tiers, tier3: e.target.value })}
                    style={{ ...inputStyle, width: '100%', marginTop: '4px' }}
                    placeholder="Например: 35, 36, 37, 38..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Кнопка создания */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
        <button
          id="submit-create-room-btn"
          type="button"
          onClick={handleCreate}
          disabled={isSubmitting}
          style={primaryBtnStyle}
        >
          {isSubmitting ? 'Создание...' : 'Создать комнату'}
        </button>

        {onCancel && (
          <button
            id="cancel-create-room-btn"
            type="button"
            onClick={onCancel}
            style={secondaryBtnStyle}
          >
            Отмена
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

const radioLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  fontSize: '15px',
  color: '#e5e7eb',
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
