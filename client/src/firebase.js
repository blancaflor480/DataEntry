import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAQ9fT5vXLgc2sOR9i4YMkqNkoleXjv6nA",
  authDomain: "dataentry-cd841.firebaseapp.com",
  projectId: "dataentry-cd841",
  storageBucket: "dataentry-cd841.firebasestorage.app",
  messagingSenderId: "401797816947",
  appId: "1:401797816947:web:dde431385d03e47fe00006",
  measurementId: "G-3YXEW3TGT0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);
export default app;

export { db };
