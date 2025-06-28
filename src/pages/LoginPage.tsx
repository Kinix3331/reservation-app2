// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Importy dla Firebase Auth - teraz potrzebujemy sendPasswordResetEmail i auth
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config'; // Upewnij się, że auth jest eksportowane z firebase/config

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState(''); // Nowy stan dla emaila do resetu
  const [resetMessage, setResetMessage] = useState(''); // Nowy stan dla wiadomości o resecie

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/'); // Przekieruj na stronę główną po zalogowaniu
    } catch (err: any) {
      // Przyjazne komunikaty błędów logowania
      let errorMessage = 'Błąd logowania. Spróbuj ponownie.';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Użytkownik z podanym adresem e-mail nie istnieje.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Nieprawidłowe hasło.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Nieprawidłowy format adresu e-mail.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // NOWA FUNKCJA: Obsługa resetowania hasła
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage('');
    setError('');
    if (!resetEmail) {
      setError('Wprowadź adres e-mail, aby zresetować hasło.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('Link do resetowania hasła został wysłany na Twój adres e-mail. Sprawdź swoją skrzynkę odbiorczą (i folder SPAM).');
      setResetEmail(''); // Wyczyść pole po wysłaniu
    } catch (err: any) {
      let errorMessage = 'Błąd podczas wysyłania linku do resetowania hasła.';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Nie znaleziono użytkownika z podanym adresem e-mail.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Wprowadzony adres e-mail jest nieprawidłowy.';
      }
      setError(errorMessage);
      console.error("Błąd resetowania hasła:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card className="p-4" style={{ width: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Logowanie</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Adres email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Wprowadź email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Hasło</Form.Label>
              <Form.Control
                type="password"
                placeholder="Hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Zaloguj'}
            </Button>
          </Form>
          <div className="w-100 text-center mt-3">
            Nie masz konta? <Link to="/register">Zarejestruj się</Link>
          </div>

          <hr className="my-4" />

          {/* NOWA SEKCJA: Resetowanie hasła */}
          <h5 className="text-center mb-3">Resetowanie hasła</h5>
          {resetMessage && <Alert variant="success">{resetMessage}</Alert>}
          <Form onSubmit={handlePasswordReset}>
            <Form.Group className="mb-3" controlId="formResetEmail">
              <Form.Label>Wprowadź swój email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Email do resetowania hasła"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="outline-secondary" type="submit" className="w-100" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Wyślij link do resetowania hasła'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LoginPage;