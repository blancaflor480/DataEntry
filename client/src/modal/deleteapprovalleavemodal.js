import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import { getAuth } from "firebase/auth";

const DeleteApprovalModal = ({ show, onHide, leave, userRole, userEmail }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for deletion');
      return;
    }

    try {
      setLoading(true);
      setError('');
       // Get current Firebase user
       const auth = getAuth();
       const user = auth.currentUser;
      
       if (!user) {
        setError('User not authenticated');
        return;
      }
      // Use the Firebase user's email if userEmail prop is not available
      const emailToUse = userEmail || user.email;
      const requestedBy = `${userRole}-${emailToUse}`;
      // Send deletion request to backend
      await axios.post('http://localhost:5000/api/v1/leaves/delete-request', {
        leaveId: leave.leave_id,
        reason: reason,
        requestedBy: requestedBy,
        employeeNo: leave.employee_no,
        leaveType: leave.leave_type,
        startDate: leave.start_date,
        endDate: leave.end_date
      });

      setSuccess('Delete request has been submitted for approval');
      setTimeout(() => {
        onHide();
        setReason('');
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit delete request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>Request Leave Deletion</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="mb-3">
            <h6>Leave Details:</h6>
            <p><strong>Employee:</strong> {leave?.employee_no}</p>
            <p><strong>Leave Type:</strong> {leave?.leave_type}</p>
            <p><strong>Period:</strong> {new Date(leave?.start_date).toLocaleDateString()} - {new Date(leave?.end_date).toLocaleDateString()}</p>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Reason for Deletion<span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a detailed explanation for why this leave record should be deleted"
              required
            />
          </Form.Group>

          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            Your deletion request will be reviewed by a Super Admin before the leave record is removed.
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            type="submit" 
            disabled={loading || !reason.trim()}
          >
            {loading ? 'Submitting...' : 'Submit Delete Request'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default DeleteApprovalModal;