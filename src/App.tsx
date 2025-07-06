 
import React, { useEffect } from 'react';  
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MeetingsListPage from './pages/MeetingsListPage';
import AdminPage from './pages/AdminPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { auth } from './firebase/config';

 
const PrivateRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: ('user' | 'admin')[]; }): React.ReactElement => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            Ładowanie...
        </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

   
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
     
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

 
const MainLayout: React.FC = () => {
  const { currentUser, logout, loading, displayRole, setDisplayRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();  
      navigate('/login');
    } catch (error) {
      console.error("Błąd wylogowania:", error);
      alert("Wystąpił błąd podczas wylogowania.");
    }
  };

  const handleToggleAdminView = () => {
    if (currentUser && currentUser.role === 'admin') {
      const newDisplayRole = displayRole === 'admin' ? 'user' : 'admin';
      setDisplayRole(newDisplayRole);
       
      if (newDisplayRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  };

   
  useEffect(() => {
    if (currentUser) {
      if (window.location.pathname === '/admin' && displayRole !== 'admin') {
         
        setDisplayRole('admin');
      } else if (window.location.pathname === '/dashboard' && displayRole !== 'user' && currentUser.role === 'user') {
         
        setDisplayRole('user');
      }
       
       
    }
  }, [currentUser, displayRole, setDisplayRole, navigate]);  


  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">Meeting Planner</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {!loading && currentUser && (
                <>
                  <Nav.Link as={NavLink} to="/dashboard">Dashboard</Nav.Link>
                  <Nav.Link as={NavLink} to="/meetings">Lista Spotkań</Nav.Link>

                  {/* Przycisk do przełączania widoku - widoczny tylko dla administratorów */}
                  {currentUser.role === 'admin' && (
                    <Button
                      variant="outline-info"
                      onClick={handleToggleAdminView}
                      className="ms-3"
                    >
                      Przełącz na widok {displayRole === 'admin' ? 'Użytkownika' : 'Administratora'}
                    </Button>
                  )}
                </>
              )}
            </Nav>
            <Nav>
              {!loading && (
                currentUser ? (
                  <>
                    <Navbar.Text className="me-3">
                      Zalogowano jako: <strong>{currentUser.username || currentUser.email}</strong> ({currentUser.role})
                    </Navbar.Text>
                    <Button variant="outline-light" onClick={handleLogout}>Wyloguj</Button>
                  </>
                ) : (
                  <>
                    <Nav.Link as={NavLink} to="/login">Zaloguj</Nav.Link>
                    <Nav.Link as={NavLink} to="/register">Zarejestruj</Nav.Link>
                  </>
                )
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Trasa dla dashboardu - TERAZ ZAWSZE RENDERUJEMY OBA KOMPONENTY, UKRYWAJĄC JEDEN CSS-EM */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedRoles={['user', 'admin']}>
              <div style={{ display: displayRole === 'user' ? 'block' : 'none' }}>
                <DashboardPage />
              </div>
              <div style={{ display: displayRole === 'admin' ? 'block' : 'none' }}>
                <AdminPage />
              </div>
            </PrivateRoute>
          }
        />

        <Route
          path="/meetings"
          element={
            <PrivateRoute allowedRoles={['user', 'admin']}>
              <MeetingsListPage />
            </PrivateRoute>
          }
        />

        {/* Trasa dla panelu admina - TERAZ ZAWSZE RENDERUJEMY OBA KOMPONENTY, UKRYWAJĄC JEDEN CSS-EM */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              {/* Na ścieżce /admin domyślnie pokazujemy AdminPage, ale jeśli displayRole to 'user', pokazujemy DashboardPage */}
              <div style={{ display: displayRole === 'admin' ? 'block' : 'none' }}>
                <AdminPage />
              </div>
              <div style={{ display: displayRole === 'user' ? 'block' : 'none' }}>
                <DashboardPage />
              </div>
            </PrivateRoute>
          }
        />

        {/* Domyślne przekierowanie dla głównej ścieżki */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        {/* Przekierowanie dla nieistniejących ścieżek */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
  );
};


const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </Router>
  );
};

export default App;