// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Spinner, Alert, Card, Button } from 'react-bootstrap';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, momentLocalizer, Event as BigCalendarBaseEvent, View, NavigateAction, ToolbarProps } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import MeetingFormModal from '../components/MeetingFormModal';
import CalendarToolbar from '../components/CalendarToolbar'; // Importujemy niestandardowy Toolbar
import { getMeetings, updateMeeting, deleteMeeting } from '../services/meetingService';
import { getAllUsers } from '../services/userService';

import { UserProfile, Meeting, CalendarEvent } from '../types/models';

const localizer = momentLocalizer(moment);

const DashboardPage: React.FC = () => {
  const { currentUser, loading: authLoading, displayRole } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // === PRZYWRÓCONE: Stany dla dynamicznej nawigacji i wyboru roku/widoku ===
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');
  const [agendaYear, setAgendaYear] = useState<number>(new Date().getFullYear());


  const fetchMeetings = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fetchedMeetings = await getMeetings(currentUser.id, currentUser.role, currentUser.email || undefined);
      setMeetings(fetchedMeetings);
    } catch (err: any) {
      console.error("Błąd podczas pobierania spotkań:", err);
      setError('Nie udało się pobrać spotkań: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const users = await getAllUsers();
      setAllUsers(users);
    } catch (err: any) {
      console.error("Błąd podczas pobierania wszystkich użytkowników:", err);
      setError('Nie udało się pobrać listy użytkowników: ' + err.message);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchMeetings();
      fetchAllUsers();
    }
  }, [currentUser, fetchMeetings, fetchAllUsers]);

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowMeetingModal(true);
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (window.confirm('Czy na pewno chcesz anulować to spotkanie?')) {
      try {
        await updateMeeting(meetingId, { status: 'canceled' });
        fetchMeetings();
        alert('Spotkanie anulowano!');
      } catch (err: any) {
        console.error("Błąd podczas anulowania spotkania:", err);
        alert('Nie udało się anulować spotkania: ' + err.message);
      }
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć to spotkanie? Tej operacji nie można cofnąć.')) {
      try {
        await deleteMeeting(meetingId);
        fetchMeetings();
        alert('Spotkanie usunięto!');
      } catch (err: any) {
        console.error("Błąd podczas usuwania spotkania:", err);
        alert('Nie udało się usunąć spotkania: ' + err.message);
      }
    }
  };

  const handleCloseMeetingModal = () => {
    setShowMeetingModal(false);
    setSelectedMeeting(null);
  };

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    if (!currentUser) {
      alert('Musisz być zalogowany, aby dodać spotkanie.');
      return;
    }
    // Usuwamy warunek na fixedYear
    const newMeeting: Meeting = {
      id: '',
      title: '',
      description: '',
      date: moment(start).format('YYYY-MM-DD'),
      startTime: moment(start).format('HH:mm'),
      endTime: moment(end).format('HH:mm'),
      participants: [currentUser.email || ''],
      createdBy: currentUser.id,
      status: 'scheduled',
      createdAt: new Date(),
    };
    setSelectedMeeting(newMeeting);
    setShowMeetingModal(true);
  }, [currentUser]);


  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (event.resource) {
      setSelectedMeeting(event.resource);
      setShowMeetingModal(true);
    }
  }, []);

  // === PRZYWRÓCONE: Funkcje nawigacyjne i zmiany widoku/roku ===
  const handleCalendarNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
    if (currentView === 'agenda') {
      setAgendaYear(newDate.getFullYear());
    }
  }, [currentView]);

  const handleCalendarViewChange = useCallback((newView: View) => {
    setCurrentView(newView);
    if (newView === 'agenda') {
      setCurrentDate(new Date(agendaYear, 0, 1));
    } else {
      setCurrentDate(new Date());
    }
  }, [agendaYear]);

  const handleAgendaYearChange = useCallback((year: number) => {
    setAgendaYear(year);
    setCurrentDate(new Date(year, 0, 1));
    setCurrentView('agenda');
  }, []);


  const calendarEvents: CalendarEvent[] = useMemo(() => {
    let filteredMeetings = meetings.filter(event => event.status === 'scheduled');

    // === PRZYWRÓCONE: Filtrowanie dla agendy na podstawie agendaYear ===
    if (currentView === 'agenda') {
      filteredMeetings = filteredMeetings.filter(meeting => {
        const meetingYear = moment(meeting.date).year();
        return meetingYear === agendaYear;
      });
    }

    return filteredMeetings.map((meeting) => ({
      id: meeting.id,
      title: `${meeting.title} (${meeting.creatorUsername || meeting.createdBy})`,
      start: new Date(`${meeting.date}T${meeting.startTime}`),
      end: new Date(`${meeting.date}T${meeting.endTime}`),
      allDay: false,
      resource: meeting,
    }));
  }, [meetings, currentView, agendaYear]); // Przywrócone zależności

  const renderMeetingCard = (meeting: Meeting, isCreator: boolean) => (
    <Card key={meeting.id} className="meeting-card mb-3">
      <Card.Body>
        <Card.Title>{meeting.title}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          {meeting.date} od {meeting.startTime} do {meeting.endTime}
        </Card.Subtitle>
        <Card.Text>
          Opis: {meeting.description} <br />
          Status: {meeting.status === 'scheduled' ? 'Zaplanowane' : 'Anulowane'} <br />
          Twórca: {meeting.creatorUsername || 'Nieznany Użytkownik'} <br />
          Uczestnicy: {meeting.participants.join(', ')}
        </Card.Text>
        <div className="d-flex gap-2">
          <Button variant="info" size="sm" onClick={() => handleEditMeeting(meeting)}>
            Edytuj
          </Button>
          {isCreator && meeting.status === 'scheduled' && (
            <Button variant="warning" size="sm" onClick={() => handleCancelMeeting(meeting.id)}>
              Anuluj
            </Button>
          )}
          {isCreator && (
            <Button variant="danger" size="sm" onClick={() => handleDeleteMeeting(meeting.id)}>
              Usuń
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );

  // === WERSJA PRZEDOSTATNIA: CustomToolbarRenderer z useCallback, przed returnami ===
  const CustomToolbarRenderer = useCallback((toolbarPropsFromRBC: ToolbarProps<CalendarEvent, object>) => {
    return (
      <CalendarToolbar
        {...toolbarPropsFromRBC} // Przekazujemy wszystkie standardowe propsy z react-big-calendar
        currentYear={agendaYear}     // Wstrzykujemy nasz customowy prop
        onYearChange={handleAgendaYearChange} // Wstrzykujemy nasz customowy prop
      />
    );
  }, [agendaYear, handleAgendaYearChange]); // Zależności dla useCallback

  if (authLoading || loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Ładowanie...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  const createdMeetings = meetings.filter(m => currentUser && m.createdBy === currentUser.id);
  const participatedMeetings = meetings.filter(m =>
    currentUser && m.participants.includes(currentUser.email || '') && m.createdBy !== currentUser.id
  );

  return (
    <Container className="mt-4">
      <h2>Panel użytkownika - Dashboard</h2>

      <Button variant="primary" onClick={() => setShowMeetingModal(true)} className="mb-4">
        Dodaj nowe spotkanie
      </Button>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Twój Kalendarz Spotkań</Card.Title>
          <div style={{ height: 600 }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              // === PRZYWRÓCONE: Dynamiczne widoki i nawigacja ===
              views={['month', 'week', 'day', 'agenda']}
              view={currentView}
              onView={handleCalendarViewChange}
              date={currentDate}
              onNavigate={handleCalendarNavigate}
              defaultView="month" // Przywracamy defaultView

              messages={{
                next: "Następny",
                previous: "Poprzedni",
                today: "Dziś",
                month: "Miesiąc",
                week: "Tydzień",
                day: "Dzień",
                agenda: "Agenda",
                date: "Data",
                time: "Godzina",
                event: "Wydarzenie",
                noEventsInRange: "Brak wydarzeń w tym zakresie."
              }}
              components={{
                toolbar: CustomToolbarRenderer, // Używamy naszej funkcji renderującej
              }}
            />
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Spotkania, które zorganizowałeś</Card.Title>
          {createdMeetings.length === 0 ? (
            <Alert variant="info">Nie zorganizowałeś jeszcze żadnych spotkań.</Alert>
          ) : (
            <div className="meeting-list">
              {createdMeetings.map((meeting) => renderMeetingCard(meeting, true))}
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Spotkania, w których uczestniczysz</Card.Title>
          {participatedMeetings.length === 0 ? (
            <Alert variant="info">Nie uczestniczysz w żadnych innych spotkaniach.</Alert>
          ) : (
            <div className="meeting-list">
              {participatedMeetings.map((meeting) => renderMeetingCard(meeting, false))}
            </div>
          )}
        </Card.Body>
      </Card>

      <MeetingFormModal
        show={showMeetingModal}
        onHide={handleCloseMeetingModal}
        onSuccess={fetchMeetings}
        meeting={selectedMeeting}
        creatorId={currentUser?.id || ''}
        creatorEmail={currentUser?.email || ''}
        allUsers={allUsers}
      />
    </Container>
  );
};

export default DashboardPage;