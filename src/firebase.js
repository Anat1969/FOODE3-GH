import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "__API_KEY__",
  authDomain: "__PROJECT_ID__.firebaseapp.com",
  projectId: "__PROJECT_ID__",
  storageBucket: "__PROJECT_ID__.firebasestorage.app",
  messagingSenderId: "__SENDER_ID__",
  appId: "__APP_ID__"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
