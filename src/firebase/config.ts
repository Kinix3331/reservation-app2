// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCHO9SBVYMkkjhzY6XJ5EcJUqWvGiz3c3Q",
  authDomain: "rezerwacja-app-firebase.firebaseapp.com",
  projectId: "rezerwacja-app-firebase",
  storageBucket: "rezerwacja-app-firebase.firebasestorage.app",
  messagingSenderId: "662168626431",
  appId: "1:662168626431:web:64db516f117314c9f558ca",
  measurementId: "G-S35XDDLNPT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export {};