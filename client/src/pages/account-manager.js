import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import "../style/accountmanager.css";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AddAdminModal from "../modal/addamin";
import EditAdminModal from "../modal/editadmin";
import ConfirmationModal from "../modal/deleteadmin"; 
import ArchiveModal from "../modal/archivemodal"; // Import the new ArchiveModal
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";


const AccountManager = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [filter, setFilter] = useState("All"); // Default filter
  const [statusFilter, setStatusFilter] = useState("All"); // Add status filter state
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); 
  const [currentPage, setCurrentPage] = useState(1); 
  const [itemsPerPage] = useState(10); 
  const [showAddModal, setShowAddModal] = useState(false); 
  const [showEditModal, setShowEditModal] = useState(false); 
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false); // State for ArchiveModal
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [userId, setUserId] = useState(""); // Store user ID for logout tracking
  const navigate = useNavigate();
  
  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersCollection = collection(db, "admin");
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData || []); 
        console.log("Fetched users:", usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [showAddModal, showEditModal, showConfirmationModal, showArchiveModal]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/";
      } else {
        setUserEmail(user.email);
        setUserId(user.uid); // Store user ID for logout tracking


        try {
          const userDocRef = doc(db, "admin", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().role);
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

  const handleLogout = async () => {
        try {
          // Update Firestore with logout timestamp before signing out
          if (userId) {
            const userDocRef = doc(db, "admin", userId);
            
            // Get current user data
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              
              // Update the last login entry with logout time
              const updatedHistory = userData.loginHistory?.map((entry, index) => {
                if (index === userData.loginHistory.length - 1) {
                  return {
                    ...entry,
                    logoutTimestamp: new Date().toISOString(),
                    sessionEnd: true
                  };
                }
                return entry;
              }) || [];
    
              await updateDoc(userDocRef, {
                lastLogout: serverTimestamp(),
                loginHistory: updatedHistory
              });
            }
          }
    
          // Clear local storage
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('expirationTime');
          
          // Sign out from Firebase
          await signOut(auth);
          
          // Redirect to login page
          navigate('/login');
        } catch (error) {
          console.error("Logout error:", error);
          // Still proceed with logout even if recording fails
          await signOut(auth);
          navigate('/login');
        }
      };
  

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Filtered data based on selected position and status
  const filteredUsers = users?.filter((user) => {
    // First filter by role
    const roleMatches = 
      filter === "All" ? 
        (user.role === "Super Admin" || user.role === "Admin") : 
        user.role === filter;
    
    // Only show users who are not disabled
    const statusMatches = user.status?.toLowerCase() !== "disabled";
    
    // Apply status filter if not "All"
    const statusFilterMatches = 
      statusFilter === "All" ? 
        true : 
        user.status?.toLowerCase() === statusFilter.toLowerCase();
    
    return roleMatches && statusMatches && statusFilterMatches;
  }) || [];

  // Filter users based on search query
  const searchedUsers = filteredUsers?.filter((user) =>
    `${user.firstName} ${user.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
  const handleAddAdmin = () => {
    setShowAddModal(false);
  };

  // Function to handle the edit button click
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Function to handle the archive button click
  const handleArchiveClick = (user) => {
    setSelectedUser(user);
    setShowConfirmationModal(true);
  };

// Function to archive the user
const archiveUser = async () => {
  try {
    const userDocRef = doc(db, "admin", selectedUser.id);
    const currentDate = new Date().toISOString(); // Get the current date in ISO format
    await updateDoc(userDocRef, { 
      status: "Disabled",
      dateArchived: currentDate, // Add the current date to the dateArchived field
    });
    alert("User archived successfully!");
    setShowConfirmationModal(false);
    setUsers([]); // Reset users to trigger a re-fetch
  } catch (error) {
    console.error("Error archiving user:", error);
    alert("Failed to archive user. Please try again.");
  }
};
  // Function to render profile image
  const renderProfileImage = (profile) => {
    if (!profile) {
      return (
        <div className="default-profile-image">
          <span>N/A</span>
        </div>
      );
    }

    // Check if the profile is a Google Drive file ID
    if (!profile.includes("http")) {
      const driveUrl = `https://drive.google.com/uc?export=view&id=${profile}`;
      return (
        <img
          src={driveUrl}
          alt="Profile"
          className="profile-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/default-avatar.png"; // Fallback image
          }}
          onLoad={(e) => {
            // Image loaded successfully
            e.target.style.display = "block";
          }}
        />
      );
    }

    // If it's already a URL
    return (
      <img
        src={profile}
        alt="Profile"
        className="profile-image"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/default-avatar.png"; // Fallback image
        }}
        onLoad={(e) => {
          // Image loaded successfully
          e.target.style.display = "block";
        }}
      />
    );
  };

  return (
    <div className="account-manager">
      <Sidebar isSidebarOpen={isSidebarOpen} userRole={userRole} />
      <div className={`main-content ${isSidebarOpen ? "" : "sidebar-closed"}`}>
        <Header
          toggleSidebar={toggleSidebar}
          userEmail={userEmail}
          userRole={userRole}
          handleLogout={handleLogout}
        />

        <div className="content">
          <h1 className="title-page">Account Manager</h1>
          <div className="box mt-4">
            <div className="list-filter-container">
              <h3 className="text-type">List of Admin</h3>
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
                
                <label htmlFor="status-filter" className="ms-3 me-2">
                  Filter by Status:
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Search Bar and Button */}
            <div className="search-container mt-3">
              <div className="col-sm-8">
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
                className="btn btn-warning search-button"
                onClick={() => setShowArchiveModal(true)}
              >
                Archive
              </button>
              <button
                className="btn btn-success search-button"
                onClick={() => setShowAddModal(true)}
              >
                Add Account
              </button>
            </div>

            {/* Table */}
            <div className="table-container mt-4">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
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
                    {currentItems.length > 0 ? (
                      currentItems.map((user, index) => (
                        <tr key={user.id}>
                          <td>{indexOfFirstItem + index + 1}</td>
                          <td className="profile-cell">
                            {renderProfileImage(user.profile)}
                          </td>
                          <td>{`${user.firstName} ${user.lastName}`}</td>
                          <td>{user.role}</td>
                          <td>
                            <span className={`status-badge ${user.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                              {user.status || 'N/A'}
                            </span>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <button className="btn btn-primary btn-sm me-2" onClick={() => handleEditClick(user)}>
                              Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleArchiveClick(user)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bootstrap Pagination */}
            {!loading && totalPages > 0 && (
              <nav aria-label="Page navigation" className="mt-4">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={goToPreviousPage}>
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <li
                      key={i + 1}
                      className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                    >
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
            )}
          </div>
        </div>
      </div>

      {/* Render the AddAdminModal */}
      <AddAdminModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onAddAdmin={handleAddAdmin}
      />

      {/* Render the EditAdminModal */}
      <EditAdminModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        userToEdit={selectedUser}
        onEditAdmin={() => {
          setUsers([]); // Reset users to trigger a re-fetch
        }}
      />

      {/* Render the ConfirmationModal */}
      <ConfirmationModal
        show={showConfirmationModal}
        onHide={() => setShowConfirmationModal(false)}
        onConfirm={archiveUser}
        message="Are you sure you want to delete this user?"
      />
      <ArchiveModal
        show={showArchiveModal}
        onHide={() => setShowArchiveModal(false)}
        onRestore={() => setUsers([])} // Trigger re-fetch on restore
        onDelete={() => setUsers([])} // Trigger re-fetch on delete
      />
    </div>
  );
};

export default AccountManager;