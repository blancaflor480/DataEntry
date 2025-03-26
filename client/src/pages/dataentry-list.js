import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import "../style/accountmanager.css";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AddEmployeeModal from "../modal/addemployee";
import EditEmployeeModal from "../modal/editemployees";
import DeleteEmployeeModal from "../modal/deleteemployee"; 
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs} from "firebase/firestore";
import axios from 'axios';

const DataEntry = () => {
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [users, setUsers] = useState([]); 
  const [employees, setEmployees] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("success");



  // New state for sorting
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

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
       // console.log("Fetched users:", usersData);
      } catch (error) {
       // console.error("Error fetching users:", error);
        setUsers([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [showAddModal, showEditModal]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/";
      } else {
        setUserEmail(user.email);

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
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  
 // Add this useEffect to fetch employees from MySQL
 useEffect(() => {
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/employees');
      setEmployees(response.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  fetchEmployees();
}, [showAddModal, showEditModal]);

  // Replace your current handleArchiveClick with:
const handleDeleteClick = (employee) => {
  setSelectedUser(employee);
  setShowDeleteModal(true);
};

// Add this function to handle successful deletion
const handleDeleteSuccess = (deletedEmployeeId, error = null) => {
  if (error) {
    setAlertMessage("Failed to delete employee. Please try again.");
    setAlertVariant("danger");
  } else {
    setEmployees(prevEmployees => 
      prevEmployees.filter(employee => employee.id !== deletedEmployeeId)
    );
    setAlertMessage("Employee deleted successfully!");
    setAlertVariant("success");
  }
  setShowAlert(true);
  
  setTimeout(() => {
    setShowAlert(false);
  }, 3000);
};



// Modify the filtered data to use employees instead of users
const processedEmployees = () => {
  let result = employees?.filter((employee) => {
    const positionMatches = 
      filter === "All" ? true : employee.position === filter;
    
    const statusFilterMatches = 
      statusFilter === "All" ? true : employee.status === statusFilter;
    
    return positionMatches && statusFilterMatches;
  }) || [];

  result = result.filter((employee) =>
    `${employee.firstName} ${employee.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    employee.corporateEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.employeeNo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorting logic
  if (sortColumn) {
    result.sort((a, b) => {
      let valA, valB;
      switch(sortColumn) {
        case 'employeeNo':
          valA = a.employeeNo;
          valB = b.employeeNo;
          break;
        case 'fullName':
          valA = `${a.firstName} ${a.lastName}`;
          valB = `${b.firstName} ${b.lastName}`;
          break;
        case 'position':
          valA = a.position;
          valB = b.position;
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        case 'email':
          valA = a.corporateEmail;
          valB = b.corporateEmail;
          break;
        default:
          return 0;
      }

      // Handle potential null or undefined values
      valA = valA || '';
      valB = valB || '';

      // Perform comparison
      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc' 
          ? (valA - valB) 
          : (valB - valA);
      }
    });
  }

  return result;
};


  // Pagination logic
  const sortedEmployees = processedEmployees();
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentItems = sortedEmployees.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  // Render sorting icon
  const renderSortIcon = (column) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' 
      ? <i className="fas fa-sort-up"></i> 
      : <i className="fas fa-sort-down"></i>;
  };
 
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
        {showAlert && (
            <div className={`alert alert-${alertVariant} alert-dismissible fade show`} role="alert">
              {alertMessage}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowAlert(false)}
                aria-label="Close"
              ></button>
            </div>
          )}
          <h1 className="title-page">Data Entry List</h1>
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
                  <option value="Managing Director">Managing Director</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Excutative Secretary">Excutative Secretary</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Site Engineer">Site Engineer</option>
                  <option value="Site Production Super Visor">Site Production Super Visor</option>
                  <option value="Admin Staff">Admin Staff</option>
                  <option value="Head Office">Head Office</option>
                  <option value="Production Officers">Production Officers</option>
               
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
                  <option value="Regular">Regular</option>
                  <option value="Probation">Probation</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Awol">Awol</option>
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
    <th 
      onClick={() => {
        setSortColumn('employeeNo');
        setSortDirection(sortColumn === 'employeeNo' && sortDirection === 'asc' ? 'desc' : 'asc');
      }}
      style={{ cursor: 'pointer' }}
      className="sortable-header"
    >
      <div className="d-flex align-items-center">
        Employee No.
        <span className="ms-2">
          {renderSortIcon('employeeNo')}
        </span>
      </div>
    </th>

    <th>Profile</th>

    <th 
      onClick={() => {
        setSortColumn('fullName');
        setSortDirection(sortColumn === 'fullName' && sortDirection === 'asc' ? 'desc' : 'asc');
      }}
      style={{ cursor: 'pointer' }}
      className="sortable-header"
    >
      <div className="d-flex align-items-center">
        Full Name
        <span className="ms-2">
          {renderSortIcon('fullName')}
        </span>
      </div>
    </th>   

    {/* Repeat the same pattern for other sortable headers */}
    <th 
      onClick={() => {
        setSortColumn('position');
        setSortDirection(sortColumn === 'position' && sortDirection === 'asc' ? 'desc' : 'asc');
      }}
      style={{ cursor: 'pointer' }}
      className="sortable-header"
    >
      <div className="d-flex align-items-center">
        Position
        <span className="ms-2">
          {renderSortIcon('position')}
        </span>
      </div>
    </th>

    <th 
      onClick={() => {
        setSortColumn('status');
        setSortDirection(sortColumn === 'status' && sortDirection === 'asc' ? 'desc' : 'asc');
      }}
      style={{ cursor: 'pointer' }}
      className="sortable-header"
    >
      <div className="d-flex align-items-center">
        Status
        <span className="ms-2">
          {renderSortIcon('status')}
        </span>
      </div>
    </th>

    <th 
      onClick={() => {
        setSortColumn('email');
        setSortDirection(sortColumn === 'email' && sortDirection === 'asc' ? 'desc' : 'asc');
      }}
      style={{ cursor: 'pointer' }}
      className="sortable-header"
    >
      <div className="d-flex align-items-center">
        Email
        <span className="ms-2">
          {renderSortIcon('email')}
        </span>
      </div>
    </th>
    <th>Action</th>
  </tr>
</thead>
  <tbody>
      {currentItems.length > 0 ? (
        currentItems.map((employee, index) => (
          <tr key={employee.id}>
            <td>{employee.employeeNo}</td> {/* Use employeeNo instead of index */}
            <td className="profile-cell">
              {renderProfileImage(employee.profileUrl)} {/* Adjust according to your employee data */}
            </td>
            <td>{`${employee.firstName} ${employee.lastName}`}</td>
            <td>{employee.position}</td> {/* Changed from role to position */}
            <td>
              <span className={`status-badge ${employee.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                {employee.status || 'N/A'}
              </span>
            </td>
            <td>{employee.corporateEmail}</td> {/* Changed from email to corporateEmail */}
            <td>
              <button className="btn btn-primary btn-sm me-2" onClick={() => handleEditClick(employee)}>
                Edit
              </button>
            
              <button 
                className="btn btn-danger btn-sm" 
                onClick={() => handleDeleteClick(employee)}
                >
                Delete
              </button>

            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="7" className="text-center">
            No employees found
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
      <AddEmployeeModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onAddAdmin={handleAddAdmin}
      />

      {/* Render the EditAdminModal */}
      <EditEmployeeModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        employeeToEdit={selectedUser}
        onEmployeeUpdated={() => {
          // Refresh employee list after update
          setEmployees([]);
        }}
      />

      {/* Render the ConfirmationModal */}
      <DeleteEmployeeModal
      show={showDeleteModal}
      onHide={() => setShowDeleteModal(false)}
      employeeToDelete={selectedUser}
      onDeleteSuccess={handleDeleteSuccess} // Now passing the updated function
    />
    </div>
  );
};

export default DataEntry;