import React from "react";
import { Modal, Button, Alert } from "react-bootstrap";
import axios from "axios";

const DeleteEmployeeModal = ({ 
  show, 
  onHide, 
  employeeToDelete, 
  onDeleteSuccess 
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    
    setIsDeleting(true);
    setError("");

    try {
      // Delete from MySQL
      await axios.delete(`http://localhost:5000/employees/${employeeToDelete.id}`);
      
      // Delete from Google Sheets (assuming you have an endpoint for this)
      await axios.post("http://localhost:5000/delete-from-spreadsheet", {
        employeeId: employeeToDelete.id
      });

      onDeleteSuccess();
      onHide();
    } catch (err) {
      console.error("Error deleting employee:", err);
      setError(err.response?.data?.message || "Failed to delete employee");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <p>
          Are you sure you want to delete {employeeToDelete?.firstName} {employeeToDelete?.lastName}?
          This action cannot be undone and will remove the employee from both the 
          database and spreadsheet.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isDeleting}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Confirm Delete"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteEmployeeModal;