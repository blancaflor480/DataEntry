import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import "../style/record.css";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AddLeaveModal from "../modal/addleave";
//import EditLeaveModal from "../modal/editleave";
//import DeleteLeaveModal from "../modal/deleteleave";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

const Leave = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); 
  const [currentPage, setCurrentPage] = useState(1); 
  const [itemsPerPage] = useState(10); 
  const [showAddModal, setShowAddModal] = useState(false); 
  const [showEditModal, setShowEditModal] = useState(false); 
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [users, setUsers] = useState([]); 
  const [leaves, setLeaves] = useState([]); 
  const [employees, setEmployees] = useState([]);
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

  // Fetch leave records from MySQL
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/v1/leaves'); // Updated endpoint
        setLeaves(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching leave records:", error);
        setLeaves([]);
        setAlertMessage("Failed to load leave records. Please try again.");
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

    fetchLeaves();
    fetchEmployees();
  }, [showAddModal, showEditModal]);

  const handleDeleteClick = (leave) => {
    setSelectedLeave(leave);
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = (deletedLeaveId, error = null) => {
    if (error) {
      setAlertMessage("Failed to delete leave record. Please try again.");
      setAlertVariant("danger");
    } else {
      setLeaves(prevLeaves => 
        prevLeaves.filter(leave => leave.leave_id !== deletedLeaveId)
      );
      setAlertMessage("Leave record deleted successfully!");
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
    
    const employee = employees.find(emp => emp.employeeNo === employeeNo);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Unknown Employee";
  };
  
  // Calculate number of days between two dates
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  };

  const processedLeaves = () => {
    let result = leaves?.filter((leave) => {
      const typeMatches = 
        leaveTypeFilter === "All" ? true : leave.leave_type === leaveTypeFilter;
      
      const statusFilterMatches = 
        statusFilter === "All" ? true : leave.status === statusFilter;
      
      return typeMatches && statusFilterMatches;
    }) || [];

    result = result.filter((leave) =>
      getEmployeeName(leave.employee_no)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      leave.employee_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sorting logic
    if (sortColumn) {
      result.sort((a, b) => {
        let valA, valB;
        switch(sortColumn) {
          case 'employee_no':
            valA = a.employee_no;
            valB = b.employee_no;
            break;
          case 'employeeName':
            valA = getEmployeeName(a.employee_no);
            valB = getEmployeeName(b.employee_no);
            break;
          case 'date_applied':
            valA = new Date(a.date_applied);
            valB = new Date(b.date_applied);
            break;
          case 'start_date':
            valA = new Date(a.start_date);
            valB = new Date(b.start_date);
            break;
          case 'end_date':
            valA = new Date(a.end_date);
            valB = new Date(b.end_date);
            break;
          case 'leave_type':
            valA = a.leave_type;
            valB = b.leave_type;
            break;
          case 'status':
            valA = a.status;
            valB = b.status;
            break;
          default:
            return 0;
        }

        valA = valA || '';
        valB = valB || '';

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
  const sortedLeaves = processedLeaves();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedLeaves.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedLeaves.length / itemsPerPage);

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
  const handleEditClick = (leave) => {
    setSelectedLeave(leave);
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
          <h1 className="title-page">Leave Management</h1>
          <div className="box mt-4">
            <div className="list-filter-container">
              <h3 className="text-type">Employee Leave Records</h3>
              <div className="filter-container">
                <label htmlFor="type-filter" className="me-2">
                  Filter by Leave Type:
                </label>
                <select
                  id="type-filter"
                  value={leaveTypeFilter}
                  onChange={(e) => setLeaveTypeFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="All">All</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Sick">Sick</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Maternity">Maternity</option>
                  <option value="Paternity">Paternity</option>
                  <option value="Bereavement">Bereavement</option>
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
                  <option value="Pending for Approval">Pending for Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Search Bar and Button */}
            <div className="search-container mt-3">
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Search by employee name, number, or reason"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn btn-primary search-button">Search</button>
              <button
                className="btn btn-success search-button"
                onClick={() => setShowAddModal(true)}
              >
                Add Leave
              </button>
              <button
                className="btn btn-warning search-button"
                onClick={() => navigate("/record")}
              >
                Record List NTE and IR
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
                          setSortColumn('employee_no');
                          setSortDirection(sortColumn === 'employee_no' && sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                        style={{ cursor: 'pointer' }}
                        className="sortable-header"
                      >
                        <div className="d-flex align-items-center">
                          Employee No.
                          <span className="ms-2">
                            {renderSortIcon('employee_no')}
                          </span>
                        </div>
                      </th>

                      <th 
                        onClick={() => {
                          setSortColumn('employeeName');
                          setSortDirection(sortColumn === 'employeeName' && sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                        style={{ cursor: 'pointer' }}
                        className="sortable-header"
                      >
                        <div className="d-flex align-items-center">
                          Employee Name
                          <span className="ms-2">
                            {renderSortIcon('employeeName')}
                          </span>
                        </div>
                      </th>
                      
                      <th 
                        onClick={() => {
                          setSortColumn('date_applied');
                          setSortDirection(sortColumn === 'date_applied' && sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                        style={{ cursor: 'pointer' }}
                        className="sortable-header"
                      >
                        <div className="d-flex align-items-center">
                          Date Applied
                          <span className="ms-2">
                            {renderSortIcon('date_applied')}
                          </span>
                        </div>
                      </th>
                      
                      <th 
                        onClick={() => {
                          setSortColumn('leave_type');
                          setSortDirection(sortColumn === 'leave_type' && sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                        style={{ cursor: 'pointer' }}
                        className="sortable-header"
                      >
                        <div className="d-flex align-items-center">
                          Leave Type
                          <span className="ms-2">
                            {renderSortIcon('leave_type')}
                          </span>
                        </div>
                      </th>
                      
                      <th 
                        onClick={() => {
                          setSortColumn('start_date');
                          setSortDirection(sortColumn === 'start_date' && sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                        style={{ cursor: 'pointer' }}
                        className="sortable-header"
                      >
                        <div className="d-flex align-items-center">
                          Start Date
                          <span className="ms-2">
                            {renderSortIcon('start_date')}
                          </span>
                        </div>
                      </th>
                      
                      <th 
                        onClick={() => {
                          setSortColumn('end_date');
                          setSortDirection(sortColumn === 'end_date' && sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                        style={{ cursor: 'pointer' }}
                        className="sortable-header"
                      >
                        <div className="d-flex align-items-center">
                          End Date
                          <span className="ms-2">
                            {renderSortIcon('end_date')}
                          </span>
                        </div>
                      </th>
                      
                      <th>Days</th>
                      
                      <th>Reason</th>
                      
                      <th>Leave Form</th>
                      
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
                      
                      <th>Approved By</th>
                      
                      <th>Remarks</th>
                      
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((leave) => (
                        <tr key={leave.leave_id}>
                          <td>{leave.employee_no}</td>
                          <td>{getEmployeeName(leave.employee_no)}</td>
                          <td>{formatDate(leave.date_applied)}</td>
                          <td>{leave.leave_type}</td>
                          <td>{formatDate(leave.start_date)}</td>
                          <td>{formatDate(leave.end_date)}</td>
                          <td>{calculateDays(leave.start_date, leave.end_date)}</td>
                          <td className="text-truncate" style={{maxWidth: '200px'}} title={leave.reason}>
                            {leave.reason?.length > 50 ? `${leave.reason.substring(0, 50)}...` : leave.reason}
                          </td>
                          <td>
                            {leave.leave_form && leave.leave_form !== 'N/A' ? (
                              <a 
                                href={leave.leave_form} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary"
                                title="View Leave Form"
                              >
                                <i className="fas fa-file-alt"></i> View
                              </a>
                            ) : (
                              <span title="No leave form available">N/A</span>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${leave.status?.toLowerCase()}`}>
                              {leave.status}
                            </span>
                          </td>
                          <td>{leave.approved_by || 'N/A'}</td>
                          <td>{leave.remarks || 'N/A'}</td>
                          <td>
                            <button 
                              className="btn btn-primary btn-sm me-2" 
                              onClick={() => handleEditClick(leave)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-danger btn-sm" 
                              onClick={() => handleDeleteClick(leave)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="13" className="text-center">
                          No leave records found
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

      {/* Render the AddLeaveModal */}
      <AddLeaveModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        employees={employees}
        onLeaveAdded={() => {
          setLeaves([]);
          setShowAddModal(false);
        }}  
      />

    </div>
  );
};

export default Leave;