import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// Dados do seu projeto no Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCqIaL1dMKbu7GzFuA0afs0Dj6awZrQlgM",
  authDomain: "caete-noticias-app.firebaseapp.com",
  projectId: "caete-noticias-app",
  storageBucket: "caete-noticias-app.appspot.com",
  messagingSenderId: "1091097576417",
  appId: "1:1091097576417:web:be2fd9e0cc7b434f54c8a0",
  measurementId: "G-4ZMNV22DND"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);