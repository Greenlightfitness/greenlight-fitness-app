import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore/lite';
import * as firebaseStorage from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA1RMh4Ujx0eofIqUtLJEDzsUYOXi8tCYY",
  authDomain: "greenlight-fitness-44ed4.firebaseapp.com",
  projectId: "greenlight-fitness-44ed4",
  storageBucket: "greenlight-fitness-44ed4.firebasestorage.app",
  messagingSenderId: "778499799673",
  appId: "1:778499799673:web:80ca2e2e3b77927fc672a8",
  measurementId: "G-Q6JH2SXWL5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = firebaseStorage.getStorage(app);