// src/components/UserManagementSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Spinner, Alert, ListGroup, Card, Button, Row, Col, Form } from 'react-bootstrap';
import { db, auth } from '../firebase/config'; // Potrzebujemy dostępu do db i auth
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from "firebase/auth"; // NOWY IMPORT: do resetowania hasła

interface UserData {
  id: string; // UID użytkownika z Firebase Auth
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt?: Date;
}

const UserManagementSection: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const usersCollectionRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollectionRef);
      const fetchedUsers: UserData[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          username: data.username || 'N/A',
          email: data.email || 'N/A',
          role: data.role || 'user',
          createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : undefined,
        };
      });
      setUsers(fetchedUsers);
    } catch (err: any) {
      setError(`Błąd podczas ładowania użytkowników: ${err.message}`);
      console.error("Błąd ładowania użytkowników:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleChangeRole = async (userId: string, currentRole: 'admin' | 'user') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (window.confirm(`Czy na pewno chcesz zmienić rolę użytkownika ${users.find(u => u.id === userId)?.username || userId} na ${newRole}?`)) {
      try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, { role: newRole });
        alert(`Rola użytkownika ${users.find(u => u.id === userId)?.username || userId} została zmieniona na ${newRole}.`);
        fetchUsers(); // Odśwież listę
      } catch (err: any) {
        setError(`Błąd podczas zmiany roli: ${err.message}`);
        console.error("Błąd zmiany roli:", err);
      }
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (window.confirm(`Czy na pewno chcesz trwale usunąć użytkownika ${userEmail}? Tej operacji nie można cofnąć! Pamiętaj, że to usunie tylko dokument z Firestore. Aby usunąć konto Firebase Auth, potrzebne są Firebase Cloud Functions.`)) {
      try {
        // Usuń dokument użytkownika z Firestore
        const userDocRef = doc(db, 'users', userId);
        await deleteDoc(userDocRef);

        // Tutaj jest miejsce, gdzie normalnie wywołałoby się Cloud Function
        // do usunięcia użytkownika z Firebase Authentication.
        // Bez tego użytkownik nadal będzie miał konto Auth, ale nie będzie miał danych w Firestore.

        alert(`Użytkownik ${userEmail} został usunięty z bazy danych Firestore.`);
        fetchUsers(); // Odśwież listę
      } catch (err: any) {
        setError(`Błąd podczas usuwania użytkownika: ${err.message}`);
        console.error("Błąd usuwania użytkownika:", err);
      }
    }
  };

  // NOWA FUNKCJA: Do wysyłania linku resetującego hasło
  const handleResetPassword = async (userEmail: string) => {
    if (!userEmail) {
      alert('Brak adresu e-mail dla tego użytkownika.');
      return;
    }
    if (window.confirm(`Czy na pewno chcesz wysłać link do resetowania hasła na adres ${userEmail}?`)) {
      try {
        await sendPasswordResetEmail(auth, userEmail);
        alert(`Link do resetowania hasła został wysłany na adres ${userEmail}.`);
      } catch (err: any) {
        // Obsługa błędów, np. Firebase: Error (auth/user-not-found).
        let errorMessage = `Błąd podczas wysyłania linku do resetowania hasła: ${err.message}`;
        if (err.code === 'auth/user-not-found') {
          errorMessage = `Użytkownik z adresem e-mail ${userEmail} nie został znaleziony.`;
        }
        setError(errorMessage);
        console.error("Błąd resetowania hasła:", err);
        alert(errorMessage); // Wyświetl alert z błędem
      }
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p>Ładowanie użytkowników...</p>
      </Container>
    );
  }

  if (error) {
    return <Alert variant="danger" className="mt-4">{error}</Alert>;
  }

  return (
    <Card className="mt-4">
      <Card.Body>
        <h3 className="mb-3">Zarządzanie Użytkownikami</h3>
        {users.length === 0 ? (
          <Alert variant="info">Brak użytkowników do wyświetlenia.</Alert>
        ) : (
          <ListGroup>
            {users.map((user) => (
              <ListGroup.Item key={user.id} className="mb-2">
                <Row className="align-items-center">
                  <Col md={6}>
                    <p><strong>Nazwa:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Rola:</strong> {user.role}</p>
                    {user.createdAt && <small className="text-muted">Utworzono: {user.createdAt.toLocaleString()}</small>}
                  </Col>
                  <Col md={6} className="text-md-end">
                    <div className="d-flex flex-wrap justify-content-end gap-2"> {/* Użyj flex-wrap i gap */}
                      <Button
                        variant={user.role === 'admin' ? 'outline-secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleChangeRole(user.id, user.role)}
                      >
                        Zmień na {user.role === 'admin' ? 'Użytkownik' : 'Admin'}
                      </Button>
                      <Button
                        variant="info" // inny kolor dla lepszej widoczności
                        size="sm"
                        onClick={() => handleResetPassword(user.email)}
                      >
                        Zmień hasło
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                      >
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
  );
};

export default UserManagementSection;