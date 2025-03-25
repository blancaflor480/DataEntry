import React from "react";
import { Link } from "react-router-dom";
import "../style/sidebar.css";
import logo from "../style/image/originallogo.png";

const Sidebar = ({ isSidebarOpen, userRole }) => {
  return (
    <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <img src={logo} alt="Logo" width="100" height="100" />
        <h3 className="title-company"><span className="text-yellow">MATLEX </span>CORPORATION</h3>
      </div>
      <ul className="sidebar-menu">
        <li>
          <Link to="/dashboard">
            <i className="fas fa-tachometer-alt"></i> Dashboard
          </Link>
        </li>
        {userRole === "Super Admin" && (
          <li>
            <Link to="/account-manager">
              <i className="fas fa-user"></i> Account Manager
            </Link>
          </li>
        )}
        <li>
          <Link to="/dataentry-list">
            <i className="fas fa-pencil-alt"></i> Data Entry
          </Link>
        </li>
        <li>
          <Link to="/record">
            <i className="fas fa-file"></i> Record
          </Link>
        </li>
        <li>
          <Link to="/report">
            <i className="fas fa-chart-bar"></i> Report
          </Link>
        </li>
        {userRole === "Super Admin" && (
          <li>
            <Link to="/settings">
              <i className="fas fa-cog"></i> Settings
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;