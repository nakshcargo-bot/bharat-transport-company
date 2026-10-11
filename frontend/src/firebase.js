import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCV6Fbw_4-Z9hICl3pGtQyI2rh0IUFlocc",
  authDomain: "bharat-transport-sync.firebaseapp.com",
  databaseURL: "https://bharat-transport-sync-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bharat-transport-sync",
  storageBucket: "bharat-transport-sync.firebasestorage.app",
  messagingSenderId: "1817258656",
  appId: "1:1817258656:web:f5f930d99e8380d08137c5",
  measurementId: "G-FZ3JZG3B3C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore & Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
