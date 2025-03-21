import React, { useState } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import "../style/dashboard.css";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard">
      <Sidebar isSidebarOpen={isSidebarOpen} />
      <div className={`main-content ${isSidebarOpen ? "" : "sidebar-closed"}`}>
        <Header toggleSidebar={toggleSidebar} />
        <div className="content">
          <h1 className="title-page">Dashboard</h1>

          {/* Three Boxes in a Row */}
          <div className="boxes-container">
            <div className="box">
              <h3 className="text-start d-block">Total Entries</h3>
              <p className="number-title text-start d-block">1,234</p>
            </div>
            <div className="box">
              <h3  className="text-start d-block">Pending Entries</h3>
              <p className="number-title text-start d-block">567</p>
            </div>
            <div className="box">
              <h3  className="text-start d-block">Complete Entries</h3>
              <p className="number-title text-start d-block">678</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;