import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDy1TdmOUw-x-jWh3HXKb7n--iWaFrpRpI",
  authDomain: "family-tree-maker-2e1f5.firebaseapp.com",
  projectId: "family-tree-maker-2e1f5",
  storageBucket: "family-tree-maker-2e1f5.firebasestorage.app",
  messagingSenderId: "923463652195",
  appId: "1:923463652195:web:d5859324b27e5733e1f956",
  measurementId: "G-PETVNXX06B",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
