import React, { useState } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const DeleteRecordModal = ({ show, onHide, recordToDelete, onDeleteSuccess }) => {
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setError('');
    setIsDeleting(true);

    try {
      await axios.delete(`http://localhost:5000/records/${recordToDelete.recordID}`);
      onDeleteSuccess(recordToDelete.recordID);
      onHide();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete record');
      setIsDeleting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Deletion</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <p>
          Are you sure you want to delete this record for employee {recordToDelete?.employeeNo}?
        </p>
        <p><strong>Type:</strong> {recordToDelete?.type}</p>
        <p><strong>Date Issued:</strong> {recordToDelete?.dateIssued?.split('T')[0]}</p>
        <p className="text-danger">This action cannot be undone.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete Record'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteRecordModal;