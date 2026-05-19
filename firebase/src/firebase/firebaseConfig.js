import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBHRnKueH0jbrtzPUp6RO9XeBfHXHs_Eng",
  authDomain: "shop-36430.firebaseapp.com",
  projectId: "shop-36430",
  storageBucket: "shop-36430.firebasestorage.app",
  messagingSenderId: "118611860435",
  appId: "1:118611860435:web:a1910b3332b0541df2ad26",
  measurementId: "G-B30ERDHVYW",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
