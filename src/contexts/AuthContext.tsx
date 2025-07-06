 
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

 
import { UserProfile } from '../types/models';  

interface AuthContextType {
  currentUser: UserProfile | null;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
  displayRole: 'user' | 'admin';
  setDisplayRole: React.Dispatch<React.SetStateAction<'user' | 'admin'>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayRole, setDisplayRole] = useState<'user' | 'admin'>('user');  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const userData = docSnap.data() as UserProfile;
            setCurrentUser({ ...userData, id: user.uid });  
            setDisplayRole(userData.role);  
          } else {
            console.warn("User profile not found in Firestore for UID:", user.uid);
             
            const newUserProfile: UserProfile = {
                id: user.uid,
                email: user.email,
                username: user.email?.split('@')[0] || 'Unknown',  
                role: 'user',
                createdAt: new Date()
            };
            await setDoc(userDocRef, newUserProfile);
            setCurrentUser(newUserProfile);
            setDisplayRole('user');
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setCurrentUser(null);
          setDisplayRole('user');  
        }
      } else {
        setCurrentUser(null);
        setDisplayRole('user');  
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email: string, password: string, username: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDocRef = doc(db, 'users', user.uid);
    const role = email.endsWith('@admin.com') ? 'admin' : 'user';  
    await setDoc(userDocRef, {
      username,
      email,
      role,
      createdAt: new Date(),
    });
     
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
     
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    currentUser,
    logout,
    login,
    register,
    resetPassword,
    loading,
    displayRole,
    setDisplayRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};