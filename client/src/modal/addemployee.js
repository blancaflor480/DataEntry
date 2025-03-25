import React, { useState } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import "../style/accountmanager.css";
import axios from "axios";

const AddEmployeeModal = ({ show, onHide, onEmployeeAdded }) => {
    const [formData, setFormData] = useState({
      firstName: "",
      middleName: "",
      lastName: "",
      employeeNo: "",
      status: "Active",
      position: "",
      dateHire: "",
      endDate: "",
      footSize: "",
      weight: "",
      height: "",
      personalContact: "",
      personalEmail: "",
      corporateEmail: "",
      birthday: "",
      address: "",
      startingRate: "",
      currentMonthlyRate: "",
      currentDailyRate: "",
      bdoAccount: "",
      sssNumber: "",
      pagIbigNumber: "",
      philhealthNumber: "",
      tinNumber: "",
      joiningContract: null,
      probationContract: null,
      regularContract: null,
    });
  
    const [errors, setErrors] = useState({});
    // Use isSubmitting in the submit button to show loading state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState("");
  
    // Validation function
    const validateForm = () => {
      const newErrors = {};
      
      // Required fields validation
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!formData.employeeNo.trim()) newErrors.employeeNo = "Employee number is required";
      if (!formData.position.trim()) newErrors.position = "Position is required";
      if (!formData.dateHire) newErrors.dateHire = "Date hire is required";
      if (!formData.personalContact.trim()) newErrors.personalContact = "Personal contact is required";
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.personalEmail.trim()) {
        newErrors.personalEmail = "Personal email is required";
      } else if (!emailRegex.test(formData.personalEmail)) {
        newErrors.personalEmail = "Invalid email format";
      }
      
      if (!formData.corporateEmail.trim()) {
        newErrors.corporateEmail = "Corporate email is required";
      } else if (!emailRegex.test(formData.corporateEmail)) {
        newErrors.corporateEmail = "Invalid email format";
      }
      
      if (!formData.birthday) newErrors.birthday = "Birthday is required";
      if (!formData.address.trim()) newErrors.address = "Address is required";
      
      // Numeric validation
      if (!formData.startingRate.trim()) {
        newErrors.startingRate = "Starting rate is required";
      } else if (isNaN(parseFloat(formData.startingRate))) {
        newErrors.startingRate = "Must be a number";
      }
      
      if (!formData.currentMonthlyRate.trim()) {
        newErrors.currentMonthlyRate = "Monthly rate is required";
      } else if (isNaN(parseFloat(formData.currentMonthlyRate))) {
        newErrors.currentMonthlyRate = "Must be a number";
      }
      
      if (!formData.currentDailyRate.trim()) {
        newErrors.currentDailyRate = "Daily rate is required";
      } else if (isNaN(parseFloat(formData.currentDailyRate))) {
        newErrors.currentDailyRate = "Must be a number";
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
      
      // Clear error for this field when user starts typing
      if (errors[name]) {
        setErrors({ ...errors, [name]: null });
      }
    };
  
    const handleFileChange = (e) => {
      const { name, files } = e.target;
      setFormData({ ...formData, [name]: files[0] });
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Reset submission states
      setSubmitError("");
      setSubmitSuccess("");
      
      // Validate form
      if (!validateForm()) {
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        // Process file uploads first
        const fileUrls = {};
        
        // Upload joining contract if exists
        if (formData.joiningContract) {
          const joiningContractFormData = new FormData();
          joiningContractFormData.append("profile", formData.joiningContract);
          const joiningResponse = await axios.post("http://localhost:5000/upload", joiningContractFormData);
          fileUrls.joiningContractUrl = joiningResponse.data.fileUrl;
        }
        
        // Upload probation contract if exists
        if (formData.probationContract) {
          const probationContractFormData = new FormData();
          probationContractFormData.append("profile", formData.probationContract);
          const probationResponse = await axios.post("http://localhost:5000/upload", probationContractFormData);
          fileUrls.probationContractUrl = probationResponse.data.fileUrl;
        }
        
        // Upload regular contract if exists
        if (formData.regularContract) {
          const regularContractFormData = new FormData();
          regularContractFormData.append("profile", formData.regularContract);
          const regularResponse = await axios.post("http://localhost:5000/upload", regularContractFormData);
          fileUrls.regularContractUrl = regularResponse.data.fileUrl;
        }
        
        // Prepare data for submission to server
        const employeeData = {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          employeeNo: formData.employeeNo,
          status: formData.status,
          position: formData.position,
          dateHire: formData.dateHire,
          endDate: formData.endDate || null,
          footSize: formData.footSize,
          weight: formData.weight,
          height: formData.height,
          personalContact: formData.personalContact,
          personalEmail: formData.personalEmail,
          corporateEmail: formData.corporateEmail,
          birthday: formData.birthday,
          address: formData.address,
          startingRate: formData.startingRate,
          currentMonthlyRate: formData.currentMonthlyRate,
          currentDailyRate: formData.currentDailyRate,
          bdoAccount: formData.bdoAccount,
          sssNumber: formData.sssNumber,
          pagIbigNumber: formData.pagIbigNumber,
          philhealthNumber: formData.philhealthNumber,
          tinNumber: formData.tinNumber,
          ...fileUrls
        };
        
        // Submit employee data to server - but we don't need to store the response
        await axios.post("http://localhost:5000/employees", employeeData);
        
        setSubmitSuccess("Employee added successfully!");
        
        // Clear form after successful submission
        setFormData({
          firstName: "",
          middleName: "",
          lastName: "",
          employeeNo: "",
          status: "Active",
          position: "",
          dateHire: "",
          endDate: "",
          footSize: "",
          weight: "",
          height: "",
          personalContact: "",
          personalEmail: "",
          corporateEmail: "",
          birthday: "",
          address: "",
          startingRate: "",
          currentMonthlyRate: "",
          currentDailyRate: "",
          bdoAccount: "",
          sssNumber: "",
          pagIbigNumber: "",
          philhealthNumber: "",
          tinNumber: "",
          joiningContract: null,
          probationContract: null,
          regularContract: null,
        });
        
        // Notify parent component
        if (onEmployeeAdded) {
          onEmployeeAdded();
        }
        
        // Close modal after short delay
        setTimeout(() => {
          onHide();
        }, 1500);
        
      } catch (error) {
        console.error("Error submitting employee data:", error);
        setSubmitError(error.response?.data?.error || "Failed to add employee. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Data Entry Form</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {submitError && <Alert variant="danger">{submitError}</Alert>}
        {submitSuccess && <Alert variant="success">{submitSuccess}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          {/* PERSONAL INFORMATION */}
          <div className="border p-3 mb-3">
          <h5>PERSONAL INFORMATION</h5>
          <Row>
            <Col>
              <Form.Group controlId="firstName">
                <Form.Label>First Name <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  isInvalid={!!errors.firstName}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.firstName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="middleName">
                <Form.Label>Middle Name <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="lastName">
                <Form.Label>Last Name <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  isInvalid={!!errors.lastName}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.lastName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Row mt-2>
            <Col >
              <Form.Group controlId="employeeNo">
                <Form.Label className="mt-3" >Employee No. <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="employeeNo"
                  value={formData.employeeNo}
                  onChange={handleChange}
                  isInvalid={!!errors.employeeNo}
                  required
                />
                 <Form.Control.Feedback type="invalid">
                  {errors.employeeNo}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="status">
                <Form.Label className="mt-3">Status <span className="req">*</span></Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Regular">Regular</option>
                  <option value="Probation">Probation</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminate">Terminate</option>
                  <option value="Awol">AWOL</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="position">
                <Form.Label className="mt-3">Position <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  isInvalid={!!errors.position}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.position}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group controlId="dateHire">
                <Form.Label className="mt-3">Date Hire <span className="req">*</span></Form.Label>
                <Form.Control
                  type="date"
                  name="dateHire"
                  value={formData.dateHire}
                  onChange={handleChange}
                  isInvalid={!!errors.dateHire}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.dateHire}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="endDate">
                <Form.Label className="mt-3">End Date <span className="req">*</span></Form.Label>
                <Form.Control
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                 
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="footSize">
                <Form.Label className="mt-3">Foot Size <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="footSize"
                  value={formData.footSize}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group controlId="weight">
                <Form.Label className="mt-3">Weight <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="height">
                <Form.Label className="mt-3">Height <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
          </div>

          <div className="border p-3 mb-3">
          {/* CONTACT NUMBER */}
          <h5 className="mt-2">CONTACT NUMBER</h5>
          <Row>
            <Col>
              <Form.Group controlId="personalContact">
                <Form.Label>Personal Contact # <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="personalContact"
                  value={formData.personalContact}
                  onChange={handleChange}
                  isInvalid={!!errors.personalContact}
                  required
                />
                 <Form.Control.Feedback type="invalid">
                  {errors.personalContact}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="personalEmail">
                <Form.Label>Personal Email <span className="req">*</span></Form.Label>
                <Form.Control
                  type="email"
                  name="personalEmail"
                  value={formData.personalEmail}
                  onChange={handleChange}
                  isInvalid={!!errors.personalEmail}
                  required
                />
                 <Form.Control.Feedback type="invalid">
                  {errors.personalEmail}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="corporateEmail">
                <Form.Label>Corporate Email <span className="req">*</span></Form.Label>
                <Form.Control
                  type="email"
                  name="corporateEmail"
                  value={formData.corporateEmail}
                  onChange={handleChange}
                  isInvalid={!!errors.corporateEmail}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.corporateEmail}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group controlId="birthday">
                <Form.Label className="mt-3">Birthday <span className="req">*</span></Form.Label>
                <Form.Control
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  isInvalid={!!errors.birthday}
                  required
                />
                 <Form.Control.Feedback type="invalid">
                  {errors.birthday}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="address">
                <Form.Label className="mt-3">Address <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  isInvalid={!!errors.address}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.address}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          </div>

          <div className="border p-3 mb-3">
          {/* SALARY INFORMATION */}
          <h5 className="mt-2">SALARY INFORMATION</h5>
          <Row>
            <Col>
              <Form.Group controlId="startingRate">
                <Form.Label>Starting Rate <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="startingRate"
                  value={formData.startingRate}
                  onChange={handleChange}
                  isInvalid={!!errors.startingRate}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.startingRate}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="currentMonthlyRate">
                <Form.Label>Current Monthly Rate <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="currentMonthlyRate"
                  value={formData.currentMonthlyRate}
                  onChange={handleChange}
                  isInvalid={!!errors.currentMonthlyRate}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.currentMonthlyRate}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="currentDailyRate">
                <Form.Label>Current Daily Rate <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="currentDailyRate"
                  value={formData.currentDailyRate}
                  onChange={handleChange}
                  isInvalid={!!errors.currentDailyRate}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.currentDailyRate}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </div>

        <div className="border p-3 mb-3">
          {/* GOVERNMENT ID INFORMATION */}
          <h5 className="mt-2">GOVERNMENT ID INFORMATION</h5>
          <Row>
            <Col>
              <Form.Group controlId="bdoAccount">
                <Form.Label>BDO Account # <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="bdoAccount"
                  value={formData.bdoAccount}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="sssNumber">
                <Form.Label>SSS # <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="sssNumber"
                  value={formData.sssNumber}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="pagIbigNumber">
                <Form.Label>Pag-Ibig # <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="pagIbigNumber"
                  value={formData.pagIbigNumber}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group controlId="philhealthNumber">
                <Form.Label className="mt-3">Philhealth # <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="philhealthNumber"
                  value={formData.philhealthNumber}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="tinNumber">
                <Form.Label className="mt-3">TIN # <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="tinNumber"
                  value={formData.tinNumber}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </div>
       
          {/* CONTRACT FILES */}
          <div className="border p-3 mb-3">
          <h5 className="mt-2">CONTRACT FILES</h5>
          <Row>
            <Col>
              <Form.Group controlId="joiningContract">
                <Form.Label >Joining Contract <span className="req">*</span></Form.Label>
                <Form.Control
                  type="file"
                  name="joiningContract"
                  onChange={handleFileChange}
                />
              </Form.Group>
              <Form.Group controlId="probationContract">
                <Form.Label className="mt-3">Probation Contract <span className="req">*</span></Form.Label>
                <Form.Control
                  type="file"
                  name="probationContract"
                  onChange={handleFileChange}
                />
              </Form.Group>
              <Form.Group controlId="regularContract">
                <Form.Label className="mt-3">Regular Contract <span className="req">*</span></Form.Label>
                <Form.Control
                  type="file"
                  name="regularContract"
                  onChange={handleFileChange}
                />
              </Form.Group>
            </Col>
            
           
          </Row>
        </div>
          <div className="mt-4">
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddEmployeeModal;