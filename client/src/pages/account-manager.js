import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import "../style/accountmanager.css";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const AccountManager = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [filter, setFilter] = useState("All"); // Default filter
  const [userEmail, setUserEmail] = useState("");

  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "/login";
      } else {
        setUserEmail(user.email); // Set the user's email
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Sample data
  const users = [
    { id: 1, image: "Not Available", name: "John Doe", position: "Super Admin", status: "Active", email: "admin@gmail.com" },
    { id: 2, image: "Not Available", name: "Jane", position: "Admin", status: "Inactive", email: "admin@gmail.com" },
    { id: 3, image: "Not Available", name: "Alice", position: "User", status: "Active", email: "user@gmail.com" }, // Example of a non-admin user
  ];

  // Filtered data based on selected position
  const filteredUsers = users.filter((user) => {
    if (filter === "All") {
      return user.position === "Super Admin" || user.position === "Admin"; // Show both Super Admin and Admin
    } else {
      return user.position === filter; // Show only the selected position
    }
  });

  return (
    <div className="account-manager">
      <Sidebar isSidebarOpen={isSidebarOpen} />
      <div className={`main-content ${isSidebarOpen ? "" : "sidebar-closed"}`}>
        <Header toggleSidebar={toggleSidebar} userEmail={userEmail} />
        <div className="content">
          <h1 className="title-page">Account Manager</h1>
          <div className="box mt-4">
            <div className="list-filter-container">
              <h3 className="text-type">List of Employee</h3>
              <div className="filter-container">
                <label htmlFor="position-filter" className="me-2">
                  Filter by Position:
                </label>
                <select
                  id="position-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="All">All</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="table-container mt-4">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Employee No.</th>
                    <th>Profile</th>
                    <th>Full Name</th>
                    <th>Position</th>
                    <th>Status</th>
                    <th>Email</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr key={user.id}>
                      <td>{index + 1}</td>
                      <td>{user.image}</td>
                      <td>{user.name}</td>
                      <td>{user.position}</td>
                      <td>{user.status}</td>
                      <td>{user.email}</td>
                      <td>
                        {/* Add action buttons here (e.g., Edit, Delete) */}
                        <button className="btn btn-primary btn-sm me-2">Edit</button>
                        <button className="btn btn-danger btn-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountManager;