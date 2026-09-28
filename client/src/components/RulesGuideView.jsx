import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer.jsx';

export default function RulesGuideView() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', boxSizing: 'border-box' }}>
      <div style={{ padding: '24px 20px', maxWidth: '900px', margin: '0 auto', width: '100%', flex: 1 }}>
        {/* Header navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}>
          <div>
            <h1 style={{ fontSize: '28px', color: '#f9fafb', margin: '0 0 6px 0' }}>
              📖 Game Modes & Rules Guide
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '15px', margin: 0 }}>
              Learn how each game mode and tool works in Twilight Imperium 4 Map & Bag Draft.
            </p>
          </div>
          <button 
            onClick={() => navigate('/')} 
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: '#1f2937',
              color: '#e5e7eb',
              border: '1px solid #374151',
              borderRadius: '6px',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#1f2937'}
          >
            ← Home
          </button>
        </div>

        {/* Content sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Random Map Creation */}
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '10px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <h2 style={{ fontSize: '20px', color: '#60a5fa', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🎲</span> Random Map Creation
            </h2>
            <p style={{ color: '#d1d5db', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              The <strong>Random Map Generator</strong> allows players to quickly set up a fair and balanced galaxy for Twilight Imperium 4 (including  Prophecy of Kings and Thunder''s Edge  expansions).
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '8px' }}>
              <div style={{ backgroundColor: '#030712', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                <h3 style={{ fontSize: '15px', color: '#f3f4f6', margin: '0 0 6px 0' }}>Tier Balancer</h3>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
                  Ensures resources, influence, and anomalies are distributed fairly across slices so that no single player starts with an overwhelming geographical advantage.
                </p>
              </div>

              <div style={{ backgroundColor: '#030712', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                <h3 style={{ fontSize: '15px', color: '#f3f4f6', margin: '0 0 6px 0' }}>Interactive Room & Zoom</h3>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
                  Inspect tile traits, wormholes, anomalies, and planet stats directly on the galaxy map with detailed previews before the game begins.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Bag Draft */}
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '10px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <h2 style={{ fontSize: '20px', color: '#34d399', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🎒</span> Bag Draft
            </h2>
            <p style={{ color: '#d1d5db', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              The <strong>Bag Draft</strong> mode revolutionizes how players acquire factions and starting tiles in a competitive or casual match.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '8px' }}>
              <div style={{ backgroundColor: '#030712', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                <h3 style={{ fontSize: '15px', color: '#f3f4f6', margin: '0 0 6px 0' }}>Draft Phases</h3>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
                  Configure multiple rounds and categories (factions, tiles, or custom pools) where players draw items secretly from a virtual bag.
                </p>
              </div>

              <div style={{ backgroundColor: '#030712', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                <h3 style={{ fontSize: '15px', color: '#f3f4f6', margin: '0 0 6px 0' }}>Faction Bans & Pools</h3>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
                  Hosts can preset allowed expansions and ban specific overpowered factions.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer showDonate={false} />
    </div>
  );
}
