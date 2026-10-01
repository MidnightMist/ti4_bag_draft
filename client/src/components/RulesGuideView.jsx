import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer.jsx';

export default function RulesGuideView() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', boxSizing: 'border-box' }}>
      <div style={{ padding: '24px 20px', maxWidth: '960px', margin: '0 auto', width: '100%', flex: 1 }}>
        {/* Header navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h1 style={{ fontSize: '28px', color: '#f9fafb', margin: '0 0 6px 0', fontWeight: '700' }}>
              📖 Game Modes & Rules Guide
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '15px', margin: 0 }}>
              Learn how Galaxy Builder and Bag Draft work in the Twilight Imperium 4 companion tool.
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
              fontWeight: '500',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#1f2937'}
          >
            ← Home
          </button>
        </div>

        {/* Content sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Section 1: Galaxy Builder */}
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>🌌</span>
              <div>
                <h2 style={{ fontSize: '22px', color: '#60a5fa', margin: 0, fontWeight: '700' }}>
                  Galaxy Builder
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: '2px 0 0 0' }}>
                  Collaborative, rules-based map building for 3–8 players
                </p>
              </div>
            </div>

            <p style={{ color: '#d1d5db', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              The <strong>Galaxy Builder</strong> lets players cooperatively construct the board according to official Twilight Imperium 4 rules. Players take turns placing system tiles from their dealt hands directly onto the board in snake draft order, ensuring an engaging and tactically rich map setup.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div style={{ backgroundColor: '#030712', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                <h3 style={{ fontSize: '15px', color: '#93c5fd', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚖️</span> 3-Tier Balance System
                </h3>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
                  Blue system tiles can be dealt using balanced tiers (Tier 1 high-value, Tier 2 mid, Tier 3 low) so that every player receives an equivalent resource/influence foundation.
                </p>
              </div>

              <div style={{ backgroundColor: '#030712', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                <h3 style={{ fontSize: '15px', color: '#93c5fd', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔄</span> Ring Progression & Adjacency
                </h3>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
                  Enforces TI4 placement constraints: Ring 1 (around Mecatol Rex) must be filled before Ring 2, and Ring 2 before Ring 3. Anomalies and identical wormholes cannot be placed adjacent to each other unless forced.
                </p>
              </div>

              <div style={{ backgroundColor: '#030712', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                <h3 style={{ fontSize: '15px', color: '#93c5fd', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🧭</span> Dynamic Perspective & Numbers
                </h3>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
                  Players can rotate the map to view the galaxy directly from their own seat, preview high-contrast tile numbers, and zoom in on any system tile to examine planet values and tech specialties.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Bag Draft */}
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>🎒</span>
              <div>
                <h2 style={{ fontSize: '22px', color: '#34d399', margin: 0, fontWeight: '700' }}>
                  Bag Draft
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: '2px 0 0 0' }}>
                  Complete competitive draft of factions and system tiles before map construction
                </p>
              </div>
            </div>

            <p style={{ color: '#d1d5db', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              <strong>Bag Draft</strong> is an all-in-one pre-game drafting system where players assemble both their galaxy system tiles and their faction options simultaneously through secret circulating hands. Instead of simply receiving fixed random tiles and factions, players actively tailor their hand through strategic picks and counter-drafting.
            </p>

            {/* Step-by-Step Process */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '16px', color: '#e5e7eb', margin: '4px 0 0 0', fontWeight: '600' }}>
                Full Step-by-Step Flow:
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Step 1 */}
                <div style={{
                  backgroundColor: '#030712',
                  border: '1px solid #1f2937',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#065f46',
                    color: '#6ee7b7',
                    fontWeight: '700',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                  }}>
                    1
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#34d399', fontWeight: '600' }}>
                      Faction Ban Phase (3 Dealt → 1 Banned)
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }}>
                      At the start, each player is dealt <strong>3 random factions</strong> from the chosen expansion pool. Each player secretly inspects their faction sheets and chooses <strong>1 faction to ban</strong>. The banned factions are permanently removed from the game, and the remaining 2 factions per player are shuffled back together into a shared faction draft pool.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{
                  backgroundColor: '#030712',
                  border: '1px solid #1f2937',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#065f46',
                    color: '#6ee7b7',
                    fontWeight: '700',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                  }}>
                    2
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#34d399', fontWeight: '600' }}>
                      Hand Dealing & Circulating Draft
                    </h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }}>
                      From the post-ban pool and balanced tile sets, each player is dealt an opening hand containing:
                    </p>
                    <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px', fontSize: '13px', color: '#d1d5db', lineHeight: '1.5' }}>
                      <li><strong>2 Factions</strong> (from the unbanned faction pool)</li>
                      <li><strong>3 Blue System Tiles</strong> (1 from Tier 1, 1 from Tier 2, 1 from Tier 3; or 6 Blue in 3-player games)</li>
                      <li><strong>2 Red System Tiles</strong> (anomalies, hazardous gravity rifts, supernova, asteroid fields)</li>
                    </ul>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }}>
                      In each round, every player inspects their current secret hand, drafts <strong>1 element</strong> (Faction or Tile) into their reserve according to their remaining quota, and passes the remaining hand to the next player. Draft rounds circulate until every player has collected their complete reserve of <strong>7 items</strong> (2 Factions, 3 Blue tiles, and 2 Red tiles).
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{
                  backgroundColor: '#030712',
                  border: '1px solid #1f2937',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#065f46',
                    color: '#6ee7b7',
                    fontWeight: '700',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                  }}>
                    3
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#34d399', fontWeight: '600' }}>
                      Galaxy Map Construction (Snake Placement)
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }}>
                      Once the draft concludes, players transition to the galaxy map with their 5 drafted system tiles (3 Blue and 2 Red). Starting from the Speaker, players place tiles in snake order (1 → 2 → ... → N → N → ... → 1) following standard rules (Ring 1 first, then Ring 2, then Ring 3, respecting anomaly and wormhole restrictions).
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div style={{
                  backgroundColor: '#030712',
                  border: '1px solid #1f2937',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#065f46',
                    color: '#6ee7b7',
                    fontWeight: '700',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                  }}>
                    4
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#34d399', fontWeight: '600' }}>
                      Final Faction Selection
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }}>
                      When the galaxy map is completely built, players make their final empire decision. Starting from the <strong>Speaker</strong> and proceeding in turn order, each player chooses <strong>1 of their 2 drafted factions</strong> to play. That faction&apos;s unique Home System tile illustration immediately appears on the galaxy board at their position, ready for the game!
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick summary box */}
            <div style={{
              backgroundColor: '#022c22',
              border: '1px solid #065f46',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ fontSize: '20px' }}>💡</span>
              <p style={{ margin: 0, fontSize: '13px', color: '#a7f3d0', lineHeight: '1.5' }}>
                <strong>Key Strategy:</strong> You draft factions and tiles together! If you pick an anomaly-heavy faction or a tech-dependent faction, you can draft corresponding system tiles to create your ideal slice before deciding on your final faction.
              </p>
            </div>

          </div>

        </div>
      </div>
      <Footer showDonate={false} />
    </div>
  );
}
