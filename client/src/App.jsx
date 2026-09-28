import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import CreateRoom from './components/CreateRoom.jsx';
import RoomView from './components/RoomView.jsx';
import CreateDraftRoom from './components/CreateDraftRoom.jsx';

function Home() {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '80vh', justifyContent: 'space-between' }}>
      <div>
        <h1 style={{ fontSize: '36px', marginBottom: '12px', color: '#f9fafb' }}>
          Twilight Imperium 4
        </h1>
        <p style={{ color: '#9ca3af', marginBottom: '40px', fontSize: '16px' }}>
          Map Generator and Bag Draft Tools
        </p>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link 
            to="/map" 
            style={buttonStyle} 
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            🎲 Random Map Creation
          </Link>
          <Link 
            to="/draft" 
            style={{ ...buttonStyle, backgroundColor: '#059669' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#059669'}
          >
            🎒 Bag Draft
          </Link>
        </div>
      </div>

      <div style={{ marginTop: '60px', paddingTop: '20px', borderTop: '1px solid #1f2937' }}>
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
            fontSize: '14px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
        >
          <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          GitHub Repository
        </a>
      </div>
    </div>
  );
}

function PageLayout({ title, children }) {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '24px', minHeight: '100vh', boxSizing: 'border-box' }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 24px auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#e5e7eb' }}>{title}</h2>
        <button 
          onClick={() => navigate('/')} 
          style={backButtonStyle}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#1f2937'}
        >
          ← Home
        </button>
      </div>
      {children}
    </div>
  );
}

const buttonStyle = {
  padding: '16px 32px',
  fontSize: '18px',
  fontWeight: '600',
  backgroundColor: '#2563eb',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '8px',
  transition: 'background-color 0.2s',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
};

const backButtonStyle = {
  padding: '8px 16px',
  cursor: 'pointer',
  backgroundColor: '#1f2937',
  color: '#e5e7eb',
  border: '1px solid #374151',
  borderRadius: '6px',
  fontSize: '14px',
  transition: 'background-color 0.2s',
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/map" 
          element={
            <PageLayout title="Random Map Creation — Setup">
              <CreateRoom />
            </PageLayout>
          } 
        />
        <Route 
          path="/room/:roomId" 
          element={
            <PageLayout title="TI4 Map Builder">
              <RoomView />
            </PageLayout>
          } 
        />
        <Route 
          path="/draft" 
          element={
            <PageLayout title="Bag Draft">
              <CreateDraftRoom />
            </PageLayout>
          } 
        />
      </Routes>
    </Router>
  );
}
