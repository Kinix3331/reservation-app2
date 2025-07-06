 
import React, { useState } from 'react';
import { Container, Form, Button, Alert, Spinner, Card } from 'react-bootstrap';  
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';  

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

   
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

   
  const validateUsername = (username: string): string => {
    if (!username) {
      return 'Nazwa użytkownika jest wymagana.';
    }
    if (username.length < 3) {
      return 'Nazwa użytkownika musi mieć co najmniej 3 znaki.';
    }
    return '';
  };

  const validateEmail = (email: string): string => {
    if (!email) {
      return 'Adres email jest wymagany.';
    }
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
    setError('');  

     
    const usernameValidation = validateUsername(username);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

     
    setUsernameError(usernameValidation);
    setEmailError(emailValidation);
    setPasswordError(passwordValidation);

     
    if (usernameValidation || emailValidation || passwordValidation) {
      return;
    }

    setLoading(true);
    try {
      await register(email, password, username);
      alert('Rejestracja zakończona sukcesem! Możesz się teraz zalogować.');
      navigate('/login');
    } catch (err: any) {
      setError(`Błąd rejestracji: ${err.message}`);
      console.error("Błąd rejestracji:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <Card className="p-4">
          <h2 className="text-center mb-4">Zarejestruj się</h2>
          {error && <Alert variant="danger">{error}</Alert>} {/* Ogólny błąd z Firebase */}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>Nazwa użytkownika</Form.Label>
              <Form.Control
                type="text"
                placeholder="Wprowadź nazwę użytkownika"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError(validateUsername(e.target.value));
                }}
                onBlur={(e) => setUsernameError(validateUsername(e.target.value))}
                isInvalid={!!usernameError}
                required
              />
              <Form.Control.Feedback type="invalid">
                {usernameError}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Adres email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Wprowadź adres email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(validateEmail(e.target.value));
                }}
                onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                isInvalid={!!emailError}
                required
              />
              <Form.Control.Feedback type="invalid">
                {emailError}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label>Hasło</Form.Label>
              <Form.Control
                type="password"
                placeholder="Wprowadź hasło"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(validatePassword(e.target.value));
                }}
                onBlur={(e) => setPasswordError(validatePassword(e.target.value))}
                isInvalid={!!passwordError}
                required
              />
              <Form.Control.Feedback type="invalid">
                {passwordError}
              </Form.Control.Feedback>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Zarejestruj się'}
            </Button>
          </Form>
          <div className="w-100 text-center mt-3">
            Masz już konto? <Link to="/login">Zaloguj się</Link>
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default RegisterPage;