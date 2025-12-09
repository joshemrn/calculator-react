// Firebase configuration and initialization (modular v9)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDpIRLh5_fQFLwikeYDgdreMRUmO03hpK0",
  authDomain: "calculator-email-sign-in.firebaseapp.com",
  projectId: "calculator-email-sign-in",
  storageBucket: "calculator-email-sign-in.firebasestorage.app",
  messagingSenderId: "181160292060",
  appId: "1:181160292060:web:ccd73186876ab5a8214e19",
  measurementId: "G-R16L5NP807"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
