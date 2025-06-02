// src/App.tsx

import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Home from './pages/Home'
import Launch from './pages/Launch'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import Tokens from './pages/Tokens'
import Trade from './pages/Trade'

// Navigation component with NavLink for active styling
const Navigation = () => {
  const linkBase = {
    textDecoration: 'none',
    margin: '0 0.5rem',
    padding: '0.5rem 1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    color: '#333',
  }

  const activeLink = {
    ...linkBase,
    backgroundColor: '#007bff',
    color: '#fff',
  }

  return (
    <nav>
      <NavLink to="/" end style={({ isActive }) => isActive ? activeLink : linkBase}>
        Home
      </NavLink>
      <NavLink to="/launch" style={({ isActive }) => isActive ? activeLink : linkBase}>
        Launch
      </NavLink>
      <NavLink to="/leaderboard" style={({ isActive }) => isActive ? activeLink : linkBase}>
        Leaderboard
      </NavLink>
      <NavLink to="/profile" style={({ isActive }) => isActive ? activeLink : linkBase}>
        Profile
      </NavLink>
      <NavLink to="/tokens" style={({ isActive }) => isActive ? activeLink : linkBase}>
        Tokens
      </NavLink>
      <NavLink to="/trade" style={({ isActive }) => isActive ? activeLink : linkBase}>
        Trade
      </NavLink>
    </nav>
  )
}

function App() {
  return (
    <Router>
      {/* Header with navigation */}
      <header style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Navigation />
          <ConnectButton />
        </div>
      </header>

      {/* Main content with routes */}
      <main style={{ padding: '2rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/launch" element={<Launch />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tokens" element={<Tokens />} />
+          <Route path="/trade/:tokenAddress" element={<Trade />} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
