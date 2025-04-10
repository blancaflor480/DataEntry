import React from "react";
import { Modal, Button, Row, Col } from "react-bootstrap";

const ViewLeaveModal = ({ show, onHide, leave, employees }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getEmployeeName = (employeeNo) => {
    if (!employeeNo) return "N/A";
    const employee = employees.find(emp => emp.employeeNo === employeeNo);
    return employee ? `${employee.firstName} ${employee.lastName}` : "N/A";
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (!leave) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>Leave Details</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-5">
        {/* Employee Information Section */}
        <div className="border-bottom pb-3 mb-3">
          <h6 className="text-secondary mb-3">Employee Information</h6>
          <Row>
            <Col md={6}>
              <div className="mb-2">
                <label className="fw-bold">Employee Name:</label>
                <div>{getEmployeeName(leave.employee_no)}</div>
              </div>
            </Col>
            <Col md={6}>
              <div className="mb-2">
                <label className="fw-bold">Employee No:</label>
                <div>{leave.employee_no}</div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Leave Details Section */}
        <div className="border-bottom pb-3 mb-3">
          <h6 className="text-secondary mb-3">Leave Information</h6>
          <Row>
            <Col md={6}>
              <div className="mb-2">
                <label className="fw-bold">Leave Type:</label>
                <div>{leave.leave_type}</div>
              </div>
            </Col>
            <Col md={6}>
              <div className="mb-2">
                <label className="fw-bold">Status:</label>
                <div>
                  <span className={`badge ${
                    leave.status?.toLowerCase() === 'approved' ? 'bg-success' :
                    leave.status?.toLowerCase() === 'rejected' ? 'bg-danger' :
                    'bg-warning'
                  }`}>
                    {leave.status}
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Date Information Section */}
        <div className="border-bottom pb-3 mb-3">
          <h6 className="text-secondary mb-3">Date Information</h6>
          <Row>
            <Col md={6}>
              <div className="mb-2">
                <label className="fw-bold">Date Applied:</label>
                <div>{formatDate(leave.date_applied)}</div>
              </div>
              <div className="mb-2">
                <label className="fw-bold">Duration:</label>
                <div>{calculateDays(leave.start_date, leave.end_date)} days</div>
              </div>
            </Col>
            <Col md={6}>
              <div className="mb-2">
                <label className="fw-bold">Start Date:</label>
                <div>{formatDate(leave.start_date)}</div>
              </div>
              <div className="mb-2">
                <label className="fw-bold">End Date:</label>
                <div>{formatDate(leave.end_date)}</div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Additional Details Section */}
        <div className="border-bottom pb-3 mb-3">
          <h6 className="text-secondary mb-3">Additional Details</h6>
          <div className="mb-2">
            <label className="fw-bold">Approved By:</label>
            <div>{getEmployeeName(leave.approved_by) || 'N/A'}</div>
          </div>
          
          {leave.reason && (
            <div className="mb-2">
              <label className="fw-bold">Reason:</label>
              <div>{leave.reason}</div>
            </div>
          )}

          {leave.remarks && (
            <div className="mb-2">
              <label className="fw-bold">Remarks:</label>
              <div>{leave.remarks}</div>
            </div>
          )}
        </div>

        {/* Attachments Section */}
        {leave.leave_form && (
          <div>
            <h6 className="text-secondary mb-3">Attachments</h6>
            <div className="mb-2">
              <a 
                href={leave.leave_form} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary btn-sm"
              >
                View Leave Form
              </a>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewLeaveModal;