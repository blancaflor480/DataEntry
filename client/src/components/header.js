import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../style/header.css";

const Header = ({ toggleSidebar, userEmail }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="header-right d-flex justify-content-between align-items-center p-3 bg-light border-bottom">
      {/* Sidebar Toggle Button (aligned to the start) */}
      <button onClick={toggleSidebar} className="sidebar-toggle btn ">
        ☰
      </button>

      {/* Profile Dropdown (aligned to the end) */}
      <div className="profile-dropdown" onClick={toggleDropdown}>
      <span className="profile-name me-2">{userEmail}</span> {/* Use userEmail */}
        <i className="fas fa-user-circle"></i>
        {isDropdownOpen && (
          <div className="dropdown-menu show">
            <Link to="/account-settings" className="dropdown-item">
              Account Settings
            </Link>
            <Link to="/logout" className="dropdown-item">
              Logout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;