 // src/pages/MeetingListPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Spinner, Alert, Card, Button, Form, Row, Col } from 'react-bootstrap';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import moment from 'moment';
import { getMeetings, updateMeeting as updateMeetingService, deleteMeeting as deleteMeetingService } from '../services/meetingService';  

 
import { UserProfile, Meeting } from '../types/models';

interface UserMap {
  [key: string]: UserProfile;
}

const MeetingsListPage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByParticipant, setFilterByParticipant] = useState('');
  const [filterByStatus, setFilterByStatus] = useState<'all' | 'scheduled' | 'canceled'>('all');
  const [sortBy, setSortBy] = useState<'dateAsc' | 'dateDesc' | 'startTimeAsc' | 'startTimeDesc' | 'createdAtDesc' | 'createdAtAsc' | 'titleAsc'>('dateAsc');

  const fetchMeetings = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
       
      const fetchedMeetings = await getMeetings(undefined, currentUser.role);  
      setMeetings(fetchedMeetings);
    } catch (err: any) {
      console.error("Błąd podczas pobierania spotkań:", err);
      setError('Nie udało się pobrać spotkań: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchMeetings();
    }
  }, [currentUser, fetchMeetings]);

  const handleCancelMeeting = async (meetingId: string) => {
    if (window.confirm('Czy na pewno chcesz anulować to spotkanie?')) {
      try {
        await updateMeetingService(meetingId, { status: 'canceled' });
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
        await deleteMeetingService(meetingId);
        fetchMeetings();  
        alert('Spotkanie usunięto!');
      } catch (err: any) {
        console.error("Błąd podczas usuwania spotkania:", err);
        alert('Nie udało się usunąć spotkania: ' + err.message);
      }
    }
  };

  const filteredAndSortedMeetings = useMemo(() => {
    let filtered = meetings.filter((meeting) => {
      const matchesSearch = searchTerm === '' ||
        meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (meeting.creatorUsername || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesParticipant = filterByParticipant === '' ||
        meeting.participants.some(p => p.toLowerCase().includes(filterByParticipant.toLowerCase()));

      const matchesStatus = filterByStatus === 'all' || meeting.status === filterByStatus;

      return matchesSearch && matchesParticipant && matchesStatus;
    });

     
    if (currentUser && currentUser.role === 'user') {
        filtered = filtered.filter(m => m.participants.includes(currentUser.email || ''));
    }


    filtered.sort((a, b) => {
      if (sortBy === 'dateAsc') {
        const dateA = moment(`${a.date}T${a.startTime}`);
        const dateB = moment(`${b.date}T${b.startTime}`);
        return dateA.diff(dateB);
      }
      if (sortBy === 'dateDesc') {
        const dateA = moment(`${a.date}T${a.startTime}`);
        const dateB = moment(`${b.date}T${b.startTime}`);
        return dateB.diff(dateA);
      }
      if (sortBy === 'startTimeAsc') {
        return a.startTime.localeCompare(b.startTime);
      }
      if (sortBy === 'startTimeDesc') {
        return b.startTime.localeCompare(a.startTime);
      }
      if (sortBy === 'createdAtAsc') {
        const dateA = a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.getTime() || 0;
        return dateA - dateB;
      }
      if (sortBy === 'createdAtDesc') {
        const dateA = a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.getTime() || 0;
        return dateB - dateA;
      }
      if (sortBy === 'titleAsc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return filtered;
  }, [meetings, searchTerm, filterByParticipant, filterByStatus, sortBy, currentUser]);

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
          Twórca: {meeting.creatorUsername || meeting.createdBy} <br />
          Uczestnicy: {meeting.participants.join(', ')}
        </Card.Text>
        <div className="d-flex gap-2">
          {/* Edycja jest dostępna dla twórcy lub admina */}
          {(isCreator || currentUser?.role === 'admin') && (
            <Button variant="info" size="sm" onClick={() => { /* Implement if needed, current flow is via Dashboard/AdminPage modal */ }}>
              Edytuj
            </Button>
          )}
          {/* Anulowanie dostępne dla twórcy lub admina, jeśli spotkanie jest zaplanowane */}
          {(isCreator || currentUser?.role === 'admin') && meeting.status === 'scheduled' && (
            <Button variant="warning" size="sm" onClick={() => handleCancelMeeting(meeting.id)}>
              Anuluj
            </Button>
          )}
          {/* Usuwanie dostępne dla twórcy lub admina */}
          {(isCreator || currentUser?.role === 'admin') && (
            <Button variant="danger" size="sm" onClick={() => handleDeleteMeeting(meeting.id)}>
              Usuń
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );


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

  return (
    <Container className="mt-4">
      <h2>Lista Spotkań</h2>
      <p>Przeglądaj wszystkie spotkania.</p>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Filtruj i Sortuj Spotkania</Card.Title>
          <Form>
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="searchMeeting">
                  <Form.Label>Szukaj (tytuł, opis, twórca)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Wpisz słowo kluczowe"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="filterParticipant">
                  <Form.Label>Filtruj po uczestniku (email)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Email uczestnika"
                    value={filterByParticipant}
                    onChange={(e) => setFilterByParticipant(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="filterStatus">
                  <Form.Label>Filtruj po statusie</Form.Label>
                  <Form.Select
                    value={filterByStatus}
                    onChange={(e) => setFilterByStatus(e.target.value as 'all' | 'scheduled' | 'canceled')}
                  >
                    <option value="all">Wszystkie</option>
                    <option value="scheduled">Zaplanowane</option>
                    <option value="canceled">Anulowane</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="sortBy">
                  <Form.Label>Sortuj wg</Form.Label>
                  <Form.Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'dateAsc' | 'dateDesc' | 'startTimeAsc' | 'startTimeDesc' | 'createdAtDesc' | 'createdAtAsc' | 'titleAsc')}
                  >
                    <option value="dateAsc">Daty (najstarsze)</option>
                    <option value="dateDesc">Daty (najnowsze)</option>
                    <option value="startTimeAsc">Godziny rozpoczęcia (rosnąco)</option>
                    <option value="startTimeDesc">Godziny rozpoczęcia (malejąco)</option>
                    <option value="createdAtDesc">Czasu utworzenia (najnowsze)</option>
                    <option value="createdAtAsc">Czasu utworzenia (najstarsze)</option>
                    <option value="titleAsc">Tytułu (A-Z)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Wyniki wyszukiwania</Card.Title>
          {filteredAndSortedMeetings.length === 0 ? (
            <Alert variant="info">Brak spotkań spełniających wybrane kryteria.</Alert>
          ) : (
            <div className="meeting-list">
              {filteredAndSortedMeetings.map((meeting) => {
                const isCreator = currentUser?.id === meeting.createdBy;
                return renderMeetingCard(meeting, isCreator);
              })}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MeetingsListPage;