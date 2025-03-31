import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import "../style/dashboard.css";
import { auth } from "../firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth"; 
import { db } from "../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [filter, setFilter] = useState("Active"); 
  const [userEmail, setUserEmail] = useState(""); 
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [statusStats, setStatusStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/login";
      } else {
        setUserEmail(user.email);
        setUserId(user.uid);

        try {
          // Fetch the user's role from Firestore
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

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('http://localhost:5000/employees');
        if (!response.ok) {
          throw new Error('Failed to fetch employees');
        }
        const data = await response.json();
        setEmployees(data);
        
        // Calculate status statistics
        calculateStatusStats(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Calculate status statistics
  const calculateStatusStats = (employeesData) => {
    const statusCounts = {};
    
    // Initialize all possible statuses
    const allStatuses = [
      'Active', 'Regular', 'Probation', 
      'Inactive', 'Resigned', 'Terminated', 'AWOL'
    ];
    
    allStatuses.forEach(status => {
      statusCounts[status] = 0;
    });

    // Count each status
    employeesData.forEach(employee => {
      if (employee.status && statusCounts.hasOwnProperty(employee.status)) {
        statusCounts[employee.status]++;
      }
    });

    // Convert to array for the chart
    const stats = Object.keys(statusCounts).map(status => ({
      name: status,
      value: statusCounts[status],
      percentage: ((statusCounts[status] / employeesData.length) * 100).toFixed(1)
    }));

    setStatusStats(stats);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    try {
      if (userId) {
        const userDocRef = doc(db, "admin", userId);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
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

      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('expirationTime');
      
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      await signOut(auth);
      navigate('/login');
    }
  };

  // Filtered data based on selected status
  const filteredUsers = employees.filter((user) => user.status === filter);

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B'];

  return (
    <div className="dashboard">
      <Sidebar isSidebarOpen={isSidebarOpen} userRole={userRole} />
      <div className={`main-content ${isSidebarOpen ? "" : "sidebar-closed"}`}>
        <Header toggleSidebar={toggleSidebar} userEmail={userEmail} userRole={userRole} handleLogout={handleLogout} />
        <div className="content">
          <h1 className="title-page">Dashboard</h1>

          {/* Three Boxes in a Row */}
          <div className="boxes-container">
            <div className="box">
              <h3 className="text-start d-block">Total Employees</h3>
              <p className="number-title text-start d-block">{employees.length}</p>
            </div>
            <div className="box">
              <h3 className="text-start d-block">Active Employees</h3>
              <p className="number-title text-start d-block">
                {employees.filter(e => e.status === 'Active').length}
              </p>
            </div>
            <div className="box">
              <h3 className="text-start d-block">New Employees Today</h3>
              <p className="number-title text-start d-block">
                {employees.filter(e => {
                  const today = new Date().toISOString().split('T')[0];
                  return e.createdAt && e.createdAt.toString().includes(today);
                }).length}
              </p>
            </div>
          </div>

          {/* Status Distribution Chart */}
          <div className="box mt-4">
            <h3 className="text-type">Employee Status Distribution</h3>
            {loading ? (
              <p>Loading data...</p>
            ) : (
              <div className="chart-container">
                <div className="row">
                  <div className="col-md-8">
                    <div style={{ width: '100%', height: 400 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={statusStats}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                          >
                            {statusStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `${value} employees (${props.payload.percentage}%)`, 
                              name
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="status-list">
                      <h4>Status Breakdown</h4>
                      <ul className="list-group">
                        {statusStats.map((status, index) => (
                          <li 
                            key={status.name} 
                            className="list-group-item d-flex justify-content-between align-items-center"
                            style={{ borderLeft: `5px solid ${COLORS[index % COLORS.length]}` }}
                          >
                            {status.name}
                            <span className="badge bg-primary rounded-pill">
                              {status.value} ({status.percentage}%)
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                    <th>Position</th>
                    <th>Employee No</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr key={user.id}>
                      <td>{index + 1}</td>
                      <td>{`${user.firstName} ${user.lastName}`}</td>
                      <td>{user.status}</td>
                      <td>{user.position}</td>
                      <td>{user.employeeNo}</td>
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