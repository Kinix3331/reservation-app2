import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  // Stany dla błędów walidacji pól
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetEmailError, setResetEmailError] = useState('');

  const { login, currentUser, loading: authContextLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authContextLoading && currentUser) {
      console.log("LoginPage useEffect: Użytkownik zalogowany, przekierowanie na /dashboard");
      navigate('/dashboard');
    }
  }, [currentUser, authContextLoading, navigate]);

  // Funkcje walidacyjne
  const validateEmail = (email: string): string => {
    if (!email) {
      return 'Adres email jest wymagany.';
    }
    // Prosta regex do walidacji emaila
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Wprowadź poprawny adres email.';
    }
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) {
      return 'Hasło jest wymagane.';
    }
    if (password.length < 6) {
      return 'Hasło musi mieć co najmniej 6 znaków.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Resetuj ogólny błąd przed każdą próbą logowania

    // Przeprowadź walidację wszystkich pól
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    // Ustaw stany błędów
    setEmailError(emailValidation);
    setPasswordError(passwordValidation);

    // Jeśli są jakiekolwiek błędy walidacji, zatrzymaj proces
    if (emailValidation || passwordValidation) {
      return;
    }

    setLocalLoading(true);
    try {
      await login(email, password);
      // Przekierowanie odbywa się w useEffect po udanym zalogowaniu
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas logowania.');
      console.error('Login error:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');

    // Walidacja emaila do resetowania hasła
    const resetEmailValidation = validateEmail(resetEmail);
    setResetEmailError(resetEmailValidation);

    if (resetEmailValidation) {
      return;
    }

    setLocalLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('Link do resetowania hasła został wysłany na Twój adres email.');
      setResetEmail(''); // Wyczyść pole po wysłaniu
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas wysyłania linku do resetowania hasła.');
      console.error('Password reset error:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card className="p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="text-center mb-4">Zaloguj się</h2>
        {error && <Alert variant="danger">{error}</Alert>} {/* Ogólny błąd z Firebase */}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Adres Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Wprowadź email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(validateEmail(e.target.value)); // Walidacja na bieżąco
              }}
              onBlur={(e) => setEmailError(validateEmail(e.target.value))} // Walidacja przy opuszczeniu pola
              isInvalid={!!emailError} // Dodanie klasy is-invalid jeśli jest błąd
              required
            />
            <Form.Control.Feedback type="invalid">
              {emailError}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Hasło</Form.Label>
            <Form.Control
              type="password"
              placeholder="Hasło"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(validatePassword(e.target.value)); // Walidacja na bieżąco
              }}
              onBlur={(e) => setPasswordError(validatePassword(e.target.value))} // Walidacja przy opuszczeniu pola
              isInvalid={!!passwordError}
              required
            />
            <Form.Control.Feedback type="invalid">
              {passwordError}
            </Form.Control.Feedback>
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100" disabled={localLoading}>
            {localLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Zaloguj się'}
          </Button>
        </Form>
        <div className="text-center mt-3">
          <Link to="/register">Nie masz konta? Zarejestruj się.</Link>
        </div>

        <hr className="my-4" />

        {/* Sekcja resetowania hasła */}
        <h5 className="text-center mb-3">Resetowanie hasła</h5>
        {resetMessage && <Alert variant="success">{resetMessage}</Alert>} {/* Komunikat o sukcesie resetowania */}
        <Form onSubmit={handlePasswordReset}>
          <Form.Group className="mb-3" controlId="formResetEmail">
            <Form.Label>Wprowadź swój email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Email do resetowania hasła"
              value={resetEmail}
              onChange={(e) => {
                setResetEmail(e.target.value);
                setResetEmailError(validateEmail(e.target.value)); // Walidacja na bieżąco
              }}
              onBlur={(e) => setResetEmailError(validateEmail(e.target.value))} // Walidacja przy opuszczeniu pola
              isInvalid={!!resetEmailError}
              required
            />
            <Form.Control.Feedback type="invalid">
              {resetEmailError}
            </Form.Control.Feedback>
          </Form.Group>
          <Button variant="outline-secondary" type="submit" className="w-100" disabled={localLoading}>
            {localLoading ? <Spinner animation="border" size="sm" /> : 'Wyślij link do resetowania hasła'}
          </Button>
        </Form>
      </Card>
    </Container>
  );
};

export default LoginPage;