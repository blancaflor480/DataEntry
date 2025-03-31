import React, { useState, useEffect } from "react";
import "../style/header.css";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const Header = ({ toggleSidebar, userEmail, userRole, handleLogout, userData }) => {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: ""
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch user data when modal opens
  useEffect(() => {
    const fetchUserData = async () => {
      if (showAccountModal) {
        setLoading(true);
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          
          if (user) {
            const userDoc = await getDoc(doc(db, "admin", user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setProfileData({
                firstName: data.firstName || "",
                middleName: data.middleName || "",
                lastName: data.lastName || "",
                gender: data.gender || ""
              });
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setMessage("Failed to load user data. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [showAccountModal]);

  // Handle profile input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
    setErrors({ ...errors, [name]: "" });
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
    setPasswordErrors({ ...passwordErrors, [name]: "" });
  };

  // Validate profile form
  const validateProfileForm = () => {
    const newErrors = {};
    if (!profileData.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!profileData.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!profileData.gender) newErrors.gender = "Gender is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const newErrors = {};
    if (!passwordData.currentPassword) newErrors.currentPassword = "Current password is required.";
    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required.";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters.";
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile update submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (validateProfileForm()) {
      try {
        // Update profile in Firestore
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (user) {
          await updateDoc(doc(db, "admin", user.uid), {
            firstName: profileData.firstName,
            middleName: profileData.middleName,
            lastName: profileData.lastName,
            gender: profileData.gender
          });
          
          setMessage("Profile updated successfully!");
          setTimeout(() => setMessage(""), 3000);
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        setMessage("Failed to update profile. Please try again.");
      }
    }
  };

  // Handle password change submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (validatePasswordForm()) {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        // Reauthenticate user
        const credential = EmailAuthProvider.credential(
          user.email,
          passwordData.currentPassword
        );
        
        await reauthenticateWithCredential(user, credential);
        
        // Update password
        await updatePassword(user, passwordData.newPassword);
        
        setMessage("Password changed successfully!");
        setTimeout(() => {
          setShowPasswordModal(false);
          setMessage("");
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }, 2000);
      } catch (error) {
        console.error("Error changing password:", error);
        setMessage(error.message);
      }
    }
  };

  return (
    <>
      <div className="header-right d-flex justify-content-between align-items-center p-3 bg-light border-bottom">
        {/* Sidebar Toggle Button */}
        <button onClick={toggleSidebar} className="sidebar-toggle btn">
          ☰
        </button>

        {/* User Info and Actions */}
        <div className="user-info-container d-flex align-items-center">
          <div className="user-info me-3">
            <span className="profile-name me-2">{userEmail}</span>
            <span className="profile-name me-2">|</span>
            <span className="profile-name me-2">{userRole}</span>
            <i className="icon fas fa-user-circle me-2"></i>
          </div>
          
          <div className="header-actions d-flex">
            <button 
              onClick={() => setShowAccountModal(true)} 
              className="btn btn-outline-secondary btn-sm me-2"
            >
              <i className="fas fa-cog me-1"></i> Settings
            </button>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">
              <i className="fas fa-sign-out-alt me-1"></i> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Account Settings Modal */}
      <Modal show={showAccountModal} onHide={() => setShowAccountModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Account Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading user data...</p>
            </div>
          ) : (
            <>
              {message && (
                <div className={`alert ${message.includes("success") ? "alert-success" : "alert-danger"}`}>
                  {message}
                </div>
              )}

              <div className="mb-4">
                <h5>User Information</h5>
                <p><strong>Email:</strong> {userEmail}</p>
                <p><strong>Role:</strong> {userRole}</p>
              </div>

              <h5 className="mb-3">Edit Profile</h5>
              <Form onSubmit={handleProfileSubmit}>
                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group controlId="formFirstName">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        isInvalid={!!errors.firstName}
                      />
                      {errors.firstName && (
                        <Form.Text className="text-danger">{errors.firstName}</Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="formMiddleName">
                      <Form.Label>Middle Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="middleName"
                        value={profileData.middleName}
                        onChange={handleProfileChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="formLastName">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        isInvalid={!!errors.lastName}
                      />
                      {errors.lastName && (
                        <Form.Text className="text-danger">{errors.lastName}</Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group controlId="formGender" className="mb-4">
                  <Form.Label>Gender</Form.Label>
                  <Form.Control
                    as="select"
                    name="gender"
                    value={profileData.gender}
                    onChange={handleProfileChange}
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

                <div className="d-flex justify-content-between">
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change Password
                  </Button>
                  <Button variant="primary" type="submit">
                    Save Profile Changes
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handlePasswordSubmit}>
            <Form.Group controlId="formCurrentPassword" className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter current password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                isInvalid={!!passwordErrors.currentPassword}
              />
              {passwordErrors.currentPassword && (
                <Form.Text className="text-danger">
                  {passwordErrors.currentPassword}
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group controlId="formNewPassword" className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter new password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                isInvalid={!!passwordErrors.newPassword}
              />
              {passwordErrors.newPassword && (
                <Form.Text className="text-danger">
                  {passwordErrors.newPassword}
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group controlId="formConfirmPassword" className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm new password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                isInvalid={!!passwordErrors.confirmPassword}
              />
              {passwordErrors.confirmPassword && (
                <Form.Text className="text-danger">
                  {passwordErrors.confirmPassword}
                </Form.Text>
              )}
            </Form.Group>

            {message && (
              <div className={`alert ${message.includes("success") ? "alert-success" : "alert-danger"}`}>
                {message}
              </div>
            )}

            <div className="d-flex justify-content-end">
              <Button variant="primary" type="submit">
                Change Password
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Header;