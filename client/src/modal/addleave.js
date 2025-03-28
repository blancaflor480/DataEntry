// src/modal/addleave.js
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import axios from "axios";
import { format } from "date-fns";

const AddLeaveModal = ({ show, onHide, employees, onLeaveAdded }) => {
  const [formData, setFormData] = useState({
    employee_no: "",
    leave_type: "Vacation",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    reason: "",
    leave_form: null,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, leave_form: e.target.files[0] }));
  };

  const calculateDays = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.employee_no) {
      setError("Please select an employee");
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setError("Please select both start and end dates");
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError("End date must be after start date");
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();
    formDataToSend.append("employee_no", formData.employee_no);
    formDataToSend.append("leave_type", formData.leave_type);
    formDataToSend.append("start_date", formData.start_date);
    formDataToSend.append("end_date", formData.end_date);
    formDataToSend.append("reason", formData.reason);
    if (formData.leave_form) {
      formDataToSend.append("leave_form", formData.leave_form);
    }

     // Fix: Update the API endpoint with the correct base URL
    const response = await axios.post("http://localhost:5000/api/v1/leaves", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Leave added successfully!");
    onLeaveAdded();
    setTimeout(() => {
      onHide();
      setFormData({
        employee_no: "",
        leave_type: "Vacation",
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: format(new Date(), "yyyy-MM-dd"),
        reason: "",
        leave_form: null,
      });
    }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add leave");
      console.error("Error details:", err); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Add New Leave</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="employee_no">
                <Form.Label>Employee</Form.Label>
                <Form.Control
                  as="select"
                  name="employee_no"
                  value={formData.employee_no}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeNo} value={emp.employeeNo}>
                      {emp.firstName} {emp.lastName} ({emp.employeeNo})
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="leave_type">
                <Form.Label>Leave Type</Form.Label>
                <Form.Control
                  as="select"
                  name="leave_type"
                  value={formData.leave_type}
                  onChange={handleChange}
                  required
                >
                  <option value="Vacation">Vacation</option>
                  <option value="Sick">Sick</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Maternity">Maternity</option>
                  <option value="Paternity">Paternity</option>
                  <option value="Bereavement">Bereavement</option>
                  <option value="Other">Other</option>
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="start_date">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="end_date">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="days">
                <Form.Label>Number of Days</Form.Label>
                <Form.Control
                  type="text"
                  value={calculateDays()}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="leave_form">
                <Form.Label>Leave Form (Optional)</Form.Label>
                <Form.Control
                  type="file"
                  name="leave_form"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId="reason" className="mb-3">
            <Form.Label>Reason</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Leave"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddLeaveModal;