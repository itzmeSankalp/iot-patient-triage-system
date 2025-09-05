import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANT: Paste your own Firebase configuration object here
const firebaseConfig = {
  apiKey: "AIzaSyC5bIurA0SDKzMcpe-qQR6WsoahjNIGIUM",
  authDomain: "vitalis-app-f65e9.firebaseapp.com",
  projectId: "vitalis-app-f65e9",
  storageBucket: "vitalis-app-f65e9.firebasestorage.app",
  messagingSenderId: "395325754519",
  appId: "1:395325754519:web:8c2acad00aadd880a5edd2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);