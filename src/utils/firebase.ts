import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Ваш конфиг из консоли Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCkdcAHtqY-K_HRfb0FpkVR8lU5tbJfmYE",
  authDomain: "masters-of-the-wilde.firebaseapp.com",
  projectId: "masters-of-the-wilde",
  storageBucket: "masters-of-the-wilde.firebasestorage.app",
  messagingSenderId: "474922234777",
  appId: "1:474922234777:web:2300a8c87464b08c339908"
};

// Инициализация
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
