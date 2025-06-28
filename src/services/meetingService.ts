// src/services/meetingService.ts
import { db } from '../firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp, // Dodaj import Timestamp!
} from 'firebase/firestore';
import { Meeting } from '../types/models';

const meetingsCollectionRef = collection(db, 'meetings');

export const createMeeting = async (meetingData: Omit<Meeting, 'id' | 'createdAt' | 'status'>, userId: string): Promise<string> => {
  const newMeeting: Omit<Meeting, 'id'> = {
    ...meetingData,
    createdBy: userId,
    status: 'scheduled',
    createdAt: new Date(),
  };
  const docRef = await addDoc(meetingsCollectionRef, newMeeting);
  return docRef.id;
};

export const getMeetings = async (userId?: string, role?: 'user' | 'admin'): Promise<Meeting[]> => {
  let q;
  if (role === 'user' && userId) {
    q = query(meetingsCollectionRef, where('createdBy', '==', userId));
  } else {
    q = meetingsCollectionRef;
  }
  const data = await getDocs(q);
  return data.docs.map((doc) => {
    const docData = doc.data();
    // Sprawdź, czy createdAt jest Timestampem i przekształć na Date
    if (docData.createdAt && docData.createdAt instanceof Timestamp) {
      docData.createdAt = docData.createdAt.toDate();
    }
    return { ...docData, id: doc.id };
  }) as Meeting[]; // Upewnij się, że rzutowanie jest poprawne
};

export const updateMeeting = async (id: string, updateData: Partial<Omit<Meeting, 'id' | 'createdBy' | 'createdAt'>>) => {
  const meetingDoc = doc(db, 'meetings', id);
  await updateDoc(meetingDoc, updateData);
};

export const cancelMeeting = async (id: string) => {
  const meetingDoc = doc(db, 'meetings', id);
  await updateDoc(meetingDoc, { status: 'canceled' });
};

export const deleteMeeting = async (id: string) => {
  const meetingDoc = doc(db, 'meetings', id);
  await deleteDoc(meetingDoc);
};

export {};