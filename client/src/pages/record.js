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
        const response = await axios.get('http://localhost:5000/records');
        // Ensure we have an array even if response.data is null/undefined
        setRecords(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching records:", error);
        setRecords([]);
        // You might want to show an error alert here
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
  
  const processedRecords = () => {
    let result = records?.filter((record) => {
      const typeMatches = 
        typeFilter === "All" ? true : record.type === typeFilter;
      
      const statusFilterMatches = 
        statusFilter === "All" ? true : record.status === statusFilter;
      
      return typeMatches && statusFilterMatches;
    }) || [];

    result = result.filter((record) =>
      getEmployeeName(record.employeeNo)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      record.employeeNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.details?.toLowerCase().includes(searchQuery.toLowerCase())
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
          case 'employeeName':
            valA = getEmployeeName(a.employeeNo);
            valB = getEmployeeName(b.employeeNo);
            break;
          case 'type':
            valA = a.type;
            valB = b.type;
            break;
          case 'dateIssued':
            valA = new Date(a.dateIssued);
            valB = new Date(b.dateIssued);
            break;
          case 'status':
            valA = a.status;
            valB = b.status;
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
              <h3 className="text-type">List of Employee Records (NTE, IR, Memo)</h3>
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
                  <option value="All">All</option>
                  <option value="NTE">Notice to Explain</option>
                  <option value="IR">Incident Report</option>
                  <option value="Memo">Memorandum</option>
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
                  <option value="Pending">Pending</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Active">Active</option>
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
              <button className="btn btn-primary search-button">Search</button>
              <button
                className="btn btn-success search-button"
                onClick={() => setShowAddModal(true)}
              >
                Add Record
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
                          setSortColumn('type');
                          setSortDirection(sortColumn === 'type' && sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                        style={{ cursor: 'pointer' }}
                        className="sortable-header"
                      >
                        <div className="d-flex align-items-center">
                          Type
                          <span className="ms-2">
                            {renderSortIcon('type')}
                          </span>
                        </div>
                      </th>

                      <th 
                        onClick={() => {
                          setSortColumn('dateIssued');
                          setSortDirection(sortColumn === 'dateIssued' && sortDirection === 'asc' ? 'desc' : 'asc');
                        }}
                        style={{ cursor: 'pointer' }}
                        className="sortable-header"
                      >
                        <div className="d-flex align-items-center">
                          Date Issued
                          <span className="ms-2">
                            {renderSortIcon('dateIssued')}
                          </span>
                        </div>
                      </th>

                      <th>Details</th>
                      
                      <th>Attachment</th>

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

                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((record) => (
                        <tr key={record.recordID}>
                          <td>{record.employeeNo}</td>
                          <td>{getEmployeeName(record.employeeNo)}</td>
                          <td>{record.type}</td>
                          <td>{formatDate(record.dateIssued)}</td>
                          <td className="text-truncate" style={{maxWidth: '200px'}} title={record.details}>
                            {record.details.length > 50 ? `${record.details.substring(0, 50)}...` : record.details}
                          </td>
                          <td>
                            {record.attachment && record.attachment !== 'N/A' ? (
                              <a 
                                href={record.attachment} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary"
                                title="View Attachment"
                              >
                                <i className="fas fa-file-alt"></i> View
                              </a>
                            ) : (
                              <span title="No attachment available">No Attachment</span>
                            )}
                          </td>

                          <td>
                            <span className={`status-badge ${record.status?.toLowerCase()}`}>
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
                            <button 
                              className="btn btn-danger btn-sm" 
                              onClick={() => handleDeleteClick(record)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No records found
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
        recordToEdit={selectedRecord}
        employees={employees}
        onRecordUpdated={() => {
          // Refresh records list after update
          setRecords([]);
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