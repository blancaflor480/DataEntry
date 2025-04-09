import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import '../style/addrecord.css';

const EditRecordModal = ({ show, onHide, incident, employees, onIncidentUpdated }) => {
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    reported_by: '',
    employee_no: '',
    department_head: '',
    incident_category: 'Employee Behavior',
    incident_type: '',
    incident_date: '',
    incident_time: '',
    department: '',
    location: '',
    description: '',
    witnesses: '',
    severity: 'Low',
    status: 'Open',
    resolution_details: '',
    attachments: []
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const searchRef = useRef(null);
  const [deptHeadSearchTerm, setDeptHeadSearchTerm] = useState('');
  const [showDeptHeadDropdown, setShowDeptHeadDropdown] = useState(false);
  const [filteredDeptHeads, setFilteredDeptHeads] = useState([]);
  const deptHeadSearchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (deptHeadSearchRef.current && !deptHeadSearchRef.current.contains(event.target)) {
        setShowDeptHeadDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchTerm && !formData.employee_no) {
      const filtered = employees.filter(emp => 
        emp.employeeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [searchTerm, employees, formData.employee_no]);

  useEffect(() => {
    if (incident) {
      const employee = employees.find(emp => emp.employeeNo === incident.employee_no);
      const deptHead = employees.find(emp => emp.employeeNo === incident.department_head);

      setFormData({
        reported_by: incident.reported_by || '',
        employee_no: incident.employee_no || '',
        department_head: incident.department_head || '',
        incident_category: incident.incident_category || 'Employee Behavior',
        incident_type: incident.incident_type || '',
        incident_date: incident.incident_date?.split('T')[0] || '',
        incident_time: incident.incident_time || '',
        department: incident.department || '',
        location: incident.location || '',
        description: incident.description || '',
        witnesses: incident.witnesses || '',
        severity: incident.severity || 'Low',
        status: incident.status || 'Open',
        resolution_details: incident.resolution_details || '',
        attachments: []
      });

      if (employee) {
        setSearchTerm(`${employee.employeeNo} - ${employee.firstName} ${employee.lastName}`);
      }
      if (deptHead) {
        setDeptHeadSearchTerm(`${deptHead.employeeNo} - ${deptHead.firstName} ${deptHead.lastName}`);
      }
      setErrors({});
    }
  }, [incident, employees]);

  const getTypeOptions = (category) => {
    switch (category) {
      case 'Employee Behavior':
        return [
          { value: 'Absent', label: 'Absent' },
          { value: 'Late', label: 'Late' },
          { value: 'Undertime', label: 'Undertime' },
          { value: 'No call, No show', label: 'No call, No show' },
          { value: 'Frequent Absenteeism', label: 'Frequent Absenteeism' }
        ];
      case 'Misconduct & Violation':
        return [
          { value: 'Negligence', label: 'Negligence' },
          { value: 'Insubordination', label: 'Insubordination' },
          { value: 'Dishonesty', label: 'Dishonesty' },
          { value: 'Harassment', label: 'Harassment' },
          { value: 'Theft', label: 'Theft' },
          { value: 'Substance Abuse', label: 'Substance Abuse' },
          { value: 'Violence/Aggression', label: 'Violence/Aggression' },
          { value: 'Breach of Confidentiality', label: 'Breach of Confidentiality' }
        ];
      default:
        return [];
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'incident_category' && {
        incident_type: getTypeOptions(value)[0]?.value || ''
      })
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      setErrors({ ...errors, attachments: 'Maximum 3 files allowed' });
      return;
    }
    setFormData(prev => ({ ...prev, attachments: files }));
  };

  const handleEmployeeSelect = (employee) => {
    setFormData(prev => ({
      ...prev,
      employee_no: employee.employeeNo
    }));
    setSearchTerm(`${employee.employeeNo} - ${employee.firstName} ${employee.lastName}`);
    setShowDropdown(false);
  };

  const handleDeptHeadSelect = (employee) => {
    setFormData(prev => ({
      ...prev,
      department_head: employee.employeeNo
    }));
    setDeptHeadSearchTerm(`${employee.employeeNo} - ${employee.firstName} ${employee.lastName}`);
    setShowDeptHeadDropdown(false);
  };

  useEffect(() => {
    if (deptHeadSearchTerm && !formData.department_head) {
      const filtered = employees.filter(emp => 
        emp.employeeNo.toLowerCase().includes(deptHeadSearchTerm.toLowerCase()) ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(deptHeadSearchTerm.toLowerCase())
      );
      setFilteredDeptHeads(filtered);
      setShowDeptHeadDropdown(true);
    } else {
      setShowDeptHeadDropdown(false);
    }
  }, [deptHeadSearchTerm, employees, formData.department_head]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'attachments') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append new attachments if any
      if (formData.attachments.length > 0) {
        formData.attachments.forEach(file => {
          formDataToSend.append('attachments', file);
        });
      }

      await axios.put(
        `http://localhost:5000/incident-reports/${incident.incident_id}`, 
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setSuccess('Incident report updated successfully');
      onIncidentUpdated();
      setTimeout(() => {
        onHide();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Incident Report</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form.Group className="mb-3">
            <Form.Label>Reported By *</Form.Label>
            <Form.Select
              name="reported_by"
              value={formData.reported_by}
              onChange={handleChange}
              required
            >
              <option value="">Select Reporter</option>
              {employees.map(emp => (
                <option key={emp.employeeNo} value={emp.employeeNo}>
                  {emp.employeeNo} - {emp.firstName} {emp.lastName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Name Person Involed (Employee) *</Form.Label>
            <div className="search-container" ref={searchRef}>
              <Form.Control
                type="text"
                placeholder="Search by employee number or name"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (formData.employee_no) {
                    setFormData(prev => ({ ...prev, employee_no: '' }));
                  }
                }}
                onClick={() => {
                  if (!formData.employee_no) {
                    setShowDropdown(true);
                  }
                }}
                required
              />
              {showDropdown && !formData.employee_no && (
                <div className="employee-dropdown">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map(emp => (
                      <div
                        key={emp.employeeNo}
                        className="employee-item"
                        onClick={() => handleEmployeeSelect(emp)}
                      >
                        {emp.employeeNo} - {emp.firstName} {emp.lastName}
                      </div>
                    ))
                  ) : (
                    <div className="no-results">No employees found</div>
                  )}
                </div>
              )}
            </div>
          </Form.Group>
          
          <Form.Group className="mb-3" ref={deptHeadSearchRef}>
            <Form.Label>Department Head *</Form.Label>
            <div className="search-container">
              <Form.Control
                type="text"
                placeholder="Search by employee number or name"
                value={deptHeadSearchTerm}
                onChange={(e) => {
                  setDeptHeadSearchTerm(e.target.value);
                  if (formData.department_head) {
                    setFormData(prev => ({ ...prev, department_head: '' }));
                  }
                }}
                onClick={() => {
                  if (!formData.department_head) {
                    setShowDeptHeadDropdown(true);
                  }
                }}
                required
              />
              {showDeptHeadDropdown && !formData.department_head && (
                <div className="employee-dropdown">
                  {filteredDeptHeads.length > 0 ? (
                    filteredDeptHeads.map(emp => (
                      <div
                        key={emp.employeeNo}
                        className="employee-item"
                        onClick={() => handleDeptHeadSelect(emp)}
                      >
                        {emp.employeeNo} - {emp.firstName} {emp.lastName}
                      </div>
                    ))
                  ) : (
                    <div className="no-results">No employees found</div>
                  )}
                </div>
              )}
            </div>
          </Form.Group>
          
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Category *</Form.Label>
                <Form.Select
                  name="incident_category"
                  value={formData.incident_category}
                  onChange={handleChange}
                  required
                >
                  <option value="Employee Behavior">Employee Behavior</option>
                  <option value="Misconduct & Violation">Misconduct & Violation</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Type *</Form.Label>
                <Form.Select
                  name="incident_type"
                  value={formData.incident_type}
                  onChange={handleChange}
                  required
                >
                  {getTypeOptions(formData.incident_category).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="incident_date"
                  value={formData.incident_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Time *</Form.Label>
                <Form.Control
                  type="time"
                  name="incident_time"
                  value={formData.incident_time}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
          </div>
        
          <Form.Group className="mb-3">
            <Form.Label>Department *</Form.Label>
            <Form.Select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="Admin Department">Admin Department</option>
              <option value="Sales Department">Sales Department</option>
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Location *</Form.Label>
            <Form.Control
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Witness</Form.Label>
            <Form.Control
              type="text"
              name="witnesses"
              value={formData.witnesses}
              onChange={handleChange}
              placeholder="Separate multiple witnesses with commas"
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Severity *</Form.Label>
            <Form.Select
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              required
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Open">Open</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
  <Form.Label>Current Attachments</Form.Label>
  <div className="mb-2">
    {[
      incident?.attachment1_path && (
        <a 
          key="1"
          href={incident.attachment1_path}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-outline-primary me-2"
        >
          Attachment 1
        </a>
      ),
      incident?.attachment2_path && (
        <a
          key="2"
          href={incident.attachment2_path}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-outline-primary me-2"
        >
          Attachment 2
        </a>
      ),
      incident?.attachment3_path && (
        <a
          key="3"
          href={incident.attachment3_path}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-outline-primary"
        >
          Attachment 3
        </a>
      )
    ].filter(Boolean)}
    {!incident?.attachment1_path && 
     !incident?.attachment2_path && 
     !incident?.attachment3_path && 
     <span>No current attachments</span>
    }
  </div>
</Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Attachments (Max 3 files)</Form.Label>
            <Form.Control
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              isInvalid={!!errors.attachments}
            />
            <Form.Control.Feedback type="invalid">
              {errors.attachments}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Resolution Details</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="resolution_details"
              value={formData.resolution_details}
              onChange={handleChange}
              placeholder="Enter resolution details if any"
            />
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={onHide} className="me-2">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update Incident Report
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditRecordModal;