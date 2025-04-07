import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import "../style/accountmanager.css";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AddEmployeeModal from "../modal/addemployee";
import EditEmployeeModal from "../modal/editemployees";
import ViewEmployeeModal from "../modal/viewemployee";
import DeleteEmployeeModal from "../modal/deleteemployee"; 
import ApprovalModal from "../modal/approvalmodal";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, updateDoc, serverTimestamp} from "firebase/firestore";
import axios from 'axios';
import { useNavigate } from "react-router-dom";


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
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [users, setUsers] = useState([]); 
  const [employees, setEmployees] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("success");
  const [userId, setUserId] = useState(""); // Store user ID for logout tracking
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingEdits, setPendingEdits] = useState([]);
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("All");
  const navigate = useNavigate();
      
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
  }, [showViewModal, showAddModal, showEditModal]);

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


  useEffect(() => {
    const fetchPendingEdits = async () => {
      try {
        const response = await axios.get('http://localhost:5000/approvals/pending');
        setPendingEdits(response.data || []);
      } catch (error) {
        console.error("Error fetching pending edits:", error);
        setPendingEdits([]);
      }
    };
  
    if (showApprovalModal) {
      fetchPendingEdits();
    }
  }, [showApprovalModal]);

  const handleApproveSuccess = (editId) => {
    setPendingEdits(prev => prev.filter(edit => edit.id !== editId));
    // Refresh employee list to show the approved changes
    setEmployees([]);
  };
  
  const handleRejectSuccess = (editId) => {
    setPendingEdits(prev => prev.filter(edit => edit.id !== editId));
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
}, [showViewModal, showAddModal, showEditModal]);

const handleViewClick = (employee) => {
  setSelectedUser(employee);
  setShowViewModal(true);
};

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
    
    const employmentTypeMatches =
      employmentTypeFilter === "All" ? true : employee.employmentType === employmentTypeFilter;
    return positionMatches && statusFilterMatches && employmentTypeMatches;
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

  const renderProfileImage = (employee) => {
    // Check if employee object exists
    if (!employee) {
      return (
        <div className="default-profile-image">
          <i className="fas fa-user-circle"></i>
        </div>
      );
    }
  
    // Check if profileImageUrl exists  
    //const profileImageUrl = employee.profileImageUrl;
    const imageUrl = `http://localhost:5000/images/profiles/${employee.id}`;

    // Check if it's a local file URL (starts with /uploads/)
    // Check if profileImageUrl exists and is a local upload
    return (
      <img
      src={imageUrl}
      alt={`${employee.firstName} ${employee.lastName}`}
      className="profile-image"
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        objectFit: 'cover'
      }}
      onError={(e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
        e.target.parentNode.innerHTML = '<i class="fas fa-user-circle" style="font-size: 40px; color: #6c757d;"></i>';
      }}
    />
    );
  
    // If it's already a direct image URL
    return (
      <div className="default-profile-image">
        <i className="fas fa-user-circle"></i>
      </div>
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
                  <option value="Sales Director">Sales Director</option>
                  <option value="Production Manager">Production Manager</option>
                  <option value="Supply Chain Manage">Supply Chain Manager</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Marketing Manager">Marketing Manager</option>
                  <option value="Procurement Manager">Procurement Manager</option>
                  <option value="IT Specialist">IT Specialist</option>
                  <option value="Purchasing head">Purchasing head</option>
                  <option value="Purchasing Staff">Purchasing Staff</option>
                  <option value="Human Resource">Human Resource</option>
                  <option value="Finance Officer">Finance Officer</option>
                  <option value="Admin Staff">Admin Staff</option>
                  <option value="Accounting Staff">Accounting Staff</option>
                  <option value="Bookeeping Staff">Bookeeping Staff</option>
                  <option value="Sales Staff">Sales Staff</option>
                  <option value="Marketing Staff">Marketing Staff</option>
                  <option value="Logistic Officer">Logistic Officer</option>
                  <option value="Compounding Officer">Compounding Officer</option>
                  <option value="Scheduling Officer">Scheduling Officer</option>
                  <option value="Facility and Maintenance Officer">Facility and Maintenance Officer</option>
                  <option value="Molding Officer">Molding Officer</option>
                  <option value="Production Officer">Production Officer</option>
                  <option value="Site Engineer">Site Engineer</option>
                  <option value="Sales Engineer">Sales Engineer</option>
                  <option value="Architect">Architect</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="CEO">CEO</option>
                  <option value="COO">COO</option>
 
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


                  <label htmlFor="employmentType-filter" className="ms-3 me-2">
                    Filter by Employment Type:
                  </label>
                  <select
                    id="employmentType-filter"
                    value={employmentTypeFilter}
                    onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                    className="form-select"
                  >
                    <option value="All">All</option>
                    <option value="On Probationary">On Probationary</option>
                    <option value="Regular">Regular</option>
                    <option value="Contractual">Contractual</option>
                    <option value="Project Based">Project Based</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Trainee/Intern">Trainee/Intern</option>
                    <option value="Resigned">Resigned</option>
                    <option value="AWOL">AWOL</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Retired">Retired</option>
                    <option value="End of Contract">End of Contract</option>
                    <option value="Laid Off">Laid Off</option>
                    <option value="Dismissed">Dismissed</option>
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
              
              <button
                className="btn btn-danger search-button"
                onClick={() => setShowApprovalModal(true)}
              >
                Approval
                {pendingEdits.length > 0 && (
                  <span className="badge rounded-pill bg-danger">
                    {pendingEdits.length}
                  </span>
                )}
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

    <th style={{ width: '60px' }}>Profile</th>

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
        setSortColumn('employmentType');
        setSortDirection(sortColumn === 'employmentType' && sortDirection === 'asc' ? 'desc' : 'asc');
      }}
      style={{ cursor: 'pointer' }}
      className="sortable-header"
    >
      <div className="d-flex align-items-center">
        Employment Type
        <span className="ms-2">
          {renderSortIcon('employmentType')}
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
        <td>{employee.employeeNo}</td>
        <td className="profile-cell">
        {renderProfileImage(employee)}
      </td>
      
        <td>{`${employee.firstName} ${employee.lastName}`}</td>
        <td>{employee.position}</td>
        <td>
          <span className={`status-badge ${employee.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
            {employee.status || 'N/A'}
          </span>
        </td>
        <td>
          {employee.employmentType || 'N/A'}
        </td>
        <td>{employee.corporateEmail}</td>
        <td>
          <button className="btn btn-warning btn-sm me-2" onClick={() => handleViewClick(employee)}>
            <i className="fas fa-eye me-1"></i> View
          </button>
          <button className="btn btn-primary btn-sm me-2" onClick={() => handleEditClick(employee)}>
            Edit
          </button>
          {userRole === "Super Admin" && (
            <button 
              className="btn btn-danger btn-sm" 
              onClick={() => handleDeleteClick(employee)}
            >
              Delete
            </button>
          )}
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


      {/* Render the ApprovalModal */}
      <ApprovalModal
        show={showApprovalModal}
        onHide={() => setShowApprovalModal(false)}
        pendingEdits={pendingEdits}
        onApproveSuccess={handleApproveSuccess}
        onRejectSuccess={handleRejectSuccess}
        userRole={userRole}
        />

      {/* Render the AddAdminModal */}
      <AddEmployeeModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onAddAdmin={handleAddAdmin}
      />

    <ViewEmployeeModal
      show={showViewModal}
      onHide={() => setShowViewModal(false)}
      employeeToView={selectedUser}
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
        userRole={userRole} // Pass user role to the modal
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