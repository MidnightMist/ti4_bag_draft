import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function Footer() {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const usdtAddress = 'TVgkHKWkbZ4ftqHCiAnn8Pg3WmqJiMBWpg';

  const handleCopy = () => {
    navigator.clipboard.writeText(usdtAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <footer style={{
      marginTop: '60px',
      borderTop: '1px solid #1f2937',
      backgroundColor: '#0b0f19',
      color: '#9ca3af',
      padding: '32px 20px',
      fontSize: '14px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* Support & Donation Section */}
        <div style={{
          backgroundColor: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '10px',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ maxWidth: '650px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '600', color: '#f3f4f6' }}>
                ☕ Support the Developer & Help with Hosting Costs
              </h3>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#9ca3af' }}>
                The project is completely free. If you like the service, you can buy the author a coffee or help with server hosting costs.
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setShowQR(!showQR)}
                style={{
                  backgroundColor: '#1f2937',
                  color: '#e5e7eb',
                  border: '1px solid #374151',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#1f2937'}
              >
                {showQR ? 'Hide QR Code' : '💎 Show USDT QR'}
              </button>
            </div>
          </div>

          {/* Address & Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            backgroundColor: '#030712',
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #1f2937',
          }}>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>USDT (TRC-20):</span>
            <code style={{ fontFamily: 'monospace', fontSize: '13px', color: '#34d399', wordBreak: 'break-all', flex: 1 }}>
              {usdtAddress}
            </code>
            <button
              onClick={handleCopy}
              style={{
                backgroundColor: copied ? '#059669' : '#2563eb',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {copied ? '✓ Copied!' : 'Copy Address'}
            </button>
          </div>

          {/* Expandable QR Code */}
          {showQR && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              padding: '16px',
              backgroundColor: '#030712',
              borderRadius: '8px',
              border: '1px solid #1f2937',
              alignSelf: 'center',
              marginTop: '4px',
            }}>
              <div style={{ background: 'white', padding: '12px', borderRadius: '8px' }}>
                <QRCodeSVG value={usdtAddress} size={160} level="M" />
              </div>
              <span style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                Scan with any TRC-20 compatible crypto wallet
              </span>
            </div>
          )}
        </div>

        {/* Bottom row: GitHub & Disclaimer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          paddingTop: '8px',
        }}>
          <a 
            href="https://github.com/MidnightMist/ti4_bag_draft" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#9ca3af',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
          >
            <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            GitHub Repository
          </a>

          <div style={{ fontSize: '11px', color: '#6b7280', maxWidth: '650px', lineHeight: '1.4', textAlign: 'right' }}>
            Twilight Imperium 4 Map & Bag Draft is an unofficial fan site. Twilight Imperium and all associated marks are trademarks or registered trademarks of Fantasy Flight Games / Asmodee. No copyright infringement intended.
          </div>
        </div>
      </div>
    </footer>
  );
}
