import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import MapGrid from './components/MapGrid.jsx';
import DraftPanel from './components/DraftPanel.jsx';

function Home() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Twilight Imperium 4</h1>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '40px' }}>
        <Link to="/map" style={buttonStyle}>Random Map Creation</Link>
        <Link to="/draft" style={buttonStyle}>Bag Draft</Link>
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
        <button onClick={() => navigate('/')} style={backButtonStyle}>Back</button>
      </div>
      <hr />
      {children}
    </div>
  );
}

const buttonStyle = {
  padding: '15px 30px',
  fontSize: '18px',
  backgroundColor: '#444',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '8px',
};

const backButtonStyle = {
  padding: '8px 16px',
  cursor: 'pointer',
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
        <Link to="/draft" style={buttonStyle}>Bag Draft</Link>
      </div>
    </div>
  );
}
