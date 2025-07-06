 // src/services/userService.ts
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';  
import { UserProfile } from '../types/models';  

const usersCollectionRef = collection(db, 'users');

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const querySnapshot = await getDocs(usersCollectionRef);
  const users: UserProfile[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    users.push({
      id: doc.id,  
      email: data.email || null,  
      username: data.username || 'N/A',
      role: data.role || 'user',
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
    });
  });
  return users;
};

export const updateUserProfile = async (userId: string, updateData: Partial<UserProfile>) => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, updateData);
};

export const deleteUserProfile = async (userId: string) => {
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
};