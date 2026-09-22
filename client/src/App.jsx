import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import CreateRoom from './components/CreateRoom.jsx';
import RoomView from './components/RoomView.jsx';
import DraftPanel from './components/DraftPanel.jsx';

function Home() {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '36px', marginBottom: '12px', color: '#f9fafb' }}>
        Twilight Imperium 4
      </h1>
      <p style={{ color: '#9ca3af', marginBottom: '40px', fontSize: '16px' }}>
        Инструменты создания карты и драфта
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
          style={{ ...buttonStyle, backgroundColor: '#4b5563' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#4b5563'}
        >
          🎒 Bag Draft
        </Link>
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
          ← На главную
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
            <PageLayout title="Random Map Creation — Настройка">
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
              <DraftPanel />
            </PageLayout>
          } 
        />
      </Routes>
    </Router>
  );
}
