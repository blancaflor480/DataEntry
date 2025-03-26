import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import axios from 'axios';

const DeleteEmployeeModal = ({ show, onHide, employeeToDelete, onDeleteSuccess }) => {
  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/employees/${employeeToDelete.id}`);
      onDeleteSuccess(employeeToDelete.id);
      onHide();
    } catch (error) {
      console.error("Error deleting employee:", error);
      onDeleteSuccess(null, error);
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to delete {employeeToDelete?.firstName} {employeeToDelete?.lastName} (Employee No: {employeeToDelete?.employeeNo})?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteEmployeeModal;