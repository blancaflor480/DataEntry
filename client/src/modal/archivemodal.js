import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, collection, updateDoc, deleteDoc, getDocs } from "firebase/firestore";

const ArchiveModal = ({ show, onHide, onRestore, onDelete }) => {
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchivedUsers = async () => {
      try {
        setLoading(true);
        const usersCollection = collection(db, "admin");
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((user) => user.status?.toLowerCase() === "disabled");
        setArchivedUsers(usersData || []);
      } catch (error) {
        console.error("Error fetching archived users:", error);
        setArchivedUsers([]);
      } finally {
        setLoading(false);
      }
    };

    if (show) {
      fetchArchivedUsers();
    }
  }, [show]);

  const handleRestore = async (userId) => {
    try {
      const userDocRef = doc(db, "admin", userId);
      await updateDoc(userDocRef, { status: "Active" });

      // Update the UI immediately
      setArchivedUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== userId)
      );

      onRestore();
      alert("User restored successfully!");
    } catch (error) {
      console.error("Error restoring user:", error);
      alert("Failed to restore user. Please try again.");
    }
  };

  const handleDelete = async (userId) => {
    try {
      const userDocRef = doc(db, "admin", userId);
      await deleteDoc(userDocRef);

      // Update the UI immediately
      setArchivedUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== userId)
      );

      onDelete();
      alert("User permanently deleted!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Please try again.");
    }
  };

  return (
    <>
      {/* Blurred Background */}
      {show && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(5px)",
            zIndex: 1040, // Ensure it's below the modal but above other content
          }}
        ></div>
      )}

      {/* Modal */}
      <div
        className={`modal ${show ? "show" : ""}`}
        style={{
          display: show ? "block" : "none",
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1050, // Ensure the modal is above the blurred background
        }}
      >
        <div className="modal-dialog modal-md" style={{ maxWidth: "800px" }}> {/* Adjusted size */}
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Archived Users</h5>
              <button type="button" className="btn-close" onClick={onHide}></button>
            </div>
            <div className="modal-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : archivedUsers.length > 0 ? (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Date Archived</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{user.dateArchived || "N/A"}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleRestore(user.id)}
                            >
                              Restore
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(user.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No archived users found.</p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArchiveModal;