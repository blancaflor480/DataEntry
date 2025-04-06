import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Alert, Badge, Nav, Tab } from "react-bootstrap";
import axios from "axios";
import { getAuth } from "firebase/auth";

const ApprovalModal = ({ 
  show, 
  onHide, 
  userRole,
  refreshEmployees 
}) => {
  const [pendingEdits, setPendingEdits] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]); // Add this line
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch pending approvals when modal opens
  useEffect(() => {
    if (show) {
      fetchPendingApprovals();
      fetchApprovalHistory();
    }
  }, [show]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/approvals/pending");
      setPendingEdits(response.data);
    } catch (err) {
      setError("Failed to fetch pending approvals");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchApprovalHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/approvals/history");
      setApprovalHistory(response.data);
    } catch (err) {
      setError("Failed to fetch approval history");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHistory = () => {
    switch(statusFilter) {
      case 'approved':
        return approvalHistory.filter(item => item.status === 'approved');
      case 'rejected':
        return approvalHistory.filter(item => item.status === 'rejected');
      default:
        return approvalHistory;
    }
  };
  const handleApprove = async (editId) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        setError("User not authenticated. Please log in again.");
        return;
      }

      setLoading(true);
      setError("");
      setSuccess("");
      
      const idToken = await user.getIdToken(true); // Force refresh the token
      
      const response = await axios.put(
        `http://localhost:5000/approvals/${editId}/approve`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }
      ); 
      
      setSuccess("Edit approved successfully!");
      fetchPendingApprovals();
      refreshEmployees();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to approve edit");
      console.error('Error approving change:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (editId) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        setError("User not authenticated. Please log in again.");
        return;
      }
  
      setLoading(true);
      setError("");
      setSuccess("");
      
      const idToken = await user.getIdToken(true); // Force refresh the token
      
      const response = await axios.put(
        `http://localhost:5000/approvals/${editId}/reject`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess("Edit rejected successfully!");
      fetchPendingApprovals();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reject edit");
      console.error('Error rejecting change:', err);
    } finally {
      setLoading(false);
    }
  };
  const formatFieldName = (field) => {
    // Convert camelCase to readable format
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
      <Modal.Title>
          Edit Approvals
          {activeTab === "pending" && (
            <Badge bg="warning" className="ms-2">
              {pendingEdits.length}
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess("")} dismissible>{success}</Alert>}
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        
        <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="pending">
                Pending Approvals
                <Badge bg="warning" className="ms-2">{pendingEdits.length}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="history">Approval History</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
          <Tab.Pane eventKey="pending">
        {loading && !pendingEdits.length ? (
          <div className="text-center my-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : pendingEdits.length === 0 ? (
          <Alert variant="info">No pending edits for approval</Alert>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="table-dark">
                <tr>
                  <th>Employee</th>
                  <th>Field</th>
                  <th>Current Value</th>
                  <th>Requested Value</th>
                  <th>Requested By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingEdits.map((edit) => (
                  <tr key={edit.id}>
                    <td>
                      {edit.employeeName} 
                      <br />
                      <small className="text-muted">#{edit.employeeNo}</small>
                    </td>
                    <td>{formatFieldName(edit.field)}</td>
                    <td className="text-danger">
                      {edit.oldValue || <em>Empty</em>}
                    </td>
                    <td className="text-success">
                      {edit.newValue || <em>Empty</em>}
                    </td>
                    <td>
                    {edit.requestedByEmail}
                    <br />
                    <small className="text-muted">
                        {new Date(edit.requestedAt).toLocaleString()}
                    </small>
                    </td>
                    <td>
                      {new Date(edit.requestedAt).toLocaleDateString()}
                    </td>
                    <td>
                      {userRole === "Super Admin" && (
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={() => handleApprove(edit.id)}
                            disabled={loading}
                          >
                            <i className="fas fa-check"></i> Approve
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleReject(edit.id)}
                            disabled={loading}
                          >
                            <i className="fas fa-times"></i> Reject
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
          {loading && !approvalHistory.length ? (
            <div className="text-center my-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : approvalHistory.length === 0 ? (
            <Alert variant="info">No approval history available</Alert>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th>Employee</th>
                    <th>Field</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>Status</th>
                    <th>Processed By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
          {getFilteredHistory().map((history) => (
            <tr key={history.id}>
              <td>{history.employeeName}</td>
              <td>{formatFieldName(history.field)}</td>
              <td>{history.oldValue || "N/A"}</td>
              <td>{history.newValue || "N/A"}</td>
              <td>
                <Badge bg={history.status === 'approved' ? 'success' : 'danger'}>
                  {history.status}
                </Badge>
              </td>
              <td>
                {history.status === 'approved' ? 
                  history.approvedByEmail : 
                  history.rejectedByEmail
                }
              </td>
              <td>
                {new Date(
                  history.status === 'approved' ? 
                    history.approvedAt : 
                    history.rejectedAt
                ).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
              </Table>
            </div>
          )}
          </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        {userRole === "Super Admin" && pendingEdits.length > 0 && (
          <Button 
            variant="primary"
            onClick={() => {
              if (window.confirm("Approve all pending changes?")) {
                pendingEdits.forEach(edit => handleApprove(edit.id));
              }
            }}
            disabled={loading}
          >
            Approve All
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ApprovalModal;