// src/pages/AdminPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Card, Button, Spinner, Alert, ListGroup, Row, Col, Tabs, Tab } from 'react-bootstrap'; // Dodano Tabs, Tab
import { useAuth } from '../contexts/AuthContext';
import { Meeting } from '../types/models';
import { getMeetings, cancelMeeting, deleteMeeting, updateMeeting } from '../services/meetingService';
import MeetingFormModal from '../components/MeetingFormModal';

// Importy dla React-Big-Calendar
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Import niestandardowego paska narzędzi kalendarza
import CalendarToolbar from '../components/CalendarToolbar';

// Importuj Firebase Firestore (nadal potrzebne do pobierania nazw twórców spotkań)
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

// NOWY IMPORT: Komponent do zarządzania użytkownikami
import UserManagementSection from '../components/UserManagementSection';


const localizer = momentLocalizer(moment);

const AdminPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Dodajemy nowy stan do przechowywania mapowania ID użytkownika na jego nazwę
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>('month');

  // NOWY STAN: Do zarządzania aktywną zakładką
  const [key, setKey] = useState<string>('meetings'); // 'meetings' lub 'users'

  // Funkcja do pobierania nazwy użytkownika na podstawie ID
  const fetchUserName = useCallback(async (userId: string): Promise<string> => {
    // Sprawdź, czy nazwa jest już w cache
    if (userNames[userId]) {
      return userNames[userId];
    }
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userName = userData.username || userId;
        setUserNames(prevNames => ({ ...prevNames, [userId]: userName }));
        return userName;
      } else {
        return userId;
      }
    } catch (err) {
      console.error(`Błąd podczas pobierania nazwy użytkownika ${userId}:`, err);
      return userId;
    }
  }, [userNames]);

  const fetchAllMeetings = useCallback(async () => {
    if (currentUser?.role !== 'admin') {
      setError('Brak uprawnień administratora.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const allMeetings = await getMeetings(undefined, 'admin');
      allMeetings.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`);
        const dateB = new Date(`${b.date}T${b.endTime}`);
        return dateA.getTime() - dateB.getTime();
      });
      setMeetings(allMeetings);

      const uniqueCreatorIds = Array.from(new Set(allMeetings.map(m => m.createdBy).filter(Boolean) as string[]));
      const namesToFetch = uniqueCreatorIds.filter(id => !userNames[id]);
      
      if (namesToFetch.length > 0) {
          const fetchedNames: Record<string, string> = {};
          await Promise.all(namesToFetch.map(async (id) => {
              fetchedNames[id] = await fetchUserName(id);
          }));
          setUserNames(prevNames => ({ ...prevNames, ...fetchedNames }));
      }

    } catch (err: any) {
      setError(`Błąd podczas ładowania spotkań: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentUser, fetchUserName, userNames]);

  useEffect(() => {
    // Ładuj spotkania tylko jeśli aktywna zakładka to 'meetings'
    if (key === 'meetings') {
      fetchAllMeetings();
    }
  }, [fetchAllMeetings, key]); // Dodaj 'key' do zależności

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
        fetchAllMeetings();
      } catch (err: any) {
        setError(`Błąd podczas anulowania spotkania: ${err.message}`);
      }
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz trwale usunąć to spotkanie? Tej operacji nie można cofnąć!')) {
      try {
        await deleteMeeting(id);
        fetchAllMeetings();
      } catch (err: any) {
        setError(`Błąd podczas usuwania spotkania: ${err.message}`);
      }
    }
  };

  const handleToggleMeetingStatus = async (meeting: Meeting) => {
    try {
      const newStatus = meeting.status === 'scheduled' ? 'canceled' : 'scheduled';
      await updateMeeting(meeting.id, { status: newStatus });
      fetchAllMeetings();
    } catch (err: any) {
      setError(`Błąd podczas zmiany statusu spotkania: ${err.message}`);
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

  if (loading && key === 'meetings') { // Tylko jeśli ładujemy spotkania
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

  if (currentUser?.role !== 'admin') {
    return (
      <Container className="mt-4">
        <Alert variant="danger" className="text-center">Brak uprawnień. Ta strona jest tylko dla administratorów.</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Panel Administratora</h2>

          <Tabs
            id="admin-tabs"
            activeKey={key}
            onSelect={(k) => setKey(k || 'meetings')} // Domyślnie 'meetings' jeśli k jest null/undefined
            className="mb-3"
          >
            <Tab eventKey="meetings" title="Zarządzaj Spotkaniami">
              {/* Sekcja zarządzania spotkaniami */}
              <div className="text-end mb-3">
                <Button variant="primary" onClick={handleAddMeetingClick}>
                  Dodaj nowe spotkanie (Jako Admin)
                </Button>
              </div>

              {meetings.length === 0 && (
                <Alert variant="info" className="text-center">
                  Brak zaplanowanych spotkań w systemie.
                </Alert>
              )}

              <h3 className="mb-3 mt-4">Kalendarz wszystkich spotkań</h3>
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
                  view={view}
                  onNavigate={setDate}
                  onView={newView => setView(newView)}
                  components={{
                    toolbar: CalendarToolbar,
                  }}
                  views={['month', 'week', 'day', 'agenda']}
                />
              </div>

              <h3 className="mb-3 mt-5">Wszystkie spotkania w systemie</h3>
              {meetings.length === 0 ? (
                <Alert variant="info" className="text-center">
                  Brak spotkań do wyświetlenia.
                </Alert>
              ) : (
                <ListGroup>
                  {meetings.map((meeting) => (
                    <ListGroup.Item key={meeting.id} className="mb-3 p-3"
                      style={{ backgroundColor: meeting.status === 'canceled' ? '#f8d7da' : '#e2e3e5' }}
                    >
                      <Row className="align-items-center">
                        <Col md={7}>
                          <h5 className={meeting.status === 'canceled' ? 'text-decoration-line-through text-danger' : ''}>
                            {meeting.title}
                            {meeting.status === 'canceled' && <span className="ms-2 badge bg-danger">Anulowane</span>}
                          </h5>
                          <p><strong>Opis:</strong> {meeting.description}</p>
                          <p><strong>Data:</strong> {meeting.date} od {meeting.startTime} do {meeting.endTime}</p>
                          <p><strong>Uczestnicy:</strong> {meeting.participants.join(', ') || 'Brak'}</p>
                          <p><strong>Utworzył(a):</strong> {userNames[meeting.createdBy] || meeting.createdBy || 'Nieznany użytkownik'}</p>
                          <small className="text-muted">Utworzono: {meeting.createdAt?.toLocaleString()}</small>
                        </Col>
                        <Col md={5} className="text-md-end mt-2 mt-md-0">
                          <div className="d-flex flex-wrap justify-content-end gap-2">
                            {meeting.status === 'scheduled' && (
                              <Button variant="warning" size="sm" onClick={() => handleEditMeetingClick(meeting)}>
                                Edytuj
                              </Button>
                            )}
                            <Button
                              variant={meeting.status === 'scheduled' ? 'danger' : 'success'}
                              size="sm"
                              onClick={() => handleToggleMeetingStatus(meeting)}
                            >
                              {meeting.status === 'scheduled' ? 'Anuluj' : 'Przywróć'}
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteMeeting(meeting.id)}>
                              Usuń trwale
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Tab>

            <Tab eventKey="users" title="Zarządzaj Użytkownikami">
              {/* NOWA SEKACJA: Komponent do zarządzania użytkownikami */}
              <UserManagementSection />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      <MeetingFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSuccess={fetchAllMeetings} // Po zamknięciu modalu spotkań, odśwież spotkania
        editingMeeting={editingMeeting}
      />
    </Container>
  );
};

export default AdminPage;