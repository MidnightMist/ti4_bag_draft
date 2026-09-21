import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import MapGrid from './components/MapGrid.jsx';
import DraftPanel from './components/DraftPanel.jsx';

function Home() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Twilight Imperium 4</h1>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '40px' }}>
        <Link 
          to="/map" 
          style={buttonStyle} 
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          Random Map Creation
        </Link>
        <Link 
          to="/draft" 
          style={buttonStyle}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          Bag Draft
        </Link>
      </div>
    </div>
  );
}

function PageLayout({ title, children }) {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{title}</h2>
        <button 
          onClick={() => navigate('/')} 
          style={backButtonStyle}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          Back
        </button>
      </div>
      <hr />
      {children}
    </div>
  );
}

const buttonStyle = {
  padding: '15px 30px',
  fontSize: '18px',
  backgroundColor: '#007bff',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '8px',
  transition: 'background-color 0.2s',
};

const backButtonStyle = {
  padding: '8px 16px',
  cursor: 'pointer',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '16px',
  transition: 'background-color 0.2s',
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<PageLayout title="Random Map Creation"><MapGrid /></PageLayout>} />
        <Route path="/draft" element={<PageLayout title="Bag Draft"><DraftPanel /></PageLayout>} />
      </Routes>
    </Router>
  );
}
