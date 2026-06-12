import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_QwUEthllcl_ju737cqwHr6JATZ-sMtE",
  authDomain: "scripture-plan.firebaseapp.com",
  projectId: "scripture-plan",
  storageBucket: "scripture-plan.firebasestorage.app",
  messagingSenderId: "1032627041354",
  appId: "1:1032627041354:web:16e8029e0e784db84722b3",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
