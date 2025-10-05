import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2YEvf14X2b5oZztcCy0pChpdInbeugpE",
  authDomain: "certification-validator.firebaseapp.com",
  projectId: "certification-validator",
  storageBucket: "certification-validator.firebasestorage.app",
  messagingSenderId: "682375023325",
  appId: "1:682375023325:web:a08ad7a7f5ab04f39c2934",
  measurementId: "G-34LVWSNSZ7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
};

export default app; 