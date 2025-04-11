import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import "../style/record.css";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AddRecordModal from "../modal/addrecord";
import EditRecordModal from "../modal/editrecord";
import DeleteRecordModal from "../modal/deleterecord"; 
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

const Record = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [typeFilter, setTypeFilter] = useState("All"); // Changed from position filter to type filter
  const [statusFilter, setStatusFilter] = useState("All");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); 
  const [currentPage, setCurrentPage] = useState(1); 
  const [itemsPerPage] = useState(10); 
  const [showAddModal, setShowAddModal] = useState(false); 
  const [showEditModal, setShowEditModal] = useState(false); 
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [users, setUsers] = useState([]); 
  const [records, setRecords] = useState([]); 
  const [employees, setEmployees] = useState([]); // To store employee data for reference
  const [loading, setLoading] = useState(true); 
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("success");
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
      } catch (error) {
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

  // Fetch records from MySQL
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/incident-reports');
        // Ensure we have an array even if response.data is null/undefined
        setRecords(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching incident reports:", error);
        setRecords([]);
        setAlertMessage("Failed to load records. Please try again.");
        setAlertVariant("danger");
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    };

    // Fetch employees for reference data
    const fetchEmployees = async () => {
      try {
        const response = await axios.get('http://localhost:5000/employees');
        setEmployees(response.data || []);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]);
      }
    };

    fetchRecords();
    fetchEmployees();
  }, [showAddModal, showEditModal]);

  const handleDeleteClick = (record) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = (deletedRecordId, error = null) => {
    if (error) {
      setAlertMessage("Failed to delete record. Please try again.");
      setAlertVariant("danger");
    } else {
      setRecords(prevRecords => 
        prevRecords.filter(record => record.recordID !== deletedRecordId)
      );
      setAlertMessage("Record deleted successfully!");
      setAlertVariant("success");
    }
    setShowAlert(true);
    
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  // Get employee name by employeeNo
  const getEmployeeName = (employeeNo) => {
    if (!employeeNo) return "Unknown Employee";
    
    // First check if we have the employee in the records data (from the join)
    const recordWithEmployee = records.find(r => r.employeeNo === employeeNo);
    if (recordWithEmployee && recordWithEmployee.employeeName) {
      return recordWithEmployee.employeeName;
    }
    
    // Fallback to checking the employees list
    const employee = employees.find(emp => emp.employeeNo === employeeNo);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Unknown Employee";
  };
  
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'danger';
      case 'critical':
        return 'dark';
      default:
        return 'secondary';
    }
  };
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'primary';
      case 'under investigation':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'secondary';
      case 'reopened':
        return 'danger';
      default:
        return 'info';
    }
  };
  const processedRecords = () => {
    let result = records?.filter((record) => {
      const typeMatches = 
        typeFilter === "All" ? true : record.incident_category === typeFilter;
      
      const statusFilterMatches = 
        statusFilter === "All" ? true : record.status === statusFilter;
      
      return typeMatches && statusFilterMatches;
    }) || [];
  
    result = result.filter((record) =>
      record.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employee_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    if (sortColumn) {
      result.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];
  
        // Handle null/undefined values
        valA = valA || '';
        valB = valB || '';
  
        // Handle dates
        if (sortColumn === 'incident_date') {
          valA = new Date(valA);
          valB = new Date(valB);
        }
  
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
    // Add these functions before the return statement
     
    }
    return result;
  };

  // Pagination logic
  const sortedRecords = processedRecords();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);

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

  // Function to handle the edit button click
  const handleEditClick = (record) => {
    setSelectedRecord(record);
    setShowEditModal(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
          <h1 className="title-page">Record List</h1>
          <div className="box mt-4">
            <div className="list-filter-container">
              <h3 className="text-type">List of Employee Records (IR Incident Report)</h3>
              <div className="filter-container">
                <label htmlFor="type-filter" className="me-2">
                  Filter by Type:
                </label>
                <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="form-select"
              >
                <option value="All">All Categories</option>
                <option value="Employee Behavior">Employee Behavior</option>
                <option value="Misconduct & Violation">Misconduct & Violation</option>
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
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                  <option value="Reopened">Reopened</option>
                </select>
              </div>
            </div>

            {/* Search Bar and Button */}
            <div className="search-container mt-3">
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Search by employee name, number, or details"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn btn-primary search-button btn-sm">Search</button>
              <button
                className="btn btn-success search-button btn-sm"
                onClick={() => setShowAddModal(true)}
              >
                Add Record
              </button>
            
              <button
                className="btn btn-warning search-button btn-sm"
                onClick={() => navigate("/leave")} // This will navigate to the leave page
              >
                Leave Record
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
                // Replace the existing table structure inside the table-container
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th 
                onClick={() => {
                  setSortColumn('employee_no');
                  setSortDirection(sortColumn === 'employee_no' && sortDirection === 'asc' ? 'desc' : 'asc');
                }}
                style={{ cursor: 'pointer' }}
                className="sortable-header"
              >
                <div className="d-flex align-items-center">
                  Employee No.
                  <span className="ms-2">{renderSortIcon('employee_no')}</span>
                </div>
              </th>

              <th 
                onClick={() => {
                  setSortColumn('employee_name');
                  setSortDirection(sortColumn === 'employee_name' && sortDirection === 'asc' ? 'desc' : 'asc');
                }}
                style={{ cursor: 'pointer' }}
                className="sortable-header"
              >
                <div className="d-flex align-items-center">
                  Employee Name
                  <span className="ms-2">{renderSortIcon('employee_name')}</span>
                </div>
              </th>

              <th 
                onClick={() => {
                  setSortColumn('incident_category');
                  setSortDirection(sortColumn === 'incident_category' && sortDirection === 'asc' ? 'desc' : 'asc');
                }}
                style={{ cursor: 'pointer' }}
                className="sortable-header"
              >
                <div className="d-flex align-items-center">
                  Category
                  <span className="ms-2">{renderSortIcon('incident_category')}</span>
                </div>
              </th>

              <th 
                onClick={() => {
                  setSortColumn('incident_type');
                  setSortDirection(sortColumn === 'incident_type' && sortDirection === 'asc' ? 'desc' : 'asc');
                }}
                style={{ cursor: 'pointer' }}
                className="sortable-header"
              >
                <div className="d-flex align-items-center">
                  Type
                  <span className="ms-2">{renderSortIcon('incident_type')}</span>
                </div>
              </th>

              <th 
                onClick={() => {
                  setSortColumn('incident_date');
                  setSortDirection(sortColumn === 'incident_date' && sortDirection === 'asc' ? 'desc' : 'asc');
                }}
                style={{ cursor: 'pointer' }}
                className="sortable-header"
              >
                <div className="d-flex align-items-center">
                  Date
                  <span className="ms-2">{renderSortIcon('incident_date')}</span>
                </div>
              </th>

              
              <th>Description</th>
              <th>Attachments</th>

              <th 
                onClick={() => {
                  setSortColumn('severity');
                  setSortDirection(sortColumn === 'severity' && sortDirection === 'asc' ? 'desc' : 'asc');
                }}
                style={{ cursor: 'pointer' }}
                className="sortable-header"
              >
                <div className="d-flex align-items-center">
                  Severity
                  <span className="ms-2">{renderSortIcon('severity')}</span>
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
                  <span className="ms-2">{renderSortIcon('status')}</span>
                </div>
              </th>

              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((record) => (
                <tr key={record.incident_id}>
                  <td>{record.employee_no}</td>
                  <td>{record.employee_name}</td>
                  <td>{record.incident_category}</td>
                  <td>{record.incident_type}</td>
                  <td>{formatDate(record.incident_date)} {record.incident_time}</td>
                  <td className="text-truncate" style={{maxWidth: '200px'}} title={record.description}>
                    {record.description.length > 50 ? `${record.description.substring(0, 50)}...` : record.description}
                  </td>
                  
                  <td>
                    {[
                      record.attachment1_path && (
                        <a 
                          key="1"
                          href={record.attachment1_path} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary me-1"
                        >
                          <i className="fas fa-file-alt"></i> 1
                        </a>
                      ),
                      record.attachment2_path && (
                        <a 
                          key="2"
                          href={record.attachment2_path} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary me-1"
                        >
                          <i className="fas fa-file-alt"></i> 2
                        </a>
                      ),
                      record.attachment3_path && (
                        <a 
                          key="3"
                          href={record.attachment3_path} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="fas fa-file-alt"></i> 3
                        </a>
                      )
                    ].filter(Boolean)}
                    {!record.attachment1_path && !record.attachment2_path && !record.attachment3_path && 
                      <span>No attachments</span>
                    }
                  </td>
                  <td>
                    <span className={`badge bg-${getSeverityColor(record.severity)}`}>
                      {record.severity}
                    </span>
                  </td>
                  <td>
                    <span className={`badge bg-${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-primary btn-sm me-2" 
                      onClick={() => handleEditClick(record)}
                    >
                      Edit
                    </button>
                    {userRole === "Super Admin" && (
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDeleteClick(record)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" className="text-center">
                  No incident reports found
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

      {/* Render the AddRecordModal */}
      <AddRecordModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        employees={employees}
        onRecordAdded={() => {
            // Refresh records after adding
            setRecords([]);
            setShowAddModal(false);
        }}  
        />

      {/* Render the EditRecordModal */}
      <EditRecordModal
      show={showEditModal}
      onHide={() => setShowEditModal(false)}
      incident={selectedRecord}  // Changed from recordToEdit to incident
      employees={employees}
      onIncidentUpdated={() => {
        // Refresh records list after update
        setRecords([]);
        setShowEditModal(false);  // Add this to close modal after update
      }}
    />

      {/* Render the DeleteRecordModal */}
      <DeleteRecordModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        recordToDelete={selectedRecord}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default Record;