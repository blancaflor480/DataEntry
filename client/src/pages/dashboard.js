import React, { useState, useEffect } from "react"; 
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import "../style/dashboard.css";
import { auth } from "../firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth"; 
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [filter, setFilter] = useState("Active"); 
  const [userEmail, setUserEmail] = useState(""); 
  const [userRole, setUserRole] = useState("");

  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "../login";
      } else {
        setUserEmail(user.email);

        try {
          // Fetch the user's role from Firestore
          const userDocRef = doc(db, "admin", user.uid); // Use db instead of Firestore
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().role); // Assuming the role is stored in a field called `role`
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/login"; // Redirect to login page after logout
    
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Sample data
  const users = [
    { id: 1, name: "John Doe", status: "Active", type: "Regular" },
    { id: 2, name: "Jane Smith", status: "Regular", type: "Full-Time" },
    { id: 3, name: "Alice Johnson", status: "Probation", type: "Part-Time" },
    { id: 4, name: "Bob Brown", status: "Inactive", type: "Contract" },
    { id: 5, name: "Charlie Davis", status: "Resigned", type: "Full-Time" },
    { id: 6, name: "Eve White", status: "Terminated", type: "Part-Time" },
    { id: 7, name: "Frank Wilson", status: "AWOL", type: "Contract" },
  ];

  // Filtered data based on selected status
  const filteredUsers = users.filter((user) => user.status === filter);

  return (
    <div className="dashboard">
      <Sidebar isSidebarOpen={isSidebarOpen} userRole={userRole} />
      <div className={`main-content ${isSidebarOpen ? "" : "sidebar-closed"}`}>
        <Header toggleSidebar={toggleSidebar} userEmail={userEmail} userRole={userRole} handleLogout={handleLogout} /> {/* Pass handleLogout as a prop */}
        <div className="content">
          <h1 className="title-page">Dashboard</h1>

          {/* Three Boxes in a Row */}
          <div className="boxes-container">
            <div className="box">
              <h3 className="text-start d-block">Total Entries</h3>
              <p className="number-title text-start d-block">1,234</p>
            </div>
            <div className="box">
              <h3 className="text-start d-block">Pending Entries</h3>
              <p className="number-title text-start d-block">567</p>
            </div>
            <div className="box">
              <h3 className="text-start d-block">Complete Entries</h3>
              <p className="number-title text-start d-block">678</p>
            </div>
            <div className="box">
              <h3 className="text-start d-block">New Entries today</h3>
              <p className="number-title text-start d-block">10</p>
            </div>
          </div>
          <div className="boxes-container mt-1">
            <div className="box">
              <h3 className="text-start d-block">Total User</h3>
              <p className="number-title text-start d-block">1,234</p>
            </div>
            <div className="box">
              <h3 className="text-start d-block">Total Admin</h3>
              <p className="number-title text-start d-block">567</p>
            </div>
          </div>

          {/* List of Employee Box */}
          <div className="box mt-4">
            <div className="list-filter-container">
              <h3 className="text-type">List of Employee</h3>
              <div className="filter-container">
                <label htmlFor="status-filter" className="me-2">
                  Filter by Status:
                </label>
                <select
                  id="status-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="Active">Active</option>
                  <option value="Regular">Regular</option>
                  <option value="Probation">Probation</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                  <option value="AWOL">AWOL</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="table-container mt-4">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr key={user.id}>
                      <td>{index + 1}</td>
                      <td>{user.name}</td>
                      <td>{user.status}</td>
                      <td>{user.type}</td>
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

export default Dashboard;