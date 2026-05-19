import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

function envTrim(name) {
  const v = import.meta.env[name];
  return typeof v === "string" ? v.trim() : "";
}

function requiredEnv(name) {
  const v = envTrim(name);
  if (!v) {
    throw new Error(
      `[Firebase] Missing ${name}. Copy firebase/.env.example to .env.local and paste values from Firebase Console → Project settings → Your apps → Firebase SDK snippet (config object).`
    );
  }
  return v;
}

const firebaseConfig = {
  apiKey: requiredEnv("VITE_FIREBASE_API_KEY"),
  authDomain: requiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: requiredEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: requiredEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requiredEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requiredEnv("VITE_FIREBASE_APP_ID"),
};

const measurementId = envTrim("VITE_FIREBASE_MEASUREMENT_ID");
if (measurementId) {
  firebaseConfig.measurementId = measurementId;
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
