import React from "react";
import { Link } from "react-router-dom";
import "../style/header.css";

const Header = ({ toggleSidebar, userEmail, userRole, handleLogout }) => {
  return (
    <div className="header-right d-flex justify-content-between align-items-center p-3 bg-light border-bottom">
      {/* Sidebar Toggle Button (aligned to the start) */}
      <button onClick={toggleSidebar} className="sidebar-toggle btn">
        ☰
      </button>

      {/* User Info and Actions (aligned to the end) */}
      <div className="user-info-container d-flex align-items-center">
        <div className="user-info me-3">
          <span className="profile-name me-2">{userEmail}</span>
          <span className="profile-name me-2">|</span>
          <span className="profile-name me-2">{userRole}</span>
          <i className="icon fas fa-user-circle me-2"></i>
        </div>
        
        <div className="header-actions d-flex">
          <Link to="/account-settings" className="btn btn-outline-secondary btn-sm me-2">
            <i className="fas fa-cog me-1"></i> Settings
          </Link>
          <button onClick={handleLogout} className="btn btn-danger btn-sm">
            <i className="fas fa-sign-out-alt me-1"></i> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;