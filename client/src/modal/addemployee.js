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
      status: "Probation",
      position: "",
      dateHire: "",
      endDate: "",
      footSize: "",
      weight: "",
      height: "",
      profileImage: null,
      personalContact: "",
      personalEmail: "",
      corporateEmail: "",
      birthday: "",
      address: "",
      startingRate: "",
      currentMonthlyRate: "",
      currentDailyRate: "",
      hoursRate: "",
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
      
      // Name validation
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
      } else if (formData.firstName.trim().length < 2) {
        newErrors.firstName = "First name must be at least 2 characters";
      } else if (!/^[A-Za-z\s'-]+$/.test(formData.firstName.trim())) {
        newErrors.firstName = "First name can only contain letters, spaces, hyphens, and apostrophes";
      }

      if (formData.middleName && !/^[A-Za-z\s'-]*$/.test(formData.middleName.trim())) {
        newErrors.middleName = "Middle name can only contain letters, spaces, hyphens, and apostrophes";
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      } else if (formData.lastName.trim().length < 2) {
        newErrors.lastName = "Last name must be at least 2 characters";
      } else if (!/^[A-Za-z\s'-]+$/.test(formData.lastName.trim())) {
        newErrors.lastName = "Last name can only contain letters, spaces, hyphens, and apostrophes";
      }

      // Employee Number validation
      if (!formData.employeeNo.trim()) {
        newErrors.employeeNo = "Employee number is required";
      } else if (!/^[A-Z0-9-]+$/.test(formData.employeeNo.trim())) {
        newErrors.employeeNo = "Employee number can only contain uppercase letters, numbers, and hyphens";
      }

      // Position validation
      if (!formData.position.trim()) {
        newErrors.position = "Position is required";
      }

      // Date validations
      const today = new Date();
      const dateHire = new Date(formData.dateHire);
      const birthday = new Date(formData.birthday);

      if (!formData.dateHire) {
        newErrors.dateHire = "Date of hire is required";
      } else if (dateHire > today) {
        newErrors.dateHire = "Hire date cannot be in the future";
      }

      if (formData.endDate) {
        const endDate = new Date(formData.endDate);
        if (endDate < dateHire) {
          newErrors.endDate = "End date cannot be before hire date";
        }
      }

      if (!formData.birthday) {
        newErrors.birthday = "Birthday is required";
      } else if (birthday >= today) {
        newErrors.birthday = "Invalid birthday";
      } else {
        // Check age (optional, adjust as needed)
        const age = today.getFullYear() - birthday.getFullYear();
        if (age < 18 || age > 70) {
          newErrors.birthday = "Employee must be between 18 and 70 years old";
        }
      }

      // Contact validation
      if (!formData.personalContact.trim()) {
        newErrors.personalContact = "Personal contact is required";
      } else {
        // Remove all non-digit characters first
        const cleanNumber = formData.personalContact.replace(/\D/g, ''); 
        if (!/^(?:0|63|\+63)?9\d{9}$/.test(cleanNumber)) {
          newErrors.personalContact = "Invalid Philippine mobile number format (e.g. 09171234567, +639171234567)";
        }
      }

      // Email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!formData.personalEmail.trim()) {
        newErrors.personalEmail = "Personal email is required";
      } else if (!emailRegex.test(formData.personalEmail.trim())) {
        newErrors.personalEmail = "Invalid email format";
      }
      
      if (!formData.corporateEmail.trim()) {
        newErrors.corporateEmail = "Corporate email is required";
      } else if (!emailRegex.test(formData.corporateEmail.trim())) {
        newErrors.corporateEmail = "Invalid email format";
      } else if (formData.corporateEmail.trim().toLowerCase() === 
                 formData.personalEmail.trim().toLowerCase()) {
        newErrors.corporateEmail = "Corporate email cannot be the same as personal email";
        newErrors.personalEmail = "Personal email cannot be the same as corporate email";
      }

      // Address validation
      if (!formData.address.trim()) {
        newErrors.address = "Address is required";
      } else if (formData.address.trim().length < 10) {
        newErrors.address = "Address must be at least 10 characters";
      }

      
      // Numeric validations with range checks
      const validateNumericField = (fieldName, value, min, max, errorPrefix = '') => {
        if (!value.trim()) {
          newErrors[fieldName] = `${errorPrefix || fieldName} is required`;
        } else {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            newErrors[fieldName] = `${errorPrefix || fieldName} must be a number`;
          } else if (numValue < min || numValue > max) {
            newErrors[fieldName] = `${errorPrefix || fieldName} must be between ${min} and ${max}`;
          }
        }
      };

      // Add this to your validateForm function, before the setErrors(newErrors) line:

      validateNumericField('startingRate', formData.startingRate, 0, 1000000, 'Starting rate');
      validateNumericField('currentMonthlyRate', formData.currentMonthlyRate, 0, 1000000, 'Monthly rate');
      validateNumericField('currentDailyRate', formData.currentDailyRate, 0, 100000, 'Daily rate');
      validateNumericField('hoursRate', formData.hoursRate, 0, 100000, 'Hours rate');


// Government ID validations
      if (!formData.bdoAccount.trim()) {
        newErrors.bdoAccount = "BDO Account is required";
      } else if (!/^\d+$/.test(formData.bdoAccount.replace(/-/g, ''))) {
        newErrors.bdoAccount = "BDO Account must contain only numbers";
      } else if (formData.bdoAccount.replace(/-/g, '').length < 10) {
        newErrors.bdoAccount = "BDO Account must be at least 10 digits";
      }

      if (!formData.sssNumber.trim()) {
        newErrors.sssNumber = "SSS Number is required";
      } else if (!/^\d{2}-\d{7}-\d{1}$/.test(formData.sssNumber)) {
        newErrors.sssNumber = "SSS Number must be in format 00-0000000-0";
      }

      if (!formData.pagIbigNumber.trim()) {
        newErrors.pagIbigNumber = "Pag-Ibig Number is required";
      } else if (!/^\d{4}-\d{4}-\d{4}$/.test(formData.pagIbigNumber)) {
        newErrors.pagIbigNumber = "Pag-Ibig Number must be in format 0000-0000-0000";
      }

      if (!formData.philhealthNumber.trim()) {
        newErrors.philhealthNumber = "PhilHealth Number is required";
      } else if (!/^\d{2}-\d{9}-\d{1}$/.test(formData.philhealthNumber)) {
        newErrors.philhealthNumber = "PhilHealth Number must be in format 00-000000000-0";
      }

      if (!formData.tinNumber.trim()) {
        newErrors.tinNumber = "TIN Number is required";
      } else if (!/^\d{3}-\d{3}-\d{3}-\d{3}$/.test(formData.tinNumber)) {
        newErrors.tinNumber = "TIN Number must be in format 000-000-000-000";
      }

      // Optional physical attributes validation
      if (!formData.footSize.trim()) {
        newErrors.footSize = "Foot Size number is required";
      } else if (!/^[A-Z0-9-]+$/.test(formData.footSize.trim())) {
        newErrors.footSize = "Foot Size number can only contain!";
      }

      if (formData.weight.trim() && !/^\d+(\.\d+)?$/.test(formData.weight.trim())) {
        newErrors.weight = "Weight must be a number";
      }

      if (!formData.height.trim()) {
        newErrors.height = "Height is required";
      } else if (!/^\d+'\d{1,2}$/.test(formData.height.trim())) {
        newErrors.height = "Height must be in format like 5'8 or 6'0";
      }

      // File validations (optional)
      const validateFileSize = (file, maxSizeMB = 5) => {
        return file ? file.size <= maxSizeMB * 1024 * 1024 : true;
      };

      const validateFileType = (file, allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']) => {
        return file ? allowedTypes.includes(file.type) : true;
      };


      
      // File validations - make these required
    if (!formData.joiningContract) {
      newErrors.joiningContract = "Joining contract is required";
    } else {
      if (!validateFileSize(formData.joiningContract)) {
        newErrors.joiningContract = "Joining contract file must be less than 5MB";
      }
      if (!validateFileType(formData.joiningContract)) {
        newErrors.joiningContract = "Invalid file type. Please upload PDF, JPEG, or PNG";
      }
    }

    if (!formData.probationContract) {
      newErrors.probationContract = "Probation contract is required";
    } else {
      if (!validateFileSize(formData.probationContract)) {
        newErrors.probationContract = "Probation contract file must be less than 5MB";
      }
      if (!validateFileType(formData.probationContract)) {
        newErrors.probationContract = "Invalid file type. Please upload PDF, JPEG, or PNG";
      }
    }

    if (!formData.regularContract) {
      newErrors.regularContract = "Regular contract is required";
    } else {
      if (!validateFileSize(formData.regularContract)) {
        newErrors.regularContract = "Regular contract file must be less than 5MB";
      }
      if (!validateFileType(formData.regularContract)) {
        newErrors.regularContract = "Invalid file type. Please upload PDF, JPEG, or PNG";
      }
    }

    if (!formData.profileImage) {
      newErrors.profileImage = "Profile Image is required";
    } else {
      if (!validateFileSize(formData.profileImage)) {
        newErrors.profileImage = "Profile Image file must be less than 5MB";
      }
      if (!validateFileType(formData.profileImage)) {
        newErrors.profileImage = "Invalid file type. Please upload PDF, JPEG, or PNG";
      }
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

    const handleGovernmentID = (e) => {
      const { name, value } = e.target;
      const cleaned = value.replace(/\D/g, '');

      let formatted = cleaned;

      switch(name){
        case 'sssNumber' :
          if(cleaned.length > 2){
            formatted = `${cleaned.substring(0, 2)}-${cleaned.substring(2, 9)}`;
            if(cleaned.length > 9){
                formatted += `-${cleaned.substring(9, 10)}`;
            }
          }
          break;
        case 'pagIbigNumber':
          if(cleaned.length > 4){
            formatted = `${cleaned.substring(0, 4)}-${cleaned.substring(4, 8)}`;
            if(cleaned.length > 8){
                formatted += `-${cleaned.substring(8, 12)}`;
            }
          }
          break;
        case 'philhealthNumber':
          if(cleaned.length > 2){
            formatted = `${cleaned.substring(0, 2)}-${cleaned.substring(2, 11)}`;
            if(cleaned.length > 11){
                formatted += `-${cleaned.substring(11, 12)}`;
            }
          }
          break;
        case 'tinNumber':
            if(cleaned.length > 3){
              formatted = `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}`;
              if(cleaned.length > 6){
                  formatted += `-${cleaned.substring(6, 9)}`;
                  if(cleaned.length > 9){
                    formatted += `-${cleaned.substring(9, 12)}`;
                }
              }
            }
            break;
        case 'bdoAccount':
        if(cleaned.length > 4){
          formatted = `${cleaned.substring(0, 4)}-${cleaned.substring(4, 8)}`;
          if(cleaned.length > 8){
              formatted += `-${cleaned.substring(8, 12)}`;
          }
        }
        break;

        default:
          formatted = cleaned;
      }

      setFormData({ ...formData, [name] : formatted});
      // Clear error for this field when user starts typing
      if (errors[name]) {
        setErrors({ ...errors, [name]: null });
      }
    };

    const handleContact = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
      
      // Remove all non-digit characters
        const cleaned = value.replace(/\D/g, '');
        
        // Auto-format based on length
        let formatted = cleaned;
        if (cleaned.startsWith('63') && cleaned.length > 2) {
          formatted = `+63 ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
        } else if (cleaned.startsWith('0') && cleaned.length > 1) {
          formatted = `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
        }
        
        setFormData(prev => ({ ...prev, [name]: formatted }));

      // Clear error for this field when user starts typing
      if (errors[name]) {
        setErrors({ ...errors, [name]: null });
      }
    };
  
    const handleFileChange = (e) => {
      const { name, files } = e.target;
      setFormData({ ...formData, [name]: files[0] });

      if(errors[name]){
        setErrors({ ...errors, [name] : null });
      }
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();

      console.log("Form Data FULL:", JSON.stringify(formData, null, 2));
      console.log("Form Validation Errors:", errors);
      
      const isValid = validateForm();
      console.log("Is Form Valid:", isValid);
      // Reset submission states
      setSubmitError("");
      setSubmitSuccess("");
      
      // Validate form
      if (!validateForm()) {
        console.log("Validation Errors:", errors);
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        // Process file uploads first
        const fileUrls = {};
        if (Object.keys(errors).length > 0) {
          console.error("Form has validation errors:", errors);
          return;
        }

          // Enhanced validation logging
          const validationResult = validateForm();
          console.log("Validation Result:", validationResult);

        
        if (!validationResult) {
          console.error("Validation Failed Detailed Errors:", errors);
          return;
        }

         // Upload profile image first
      if (formData.profileImage) {
        const profileFormData = new FormData();
        profileFormData.append("profileImage", formData.profileImage);
        const profileResponse = await axios.post(
          "http://localhost:5000/upload-profile", 
          profileFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        fileUrls.profileImageUrl = profileResponse.data.fileUrl;
      }
        // Upload joining contract if exists
        if (formData.joiningContract) {
          const joiningContractFormData = new FormData();
          joiningContractFormData.append("attachment", formData.joiningContract);
          const joiningResponse = await axios.post("http://localhost:5000/upload-attachment", joiningContractFormData);
          fileUrls.joiningContractUrl = joiningResponse.data.fileUrl;
        }
        
        // Upload probation contract if exists
        if (formData.probationContract) {
          const probationContractFormData = new FormData();
          probationContractFormData.append("attachment", formData.probationContract);
          const probationResponse = await axios.post("http://localhost:5000/upload-attachment", probationContractFormData);
          fileUrls.probationContractUrl = probationResponse.data.fileUrl;
        }
        
        // Upload regular contract if exists
        if (formData.regularContract) {
          const regularContractFormData = new FormData();
          regularContractFormData.append("attachment", formData.regularContract);
          const regularResponse = await axios.post("http://localhost:5000/upload-attachment", regularContractFormData);
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
          hoursRate: formData.hoursRate,
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
          status: "Probation",
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
          hoursRate: "",
          bdoAccount: "",
          sssNumber: "",
          pagIbigNumber: "",
          philhealthNumber: "",
          tinNumber: "",
          joiningContract: null,
          probationContract: null,
          regularContract: null,
          profileImage: null,
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
        console.error("Complete Error Object:", error);
        console.error("Error Response:", error.response);
        console.error("Error Message:", error.message);
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
                  placeholder="ex: Juan"
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
                  placeholder="ex: Del"
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
                  placeholder="ex: Dela Cruz"
             
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
                  placeholder="ex: 101"
             
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
                  <option value="">Select Here</option>
                  <option value="Probation">Probation</option>
                  <option value="Active">Active</option>
                  <option value="Regular">Regular</option>
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
                <Form.Select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
		              isInvalid={!!errors.position}
                  required
                >
                  <option value="">Select Here</option>
                  <option value="Managing Director">Managing Director</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Excutive Secretary">Excutative Secretary</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Site Engineer">Site Engineer</option>
                  <option value="Site Production Super Visor">Site Production Super Visor</option>
                  <option value="Admin Staff">Admin Staff</option>
                  <option value="Head Office">Head Office</option>
                  <option value="Production Officers">Production Officers</option>
                  <option value="Purchasing">Purchasing</option>
                  <option value="Driver">Driver</option>
                  <option value="Helper">Helper</option>
                </Form.Select>
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
                  isInvalid={!!errors.footSize}
                  onChange={handleChange}
                  placeholder="ex: 9 or 10"
             
                />
                <Form.Control.Feedback type="invalid">
                  {errors.footSize}
                </Form.Control.Feedback>
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
                  isInvalid={!!errors.weight}
                  placeholder="ex: 100"
                />
                 <Form.Control.Feedback type="invalid">
                  {errors.weight}
                </Form.Control.Feedback>
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
                  isInvalid={!!errors.height}
                  placeholder="ex: 5'7"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.height}
                </Form.Control.Feedback>
              </Form.Group>

              
            </Col>
            <Form.Group controlId="profileImage ">
                <Form.Label className="mt-3">Profile Image <span className="req">*</span></Form.Label>
                <Form.Control
                  type="file"
                  name="profileImage"
                  isInvalid={!!errors.profileImage}
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.profileImage}
                </Form.Control.Feedback>
              </Form.Group>
              
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
                  onChange={handleContact}
                  isInvalid={!!errors.personalContact}
                  placeholder="+63 917 123 4567"
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
                  placeholder="ex: JuanDelaCruz@gmail.com"
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
                  placeholder="ex: JuanDelaCruz@matlex.com"
                
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
                  placeholder="ex: Brgy. Tambo, St.John 139 Street., San Juan, Manila "
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
                  placeholder="ex: 8000"
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
                  placeholder="ex: 18000"          
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
                  placeholder="ex: 750"  
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.currentDailyRate}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="hoursRate">
                <Form.Label>Hours Rate <span className="req">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="hoursRate"
                  value={formData.hoursRate}
                  onChange={handleChange}
                  isInvalid={!!errors.hoursRate}
                  placeholder="ex: 100"  
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.hoursRate}
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
          onChange={handleGovernmentID}
          isInvalid={!!errors.bdoAccount}
          placeholder="ex: 1111-2222-3333"  
          maxLength={14} // Adjust as needed
        />
         <Form.Control.Feedback type="invalid">
                  {errors.bdoAccount}
                </Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col>
      <Form.Group controlId="sssNumber">
        <Form.Label>SSS # <span className="req">*</span></Form.Label>
        <Form.Control
          type="text"
          name="sssNumber"
          value={formData.sssNumber}
          isInvalid={!!errors.sssNumber}
          placeholder="ex: 11-2222222-3"  
          onChange={handleGovernmentID}
          maxLength={12} // 2 + 7 + 1 + 2 hyphens
        />
        <Form.Control.Feedback type="invalid">
                  {errors.sssNumber}
                </Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col>
      <Form.Group controlId="pagIbigNumber">
        <Form.Label>Pag-Ibig # <span className="req">*</span></Form.Label>
        <Form.Control
          type="text"
          name="pagIbigNumber"
          value={formData.pagIbigNumber}
          isInvalid={!!errors.pagIbigNumber}
          placeholder="ex: 1111-2222-3333"  
          
          onChange={handleGovernmentID}
          maxLength={14} // 4 + 4 + 4 + 2 hyphens
        />
        <Form.Control.Feedback type="invalid">
                  {errors.pagIbigNumber}
                </Form.Control.Feedback>
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
          isInvalid={!!errors.philhealthNumber}
          placeholder="ex: 11-222222222-3333"  
          
          onChange={handleGovernmentID}
          maxLength={14} // 2 + 9 + 1 + 2 hyphens
        />
        <Form.Control.Feedback type="invalid">
                  {errors.philhealthNumber}
                </Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col>
      <Form.Group controlId="tinNumber">
        <Form.Label className="mt-3">TIN # <span className="req">*</span></Form.Label>
        <Form.Control
          type="text"
          name="tinNumber"
          value={formData.tinNumber}
          isInvalid={!!errors.tinNumber}
          onChange={handleGovernmentID}
          placeholder="ex: 111-222-333-444"           
          maxLength={15} // 3 + 3 + 3 + 3 + 3 hyphens
        />
          <Form.Control.Feedback type="invalid">
                  {errors.tinNumber}
                </Form.Control.Feedback>
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
                  isInvalid={!!errors.joiningContract}
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.joiningContract}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group controlId="probationContract">
                <Form.Label className="mt-3">Probation Contract <span className="req">*</span></Form.Label>
                <Form.Control
                  type="file"
                  name="probationContract"
                  isInvalid={!!errors.probationContract}
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.probationContract}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group controlId="regularContract">
                <Form.Label className="mt-3">Regular Contract <span className="req">*</span></Form.Label>
                <Form.Control
                  type="file"
                  name="regularContract"
                  isInvalid={!!errors.regularContract}
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.regularContract}
                </Form.Control.Feedback>
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