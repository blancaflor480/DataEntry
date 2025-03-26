import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const EditRecordModal = ({ show, onHide, recordToEdit, employees, onRecordUpdated }) => {
  const [formData, setFormData] = useState({
    employeeNo: '',
    type: 'NTE',
    dateIssued: '',
    details: '',
    attachment: '',
    status: 'Pending'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        employeeNo: recordToEdit.employeeNo,
        type: recordToEdit.type,
        dateIssued: recordToEdit.dateIssued.split('T')[0],
        details: recordToEdit.details,
        attachment: recordToEdit.attachment || '',
        status: recordToEdit.status
      });
    }
  }, [recordToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validate employee exists
      const employeeExists = employees.some(emp => emp.employeeNo === formData.employeeNo);
      if (!employeeExists) {
        throw new Error('Employee number does not exist');
      }

      await axios.put(`http://localhost:5000/records/${recordToEdit.recordID}`, formData);
      setSuccess('Record updated successfully');
      onRecordUpdated();
      setTimeout(() => onHide(), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Employee Record</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Employee Number *</Form.Label>
            <Form.Control
              as="select"
              name="employeeNo"
              value={formData.employeeNo}
              onChange={handleChange}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.employeeNo} value={emp.employeeNo}>
                  {emp.employeeNo} - {emp.firstName} {emp.lastName}
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Record Type *</Form.Label>
            <Form.Control
              as="select"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="NTE">Notice to Explain (NTE)</option>
              <option value="IR">Incident Report (IR)</option>
              <option value="Memo">Memorandum</option>
            </Form.Control>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Date Issued *</Form.Label>
            <Form.Control
              type="date"
              name="dateIssued"
              value={formData.dateIssued}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Details *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="details"
              value={formData.details}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Attachment URL</Form.Label>
            <Form.Control
              type="text"
              name="attachment"
              value={formData.attachment}
              onChange={handleChange}
              placeholder="Optional Google Drive URL"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Control
              as="select"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Active">Active</option>
            </Form.Control>
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={onHide} className="me-2">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update Record
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditRecordModal;