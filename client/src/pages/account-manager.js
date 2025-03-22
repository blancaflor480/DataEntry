import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import "../style/accountmanager.css";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AddAdminModal from "../modal/addamin";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const AccountManager = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [filter, setFilter] = useState("All"); // Default filter
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const [itemsPerPage] = useState(5); // Number of items per page
  const [showModal, setShowModal] = useState(false); // State for modal visibility

  // Check if user is logged in
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          window.location.href = "/login";
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
  
// Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/login"; // Redirect to login page after logout
    
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Sample data
  const users = [
    { id: 1, image: "Not Available", name: "John Doe", position: "Super Admin", status: "Active", email: "admin@gmail.com" },
    { id: 2, image: "Not Available", name: "Jane", position: "Admin", status: "Inactive", email: "admin@gmail.com" },
    { id: 3, image: "Not Available", name: "Alice", position: "User", status: "Active", email: "user@gmail.com" },
    { id: 4, image: "Not Available", name: "Bob", position: "Super Admin", status: "Active", email: "bob@gmail.com" },
    { id: 5, image: "Not Available", name: "Charlie", position: "Admin", status: "Inactive", email: "charlie@gmail.com" },
    { id: 6, image: "Not Available", name: "David", position: "User", status: "Active", email: "david@gmail.com" },
    { id: 7, image: "Not Available", name: "Eve", position: "Super Admin", status: "Active", email: "eve@gmail.com" },
  ];

  // Filtered data based on selected position
  const filteredUsers = users.filter((user) => {
    if (filter === "All") {
      return user.position === "Super Admin" || user.position === "Admin"; // Show both Super Admin and Admin
    } else {
      return user.position === filter; // Show only the selected position
    }
  });

  // Filter users based on search query
  const searchedUsers = filteredUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = searchedUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Total number of pages
  const totalPages = Math.ceil(searchedUsers.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
   // Handle adding a new admin
   const handleAddAdmin = (adminData) => {
    console.log("New Admin Data:", adminData);
    // Add your logic here to save the admin data (e.g., API call)
  };

  return (
    <div className="account-manager">
      <Sidebar isSidebarOpen={isSidebarOpen} userRole={userRole} />
      <div className={`main-content ${isSidebarOpen ? "" : "sidebar-closed"}`}>
      <Header toggleSidebar={toggleSidebar} userEmail={userEmail} userRole={userRole} handleLogout={handleLogout} /> {/* Pass handleLogout as a prop */}

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

            {/* Search Bar and Button */}
            <div className="search-container mt-3">
              <div className="col-md-9">
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn btn-primary search-button">Search</button>
              
              <button
                className="btn btn-success search-button"
                onClick={() => setShowModal(true)}
              >
                Add Account
              </button>

              {/* Render the AddAdminModal */}
              <AddAdminModal
                show={showModal}
                onHide={() => setShowModal(false)}
                onAddAdmin={handleAddAdmin}
              />
            
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
                  {currentItems.map((user, index) => (
                    <tr key={user.id}>
                      <td>{indexOfFirstItem + index + 1}</td>
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

            {/* Bootstrap Pagination */}
            <nav aria-label="Page navigation" className="mt-4">
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={goToPreviousPage}>
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                    <button className="page-link" onClick={() => paginate(i + 1)}>
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={goToNextPage}>
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountManager;