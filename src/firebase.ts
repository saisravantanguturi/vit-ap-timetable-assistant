// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth'; // Import getAuth and GoogleAuthProvider

// Your web app's Firebase configuration (copied from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyBfqODNfEoG2Y56GM6X9DAV3C_PDif9wjQ", // Your actual API key
  authDomain: "vit-ap-timetable-auth.firebaseapp.com",
  projectId: "vit-ap-timetable-auth",
  storageBucket: "vit-ap-timetable-auth.firebasestorage.app",
  messagingSenderId: "537866250629",
  appId: "1:537866250629:web:f368863bb4716bdfd7fcec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();