 
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Spinner, Alert, Table, Button, Form, Card } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import MeetingFormModal from '../components/MeetingFormModal';
import { getMeetings, updateMeeting as updateMeetingService, deleteMeeting as deleteMeetingService } from '../services/meetingService';
import { getAllUsers, updateUserProfile, deleteUserProfile } from '../services/userService';


import { UserProfile, Meeting } from '../types/models';

const AdminPage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error("Błąd podczas pobierania użytkowników:", err);
      setError('Nie udało się pobrać listy użytkowników: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllMeetings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedMeetings = await getMeetings(undefined, 'admin');
      setMeetings(fetchedMeetings);
    } catch (err: any) {
      console.error("Błąd podczas pobierania spotkań:", err);
      setError('Nie udało się pobrać spotkań: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      fetchAllUsers();
      fetchAllMeetings();
    } else if (!authLoading && currentUser && currentUser.role !== 'admin') {
      setError('Brak uprawnień administratora.');
      setLoading(false);
    }
  }, [currentUser, authLoading, fetchAllUsers, fetchAllMeetings]);

  const handleChangeRole = useCallback(async (userId: string, currentRole: 'user' | 'admin') => {
    if (!window.confirm(`Czy na pewno chcesz zmienić rolę użytkownika na ${currentRole === 'admin' ? 'Użytkownik' : 'Administrator'}?`)) {
      return;
    }
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateUserProfile(userId, { role: newRole });
      fetchAllUsers();
      alert(`Rola użytkownika ${userId} zmieniona na ${newRole}.`);
    } catch (err: any) {
      console.error("Błąd podczas zmiany roli:", err);
      setError('Nie udało się zmienić roli użytkownika: ' + err.message);
    }
  }, [fetchAllUsers]);

  const handleDeleteUser = useCallback(async (userId: string, userEmail: string | null) => {
    if (currentUser?.id === userId) {
      alert('Nie możesz usunąć własnego konta z poziomu panelu administratora.');
      return;
    }
    if (window.confirm(`Czy na pewno chcesz usunąć użytkownika ${userEmail}? Spowoduje to usunięcie jego profilu, ale konto Firebase Auth pozostanie.`)) {
      try {
        await deleteUserProfile(userId);
        fetchAllUsers();
        alert(`Użytkownik ${userEmail} został usunięty.`);
      } catch (err: any) {
        console.error("Błąd podczas usuwania użytkownika:", err);
        setError('Nie udało się usunąć użytkownika: ' + err.message);
      }
    }
  }, [currentUser, fetchAllUsers]);

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowModal(true);
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (window.confirm('Czy na pewno chcesz anulować to spotkanie?')) {
      try {
        await updateMeetingService(meetingId, { status: 'canceled' });
        fetchAllMeetings();
        alert('Spotkanie anulowano!');
      } catch (err: any) {
        console.error("Błąd podczas anulowania spotkania:", err);
        setError('Nie udało się anulować spotkania: ' + err.message);
      }
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć to spotkanie? Tej operacji nie można cofnąć.')) {
      try {
        await deleteMeetingService(meetingId);
        fetchAllMeetings();
        alert('Spotkanie usunięto!');
      } catch (err: any) {
        console.error("Błąd podczas usuwania spotkania:", err);
        setError('Nie udało się usunąć spotkania: ' + err.message);
      }
    }
  };

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

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Dostęp zabroniony. Nie masz uprawnień administratora.</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>Panel Administratora</h2>
      <p>Witaj, {currentUser.username || currentUser.email}!</p>

      {/* Sekcja zarządzania spotkaniami */}
      <Card className="mb-4">
        <Card.Header as="h5">Zarządzanie Spotkaniami</Card.Header>
        <Card.Body>
          <Button variant="primary" onClick={() => { setSelectedMeeting(null); setShowModal(true); }} className="mb-3">
            Dodaj nowe spotkanie
          </Button>
          {meetings.length === 0 ? (
            <Alert variant="info">Brak spotkań w bazie danych.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Tytuł</th>
                  <th>Data</th>
                  <th>Godzina</th>
                  <th>Twórca</th>
                  <th>Uczestnicy</th>
                  <th>Status</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((meeting) => (
                  <tr key={meeting.id}>
                    <td>{meeting.title}</td>
                    <td>{meeting.date}</td>
                    <td>{`${meeting.startTime}-${meeting.endTime}`}</td>
                    <td>{meeting.creatorUsername || meeting.createdBy}</td>
                    <td>{meeting.participants.join(', ')}</td>
                    <td>{meeting.status === 'scheduled' ? 'Zaplanowane' : 'Anulowane'}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="info" size="sm" onClick={() => handleEditMeeting(meeting)}>
                          Edytuj
                        </Button>
                        {meeting.status === 'scheduled' && (
                          <Button variant="warning" size="sm" onClick={() => handleCancelMeeting(meeting.id)}>
                            Anuluj
                          </Button>
                        )}
                        <Button variant="danger" size="sm" onClick={() => handleDeleteMeeting(meeting.id)}>
                          Usuń
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Sekcja zarządzania użytkownikami - PRZYWRÓCONA */}
      <Card>
        <Card.Header as="h5">Zarządzanie Użytkownikami</Card.Header>
        <Card.Body>
          {users.length === 0 ? (
            <Alert variant="info">Brak zarejestrowanych użytkowników.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nazwa Użytkownika</th>
                  <th>Rola</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.username}</td>
                    <td>
                      <Form.Select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value as 'user' | 'admin')}
                        disabled={user.id === currentUser?.id}
                      >
                        <option value="user">Użytkownik</option>
                        <option value="admin">Administrator</option>
                      </Form.Select>
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        disabled={user.id === currentUser?.id}
                      >
                        Usuń
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal do zarządzania spotkaniami (MeetingFormModal) */}
      <MeetingFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSuccess={fetchAllMeetings}
        meeting={selectedMeeting}
        creatorId={currentUser?.id || ''}
        creatorEmail={currentUser?.email || ''}
        allUsers={users}
      />
    </Container>
  );
};

export default AdminPage;