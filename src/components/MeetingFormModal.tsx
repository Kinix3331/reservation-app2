// src/components/MeetingFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { Meeting } from '../types/models';
import { createMeeting, updateMeeting } from '../services/meetingService';
import { useAuth } from '../contexts/AuthContext';

interface MeetingFormModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  editingMeeting?: Meeting | null;
}

const MeetingFormModal: React.FC<MeetingFormModalProps> = ({ show, onHide, onSuccess, editingMeeting }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [participants, setParticipants] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false); // Nowy stan dla walidacji formularza

  useEffect(() => {
    if (editingMeeting) {
      setTitle(editingMeeting.title);
      setDescription(editingMeeting.description);
      setDate(editingMeeting.date);
      setStartTime(editingMeeting.startTime);
      setEndTime(editingMeeting.endTime);
      setParticipants(editingMeeting.participants.join(', '));
    } else {
      setTitle('');
      setDescription('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setParticipants('');
    }
    setError(''); // Czyścimy błędy przy otwarciu/zmianie modalu
    setValidated(false); // Resetujemy walidację przy otwarciu/zmianie modalu
  }, [editingMeeting, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement; // Rzutowanie na HTMLFormElement
    setValidated(true); // Ustaw formularz jako walidowany (pokaż błędy)

    if (!form.checkValidity()) { // Sprawdź walidację HTML5
      e.stopPropagation();
      return;
    }

    if (!currentUser) {
      setError('Musisz być zalogowany, aby dodać/edytować spotkanie.');
      return;
    }

    setError('');
    setLoading(true);

    const parsedParticipants = participants.split(',').map(email => email.trim()).filter(email => email !== '');

    // Walidacja logiczna: czas zakończenia po czasie rozpoczęcia
    const startDateTime = new Date(`<span class="math-inline">\{date\}T</span>{startTime}`);
    const endDateTime = new Date(`<span class="math-inline">\{date\}T</span>{endTime}`);
    if (startDateTime >= endDateTime) {
      setError('Czas zakończenia musi być późniejszy niż czas rozpoczęcia.');
      setLoading(false);
      return;
    }

    const meetingData: Omit<Meeting, 'id' | 'status' | 'createdAt'> = {
      title,
      description,
      date,
      startTime,
      endTime,
      participants: parsedParticipants,
      createdBy: currentUser.uid,
    };

    try {
      if (editingMeeting) {
        const updateData: Partial<Omit<Meeting, 'id' | 'createdBy' | 'createdAt'>> = {
            title,
            description,
            date,
            startTime,
            endTime,
            participants: parsedParticipants,
            status: editingMeeting.status
        };
        await updateMeeting(editingMeeting.id, updateData);
      } else {
        await createMeeting(meetingData, currentUser.uid);
      }
      onSuccess();
      onHide();
    } catch (err: any) {
      setError(`Błąd: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{editingMeeting ? 'Edytuj spotkanie' : 'Dodaj nowe spotkanie'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {/* Dodano noValidate i validated do Form */}
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="title">
            <Form.Label>Tytuł</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              isInvalid={validated && !title} // Walidacja tytułu
            />
            <Form.Control.Feedback type="invalid">
              Tytuł jest wymagany.
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="description">
            <Form.Label>Opis</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="date">
            <Form.Label>Data</Form.Label>
            <Form.Control
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              isInvalid={validated && !date} // Walidacja daty
            />
            <Form.Control.Feedback type="invalid">
              Data jest wymagana.
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="startTime">
            <Form.Label>Godzina rozpoczęcia</Form.Label>
            <Form.Control
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              isInvalid={validated && !startTime} // Walidacja godziny rozpoczęcia
            />
            <Form.Control.Feedback type="invalid">
              Godzina rozpoczęcia jest wymagana.
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="endTime">
            <Form.Label>Godzina zakończenia</Form.Label>
            <Form.Control
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              isInvalid={validated && !endTime} // Walidacja godziny zakończenia
            />
            <Form.Control.Feedback type="invalid">
              Godzina zakończenia jest wymagana.
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="participants">
            <Form.Label>Uczestnicy (adresy email, oddzielone przecinkami)</Form.Label>
            <Form.Control
              type="text"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="np. email1@example.com, email2@example.com"
            />
            <Form.Text className="text-muted">
              Oddziel adresy email przecinkami.
            </Form.Text>
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100" disabled={loading}>
            {loading ? 'Zapisywanie...' : (editingMeeting ? 'Zapisz zmiany' : 'Dodaj spotkanie')}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default MeetingFormModal;