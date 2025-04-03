import React, { useState, useEffect } from "react";
import { Modal, Button, Row, Col, Alert } from "react-bootstrap";
import "../style/accountmanager.css";
import axios from "axios";
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ViewEmployeeModal = ({ show, onHide, employeeToView }) => {
    const [employeeData, setEmployeeData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        employeeNo: "",
        birthday: "",
        address: "",
        status: "",
        position: "",
        dateHire: "",
        endDate: "",
        footSize: "",
        weight: "",
        height: "",
        personalContact: "",
        personalEmail: "",
        corporateEmail: "",
        startingRate: "",
        currentMonthlyRate: "",
        currentDailyRate: "",
        hoursRate: "",
        bdoAccount: "",
        sssNumber: "",
        pagIbigNumber: "",
        philhealthNumber: "",
        tinNumber: ""
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
                birthday: employeeToView.birthday || "",
                address: employeeToView.address || "N/A",
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
                startingRate: employeeToView.startingRate ? `₱${employeeToView.startingRate}` : "N/A",
                currentMonthlyRate: employeeToView.currentMonthlyRate ? `₱${employeeToView.currentMonthlyRate}` : "N/A",
                currentDailyRate: employeeToView.currentDailyRate ? `₱${employeeToView.currentDailyRate}` : "N/A",
                hoursRate: employeeToView.hoursRate ? `₱${employeeToView.hoursRate}` : "N/A",
                bdoAccount: employeeToView.bdoAccount || "N/A",
                sssNumber: employeeToView.sssNumber || "N/A",
                pagIbigNumber: employeeToView.pagIbigNumber || "N/A",
                philhealthNumber: employeeToView.philhealthNumber || "N/A",
                tinNumber: employeeToView.tinNumber || "N/A"
            });
            setLoading(false);
        }
    }, [employeeToView]);

    // Download as PDF
    const downloadAsPDF = () => {
        try {
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(18);
            doc.text(`EMPLOYEE'S 201 FILE`, 105, 15, { align: 'center' });
            
            // Add employee name
            doc.setFontSize(14);
            
            // Create data for the tables
            const personalInfo = [
                ['Full Name:', `${employeeData.firstName} ${employeeData.middleName} ${employeeData.lastName}`],
                ['Employee Number:', employeeData.employeeNo],
                ['Birthday:', formatDate(employeeData.birthday)],
                ['Address:', employeeData.address],
                ['Status:', employeeData.status],
                ['Position:', employeeData.position],
                ['Date Hired:', formatDate(employeeData.dateHire)],
                ['End Date:', formatDate(employeeData.endDate)],
                ['Foot Size:', employeeData.footSize],
                ['Weight:', employeeData.weight],
                ['Height:', employeeData.height]
            ];
            
            const contactInfo = [
                ['Personal Contact Number:', employeeData.personalContact],
                ['Personal Email:', employeeData.personalEmail],
                ['Corporate Email:', employeeData.corporateEmail]
            ];
            
            const salaryInfo = [
                ['Starting Rate:', employeeData.startingRate],
                ['Current Monthly Rate:', employeeData.currentMonthlyRate],
                ['Current Daily Rate:', employeeData.currentDailyRate],
                ['Hours Rate:', employeeData.hoursRate]
            ];
            
            const govtInfo = [
                ['BDO Account No.:', employeeData.bdoAccount],
                ['SSS No.:', employeeData.sssNumber],
                ['PAG-IBIG No.:', employeeData.pagIbigNumber],
                ['PHILHEALTH No.:', employeeData.philhealthNumber],
                ['TIN No.:', employeeData.tinNumber]
            ];
            
            // Add tables to PDF using the imported autoTable function
            autoTable(doc, {
                startY: 35,
                head: [['PERSONAL INFORMATION', '']],
                body: personalInfo,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                styles: { cellPadding: 5, fontSize: 10 }
            });
            
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 10,
                head: [['CONTACT INFORMATION', '']],
                body: contactInfo,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                styles: { cellPadding: 5, fontSize: 10 }
            });
            
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 10,
                head: [['SALARY INFORMATION', '']],
                body: salaryInfo,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                styles: { cellPadding: 5, fontSize: 10 }
            });
            
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 10,
                head: [['GOVERNMENT ID INFORMATION', '']],
                body: govtInfo,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                styles: { cellPadding: 5, fontSize: 10 }
            });
            
            // Save the PDF
            doc.save(`201_File_${employeeData.employeeNo}_${employeeData.lastName}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Error generating PDF. Please try again.");
        }
    };

    // Print function
    const handlePrint = () => {
        const printContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="text-align: center; margin-bottom: 5px;">EMPLOYEE'S 201 FILE</h1>
                
                <h3>PERSONAL INFORMATION</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="width: 30%; padding: 5px; border-bottom: 1px solid #ddd;"><strong>Full Name:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.firstName} ${employeeData.middleName} ${employeeData.lastName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>Employee Number:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.employeeNo}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>Birthday:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${formatDate(employeeData.birthday)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>Address:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.address}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>Status:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.status}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>Position:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.position}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>Date Hired:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${formatDate(employeeData.dateHire)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>End Date:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${formatDate(employeeData.endDate)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>Foot Size:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.footSize}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>Weight:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.weight}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>Height:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.height}</td>
                    </tr>
                </table>
                
                <h3 style="margin-top: 20px;">CONTACT INFORMATION</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="width: 30%; padding: 5px; border-bottom: 1px solid #ddd;"><strong>Personal Contact Number:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.personalContact}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>Personal Email:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.personalEmail}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>Corporate Email:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.corporateEmail}</td>
                    </tr>
                </table>
                
                <h3 style="margin-top: 20px;">SALARY INFORMATION</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="width: 30%; padding: 5px; border-bottom: 1px solid #ddd;"><strong>Starting Rate:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.startingRate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>Current Monthly Rate:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.currentMonthlyRate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>Current Daily Rate:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.currentDailyRate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>Current Daily Rate:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.hoursRate}</td>
                    </tr>
                </table>
                
                <h3 style="margin-top: 20px;">GOVERNMENT ID INFORMATION</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="width: 30%; padding: 5px; border-bottom: 1px solid #ddd;"><strong>BDO Account No.:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.bdoAccount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>SSS No.:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.sssNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>PAG-IBIG No.:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.pagIbigNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>PHILHEALTH No.:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.philhealthNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>TIN No.:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #ddd;">${employeeData.tinNumber}</td>
                    </tr>
                </table>
            </div>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.open();
        printWindow.document.write(`
            <html>
                <head>
                    <title>Employee 201 File - ${employeeData.employeeNo}</title>
                    <style>
                        @media print {
                            @page {
                                size: A4;
                                margin: 10mm;
                            }
                            body {
                                font-family: Arial, sans-serif;
                            }
                            h1, h2, h3 {
                                color: #333;
                            }
                            table {
                                width: 100%;
                                border-collapse: collapse;
                            }
                            td {
                                padding: 8px;
                                border-bottom: 1px solid #ddd;
                            }
                        }
                    </style>
                </head>
                <body onload="window.print();window.close()">
                    ${printContent}
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Employee's 201 File</Modal.Title>
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
                            <Button variant="primary" onClick={handlePrint}>
                                <i className="fas fa-print me-2"></i>Print
                            </Button>
                        </div>

                        {/* PERSONAL INFORMATION */}
                        <div className="border p-3 mb-3">
                            <h5>PERSONAL INFORMATION</h5>
                            <Row>
                                <Col md={6}>
                                    <p><strong>Full Name:</strong> {employeeData.firstName} {employeeData.middleName} {employeeData.lastName}</p>
                                </Col>
                                <Col md={6}>
                                    <p><strong>Employee Number:</strong> {employeeData.employeeNo}</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <p><strong>Birthday:</strong> {formatDate(employeeData.birthday)}</p>
                                </Col>
                                <Col md={6}>
                                    <p><strong>Address:</strong> {employeeData.address}</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={4}>
                                    <p><strong>Status:</strong> {employeeData.status}</p>
                                </Col>
                                <Col md={4}>
                                    <p><strong>Position:</strong> {employeeData.position}</p>
                                </Col>
                                <Col md={4}>
                                    <p><strong>Date Hired:</strong> {formatDate(employeeData.dateHire)}</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={4}>
                                    <p><strong>End Date:</strong> {formatDate(employeeData.endDate)}</p>
                                </Col>
                                <Col md={4}>
                                    <p><strong>Foot Size:</strong> {employeeData.footSize}</p>
                                </Col>
                                <Col md={4}>
                                    <p><strong>Weight:</strong> {employeeData.weight}</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={4}>
                                    <p><strong>Height:</strong> {employeeData.height}</p>
                                </Col>
                            </Row>
                        </div>

                        {/* CONTACT INFORMATION */}
                        <div className="border p-3 mb-3">
                            <h5>CONTACT INFORMATION</h5>
                            <Row>
                                <Col md={4}>
                                    <p><strong>Personal Contact Number:</strong> {employeeData.personalContact}</p>
                                </Col>
                                <Col md={4}>
                                    <p><strong>Personal Email:</strong> {employeeData.personalEmail}</p>
                                </Col>
                                <Col md={4}>
                                    <p><strong>Corporate Email:</strong> {employeeData.corporateEmail}</p>
                                </Col>
                            </Row>
                        </div>

                        {/* SALARY INFORMATION */}
                        <div className="border p-3 mb-3">
                            <h5>SALARY INFORMATION</h5>
                            <Row>
                                <Col md={4}>
                                    <p><strong>Starting Rate:</strong> {employeeData.startingRate}</p>
                                </Col>
                                <Col md={4}>
                                    <p><strong>Current Monthly Rate:</strong> {employeeData.currentMonthlyRate}</p>
                                </Col>
                                <Col md={4}>
                                    <p><strong>Current Daily Rate:</strong> {employeeData.currentDailyRate}</p>
                                </Col>
                                <Col md={4}>
                                    <p><strong>Hours Rate:</strong> {employeeData.hoursRate}</p>
                                </Col>
                            </Row>
                        </div>

                        {/* GOVERNMENT ID INFORMATION */}
                        <div className="border p-3">
                            <h5>GOVERNMENT ID INFORMATION</h5>
                            <Row>
                                <Col md={4}>
                                    <p><strong>BDO Account No.:</strong> {employeeData.bdoAccount}</p>
                                </Col>
                                <Col md={4}>
                                    <p><strong>SSS No.:</strong> {employeeData.sssNumber}</p>
                                </Col>
                                <Col md={4}>
                                    <p><strong>PAG-IBIG No.:</strong> {employeeData.pagIbigNumber}</p>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <p><strong>PHILHEALTH No.:</strong> {employeeData.philhealthNumber}</p>
                                </Col>
                                <Col md={6}>
                                    <p><strong>TIN No.:</strong> {employeeData.tinNumber}</p>
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