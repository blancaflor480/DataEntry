import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA3MMouTplVPPDw0EI1V8M0q71uqFWLf08",
  authDomain: "dataentry-cd202.firebaseapp.com",
  projectId: "dataentry-cd202",
  storageBucket: "dataentry-cd202.firebasestorage.app",
  messagingSenderId: "460876207515",
  appId: "1:460876207515:web:77869d628acdb2bf79fd3e",
  measurementId: "G-LZYK3R3FPG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);
export default app;

export { db };
