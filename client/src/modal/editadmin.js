import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { db } from "../firebase"; // Use 'db' instead of 'firestore'
import { doc, updateDoc} from "firebase/firestore";
import axios from "axios"; // For sending files to the backend

const EditAdminModal = ({ show, onHide, userToEdit, onEditAdmin }) => {
  const [formData, setFormData] = useState({
    profile: null,
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    role: "",
    email: "",
  });
  const [preview, setPreview] = useState(null); // For image preview
  const [errors, setErrors] = useState({}); // For validation errors

  // Pre-fill the form with the selected user's data
  useEffect(() => {
    if (userToEdit) {
      setFormData({
        profile: userToEdit.profile || null,
        firstName: userToEdit.firstName || "",
        middleName: userToEdit.middleName || "",
        lastName: userToEdit.lastName || "",
        gender: userToEdit.gender || "",
        role: userToEdit.role || "",
        email: userToEdit.email || "",
      });
      setPreview(userToEdit.profile || null);
    }
  }, [userToEdit]);


  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear errors when user types
    setErrors({ ...errors, [name]: "" });
  };

  // Handle profile image upload and preview
  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profile: file });
      setPreview(URL.createObjectURL(file)); // Generate preview URL
    }
  };

  // Validate form
  const validateForm = async () => {
    const newErrors = {};

    // First Name
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First Name is required.";
    }

    // Last Name
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last Name is required.";
    }

    // Gender
    if (!formData.gender) {
      newErrors.gender = "Gender is required.";
    }

    // Role
    if (!formData.role) {
      newErrors.role = "Role is required.";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (await validateForm()) {
      try {
        let profileUrl = formData.profile;

        // Upload profile image to backend if a new file is selected
        if (formData.profile instanceof File) {
          const formDataToSend = new FormData();
          formDataToSend.append("profile", formData.profile);

          try {
            const response = await axios.post("http://localhost:5000/upload", formDataToSend, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
            profileUrl = response.data.fileUrl;
          } catch (error) {
            console.error("Error uploading image to Google Drive:", error);
            alert("Failed to upload profile image. Please try again.");
            return; // Stop execution if image upload fails
          }
        }

        // Update user details in Firestore
        await updateDoc(doc(db, "admin", userToEdit.id), {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          gender: formData.gender,
          role: formData.role,
          email: formData.email,
          profile: profileUrl, // Store the Google Drive image URL
        });

        alert("Admin updated successfully!");
        onEditAdmin(); // Trigger re-fetch of users
        onHide(); // Close the modal
      } catch (error) {
        console.error("Error updating admin:", error);
        alert("Failed to update admin. Please try again.");
      }
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Admin Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Profile Image Upload and Preview */}
          <Form.Group controlId="formProfile" className="mb-3 text-center">
            {preview && (
              <div className="mb-3">
                <img
                  src={preview}
                  alt="Profile Preview"
                  style={{ width: "100px", height: "100px", borderRadius: "50%" }}
                />
              </div>
            )}
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleProfileChange}
              isInvalid={!!errors.profile}
            />
            {errors.profile && (
              <Form.Text className="text-danger">{errors.profile}</Form.Text>
            )}
          </Form.Group>

          {/* First Name, Middle Name, Last Name in One Row */}
          <Row className="mb-3">
            <Col>
              <Form.Group controlId="formFirstName">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter first name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  isInvalid={!!errors.firstName}
                />
                {errors.firstName && (
                  <Form.Text className="text-danger">{errors.firstName}</Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="formMiddleName">
                <Form.Label>Middle Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter middle name"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="formLastName">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter last name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  isInvalid={!!errors.lastName}
                />
                {errors.lastName && (
                  <Form.Text className="text-danger">{errors.lastName}</Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>

          {/* Gender */}
          <Form.Group controlId="formGender" className="mb-3">
            <Form.Label>Gender</Form.Label>
            <Form.Control
              as="select"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              isInvalid={!!errors.gender}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Form.Control>
            {errors.gender && (
              <Form.Text className="text-danger">{errors.gender}</Form.Text>
            )}
          </Form.Group>

          {/* Role */}
          <Form.Group controlId="formRole" className="mb-3">
            <Form.Label>Role</Form.Label>
            <Form.Control
              as="select"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              isInvalid={!!errors.role}
            >
              <option value="">Select Role</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
            </Form.Control>
            {errors.role && (
              <Form.Text className="text-danger">{errors.role}</Form.Text>
            )}
          </Form.Group>

          {/* Email */}
          <Form.Group controlId="formEmail" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              name="email"
              disabled
              value={formData.email}
              onChange={handleInputChange}
              isInvalid={!!errors.email}
            />
            {errors.email && (
              <Form.Text className="text-danger">{errors.email}</Form.Text>
            )}
          </Form.Group>

          {/* Submit Button (Centered) */}
          <div className="d-flex justify-content-center">
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditAdminModal;