// src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCHO9SBVYMkkjhzY6XJ5EcJUqWvGiz3c3Q", // Twój API Key
  authDomain: "rezerwacja-app-firebase.firebaseapp.com",
  projectId: "rezerwacja-app-firebase",
  storageBucket: "rezerwacja-app-firebase.firebasestorage.app",
  messagingSenderId: "662168626431",
  appId: "1:662168626431:web:64db516f117314c9f558ca",
  measurementId: "G-S35XDDLNPT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // eslint-disable-line no-unused-vars

export const auth = getAuth(app);
export const db = getFirestore(app);
export {};