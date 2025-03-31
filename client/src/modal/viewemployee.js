import React, { useState, useEffect } from "react";
import { Modal, Button, Row, Col, Alert } from "react-bootstrap";
import "../style/accountmanager.css";
import axios from "axios";
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ViewEmployeeModal = ({ show, onHide, employeeToView }) => {
    const [employeeData, setEmployeeData] = useState({
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
        joiningContractUrl: "",
        probationContractUrl: "",
        regularContractUrl: ""
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Load employee data when modal opens
    useEffect(() => {
        if (employeeToView) {
            setEmployeeData({
                firstName: employeeToView.firstName || "N/A",
                middleName: employeeToView.middleName || "N/A",
                lastName: employeeToView.lastName || "N/A",
                employeeNo: employeeToView.employeeNo || "N/A",
                status: employeeToView.status || "N/A",
                position: employeeToView.position || "N/A",
                dateHire: employeeToView.dateHire || "",
                endDate: employeeToView.endDate || "",
                footSize: employeeToView.footSize || "N/A",
                weight: employeeToView.weight || "N/A",
                height: employeeToView.height || "N/A",
                personalContact: employeeToView.personalContact || "N/A",
                personalEmail: employeeToView.personalEmail || "N/A",
                corporateEmail: employeeToView.corporateEmail || "N/A",
                birthday: employeeToView.birthday || "",
                address: employeeToView.address || "N/A",
                startingRate: employeeToView.startingRate ? `₱${employeeToView.startingRate}` : "N/A",
                currentMonthlyRate: employeeToView.currentMonthlyRate ? `₱${employeeToView.currentMonthlyRate}` : "N/A",
                currentDailyRate: employeeToView.currentDailyRate ? `₱${employeeToView.currentDailyRate}` : "N/A",
                bdoAccount: employeeToView.bdoAccount || "N/A",
                sssNumber: employeeToView.sssNumber || "N/A",
                pagIbigNumber: employeeToView.pagIbigNumber || "N/A",
                philhealthNumber: employeeToView.philhealthNumber || "N/A",
                tinNumber: employeeToView.tinNumber || "N/A",
                joiningContractUrl: employeeToView.joiningContractUrl || "",
                probationContractUrl: employeeToView.probationContractUrl || "",
                regularContractUrl: employeeToView.regularContractUrl || ""
            });
            setLoading(false);
        }
    }, [employeeToView]);

    // Download as PDF
    const downloadAsPDF = () => {
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(18);
        doc.text(`Employee Details: ${employeeData.firstName} ${employeeData.lastName}`, 14, 20);
        doc.setFontSize(12);
        
        // Create data for the table
        const data = [
            ['Employee Number', employeeData.employeeNo],
            ['Full Name', `${employeeData.firstName} ${employeeData.middleName} ${employeeData.lastName}`],
            ['Position', employeeData.position],
            ['Status', employeeData.status],
            ['Date Hired', formatDate(employeeData.dateHire)],
            ['End Date', formatDate(employeeData.endDate)],
            ['Birthday', formatDate(employeeData.birthday)],
            ['Address', employeeData.address],
            ['Personal Contact', employeeData.personalContact],
            ['Personal Email', employeeData.personalEmail],
            ['Corporate Email', employeeData.corporateEmail],
            ['Physical Attributes', `Height: ${employeeData.height}, Weight: ${employeeData.weight}, Foot Size: ${employeeData.footSize}`],
            ['Salary Information', `Starting Rate: ${employeeData.startingRate}, Monthly Rate: ${employeeData.currentMonthlyRate}, Daily Rate: ${employeeData.currentDailyRate}`],
            ['Government IDs', `SSS: ${employeeData.sssNumber}, Pag-IBIG: ${employeeData.pagIbigNumber}, PhilHealth: ${employeeData.philhealthNumber}, TIN: ${employeeData.tinNumber}, BDO: ${employeeData.bdoAccount}`]
        ];
        
        // Add table to PDF
        doc.autoTable({
            startY: 30,
            head: [['Field', 'Value']],
            body: data,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { cellPadding: 5, fontSize: 10 }
        });
        
        // Save the PDF
        doc.save(`Employee_${employeeData.employeeNo}_${employeeData.lastName}.pdf`);
    };

    // Download as DOC (simplified version using plain text)
    const downloadAsDOC = () => {
        const content = `
            Employee Details: ${employeeData.firstName} ${employeeData.lastName}
            ====================================================
            
            Employee Number: ${employeeData.employeeNo}
            Full Name: ${employeeData.firstName} ${employeeData.middleName} ${employeeData.lastName}
            Position: ${employeeData.position}
            Status: ${employeeData.status}
            Date Hired: ${formatDate(employeeData.dateHire)}
            End Date: ${formatDate(employeeData.endDate)}
            Birthday: ${formatDate(employeeData.birthday)}
            Address: ${employeeData.address}
            
            Contact Information:
            -------------------
            Personal Contact: ${employeeData.personalContact}
            Personal Email: ${employeeData.personalEmail}
            Corporate Email: ${employeeData.corporateEmail}
            
            Physical Attributes:
            --------------------
            Height: ${employeeData.height}
            Weight: ${employeeData.weight}
            Foot Size: ${employeeData.footSize}
            
            Salary Information:
            ------------------
            Starting Rate: ${employeeData.startingRate}
            Monthly Rate: ${employeeData.currentMonthlyRate}
            Daily Rate: ${employeeData.currentDailyRate}
            
            Government IDs:
            ---------------
            SSS: ${employeeData.sssNumber}
            Pag-IBIG: ${employeeData.pagIbigNumber}
            PhilHealth: ${employeeData.philhealthNumber}
            TIN: ${employeeData.tinNumber}
            BDO Account: ${employeeData.bdoAccount}
        `;
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `Employee_${employeeData.employeeNo}_${employeeData.lastName}.txt`);
    };

    // Render contract file links
    const renderContractFile = (url, label) => {
        if (!url) return null;
        
        return (
            <div className="mt-2">
                <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary"
                >
                    <i className="fas fa-file-pdf me-1"></i> View {label}
                </a>
            </div>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Employee Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : error ? (
                    <Alert variant="danger">{error}</Alert>
                ) : (
                    <div>
                        {/* Download buttons */}
                        <div className="d-flex justify-content-end mb-3">
                            <Button variant="danger" onClick={downloadAsPDF} className="me-2">
                                <i className="fas fa-file-pdf me-2"></i>Download as PDF
                            </Button>
                            <Button variant="primary" onClick={downloadAsDOC}>
                                <i className="fas fa-file-word me-2"></i>Download as DOC
                            </Button>
                        </div>

                        {/* PERSONAL INFORMATION */}
                        <div className="border p-3 mb-3">
                            <h5>PERSONAL INFORMATION</h5>
                            <Row>
                                <Col>
                                    <p><strong>First Name:</strong> {employeeData.firstName}</p>
                                </Col>
                                <Col>
                                    <p><strong>Middle Name:</strong> {employeeData.middleName}</p>
                                </Col>
                                <Col>
                                    <p><strong>Last Name:</strong> {employeeData.lastName}</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <p><strong>Employee No.:</strong> {employeeData.employeeNo}</p>
                                </Col>
                                <Col>
                                    <p><strong>Status:</strong> {employeeData.status}</p>
                                </Col>
                                <Col>
                                    <p><strong>Position:</strong> {employeeData.position}</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <p><strong>Date Hired:</strong> {formatDate(employeeData.dateHire)}</p>
                                </Col>
                                <Col>
                                    <p><strong>End Date:</strong> {formatDate(employeeData.endDate)}</p>
                                </Col>
                                <Col>
                                    <p><strong>Foot Size:</strong> {employeeData.footSize}</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <p><strong>Weight:</strong> {employeeData.weight}</p>
                                </Col>
                                <Col>
                                    <p><strong>Height:</strong> {employeeData.height}</p>
                                </Col>
                            </Row>
                        </div>

                        {/* CONTACT INFORMATION */}
                        <div className="border p-3 mb-3">
                            <h5>CONTACT INFORMATION</h5>
                            <Row>
                                <Col>
                                    <p><strong>Personal Contact #:</strong> {employeeData.personalContact}</p>
                                </Col>
                                <Col>
                                    <p><strong>Personal Email:</strong> {employeeData.personalEmail}</p>
                                </Col>
                                <Col>
                                    <p><strong>Corporate Email:</strong> {employeeData.corporateEmail}</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <p><strong>Birthday:</strong> {formatDate(employeeData.birthday)}</p>
                                </Col>
                                <Col>
                                    <p><strong>Address:</strong> {employeeData.address}</p>
                                </Col>
                            </Row>
                        </div>

                        {/* SALARY INFORMATION */}
                        <div className="border p-3 mb-3">
                            <h5>SALARY INFORMATION</h5>
                            <Row>
                                <Col>
                                    <p><strong>Starting Rate:</strong> {employeeData.startingRate}</p>
                                </Col>
                                <Col>
                                    <p><strong>Current Monthly Rate:</strong> {employeeData.currentMonthlyRate}</p>
                                </Col>
                                <Col>
                                    <p><strong>Current Daily Rate:</strong> {employeeData.currentDailyRate}</p>
                                </Col>
                            </Row>
                        </div>

                        {/* GOVERNMENT ID INFORMATION */}
                        <div className="border p-3 mb-3">
                            <h5>GOVERNMENT ID INFORMATION</h5>
                            <Row>
                                <Col>
                                    <p><strong>BDO Account #:</strong> {employeeData.bdoAccount}</p>
                                </Col>
                                <Col>
                                    <p><strong>SSS #:</strong> {employeeData.sssNumber}</p>
                                </Col>
                                <Col>
                                    <p><strong>Pag-Ibig #:</strong> {employeeData.pagIbigNumber}</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <p><strong>Philhealth #:</strong> {employeeData.philhealthNumber}</p>
                                </Col>
                                <Col>
                                    <p><strong>TIN #:</strong> {employeeData.tinNumber}</p>
                                </Col>
                            </Row>
                        </div>

                        {/* CONTRACT FILES */}
                        <div className="border p-3 mb-3">
                            <h5>CONTRACT FILES</h5>
                            <Row>
                                <Col>
                                    <p><strong>Joining Contract:</strong></p>
                                    {renderContractFile(employeeData.joiningContractUrl, "Joining Contract")}
                                </Col>
                                <Col>
                                    <p><strong>Probation Contract:</strong></p>
                                    {renderContractFile(employeeData.probationContractUrl, "Probation Contract")}
                                </Col>
                                <Col>
                                    <p><strong>Regular Contract:</strong></p>
                                    {renderContractFile(employeeData.regularContractUrl, "Regular Contract")}
                                </Col>
                            </Row>
                        </div>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ViewEmployeeModal;