import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(localStorage.getItem('token') !== null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="container header-container">
        <div className="logo">
          <Link to="/">
            <h1>ReCanto</h1>
          </Link>
        </div>

        <button className="mobile-menu-button" onClick={toggleMobileMenu}>
          <span className="menu-icon"></span>
        </button>

        <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
          {isLoggedIn ? (
            <>
              <Link to="/" className="nav-link">Dashboard</Link>
              <Link to="/sentences" className="nav-link">Sentences</Link>
              <Link to="/quiz" className="nav-link">Quiz</Link>
              <Link to="/stats" className="nav-link">Statistics</Link>
              <button onClick={handleLogout} className="nav-link logout-button">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
