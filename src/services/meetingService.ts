  
import { db } from '../firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { Meeting } from '../types/models';  

const meetingsCollectionRef = collection(db, 'meetings');
const usersCollectionRef = collection(db, 'users');  

export const createMeeting = async (meetingData: Omit<Meeting, 'id' | 'createdAt' | 'status' | 'createdBy'>, userId: string): Promise<string> => {
  const newMeeting: Omit<Meeting, 'id'> = {
    ...meetingData,
    createdBy: userId,
    status: 'scheduled',
    createdAt: new Date(),
  };
  const docRef = await addDoc(meetingsCollectionRef, newMeeting);
  return docRef.id;
};

 
export const getMeetings = async (userId?: string, role?: 'user' | 'admin', userEmail?: string): Promise<Meeting[]> => {
  let q;
  if (role === 'admin') {
     
    q = meetingsCollectionRef;
  } else if (userId && userEmail) {
     
    q = query(meetingsCollectionRef, where('participants', 'array-contains', userEmail));
     
     
     
     
     
  } else {
     
    return [];
  }

  const querySnapshot = await getDocs(q);
  const fetchedMeetings: Meeting[] = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      participants: data.participants,
      createdBy: data.createdBy,
      status: data.status,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
    };
  });

   
  const creatorIds = [...new Set(fetchedMeetings.map(m => m.createdBy))];
  const usersData: { [key: string]: string | null } = {};  
  const userPromises = creatorIds.map(async (uid) => {
    const userDocRef = doc(usersCollectionRef, uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      usersData[uid] = userDocSnap.data().username || userDocSnap.data().email || null;  
    } else {
      usersData[uid] = null;  
    }
  });
  await Promise.all(userPromises);  

   
  let meetings = fetchedMeetings.map(meeting => ({
    ...meeting,
    creatorUsername: usersData[meeting.createdBy] || null,  
  }));
   

   
  meetings.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });

  return meetings;
};

export const updateMeeting = async (id: string, updateData: Partial<Omit<Meeting, 'id' | 'createdBy' | 'createdAt'>>) => {
  const meetingDoc = doc(db, 'meetings', id);
  await updateDoc(meetingDoc, updateData);
};

export const deleteMeeting = async (id: string) => {
  const meetingDoc = doc(db, 'meetings', id);
  await deleteDoc(meetingDoc);
};