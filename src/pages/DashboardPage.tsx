// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Card, Button, Spinner, Alert, ListGroup, Row, Col } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Meeting } from '../types/models';
import { getMeetings, cancelMeeting, deleteMeeting } from '../services/meetingService';
import MeetingFormModal from '../components/MeetingFormModal';

// Importy dla React-Big-Calendar
import { Calendar, momentLocalizer, View } from 'react-big-calendar'; // Nadal potrzebujemy View
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Import niestandardowego paska narzędzi kalendarza
import CalendarToolbar from '../components/CalendarToolbar';

// Ustawienie lokalizatora dla kalendarza
const localizer = momentLocalizer(moment);

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Zmieniamy z powrotem typ na tylko 'View'
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>('month'); // Zmieniono typ z powrotem

  const fetchMeetings = useCallback(async () => {
    if (!currentUser) {
        setLoading(false);
        return;
    }
    setLoading(true);
    setError('');
    try {
      const userMeetings = await getMeetings(currentUser.uid, currentUser.role);
      userMeetings.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`);
        const dateB = new Date(`${b.date}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
      });
      setMeetings(userMeetings);
    } catch (err: any) {
      setError(`Błąd podczas ładowania spotkań: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleAddMeetingClick = () => {
    setEditingMeeting(null);
    setShowModal(true);
  };

  const handleEditMeetingClick = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setShowModal(true);
  };

  const handleCancelMeeting = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz anulować to spotkanie?')) {
      try {
        await cancelMeeting(id);
        fetchMeetings();
      } catch (err: any) {
        setError(`Błąd podczas anulowania spotkania: ${err.message}`);
      }
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz trwale usunąć to spotkanie? Tej operacji nie można cofnąć!')) {
      try {
        await deleteMeeting(id);
        fetchMeetings();
      } catch (err: any) {
        setError(`Błąd podczas usuwania spotkania: ${err.message}`);
      }
    }
  };

  const events = useMemo(() => {
    return meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title || 'Brak tytułu',
      start: new Date(`${meeting.date}T${meeting.startTime}`),
      end: new Date(`${meeting.date}T${meeting.endTime}`),
      allDay: false,
      resource: meeting,
      isCanceled: meeting.status === 'canceled'
    }));
  }, [meetings]);

  const eventPropGetter = useCallback((event: any) => {
    return {
      style: {
        backgroundColor: event.isCanceled ? '#dc3545' : '#0d6efd',
        textDecoration: event.isCanceled ? 'line-through' : 'none',
        color: 'white',
      },
    };
  }, []);

  const handleSelectEvent = useCallback((event: any) => {
    setEditingMeeting(event.resource);
    setShowModal(true);
  }, []);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Ładowanie spotkań...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
  }

  if (!currentUser) {
    return <Container className="mt-4"><Alert variant="info">Zaloguj się, aby zobaczyć swój Dashboard.</Alert></Container>;
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Moje Spotkania</h2>
          <div className="text-end mb-3">
            <Button variant="primary" onClick={handleAddMeetingClick}>
              Dodaj nowe spotkanie
            </Button>
          </div>

          {meetings.length === 0 && (
            <Alert variant="info" className="text-center">
              Nie masz jeszcze żadnych zaplanowanych spotkań. Dodaj pierwsze!
            </Alert>
          )}

          <h3 className="mb-3 mt-4">Kalendarz spotkań</h3>
          <div style={{ height: 600 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              selectable
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventPropGetter}
              date={date}
              view={view} // Zmieniono z powrotem na samo view
              onNavigate={setDate} // Wracamy do domyślnego onNavigate
              onView={newView => setView(newView)} // Wracamy do domyślnego onView
              components={{
                toolbar: CalendarToolbar,
              }}
              // Usuwamy 'year' z dostępnych widoków
              views={['month', 'week', 'day', 'agenda']}
            />
          </div>

          <h3 className="mb-3 mt-5">Moje zaplanowane spotkania (Lista)</h3>
          {meetings.length === 0 ? (
             <Alert variant="info" className="text-center">
               Brak spotkań do wyświetlenia na liście.
             </Alert>
          ) : (
            <ListGroup>
              {meetings.map((meeting) => (
                <ListGroup.Item key={meeting.id} className="mb-3 p-3"
                  style={{ backgroundColor: meeting.status === 'canceled' ? '#f8d7da' : '#e2e3e5' }}
                >
                  <Row className="align-items-center">
                    <Col md={8}>
                      <h5 className={meeting.status === 'canceled' ? 'text-decoration-line-through text-danger' : ''}>
                        {meeting.title}
                        {meeting.status === 'canceled' && <span className="ms-2 badge bg-danger">Anulowane</span>}
                      </h5>
                      <p><strong>Opis:</strong> {meeting.description}</p>
                      <p><strong>Data:</strong> {meeting.date} od {meeting.startTime} do {meeting.endTime}</p>
                      <p><strong>Uczestnicy:</strong> {meeting.participants.join(', ') || 'Brak'}</p>
                      <small className="text-muted">Utworzono: {meeting.createdAt?.toLocaleString()}</small>
                    </Col>
                    <Col md={4} className="text-md-end mt-2 mt-md-0">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        {meeting.status === 'scheduled' && (
                          <>
                            <Button variant="warning" size="sm" onClick={() => handleEditMeetingClick(meeting)}>
                              Edytuj
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleCancelMeeting(meeting.id)}>
                              Anuluj
                            </Button>
                          </>
                        )}
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteMeeting(meeting.id)}>
                          Usuń
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      <MeetingFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSuccess={fetchMeetings}
        editingMeeting={editingMeeting}
      />
    </Container>
  );
};

export default DashboardPage;