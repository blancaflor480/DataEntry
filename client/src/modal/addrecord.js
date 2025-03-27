import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const AddRecordModal = ({ show, onHide, employees, onRecordAdded }) => {
  const [formData, setFormData] = useState({
    employeeNo: '',
    type: 'NTE',
    dateIssued: new Date().toISOString().split('T')[0],
    details: '',
    attachment: null, // Changed from empty string to null for file handling
    status: 'Pending'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({}); // Added errors state

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: files[0] 
    }));

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
  
    try {
      // Validate employee exists
      const employee = employees.find(emp => emp.employeeNo === formData.employeeNo);
      
    

      if (!employee) {
        throw new Error('Employee number does not exist');
      }

      // Validate required fields
      const newErrors = {};
      if (!formData.employeeNo) newErrors.employeeNo = 'Employee number is required';
      if (!formData.type) newErrors.type = 'Record type is required';
      if (!formData.dateIssued) newErrors.dateIssued = 'Date issued is required';
      if (!formData.details) newErrors.details = 'Details are required';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
  
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('employeeNo', formData.employeeNo);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('dateIssued', formData.dateIssued);
      formDataToSend.append('details', formData.details);
      formDataToSend.append('status', formData.status);
      
      // If there's a file, append it
      if (formData.attachment) {
        formDataToSend.append('attachment', formData.attachment);
      }
  

      const response = await axios.post("http://localhost:5000/records", formDataToSend);

      console.log("Server response:", response.data);
  
      
      setSuccess('Record added successfully');
      onRecordAdded();
      setTimeout(() => {
        onHide();
        setFormData({
          employeeNo: '',
          type: 'NTE',
          dateIssued: new Date().toISOString().split('T')[0],
          details: '',
          attachment: null,
          status: 'Pending'
        });
        setErrors({}); // Clear errors on success
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Add New Employee Record</Modal.Title>
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
              isInvalid={!!errors.employeeNo}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.employeeNo} value={emp.employeeNo}>
                  {emp.employeeNo} - {emp.firstName} {emp.lastName}
                </option>
              ))}
            </Form.Control>
            <Form.Control.Feedback type="invalid">
              {errors.employeeNo}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Record Type *</Form.Label>
            <Form.Control
              as="select"
              name="type"
              value={formData.type}
              onChange={handleChange}
              isInvalid={!!errors.type}
              required
            >
              <option value="NTE">Notice to Explain (NTE)</option>
              <option value="IR">Incident Report (IR)</option>
              <option value="Memo">Memorandum</option>
            </Form.Control>
            <Form.Control.Feedback type="invalid">
              {errors.type}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Date Issued *</Form.Label>
            <Form.Control
              type="date"
              name="dateIssued"
              value={formData.dateIssued}
              onChange={handleChange}
              isInvalid={!!errors.dateIssued}
              required
            />
            <Form.Control.Feedback type="invalid">
              {errors.dateIssued}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Details *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="details"
              value={formData.details}
              onChange={handleChange}
              isInvalid={!!errors.details}
              required
            />
            <Form.Control.Feedback type="invalid">
              {errors.details}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Attachment</Form.Label>
            <Form.Control
              type="file"
              name="attachment"
              onChange={handleFileChange}
              isInvalid={!!errors.attachment}
              accept=".pdf,.jpg,.jpeg,.png,.docx"
            />
            <Form.Control.Feedback type="invalid">
              {errors.attachment}
            </Form.Control.Feedback>
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
              Add Record
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddRecordModal;