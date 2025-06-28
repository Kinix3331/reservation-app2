// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { Form, Button, Container, Alert, Card } from 'react-bootstrap'; // Importujemy komponenty z react-bootstrap
import { useAuth } from '../contexts/AuthContext'; // Importujemy nasz custom hook do uwierzytelniania
import { useNavigate, Link } from 'react-router-dom'; // Do nawigacji

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Dodajemy stan dla nazwy użytkownika
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth(); // Pobieramy funkcję signup z kontekstu
  const navigate = useNavigate(); // Hook do programowej nawigacji

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Zapobieganie domyślnej akcji formularza (przeładowanie strony)
    try {
      setError(''); // Czyścimy poprzednie błędy
      setLoading(true); // Ustawiamy stan ładowania
      await signup(email, password, username); // Wywołujemy funkcję rejestracji z kontekstu
      navigate('/'); // Przekierowujemy użytkownika na stronę główną/dashboard po udanej rejestracji
    } catch (err: any) {
      setError(`Błąd rejestracji: ${err.message}`); // Wyświetlamy błąd użytkownikowi
    }
    setLoading(false); // Kończymy stan ładowania
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">Rejestracja</h2>
            {error && <Alert variant="danger">{error}</Alert>} {/* Wyświetlanie błędów */}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="username">
                <Form.Label>Imię i Nazwisko / Nazwa Użytkownika</Form.Label>
                <Form.Control
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Adres Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Hasło</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>
              <Button disabled={loading} className="w-100 mt-3" type="submit">
                Zarejestruj się
              </Button>
            </Form>
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
          Masz już konto? <Link to="/login">Zaloguj się</Link> {/* Link do strony logowania */}
        </div>
      </div>
    </Container>
  );
};

export default RegisterPage;