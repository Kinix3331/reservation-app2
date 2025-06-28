// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config'; // Upewnij się, że ścieżka jest poprawna!
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser, // Zmieniamy nazwę, aby uniknąć kolizji z naszą UserProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Interfejs dla naszego profilu użytkownika (rozszerzenie o role i username)
export interface UserProfile {
  uid: string;
  email: string | null;
  role: 'user' | 'admin'; // Domyślna rola to 'user', administratorzy będą edytowani ręcznie w Firestore
  username?: string; // Opcjonalne pole, które dodamy podczas rejestracji
  createdAt?: Date;
}

// Interfejs dla wartości udostępnianych przez kontekst
interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean; // Stan ładowania, dopóki Firebase nie sprawdzi statusu logowania
  signup: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Tworzenie kontekstu
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom Hook do łatwego użycia kontekstu w komponentach
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Komponent Provider, który będzie opakowywał całą aplikację
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Użyj useEffect do nasłuchiwania zmian stanu uwierzytelnienia Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Jeśli użytkownik jest zalogowany w Firebase Authentication
        // Spróbuj pobrać jego profil z Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          // Jeśli profil istnieje, użyj go
          setCurrentUser(userDocSnap.data() as UserProfile);
        } else {
          // Jeśli z jakiegoś powodu profil nie istnieje w Firestore
          // (np. użytkownik logował się inną metodą, lub błąd podczas signup)
          // Utwórz podstawowy profil z domyślną rolą 'user'
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'user',
          });
        }
      } else {
        // Użytkownik nie jest zalogowany
        setCurrentUser(null);
      }
      setLoading(false); // Ustawienie loading na false po sprawdzeniu stanu
    });
    return unsubscribe; // Funkcja do czyszczenia subskrypcji
  }, []);

  // Funkcja do rejestracji nowego użytkownika
  const signup = async (email: string, password: string, username: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    // Zapisz profil użytkownika w Firestore z domyślną rolą 'user'
    await setDoc(doc(db, 'users', uid), {
      uid,
      email,
      username,
      role: 'user',
      createdAt: new Date(),
    });
  };

  // Funkcja do logowania użytkownika
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Funkcja do wylogowania użytkownika
  const logout = async () => {
    await signOut(auth);
  };

  // Wartości, które będą udostępniane przez kontekst
  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Renderuj dzieci tylko po załadowaniu stanu uwierzytelnienia */}
    </AuthContext.Provider>
  );
};