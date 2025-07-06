 
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';  
import moment from 'moment';
import { Meeting, UserProfile } from '../types/models';  

interface MeetingFormModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;  
  meeting: Meeting | null;  
  creatorId: string | null;  
  creatorEmail: string | null;  
  allUsers: UserProfile[];  
}

const MeetingFormModal: React.FC<MeetingFormModalProps> = ({
  show,
  onHide,
  onSuccess,
  meeting,
  creatorId,
  creatorEmail,
  allUsers
}) => {
  const [title, setTitle] = useState(meeting?.title || '');
  const [description, setDescription] = useState(meeting?.description || '');
  const [date, setDate] = useState(meeting?.date || moment().format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState(meeting?.startTime || '09:00');
  const [endTime, setEndTime] = useState(meeting?.endTime || '10:00');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title);
      setDescription(meeting.description);
      setDate(meeting.date);
      setStartTime(meeting.startTime);
      setEndTime(meeting.endTime);
       
      const initialParticipants = meeting.participants.includes(creatorEmail || '')
        ? meeting.participants
        : [...meeting.participants, creatorEmail || ''];
      setSelectedParticipants(initialParticipants.filter(p => p !== null && p !== undefined) as string[]);
    } else {
       
      setTitle('');
      setDescription('');
      setDate(moment().format('YYYY-MM-DD'));
      setStartTime('09:00');
      setEndTime('10:00');
      setSelectedParticipants(creatorEmail ? [creatorEmail] : []);
    }
    setError('');  
  }, [meeting, creatorEmail, show]);  

  const handleParticipantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setSelectedParticipants(prev =>
      checked ? [...prev, value] : prev.filter(p => p !== value)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!creatorId || !creatorEmail) {
      setError("Błąd: Brak ID lub emaila twórcy.");
      setLoading(false);
      return;
    }

     
    const finalParticipants = Array.from(new Set([...selectedParticipants, creatorEmail]));

    const meetingData: Omit<Meeting, 'id' | 'createdAt' | 'status' | 'creatorUsername' | 'createdBy'> = {
      title,
      description,
      date,
      startTime,
      endTime,
      participants: finalParticipants,
    };

    try {
      if (meeting) {
         
        const meetingRef = doc(db, 'meetings', meeting.id);
        await updateDoc(meetingRef, {
          ...meetingData,
          updatedAt: serverTimestamp(),  
        });
      } else {
         
        await addDoc(collection(db, 'meetings'), {
          ...meetingData,
          createdBy: creatorId,
          status: 'scheduled',
          createdAt: Timestamp.now(),  
        });
      }
      onSuccess();  
      onHide();  
    } catch (err: any) {
      console.error("Błąd zapisu spotkania:", err);
      setError(`Nie udało się zapisać spotkania: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

   
  const filteredUsers = allUsers.filter(user => user.email !== creatorEmail);

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{meeting ? 'Edytuj Spotkanie' : 'Dodaj Nowe Spotkanie'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formMeetingTitle">
            <Form.Label>Tytuł</Form.Label>
            <Form.Control
              type="text"
              placeholder="Wprowadź tytuł spotkania"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formMeetingDescription">
            <Form.Label>Opis</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Szczegółowy opis spotkania"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          <Row className="mb-3">
            <Col>
              <Form.Group controlId="formMeetingDate">
                <Form.Label>Data</Form.Label>
                <Form.Control
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="formMeetingStartTime">
                <Form.Label>Godzina rozpoczęcia</Form.Label>
                <Form.Control
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="formMeetingEndTime">
                <Form.Label>Godzina zakończenia</Form.Label>
                <Form.Control
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Uczestnicy (wybierz spośród zarejestrowanych użytkowników)</Form.Label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
              {allUsers.length === 0 ? (
                <p>Ładowanie użytkowników...</p>
              ) : (
                filteredUsers.map(user => (  
                  <Form.Check
                    key={user.id}  
                    type="checkbox"
                    id={`participant-${user.id}`}  
                    label={user.username || user.email}
                    value={user.email || ''}  
                    checked={selectedParticipants.includes(user.email || '')}
                    onChange={handleParticipantChange}
                  />
                ))
              )}
            </div>
          </Form.Group>

          <Modal.Footer>
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              Anuluj
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Zapisywanie...' : (meeting ? 'Zapisz zmiany' : 'Dodaj spotkanie')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default MeetingFormModal;