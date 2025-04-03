import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import "../style/accountmanager.css";
import axios from "axios";

const EditEmployeeModal = ({ show, onHide, employeeToEdit, onEmployeeUpdated }) => {
    const renderContractFileInfo = (contractUrl, contractFile, name) => {
        return (
            <div className="mt-2">
                {contractUrl && !contractFile && (
                    <div className="d-flex align-items-center">
                        <a 
                            href={contractUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="me-2 text-primary"
                        >
                            <i className="fas fa-file-pdf me-1"></i> View Current {name.replace('Contract', '')} Contract
                        </a>
                        <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => handleRemoveContract(name)}
                            className="ms-2"
                        >
                            <i className="fas fa-trash-alt"></i>
                        </Button>
                    </div>
                )}
                {contractFile && (
                    <div className="d-flex align-items-center mt-2">
                        <span className="text-success">
                            <i className="fas fa-file-upload me-1"></i> 
                            New file selected: {contractFile.name}
                        </span>
                        <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            onClick={() => handleRemoveNewFile(name)}
                            className="ms-2"
                        >
                            <i className="fas fa-times"></i>
                        </Button>
                    </div>
                )}
                {!contractUrl && !contractFile && (
                    <div className="text-muted">
                        <i className="fas fa-exclamation-circle me-1"></i> No file uploaded
                    </div>
                )}
            </div>
        );
    };

    const renderProfileImageInfo = () => {
      return (
          <div className="mt-2">
              {formData.profileImageUrl && !formData.profileImage && (
                  <div className="d-flex align-items-center">
                      <img 
                          src={formData.profileImageUrl} 
                          alt="Profile" 
                          className="me-2 rounded-circle"
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                      <a 
                          href={formData.profileImageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="me-2 text-primary"
                      >
                          View Current Profile Image
                      </a>
                      <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => handleRemoveProfileImage()}
                          className="ms-2"
                      >
                          <i className="fas fa-trash-alt"></i>
                      </Button>
                  </div>
              )}
              {formData.profileImage && (
                  <div className="d-flex align-items-center mt-2">
                      <span className="text-success">
                          <i className="fas fa-file-upload me-1"></i> 
                          New image selected: {formData.profileImage.name}
                      </span>
                      <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          onClick={() => handleRemoveNewProfileImage()}
                          className="ms-2"
                      >
                          <i className="fas fa-times"></i>
                      </Button>
                  </div>
              )}
              {!formData.profileImageUrl && !formData.profileImage && (
                  <div className="text-muted">
                      <i className="fas fa-exclamation-circle me-1"></i> No profile image uploaded
                  </div>
              )}
          </div>
      );
  };


  const handleRemoveProfileImage = () => {
    setFormData(prev => ({
        ...prev,
        profileImageUrl: "",
        profileImage: null
    }));
};

// Handle removing a newly selected profile image
const handleRemoveNewProfileImage = () => {
    setFormData(prev => ({
        ...prev,
        profileImage: null
    }));
};
    // Handle removing an existing contract URL
    const handleRemoveContract = (contractName) => {
        setFormData(prev => ({
            ...prev,
            [`${contractName}Url`]: "",
            [contractName]: null
        }));
    };

    // Handle removing a newly selected file
    const handleRemoveNewFile = (contractName) => {
        setFormData(prev => ({
            ...prev,
            [contractName]: null
        }));
    };
   
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
      joiningContractUrl: "",
      probationContractUrl: "",
      regularContractUrl: ""
    });
  
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState("");

    // Load employee data when modal opens or employeeToEdit changes
    useEffect(() => {
      if (employeeToEdit) {
        const formatDate = (dateString) => {
            if (!dateString) return "";
            return new Date(dateString).toISOString().split('T')[0];
          };
        setFormData({
          firstName: employeeToEdit.firstName || "",
          middleName: employeeToEdit.middleName || "",
          lastName: employeeToEdit.lastName || "",
          employeeNo: employeeToEdit.employeeNo || "",
          status: employeeToEdit.status || "Active",
          position: employeeToEdit.position || "",
          dateHire: formatDate(employeeToEdit.dateHire),
          endDate: formatDate(employeeToEdit.endDate),
          footSize: employeeToEdit.footSize || "",
          weight: employeeToEdit.weight || "",
          height: employeeToEdit.height || "",
          profileImage: null, // Reset profile image to allow re-upload
          profileImageUrl: employeeToEdit.profileImageUrl || "",
          personalContact: employeeToEdit.personalContact || "",
          personalEmail: employeeToEdit.personalEmail || "",
          corporateEmail: employeeToEdit.corporateEmail || "",
          birthday: formatDate(employeeToEdit.birthday),
          address: employeeToEdit.address || "",
          startingRate: employeeToEdit.startingRate || "",
          currentMonthlyRate: employeeToEdit.currentMonthlyRate || "",
          currentDailyRate: employeeToEdit.currentDailyRate || "",
          hoursRate: employeeToEdit.hoursRate || "",
          bdoAccount: employeeToEdit.bdoAccount || "",
          sssNumber: employeeToEdit.sssNumber || "",
          pagIbigNumber: employeeToEdit.pagIbigNumber || "",
          philhealthNumber: employeeToEdit.philhealthNumber || "",
          tinNumber: employeeToEdit.tinNumber || "",
          joiningContract: null,
          probationContract: null,
          regularContract: null,
          joiningContractUrl: employeeToEdit.joiningContractUrl || "",
          probationContractUrl: employeeToEdit.probationContractUrl || "",
          regularContractUrl: employeeToEdit.regularContractUrl || ""
        });
      }
    }, [employeeToEdit]);

    // Validation function (same as AddEmployeeModal)
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

      // ... (keep all other validation rules the same as AddEmployeeModal)
      
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

        // Upload joining contract if exists
        if (formData.joiningContract) {
            const joiningContractFormData = new FormData();
            joiningContractFormData.append("attachment", formData.joiningContract);
            const joiningResponse = await axios.post("http://localhost:5000/upload-attachment", joiningContractFormData);
            fileUrls.joiningContractUrl = joiningResponse.data.fileUrl;
          } else if (formData.joiningContractUrl) {
            // Use existing URL if no new file is uploaded
            fileUrls.joiningContractUrl = formData.joiningContractUrl;
          }
        
        // Upload probation contract if exists
        if (formData.probationContract) {
            const probationContractFormData = new FormData();
            probationContractFormData.append("attachment", formData.probationContract);
            const probationResponse = await axios.post("http://localhost:5000/upload-attachment", probationContractFormData);
            fileUrls.probationContractUrl = probationResponse.data.fileUrl;
          } else if (formData.probationContractUrl) {
            fileUrls.probationContractUrl = formData.probationContractUrl;
          }
        
        // Upload regular contract if exists
        if (formData.regularContract) {
            const regularContractFormData = new FormData();
            regularContractFormData.append("attachment", formData.regularContract);
            const regularResponse = await axios.post("http://localhost:5000/upload-attachment", regularContractFormData);
            fileUrls.regularContractUrl = regularResponse.data.fileUrl;
          } else if (formData.regularContractUrl) {
            fileUrls.regularContractUrl = formData.regularContractUrl;
          }

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
        } else if (formData.profileImageUrl) {
            // Use existing URL if no new file is uploaded
            fileUrls.profileImageUrl = formData.profileImageUrl;
        }
        // Prepare data for submission to server
        const employeeData = {
          id: employeeToEdit.id, // Include the employee ID for update
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
        
        // Update employee data instead of creating new
        await axios.put(`http://localhost:5000/employees/${employeeToEdit.id}`, employeeData);
        
        
        setSubmitSuccess("Employee updated successfully!");
        
        // Notify parent component
        if (onEmployeeUpdated) {
          onEmployeeUpdated();
        }
        
        // Close modal after short delay
        setTimeout(() => {
          onHide();
        }, 1500);
        
      } catch (error) {
        console.error("Error updating employee data:", error);
        setSubmitError(error.response?.data?.error || "Failed to update employee. Please try again.");
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
          <Modal.Title>Edit Employee</Modal.Title>
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
                        
                        <Form.Group controlId="profileImage">
                        <Form.Label className="mt-3">Profile Image <span className="req">*</span></Form.Label>
                        <Form.Control
                            type="file"
                            name="profileImage"
                            isInvalid={!!errors.profileImage}
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png"
                        />
                        {renderProfileImageInfo()}
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
                            {renderContractFileInfo(
                            formData.joiningContractUrl, 
                            formData.joiningContract, 
                            "joiningContract"
                            )}
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
                            {renderContractFileInfo(
                                formData.probationContractUrl, 
                                formData.probationContract, 
                                "probationContract"
                                )}
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
                            {renderContractFileInfo(
                            formData.regularContractUrl, 
                            formData.regularContract, 
                            "regularContract"
                            )}
                            <Form.Control.Feedback type="invalid">
                              {errors.regularContract}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        
                      </Row>
                    </div>

            <div className="mt-4">
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Employee"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    );
};

export default EditEmployeeModal;