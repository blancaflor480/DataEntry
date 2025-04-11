import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Card, Badge, ProgressBar } from 'react-bootstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios'; // Add this import
import '../style/leavecalendarmodal.css';

  // Add this new component for the event details modal
  const EventDetailsModal = ({ event, show, onHide }) => {
    if (!event) return null;
  
    return (
      <Modal show={show} onHide={onHide} centered size="sm">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title as="h6">
            {event.isHoliday ? 'Holiday Details' : 'Leave Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            {event.isHoliday ? (
              // Holiday details
              <>
                <h6 className="fw-bold mb-3">{event.holidayName}</h6>
                {event.localName && (
                  <div className="mb-2">
                    <small className="text-muted">Local Name:</small>
                    <div className="fw-medium">{event.localName}</div>
                  </div>
                )}
                <div>
                  <small className="text-muted">Date:</small>
                  <div className="fw-medium">{event.startDate}</div>
                </div>
                <Badge bg="info" className="mt-2">Public Holiday</Badge>
              </>
            ) : (
              // Leave details
              <>
                <small className="text-muted">Employee Name:</small>
                <h6 className="fw-bold mb-3">{event.employee}</h6>
                <div className="d-flex flex-column gap-2">
                  <div>
                    <small className="text-muted">Leave Type:</small>
                    <div className="fw-medium">{event.leaveType}</div>
                  </div>
                  <div>
                    <small className="text-muted">Period:</small>
                    <div className="fw-medium">{event.startDate} - {event.endDate}</div>
                  </div>
                  <div>
                    <small className="text-muted">Status:</small>
                    <div>
                      <Badge bg={
                        event.status?.toLowerCase() === 'approved' ? 'success' :
                        event.status?.toLowerCase() === 'rejected' ? 'danger' :
                        'warning'
                      }>
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" size="sm" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };


const LeaveCalendarModal = ({ show, onHide, leaves, getEmployeeName }) => {
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loadingHolidays, setLoadingHolidays] = useState(false); // Add this
    const [holidays, setHolidays] = useState([]); // Add this
      const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    byType: {}
  });

  useEffect(() => {
    calculateSummary();
  }, [leaves]);

  const calculateSummary = () => {
    const stats = {
      total: leaves.length,
      approved: 0,
      pending: 0,
      rejected: 0,
      byType: {}
    };

    leaves.forEach(leave => {
      // Count by status
      switch(leave.status?.toLowerCase()) {
        case 'approved':
          stats.approved++;
          break;
        case 'rejected':
          stats.rejected++;
          break;
        default:
          stats.pending++;
      }

      // Count by type
      if (!stats.byType[leave.leave_type]) {
        stats.byType[leave.leave_type] = 1;
      } else {
        stats.byType[leave.leave_type]++;
      }
    });

    setSummary(stats);
  };

  // Add useEffect to fetch holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setLoadingHolidays(true);
        const response = await axios.get('http://localhost:5000/api/v1/holidays');
        setHolidays(response.data);
      } catch (error) {
        console.error('Error fetching holidays:', error);
      } finally {
        setLoadingHolidays(false);
      }
    };

    if (show) {
      fetchHolidays();
    }
  }, [show]);

  const events = leaves.map(leave => ({
    id: leave.leave_id,
    title: `${getEmployeeName(leave.employee_no)} - ${leave.leave_type}`,
    start: leave.start_date,
    end: new Date(new Date(leave.end_date).setDate(new Date(leave.end_date).getDate() + 1)),
    backgroundColor: getStatusColor(leave.status),
    borderColor: getStatusBorderColor(leave.status),
    textColor: '#ffffff',
    extendedProps: {
      employee_no: leave.employee_no,
      leave_type: leave.leave_type,
      status: leave.status
    }
  }));

  // Combine leaves and holidays
  const allEvents = [
    ...events,
    ...holidays
  ];

  function getStatusColor(status) {
    switch(status?.toLowerCase()) {
      case 'approved':
        return '#28a745'; // Slightly brighter green
      case 'rejected':
        return '#dc3545';
      default:
        return '#ffc107';
    }
  }

  function getStatusBorderColor(status) {
    switch(status?.toLowerCase()) {
      case 'approved':
        return '#218838';
      case 'rejected':
        return '#c82333';
      default:
        return '#e0a800';
    }
  }

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    if (event.extendedProps.type === 'holiday') {
        setSelectedEvent({
          employee: 'Holiday',
          leaveType: 'Public Holiday',
          status: 'Holiday',
          startDate: new Date(event.start).toLocaleDateString(),
          endDate: new Date(event.start).toLocaleDateString(),
          isHoliday: true,
          holidayName: event.title,
          localName: event.extendedProps.localName
        });
      } else {
        // Handle regular leave events
        setSelectedEvent({
          employee: getEmployeeName(event.extendedProps.employee_no),
          leaveType: event.extendedProps.leave_type,
          status: event.extendedProps.status,
          startDate: new Date(event.start).toLocaleDateString(),
          endDate: new Date(new Date(event.end).setDate(event.end.getDate() - 1)).toLocaleDateString(),
          isHoliday: false
        });
      }
    setShowEventModal(true);
  };

  const renderEventContent = (eventInfo) => {
    const event = eventInfo.event;
    
    if (event.extendedProps.type === 'holiday') {
      return (
        <div className="holiday-event">
          <div className="holiday-title">
            🎋 {event.title}
          </div>
        </div>
      );
    }
  
    return (
      <div className="leave-event">
        {eventInfo.event.title}
      </div>
    );
  };

  const getStatusPercentage = (status) => {
    if (summary.total === 0) return 0;
    return Math.round((summary[status] / summary.total) * 100);
  };
  
  return (
    <Modal show={show} onHide={onHide} size="xl" centered dialogClassName="calendar-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold text-primary">Leave Calendar</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-0">
        <Row className="mb-4 g-3">
          <Col md={4}>
            <Card className="summary-card h-100 border-0 shadow-sm">
              <Card.Header className="bg-primary text-white rounded-top">
                <h6 className="mb-0 fw-semibold">Leave Summary</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted">Total Leaves:</span>
                  <Badge pill bg="light" text="dark" className="fs-6">
                    {summary.total}
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small className="text-muted">Approved ({summary.approved})</small>
                    <small className="text-muted">{getStatusPercentage('approved')}%</small>
                  </div>
                  <ProgressBar now={getStatusPercentage('approved')} variant="success" className="rounded-pill" style={{ height: '8px' }} />
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small className="text-muted">Pending ({summary.pending})</small>
                    <small className="text-muted">{getStatusPercentage('pending')}%</small>
                  </div>
                  <ProgressBar now={getStatusPercentage('pending')} variant="warning" className="rounded-pill" style={{ height: '8px' }} />
                </div>
                
                <div className="mb-1">
                  <div className="d-flex justify-content-between mb-1">
                    <small className="text-muted">Rejected ({summary.rejected})</small>
                    <small className="text-muted">{getStatusPercentage('rejected')}%</small>
                  </div>
                  <ProgressBar now={getStatusPercentage('rejected')} variant="danger" className="rounded-pill" style={{ height: '8px' }} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={8}>
            <Card className="summary-card h-100 border-0 shadow-sm">
              <Card.Header className="bg-primary text-white rounded-top">
                <h6 className="mb-0 fw-semibold">Leave Types Distribution</h6>
              </Card.Header>
              <Card.Body>
                <Row className="g-2">
                  {Object.entries(summary.byType).map(([type, count]) => (
                    <Col md={6} key={type}>
                      <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                        <span className="fw-medium text-truncate">{type}</span>
                        <Badge pill bg="info" className="fs-6">
                          {count}
                        </Badge>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="calendar-legend mb-4">
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <div className="legend-item d-flex align-items-center">
              <span className="legend-color rounded-circle" style={{ backgroundColor: '#28a745' }}></span>
              <span className="ms-2 small fw-medium">Approved</span>
            </div>
            <div className="legend-item d-flex align-items-center">
              <span className="legend-color rounded-circle" style={{ backgroundColor: '#ffc107' }}></span>
              <span className="ms-2 small fw-medium">Pending</span>
            </div>
            <div className="legend-item d-flex align-items-center">
              <span className="legend-color rounded-circle" style={{ backgroundColor: '#dc3545' }}></span>
              <span className="ms-2 small fw-medium">Rejected</span>
            </div>
          </div>
        </div>

        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={allEvents}
            eventClick={handleEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek'
            }}
            height="650px"
            dayMaxEventRows={3}
            eventDisplay="block"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
            eventContent={renderEventContent}
          />
          
        </div>
        
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="outline-secondary" onClick={onHide} className="px-4">
          Close
        </Button>
      </Modal.Footer>
      
      <EventDetailsModal 
  show={showEventModal}
  onHide={() => setShowEventModal(false)}
  event={selectedEvent}
/>
    </Modal>
  );
};



// Add this inside the main Modal, just before the closing Modal.Footer

export default LeaveCalendarModal;