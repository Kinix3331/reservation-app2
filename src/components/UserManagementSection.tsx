 
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Spinner, Alert, ListGroup, Card, Button, Row, Col, Form } from 'react-bootstrap';
import { db, auth } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from '../contexts/AuthContext';  
import { UserProfile } from '../types/models';  

const UserManagementSection: React.FC = () => {
  const { currentUser } = useAuth();  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const usersCollectionRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollectionRef);
      const fetchedUsers: UserProfile[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,  
          username: data.username || 'N/A',
          email: data.email || 'N/A',
          role: data.role || 'user',  
          createdAt: data.createdAt ? new Date(data.createdAt.toDate()) : undefined,
        };
      });
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error("Błąd podczas pobierania użytkowników:", err);
      setError(`Nie udało się załadować użytkowników: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleChangeRole = useCallback(async (userId: string, currentRole: 'user' | 'admin') => {
    if (!currentUser) {
      alert("Musisz być zalogowany, aby zmienić role.");
      return;
    }
    if (currentUser.id === userId) {  
      alert("Nie możesz zmienić swojej własnej roli.");
      return;
    }

    setLoading(true);
    setError('');
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { role: newRole });
      alert(`Rola użytkownika ${userId} zmieniona na ${newRole}.`);
      fetchUsers();  
    } catch (err: any) {
      console.error("Błąd zmiany roli:", err);
      setError(`Nie udało się zmienić roli: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentUser, fetchUsers]);

  const handleDeleteUserProfile = useCallback(async (userId: string, email: string) => {
    if (!currentUser) {
      alert("Musisz być zalogowany, aby usuwać profile.");
      return;
    }
    if (currentUser.id === userId) {  
      alert("Nie możesz usunąć swojego własnego konta.");
      return;
    }

    if (window.confirm(`Czy na pewno chcesz usunąć profil użytkownika ${email}? To nie usunie konta Firebase Auth!`)) {
      setLoading(true);
      setError('');
      try {
        const userDocRef = doc(db, 'users', userId);
        await deleteDoc(userDocRef);
        alert(`Profil użytkownika ${email} został usunięty z Firestore.`);
        fetchUsers();  
      } catch (err: any) {
        console.error("Błąd usuwania profilu użytkownika:", err);
        setError(`Nie udało się usunąć profilu użytkownika: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  }, [currentUser, fetchUsers]);

  const handleResetPassword = useCallback(async (email: string) => {
    if (!email) {
      alert("Email użytkownika jest wymagany do resetowania hasła.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Link do resetowania hasła został wysłany na adres: ${email}`);
    } catch (err: any) {
      console.error("Błąd resetowania hasła:", err);
      setError(`Nie udało się wysłać linku do resetowania hasła: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '30vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Ładowanie użytkowników...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Wystąpił błąd: {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>Zarządzanie Użytkownikami</Card.Title>
        {users.length === 0 ? (
          <Alert variant="info">Brak zarejestrowanych użytkowników.</Alert>
        ) : (
          <ListGroup variant="flush">
            {users.map((user) => (
              <ListGroup.Item key={user.id}> {/* Używamy user.id */}
                <Row className="align-items-center">
                  <Col md={6}>
                    <p className="mb-0"><strong>{user.username}</strong> ({user.email}) - {user.role === 'admin' ? 'Administrator' : 'Użytkownik'}</p>
                    {user.createdAt && <small className="text-muted">Utworzono: {user.createdAt.toLocaleString()}</small>}
                  </Col>
                  <Col md={6} className="text-md-end">
                    <div className="d-flex flex-wrap justify-content-end gap-2">
                      <Button
                        variant={user.role === 'admin' ? 'outline-secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleChangeRole(user.id, user.role)}
                      >
                        Zmień na {user.role === 'admin' ? 'Użytkownik' : 'Admin'}
                      </Button>
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => handleResetPassword(user.email || '')}  
                      >
                        Zmień hasło
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteUserProfile(user.id, user.email || '')}  
                        disabled={user.id === currentUser?.id}  
                      >
                        Usuń profil (konto Auth zostanie)
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