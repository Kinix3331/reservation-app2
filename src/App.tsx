// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Importujemy AuthProvider i useAuth
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
// Importy dla stron, które stworzymy później
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
// Komponenty UI z React Bootstrap
import { Spinner, Container, Navbar, Nav, Button } from 'react-bootstrap';

// Komponent paska nawigacyjnego (będzie widoczny na każdej stronie)
const AppNavbar: React.FC = () => {
  const { currentUser, logout } = useAuth(); // Pobieramy dane o użytkowniku i funkcję wylogowania
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login'); // Przekierowujemy na stronę logowania po wylogowaniu
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">Rezerwacja App</Navbar.Brand> {/* Nazwa aplikacji i link do dashboardu */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* Link do Dashboardu widoczny dla zalogowanych użytkowników */}
            {currentUser && <Nav.Link as={Link} to="/">Dashboard</Nav.Link>}
            {/* Link do Panelu Administratora widoczny tylko dla adminów */}
            {currentUser?.role === 'admin' && <Nav.Link as={Link} to="/admin">Panel Administratora</Nav.Link>}
          </Nav>
          <Nav>
            {/* Warunkowe renderowanie - jeśli użytkownik zalogowany, pokaż nazwę i Wyloguj,
                w przeciwnym razie pokaż Logowanie i Rejestrację */}
            {currentUser ? (
              <>
                <Navbar.Text className="me-3 text-light">Witaj, {currentUser.username || currentUser.email}!</Navbar.Text>
                <Button variant="outline-light" onClick={handleLogout}>Wyloguj</Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Logowanie</Nav.Link>
                <Nav.Link as={Link} to="/register">Rejestracja</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

// Komponent PrivateRoute do ochrony ścieżek
const PrivateRoute: React.FC<{ allowedRoles?: ('user' | 'admin')[] }> = ({ allowedRoles }) => {
  const { currentUser, loading } = useAuth(); // Pobieramy dane o użytkowniku i stan ładowania

  if (loading) {
    // Pokaż spinner podczas ładowania stanu uwierzytelnienia
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Ładowanie...</span>
        </Spinner>
      </Container>
    );
  }

  if (!currentUser) {
    // Jeśli użytkownik nie jest zalogowany, przekieruj go na stronę logowania
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Jeśli użytkownik jest zalogowany, ale nie ma odpowiedniej roli, przekieruj go na stronę główną
    return <Navigate to="/" replace />;
  }

  // Jeśli użytkownik jest zalogowany i ma odpowiednią rolę, renderuj zagnieżdżone trasy
  return <Outlet />;
};

function App() {
  return (
    <Router>
      <AuthProvider> {/* Opakowujemy całą aplikację w AuthProvider */}
        <AppNavbar /> {/* Pasek nawigacyjny na górze */}
        <Routes>
          {/* Publiczne trasy */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Chronione trasy dla użytkowników (user i admin) */}
          <Route element={<PrivateRoute allowedRoles={['user', 'admin']} />}>
            <Route path="/" element={<DashboardPage />} />
          </Route>

          {/* Chronione trasy tylko dla administratorów */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Catch all dla nieznanych tras - przekierowanie na stronę główną */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;