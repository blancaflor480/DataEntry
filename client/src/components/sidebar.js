import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../style/sidebar.css";
import logo from "../style/image/originallogo.png";

const Sidebar = ({ isSidebarOpen, userRole }) => {
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  const toggleRecordDropdown = () => {
    setIsRecordOpen(!isRecordOpen);
  };

  return (
    <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <img src={logo} alt="Logo" width="100" height="100" />
        <h3 className="title-company"><span className="text-yellow">MATLEX </span>CORPORATION</h3>
      </div>
      <ul className="sidebar-menu">
        <li>
          <Link to="/dashboard">
            <div className="menu-label">
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </div>
          </Link>
        </li>
        {userRole === "Super Admin" && (
          <li>
            <Link to="/account-manager">
              <div className="menu-label">
                <i className="fas fa-user"></i>
                <span>Account Manager</span>
              </div>
            </Link>
          </li>
        )}
        <li>
          <Link to="/dataentry-list">
            <div className="menu-label">
              <i className="fas fa-pencil-alt"></i>
              <span>Data Entry</span>
            </div>
          </Link>
        </li>
        <li className="menu-item-with-children">
          <div className="menu-item" onClick={toggleRecordDropdown}>
            <div className="menu-label">
              <i className="fas fa-file"></i>
              <span>Records</span>
            </div>
            <i className={`fas fa-chevron-${isRecordOpen ? "up" : "down"} dropdown-arrow`}></i>
          </div>
          <ul className={`submenu ${isRecordOpen ? "open" : ""}`}>
            <li>
              <Link to="/record">
                <div className="menu-label">
                  <i className="fas fa-file-alt"></i>
                  <span>Record IR</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/leave">
                <div className="menu-label">
                  <i className="fas fa-calendar-minus"></i>
                  <span>Leave Record</span>
                </div>
              </Link>
            </li>
          </ul>
        </li>
        <li>
          <Link to="/report">
            <div className="menu-label">
              <i className="fas fa-chart-bar"></i>
              <span>Report</span>
            </div>
          </Link>
        </li>
        {userRole === "Super Admin" && (
          <li>
            <Link to="/settings">
              <div className="menu-label">
                <i className="fas fa-cog"></i>
                <span>Settings</span>
              </div>
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;