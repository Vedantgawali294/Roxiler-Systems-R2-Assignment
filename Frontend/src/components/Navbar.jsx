import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLogOut, FiHome } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#e74c3c';
      case 'owner': return '#3498db';
      case 'user': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <FiHome className="brand-icon" />
          <span>StarRateX</span>
        </div>
        
        {user && (
          <div className="navbar-user">
            <div className="user-info">
              <FiUser className="user-icon" />
              <span className="user-name">{user.name}</span>
              <span 
                className="user-role" 
                style={{ backgroundColor: getRoleColor(user.role) }}
              >
                {user.role}
              </span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <FiLogOut />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
