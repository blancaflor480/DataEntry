import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Alert, Badge, Nav, Tab } from "react-bootstrap";
import axios from "axios";
import { getAuth } from "firebase/auth";

const DeleteLeaveApprovalTableModal = ({ show, onHide, userRole }) => {
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const [deleteHistory, setDeleteHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch pending delete requests when modal opens
  useEffect(() => {
    if (show) {
      fetchPendingDeletes();
      fetchDeleteHistory();
    }
  }, [show]);

  const fetchPendingDeletes = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/v1/leaves/delete-requests/pending");
      setPendingDeletes(response.data);
    } catch (err) {
      setError("Failed to fetch pending delete requests");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeleteHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/v1/leaves/delete-requests/history");
      setDeleteHistory(response.data);
    } catch (err) {
      setError("Failed to fetch delete history");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDelete = async (requestId) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        setError("User not authenticated");
        return;
      }

      setLoading(true);
      const idToken = await user.getIdToken(true);
      
      await axios.put(
        `http://localhost:5000/api/v1/leaves/delete-requests/${requestId}/approve`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        }
      );
      
      setSuccess("Delete request approved successfully!");
      fetchPendingDeletes();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to approve delete request");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectDelete = async (requestId) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        setError("User not authenticated");
        return;
      }

      setLoading(true);
      const idToken = await user.getIdToken(true);
      
      await axios.put(
        `http://localhost:5000/api/v1/leaves/delete-requests/${requestId}/reject`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        }
      );
      
      setSuccess("Delete request rejected successfully!");
      fetchPendingDeletes();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reject delete request");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHistory = () => {
    switch(statusFilter) {
      case 'approved':
        return deleteHistory.filter(item => item.status === 'approved');
      case 'rejected':
        return deleteHistory.filter(item => item.status === 'rejected');
      default:
        return deleteHistory;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Delete Approvals
          {activeTab === "pending" && (
            <Badge bg="warning" className="ms-2">
              {pendingDeletes.length}
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="pending">
                Pending Delete Requests
                <Badge bg="warning" className="ms-2">{pendingDeletes.length}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="history">Delete History</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="pending">
              {loading ? (
                <div className="text-center my-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : pendingDeletes.length === 0 ? (
                <Alert variant="info">No pending delete requests</Alert>
              ) : (
                <div className="table-responsive">
                    <style>
        {`
          .table td {
            font-size: 0.8rem !important;
            padding: 4px 8px !important;
          }
          .badge {
            font-size: 0.8rem !important;
          }
          .btn-sm {
            font-size: 0.7rem !important;
            padding: 2px 6px !important;
          }
        `}
      </style>
                  <Table striped bordered hover>
                    <thead className="table-dark">
                      <tr>
                        <th>Employee</th>
                        <th>Leave Type</th>
                        <th>Leave Period</th>
                        <th>Reason for Delete</th>
                        <th>Requested By</th>
                        <th>Date Requested</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingDeletes.map((request) => (
                        <tr key={request.request_id}>
                          <td>{request.employee_name}</td>
                          <td>{request.leave_type}</td>
                          <td>
                            {new Date(request.start_date).toLocaleDateString()} - 
                            {new Date(request.end_date).toLocaleDateString()}
                          </td>
                          <td>{request.reason}</td>
                          <td>{request.requested_by}</td>
                          <td>{new Date(request.requested_at).toLocaleDateString()}</td>
                          <td>
                            <Badge bg="warning">Pending</Badge>
                          </td>
                          <td>
                            {userRole === "Super Admin" && (
                              <div className="d-flex gap-2">
                                <Button 
                                  variant="success" 
                                  size="sm"
                                  onClick={() => handleApproveDelete(request.request_id)}
                                  disabled={loading}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  variant="danger" 
                                  size="sm"
                                  onClick={() => handleRejectDelete(request.request_id)}
                                  disabled={loading}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Tab.Pane>

            <Tab.Pane eventKey="history">
              <div className="mb-3">
                <select 
                  className="form-select w-auto"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center my-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : deleteHistory.length === 0 ? (
                <Alert variant="info">No delete history available</Alert>
              ) : (
                <Table striped bordered hover>
                  <thead className="table-dark">
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Leave Period</th>
                      <th>Reason</th>
                      <th>Requested By</th>
                      <th>Status</th>
                      <th>Processed By</th>
                      <th>Processed Date</th>
                 
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredHistory().map((record) => (
                      <tr key={record.request_id}>
                        <td>{record.employee_name}</td>
                        <td>{record.leave_type}</td>
                        <td>
                          {new Date(record.start_date).toLocaleDateString()} - 
                          {new Date(record.end_date).toLocaleDateString()}
                        </td>
                        <td>{record.reason}</td>
                        <td>{record.requested_by}</td>
                        <td>
                            <Badge bg={
                                record.status === 'approved' ? 'success' : 
                                record.status === 'rejected' ? 'danger' : 
                                'warning'
                            }>
                                {record.status}
                            </Badge>
                            </td>
                        <td>{record.processed_by}</td>
                        <td>{new Date(record.processed_at).toLocaleDateString()}</td>
                        
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteLeaveApprovalTableModal;