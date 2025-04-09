import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import axios from "axios";

const ProcessLeaveModal = ({ show, onHide, leave, employees, onLeaveProcessed }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    employee_no: "",
    leave_type: "",
    date_applied: "",
    start_date: "",
    end_date: "",
    reason: "",
    status: "",
    remarks: "",
    approved_by: ""
  });

  useEffect(() => {
    if (leave) {
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
      };
  
      setFormData({
        ...leave,
        date_applied: formatDate(leave.date_applied),
        start_date: formatDate(leave.start_date),
        end_date: formatDate(leave.end_date),
        remarks: leave.remarks || "",
        approved_by: leave.approved_by || ""
      });
    }
  }, [leave]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "approved_by") {
      const selectedEmployee = employees.find(emp => emp.employeeNo === value);
      setFormData(prev => ({
        ...prev,
        approved_by: value,
        approved_by_name: selectedEmployee ? 
          `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleApprove = async () => {
    await processLeave("Approved");
  };

  const handleReject = async () => {
    await processLeave("Rejected");
  };

  // Add the handleFileChange function
const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setFormData(prev => ({
      ...prev,
      leave_form: e.target.files[0]
    }));
  };

  // Update the handleSaveChanges function
  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      setError("");
      
      if (!window.confirm("Are you sure you want to save these changes?")) {
        return;
      }
  
      const formDataToSend = new FormData();
      formDataToSend.append("start_date", formData.start_date);
      formDataToSend.append("end_date", formData.end_date);
      formDataToSend.append("leave_type", formData.leave_type);
      
      if (selectedFile) {
        formDataToSend.append("leave_form", selectedFile);
      }
    
      await axios.put(`http://localhost:5000/api/v1/leaves/${leave.leave_id}`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Changes saved successfully!");
      setIsEditing(false);
      onLeaveProcessed();
    } catch (err) {
      console.error("Error updating leave:", err);
      setError(err.response?.data?.error || "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };
  

  const processLeave = async (status) => {
    if (!formData.approved_by) {
      setError("Please select who is approving/rejecting this leave");
      return;
    }

    if (!formData.remarks.trim()) {
      setError("Please provide remarks");
      return;
    }

    // Add confirmation
  if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this leave?`)) {
    return;
  }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await axios.put(`http://localhost:5000/api/v1/leaves/${leave.leave_id}/process`, {
        ...formData,
        status: status
      });

      setSuccess(`Leave has been ${status.toLowerCase()} successfully!`);
      onLeaveProcessed();
      
      setTimeout(() => {
        onHide();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${status.toLowerCase()} leave`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Process Leave Application</Modal.Title>
      </Modal.Header>
      <Form>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Employee</Form.Label>
                <Form.Control
                  type="text"
                  value={`${leave?.firstName || ''} ${leave?.lastName || ''} (${leave?.employee_no || ''})`}
                  disabled
                />
              </Form.Group>
            </Col>
            <Col md={6}>
            <Form.Group>
            <Form.Label>Leave Type</Form.Label>
            {isEditing ? (
                <Form.Select
                name="leave_type"
                value={formData.leave_type}
                onChange={handleChange}
                required
                >
                <option value="Vacation Leave (VL)">Vacation Leave (VL)</option>
                <option value="Sick Leave (SL)">Sick Leave (SL)</option>
                <option value="Emergency Leave (EL)">Emergency Leave (EL)</option>
                <option value="Maternity Leave">Maternity Leave</option>
                <option value="Paternity Leave">Paternity Leave</option>
                <option value="Parental Leave">Parental Leave</option>
                <option value="Bereavement Leave">Bereavement Leave</option>
                <option value="Birthday Leave">Birthday Leave</option>
                <option value="Other">Other</option>
                </Form.Select>
            ) : (
                <Form.Control
                type="text"
                value={formData.leave_type}
                disabled={!isEditing}
                />
            )}
            </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Date Applied</Form.Label>
                <Form.Control
                  type="date"
                  name="date_applied"
                  value={formData.date_applied || ''}
                  disabled={!isEditing}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  name="start_date"
                  value={formData.start_date || ''}
                  disabled={!isEditing}
                  onChange={handleChange}
                  
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.end_date || ''}
                  disabled={!isEditing}
                  onChange={handleChange}
                  name="end_date"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
                <Form.Group>
                <Form.Label>Leave Form</Form.Label>
                {isEditing ? (
                    <Form.Control
                    type="file"
                    name="leave_form"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                ) : (
                    formData.leave_form ? (
                    <div className="d-flex align-items-center">
                        <a 
                        href={formData.leave_form}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary me-2"
                        >
                        <i className="fas fa-file-alt"></i> View Current Form
                        </a>
                    </div>
                    ) : (
                    <p className="text-muted mb-0">No leave form attached</p>
                    )
                )}
                </Form.Group>
            </Col>
            </Row>  
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Reason</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.reason}
                  disabled
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
            <Form.Group>
                <Form.Label>Processed By</Form.Label>
                <Form.Select
                    name="approved_by"
                    value={formData.approved_by}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                    <option key={emp.employeeNo} value={emp.employeeNo}>
                        {emp.firstName} {emp.lastName} ({emp.employeeNo})
                    </option>
                    ))}
                </Form.Select>
                </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Current Status</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.status}
                  disabled
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Remarks</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Enter remarks for approval/rejection"
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
          {isEditing ? (
                <Button 
                variant="success" 
                onClick={handleSaveChanges}
                disabled={loading}
                >
                {loading ? "Saving..." : "Save Changes"}
                </Button>
            ) : (
                <Button variant="warning" onClick={() => setIsEditing(true)}>
                Edit Details
                </Button>
            )}
          <Button 
                variant="danger" 
                onClick={handleReject}
                disabled={loading || isEditing}
            >
                {loading ? "Processing..." : "Reject Leave"}
            </Button>
            <Button 
            variant="success" 
            onClick={handleApprove}
            disabled={loading || isEditing}
        >
            {loading ? "Processing..." : "Approve Leave"}
        </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ProcessLeaveModal;